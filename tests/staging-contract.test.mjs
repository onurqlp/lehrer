import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const file=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
test('both primary pages retain well-formed head and original menu landmarks',()=>{
 const teacher=file('index.html'),owner=file('yonetici.html');
 for(const html of [teacher,owner]){
  assert.equal((html.match(/<head>/g)||[]).length,1);
  assert.equal((html.match(/<\\/head>/g)||[]).length,1);
  assert.match(html,/test-readonly\\.js/);
  assert.match(html,/ayda-speed\\.js/);
 }
 assert.match(teacher,/id="loginForm"/);
 assert.match(teacher,/id="reportForm"/);
 assert.match(owner,/id="ownerLogin"/);
 assert.match(owner,/id="ownerApp"/);
});
test('test-side write protection executes before app scripts',()=>{
 for(const path of ['index.html','yonetici.html']){
  const doc=file(path);
  const protectedAt=doc.indexOf('test-readonly.js');
  const speedAt=doc.indexOf('ayda-speed.js');
  const apiAt=doc.indexOf(path==='index.html'?'assets/app.js':'assets/owner.js');
  assert.ok(protectedAt>=0 && protectedAt<speedAt && speedAt<apiAt);
 }
});
test('write actions remain explicit, no Apps Script source alteration needed',()=>{
 const teacher=file('assets/app.js'),owner=file('assets/owner.js');
 assert.match(teacher,/jsonpOriginal/);
 assert.match(owner,/apiOriginal/);
 assert.match(file('assets/test-readonly.js'),/Production write blocked/);
 assert.match(file('assets/ayda-speed.js'),/Writes must never be cached/);
});
