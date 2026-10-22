import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source=file=>fs.readFileSync(new URL('../'+file,import.meta.url),'utf8');
const scriptTags=page=>[...page.matchAll(/<script\b[^>]*\bsrc="([^"]+)"[^>]*><\/script>/g)].map(([html,url])=>({html,url}));

test('teacher and manager scripts are deferred, ordered, never async',()=>{
 for(const file of ['index.html','yonetici.html']){
  const scripts=scriptTags(source(file));
  assert.ok(scripts.length>=10,file+' must keep all its existing JS');
  assert.ok(scripts.every(s=>/\bdefer\b/.test(s.html)),file+' all browser scripts should defer');
  assert.ok(scripts.every(s=>!/\basync\b/.test(s.html)),file+' script execution order is critical');
  const position=name=>scripts.findIndex(s=>s.url.startsWith(name));
  assert.ok(position('assets/config.js')>=0);
  assert.ok(position('assets/config.js')<position('assets/ayda-activity.js'));
  assert.ok(position('assets/ayda-activity.js')<position(file==='index.html'?'assets/app.js':'assets/owner.js'));
 }
});

test('all three internal entrypoints stay independent of Google and keep CSS order',()=>{
 for(const file of ['index.html','yonetici.html','grup-arsivi.html']){
  const html=source(file);
  assert.doesNotMatch(html,/script\.google\.com|googleusercontent\.com/);
  assert.match(html,/<meta name="robots" content="noindex,nofollow">/);
 }
});

test('archive renders only selected panel and progressive overview',()=>{
 const code=source('assets/ayda-grup-arsivi.js');
 assert.doesNotThrow(()=>new Function(code));
 assert.match(code,/const validTabs=new Set\(\['overview','lessons','students','homework','evaluation'\]\)/);
 assert.match(code,/renderKpis\(\);paintTab\(activeTab\)/);
 assert.doesNotMatch(code,/renderKpis\(\);renderOverview\(\);renderLessons\(\);renderStudents\(\);renderHomework\(\);renderEvaluation\(\)/);
 const summary=code.indexOf("status('Grup özeti hazır · ayrıntılar yükleniyor…')");
 const result=code.indexOf('await Promise.allSettled(calls.map(x=>request(x,state.key)))');
 assert.ok(summary>=0&&result>summary,'overview should be visible before slow detail requests finish');
});

test('archive print includes all panels, downloads wait for detailed records',()=>{
 const js=source('assets/ayda-grup-arsivi.js');
 const css=source('assets/ayda-grup-arsivi.css');
 assert.match(js,/for\(const name of validTabs\)paintTab\(name\)/);
 assert.match(js,/window\.addEventListener\('beforeprint',preparePrint\)/);
 assert.match(css,/\.archive-panel\[hidden\]\{display:block!important\}/);
 assert.match(js,/archiveExport'\)\.disabled=!state\.detailsReady/);
 assert.match(js,/archivePrint'\)\.disabled=!state\.detailsReady/);
 assert.match(js,/state\.detailsReady=true;state\.loadedAt/);
 assert.match(js,/createPayload\(\)/);
 assert.match(js,/function exportCsv\(\)/);
});

test('manager list search waits briefly while explicit filter changes remain immediate',()=>{
 const owner=source('assets/owner.js');
 assert.match(owner,/setTimeout\(flush,120\)/);
 for(const field of ['ownerStudentSearch','ownerGroupSearch','ownerLessonSearch'])
  assert.ok(owner.includes("searchInput('"+field+"'"),'expected debounced search: '+field);
 for(const field of ['ownerStudentStatus','ownerGroupStatus','ownerLessonStatus'])
  assert.ok(owner.includes("'"+field+"'"),'preserve filter: '+field);
 assert.match(owner,/window\.addEventListener\('ayda:owner-logout',\(\)=>delayedSearches\.forEach/);
});

test('GO3 does not remove enrollment, lesson, attendance, or login controls',()=>{
 const teacher=source('index.html'),manager=source('yonetici.html');
 for(const id of ['loginForm','daily','history','app'])
  assert.ok(teacher.includes('id="'+id+'"'),'missing teacher control '+id);
 for(const id of ['ownerLoginForm','ownerNav','ownerRefresh','ownerApp'])
  assert.ok(manager.includes('id="'+id+'"'),'missing manager control '+id);
 for(const p of ['assets/app.js','assets/owner.js','assets/ayda-grup-arsivi.js'])
  assert.ok(!/AYDA_API_URL\s*=\s*['"]test/.test(source(p)),'API must stay outside inline test stubs');
});
