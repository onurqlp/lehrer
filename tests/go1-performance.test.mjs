import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const source=path=>fs.readFileSync(new URL('../'+path,import.meta.url),'utf8');

function section(text,start,end){
 const a=text.indexOf(start),b=text.indexOf(end,a);
 assert.ok(a>=0&&b>a,'Expected implementation section: '+start);
 return text.slice(a,b);
}

test('ana uygulamada eşzamanlı aynı okuma tek HTTP isteğini kullanır; sonraki okuma yenidir',async()=>{
 const app=source('assets/app.js');
 const facade=section(app,'const aydaReadFlights=new Map();','function utf8Base64Url(s)');
 let count=0;const resolves=[];
 const network=()=>{count++;return new Promise(resolve=>resolves.push(resolve));};
 const api=new Function('network',"let authKey='user1';const aydaJsonpNetwork=network;"+facade+";return jsonp;")(network);
 const one=api('trackingSummary'),two=api('trackingSummary');
 assert.strictEqual(one,two);assert.equal(count,1,'a single pending request');
 resolves.shift()({students:[]});await Promise.all([one,two]);
 await Promise.resolve();
 const three=api('trackingSummary');assert.equal(count,2,'no stale completed cache');
 resolves.shift()({students:[1]});await three;
 const writeA=api('save'),writeB=api('save');
 assert.notStrictEqual(writeA,writeB);assert.equal(count,4,'write calls are never combined');
 resolves.shift()({saved:true});resolves.shift()({saved:true});await Promise.all([writeA,writeB]);
});

test('yönetici paneli de bekleyen okumaları birleştirir ve yazmayı birleştirmez',async()=>{
 const owner=source('assets/owner.js');
 const facade=section(owner,'const activeReads=new Map();','const errorMessage=message');
 let count=0;const resolves=[];
 const network=()=>{count++;return new Promise(resolve=>resolves.push(resolve));};
 const api=new Function('network',"const aydaOwnerApiNetwork=network;"+facade+";return api;")(network);
 const first=api('overview','teacher-1'),again=api('overview','teacher-1');
 const other=api('overview','teacher-2');
 assert.strictEqual(first,again);assert.notStrictEqual(first,other);
 assert.equal(count,2,'one request per authenticated account');
 resolves.splice(0).forEach(resolve=>resolve({ok:true}));
 await Promise.all([first,again,other]);
 const writeA=api('updateContact','teacher-1'),writeB=api('updateContact','teacher-1');
 assert.equal(count,4);
 resolves.splice(0).forEach(resolve=>resolve({saved:true}));
 await Promise.all([writeA,writeB]);
});

test('yönetici gizli panelleri giriş anında render edilmez',()=>{
 const owner=source('assets/owner.js');
 assert.match(owner,/function renderAll\(\)\{[\s\S]*?const views=\{/);
 assert.match(owner,/for\(const \[id,paint\] of views\[tab\]/);
 assert.match(owner,/if\(overview\)renderAll\(\)/);
 assert.match(owner,/ayda:owner-data-ready/);
});

test('öğretmen öğrenci takibi ve eksik tamamlama kayıtlarını görünce getirir',()=>{
 const focus=source('assets/ayda-teacher-focus.js');
 const track=source('assets/teacher-tracking.js');
 const daily=source('assets/teacher-daily.js');
 assert.match(focus,/ayda:teacher-page-open/);
 assert.match(track,/event\.detail\?\.page==='students'/);
 assert.doesNotMatch(track,/addEventListener\('ayda:login',load\)/);
 assert.match(daily,/event\.detail\?\.page==='daily'/);
 assert.doesNotMatch(daily,/groupOptions\(\);loadMonth\(\);loadMakeup\(\)/);
});

test('güncelleme UI koduyla sınırlı; yoklama ve kayıt yanıtları doğrulanmaya devam eder',()=>{
 const app=source('assets/app.js');
 assert.match(app,/if\(!result\.id\)throw Error\('Sunucu öğrenci kimliğini doğrulamadı/);
 assert.match(app,/unknownCommit=true/);
 assert.match(app,/const readOnly=\['ping','overview'/);
 const owner=source('assets/owner.js');
 assert.match(owner,/api\('trackingSummary',requestedKey\),api\('reminders',requestedKey\)/);
 assert.match(owner,/if\(!isCurrent\(\)\)return false/);
});
