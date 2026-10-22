'use strict';

const crypto = require('node:crypto');

function cellText(value) {
  if (value === null || value === undefined) return '';
  if (value instanceof Date || (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/.test(value))) {
    const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Istanbul', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).formatToParts(value instanceof Date ? value : new Date(value));
    const date = Object.fromEntries(parts.map(x => [x.type, x.value]));
    return `${date.year}-${date.month}-${date.day} ${date.hour}:${date.minute}:${date.second}`;
  }
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) return value.slice(0, 10) + ' ' + value.slice(11, 19);
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function createSpreadsheetShim(state) {
  state.sheets ||= {};
  state.properties ||= {};
  const sheets = state.sheets;

  class Range {
    constructor(sheet, row, col, rows = 1, cols = 1) {
      Object.assign(this, { sheet, row, col, rows, cols });
    }
    getValues() {
      return Array.from({ length: this.rows }, (_, ri) =>
        Array.from({ length: this.cols }, (_, ci) => this.sheet._cell(this.row + ri, this.col + ci)));
    }
    getDisplayValues() { return this.getValues().map(row => row.map(cellText)); }
    getValue() { return this.sheet._cell(this.row, this.col); }
    getDisplayValue() { return cellText(this.getValue()); }
    setValue(value) { this.sheet._put(this.row, this.col, value); return this; }
    setValues(values) {
      if (!Array.isArray(values) || values.length !== this.rows || values.some(row => !Array.isArray(row) || row.length !== this.cols)) {
        throw new Error('setValues satır/sütun boyutu eşleşmiyor.');
      }
      values.forEach((row, ri) => row.forEach((value, ci) => this.sheet._put(this.row + ri, this.col + ci, value)));
      return this;
    }
  }

  class Sheet {
    constructor(name, rows) { this.name = name; if (rows) sheets[name] = rows; else if (!sheets[name]) sheets[name] = []; }
    getName() { return this.name; }
    setName(name) {
      if (sheets[name] && name !== this.name) throw new Error('Bu adla sekme zaten var.');
      delete sheets[this.name]; this.name = name; sheets[name] = this.rows(); return this;
    }
    rows() { return sheets[this.name]; }
    getLastRow() { return this.rows().length; }
    getLastColumn() { return Math.max(0, ...this.rows().map(row => row.length)); }
    getMaxColumns() { return Math.max(26, this.getLastColumn()); }
    getDataRange() { return new Range(this, 1, 1, this.getLastRow(), this.getLastColumn()); }
    getRange(row, col, rows = 1, cols = 1) { return new Range(this, row, col, rows, cols); }
    appendRow(row) { this.rows().push([...row]); return this; }
    deleteRow(row) { if (row >= 1 && row <= this.getLastRow()) this.rows().splice(row - 1, 1); return this; }
    deleteRows(row, count) { this.rows().splice(row - 1, count); return this; }
    insertColumnsAfter(after, count) {
      this.rows().forEach(row => { for (let i = 0; i < count; i++) row.splice(after, 0, ''); }); return this;
    }
    setFrozenRows() { return this; }
    _cell(row, col) { return this.rows()[row - 1]?.[col - 1] ?? ''; }
    _put(row, col, value) {
      while (this.rows().length < row) this.rows().push([]);
      const record = this.rows()[row - 1];
      while (record.length < col) record.push('');
      record[col - 1] = value ?? '';
    }
  }

  class Book {
    getSheetByName(name) { return sheets[name] ? new Sheet(name) : null; }
    getSheets() { return Object.keys(sheets).map(name => new Sheet(name)); }
    insertSheet(name) {
      if (sheets[name]) throw new Error('Bu adla sekme zaten var.');
      sheets[name] = []; return new Sheet(name);
    }
  }

  const props = {
    getProperty: key => state.properties[key] ?? null,
    getProperties: () => ({ ...state.properties }),
    setProperty: (key, value) => (state.properties[key] = String(value), props),
    setProperties: values => Object.assign(state.properties, Object.fromEntries(Object.entries(values).map(([k, v]) => [k, String(v)]))),
    deleteProperty: key => { const old = state.properties[key] ?? null; delete state.properties[key]; return old; }
  };
  const spreadsheet = {
    openById: () => new Book(),
    create: name => {
      let target = name;
      if (sheets[target]) target = `${name} (beta)`;
      sheets[target] = [];
      return { getId: () => `beta-${target}`, getSheetByName: n => sheets[n] ? new Sheet(n) : null,
        getSheets: () => Object.keys(sheets).map(n => new Sheet(n)), insertSheet: n => { sheets[n] = []; return new Sheet(n); } };
    },
    flush: () => {}
  };
  return {
    SpreadsheetApp: spreadsheet,
    PropertiesService: { getScriptProperties: () => props },
    Utilities: {
      DigestAlgorithm: { SHA_256: 'sha256' }, Charset: { UTF_8: 'utf8' },
      computeDigest: (algorithm, value) => [...crypto.createHash(algorithm).update(String(value), 'utf8').digest()].map(n => n > 127 ? n - 256 : n),
      getUuid: () => crypto.randomUUID(),
      formatDate: (value, timezone, pattern) => {
        const d = value instanceof Date ? value : new Date(value);
        const parts = new Intl.DateTimeFormat('en-CA', { timeZone: timezone || 'UTC', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).formatToParts(d);
        const p = Object.fromEntries(parts.map(x => [x.type, x.value]));
        return pattern.replace('yyyy', p.year).replace('MM', p.month).replace('dd', p.day).replace('HH', p.hour).replace('mm', p.minute).replace('ss', p.second);
      },
      base64DecodeWebSafe: input => Buffer.from(String(input).replace(/-/g, '+').replace(/_/g, '/'), 'base64'),
      newBlob: bytes => ({ getDataAsString: charset => Buffer.from(bytes).toString(charset || 'utf8') })
    },
    LockService: { getScriptLock: () => ({ waitLock: () => {}, releaseLock: () => {} }) },
    ContentService: {
      MimeType: { JAVASCRIPT: 'application/javascript', TEXT: 'text/plain' },
      createTextOutput: value => ({ text: String(value), mimeType: 'text/plain', setMimeType(type) { this.mimeType = type; return this; } })
    },
    Logger: { log: () => {} }
  };
}

module.exports = { createSpreadsheetShim, cellText };
