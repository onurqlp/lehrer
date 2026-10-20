import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../assets/ayda-speed.js',import.meta.url),'utf8');
function setup(){
 const events=new Map(),docEvents=new Map();
 const window={addEventListener:(e,f)=>events.set(e,f)};
 const document={addEventListener:(e,f)=>docEvents.set(e,f)};
 vm.runInNewContext(source,{window,document,Date,JSON,Promise,TypeError,Object,Map,String,RegExp,Number,structuredClone},{filename:'ayda-speed.js'});
 return {api:window.AYDA_SPEED,events,docEvents};
}
test('concurrent identical reads send one Google request',async()=>{
 const {api}=setup();let calls=0;const send=async()=>{calls++;return {groups:[1]}};
 const [a,b]=await Promise.all([api.run('overview','teacher-one',{},send),api.run('overview','teacher-one',{},send)]);
 assert.equal(calls,1);assert.deepEqual(a,b);assert.equal(api.stats().joined,1);
});
test('cached reads are cloned and partitioned by user',async()=>{
 const {api}=setup();let calls=0;const send=async()=>({groups:[++calls]});
 const a=await api.run('overview','teacher-one',{},send);a.groups.push('mutated');
 const b=await api.run('overview','teacher-one',{},send);
 assert.deepEqual(b.groups,[1]);
 const c=await api.run('overview','teacher-two',{},send);
 assert.deepEqual(c.groups,[2]);assert.equal(api.stats().reused,1);
});
test('writes never dedupe or cache and invalidate reads',async()=>{
 const {api}=setup();let n=0;const read=()=>Promise.resolve({version:++n});
 await api.run('overview','admin',{},read);
 await api.run('save','admin',{payload:'abc'},async()=>({saved:true}));
 const next=await api.run('overview','admin',{},read);assert.equal(next.version,2);
 let writes=0;
 await Promise.all([api.run('save','admin',{},async()=>++writes),api.run('save','admin',{},async()=>++writes)]);
 assert.equal(writes,2);
});
test('errors are not cached and later requests can retry',async()=>{
 const {api}=setup();let tries=0;
 await assert.rejects(api.run('overview','teacher',{},async()=>{tries++;throw Error('network');}),/network/);
 await api.run('overview','teacher',{},async()=>{tries++;return {ok:true};});
 assert.equal(tries,2);
});
test('writes invalidate reads that started before the write',async()=>{
 const {api}=setup();let release;
 const slow=new Promise(resolve=>{release=resolve});
 const old=api.run('overview','admin',{},()=>slow);
 await api.run('save','admin',{},async()=>({saved:true}));
 release({version:0});await old;
 const now=await api.run('overview','admin',{},async()=>({version:1}));
 assert.equal(now.version,1);
});
test('explicit refresh invalidates memory cache',async()=>{
 const {api,docEvents}=setup();let count=0;const get=()=>Promise.resolve(++count);
 assert.equal(await api.run('overview','teacher',{},get),1);
 docEvents.get('click')({target:{closest:()=>({id:'teacherTrackingRefresh',getAttribute:()=>'',textContent:'Yenile'})}});
 assert.equal(await api.run('overview','teacher',{},get),2);
});
test('vault and backup data are never cached',async()=>{
 const {api}=setup();let count=0;const f=()=>Promise.resolve(++count);
 assert.equal(await api.run('vaultExport','admin',{},f),1);
 assert.equal(await api.run('vaultExport','admin',{},f),2);
});