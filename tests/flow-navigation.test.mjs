import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const load=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('ders süreleri mevcut 1–6 tam saat kuralına uyar',()=>{
 const page=load('index.html'),server=load('apps-script/Code.gs');
 assert.match(page,/<select id="actual">[\s\S]*?value="02:00" selected/);
 assert.match(server,/0\[1-6\]:00/);
 assert.doesNotMatch(page,/<option value="01:30"/);
});

test('yönetici önizlemesi için analizler paralel yüklenir',()=>{
 const owner=load('assets/owner.js');
 assert.match(owner,/Promise\.allSettled\(\[\s*api\('trackingSummary',token\),api\('reminders',token\)/);
 assert.match(owner,/loadTracking\(\)\.then\(/);
});

test('hesaplar URL ile şifre paylaşılmadan geçiş yapar',()=>{
 const sw=load('assets/ayda-account-switch.js');
 assert.match(sw,/\.\/index\.html#ayarlar/);
 assert.match(sw,/\.\/yonetici\.html#overview/);
 assert.match(sw,/overview\?\.\(\)\?\.teachers/);
 assert.doesNotMatch(sw,/[?&]key=|passwordTarget/);
});

test('öğretmen telefonu kaydı güncel Google API gerektirir',()=>{
 const page=load('index.html'),app=load('assets/app.js'),api=load('apps-script/Code.gs');
 assert.match(page,/id="newTeacherPhone"/);
 assert.match(page,/id="aydaTeacherEditForm"/);
 assert.match(app,/status\.version\|\|''/);
 assert.match(api,/function aydaAdminUpdateTeacher_/);
 assert.match(api,/action==='updateTeacher'/);
 assert.match(api,/OGRETMEN_REHBERI/);
});

test('öğrenci telefonları akademik yönetici formundan çıkarılmıştır',()=>{
 const page=load('index.html'),api=load('apps-script/Code.gs');
 assert.doesNotMatch(page,/id="adminStudentPhone"/);
 assert.doesNotMatch(page,/id="adminStudentParentPhone"/);
 assert.match(api,/return \{students:\[\],teachers,missingStudentPhones:0,scope:'admin'\}/);
 assert.match(page,/bilgi-formu\//);
});
