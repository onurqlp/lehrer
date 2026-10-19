'use strict';
const $=id=>document.getElementById(id);let authKey='',data=null,requestNo=0;
const $el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=String(text);return n;};
const clear=id=>$(id).replaceChildren();
function message(id,text,kind='error'){const n=$el('div','message '+kind,text);$(id).replaceChildren(n);}
/* The Google Workspace /a/macros URL may redirect through account selection.
   Use the public /macros/s URL for the same deployment as a fallback.
   Never automatically retry a write action: it might already have been saved. */
let workingApiUrl='';
function apiCandidates(){
 const configured=String(window.AYDA_API_URL||'').trim();
 const id=configured.match(/\/s\/([A-Za-z0-9_-]+)\/exec(?:$|\?)/)?.[1];
 if(!id)return [configured].filter(Boolean);
 const root='https://script.google.com/';
 const paths=['a/macros/aydadil.com/s/','a/aydadil.com/macros/s/','macros/s/'];
 return [...new Set([workingApiUrl,...paths.map(p=>root+p+id+'/exec'),configured].filter(Boolean))];
}
function apiTransportError(detail){
 const err=new Error(detail);err.transport=true;return err;
}
function jsonpRequest(api,action,params){
 return new Promise((resolve,reject)=>{
  if(!/^https:\/\/script\.google\.com\/(?:macros\/s\/|a\/macros\/[^/]+\/s\/|a\/[^/]+\/macros\/s\/)/.test(api)){
   reject(Error('Apps Script API adresi ayarlanmamış.'));return;
  }
  const cb='ayda_cb_'+Date.now()+'_'+(++requestNo),url=new URL(api),script=document.createElement('script');
  let settled=false;
  const finish=(err,result)=>{if(settled)return;settled=true;clearTimeout(timer);delete window[cb];script.remove();err?reject(err):resolve(result);};
  const timer=setTimeout(()=>finish(apiTransportError('Apps Script yanıtı zaman aşımına uğradı.')),12000);
  window[cb]=r=>{if(!r||!r.ok)finish(Error((r&&r.error)||'Sunucudan geçersiz yanıt geldi.'));else finish(null,r.data);};
  url.searchParams.set('callback',cb);url.searchParams.set('action',action);url.searchParams.set('key',authKey);
  for(const [k,v] of Object.entries(params))url.searchParams.set(k,v);
  script.onerror=()=>finish(apiTransportError('Google Apps Script bağlantısı kurulamadı.'));
  script.onload=()=>{if(!settled)finish(apiTransportError('Google Apps Script JSONP yerine giriş veya hata sayfası döndürdü.'));};
  script.src=url.toString();document.head.append(script);
 });
}
async function jsonp(action,params={}){
 const readOnly=['ping','overview','studentRoster','trackingSummary','vaultExport','reminders','studentNotes','teacherMonthly','makeupList','teacherFeedback','feedbackInbox','contactDirectory','homeworkTasks','lessonHomework'].includes(action);
 const candidates=apiCandidates();
 let last;
 for(const address of (readOnly?candidates:candidates.slice(0,1))){
  try{
   const response=await jsonpRequest(address,action,params);
   workingApiUrl=address;
   return response;
  }catch(err){
   last=err;
   if(!err.transport)throw err;
  }
 }
 if(readOnly&&candidates.length>1)throw Error('Google Apps Script iki adresten de yanıt vermedi. Dağıtımın erişimi “Herkes”, çalıştıranı “Ben” olmalı. '+(last?.message||''));
 if(last?.transport&&!readOnly)last.unknownCommit=true;
 throw last||Error('API bağlantısı kurulamadı.');
}
function utf8Base64Url(s){const bytes=new TextEncoder().encode(s);let binary='';for(const b of bytes)binary+=String.fromCharCode(b);return btoa(binary).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');}
async function login(key){authKey=String(key||'');$('loginBtn').disabled=true;clear('loginMessage');try{const result=await jsonp('overview');data=result;sessionStorage.setItem('aydaKey',authKey);$('login').classList.add('hidden');$('app').classList.remove('hidden');$('logout').classList.remove('hidden');render();window.dispatchEvent(new Event('ayda:login'));}catch(e){authKey='';message('loginMessage',e.message);}finally{$('loginBtn').disabled=false;}}
function safeWhatsappLink(value){try{const u=new URL(String(value||''));return u.protocol==='https:'&&((u.hostname==='chat.whatsapp.com'&&/^\/[A-Za-z0-9_-]+$/.test(u.pathname))||(u.hostname==='wa.me'&&/^\/[0-9]+$/.test(u.pathname)))?u.href:'';}catch{return '';}}
function rowcard(title,subtitle,tag){const n=$el('div','card rowcard'),left=$el('div');left.append($el('strong','',title),$el('div','muted',subtitle));n.append(left,$el('span','tag',tag));return n;}
function aydaAdminDashboardOrder_(admin){
 const app=$('app'),area=$('adminArea'),stats=app.querySelector('.stats');
 document.body.classList.toggle('ayda-is-admin',admin);
 if(admin&&area&&stats){
  app.insertBefore(area,stats);
  let heading=$('adminOperationalTitle');
  if(!heading){
   heading=$el('div','ayda-admin-operations-title');
   heading.id='adminOperationalTitle';
   heading.append($el('h2','','Günlük işlemler ve kayıt araçları'),$el('p','muted','Ders kaydı, grup listesi ve öğretmen işlemleri burada ikinci plandadır; akademik takip için üstteki bölümleri kullanın.'));
   stats.insertAdjacentElement('beforebegin',heading);
  }
  heading.hidden=false;
 }else if($('adminOperationalTitle'))$('adminOperationalTitle').hidden=true;
}

function render(){const u=data.user,admin=u.role==='admin',groups=data.groups,schedule=data.schedule,history=data.history;aydaAdminDashboardOrder_(admin);$('roleChip').textContent=admin?'Yönetici Paneli':'Öğretmen Paneli';$('welcome').textContent='Merhaba, '+u.name;$('dateLine').textContent='Bugün: '+data.today;$('groupTitle').textContent=admin?'Tüm Gruplar':'Gruplarım';$('groupCount').textContent=groups.length;$('todayCount').textContent=data.todayLessons.length;$('reportCount').textContent=history.length;$('studentCount').textContent=groups.reduce((n,g)=>n+(Number(g.students)||0),0);$('lessonDate').value=data.today; $('monthFilter').value=data.today.slice(0,7);$('lessonDate').max=data.today;
 clear('todayLessons');if(!data.todayLessons.length)$('todayLessons').append($el('div','card empty','Bugün planlanan ders bulunmuyor.'));for(const p of data.todayLessons)$('todayLessons').append(rowcard(p.group,p.day,p.start+' – '+p.end));
 clear('groups');for(const g of groups){const card=$el('div','card');card.append($el('span','tag',g.level),$el('h3','',g.name),$el('div','muted','Öğrenci: '+g.students+' · Öğretmen ID: '+g.teacherId),$el('div','muted','Tamamlanan ünite: '+g.completed+' / '+g.total));const progress=$el('div','progress'),fill=$el('div');fill.style.width=(g.total?Math.min(100,100*g.completed/g.total):0)+'%';progress.append(fill);card.append(progress);const wa=safeWhatsappLink(g.whatsapp);if(wa){const link=$el('a','ayda-group-link','💬 Grup WhatsApp ↗');link.href=wa;link.target='_blank';link.rel='noopener noreferrer';card.append(link);}$('groups').append(card);}if(!groups.length)$('groups').append($el('div','card empty','Aktif grup bulunamadı.'));
 clear('schedule');for(const p of schedule)$('schedule').append(rowcard(p.day+' · '+p.group,p.status,p.start+' – '+p.end));if(!schedule.length)$('schedule').append($el('div','card empty','Haftalık program bulunamadı.'));
 clear('groupId');$('groupId').append(new Option('Grup seçin',''));clear('historyFilter');$('historyFilter').append(new Option('Tüm gruplar',''));for(const g of groups){$('groupId').append(new Option(g.name,g.id));$('historyFilter').append(new Option(g.name,g.id));}renderHistory();renderAdmin();}
function hours(s){if(typeof s==='number')return s;const m=String(s||'').match(/^(\d{1,2}):(\d{2})$/);return m?Number(m[1])+Number(m[2])/60:0;}
function allEntries(){return [...data.history.map(x=>({...x,type:'Grup',student:'',group:data.groups.find(g=>g.id===x.groupId)?.name||x.groupId})),...(data.privateHistory||[]).map(x=>({...x,type:'Özel',group:x.student||'Özel ders'}))];}
function renderAdmin(){const admin=data.user.role==='admin';$('adminArea').classList.toggle('hidden',!admin);if(!admin)return;const sel=$('teacherFilter'),old=sel.value;sel.replaceChildren(new Option('Tüm öğretmenler',''));const ids=[...new Set([...data.groups.map(g=>g.teacherId),...allEntries().map(x=>x.teacherId)])].filter(Boolean);for(const id of ids){const t=(data.teachers||[]).find(t=>t.id===id);sel.add(new Option(t?.name||id,id));}sel.value=old;fillAdminSelectors();fillPasswordTargets();const keySel=$('keyTarget');keySel.replaceChildren(new Option('Yönetici','ADMIN'));for(const account of (data.accounts||[]).filter(x=>x.status==='Aktif'))keySel.add(new Option((account.name||account.id)+' · '+account.id,account.id));renderMonth();renderAcademic();renderAccounts();const el=$('adminGroups');el.replaceChildren();for(const g of data.groups){const last=data.history.filter(x=>x.groupId===g.id&&x.status==='İşlendi').sort((a,b)=>b.date.localeCompare(a.date))[0];const t=(data.teachers||[]).find(t=>t.id===g.teacherId);const c=$el('div','card');c.append($el('strong','',g.name+' · '+g.level),$el('p','muted','Öğretmen: '+(t?.name||g.teacherId)+' · Öğrenci: '+g.students),$el('p','','İlerleme: '+g.completed+' / '+g.total+' ünite'),$el('p','muted',last?'Son ders: '+last.date+' · '+(last.note||last.topic||'Bilgi belirtilmemiş'):'Henüz ders raporu yok'));el.append(c);}}
function renderMonth(){if(!data||data.user.role!=='admin')return;const month=$('monthFilter').value,teacher=$('teacherFilter').value,items=allEntries().filter(x=>(!month||x.date.startsWith(month))&&(!teacher||x.teacherId===teacher));const totals=new Map();for(const x of items){const key=x.teacherId||'—',v=totals.get(key)||{count:0,hours:0,group:0,private:0,cancel:0};if(x.status==='İşlendi'){v.count++;v.hours+=hours(x.actual);v[x.type==='Özel'?'private':'group']++;}else v.cancel++;totals.set(key,v);}const box=$('monthSummary');box.replaceChildren();const table=$el('table','data-table'),head=$el('tr');for(const label of ['Öğretmen','Ders','Grup','Özel','Saat','İptal/Erteleme'])head.append($el('th','',label));table.append(head);for(const [id,v] of totals){const tr=$el('tr'),t=(data.teachers||[]).find(t=>t.id===id);for(const x of [t?.name||id,v.count,v.group,v.private,v.hours.toLocaleString('tr-TR',{maximumFractionDigits:2}),v.cancel])tr.append($el('td','',x));table.append(tr);}box.append(table);if(!totals.size)box.append($el('p','muted','Bu ay için kayıt bulunmuyor.'));}
$('rotateBtn').addEventListener('click',async()=>{const target=$('keyTarget').value;if(!confirm((target==='ADMIN'?'Yönetici':target)+' anahtarı yenilensin mi? Eski anahtar hemen geçersiz olacak.'))return;const btn=$('rotateBtn');btn.disabled=true;clear('rotateResult');try{const result=await jsonp('rotateKey',{target});const box=$('rotateResult');const info=$el('p','muted','Yeni anahtar (yalnızca bir kez gösterilir). Güvenli bir yere kaydedin:');const field=$el('textarea');field.readOnly=true;field.rows=3;field.value=result.key;const copy=$el('button','primary','Anahtarı Kopyala');copy.type='button';copy.addEventListener('click',()=>navigator.clipboard.writeText(result.key));box.append(info,field,copy);if(target==='ADMIN'){authKey=result.key;sessionStorage.setItem('aydaKey',authKey);}}catch(err){message('rotateResult',err.message);}finally{btn.disabled=false;}});

function renderAccounts(){
 const target=$('accountList');target.replaceChildren();
 const accounts=data.accounts||[],archive=data.vaultStatus||[],teachers=data.teachers||[];
 const table=$el('table','data-table');const head=$el('tr');
 for(const t of ['Hesap','Öğretmen ID','Durum','Anahtar arşivi'])head.append($el('th','',t));table.append(head);
 const records=[{id:'ADMIN',name:'Yönetici',teacherId:'—',status:'Aktif'},...accounts.map(x=>({id:x.id,name:x.name,teacherId:teachers.find(t=>t.userId===x.id)?.id||'—',status:x.status||'—'}))];
 for(const r of records){const tr=$el('tr');const has=archive.find(x=>x.accountId===r.id);
  for(const v of [r.name+' ('+r.id+')',r.teacherId,r.status,has?'Arşivde · '+has.created:'Eski anahtar / arşivde yok'])tr.append($el('td','',v));table.append(tr);}
 target.append(table);
}
function downloadCSV(rows,filename){
 const safe=v=>{let x=String(v??'');if(/^[\s]*[=+@-]/.test(x))x="'"+x;return '"'+x.replace(/"/g,'""')+'"';};
 const csv='\ufeff'+rows.map(r=>r.map(safe).join(';')).join('\r\n');
 const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));
 const link=document.createElement('a');link.href=url;link.download=filename;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);
}
$('vaultExportBtn').addEventListener('click',async()=>{
 const btn=$('vaultExportBtn');btn.disabled=true;clear('vaultExportMsg');
 try{
  const result=await jsonp('vaultExport');const rows=result.rows||[];
  const accounts=[{id:'ADMIN',name:'Yönetici',teacherId:'—'},...(data.accounts||[]).map(u=>({id:u.id,name:u.name,teacherId:(data.teachers||[]).find(t=>t.userId===u.id)?.id||''}))];
  const current=new Map(rows.filter(x=>x.status==='Güncel').map(x=>[x.accountId,x]));
  const output=[['Hesap ID','Ad Soyad','Öğretmen ID','Rol','Giriş Anahtarı','Oluşturulma Zamanı','Bilgi'],...accounts.map(u=>{
    const v=current.get(u.id);return [u.id,u.name,u.teacherId,u.id==='ADMIN'?'Yönetici':'Öğretmen',v?.key||'',v?.created||'',v?'Güncel anahtar':'Arşivde yok; yenilenmeli'];
  })];
  downloadCSV(output,'AYDA_GIZLI_HESAPLAR_'+new Date().toISOString().slice(0,10)+'.csv');
  message('vaultExportMsg','Excel dosyası indirildi. Dosyayı yalnızca yönetici hesabında saklayın.','success');
 }catch(err){message('vaultExportMsg',err.message);}finally{btn.disabled=false;}
});

$('monthFilter').addEventListener('change',renderMonth);$('teacherFilter').addEventListener('change',renderMonth);
$('csvBtn').addEventListener('click',()=>{const month=$('monthFilter').value,teacher=$('teacherFilter').value,items=allEntries().filter(x=>(!month||x.date.startsWith(month))&&(!teacher||x.teacherId===teacher));const rows=[['Tarih','Öğretmen ID','Tür','Grup/Öğrenci','Durum','Saat','Son tamamlanan ünite','Kısa bilgi'],...items.map(x=>[x.date,x.teacherId,x.type,x.group,x.status,x.status==='İşlendi'?hours(x.actual):0,x.completed||'',x.note||x.topic||''])];downloadCSV(rows,'AYDA_ders_cizelgesi_'+(month||'tum')+'.csv');});
$('lessonType').addEventListener('change',()=>{const priv=$('lessonType').value==='private';$('groupWrap').classList.toggle('hidden',priv);$('privateWrap').classList.toggle('hidden',!priv);$('groupId').required=!priv;$('privateStudent').required=priv;});
function renderHistory(){clear('history');const filter=$('historyFilter').value;const list=[...data.history,...(data.privateHistory||[])].filter(x=>!filter||x.groupId===filter).sort((a,b)=>b.date.localeCompare(a.date));for(const r of list){const g=data.groups.find(x=>x.id===r.groupId),card=$el('div','card historyitem'),line=$el('div','topline');line.append($el('strong','',(g?g.name:(r.student||r.groupId))+' · '+r.date),$el('span','tag',r.status));card.append(line,$el('div','muted','Son tamamlanan ünite: '+r.completed+' · '+r.teacherId),$el('p','',r.note||r.topic||''));if(r.groupId&&(data.user.role==='admin'||r.teacherId===data.user.id)){
  const edit=$el('details','ayda-history-edit'),summary=$el('summary','','✏️ Raporun süre / açıklamasını düzelt');edit.append(summary);
  const area=$el('textarea');area.value=r.note||r.topic||'';area.maxLength=2000;area.minLength=3;area.rows=3;area.setAttribute('aria-label','Düzeltilmiş ders notu');
  const duration=$el('select');duration.setAttribute('aria-label','Ders süresi (30 dakikalık aralıklar)');
  for(let min=30;min<=360;min+=30){const h=String(Math.floor(min/60)).padStart(2,'0'),m=min%60?'30':'00';duration.add(new Option(min===30?'30 dakika':Math.floor(min/60)+' saat'+(min%60?' 30 dk':''),h+':'+m));}
  if(/^(?:00:30|0[1-5]:(?:00|30)|06:00)$/.test(r.actual||''))duration.value=r.actual;
  else {const legacy=new Option('Eski süre: '+(r.actual||'belirtilmemiş')+' · yeni süre seçin','');legacy.disabled=true;legacy.selected=true;duration.insertBefore(legacy,duration.firstChild);}
  const button=$el('button','ayda-inline-btn','Düzeltmeyi kaydet');button.type='button';
  const feedback=$el('small','ayda-note-state');
  button.addEventListener('click',async()=>{const note=area.value.trim(),actual=duration.value;if(note.length<3){feedback.textContent='En az 3 karakter yazın.';return;}if(!/^(?:00:30|0[1-5]:(?:00|30)|06:00)$/.test(actual)){feedback.textContent='30 dakikalık aralıklarla süre seçin.';return;}button.disabled=true;feedback.textContent='Kaydediliyor…';
   try{await aydaVerifyDurationBackend(actual);const result=await jsonp('updateReport',{payload:utf8Base64Url(JSON.stringify({id:r.id,note,actual}))});if(!result.saved)throw Error('Kayıt onayı alınamadı.');
    feedback.textContent='Düzeltme kaydedildi.';data=await jsonp('overview');render();
   }catch(err){feedback.textContent='Düzeltme doğrulanamadı; tekrar denemeden önce kontrol edin. '+err.message;}
   finally{button.disabled=false;}
  });
  edit.append(area,duration,button,feedback);card.append(edit);
 }
 $('history').append(card);}if(!list.length)$('history').append($el('div','card empty','Henüz rapor bulunmuyor.'));}
$('groupId').addEventListener('change',()=>{const g=data?.groups.find(x=>x.id===$('groupId').value);if(g)$('completed').value=g.completed||0;});
$('historyFilter').addEventListener('change',renderHistory);
$('loginForm').addEventListener('submit',e=>{e.preventDefault();login($('key').value);});
$('logout').addEventListener('click',()=>{sessionStorage.removeItem('aydaKey');authKey='';data=null;$('app').classList.add('hidden');$('login').classList.remove('hidden');$('logout').classList.add('hidden');$('key').value='';$('roleChip').textContent='Öğretmen ve Yönetici';document.body.classList.remove('ayda-is-admin');history.replaceState(null,'',location.pathname);lastSharedHomework=null;shareBackendChecked=false;$('sendHomeworkToGroup').hidden=true;$('aydaShareHint').hidden=true;window.dispatchEvent(new Event('ayda:logout'));});
let lastSharedHomework=null,shareBackendChecked=false;
async function aydaVerifyDurationBackend(actual){
 if(!String(actual||'').endsWith(':30'))return;
 const ping=await jsonp('ping');
 const match=/^2026-10-19\.(\d+)$/.exec(String(ping?.version||''));
 if(!match||Number(match[1])<8)throw Error('30 dakikalık aralıklarla ders süresi kaydetmek için Google Apps Script 2026-10-19.8 sürümünün yayımlanması gerekiyor. Kayıt yapılmadı.');
}
async function aydaVerifyShareBackend(){
 if(shareBackendChecked)return;
 const ping=await jsonp('ping');
 const version=String(ping?.version||'');
 const compatible=/^2026-10-16\.(\d+)$/.exec(version);
 const current=/^2026-10-19\.(\d+)$/.exec(version);
 if(!((compatible&&Number(compatible[1])>=7)||(current&&Number(current[1])>=8)))
  throw Error('Yeni WhatsApp ödev paylaşım takibi için Google Apps Script 2026-10-16.7 sürümünü dağıtın. Bu işlem yapılmadan ders raporu kaydedilemez.');
 shareBackendChecked=true;
}

$('sendHomeworkToGroup')?.addEventListener('click',()=>{
 const hint=$('aydaShareHint');
 if(!lastSharedHomework){if(hint){hint.hidden=false;hint.textContent='Önce ders kaydını tamamlayın.';}return;}
 const {groupName,date,text}=lastSharedHomework;
 const format=/^\d{4}-\d\d-\d\d$/.test(date)?date.slice(8)+'.'+date.slice(5,7)+'.'+date.slice(0,4):date;
 const message='AYDA DİL AKADEMİSİ · '+groupName+'\n'+format+' tarihli derste verilen ödev:\n'+text+'\nİyi çalışmalar.';
 // WhatsApp does not provide a standard URL to prefill a specific group chat.
 // Sharing link lets the teacher choose their own class group, then manually send.
 const href='https://wa.me/?text='+encodeURIComponent(message);
 window.open(href,'_blank','noopener,noreferrer');
 window.dispatchEvent(new CustomEvent('ayda:homework-share-opened',{detail:{id:lastSharedHomework.id}}));
 if(hint){hint.hidden=false;hint.textContent='WhatsApp’ta sınıf grubunu seçip mesajı gönderin. Sonra bu sayfaya dönerek “Gruba gönderdim” düğmesine basın.';}
});
function aydaSyncHomeworkField(){
 const group=$('lessonType')?.value==='group',status=$('status')?.value||'İşlendi';
 const label=$('aydaHomeworkLabel'),hint=$('aydaHomeworkHint'),note=$('note');
 if(!label||!note)return;
 const noHomeworkBtn=$('aydaNoHomeworkBtn');if(noHomeworkBtn)noHomeworkBtn.hidden=!(group&&status==='İşlendi');
 if(group&&status==='İşlendi'){
  label.textContent='2 · Verilen ödev';
  note.placeholder='Örn. Menschen A2, Ünite 6, sayfa 42–43 alıştırmaları.';
  if(hint)hint.textContent='Yoklamadan sonra ödevi yazın. Ders kaydı bitince aynı metni WhatsApp grubuna bildirin.';
 }else{
  label.textContent=status==='İşlendi'?'Kısa ders notu':'İptal / erteleme gerekçesi';
  note.placeholder=status==='İşlendi'?'Dersin kısa özeti veya verilen çalışma':'Örn. Öğretmen mazereti nedeniyle ertelendi.';
  if(hint)hint.textContent='Kısa bir açıklama yazın.';
 }
}
$('aydaNoHomeworkBtn')?.addEventListener('click',()=>{
 const field=$('note');
 field.value='Bu derste ödev verilmedi.';
 field.dispatchEvent(new Event('input',{bubbles:true}));
 field.focus({preventScroll:true});
});
$('lessonType')?.addEventListener('change',aydaSyncHomeworkField);
$('status')?.addEventListener('change',aydaSyncHomeworkField);
window.addEventListener('ayda:login',aydaSyncHomeworkField);

$('reportForm').addEventListener('submit',async e=>{e.preventDefault();const b=$('saveBtn');b.disabled=true;b.textContent='Kaydediliyor...';clear('formMessage');try{
 const payload={type:$('lessonType').value,student:$('privateStudent').value,groupId:$('groupId').value,date:$('lessonDate').value,unit:Number($('completed').value),completed:Number($('completed').value),actual:$('actual').value,status:$('status').value,topic:'',note:$('note').value.trim(),homeworkText:$('note').value.trim()};
 const tracking=window.AYDA_ATTENDANCE?.collect?.();
 if(tracking)Object.assign(payload,tracking);
 const previous=payload.type==='group'?(data?.history||[]).find(r=>r.groupId===payload.groupId&&r.date===payload.date):null;
 const makeup=window.AYDA_MAKEUP_ATTENDANCE;
 const oldAttendance=!!previous||(payload.type==='group'&&makeup?.groupId===payload.groupId&&makeup?.date===payload.date);
 if(previous&&previous.status!=='İşlendi')throw Error('Bu tarihte zaten iptal/erteleme kaydı var. Yönetimden kontrol isteyin.');
 if(oldAttendance&&!tracking)throw Error('Bu tarihin ders raporu zaten kayıtlı. Eksik yoklama için öğrenci listesini işaretleyin.');
 if(payload.type==='group'&&payload.status==='İşlendi'&&!tracking)throw Error('Yoklama tamamlanmadan ders raporu gönderilemez. Öğrencileri işaretleyin.');
 if(payload.type==='group'&&payload.status==='İşlendi'&&!oldAttendance&&(payload.homeworkText.length<3||payload.homeworkText.length>1000))
   throw Error('Verilen ödevi yazın (en az 3 karakter).');
 await aydaVerifyDurationBackend(payload.actual);
  if(payload.type==='group'&&payload.status==='İşlendi'&&!oldAttendance)await aydaVerifyShareBackend();
 const saved=oldAttendance?await jsonp('saveAttendance',{payload:utf8Base64Url(JSON.stringify({groupId:payload.groupId,date:payload.date,...tracking}))}):await jsonp('save',{payload:utf8Base64Url(JSON.stringify(payload))});
 if(!saved?.saved)throw Error('Sunucu kayıt işlemini doğrulamadı.');
 const trackingVerified=!!tracking&&saved.trackingSaved===true&&saved.attendanceCount===tracking.attendance.length;
 const homeworkVerified=oldAttendance||payload.type!=='group'||payload.status!=='İşlendi'||(saved.homeworkSaved===true&&/^DO-[A-Za-z0-9-]{8,80}$/.test(saved.homeworkId||''));
 if(payload.type==='group'&&payload.status==='İşlendi'&&(!trackingVerified||!homeworkVerified))throw Error('Kayıt onayı eksik. Apps Script sürümünü kontrol edin, aynı raporu tekrar göndermeden önce yöneticiyle görüşün.');
 const confirmation=oldAttendance?'Eksik yoklama tamamlandı.':(payload.type==='group'&&payload.status==='İşlendi'?'Ders ve yoklama kaydedildi. Son adım: Ödevi WhatsApp grubuna yazın.':'Ders kaydı tamamlandı.');
 message('formMessage',confirmation,'success');
 lastSharedHomework=!oldAttendance&&payload.type==='group'&&payload.status==='İşlendi'?{
   id:saved.homeworkId,lessonId:saved.id,groupId:payload.groupId,
   groupName:data?.groups?.find(g=>g.id===payload.groupId)?.name||payload.groupId,
   date:payload.date,text:payload.homeworkText}:null;
 $('sendHomeworkToGroup').hidden=!lastSharedHomework;
 $('sendHomeworkToGroup').textContent='Ödevi WhatsApp grubuna yaz →';
 $('aydaShareHint').hidden=true;
 if(lastSharedHomework)window.dispatchEvent(new CustomEvent('ayda:homework-saved',{detail:lastSharedHomework}));
 $('note').value='';
 window.AYDA_ATTENDANCE?.resetAfterSave?.();
 try{
  data=await jsonp('overview');render();
  if(data.user.role==='admin')loadTrackingSummary();
 }catch(refreshError){
  message('formMessage',confirmation+' Liste güncellenemedi; sayfayı yenileyin.','success');
 }
 window.AYDA_MAKEUP_ATTENDANCE=null;
 window.dispatchEvent(new Event('ayda:saved'));
}catch(err){
 message('formMessage',err.unknownCommit?'Sunucudan kayıt onayı alınamadı. Yeniden kaydetmeden önce Google Sheets DERS_KAYITLARI sekmesini kontrol edin. ('+err.message+')':err.message);
}finally{b.disabled=false;b.textContent=$('lessonType').value==='group'&&$('status').value==='İşlendi'?'Yoklama + ödev + dersi kaydet':'Ders durumunu kaydet';}});

// Academic planning: one unit per scheduled class date; two further class dates for exam preparation.
function dateISO(d){return d.getUTCFullYear()+'-'+String(d.getUTCMonth()+1).padStart(2,'0')+'-'+String(d.getUTCDate()).padStart(2,'0');}
function parseISO(s){return new Date(s+'T12:00:00Z');}
function futureLessons(g,count){
 const names=['Pazar','Pazartesi','Salı','Çarşamba','Perşembe','Cuma','Cumartesi'];
 const days=new Set(data.schedule.filter(x=>x.groupId===g.id&&x.status==='Aktif').map(x=>x.day));
 if(!days.size||!g.start)return null;
 const base=g.completed>0?data.today:(g.start>data.today?g.start:data.today),d=parseISO(base),out=[];
 for(let i=0;i<900&&out.length<count;i++){const day=dateISO(d);if(day>=g.start&&days.has(names[d.getUTCDay()]))out.push(day);d.setUTCDate(d.getUTCDate()+1);}
 return out.length===count?out:null;
}
function plan(g){const total=Number(g.total)||24,remaining=Math.max(0,total-Number(g.completed||0)),dates=futureLessons(g,remaining+2);if(!dates)return {unit:'Program eksik',exam:'Program eksik',remaining};return {unit:remaining?dates[remaining-1]:'Tamamlandı',exam:dates[remaining+1],remaining};}
function fillAdminSelectors(){const ts=$('newGroupTeacher'),old=ts.value;ts.replaceChildren(new Option('Öğretmen seçin',''));for(const t of data.teachers||[])if(t.status==='Aktif')ts.add(new Option(t.name+' ('+t.id+')',t.id));ts.value=old;const es=$('editGroupId'),prev=es.value;es.replaceChildren(new Option('Grup seçin',''));for(const g of data.groups)es.add(new Option(g.name+' · '+g.level,g.id));es.value=prev;syncEditGroup();if(!$('newGroupStart').value)$('newGroupStart').value=data.today;}
function syncEditGroup(){const g=data?.groups.find(x=>x.id===$('editGroupId').value);$('editCompleted').value=g?g.completed:'';$('editStudents').value=g?g.students:'';if($('editGroupWhatsapp'))$('editGroupWhatsapp').value=g?.whatsapp||'';}
$('editGroupId').addEventListener('change',syncEditGroup);
function academicStage(g){const n=Math.max(0,Math.min(24,Number(g.completed)||0));return n===0?'new':n>=24?'done':n>=20?'nearing':'ongoing';}
function academicDate(s){if(!s||s==='Program eksik'||s==='Tamamlandı')return s||'—';const [y,m,d]=s.split('-');return d+'.'+m+'.'+y;}
function renderAcademic(){
 const root=$('academicSummary'),kpis=$('academicKpis');if(!root||!kpis)return;
 root.replaceChildren();kpis.replaceChildren();
 const level=$('academicLevel').value,status=$('academicStatus').value,q=$('academicSearch').value.trim().toLocaleLowerCase('tr');
 const groups=data.groups.filter(g=>{const teacher=(data.teachers||[]).find(t=>t.id===g.teacherId)?.name||'';return (!level||g.level===level)&&(!status||academicStage(g)===status)&&(!q||(g.name+' '+teacher+' '+g.level).toLocaleLowerCase('tr').includes(q));});
 const average=groups.length?Math.round(groups.reduce((sum,g)=>sum+Math.min(24,Math.max(0,Number(g.completed)||0)),0)/groups.length/24*100):0;
 for(const [label,value] of [['Görüntülenen grup',groups.length],['Ortalama ilerleme',average+'%'],['Bitmeye yakın',groups.filter(g=>academicStage(g)==='nearing').length],['Müfredatı tamamlayan',groups.filter(g=>academicStage(g)==='done').length]]){const card=$el('div','dash-kpi');card.append($el('span','muted',label),$el('strong','',String(value)));kpis.append(card);}
 for(const g of groups){const completed=Math.max(0,Math.min(24,Number(g.completed)||0)),x=plan({...g,total:24}),stage=academicStage(g),teacher=(data.teachers||[]).find(t=>t.id===g.teacherId)?.name||g.teacherId||'—';const card=$el('article','academic-card'),top=$el('div','academic-top'),heading=$el('div');heading.append($el('span','level-tag',g.level),$el('h3','',g.name),$el('p','muted',teacher+' · '+(Number(g.students)||0)+' öğrenci'));top.append(heading,$el('span','academic-state '+stage,({new:'Başlamadı',ongoing:'Devam ediyor',nearing:'Bitmek üzere',done:'Müfredat tamamlandı'})[stage]));card.append(top);
 const line=$el('div','academic-numbers');line.append($el('strong','',completed+' / 24'),$el('span','muted','%'+Math.round(completed/24*100)+' tamamlandı · '+(24-completed)+' ünite kaldı'));card.append(line);
 const tiles=$el('div','unit-tiles');tiles.setAttribute('aria-label',completed+' / 24 ünite tamamlandı');for(let i=1;i<=24;i++){const tile=$el('span','unit-tile'+(i<=completed?' filled':''),String(i));tile.title=i+'. ünite '+(i<=completed?'tamamlandı':'bekliyor');tiles.append(tile);}card.append(tiles);
 const dates=$el('div','academic-dates');for(const [label,value] of [['24. ünite tahmini',academicDate(x.unit)],['2 ek sınav hazırlığı dersi',academicDate(x.exam)]]){const block=$el('div');block.append($el('small','',label),$el('strong','',value));dates.append(block);}card.append(dates);
 const last=data.history.filter(h=>h.groupId===g.id&&h.status==='İşlendi').sort((a,b)=>b.date.localeCompare(a.date))[0];if(last)card.append($el('p','academic-last','Son rapor · '+academicDate(last.date)+' · '+(last.note||last.topic||'Bilgi yok')));
 root.append(card);
 }
 if(!groups.length)root.append($el('div','card empty','Bu filtrelere uygun grup bulunamadı.'));
}
for(const id of ['academicLevel','academicStatus','academicSearch'])$(id).addEventListener(id==='academicSearch'?'input':'change',renderAcademic);

async function adminAction(action,payload,output,button){button.disabled=true;clear(output);try{const r=await jsonp(action,{payload:utf8Base64Url(JSON.stringify(payload))});if(r.key){const msg=$el('div','message success','Yeni öğretmen '+r.name+' ('+r.teacherId+') oluşturuldu. Giriş anahtarı yalnızca burada gösterilir.');const area=$el('textarea');area.value=r.key;area.readOnly=true;area.rows=3;$(output).append(msg,area);}else message(output,(r.name||r.id||'Kayıt')+' başarıyla kaydedildi.','success');data=await jsonp('overview');render();}catch(e){message(output,e.message);}finally{button.disabled=false;}}
$('teacherCreateForm').addEventListener('submit',e=>{e.preventDefault();adminAction('createTeacher',{name:$('newTeacherName').value.trim()},'teacherCreateResult',e.submitter||$('teacherCreateForm').querySelector('button'));});
$('groupCreateForm').addEventListener('submit',e=>{e.preventDefault();const days=[...$('newGroupDays').querySelectorAll('input:checked')].map(x=>x.value);if(!days.length){message('groupCreateResult','En az bir ders günü seçin.');return;}adminAction('createGroup',{name:$('newGroupName').value.trim(),level:$('newGroupLevel').value,teacherId:$('newGroupTeacher').value,start:$('newGroupStart').value,students:Number($('newGroupStudents').value),total:Number($('newGroupTotal').value),completed:0,days,time:$('newGroupTime').value,end:$('newGroupEnd').value},'groupCreateResult',e.submitter||$('groupCreateForm').querySelector('button'));});
$('groupUpdateForm').addEventListener('submit',e=>{e.preventDefault();adminAction('updateGroup',{id:$('editGroupId').value,completed:Number($('editCompleted').value),students:Number($('editStudents').value),whatsapp:$('editGroupWhatsapp').value.trim()},'groupUpdateResult',e.submitter||$('groupUpdateForm').querySelector('button'));});

/** Student detail stays inside the authenticated manager screen; never in publicDashboard. */
function fillPasswordTargets(){
 const el=$('passwordTarget');if(!el||!data)return;
 const current=el.value;el.replaceChildren(new Option('Yönetici parolası','ADMIN'));
 for(const a of (data.accounts||[]).filter(x=>x.status==='Aktif'))el.add(new Option(a.name+' · Öğretmen',a.id));
 if([...el.options].some(x=>x.value===current))el.value=current;
}
async function loadTrackingSummary(){
 const root=$('trackingResults');if(!root||!data||data.user.role!=='admin')return;
 root.replaceChildren($el('p','muted','Öğrenci verileri yükleniyor...'));
 try{
  const result=await jsonp('trackingSummary');
  if(!data||data.user.role!=='admin')return;
  root.replaceChildren();
  const groups=result.groups||[],alerts=result.alerts||[],students=result.students||[];
  const totals=groups.reduce((a,g)=>({present:a.present+g.present,absent:a.absent+g.absent,missing:a.missing+g.homeworkMissing,done:a.done+g.homeworkDone}),{present:0,absent:0,missing:0,done:0});
  const overview=$el('div','tracking-kpis');
  const percent=(n,d)=>d?Math.round(n/d*100)+'%':'—';
  for(const [label,value] of [['Takip edilen öğrenci',students.length],['Katılım',percent(totals.present,totals.present+totals.absent)],['Ödev yapmayan kayıt',totals.missing],['İlgilenilecek öğrenci',alerts.length]]){
   const card=$el('div','tracking-kpi');card.append($el('span','muted',label),$el('strong','',value));overview.append(card);
  }
  root.append(overview,$el('h3','','Dikkat gerektiren öğrenciler'));
  if(!alerts.length)root.append($el('p','muted','Şimdilik uyarı yok. Yoklama kayıtları oluştukça bu alan güncellenecek.'));
  else{
   const list=$el('div','tracking-alerts');
   for(const a of alerts.slice(0,40)){
    const item=$el('div','tracking-alert'),left=$el('div');
    left.append($el('strong','',a.name),$el('div','muted',a.group));
    const details=$el('span','tracking-warning',(a.consecutiveAbsent?'Üst üste '+(a.absenceStreak||3)+' devamsızlık · ':'')+'Son 4 kontrolde '+a.recentHomeworkMissing+' eksik ödev');
    item.append(left,details);list.append(item);
   }
   root.append(list);
  }
  root.append($el('h3','','Grupların katılım ve ödev durumu'));
  const table=$el('table','data-table'),head=$el('tr');
  for(const label of ['Grup','Öğrenci','Katılım','Mazeretli','Ödev tamamlama'])head.append($el('th','',label));table.append(head);
  for(const g of groups){
   const tr=$el('tr');for(const value of [g.name,g.students,percent(g.present,g.present+g.absent),g.excused,percent(g.homeworkDone,g.homeworkDone+g.homeworkMissing)])tr.append($el('td','',value));table.append(tr);
  }
  const scroll=$el('div','summarytable');scroll.append(table);root.append(scroll);
  root.append($el('p','tiny','Uyarılar: üst üste 3 mazeretsiz devamsızlık veya son 4 kontrol edilen ödevden 3 eksik. Mazeretliler ayrıca gösterilir; kontrol edilmeyen ödevler eksik sayılmaz.'));
 }catch(e){root.replaceChildren($el('p','muted','Öğrenci takip raporu henüz etkin değil: '+e.message));}
}
$('passwordForm').addEventListener('submit',async e=>{
 e.preventDefault();
 if(data?.user.role!=='admin')return;
 const password=$('passwordNew').value,target=$('passwordTarget').value,confirmPassword=$('passwordConfirm').value;
 if(password!==confirmPassword){message('passwordMessage','Parolalar aynı değil.');return;}
 const button=$('passwordSave');button.disabled=true;clear('passwordMessage');
 try{
  const result=await jsonp('setPassword',{payload:utf8Base64Url(JSON.stringify({target,password}))});
  if(result.isSelf){authKey=password;sessionStorage.setItem('aydaKey',password);}
  $('passwordNew').value='';$('passwordConfirm').value='';
  message('passwordMessage','Yeni parola kaydedildi. Bu hesaba ait eski anahtar geçersiz oldu.','success');
  data=await jsonp('overview');render();
 }catch(err){message('passwordMessage',err.message);}finally{button.disabled=false;}
});
$('ownPasswordForm').addEventListener('submit',async e=>{
 e.preventDefault();
 const password=$('ownPassword').value,confirmation=$('ownPasswordRepeat').value;
 if(password!==confirmation){message('ownPasswordMessage','Parolalar aynı değil.');return;}
 const button=$('ownPasswordButton');button.disabled=true;clear('ownPasswordMessage');
 try{
  const result=await jsonp('setPassword',{payload:utf8Base64Url(JSON.stringify({password}))});
  if(result.isSelf){authKey=password;sessionStorage.setItem('aydaKey',password);}
  $('ownPassword').value='';$('ownPasswordRepeat').value='';
  message('ownPasswordMessage','Parolanız güncellendi. Bundan sonra bu parolayla giriş yapabilirsiniz.','success');
 }catch(err){message('ownPasswordMessage',err.message);}finally{button.disabled=false;}
});
$('trackingRefresh').addEventListener('click',loadTrackingSummary);
window.addEventListener('ayda:login',()=>{if(data?.user.role==='admin')loadTrackingSummary();});

const qs=new URLSearchParams(location.search),fromLink=qs.get('key')||'';if(fromLink){history.replaceState(null,'',location.pathname);login(fromLink);}else{const previous=sessionStorage.getItem('aydaKey');if(previous)login(previous);}
