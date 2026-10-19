import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const load=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('yarım saatlik süreler her iki katmanda da korunur',()=>{
 const page=load('index.html'),daily=load('assets/teacher-daily.js');
 assert.match(page,/<option value="01:30" selected>1 saat 30 dk<\/option>/);
 assert.match(daily,/Array\.from\(\{length:12\}/);
 assert.doesNotMatch(daily,/choices=\[1,2,3,4,5,6\]/);
});
test('yönetici verileri paralel yükler',()=>{
 const owner=load('assets/owner.js');
 assert.match(owner,/Promise\.allSettled\(\[\s*api\('trackingSummary',token\),api\('reminders',token\)/);
});
test('hesap geçişi aynı sekmede ve URL parola taşımadan olur',()=>{
 const sw=load('assets/ayda-account-switch.js');
 assert.match(sw,/\.\/index\.html#todayLessons/);
 assert.match(sw,/\.\/yonetici\.html#overview/);
 assert.match(sw,/overview\?\.\(\)\?\.teachers/);
 assert.doesNotMatch(sw,/localStorage|[?&]key=|passwordTarget/);
});
