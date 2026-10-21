"use strict";
/* AYDA_SESSION_V2 */
const aydaSession={save(key){try{localStorage.setItem('aydaAdminSession',JSON.stringify({key,expires:Date.now()+8*3600000}));}catch(_){}},read(){try{const x=JSON.parse(localStorage.getItem('aydaAdminSession')||'null');if(x?.key&&x.expires>Date.now())return x.key;localStorage.removeItem('aydaAdminSession');}catch(_){}return '';},clear(){try{localStorage.removeItem('aydaAdminSession')}catch(_){}}};

(()=>{
 const viewerSession={save(key){try{localStorage.setItem('aydaViewerSession',JSON.stringify({key,expires:Date.now()+180*86400000}));}catch(_){}},read(){try{const x=JSON.parse(localStorage.getItem('aydaViewerSession')||'null');if(x?.key&&x.expires>Date.now())return x.key;localStorage.removeItem('aydaViewerSession');}catch(_){}return '';},clear(){try{localStorage.removeItem('aydaViewerSession')}catch(_){}}};
 const $=id=>document.getElementById(id);
 const isMonitor=()=>['admin','viewer'].includes(overview?.user?.role);
 const isAdmin=()=>overview?.user?.role==='admin';
 const payload64=s=>{const b=new TextEncoder().encode(s);let a='';for(const c of b)a+=String.fromCharCode(c);return btoa(a).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');};
 window.AYDA_OWNER_BRIDGE={
  api:(action,params={})=>{if(!token||!isMonitor())throw Error('İzleme oturumu gerekli.');return api(action,token,params);},
  overview:()=>token&&isMonitor()?overview:null,
  tracking:()=>token&&isMonitor()?tracking:null,
  reminders:()=>token&&isMonitor()?reminders:null,
  ready:()=>!!token&&isMonitor(),
  canManage:()=>!!token&&isAdmin(),
  isViewer:()=>!!token&&overview?.user?.role==='viewer',
  openTab:next=>activate(next)
 };
 const node=(tag,cls,value)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(value!==undefined)e.textContent=String(value);return e;};
 const add=(parent,tag,cls,value)=>{const e=node(tag,cls,value);parent.append(e);return e;};
 const showEmpty=(id,label)=>{const root=$(id);if(root)root.replaceChildren(node('div','owner-empty',label));};
 const formats={danger:'Öncelikli',watch:'Takip edilmeli',regular:'Düzenli',untracked:'Henüz veri yok'};
 const days=['Pazartesi','Salı','Çarşamba','Perşembe','Cuma','Cumartesi','Pazar'];
 let token='',overview=null,tracking=null,reminders=null,contactDirectory=null,lessonHomework=null,activeApi='',loading=false,requestIndex=0,lessonLimit=40,tab='overview',exportRows=[];
 let ownerDataGeneration=0,homeworkState='idle';
 const API=String(window.AYDA_API_URL||'').trim();
 const fmt=x=>/^\d{4}-\d{2}-\d{2}$/.test(String(x||''))?x.slice(8,10)+'.'+x.slice(5,7)+'.'+x.slice(0,4):(x||'—');
 const round=(n,d)=>d?Math.round(n/d*100)+'%':'—';
 const unit=g=>Math.max(1,Number(g?.total)||24);
 const unitsDone=g=>Math.max(0,Number(g?.completed)||0);
 const today=()=>overview?.today||new Date().toISOString().slice(0,10);
 const status=x=>(x&&formats[x.riskLevel])?x.riskLevel:'untracked';
 const gName=id=>(overview?.groups||[]).find(g=>g.id===id)?.name||id||'—';
 const tName=id=>(overview?.teachers||[]).find(t=>t.id===id)?.name||id||'—';
 const activeGroups=()=>overview?.groups?.filter(g=>g.status==='Aktif')||[];
 const lessons=()=>[...(overview?.history||[]).filter(r=>String(r.date||'')>='2026-10-21').map(r=>({...r,type:'Grup',groupName:gName(r.groupId)})),...(overview?.privateHistory||[]).filter(r=>String(r.date||'')>='2026-10-21').map(r=>({...r,type:'Özel',groupName:r.student||'Özel ders'}))].sort((a,b)=>String(b.date||'').localeCompare(String(a.date||'')));
 const hours=value=>{const s=String(value||'').trim(),m=s.match(/^(\d{1,3}):(\d{2})$/);return m?(+m[1]+(+m[2])/60):Number(s)||0;};
 const hoursText=n=>Number(n||0).toLocaleString('tr-TR',{maximumFractionDigits:2});
 const difference=(a,b)=>{const x=Date.parse(a+'T00:00:00Z'),y=Date.parse(b+'T00:00:00Z');return Number.isFinite(x)&&Number.isFinite(y)?Math.round((x-y)/86400000):Infinity;};
 const pill=(label,kind)=>node('span','pill '+(kind||'untracked'),label);
 const dateStatus=group=>{const rest=Math.max(0,unit(group)-unitsDone(group));if(rest===0)return {unit:'Tamamlandı',exam:'Tamamlandı'};
  const set=new Set((overview.schedule||[]).filter(r=>r.groupId===group.id).map(r=>r.day));
  if(!set.size)return {unit:'Program eksik',exam:'Program eksik'};
  const w=['Pazar','Pazartesi','Salı','Çarşamba','Perşembe','Cuma','Cumartesi'];
  const start=today();
  const d=new Date(start+'T00:00:00Z'),matches=[];
  if(!Number.isFinite(d.getTime()))return {unit:'Program eksik',exam:'Program eksik'};
  for(let i=0;i<800&&matches.length<rest+2;i++){if(set.has(w[d.getUTCDay()]))matches.push(d.toISOString().slice(0,10));d.setUTCDate(d.getUTCDate()+1);}
  return {unit:fmt(matches[rest-1]),exam:fmt(matches[rest+1])};
 };
 const candidates=()=>{
  const m=API.match(/\/s\/([A-Za-z0-9_-]+)\/exec(?:$|\?)/);
  if(!m)return [API];
  return [...new Set([API,'https://script.google.com/macros/s/'+m[1]+'/exec','https://script.google.com/a/macros/aydadil.com/s/'+m[1]+'/exec','https://script.google.com/a/aydadil.com/macros/s/'+m[1]+'/exec'])];
 };
 function apiRequest(url,action,key,params={}){
  return new Promise((resolve,reject)=>{
   if(!/^https:\/\/script\.google\.com\/(?:a\/macros\/[^/]+\/s\/|a\/[^/]+\/macros\/s\/|macros\/s\/)/.test(url)){reject(Error('API adresi geçersiz.'));return;}
   const cb='ayda_cb_'+Date.now()+'_'+(++requestIndex),script=document.createElement('script'),u=new URL(url);
   let finished=false;
   const finish=(error,data)=>{if(finished)return;finished=true;clearTimeout(timer);delete window[cb];script.remove();error?reject(error):resolve(data);};
   const transport=msg=>{const e=Error(msg);e.transport=true;return e;};
   const timeoutMs=action==='backupSetup'?90000:action==='overview'?45000:action==='vaultExport'?50000:30000;
   const timer=setTimeout(()=>finish(transport('Google işlemi '+Math.round(timeoutMs/1000)+' saniyede yanıt vermedi. İşlem Google tarafında sürmüş olabilir; yedek durumunu kontrol edin.')),timeoutMs);
   window[cb]=result=>result?.ok?finish(null,result.data):finish(Error(result?.error||'Sunucu geçersiz cevap verdi.'));
   u.searchParams.set('action',action);u.searchParams.set('callback',cb);u.searchParams.set('key',key);for(const [k,v] of Object.entries(params))u.searchParams.set(k,v);
   script.onerror=()=>finish(transport('Google Apps Script bağlantısı kurulamadı.'));
   script.onload=()=>{if(!finished)finish(transport('Apps Script beklenen yanıtı döndürmedi.'));};
   script.src=u.toString();document.head.append(script);
  });
 }
 async function aydaOwnerApiNetwork(action,key,params={}){
  const activity=window.AYDA_ACTIVITY?.start(action);
  let activitySuccess=false;
  try{
  const readOnly=['overview','trackingSummary','reminders','integrityStatus','backupStatus','studentNotes','vaultExport','feedbackInbox','contactDirectory','homeworkTasks','lessonHomework'].includes(action);let err;
  for(const address of (readOnly?[...new Set([activeApi,...candidates()].filter(Boolean))]:[activeApi||candidates()[0]])){try{const data=await apiRequest(address,action,key,params);activeApi=address;activitySuccess=true;return data;}catch(e){err=e;if(!e.transport)throw e;if(/saniyede yanıt vermedi/.test(e.message||''))break;}}
  throw err||Error('Google Apps Script bağlantısı kurulamadı.');
  }finally{window.AYDA_ACTIVITY?.finish(activity,activitySuccess);}
 }
/* GO1: Coalesce pending identical read-only requests; never cache completed reads or writes. */
 const activeReads=new Map();
 const readActions=new Set(['overview','trackingSummary','reminders','integrityStatus','backupStatus','studentNotes','vaultExport','feedbackInbox','contactDirectory','homeworkTasks','lessonHomework']);
 function api(action,key,params={}){
  if(!readActions.has(action))return aydaOwnerApiNetwork(action,key,params);
  const identity=JSON.stringify([key,action,params]);
  const pending=activeReads.get(identity);if(pending)return pending;
  const promise=aydaOwnerApiNetwork(action,key,params);
  activeReads.set(identity,promise);
  const finish=()=>{if(activeReads.get(identity)===promise)activeReads.delete(identity);};
  promise.then(finish,finish);
  return promise;
 }
 const errorMessage=message=>{const target=$('ownerError');if(target)target.textContent=message||'';};
 const setLoading=value=>{loading=value;$('ownerLoginButton').disabled=value;$('ownerRefresh').disabled=value;};
 function activate(next){
  const name=['overview','students','attendance','groups','health','lessons','teachers','schedule','alerts','messages'].includes(next)?next:'overview';
  tab=name;
  for(const p of document.querySelectorAll('.owner-panel'))p.hidden=p.id!=='owner-'+name;
  for(const b of $('ownerNav').querySelectorAll('button[data-tab]')){b.classList.toggle('active',b.dataset.tab===name);b.setAttribute('aria-current',b.dataset.tab===name?'page':'false');}
  if(overview)renderAll();
  if(name==='messages'&&token)window.dispatchEvent(new Event('ayda:messages-open'));
  try{sessionStorage.setItem('aydaOwnerTab',name);}catch(_){}
 }
 async function login(key){
  if(loading)return;const provided=String(key||'');if(!provided){$('ownerLoginError').textContent='Yönetici parolası gerekli.';return;}
  setLoading(true);$('ownerLoginError').textContent='';errorMessage('');
  try{
   const result=await api('overview',provided);
   if(!['admin','viewer'].includes(result?.user?.role))throw Error('Bu sayfa için yönetim veya izleme hesabı gerekir.');
   ++ownerDataGeneration;token=provided;overview=result;
   tracking=null;reminders=null;lessonHomework=null;contactDirectory=null;homeworkState='idle';
   if(isAdmin()){sessionStorage.setItem('aydaKey',token);aydaSession.save(token);}
   else viewerSession.save(token);
   document.body.classList.toggle('ayda-viewer-mode',!isAdmin());
   const note=$('ownerLoginHint');if(note)note.textContent=isAdmin()?'Admin oturumu açık.':'İzleme cihazı tanındı. Bundan sonra aynı tarayıcıdan otomatik giriş yapılır.';
   if(!isAdmin()){const ownerHeaderLink=document.getElementById('aydaOwnerMainLink');if(ownerHeaderLink)ownerHeaderLink.hidden=true;}
   window.dispatchEvent(new CustomEvent('ayda:owner-role',{detail:{role:overview.user.role}}));
   $('ownerLogin').hidden=true;$('ownerApp').hidden=false;$('ownerLogout').hidden=false;
   const skip=$('ownerSkip');if(skip){skip.href='#ownerApp';skip.textContent='Ana içeriğe geç';}
   $('ownerKey').value='';
   if(!$('ownerTeacherMonth').value)$('ownerTeacherMonth').value=today().slice(0,7);
   if(!$('ownerLessonMonth').value)$('ownerLessonMonth').value=today().slice(0,7);
   // Genel bakış hazır olur olmaz göster; akademik ayrıntılar paralel yüklenir.
   activate(['messages','alerts','attendance','students','groups','health','lessons','teachers','schedule','accounts'].includes(location.hash.slice(1))?location.hash.slice(1):(sessionStorage.getItem('aydaOwnerTab')||'overview'));
   window.dispatchEvent(new Event('ayda:owner-ready'));
   loadTracking().catch(e=>errorMessage('Takip yüklenemedi: '+e.message));

  }catch(e){if(viewerSession.read()===provided)viewerSession.clear();if(aydaSession.read()===provided)aydaSession.clear();token='';overview=null;document.body.classList.remove('ayda-viewer-mode');$('ownerLogin').hidden=embeddedHealth;$('ownerApp').hidden=true;if(embeddedHealth)window.parent.postMessage({aydaHealthEmbed:1,action:'auth-error'},location.origin);$('ownerLogout').hidden=true;$('ownerLoginError').textContent=e.message;}
  finally{setLoading(false);}
 }
 async function loadTracking(){
  // GO4: Start all requests together; paint warnings without waiting for homework.
  const requestedKey=token,generation=++ownerDataGeneration;
  const isCurrent=()=>!!token&&token===requestedKey&&generation===ownerDataGeneration;
  let coreApplied=false;
  tracking=null;reminders=null;lessonHomework=null;homeworkState='loading';
  // Attach both handlers immediately; no unhandled rejection on slow Google reads.
  const homeworkRead=api('lessonHomework',requestedKey).then(
   value=>{
    if(!isCurrent())return;
    lessonHomework=value;homeworkState='ready';
    if(coreApplied){renderAll();window.dispatchEvent(new Event('ayda:owner-details-ready'));}
   },
   ()=>{
    if(!isCurrent())return;
    lessonHomework=null;homeworkState='error';
    if(coreApplied){renderAll();window.dispatchEvent(new Event('ayda:owner-details-ready'));}
   }
  );
  const results=await Promise.allSettled([
   api('trackingSummary',requestedKey),api('reminders',requestedKey)
  ]);
  if(!isCurrent())return false;
  const t=results[0];
  tracking=t.status==='fulfilled'&&t.value?.scope==='all'?t.value:null;
  reminders=results[1].status==='fulfilled'?results[1].value:null;
  if(reminders){const items=(reminders.items||[]).filter(x=>String(x.date||'')>='2026-10-21');reminders={...reminders,items,total:items.length,reports:items.filter(x=>x.type==='report').length,attendance:items.filter(x=>x.type==='attendance').length};}
  contactDirectory={teachers:(overview?.teachers||[]).filter(t=>t.phone).map(t=>({id:t.id,teacherId:t.id,phone:t.phone,status:t.status})),students:[]};
  if(!tracking)errorMessage('Öğrenci takip verileri henüz yüklenemedi. Diğer bilgiler kullanılabilir.');
  else errorMessage('');
  coreApplied=true;
  renderAll();
  window.dispatchEvent(new Event('ayda:owner-data-ready'));
  void homeworkRead;
  return true;
 }
 async function refresh(){
  if(!token||loading)return;setLoading(true);
  try{const key=token,r=await api('overview',key);if(!token||token!==key)return;if(!['admin','viewer'].includes(r?.user?.role))throw Error('Akademik izleme yetkisi doğrulanamadı.');overview=r;const applied=await loadTracking();if(applied&&token===key)window.dispatchEvent(new Event('ayda:owner-ready'));}
  catch(e){errorMessage('Güncelleme başarısız: '+e.message);}
  finally{setLoading(false);}
 }
 function robust(id,fn){
  try{fn();}catch(e){const root=$(id);if(root)root.replaceChildren(node('p','owner-section-error','Bu bölüm yüklenemedi: '+e.message));}
 }
 function kpi(title,value,sub,kind){
  const el=node('article','owner-kpi '+(kind||''));add(el,'span','',title);add(el,'strong','',value);if(sub)add(el,'small','',sub);return el;
 }
 function renderKpis(){
  // Ana ekran göstergeleri hiçbir yardımcı menü/etiket elemanına bağımlı değildir.
  const root=document.getElementById('ownerKpis');if(!root)return;
  const safeArray=x=>Array.isArray(x)?x:[];
  const groups=safeArray(overview?.groups),teachers=safeArray(overview?.teachers);
  const records=safeArray(overview?.history).filter(x=>String(x?.date||'')>='2026-10-21');
  const privateRecords=safeArray(overview?.privateHistory).filter(x=>String(x?.date||'')>='2026-10-21');
  const currentMonth=String(overview?.today||new Date().toISOString().slice(0,10)).slice(0,7);
  const totalHours=[...records,...privateRecords].filter(x=>String(x.date||'').startsWith(currentMonth)&&x.status==='İşlendi').reduce((sum,x)=>sum+hours(x.actual),0);
  const result=[
   ['Bugünkü planlı ders',safeArray(overview?.todayLessons).length],
   ['Eksik akademik kayıt',reminders?.total??'—'],
   ['Aktif grup',groups.filter(g=>g.status==='Aktif').length],
   ['Aktif öğretmen',teachers.filter(t=>t.status==='Aktif').length],
   ['Kayıtlı öğrenci',tracking? safeArray(tracking.students).length:'—'],
   ['Bu ay işlenen saat',hoursText(totalHours)]
  ];
  const cards=result.map(([label,value])=>{
   const card=document.createElement('article');card.className='owner-kpi';
   const heading=document.createElement('span');heading.append(document.createTextNode(String(label)));
   const number=document.createElement('strong');number.append(document.createTextNode(String(value)));
   card.append(heading,number);return card;
  });
  root.replaceChildren(...cards);
  const badge=document.getElementById('ownerAlertBadge');
  if(badge)badge.replaceChildren(document.createTextNode((tracking||reminders)?'('+ (safeArray(tracking?.alerts).length+(Number(reminders?.total)||0))+')':''));
  const updated=document.getElementById('ownerUpdated');
  if(updated)updated.replaceChildren(document.createTextNode('Güncellendi: '+new Date().toLocaleString('tr-TR')));
 }
 function renderHighlights(){
  const root=$('ownerHighlights');if(!root)return;root.replaceChildren();
  const alerts=tracking?.alerts||[],near=activeGroups().filter(g=>unit(g)-unitsDone(g)<=3&&unit(g)>unitsDone(g));
  const coming=activeGroups().filter(g=>g.start&&g.start>=today()&&difference(g.start,today())<=7);
  if(reminders?.total){
   for(const item of (reminders.items||[]).slice(0,3)){
    const r=add(root,'article','note-card warn');
    add(r,'strong','',(item.type==='attendance'?'Eksik yoklama':'Eksik ders raporu')+' · '+(item.group||'Grup'));
    add(r,'p','','Tarih: '+fmt(item.date)+' · '+tName(item.teacherId));
    r.append(quick('Eksikleri incele →',()=>activate('alerts')));
   }
   if(reminders.total>3){const extra=add(root,'article','note-card');add(extra,'p','','Diğer '+(reminders.total-3)+' eksik kayıt');extra.append(quick('Tümünü gör →',()=>activate('alerts')));}
  }else if(!reminders){const r=add(root,'article','note-card');add(r,'strong','','Eksik kayıt kontrolü yapılamadı');r.append(quick('Kontrol ekranına git →',()=>activate('alerts')));}
  for(const a of alerts.slice(0,2)){
   const c=add(root,'article','note-card danger');add(c,'strong','',a.name+' · '+a.group);
   const p=[];if(a.consecutiveAbsent)p.push('Üst üste '+(a.absenceStreak||3)+' mazeretsiz devamsızlık');if(a.recentHomeworkMissing)p.push('Son 4 kontrol edilen ödevde '+a.recentHomeworkMissing+' eksik');
   add(c,'p','',p.join(' · '));
   c.append(quick('Öğrenciye git →',()=>{activate('students');$('ownerStudentSearch').value=a.name;renderStudents();}));
  }
  for(const g of near.slice(0,2)){const c=add(root,'article','note-card warn');add(c,'strong','',g.name+' · Bitişe yakın');add(c,'p','','Kalan '+(unit(g)-unitsDone(g))+' ünite · '+tName(g.teacherId));}
  for(const g of coming.slice(0,1)){const c=add(root,'article','note-card');add(c,'strong','',g.name+' · Yeni grup');add(c,'p','','Başlangıç: '+fmt(g.start));}
  if(!root.children.length)showEmpty('ownerHighlights',tracking?'Öncelikli takip gerektiren kayıt yok.':'Öğrenci takip verileri yüklenince uyarılar burada görünür.');
 }
 function quick(label,onClick){const b=node('button','owner-link',label);b.type='button';b.addEventListener('click',onClick);return b;}
 function lessonRow(r,compact=false){
  const el=node('article','owner-lesson'+(compact?' compact':'')),head=add(el,'div','owner-lesson-head');
  const text=add(head,'div');add(text,'strong','',r.groupName||'—');add(text,'small','',fmt(r.date)+' · '+tName(r.teacherId)+' · '+r.type);
  head.append(pill(r.status||'—',r.status==='İşlendi'?'regular':'watch'));
  const facts=add(el,'div','owner-lesson-facts');
  for(const x of [(r.actual?'Ders süresi: '+r.actual+' saat':'Saat belirtilmedi'),(r.completed!==undefined&&r.completed!==''?'Tamamlanan ünite: '+r.completed:''),(r.plannedStart?'Plan: '+r.plannedStart+' – '+(r.plannedEnd||'—'):'')])if(x)add(facts,'span','',x);
  if(r.student&&r.type==='Özel')add(el,'p','owner-note','Öğrenci: '+r.student);
  if(r.topic)add(el,'p','owner-note','Konu: '+r.topic);
  const hw=r.type==='Grup'?(lessonHomework?.items||[]).find(x=>x.lessonId===r.id):null;
  if(r.note&&(!hw||r.note!==hw.text))add(el,'p','owner-note owner-note-teacher','Öğretmen notu: '+r.note);
  if(hw&&!compact){
   const detail=add(el,'details','ayda-lesson-homework-detail');
   add(detail,'summary','','Verilen sınıf ödevini gör');
   add(detail,'p','',hw.text);
   add(detail,'p','ayda-share-manager-status',hw.shareStatus==='Paylaşıldı'?'WhatsApp grubuna gönderildi (öğretmen onayı)':hw.shareStatus==='Bekliyor'?'WhatsApp grup paylaşımı bekliyor':'Önceki kayıt · paylaşım bilgisi yok');
  }
  return el;
 }
 function renderOverview(){
  const todayRows=(overview.todayLessons||[]),todayRoot=$('ownerToday');if(!todayRoot)return;todayRoot.replaceChildren();
  for(const r of todayRows){const c=add(todayRoot,'div','owner-schedule-card');add(c,'strong','',r.group||gName(r.groupId));add(c,'small','',r.start+' – '+r.end+' · '+tName((overview.groups||[]).find(g=>g.id===r.groupId)?.teacherId));}
  if(!todayRows.length)showEmpty('ownerToday','Bugün planlı ders yok.');
  const r=$('ownerRecent');if(!r)return;r.replaceChildren();for(const x of lessons().slice(0,5))r.append(lessonRow(x,true));if(!r.children.length)showEmpty('ownerRecent','Henüz ders kaydı yok.');
  const preview=$('ownerGroupPreview');if(!preview)return;preview.replaceChildren();
  const all=orderedGroups(overview.groups||[]);
  renderGroupTotals('ownerGroupPreviewStats',all);
  for(const group of all)preview.append(groupCard(group));
  if(!all.length)showEmpty('ownerGroupPreview','Kayıtlı grup bulunamadı.');
 }
 function orderedGroups(list){
  return (Array.isArray(list)?list:[]).slice().sort((a,b)=>{
   const rank=g=>g.status==='Aktif'?0:g.status==='Tamamlandı'?2:1;
   return rank(a)-rank(b)||String(a.name||'').localeCompare(String(b.name||''),'tr');
  });
 }
 function groupLatest(id){
  return (overview.history||[]).filter(r=>r.groupId===id).sort((a,b)=>String(b.date||'').localeCompare(String(a.date||'')))[0]||null;
 }
 function groupProgram(id){return (overview.schedule||[]).filter(r=>r.groupId===id);}
 function groupProgramComplete(g){
  const plan=groupProgram(g.id);
  return plan.length>0&&plan.every(p=>p.start&&p.end&&p.end>p.start);
 }
 function renderGroupTotals(id,groups){
  const target=$(id);if(!target)return;target.replaceChildren();
  const active=groups.filter(g=>g.status==='Aktif');
  const roster=Array.isArray(tracking?.students)?tracking.students:null;
  const values=[
   ['Toplam grup',groups.length],
   ['Aktif grup',active.length],
   ['Grup kayıtlarındaki öğrenci',groups.reduce((n,g)=>n+(Number(g.students)||0),0)],
   ['Yoklama listesindeki öğrenci',roster?roster.filter(s=>groups.some(g=>g.id===s.groupId)).length:'Yükleniyor'],
   ['Programı eksik aktif grup',active.filter(g=>!groupProgramComplete(g)).length]
  ];
  for(const [label,value] of values){const card=add(target,'div','ayda-partner-group-stat');add(card,'strong','',String(value));add(card,'span','',label);}
 }
 function groupCard(g){
  const total=unit(g),done=unitsDone(g),rest=Math.max(0,total-done),pct=Math.min(100,Math.round(done/total*100));
  const stat=(tracking?.groups||[]).find(x=>x.id===g.id),latest=groupLatest(g.id),program=groupProgram(g.id),estimate=dateStatus(g);
  const box=node('article','owner-group-card ayda-partner-group-card'),head=add(box,'div','owner-group-head'),heading=add(head,'div');
  add(heading,'span','owner-level',g.level||'—');add(heading,'h3','',g.name||g.id);
  head.append(pill(g.status||'—',g.status==='Aktif'?'regular':'untracked'));
  const meta=add(box,'div','owner-group-meta');
  add(meta,'span','','Öğretmen: '+tName(g.teacherId));
  add(meta,'span','','Grup kaydındaki öğrenci: '+(Number(g.students)||0));
  if(stat)add(meta,'span','','Yoklama listesindeki öğrenci: '+stat.students);
  const progress=add(box,'div','owner-progress-info');add(progress,'strong','',done+' / '+total+' ünite');add(progress,'span','',pct+'%');
  const bar=add(box,'div','owner-progress');add(bar,'div').style.width=pct+'%';
  const remaining=add(box,'div','ayda-partner-group-remaining');
  add(remaining,'strong','',rest?'Kalan '+rest+' ünite':'Ünite hedefi tamamlandı');
  add(remaining,'small','',g.total?'Hedef: '+total+' ünite':'Standart hedef: '+total+' ünite');
  const flags=add(box,'div','ayda-partner-group-flags');
  if(g.status==='Aktif'&&g.end&&g.end<today())add(flags,'span','ayda-partner-group-warn','Planlanan bitiş tarihi geçti');
  if(g.status==='Aktif'&&g.start&&g.start>today())add(flags,'span','ayda-partner-group-info','Başlangıç: '+fmt(g.start));
  if(g.status==='Aktif'&&!groupProgramComplete(g))add(flags,'span','ayda-partner-group-warn','Program veya saat eksik');
  add(box,'p','ayda-partner-group-end','Planlanan bitiş: '+fmt(g.end));
  const last=add(box,'div','ayda-partner-last');
  add(last,'small','','Son ders raporu');
  if(latest){
   add(last,'strong','',fmt(latest.date)+' · '+latest.status+(latest.actual?' · '+latest.actual+' saat':''));
   if(latest.status==='İşlendi'&&latest.completed!==undefined&&latest.completed!=='')add(last,'span','','Son rapordaki ünite: '+latest.completed);
   if(latest.note)add(last,'p','',String(latest.note).slice(0,145)+(String(latest.note).length>145?'…':''));
  }else add(last,'strong','','21.10.2026 tarihinden sonra rapor yok');
  add(box,'p','ayda-partner-program','Haftalık program: '+(program.map(p=>p.day+' '+(p.start||'—')+'–'+(p.end||'saat eksik')).join(' · ')||'Girilmeyen program'));
  const stats=add(box,'div','owner-group-stats');
  for(const value of [stat?'Katılım '+round(stat.present,stat.present+stat.absent):'Yoklama verisi yüklenmedi',
   stat?'Eksik ödev '+stat.homeworkMissing:'Ödev verisi yüklenmedi',
   stat?.atRisk?stat.atRisk+' öncelikli öğrenci':''])if(value)add(stats,'span','',value);
  const details=add(box,'details');add(details,'summary','','Akademik ayrıntılar ve ödevler');
  const body=add(details,'div','owner-group-detail');
  add(body,'p','','Başlangıç: '+fmt(g.start)+' · Planlanan bitiş: '+fmt(g.end));
  add(body,'p','','Son ünite tahmini: '+estimate.unit+' · 2 sınav hazırlık dersinden sonra: '+estimate.exam);
  add(body,'p','','Grup ID: '+g.id+' · Öğretmen ID: '+(g.teacherId||'—'));
  const homework=(lessonHomework?.items||[]).filter(x=>x.groupId===g.id).slice(0,6);
  if(homeworkState==='loading')add(body,'p','owner-note','Ders ödevleri yükleniyor…');
  else if(homeworkState==='error')add(body,'p','owner-note','Ders ödevlerine erişilemedi. Yenileyerek tekrar deneyin.');
  if(homework.length){
   const wrap=add(body,'details','ayda-group-homework-detail');
   const pending=homework.filter(x=>x.shareStatus==='Bekliyor').length;
   add(wrap,'summary','','Verilen ödevler · '+homework.length+(pending?' · '+pending+' paylaşılmamış':''));
   for(const h of homework)add(wrap,'p','',fmt(h.date)+' · '+h.text+' · '+(h.shareStatus||'Paylaşım bilgisi yok'));
  }
  const archiveLink=node('a','ayda-group-archive-link','▤ Grup arşivi ve değerlendirme ↗');archiveLink.href='./grup-arsivi.html?group='+encodeURIComponent(g.id);archiveLink.target='_blank';archiveLink.rel='noopener noreferrer';box.append(archiveLink);
  box.append(quick('Grubun öğrencilerini gör →',()=>{activate('students');$('ownerStudentGroup').value=g.id;renderStudents();}));
  return box;
 }
 function renderGroups(){
  const groups=overview.groups||[],level=$('ownerGroupLevel').value,state=$('ownerGroupStatus').value;
  const q=$('ownerGroupSearch').value.trim().toLocaleLowerCase('tr');
  const subset=orderedGroups(groups.filter(g=>(!level||g.level===level)&&(!state||g.status===state)&&(!q||(g.name+' '+g.level+' '+tName(g.teacherId)).toLocaleLowerCase('tr').includes(q))));
  renderGroupTotals('ownerGroupTotals',groups);
  const summary=$('ownerGroupResults');if(summary)summary.textContent=subset.length+' / '+groups.length+' grup gösteriliyor · Google akademik kayıtları';
  const container=$('ownerGroupList');container.replaceChildren();
  for(const g of subset)container.append(groupCard(g));
  if(!subset.length)showEmpty('ownerGroupList','Bu filtrelere uygun grup bulunamadı.');
 }
 function lastRecord(item,type){if(!item)return 'Kayıt yok';return (type==='attendance'&&item.excused&&item.status==='Gelmedi'?'Mazeretli':item.status)+' · '+fmt(item.date);}
 function studentCard(s){
  const box=node('article','owner-student-card');const g=(overview.groups||[]).find(g=>g.id===s.groupId);
  const head=add(box,'div','owner-student-head'),identity=add(head,'div');
  add(identity,'h3','',s.name);add(identity,'small','',gName(s.groupId)+' · '+tName(g?.teacherId));
  head.append(pill(formats[status(s)],status(s)));
  const stats=add(box,'div','owner-student-stats');
  for(const [label,value] of [['Katılım',s.attendanceRate===null?'—':s.attendanceRate+'%'],['Geldi',s.present||0],['Gelmedi',s.absent||0],['Mazeretli',s.excused||0],['Ödev yaptı',s.homeworkDone||0],['Ödev eksik',s.homeworkMissing||0]]){
   const cell=add(stats,'div');add(cell,'span','',label);add(cell,'strong','',value);
  }
  const recent=add(box,'div','owner-student-recent');add(recent,'span','','Son yoklama: '+lastRecord(s.lastAttendance,'attendance'));add(recent,'span','','Son ödev: '+lastRecord(s.lastHomework,'homework'));
  const details=add(box,'details');add(details,'summary','','Son 5 yoklama ve ödevi göster');
  const layout=add(details,'div','owner-student-history');
  for(const [label,rows,t] of [['Yoklama',s.recentAttendance||[],'attendance'],['Ödev',s.recentHomework||[],'homework']]){
   const col=add(layout,'div');add(col,'b','',label);const ul=add(col,'ul');
   for(const x of rows)add(ul,'li','',lastRecord(x,t));
   if(!rows.length)add(ul,'li','','Henüz kayıt yok');
  }
  // İzleme ekranı salt okunurdur; not ve takip düzenlemeleri yalnızca Admin Panelinde yapılır.
  if(['danger','watch'].includes(status(s)))box.append(quick('Devamsızlık / ödev için WhatsApp hatırlatması',()=>{activate('messages');window.dispatchEvent(new CustomEvent('ayda:compose-student',{detail:{studentId:s.id,groupId:s.groupId}}));}));
  box.append(quick('Öğrenci raporunu yazdır / PDF',()=>printStudent(s)));
  return box;
 }
 function updateGroupSelectors(){
  const selects=['ownerStudentGroup','ownerAttendanceFilter'];
  for(const id of selects){const sel=$(id),value=sel.value;sel.replaceChildren(new Option('Tüm gruplar',''));
   for(const g of activeGroups())sel.add(new Option(g.name,g.id));sel.value=[...sel.options].some(o=>o.value===value)?value:'';
  }
  const teachers=$('ownerScheduleTeacher'),value=teachers.value;teachers.replaceChildren(new Option('Tüm öğretmenler',''));
  for(const t of overview.teachers||[])teachers.add(new Option(t.name,t.id));teachers.value=[...teachers.options].some(o=>o.value===value)?value:'';
 }
 function renderStudents(){
  const all=tracking?.students||[],q=$('ownerStudentSearch').value.trim().toLocaleLowerCase('tr'),group=$('ownerStudentGroup').value,kind=$('ownerStudentStatus').value,sort=$('ownerStudentSort').value;
  const values=all.filter(s=>(!q||s.name.toLocaleLowerCase('tr').includes(q))&&(!group||s.groupId===group)&&(!kind||status(s)===kind));
  const order={danger:0,watch:1,regular:2,untracked:3};
  values.sort((a,b)=>sort==='name'?a.name.localeCompare(b.name,'tr'):sort==='attendance'?b.absent-a.absent:sort==='homework'?b.homeworkMissing-a.homeworkMissing:(order[status(a)]-order[status(b)]||a.name.localeCompare(b.name,'tr')));
  if($('ownerStudentCount'))$('ownerStudentCount').textContent=values.length+' / '+all.length+' öğrenci';
  const root=$('ownerStudentList');root.replaceChildren();for(const s of values)root.append(studentCard(s));
  if(!values.length)showEmpty('ownerStudentList',tracking?'Kriterlere uygun öğrenci yok.':'Öğrenci verileri yüklenemedi.');
 }
 function table(rootId,headers,rows){
  const root=$(rootId);if(!root)return;root.replaceChildren();if(!rows.length){showEmpty(rootId,'Henüz kayıt yok.');return;}
  const tbl=add(root,'table'),thead=add(tbl,'thead'),h=add(thead,'tr');
  for(const title of headers)add(h,'th','',title);
  const tbody=add(tbl,'tbody');for(const row of rows){const tr=add(tbody,'tr');for(const col of row)add(tr,'td','',col);}
 }
 function renderAttendance(){
  const groups=tracking?.groups||[],total=groups.reduce((o,g)=>({present:o.present+g.present,absent:o.absent+g.absent,excused:o.excused+g.excused,done:o.done+g.homeworkDone,missing:o.missing+g.homeworkMissing}),{present:0,absent:0,excused:0,done:0,missing:0});
  const root=$('ownerAttendanceKpis');root.replaceChildren(kpi('Katılan',total.present),kpi('Gelmedi',total.absent),kpi('Mazeretli',total.excused),kpi('Ödev yapan',total.done),kpi('Eksik ödev',total.missing,'','warn'));
  table('ownerAttendanceGroups',['Grup','Öğrenci','Katılım','Geldi','Gelmedi','Mazeretli'],groups.map(g=>[g.name,g.students,round(g.present,g.present+g.absent),g.present,g.absent,g.excused]));
  table('ownerHomeworkGroups',['Grup','Yaptı','Yapmadı','Tamamlama'],groups.map(g=>[g.name,g.homeworkDone,g.homeworkMissing,round(g.homeworkDone,g.homeworkDone+g.homeworkMissing)]));
  const select=$('ownerAttendanceFilter').value,students=(tracking?.students||[]).filter(s=>!select||s.groupId===select);
  table('ownerAttendanceStudents',['Öğrenci','Grup','Katılım','Geldi','Gelmedi','Mazeretli','Ödev yaptı','Ödev eksik','Durum'],students.map(s=>[s.name,gName(s.groupId),s.attendanceRate===null?'—':s.attendanceRate+'%',s.present,s.absent,s.excused,s.homeworkDone,s.homeworkMissing,formats[status(s)]]));
 }
 function renderLessons(){
  const month=$('ownerLessonMonth').value,q=$('ownerLessonSearch').value.trim().toLocaleLowerCase('tr'),type=$('ownerLessonType').value,st=$('ownerLessonStatus').value;
  const list=lessons().filter(r=>(!month||r.date?.startsWith(month))&&(!type||r.type===type)&&(!st||r.status===st)&&(!q||(r.groupName+' '+tName(r.teacherId)+' '+(r.topic||'')+' '+(r.note||'')+' '+(r.student||'')).toLocaleLowerCase('tr').includes(q)));
  if($('ownerLessonCount'))$('ownerLessonCount').textContent='Gösterilen: '+Math.min(lessonLimit,list.length)+' / '+list.length+' rapor';
  const root=$('ownerLessonList');root.replaceChildren();for(const r of list.slice(0,lessonLimit))root.append(lessonRow(r));
  if(!list.length)showEmpty('ownerLessonList','Bu filtrelerle eşleşen ders raporu yok.');
  $('ownerShowMoreLessons').hidden=lessonLimit>=list.length;
 }
 function teacherData(){
  const month=$('ownerTeacherMonth').value,teachers=new Map();
  for(const t of overview.teachers||[])teachers.set(t.id,{teacher:t,groups:0,students:0,group:0,private:0,done:0,canceled:0,postponed:0,hours:0});
  for(const g of overview.groups||[]){const t=teachers.get(g.teacherId);if(t){t.groups++;t.students+=Number(g.students)||0;}}
  for(const r of lessons().filter(r=>r.date?.startsWith(month))){
   const t=teachers.get(r.teacherId);if(!t)continue;
   if(r.status==='İşlendi'){t.done++;t[r.type==='Özel'?'private':'group']++;t.hours+=hours(r.actual);}
   else if(r.status==='İptal')t.canceled++;
    else if(r.status==='Ertelendi')t.postponed++;
  }
  return [...teachers.values()].sort((a,b)=>b.hours-a.hours||a.teacher.name.localeCompare(b.teacher.name,'tr'));
 }
 function renderTeachers(){
  const rows=teacherData(),tot=rows.reduce((o,t)=>({count:o.count+t.done,hours:o.hours+t.hours,private:o.private+t.private,canceled:o.canceled+t.canceled,postponed:o.postponed+t.postponed}),{count:0,hours:0,private:0,canceled:0,postponed:0});
  $('ownerTeacherSummary').replaceChildren(kpi('İşlenen ders',tot.count),kpi('Toplam ders saati',hoursText(tot.hours)),kpi('Özel ders',tot.private),kpi('İptal',tot.canceled),kpi('Ertelenen',tot.postponed));
  const headers=['Öğretmen','Hesap','Grup','Öğrenci','Grup dersi','Özel ders','İşlenen','Ders saati','İptal','Ertelenen'];
  exportRows=[headers,...rows.map(x=>[x.teacher.name,x.teacher.status,x.groups,x.students,x.group,x.private,x.done,hoursText(x.hours),x.canceled,x.postponed])];
  table('ownerTeacherTable',headers,exportRows.slice(1));
  const root=$('ownerTeacherCards');root.replaceChildren();
  for(const t of rows){
   const box=add(root,'article','owner-teacher-card');const hd=add(box,'div','owner-group-head');add(hd,'h3','',t.teacher.name);hd.append(pill(t.teacher.status||'—',t.teacher.status==='Aktif'?'regular':'watch'));
   const gs=(overview.groups||[]).filter(g=>g.teacherId===t.teacher.id);
   add(box,'p','','Öğretmen türü: '+({kurs:'Normal kurs hocası',konusma:'Konuşma hocası',ozel:'Özel ders hocası'}[t.teacher.teacherType]||'Belirtilmedi'));
   add(box,'p','','Sınıf eşleşmesi: '+(gs.length?gs.length+' sınıf':'Henüz sınıf atanmadı'));
   add(box,'p','','Grupları: '+(gs.map(g=>g.name+' ('+g.level+')').join(', ')||'Atanmış grup yok'));
   add(box,'p','','Bu ay: '+t.done+' ders · '+hoursText(t.hours)+' saat · '+t.canceled+' iptal · '+t.postponed+' erteleme');
   add(box,'p','','Öğretmen ID: '+t.teacher.id+' · Kullanıcı ID: '+(t.teacher.userId||'—'));
  }
  if(!rows.length)showEmpty('ownerTeacherCards','Öğretmen hesabı bulunamadı.');
 }
 function renderSchedule(){
  const day=$('ownerScheduleDay').value,teacher=$('ownerScheduleTeacher').value;
  const rows=(overview.schedule||[]).filter(r=>(!day||r.day===day)&&(!teacher||(overview.groups||[]).find(g=>g.id===r.groupId)?.teacherId===teacher))
   .sort((a,b)=>days.indexOf(a.day)-days.indexOf(b.day)||String(a.start).localeCompare(String(b.start)));
  const root=$('ownerScheduleList');root.replaceChildren();let previous='';
  for(const p of rows){if(p.day!==previous){previous=p.day;add(root,'h3','owner-day-heading',p.day);}
   const box=add(root,'div','owner-schedule-card');add(box,'strong','',p.group+' · '+p.start+' – '+p.end);
   add(box,'small','',tName((overview.groups||[]).find(g=>g.id===p.groupId)?.teacherId)+' · '+p.status);
  }
  if(!rows.length)showEmpty('ownerScheduleList','Bu ölçütlerde program bulunamadı.');
 }

 function printStudent(s){
  const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const pop=window.open('','_blank');if(!pop){alert('Rapor için açılır pencerelere izin verin.');return;}
  const row=(a,b)=>'<tr><th>'+esc(a)+'</th><td>'+esc(b)+'</td></tr>';
  const rows=[row('Öğrenci',s.name),row('Grup',gName(s.groupId)),row('Katılım',s.attendanceRate===null?'Kayıt yok':s.attendanceRate+'%'),row('Geldi',s.present||0),row('Gelmedi',s.absent||0),row('Mazeretli',s.excused||0),row('Ödev yaptı',s.homeworkDone||0),row('Ödev yapmadı',s.homeworkMissing||0),row('Akademik durum',formats[status(s)])].join('');
  pop.document.open();
  pop.document.write('<!doctype html><html lang="tr"><head><meta charset="utf-8"><title>AYDA Öğrenci Gelişim Raporu</title><style>body{font:15px Arial,sans-serif;color:#183e30;margin:36px}h1{color:#176b59}table{width:100%;border-collapse:collapse;margin-top:25px}td,th{border-bottom:1px solid #d7e2da;padding:12px;text-align:left}th{width:42%}small{color:#777}@media print{body{margin:18mm}}</style></head><body><h1>AYDA DİL AKADEMİSİ</h1><h2>Öğrenci Akademik Gelişim Raporu</h2><small>Oluşturulma tarihi: '+esc(new Date().toLocaleDateString('tr-TR'))+' · Yalnızca sisteme girilmiş kayıtlar</small><table>'+rows+'</table><p><small>İstatistikler, kaydedilmiş yoklama ve kontrol edilen ödevlere dayanır. Resmî başarı belgesi değildir.</small></p></body></html>');
  pop.document.close();pop.focus();pop.print();
 }
 function renderMissing(){
  const root=$('ownerMissingRecords');if(!root)return;root.replaceChildren();
  if(!reminders){root.append(node('div','owner-empty','Eksik kayıt servisi henüz yayımlanmadı.'));return;}
  if(!reminders.items?.length){root.append(node('div','owner-empty','12 saati aşan eksik ders veya yoklama bulunmuyor.'));return;}
  for(const r of reminders.items.slice(0,50)){
   const c=add(root,'article','note-card warn'),person=tName(r.teacherId),kind=r.type==='attendance'?'Yoklama':'Ders raporu';
   add(c,'strong','',kind+' eksik · '+r.group);
   add(c,'p','','Tarih: '+fmt(r.date)+' · Öğretmen: '+person+' · '+r.ageHours+' saat önce');
   const msg='Merhaba hocam, '+fmt(r.date)+' tarihli '+r.group+' grubu '+kind.toLocaleLowerCase('tr-TR')+' eksik görünüyor. Lütfen sisteme girerek tamamlayınız. Teşekkürler.';
   const candidates=(contactDirectory?.teachers||[]).filter(t=>t.teacherId===r.teacherId&&t.status==='Aktif'&&/^90[1-9]\d{9}$/.test(String(t.phone||'')));
   if(candidates.length===1){
    const phone=candidates[0].phone;
    const button=quick('WhatsApp üzerinden hatırlat',()=>{
     window.open('https://wa.me/'+phone+'?text='+encodeURIComponent(msg),'_blank','noopener,noreferrer');
    });
    c.append(button);
   }else{
    add(c,'p','owner-note',candidates.length?'Öğretmen telefonu birden fazla kişiye eşleşiyor.':'Öğretmenin doğrulanmış WhatsApp numarası yok. Mesaj göndermeden önce iletişim rehberini düzeltin.');
   }
  }
 }
 function renderWeekly(){
  const root=$('ownerWeekly');if(!root)return;root.replaceChildren();
  const month=today().slice(0,7),year=Number(month.slice(0,4)),mon=Number(month.slice(5,7)),totalDays=new Date(Date.UTC(year,mon,0)).getUTCDate();
  const weekdays=['Pazar','Pazartesi','Salı','Çarşamba','Perşembe','Cuma','Cumartesi'];
  const byId=new Map(activeGroups().map(g=>[g.id,g])),planned=new Set();
  for(const entry of overview?.schedule||[]){
   const group=byId.get(entry.groupId);if(!group)continue;
   for(let day=1;day<=totalDays;day++){
    const date=month+'-'+String(day).padStart(2,'0');
    if(date<'2026-10-21'||(group.start&&date<group.start)||(group.end&&date>group.end))continue;
    if(entry.day!==weekdays[new Date(Date.UTC(year,mon-1,day)).getUTCDay()])continue;
    planned.add(entry.groupId+'|'+date+'|'+entry.start);
   }
  }
  const completedThisMonth=(overview?.history||[]).filter(r=>r.date>='2026-10-21'&&r.date?.startsWith(month)&&r.status==='İşlendi').length;
  for(const [label,value] of [['Bu ay planlanan grup dersi',planned.size],['Bu ay işlenen grup dersi',completedThisMonth],['Bekleyen akademik kayıt',reminders?.total??'—'],['Öncelikli öğrenci',tracking?.alerts?.length??'—']]){
   const box=add(root,'div','note-card');add(box,'strong','',value);add(box,'p','',label);
  }
 }

 function renderAlerts(){
  const root=$('ownerAlertList');root.replaceChildren();
  const students=(tracking?.students||[]).filter(s=>status(s)==='danger'&&s.followupStatus!=='Çözüldü').sort((a,b)=>Number(b.consecutiveAbsent)-Number(a.consecutiveAbsent)||b.recentAbsent-a.recentAbsent);
  for(const s of students)root.append(studentCard(s));
  if(!students.length)showEmpty('ownerAlertList',tracking?'Öncelikli uyarı yok.':'Öğrenci takibi henüz yüklenemedi.');
  renderMissing();
  const future=$('ownerDateAlerts');future.replaceChildren();
  for(const g of activeGroups()){const rest=unit(g)-unitsDone(g),soon=g.start&&g.start>=today()&&difference(g.start,today())<=14;
   if(rest>0&&rest<=3||soon){const c=add(future,'div','note-card '+(rest<=3?'warn':''));add(c,'strong','',g.name);
    add(c,'p','',(soon?'Başlangıç: '+fmt(g.start)+' · ':'')+'Tamamlanan: '+unitsDone(g)+'/'+unit(g)+' · '+tName(g.teacherId));}
  }
  if(!future.children.length)showEmpty('ownerDateAlerts','Yakın başlangıç veya bitiş uyarısı bulunmuyor.');
 }
 function renderAccounts(){
  const accounts=overview.accounts||[],teachers=overview.teachers||[],vault=overview.vaultStatus||[];
  table('ownerAccountsTable',['Hesap adı','Kullanıcı ID','Hesap durumu','Öğretmen ID','Aktif grup'],accounts.map(a=>{
   const t=teachers.find(t=>t.userId===a.id);return [a.name,a.id,a.status,t?.id||'—',(overview.groups||[]).filter(g=>g.teacherId===t?.id&&g.status==='Aktif').length];
  }));
  table('ownerVaultTable',['Hesap','Adı','Rol','Oluşturulma'],vault.map(v=>[v.accountId,v.name,v.role,v.created]));
 }
 function renderHealth(){
  const root=$('ownerHealthIssues'),summary=$('ownerHealthOverview');if(!root||!summary)return;
  root.replaceChildren();summary.replaceChildren();
  const groups=overview.groups||[],teachers=overview.teachers||[],schedule=overview.schedule||[],issues=[];
  const validTeachers=new Set(teachers.map(t=>t.id));
  const activeTeachers=new Set(teachers.filter(t=>t.status==='Aktif').map(t=>t.id));
  const validGroups=new Set(groups.map(g=>g.id));
  const rosterGroups=new Map((tracking?.groups||[]).map(g=>[g.id,g]));
  const action=(label,fix,groupId,more={})=>({label,fix,groupId,...more});
  const panel=(label,tab,focus)=>({label,tab,focus});
  const warn=(title,detail,actions=[])=>issues.push({title,detail,actions});
  for(const g of groups){
   if(g.status!=='Aktif')continue;
   if(!g.teacherId||!validTeachers.has(g.teacherId))
    warn(g.name+' · Öğretmen atanmadı','Öğretmen seçilmeden ders ve yoklama kaydedilemez.',[action('Öğretmen ata →','teacher',g.id)]);
   else if(!activeTeachers.has(g.teacherId))
    warn(g.name+' · Öğretmen hesabı pasif','Öğretmeni veya hesap durumunu kontrol edin: '+tName(g.teacherId),[
     panel('Hesabı etkinleştir →','accounts','aydaTeacherManage'),action('Öğretmen değiştir →','teacher',g.id)
    ]);
   const plans=schedule.filter(r=>r.groupId===g.id);
   if(!plans.length)
    warn(g.name+' · Haftalık program yok','Ders günü ile başlangıç/bitiş saati girilmeli.',[action('Programı oluştur →','schedule',g.id)]);
   else if(plans.some(p=>p.status!=='Aktif'||!p.start||!/^([01]\d|2[0-3]):[0-5]\d$/.test(String(p.end||''))))
    warn(g.name+' · Ders saati eksik','Programdaki başlangıç veya bitiş saatlerini tamamlayın.',[action('Ders saatlerini düzenle →','schedule',g.id)]);
   if(!Number(g.students))
    warn(g.name+' · Öğrenci sayısı sıfır','Sınıf öğrenci listesini kontrol edin.',[action('Öğrenci ekle →','student',g.id)]);
   const actual=rosterGroups.get(g.id)?.students;
   if(Number.isFinite(Number(actual))&&Number(actual)!==Number(g.students))
    warn(g.name+' · Öğrenci sayıları uyuşmuyor','Grup kartı: '+g.students+' / Öğrenci listesi: '+actual+'. Kimlikleri kontrol edin.',[
     action('Grup sayısını düzelt →','count',g.id),action('Öğrencileri düzenle →','student',g.id)
    ]);
   if(g.end&&g.end>='2026-10-21'&&g.end<today())
    warn(g.name+' · Önceki dönem grubu hâlâ aktif','Kurs tamamlandıysa geçmişe taşıyın; kayıtları silmeyin.',[action('Grubu tamamlandı yap →','status',g.id)]);
  }
  // Sadece bir gruba bağlı öğrenci kayıtları; isim alanındaki CRM notlarını uyarıya çıkar.
  const issueWords=/(?:^|\s)(?:ödendi|ödenmedi|taksit(?:ler)?|borç|bakiye|ödeme|peşin|hesap|öğrenci|toplamı|danışmanlık|abisi|oğlu|kızı|eltden|elt|cncler|multimanustan|imam|ark|ağustos|agustos|ank|elazığ|yeni|müsdavdan|yaseminden)(?=\s|$)/iu;
  const nameIssue=name=>{
   const parts=String(name||'').trim().split(/\s+/).filter(Boolean);
   if(parts.length<2)return 'Ad ve soyad birlikte yazılmalı.';
   if(/[0-9?!@]/.test(name))return 'İsim içinde sayı veya açıklama işareti var.';
   if(issueWords.test(name))return 'İsim alanında ödeme, yakınlık veya CRM açıklaması bulunuyor.';
   if(parts.length>4)return 'İsim çok uzun; ad-soyad dışı açıklama olabilir.';
   return '';
  };
  for(const student of tracking?.students||[]){
   if(!validGroups.has(student.groupId)||!student.id)continue;
   const reason=nameIssue(student.name);
   if(reason)warn('Öğrenci adı kontrolü · '+student.name,reason+' · '+gName(student.groupId),[action('Öğrenci adını düzelt →','student',student.groupId,{studentId:student.id})]);
  }
  const duplicates=new Map();for(const t of teachers.filter(t=>t.status==='Aktif')){if(!t.id)continue;const users=duplicates.get(t.id)||new Set();users.add(t.userId||t.name);duplicates.set(t.id,users);}
  for(const [id,accounts] of duplicates)if(id&&accounts.size>1)
   warn('Hesaplarda ortak öğretmen ID','Öğretmen ID: '+id+' · '+accounts.size+' aktif hesap aynı gruplara erişiyor. Admin panelinde Ortak Öğretmen ID Ayır alanından hesapları sınıflarına göre ayırın.',[panel('Hesapları incele →','accounts','ownerAccountsTable')]);
  for(const t of teachers.filter(t=>t.status==='Aktif'&&!groups.some(g=>g.teacherId===t.id)))
   warn(t.name+' · Sınıf eşleşmesi yok','Özel ders öğretmeniyse bu durum normal olabilir.',[action('Sınıfa öğretmen ata →','teacher','',{teacherId:t.id})]);
  for(const r of schedule)if(r.status==='Aktif'&&!validGroups.has(r.groupId))
   warn('Program · Tanımsız sınıf','Grup ID: '+r.groupId,[panel('Programı incele →','schedule','ownerScheduleList')]);
  for(const row of (reminders?.items||[]).filter(x=>String(x.date||'')>='2026-10-21'))
   warn((row.type==='attendance'?'Eksik yoklama':'Eksik ders raporu')+' · '+(row.group||'Sınıf'),fmt(row.date)+' · '+tName(row.teacherId),[
    {label:'Öğretmene hatırlat →',compose:{teacherId:row.teacherId,groupId:row.groupId,date:row.date,type:row.type}}
   ]);
  for(const t of teachers.filter(t=>t.status==='Aktif'&&!t.phone))
    warn(t.name+' · Öğretmen telefonu eksik','WhatsApp uyarısı için numara ekleyin.',[panel('Öğretmeni düzenle →','teachers','ownerTeacherCards')]);
  if(!reminders)
   warn('Eksik rapor kontrolü kullanılamıyor','Google Apps Script bağlantısını ve güncel dağıtımı kontrol edin.',[{label:'Verileri yenile →',refresh:true}]);
  summary.append(kpi('Aktif sınıf',groups.filter(g=>g.status==='Aktif').length),kpi('Aktif öğretmen',teachers.filter(t=>t.status==='Aktif').length),kpi('Kontrol gerektiren',issues.length),kpi('Eksik kayıt',reminders?.items?.length??'—'));
  if(!issues.length){showEmpty('ownerHealthIssues',reminders?'Kontrol edilen alanlarda eksiklik bulunamadı.':'Temel sınıf kontrolleri tamam. Eksik kayıt hizmetinden henüz yanıt alınmadı.');return;}
  function navigate(fix){
   const context={fix:fix.fix,groupId:fix.groupId||'',teacherId:fix.teacherId||'',studentId:fix.studentId||''};
   if(new URLSearchParams(location.search).get('aydaEmbed')==='1'&&window.parent!==window){
    window.parent.postMessage({aydaHealthEmbed:1,action:'fix',context},location.origin);
    return;
   }
   // Düzenleyici aynı sayfanın üzerinde açılır, iki yönetim paneli arasında gidip gelinmez.
   if(new URLSearchParams(location.search).get('aydaEmbed')==='1'&&window.parent!==window){
    window.parent.postMessage({aydaWorkspace:1,view:'admin',context},location.origin);return;
   }
   if(window.AYDA_UNIFIED_WORKSPACE?.openAdmin){window.AYDA_UNIFIED_WORKSPACE.openAdmin(context);return;}
   const url=new URL('./index.html',location.href);
   url.searchParams.set('aydaFix',context.fix);
   if(context.groupId)url.searchParams.set('groupId',context.groupId);
   if(context.teacherId)url.searchParams.set('teacherId',context.teacherId);
   if(context.studentId)url.searchParams.set('studentId',context.studentId);
   url.hash=context.fix==='student'?'grup-islemleri':'duzenle';
   location.assign(url.href);
  }
  function runAction(item){
   if(item.fix){navigate(item);return;}
   if(item.tab){
    if(new URLSearchParams(location.search).get('aydaEmbed')==='1'&&window.parent!==window){
     window.parent.postMessage({aydaHealthEmbed:1,action:'tab',tab:item.tab,focus:item.focus||''},location.origin);
     return;
    }
    activate(item.tab);
    const target=item.focus&&$(item.focus);
    if(target)requestAnimationFrame(()=>{target.scrollIntoView({behavior:'smooth',block:'center'});});
    return;
   }
   if(item.compose){
    if(new URLSearchParams(location.search).get('aydaEmbed')==='1'&&window.parent!==window){
     window.parent.postMessage({aydaHealthEmbed:1,action:'compose',context:item.compose},location.origin);
    }else{
     activate('messages');
     window.dispatchEvent(new CustomEvent('ayda:compose-teacher',{detail:item.compose}));
    }
    return;
   }
   if(item.refresh)refresh();
  }
  for(const issue of issues){
   const card=add(root,'article','note-card warn ayda-health-issue-card');
   add(card,'strong','',issue.title);add(card,'p','',issue.detail);
   if(issue.actions.length){
    const buttons=add(card,'div','ayda-health-card-actions');
    const embedded=new URLSearchParams(location.search).get('aydaEmbed')==='1';
    for(const item of issue.actions.filter(x=>embedded||x.compose||x.refresh))buttons.append(quick(item.label,()=>runAction(item)));
   }
  }
 }
 function renderAll(){
   if(!overview)return;
   // Hidden sections are painted on demand; IDs and original render functions remain unchanged.
   const views={
    overview:[['ownerKpis',renderKpis],['ownerHighlights',renderHighlights],['ownerToday',renderOverview],['ownerWeekly',renderWeekly]],
    groups:[['ownerGroupList',renderGroups]],
    health:[['ownerHealthIssues',renderHealth]],
    students:[['ownerStudentList',renderStudents]],
    attendance:[['ownerAttendanceKpis',renderAttendance]],
    lessons:[['ownerLessonList',renderLessons]],
    teachers:[['ownerTeacherTable',renderTeachers],['ownerAccountsTable',isAdmin()?renderAccounts:()=>{}]],
    schedule:[['ownerScheduleList',renderSchedule]],
    alerts:[['ownerAlertList',renderAlerts]],
    messages:[]
   };
   if(['students','attendance','schedule','groups'].includes(tab))robust('ownerStudentList',updateGroupSelectors);
   for(const [id,paint] of views[tab]||views.overview)robust(id,paint);
  }
  // Yönetici içindeki Sistem Sağlığı penceresi ikinci şifre istemez.
 const embeddedHealth=new URLSearchParams(location.search).get('aydaEmbed')==='1'&&window.parent!==window;
 if(embeddedHealth){
  $('ownerLogin').hidden=true;
  window.addEventListener('message',event=>{
   if(event.origin!==location.origin||event.source!==window.parent)return;
   const req=event.data;
   if(req?.aydaHealthEmbed===1&&req.action==='authorize'&&typeof req.key==='string'&&req.key){
    if(token===req.key&&isAdmin()){activate('health');window.parent.postMessage({aydaHealthEmbed:1,action:'authenticated'},location.origin);return;}
    if(!loading)login(req.key);
   }
  });
  window.addEventListener('ayda:owner-ready',()=>{
   if(isAdmin())window.parent.postMessage({aydaHealthEmbed:1,action:'authenticated'},location.origin);
  });
 }
 $('ownerLoginForm').addEventListener('submit',e=>{e.preventDefault();login($('ownerKey').value);});
 $('ownerRefresh').addEventListener('click',refresh);
 $('ownerLogout').addEventListener('click',()=>{ownerDataGeneration++;homeworkState='idle';if(isAdmin()){sessionStorage.removeItem('aydaKey');aydaSession.clear();}else viewerSession.clear();document.body.classList.remove('ayda-viewer-mode');token='';overview=null;tracking=null;reminders=null;contactDirectory=null;lessonHomework=null;activeApi='';$('ownerVaultSecrets').replaceChildren();$('ownerVaultSecrets').hidden=true;$('ownerVaultReveal').hidden=false;$('ownerVaultHide').hidden=true;$('ownerApp').hidden=true;$('ownerLogin').hidden=false;$('ownerLogout').hidden=true;errorMessage('');$('ownerLoginError').textContent='';const skip=$('ownerSkip');if(skip){skip.href='#ownerLogin';skip.textContent='Giriş bölümüne geç';}window.AYDA_ACTIVITY?.clear();window.dispatchEvent(new Event('ayda:owner-logout'));});
 // Yönetici menüsünü görev odaklı üç gruba ayır; mevcut sekme ve erişim davranışı korunur.
 (function organizeOwnerNav(){
  const nav=$('ownerNav');if(!nav||nav.dataset.organized)return;nav.dataset.organized='true';
  const sections=[['TAKİP',['overview','health','alerts']],['AKADEMİK',['students','attendance','groups','lessons','schedule','teachers']],['İLETİŞİM',['messages']]];
  const buttons=[...nav.querySelectorAll('button[data-tab]')];nav.replaceChildren();
  for(const [title,ids] of sections){const area=document.createElement('div');area.className='ayda-nav-section';const h=document.createElement('span');h.className='ayda-nav-heading';h.textContent=title;area.append(h);const menu=document.createElement('div');menu.className='ayda-nav-items';for(const id of ids){const b=buttons.find(x=>x.dataset.tab===id);if(b){if(id==='health')b.textContent='Sistem Sağlığı';if(id==='overview')b.textContent='Genel Bakış';if(id==='alerts')b.textContent='Eksik Raporlar';if(id==='students')b.textContent='Öğrenciler';if(id==='attendance')b.textContent='Yoklama · Ödev';if(id==='groups')b.textContent='Gruplar';if(id==='lessons')b.textContent='Ders Raporları';if(id==='teachers')b.textContent='Öğretmen Saatleri';if(id==='schedule')b.textContent='Ders Programı';if(id==='messages')b.textContent='Mesajlar';menu.append(b);}}area.append(menu);nav.append(area);}
 })();
 $('ownerNav').addEventListener('click',e=>{const b=e.target.closest('[data-tab]');if(b)activate(b.dataset.tab);});
 window.addEventListener('hashchange',()=>{const n=location.hash.slice(1);if(['overview','messages','alerts','attendance','students','groups','health','lessons','teachers','schedule'].includes(n)&&token)activate(n);});
 for(const b of document.querySelectorAll('[data-jump]'))b.addEventListener('click',()=>activate(b.dataset.jump));
 // Search inputs can produce hundreds of cards; paint at most once after a short pause.
 // Select changes remain synchronous so users always see their chosen filters.
 const delayedSearches=[];
 const searchInput=(id,paint)=>{
  let timer=null;
  const flush=()=>{if(timer!==null)clearTimeout(timer);timer=null;if(overview)paint();};
  $(id).addEventListener('input',()=>{if(timer!==null)clearTimeout(timer);timer=setTimeout(flush,120);});
  $(id).addEventListener('change',flush);
  delayedSearches.push(()=>{if(timer!==null)clearTimeout(timer);timer=null;});
 };
 searchInput('ownerStudentSearch',renderStudents);
 for(const id of ['ownerStudentGroup','ownerStudentStatus','ownerStudentSort'])$(id).addEventListener('change',renderStudents);
 searchInput('ownerGroupSearch',renderGroups);
 for(const id of ['ownerGroupLevel','ownerGroupStatus'])$(id).addEventListener('change',renderGroups);
 $('ownerAttendanceFilter').addEventListener('change',renderAttendance);
 const repaintLessons=()=>{lessonLimit=40;renderLessons();};
 searchInput('ownerLessonSearch',repaintLessons);
 for(const id of ['ownerLessonMonth','ownerLessonType','ownerLessonStatus'])$(id).addEventListener('change',repaintLessons);
 window.addEventListener('ayda:owner-logout',()=>delayedSearches.forEach(cancel=>cancel()));
 $('ownerShowMoreLessons').addEventListener('click',()=>{lessonLimit+=40;renderLessons();});
 $('ownerTeacherMonth').addEventListener('change',renderTeachers);
 $('ownerScheduleDay').addEventListener('change',renderSchedule);
 $('ownerScheduleTeacher').addEventListener('change',renderSchedule);
 $('ownerVaultReveal').addEventListener('click',async()=>{
   const button=$('ownerVaultReveal');button.disabled=true;
   $('ownerVaultSecrets').hidden=false;
   showEmpty('ownerVaultSecrets','Arşiv kayıtları yükleniyor…');
   try{
     const result=await api('vaultExport',token);
     const rows=(result?.rows||[]).map(r=>[r.name||'—',r.role||'—',r.accountId||'—',r.key||'—',r.status||'—',r.created||'—']);
     table('ownerVaultSecrets',['Adı','Rol','Hesap ID','Arşivdeki anahtar','Durum','Kayıt tarihi'],rows);
     button.hidden=true;$('ownerVaultHide').hidden=false;
   }catch(e){showEmpty('ownerVaultSecrets','Arşiv okunamadı: '+e.message);}
   finally{button.disabled=false;}
 });
 $('ownerVaultHide').addEventListener('click',()=>{
   $('ownerVaultSecrets').replaceChildren();$('ownerVaultSecrets').hidden=true;
   $('ownerVaultReveal').hidden=false;$('ownerVaultHide').hidden=true;
 });
 $('ownerTeacherCSV').addEventListener('click',()=>{
  const esc=x=>'"'+String(x??'').replace(/^[\s]*[=+@-]/,m=>"'"+m).replace(/"/g,'""')+'"';
  const csv='\ufeff'+exportRows.map(r=>r.map(esc).join(';')).join('\r\n');
  const u=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'})),a=document.createElement('a');a.href=u;a.download='AYDA-ogretmen-saatleri-'+$('ownerTeacherMonth').value+'.csv';a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);
 });
 // Yönetim verilerini güncelle: rapor veya öğrenci kaydı oluşturmaz.
 window.AYDA_ACTIVITY?.bindRefresh(async()=>{
  if(!token||loading)return;
  const key=token,latest=await api('overview',key);
  if(!token||token!==key)return;
  if(!['admin','viewer'].includes(latest?.user?.role))throw Error('Yönetim oturumu doğrulanamadı.');
  overview=latest;const applied=await loadTracking();
  if(applied&&token===key)window.dispatchEvent(new Event('ayda:owner-ready'));
 });
 // URL anahtarı ile özel bağlantı girişi kaldırıldı; yalnızca parola ve mevcut oturum kullanılır.
 if(embeddedHealth){
  window.parent.postMessage({aydaHealthEmbed:1,action:'ready'},location.origin);
 }else{
  const previous=sessionStorage.getItem('aydaKey')||aydaSession.read()||viewerSession.read();
  if(previous)login(previous);
 }
})();
