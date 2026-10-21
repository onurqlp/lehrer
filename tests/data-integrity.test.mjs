// AYDA kayıt güvenilirliği: canlı Google verisine dokunmayan testler.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const code = fs.readFileSync(new URL('../apps-script/Code.gs', import.meta.url), 'utf8');
const context = { Map, Set, Date, Math, JSON, Number, String, Object, Array, RegExp, Error };
vm.createContext(context);
vm.runInContext(code, context, { timeout: 3000 });

test('yoklama yalnızca tüm öğrenciler kaydedilince tamamdır', () => {
  const rows = (...ids) => ids.map(id => ({ OGRENCI_ID: id, KATILIM: 'Geldi' }));
  const complete = context.aydaAttendanceComplete_;
  assert.equal(complete(['s1', 's2'], rows()), false);
  assert.equal(complete(['s1', 's2'], rows('s1')), false);
  assert.equal(complete(['s1', 's2'], rows('s1','s2')), true);
  assert.equal(complete(['s1', 's2'], rows('s1','s1')), false);
  assert.equal(complete(['s1', 's2'], [...rows('s1'), {OGRENCI_ID:'s2',KATILIM:''}]), false);
  assert.equal(complete(['s1','s2'], [...rows('s1','s2'), ...rows('bad')]), false);
});

test('aylık ders hesabında ertelenen ders ayrı, 90 dakika 1,5 saat kabul edilir', () => {
  context.aydaToday_ = () => '2026-11-16';
  context.aydaGroups_ = () => [{id:'g',name:'Grup',status:'Aktif',start:'2026-11-01',end:'2026-11-30'}];
  context.aydaSchedule_ = () => [{groupId:'g',day:'Pazartesi',start:'20:00',end:'21:30'}];
  const history = [
    {'Öğretmen ID':'t','Grup ID':'g','Tarih':'2026-11-02','Durum':'İptal','Gerçekleşen Ders Saati':'00:00'},
    {'Öğretmen ID':'t','Grup ID':'g','Tarih':'2026-11-09','Durum':'Ertelendi','Gerçekleşen Ders Saati':'00:00'},
    {'Öğretmen ID':'t','Grup ID':'g','Tarih':'2026-11-16','Durum':'İşlendi','Gerçekleşen Ders Saati':'01:30'}
  ];
  context.aydaRead_ = sheet => sheet === 'DERS_KAYITLARI' ? history : [];
  context.aydaPrivateHistory_ = () => [];
  context.aydaDate_ = x => x;
  const result = context.aydaTeacherMonthly_({role:'teacher',id:'t'}, {month:'2026-11'});
  assert.equal(result.planned,5);
  assert.equal(result.completed,1);
  assert.equal(result.cancelled,1);
  assert.equal(result.postponed,1);
  assert.equal(result.remaining,3);
  assert.equal(result.hours,1.5);
});

test('eski kayıtlar için geriye dönük alarm başlangıcı sabittir', () => {
  assert.match(code, /const AYDA_TRACKING_START = '2026-10-20';/);
  assert.match(code, /date<AYDA_TRACKING_START/);
});
