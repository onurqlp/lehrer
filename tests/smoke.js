/* AYDA Lehrer regression smoke tests. Run: node tests/smoke.js
 * Tests are read-only, never call Google and never create/change live records. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
let count=0;
const file=p=>fs.readFileSync(path.join(root,p),'utf8');
function check(name,fn){try{fn();count++;process.stdout.write('PASS '+name+'\n');}catch(error){process.stderr.write('FAIL '+name+': '+error.message+'\n');process.exitCode=1;}}
const pages=['index.html','yonetici.html','bilgi-formu/index.html','bilgi-formu/yonetim.html','formlar/index.html','formlar/memnuniyet.html'];
const js=[
 'assets/config.js','assets/ayda-activity.js','assets/app.js','assets/attendance-preview.js',
 'assets/admin-menu.js','assets/student-notes.js','assets/teacher-tracking.js',
 'assets/ayda-workflow.js','assets/teacher-resources.js','assets/teacher-daily.js',
 'assets/homework-whatsapp.js','assets/ayda-experience.js','assets/ayda-teacher-focus.js',
 'assets/ayda-teacher-monitor.js','assets/ayda-health-editors.js','assets/ayda-admin-health-embed.js',
 'assets/ayda-admin-messaging.js','assets/owner-messaging.js','assets/ayda-admin-forms.js',
 'assets/owner.js','assets/owner-data-control.js','assets/owner-homework.js'
];
const backend=file('apps-script/Code.gs'),app=file('assets/app.js'),attendance=file('assets/attendance-preview.js');
check('Every referenced JS and CSS asset exists',()=>{
 for(const page of pages){const html=file(page);
  for(const m of html.matchAll(/<(?:script|link)\b[^>]*(?:src|href)="([^"]+)"[^>]*>/g)){
   const url=m[1].split(/[?#]/)[0];
   if(!url.startsWith('./')&&!url.startsWith('../')&&!url.startsWith('assets/'))continue;
   const full=path.resolve(root,path.dirname(page),url);
   assert.ok(full.startsWith(root+path.sep)&&fs.existsSync(full),page+' => '+url);
  }
 }
});
check('Every shipped JavaScript and backend file parses',()=>{
 for(const p of [...js,'apps-script/Code.gs'])new vm.Script(file(p),{filename:p});
 for(const p of pages)for(const m of file(p).matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g))
  new vm.Script(m[1],{filename:p+' inline'});
});
check('All statically called AJAX actions exist in Google dispatcher',()=>{
 const supported=new Set([...backend.matchAll(/action==='([^']+)'/g)].map(m=>m[1]));
 for(const p of js){
  const source=file(p);
  for(const re of [/\bjsonp\(\s*['"]([^'"]+)['"]/g,/\bapi\(\s*['"]([^'"]+)['"]/g,/\badminAction\(\s*['"]([^'"]+)['"]/g])
   for(const m of source.matchAll(re))assert.ok(supported.has(m[1]),p+' calls missing action '+m[1]);
 }
});
check('Admin student list uses read-only transport',()=>{
 assert.match(app,/const readOnly=\[[^\]]*'adminStudents'/);
});
check('Every hour selection is a whole hour, 1 through 6',()=>{
 const html=file('index.html');
 const m=html.match(/<select id="actual">([\s\S]*?)<\/select>/);
 assert.ok(m,'lesson-duration selector missing');
 assert.deepEqual([...m[1].matchAll(/value="([^"]+)"/g)].map(x=>x[1]),['01:00','02:00','03:00','04:00','05:00','06:00']);
 assert.match(file('assets/teacher-daily.js'),/Array\.from\(\{length:6\}/);
 assert.equal((backend.match(/\/\^0\[1-6\]:00\$\//g)||[]).length,3);
});
check('Google backend has lesson tracking, homework and roster actions',()=>{
 for(const action of ['save','saveAttendance','teacherAddStudent','studentRoster','confirmHomeworkShare','lessonHomework','updateReport'])
 assert.ok(backend.includes("action==='"+action+"'"),action);
});
check('Private save guards duplicate submissions and delayed acknowledgements',()=>{
 assert.match(app,/aydaFindPrivateLesson/);
 assert.match(app,/aydaUncertainPrivateSave/);
 assert.match(app,/unknownCommit/);
 assert.match(app,/AYDA_OZEL_DERS_CIZELGESI/);
});
check('Teacher removal is shared-ID-aware and history-preserving',()=>{
 assert.match(backend,/function aydaRemoveTeacher_\(/);
 assert.match(backend,/otherActive=av\.filter/);
 assert.match(backend,/historyPreserved:true/);
});
check('All five operational pages install the shared activity indicator',()=>{
 for(const p of ['index.html','yonetici.html','bilgi-formu/index.html','bilgi-formu/yonetim.html','formlar/memnuniyet.html'])
 assert.ok(file(p).includes('ayda-activity.js'),p);
});
check('No obsolete Apps Script redeployment instruction remains in teacher workflow',()=>{
 for(const p of ['assets/app.js','assets/teacher-daily.js','assets/teacher-tracking.js'])
 assert.ok(!/2026-10-16\.5|2026-10-16\.7 sürümünü|30 dakikalık aralıklarla ders süresi/.test(file(p)),p);
});
check('Embedded admin health stays on the same-origin session bridge',()=>{
 assert.match(file('assets/ayda-admin-health-embed.js'),/sendExistingSession/);
 assert.match(file('assets/owner.js'),/embeddedHealth/);
});
process.stdout.write('\nAYDA smoke: '+count+' checks complete'+(process.exitCode?' (FAILED)':' (PASSED)')+'\n');
