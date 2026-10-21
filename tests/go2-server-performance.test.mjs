import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const code=fs.readFileSync(new URL('../apps-script/Code.gs',import.meta.url),'utf8');
const context={Map,Set,Date,Math,JSON,Number,String,Object,Array,RegExp,Error};
vm.createContext(context);
vm.runInContext(code,context,{timeout:3000});

const rows=[['Kullanıcı ID','Kullanıcı Adı','Öğretmen ID','Rol','Durum'],
 ['U1','Ayşe Öğretmen','T1','Öğretmen','Aktif'],['U2','Kapalı Hoca','T2','Öğretmen','Pasif']];
let reading=0,opening=0,propertiesReading=0;
context.SpreadsheetApp={
 openById:()=>{opening++;return {
  getSheetByName:()=>({
   getDataRange:()=>({getDisplayValues:()=>{reading++;return rows.map(row=>row.slice());}})
  })
 }}
};
context.PropertiesService={getScriptProperties:()=>({
 getProperties:()=>{propertiesReading++;return {'AYDA_ADMIN_HASH':'hash:admin','AYDA_VIEWER_HASH':'hash:viewer','AYDA_GIRIS_U1':'hash:teacher','AYDA_GIRIS_U2':'hash:inactive'};},
 getProperty:()=>{throw Error('Teacher login should use getProperties, not per-user getProperty');}
})};
context.aydaHash_=key=>'hash:'+key;
context.Utilities={
 formatDate:()=> '2026-10-21',
 base64DecodeWebSafe:()=>[],
 newBlob:()=>({getDataAsString:()=>JSON.stringify({id:'g'})})
};
context.ContentService={
 MimeType:{TEXT:'text',JAVASCRIPT:'javascript'},
 createTextOutput:t=>({text:t,setMimeType:function(){return this;}})
};
const readResponse=(action,callback='ayda_cb_go2test')=>{
 const result=context.doGet({parameter:{action,key:'teacher',callback,payload:'e30'}});
 assert.match(result.text,/^ayda_cb_go2test\(/);
 return JSON.parse(result.text.slice(callback.length+1,-2));
};

test('teacher, admin and viewer auth stay identical while property lookup is batched',()=>{
 reading=0;propertiesReading=0;
 assert.equal(context.aydaAuth_('teacher').id,'T1');
 assert.equal(context.aydaAuth_('admin').role,'admin');
 assert.equal(context.aydaAuth_('viewer').role,'viewer');
 assert.throws(()=>context.aydaAuth_('inactive'),/geçersiz/);
 assert.throws(()=>context.aydaAuth_('wrong'),/geçersiz/);
 assert.equal(propertiesReading,5,'one getProperties call per login, even with multiple teacher accounts');
});

test('a single overview request reads a repeated sheet only once and copies results',()=>{
 context.aydaAuth_=()=>({role:'admin',id:'ADMIN'});
 context.aydaOverview_=()=>{
  const first=context.aydaRead_('KULLANICILAR');
  first[0]['Kullanıcı Adı']='temporary local edit';
  const second=context.aydaRead_('KULLANICILAR');
  return {first:first[0]['Kullanıcı Adı'],second:second[0]['Kullanıcı Adı']};
 };
 reading=0;opening=0;
 const a=readResponse('overview');
 assert.equal(a.data.first,'temporary local edit');
 assert.equal(a.data.second,'Ayşe Öğretmen');
 assert.equal(reading,1,'read-only request reuses a single Sheets read');
 assert.equal(opening,1);
 rows[1][1]='Yeni İsim';
 const b=readResponse('overview');
 assert.equal(b.data.second,'Yeni İsim','later requests must see updated source');
 assert.equal(reading,2,'new request makes a new Sheets read');
 assert.equal(opening,2,'workbook opens fresh for each API request');
 rows[1][1]='Ayşe Öğretmen';
});

test('a mutation within a write action must never see cached sheet state',()=>{
 reading=0;
 context.aydaAdminSetGroup_=()=>{
  const before=context.aydaRead_('KULLANICILAR')[0]['Kullanıcı Adı'];
  rows[1][1]='Kaydedildi';
  const after=context.aydaRead_('KULLANICILAR')[0]['Kullanıcı Adı'];
  return {before,after};
 };
 const r=readResponse('updateGroup');
 assert.equal(r.data.before,'Ayşe Öğretmen');
 assert.equal(r.data.after,'Kaydedildi','written values must be read immediately');
 assert.equal(reading,2);
 rows[1][1]='Ayşe Öğretmen';
});

test('GO2 marker identifies deployment while preserving teacher-phone compatibility version',()=>{
 const ping=readResponse('ping');
 assert.equal(ping.data.version,'2026-10-21.9');
 assert.equal(ping.data.performance,'GO2-request-read-memo-v1');
 assert.equal(ping.data.trackingStart,'2026-10-20');
});

test('read memo is allowed only for explicitly listed read actions',()=>{
 assert.match(code,/if\(AYDA_READ_ACTIONS_\.has\(action\)\)AYDA_READ_MEMO_=new Map\(\)/);
 assert.doesNotMatch(code,/'save'[^;]*AYDA_READ_MEMO_/);
 assert.match(code,/AYDA_READ_MEMO_=null;AYDA_OPEN_DB_=null;/);
 assert.doesNotMatch(code,/CacheService\.getScriptCache\(/);
});
