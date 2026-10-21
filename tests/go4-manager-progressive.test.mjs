import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const src=fs.readFileSync(new URL('../assets/owner.js',import.meta.url),'utf8');
const start=src.indexOf(' async function loadTracking(){');
const end=src.indexOf(' async function refresh(){',start);
assert.ok(start>=0&&end>start,'GO4 owner loading function exists');
const loadingSource=src.slice(start,end);

function fixture(){
 const calls=[],events=[],paints=[];
 const make=()=>{let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});return {promise,resolve,reject};};
 const api=(action,key)=>{const p=make();calls.push({action,key,...p});return p.promise;};
 const prefix=[
  '(function(){',
  "let token='admin-test',ownerDataGeneration=0,tracking=null,reminders=null,lessonHomework=null,homeworkState='idle',overview={teachers:[]},contactDirectory=null;",
  'const renderAll=()=>paints.push({tracking,reminders,lessonHomework,homeworkState});',
  'const errorMessage=()=>{};',
  'const window={dispatchEvent:ev=>events.push(ev.type)};',
  'class Event{constructor(type){this.type=type;}}'
 ].join('\n');
 const suffix=[
  'return {loadTracking,logout:()=>{ownerDataGeneration++;token="";tracking=null;reminders=null;lessonHomework=null;},',
  'state:()=>({token,tracking,reminders,lessonHomework,homeworkState,ownerDataGeneration})};',
  '})()'
 ].join('\n');
 const methods=vm.runInNewContext(prefix+loadingSource+suffix,{api,events,paints,Promise,Error,Set,Map,Date,Math,String,Number,Array,JSON});
 return {calls,events,paints,...methods};
}
const tick=async()=>{for(let i=0;i<5;i++)await Promise.resolve();};
function finishCore(calls){
 calls.find(c=>c.action==='trackingSummary').resolve({scope:'all',alerts:[{studentId:'s1'}]});
 calls.find(c=>c.action==='reminders').resolve({items:[{date:'2026-10-21',type:'report'}],total:1});
}

test('alerts paint before slow homework and a later detail update appears',async()=>{
 const f=fixture(),load=f.loadTracking();
 assert.deepEqual(f.calls.map(c=>c.action),['lessonHomework','trackingSummary','reminders']);
 finishCore(f.calls);
 assert.equal(await load,true);
 assert.equal(f.paints.length,1);
 assert.equal(f.paints[0].tracking.scope,'all');
 assert.equal(f.paints[0].reminders.total,1);
 assert.equal(f.paints[0].homeworkState,'loading');
 assert.ok(f.events.includes('ayda:owner-data-ready'));
 f.calls[0].resolve({items:[{groupId:'g1',text:'Ödev'}]});
 await tick();
 assert.equal(f.paints.length,2);
 assert.equal(f.paints[1].homeworkState,'ready');
 assert.equal(f.events.filter(x=>x==='ayda:owner-details-ready').length,1);
});

test('late Google responses after logout are discarded without painting',async()=>{
 const f=fixture(),load=f.loadTracking();
 f.logout();
 finishCore(f.calls);
 f.calls[0].resolve({items:[{groupId:'private'}]});
 assert.equal(await load,false);
 await tick();
 assert.equal(f.paints.length,0);
 assert.equal(f.events.length,0);
 assert.equal(f.state().lessonHomework,null);
 assert.equal(f.state().tracking,null);
});

test('a new refresh invalidates older in-flight requests on the same login',async()=>{
 const f=fixture(),old=f.loadTracking(),latest=f.loadTracking();
 const first=f.calls.slice(0,3),second=f.calls.slice(3);
 finishCore(first);
 first[0].resolve({items:[]});
 assert.equal(await old,false);
 second.find(x=>x.action==='trackingSummary').resolve({scope:'all',alerts:[{studentId:'fresh'}]});
 second.find(x=>x.action==='reminders').resolve({items:[],total:0});
 assert.equal(await latest,true);
 assert.equal(f.state().tracking.alerts[0].studentId,'fresh');
 assert.equal(f.paints.length,1);
 second.find(x=>x.action==='lessonHomework').resolve({items:[]});
 await tick();
});

test('homework network failure does not suppress missing lesson reminders',async()=>{
 const f=fixture(),load=f.loadTracking();
 f.calls[0].reject(Error('network interrupted'));
 finishCore(f.calls);
 assert.equal(await load,true);
 assert.equal(f.state().reminders.reports,1);
 assert.equal(f.state().homeworkState,'error');
 assert.ok(f.events.includes('ayda:owner-data-ready'));
});

test('existing role, manual login and data permission protections remain',()=>{
 assert.match(src,/function activate\(next\)/);
 assert.match(src,/if\(!\['admin','viewer'\]\.includes\(result\?\.user\?\.role\)\)/);
 assert.match(src,/api\('overview',provided\)/);
 assert.match(src,/ownerDataGeneration\+\+;homeworkState='idle';if\(isAdmin\(\)\)/);
 assert.match(src,/window\.dispatchEvent\(new Event\('ayda:owner-data-ready'\)\)/);
 assert.doesNotMatch(src,/CacheService\.getScriptCache\(/);
});
