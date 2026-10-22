'use strict';

const crypto = require('node:crypto');
const vm = require('node:vm');
const { Pool } = require('pg');
const { createSpreadsheetShim } = require('./gas-compat.cjs');
const gasSourceBase64 = require('./code-source.cjs');

const pool = new Pool({
  connectionString: process.env.LEHRER_DB_POSTGRES_URL || process.env.LEHRER_DB_DATABASE_URL || process.env.LEHRER_DB_POSTGRES_URL_NON_POOLING || process.env.LEHRER_DB_DATABASE_URL_UNPOOLED,
  max: 1,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 10000
});
const gasCode = Buffer.from(gasSourceBase64, 'base64').toString('utf8');

async function ensureStorage() {
  if (!(process.env.LEHRER_DB_POSTGRES_URL || process.env.LEHRER_DB_DATABASE_URL || process.env.LEHRER_DB_POSTGRES_URL_NON_POOLING || process.env.LEHRER_DB_DATABASE_URL_UNPOOLED)) throw new Error('Beta veritabanı bağlantısı ayarlanmamış.');
  await pool.query(`CREATE TABLE IF NOT EXISTS ayda_beta_runtime (
    singleton boolean PRIMARY KEY DEFAULT true CHECK (singleton),
    state jsonb NOT NULL,
    seeded_at timestamptz,
    updated_at timestamptz NOT NULL DEFAULT now()
  )`);
  await pool.query(`INSERT INTO ayda_beta_runtime (singleton, state)
    VALUES (true, $1::jsonb) ON CONFLICT (singleton) DO NOTHING`, [JSON.stringify({ sheets: {}, properties: {} })]);
}

function sendJson(res, status, data) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.end(JSON.stringify(data));
}

function safeEqual(a, b) {
  const left = Buffer.from(String(a || ''));
  const right = Buffer.from(String(b || ''));
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

function makeGasContext(state) {
  const shim = createSpreadsheetShim(state);
  const context = vm.createContext(shim);
  vm.runInContext(gasCode, context, { filename: 'apps-script/Code.gs', timeout: 3000 });
  return context;
}

async function withLockedState(fn) {
  await ensureStorage();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await client.query('SELECT state, seeded_at FROM ayda_beta_runtime WHERE singleton = true FOR UPDATE');
    const state = result.rows[0]?.state || { sheets: {}, properties: {} };
    state.sheets ||= {};
    state.properties ||= {};
    const adminKey = process.env.AYDA_BETA_ADMIN_KEY;
    if (adminKey && !state.properties.AYDA_ADMIN_HASH) {
      state.properties.AYDA_ADMIN_HASH = crypto.createHash('sha256').update(adminKey, 'utf8').digest('hex');
    }
    const returned = await fn({ client, state, seededAt: result.rows[0]?.seeded_at || null });
    await client.query('UPDATE ayda_beta_runtime SET state = $1::jsonb, updated_at = now() WHERE singleton = true', [JSON.stringify(state)]);
    await client.query('COMMIT');
    return returned;
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}

module.exports = async (req, res) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  try {
    const pathname = new URL(req.url, 'https://beta.invalid').pathname;
    if (pathname === '/api/seed' || (pathname === '/api' && req.method === 'POST')) {
      if (req.method !== 'POST' || !process.env.AYDA_BETA_SEED_KEY ||
          !safeEqual(req.headers.authorization?.replace(/^Bearer\s+/i, ''), process.env.AYDA_BETA_SEED_KEY)) {
        return sendJson(res, 404, { ok: false, error: 'Bulunamadı.' });
      }
      let raw = '';
      for await (const chunk of req) {
        raw += chunk;
        if (raw.length > 4_000_000) return sendJson(res, 413, { ok: false, error: 'İçe aktarma dosyası çok büyük.' });
      }
      const input = JSON.parse(raw);
      if (!input || !input.sheets || typeof input.sheets !== 'object' || Array.isArray(input.sheets)) {
        return sendJson(res, 400, { ok: false, error: 'Excel çalışma sayfaları bulunamadı.' });
      }
      const stats = await withLockedState(async ({ client, state, seededAt }) => {
        if (seededAt) throw new Error('Beta Excel verisi daha önce yüklenmiş. Mevcut beta kayıtları korunuyor.');
        const sheets = {};
        for (const [name, rows] of Object.entries(input.sheets)) {
          if (!Array.isArray(rows) || rows.some(row => !Array.isArray(row))) throw new Error(`Geçersiz Excel sayfası: ${name}`);
          sheets[name] = rows;
        }
        state.sheets = sheets;
        state.properties ||= {};
        if (process.env.AYDA_BETA_ADMIN_KEY) {
          state.properties.AYDA_ADMIN_HASH = crypto.createHash('sha256').update(process.env.AYDA_BETA_ADMIN_KEY, 'utf8').digest('hex');
        }
        await client.query('UPDATE ayda_beta_runtime SET seeded_at = now() WHERE singleton = true');
        return Object.fromEntries(Object.entries(sheets).map(([name, rows]) => [name, Math.max(0, rows.length - 1)]));
      });
      return sendJson(res, 200, { ok: true, source: 'AYDA_Lehrer_Gercek_Sistem_Verileri_2026-10-20.xlsx', counts: stats });
    }
    if (req.method !== 'GET') return sendJson(res, 405, { ok: false, error: 'Yalnızca GET destekleniyor.' });
    const result = await withLockedState(async ({ state }) => {
      const context = makeGasContext(state);
      const parameter = Object.fromEntries(new URL(req.url, 'https://beta.invalid').searchParams.entries());
      const output = context.doGet({ parameter });
      return output?.text || '';
    });
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    res.end(result);
  } catch (error) {
    console.error('[AYDA beta runtime]', error?.name || 'Error', String(error?.message || error || 'Unknown').slice(0, 240));
    const text = String(error?.message || error || 'Sunucu hatası').slice(0, 500);
    const callback = String(new URL(req.url, 'https://beta.invalid').searchParams.get('callback') || '');
    if (/^ayda_cb_[A-Za-z0-9_]{1,64}$/.test(callback)) {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
      return res.end(`${callback}(${JSON.stringify({ ok: false, error: text })});`);
    }
    return sendJson(res, 500, { ok: false, error: text });
  }
};

module.exports.config = { maxDuration: 60 };
