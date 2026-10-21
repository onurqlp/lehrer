import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const src=fs.readFileSync(new URL('../assets/attendance-preview.js',import.meta.url),'utf8');
const focus=fs.readFileSync(new URL('../assets/ayda-teacher-focus.js',import.meta.url),'utf8');
const app=fs.readFileSync(new URL('../assets/app.js',import.meta.url),'utf8');
const start=src.indexOf(' function syncRoster(preserveMarked=false){');
const finish=src.indexOf(' window.AYDA_ATTENDANCE={',start);
assert.ok(start>=0&&finish>start,'GO5 load function must exist');
const code=src.slice(start,finish);

function fixture(role='teacher'){
 const calls=[],draws=[],requests=[];
 const jsonp=action=>{
  const request={action};
  request.promise=new Promise((resolve,reject)=>{request.resolve=resolve;request.reject=reject;});
  calls.push(action);requests.push(request);return request.promise;
 };
 const ctx={jsonp,calls,draws,Promise,Map,Error,String,Array,Object};
 const factory=[
  '(()=>{',
  'let data={user:{role:"'+role+'"}};',
  "const document={body:{dataset:{aydaTeacherView:'home'}}};",
  'let roster=new Map(),rows=new Map(),demo=false,homeworkEnabled=false,activeGroup="",activeDate="",liveRoster=false,rosterLoading=false,rosterError="";',
  'let rosterRequest=0,rosterFlight=null,rosterFetchedThisLogin=false;',
  'const byId=()=>({checked:false});',
  'const renderRoster=()=>draws.push({liveRoster,rosterLoading,rosterError});',
  code,
  'return {go:page=>{document.body.dataset.aydaTeacherView=page;loadTeacherRosterWhenNeeded();},syncRoster,',
  'invalidate:()=>{rosterRequest++;rosterFlight=null;rosterFetchedThisLogin=false;roster=new Map();liveRoster=false;rosterLoading=false;},',
  'state:()=>({liveRoster,rosterLoading,rosterFetchedThisLogin,rosterError,roster:[...roster.entries()],rows:[...rows.entries()]})};',
  '})()'
 ].join('\n');
 const harness=vm.runInNewContext(factory,ctx,{timeout:2000});
 return {...harness,calls,requests,draws};
}
const tick=async()=>{for(let i=0;i<10;i++)await Promise.resolve();};

test('teacher dashboard skips unnecessary Google studentRoster; daily opens it once',async()=>{
 const f=fixture();
 f.go('home');
 f.go('history');
 f.go('students');
 assert.equal(f.calls.length,0,'main dashboard and other pages should avoid attendance roster');
 f.go('daily');
 assert.deepEqual(f.calls,['studentRoster']);
 f.go('daily');
 assert.equal(f.calls.length,1,'duplicate daily opens must not start duplicate requests');
 f.requests[0].resolve({students:[{id:'S1',groupId:'G1',name:'Öğrenci 1'}]});
 await tick();
 assert.equal(f.state().liveRoster,true);
 assert.equal(f.state().rosterFetchedThisLogin,true);
 assert.equal(f.state().roster[0][1][0].name,'Öğrenci 1');
 f.go('home');f.go('daily');
 assert.equal(f.calls.length,1,'already loaded roster remains available for the same login');
});

test('admin roster still loads on demand through the original API',async()=>{
 const f=fixture('admin');
 const loading=f.syncRoster();
 assert.deepEqual(f.calls,['studentRoster']);
 f.requests[0].resolve({students:[]});
 await loading;
 assert.equal(f.state().liveRoster,true,'an empty live list is still a confirmed result');
});

test('old student data arriving after logout cannot repopulate attendance',async()=>{
 const f=fixture(),p=f.syncRoster();
 f.invalidate();
 f.requests[0].resolve({students:[{id:'S-private',groupId:'G1',name:'Eski Kayıt'}]});
 await p;
 assert.equal(f.state().liveRoster,false);
 assert.equal(f.state().roster.length,0);
 assert.equal(f.state().rosterFetchedThisLogin,false);
});

test('a failed list is not marked as connected and can be retried from daily',async()=>{
 const f=fixture();f.go('daily');
 f.requests[0].reject(Error('API zaman aşımı'));
 await tick();
 assert.equal(f.state().liveRoster,false);
 assert.match(f.state().rosterError,/API zaman aşımı/);
 f.go('daily');
 assert.equal(f.calls.length,2,'failed fetch must not be cached for the login');
 f.requests[1].resolve({students:[{id:'S2',groupId:'G2',name:'Öğrenci 2'}]});
 await tick();assert.equal(f.state().liveRoster,true);
});

test('attendance save remains blocked while roster loads or fails',()=>{
 assert.match(src,/if\(rosterLoading&&statusAvailable\(\)\)throw Error/);
 assert.match(src,/if\(!liveRoster\)throw Error/);
 assert.match(src,/if\(marked!==students\.length\)throw Error/);
 assert.match(src,/return \{homeworkEnabled,attendance:students\.map/);
 assert.match(src,/await syncRoster\(true\)/);
 assert.match(app,/saved\.trackingSaved===true&&saved\.attendanceCount===tracking\.attendance\.length/);
});

test('GO5 retains teacher navigation event and admin login eager refresh',()=>{
 assert.match(focus,/new CustomEvent\('ayda:teacher-page-open',\{detail:\{page\}\}\)/);
 assert.match(src,/if\(event\.detail\?\.page==='daily'\)loadTeacherRosterWhenNeeded\(\)/);
 assert.match(src,/if\(data\?\.user\?\.role==='admin'\)void syncRoster\(\)/);
 assert.match(src,/else loadTeacherRosterWhenNeeded\(\)/);
 assert.match(src,/rosterRequest\+\+;rosterFlight=null;rosterFetchedThisLogin=false/);
});
