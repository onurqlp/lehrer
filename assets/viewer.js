"use strict";
const $=id=>document.getElementById(id), el=(tag,cls,txt)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(txt!==undefined)n.textContent=String(txt);return n;};
let db=null,seq=0,tab='overview',monthlyRows=[];
const CACHE_KEY='ayda_public_dashboard_v2',CACHE_MAX_AGE=7*24*60*60*1000;
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function restoreCache(){try{const c=JSON.parse(localStorage.getItem(CACHE_KEY)||'null');if(c&&c.savedAt&&Date.now()-c.savedAt<CACHE_MAX_AGE&&c.data&&Array.isArray(c.data.groups)){db=c.data;render();$('updated').textContent='Son başarılı veri: '+new Date(c.savedAt).toLocaleString('tr-TR')+' (çevrimdışı kayıt)';return true;}}catch(e){}return false;}
function storeCache(data){try{localStorage.setItem(CACHE_KEY,JSON.stringify({savedAt:Date.now(),data}));}catch(e){}}
/* Google Workspace can route domain-specific /a/macros URLs through a signed-in
   account. Retry the SAME deployment's canonical /macros/s URL for public reads. */
function apiUrls(){
 const primary=String(window.AYDA_API_URL||'').trim();
 const match=primary.match(/^https:\/\/script\.google\.com\/a\/macros\/[^/]+\/s\/([^/]+)\/exec$/);
 const canonical=match?'https://script.google.com/macros/s/'+match[1]+'/exec':primary;
 return [...new Set([canonical,primary].filter(Boolean))];
}
function transportFailure(text){
 const error=new Error(text);error.transport=true;return error;
}
async function apiRetry(){
 let last;
 for(const url of apiUrls()){
  try{return await api(url);}
  catch(error){last=error;if(!error?.transport)throw error;}
 }
 throw Error('Apps Script bağlantısı kurulamadı. Google dağıtımının erişimi “Herkes”, çalıştıranı “Ben” olmalı. ('+(last?.message||'Bağlantı hatası')+')');
}
function api(address){
 return new Promise((resolve,reject)=>{
  const url=new URL(address,location.origin);
  if(url.origin!==location.origin||url.pathname!=='/api'){
   reject(Error('Beta API yapılandırması bulunamadı.'));return;
  }
  const cb='ayda_cb_'+Date.now()+'_'+(++seq),script=document.createElement('script');
  let done=false;
  const finish=(err,value)=>{if(done)return;done=true;clearTimeout(timer);script.remove();delete window[cb];err?reject(err):resolve(value);};
  const timer=setTimeout(()=>finish(transportFailure('Sunucu zaman aşımı.')),15000);
  window[cb]=result=>result?.ok?finish(null,result.data):finish(Error(result?.error||'Geçersiz sunucu yanıtı.'));
  url.searchParams.set('callback',cb);url.searchParams.set('action','publicDashboard');
  script.onerror=()=>finish(transportFailure('Google Apps Script yanıtı tarayıcıya yüklenemedi.'));
  script.onload=()=>{if(!done)finish(transportFailure('Google Apps Script geçerli veri döndürmedi.'));};
  script.src=url.toString();document.head.append(script);
 });
}
const names=['Pazar','Pazartesi','Salı','Çarşamba','Perşembe','Cuma','Cumartesi'];
function parse(s){const a=String(s||'').split('-').map(Number);return a.length===3&&a.every(Number.isFinite)?new Date(Date.UTC(a[0],a[1]-1,a[2])):null;}
function iso(d){return d.toISOString().slice(0,10);}function fmt(s){if(!s)return '—';const a=s.split('-');return a.length===3?a[2]+'.'+a[1]+'.'+a[0]:s;}
function todayDate(){return parse(db?.today)||parse(iso(new Date()));}
function diffDays(a,b){const x=parse(a),y=parse(b);return x&&y?Math.round((x-y)/86400000):null;}
function details(g){
 const completed=Math.max(0,Math.min(24,Number(g.completed)||0));
 const start=String(g.start||'').slice(0,10),today=iso(todayDate());
 const until=diffDays(start,today),upcoming=completed===0&&until!==null&&until>=0&&until<=14;
 const days=new Set((db.schedule||[]).filter(p=>p.groupId===g.id&&String(p.status||'').toLocaleLowerCase('tr')==='aktif').map(p=>p.day));
 const remaining=24-completed;
 let unit='Program eksik',exam='Program eksik',next='Program eksik';
 if(days.size){
  const d=parse(start&&start>today?start:today);
  if(d){
   const dates=[];
   for(let i=0;i<900&&dates.length<remaining+2;i++){if(days.has(names[d.getUTCDay()]))dates.push(iso(d));d.setUTCDate(d.getUTCDate()+1);}
   if(dates.length>=remaining+2){
    unit=remaining===0?'Tamamlandı':dates[remaining-1];
    exam=dates[remaining+1];
    next=dates[0];
   }
  }
 }
 const stage=completed>=24?'done':upcoming?'upcoming':completed===0?'new':completed>=20?'nearing':'ongoing';
 return {completed,remaining,unit,exam,next,start,until,stage,weekly:days.size};
}
function teacher(id){return(db.teachers||[]).find(t=>t.id===id)?.name||id||'—';}
function card(g){const d=details(g),a=el('article','group'),heading=el('div','line'),left=el('div');left.append(el('span','level',g.level||''),el('h3','',g.name));heading.append(left,el('span','state '+d.stage,{new:'Başlamadı',ongoing:'Devam ediyor',nearing:'Bitmek üzere',done:'Tamamlandı',upcoming:'Yakında başlıyor'}[d.stage]));a.append(heading,el('div','muted',teacher(g.teacherId)+' · '+(Number(g.students)||0)+' öğrenci'));const p=el('div','line');p.append(el('span','big',d.completed+' / 24 ünite'),el('span','muted',Math.round(d.completed/24*100)+'%'));a.append(p);const track=el('div','progress'),bar=el('div');bar.style.width=(d.completed/24*100)+'%';track.append(bar);a.append(track);const tiles=el('div','units');for(let i=1;i<=24;i++){const t=el('span','unit'+(i<=d.completed?' ok':''),i);t.title=i+'. ünite';tiles.append(t);}a.append(tiles);const dates=el('div','dates');for(const [label,val] of [['24. ünite',fmt(d.unit)],['2 ek hazırlık dersi',fmt(d.exam)]]){const box=el('div');box.append(el('small','',label),el('strong','',val));dates.append(box);}a.append(dates);a.append(el('div','forecast',d.stage==='upcoming'?'🟦 '+(d.until===0?'Bugün başlıyor':d.until+' gün sonra başlayacak')+' · '+fmt(d.start):d.stage==='done'?'🟩 Müfredat tamamlandı':d.unit==='Program eksik'?'⚪ Ders programı eksik':'📅 Haftada '+d.weekly+' ders günü · '+d.remaining+' ünite / '+d.remaining+' ders günü kaldı'));const last=(db.history||[]).filter(h=>h.groupId===g.id&&h.status==='İşlendi').sort((x,y)=>y.date.localeCompare(x.date))[0];a.append(el('div','last',last?'Son ders: '+fmt(last.date)+(last.topic?' • '+last.topic:''):'Henüz ders raporu yok'));return a;}
function renderGroups(){const all=db.groups||[],target=$('allGroups'),overview=$('overviewGroups');target.replaceChildren();overview.replaceChildren();const l=$('level').value,s=$('stage').value,q=$('search').value.toLocaleLowerCase('tr').trim();const filtered=all.filter(g=>(!l||g.level===l)&&(!s||details(g).stage===s)&&(!q||(g.name+' '+teacher(g.teacherId)).toLocaleLowerCase('tr').includes(q)));for(const g of filtered)target.append(card(g));if(!filtered.length)target.append(el('div','empty','Bu filtreye uygun grup yok.'));for(const g of all.slice().sort((a,b)=>Number(b.completed||0)-Number(a.completed||0)).slice(0,6))overview.append(card(g));if(!all.length)overview.append(el('div','empty','Grup bulunamadı.'));}
function renderAlerts(){
 const all=db.groups||[],alerts=$('alerts');alerts.replaceChildren();
 const attention=all.map(g=>({g,d:details(g)})).filter(x=>x.d.stage==='upcoming'||x.d.stage==='nearing'||x.d.stage==='done'||x.d.unit==='Program eksik');
 const priority={upcoming:0,nearing:1,done:2,new:3,ongoing:4};
 attention.sort((a,b)=>(priority[a.d.stage]??5)-(priority[b.d.stage]??5));
 if(!attention.length){alerts.append(el('div','empty','Şu anda acil takip gerektiren grup yok.'));return;}
 for(const {g,d} of attention){
  const a=el('div','alert alert-'+d.stage);
  const message=d.stage==='upcoming'?'Yeni kurs '+(d.until===0?'bugün başlıyor':d.until+' gün sonra başlıyor')+' · '+fmt(d.start):
   d.unit==='Program eksik'?'Haftalık ders programı eksik':
   d.stage==='done'?'24 ünite tamamlandı · Sınav hazırlığını kontrol edin':
   d.remaining+' ünite kaldı · Tahmini bitiş '+fmt(d.unit);
  a.append(el('strong','',g.name+' · '+g.level),el('div','muted',message));alerts.append(a);
 }
}
function hours(v){const m=String(v||'').match(/^(\d{1,2}):(\d{2})$/);return m?Number(m[1])+Number(m[2])/60:(Number(v)||0);}
function renderTeachers(){const month=$('month').value,records=[...(db.history||[]).map(x=>({...x,type:'Grup'})),...(db.privateHistory||[]).map(x=>({...x,type:'Özel'}))].filter(x=>x.date.startsWith(month));const totals=new Map();for(const r of records){const t=totals.get(r.teacherId)||{count:0,group:0,private:0,hours:0,cancel:0};if(r.status==='İşlendi'){t.count++;t.hours+=hours(r.actual);t[r.type==='Özel'?'private':'group']++;}else t.cancel++;totals.set(r.teacherId,t);}monthlyRows=[['Öğretmen','Grup dersi','Özel ders','Toplam ders','Toplam saat','İptal/Erteleme']];for(const [id,x] of totals)monthlyRows.push([teacher(id),x.group,x.private,x.count,x.hours.toLocaleString('tr-TR',{maximumFractionDigits:2}),x.cancel]);$('teacherTotals').replaceChildren();if(totals.size){const wrap=el('div','tableWrap'),table=el('table'),head=el('tr');for(const h of monthlyRows[0])head.append(el('th','',h));table.append(head);for(const row of monthlyRows.slice(1)){const tr=el('tr');for(const x of row)tr.append(el('td','',x));table.append(tr);}wrap.append(table);$('teacherTotals').append(wrap);}else $('teacherTotals').append(el('div','empty','Bu ay için ders raporu bulunmuyor.'));}
function render(){
 const gs=db.groups||[],done=gs.filter(g=>details(g).stage==='done').length,near=gs.filter(g=>details(g).stage==='nearing').length,upcoming=gs.filter(g=>details(g).stage==='upcoming').length,students=gs.reduce((n,g)=>n+(Number(g.students)||0),0);
 $('kpis').replaceChildren();
 for(const [label,value,tone] of [['Toplam grup',gs.length,''],['Toplam öğrenci',students,''],['Yakında başlayacak',upcoming,'upcoming'],['Bitmeye yakın',near,'nearing'],['24 ünite tamamlandı',done,'done']]){
  const c=el('div','kpi '+tone);c.append(el('span','label',label),el('strong','',value));$('kpis').append(c);
 }
 $('updated').textContent='Son yenileme: '+new Date().toLocaleString('tr-TR');
 $('month').value ||= (db.today||iso(new Date())).slice(0,7);
 renderGroups();renderAlerts();renderTeachers();
}
let loadingNow=false;
async function load(){
 if(loadingNow)return;loadingNow=true;
 const b=$('refresh');b.disabled=true;b.textContent='↻ Yükleniyor…';
 $('publicError').textContent='';$('loading').hidden=false;
 try{
   const fresh=await apiRetry();
   if(!fresh||!Array.isArray(fresh.groups))throw Error('Eksik sunucu yanıtı');
   db=fresh;storeCache(fresh);render();$('loading').hidden=true;$('refresh').hidden=false;$('connectionHelp').hidden=true;
 }catch(err){
   $('loading').hidden=true;
   $('publicError').textContent=db?'Canlı bağlantı geçici olarak kurulamadı. Son başarılı veriler gösteriliyor; tekrar denemek için Yenile’ye tıklayın.':'Veriler şu anda getirilemedi: '+err.message;
   $('connectionHelp').hidden=false;
   const testUrl=new URL(apiUrls()[0]);testUrl.searchParams.set('action','ping');testUrl.searchParams.set('callback','ayda_cb_test123');$('apiTestLink').href=testUrl.toString();
 }finally{loadingNow=false;b.disabled=false;b.textContent='↻ Yenile';}
}
$('refresh').hidden=false;$('refresh').addEventListener('click',load);
for(const b of document.querySelectorAll('[data-tab]'))b.addEventListener('click',()=>{for(const x of document.querySelectorAll('[data-tab]'))x.classList.toggle('active',x===b);for(const x of document.querySelectorAll('.tabpanel'))x.hidden=x.id!==b.dataset.tab;});
for(const id of ['level','stage','search'])$(id).addEventListener(id==='search'?'input':'change',()=>db&&renderGroups());$('month').addEventListener('change',()=>db&&renderTeachers());
$('csv').addEventListener('click',()=>{const quote=x=>'"'+String(x??'').replace(/^[\s]*[=+@-]/,m=>"'"+m).replace(/"/g,'""')+'"';const blob=new Blob(['\ufeff'+monthlyRows.map(r=>r.map(quote).join(';')).join('\r\n')],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='AYDA-ogretmen-saatleri-'+$('month').value+'.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1200);});
restoreCache();
load();
