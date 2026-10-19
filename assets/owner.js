"use strict";
(()=>{
 const $=id=>document.getElementById(id);
 const payload64=s=>{const b=new TextEncoder().encode(s);let a='';for(const c of b)a+=String.fromCharCode(c);return btoa(a).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');};
 window.AYDA_OWNER_BRIDGE={
  api:(action,params={})=>{if(!token||overview?.user?.role!=='admin')throw Error('Yönetici oturumu gerekli.');return api(action,token,params);},
  overview:()=>token&&overview?.user?.role==='admin'?overview:null,
  tracking:()=>token&&overview?.user?.role==='admin'?tracking:null,
  reminders:()=>token&&overview?.user?.role==='admin'?reminders:null,
  ready:()=>!!token&&overview?.user?.role==='admin',
  openTab:next=>activate(next)
 };
 const node=(tag,cls,value)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(value!==undefined)e.textContent=String(value);return e;};
 const add=(parent,tag,cls,value)=>{const e=node(tag,cls,value);parent.append(e);return e;};
 const showEmpty=(id,label)=>$(id).replaceChildren(node('div','owner-empty',label));
 const formats={danger:'Öncelikli',watch:'Takip edilmeli',regular:'Düzenli',untracked:'Henüz veri yok'};
 const days=['Pazartesi','Salı','Çarşamba','Perşembe','Cuma','Cumartesi','Pazar'];
 let token='',overview=null,tracking=null,reminders=null,contactDirectory=null,lessonHomework=null,activeApi='',loading=false,requestIndex=0,lessonLimit=40,tab='overview',exportRows=[];
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
 const lessons=()=>[...(overview?.history||[]).map(r=>({...r,type:'Grup',groupName:gName(r.groupId)})),...(overview?.privateHistory||[]).map(r=>({...r,type:'Özel',groupName:r.student||'Özel ders'}))].sort((a,b)=>String(b.date||'').localeCompare(String(a.date||'')));
 const hours=value=>{const s=String(value||'').trim(),m=s.match(/^(\d{1,3}):(\d{2})$/);return m?(+m[1]+(+m[2])/60):Number(s)||0;};
 const hoursText=n=>Number(n||0).toLocaleString('tr-TR',{maximumFractionDigits:2});
 const difference=(a,b)=>{const x=Date.parse(a+'T00:00:00Z'),y=Date.parse(b+'T00:00:00Z');return Number.isFinite(x)&&Number.isFinite(y)?Math.round((x-y)/86400000):Infinity;};
 const pill=(label,kind)=>node('span','pill '+(kind||'untracked'),label);
 const dateStatus=group=>{const rest=Math.max(0,unit(group)-unitsDone(group));if(rest===0)return {unit:'Tamamlandı',exam:'Tamamlandı'};
  const set=new Set((overview.schedule||[]).filter(r=>r.groupId===group.id).map(r=>r.day));
  if(!set.size)return {unit:'Program eksik',exam:'Program eksik'};
  const w=['Pazar','Pazartesi','Salı','Çarşamba','Perşembe','Cuma','Cumartesi'];
  const start=group.start&&group.start>today()?group.start:today();
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
   const timer=setTimeout(()=>finish(transport('Google yanıtı zaman aşımına uğradı.')),12000);
   window[cb]=result=>result?.ok?finish(null,result.data):finish(Error(result?.error||'Sunucu geçersiz cevap verdi.'));
   u.searchParams.set('action',action);u.searchParams.set('callback',cb);u.searchParams.set('key',key);for(const [k,v] of Object.entries(params))u.searchParams.set(k,v);
   script.onerror=()=>finish(transport('Google Apps Script bağlantısı kurulamadı.'));
   script.onload=()=>{if(!finished)finish(transport('Apps Script beklenen yanıtı döndürmedi.'));};
   script.src=u.toString();document.head.append(script);
  });
 }
 async function api(action,key,params={}){
  const readOnly=['overview','trackingSummary','reminders','integrityStatus','backupStatus','studentNotes','vaultExport','feedbackInbox','contactDirectory','homeworkTasks','lessonHomework'].includes(action);let err;
  for(const address of (readOnly?[...new Set([activeApi,...candidates()].filter(Boolean))]:[activeApi||candidates()[0]])){try{const data=await apiRequest(address,action,key,params);activeApi=address;return data;}catch(e){err=e;if(!e.transport)throw e;}}
  throw err||Error('Google Apps Script bağlantısı kurulamadı.');
 }
 const errorMessage=message=>{$('ownerError').textContent=message||'';};
 const setLoading=value=>{loading=value;$('ownerLoginButton').disabled=value;$('ownerRefresh').disabled=value;};
 function activate(next){
  const name=['overview','students','attendance','groups','lessons','teachers','schedule','alerts','messages','accounts'].includes(next)?next:'overview';
  tab=name;
  for(const p of document.querySelectorAll('.owner-panel'))p.hidden=p.id!=='owner-'+name;
  for(const b of $('ownerNav').querySelectorAll('button[data-tab]')){b.classList.toggle('active',b.dataset.tab===name);b.setAttribute('aria-current',b.dataset.tab===name?'page':'false');}
  try{sessionStorage.setItem('aydaOwnerTab',name);}catch(_){}
 }
 async function login(key){
  if(loading)return;const provided=String(key||'');if(!provided){$('ownerLoginError').textContent='Yönetici parolası gerekli.';return;}
  setLoading(true);$('ownerLoginError').textContent='';errorMessage('');
  try{
   const result=await api('overview',provided);
   if(result?.user?.role!=='admin')throw Error('Yalnızca yönetici hesabıyla açılabilir.');
   token=provided;overview=result;
   sessionStorage.setItem('aydaKey',token);
   $('ownerLogin').hidden=true;$('ownerApp').hidden=false;$('ownerLogout').hidden=false;
   const skip=$('ownerSkip');if(skip){skip.href='#ownerApp';skip.textContent='Ana içeriğe geç';}
   $('ownerKey').value='';
   if(!$('ownerTeacherMonth').value)$('ownerTeacherMonth').value=today().slice(0,7);
   if(!$('ownerLessonMonth').value)$('ownerLessonMonth').value=today().slice(0,7);
   // Genel bakış hazır olur olmaz göster; akademik ayrıntılar paralel yüklenir.
   renderAll();
   activate(['messages','alerts','attendance','students','groups','lessons','teachers','schedule','accounts'].includes(location.hash.slice(1))?location.hash.slice(1):(sessionStorage.getItem('aydaOwnerTab')||'overview'));
   await loadTracking();
   window.dispatchEvent(new Event('ayda:owner-ready'));

  }catch(e){token='';$('ownerLogin').hidden=false;$('ownerApp').hidden=true;$('ownerLogout').hidden=true;$('ownerLoginError').textContent=e.message;}
  finally{setLoading(false);}
 }
 async function loadTracking(){
  // Birbirinden bağımsız salt-okunur istekleri art arda değil, aynı anda yükle.
  const results=await Promise.allSettled([
   api('trackingSummary',token),api('reminders',token),
   api('contactDirectory',token),api('lessonHomework',token)
  ]);
  const t=results[0];
  tracking=t.status==='fulfilled'&&t.value?.scope==='all'?t.value:null;
  reminders=results[1].status==='fulfilled'?results[1].value:null;
  contactDirectory=results[2].status==='fulfilled'?results[2].value:null;
  lessonHomework=results[3].status==='fulfilled'?results[3].value:null;
  if(!tracking)errorMessage('Öğrenci takip verileri henüz yüklenemedi. Diğer bilgiler kullanılabilir.');
  else errorMessage('');
  renderAll();
 }
 async function refresh(){
  if(!token||loading)return;setLoading(true);
  try{const r=await api('overview',token);if(r?.user?.role!=='admin')throw Error('Yönetici yetkisi doğrulanamadı.');overview=r;await loadTracking();window.dispatchEvent(new Event('ayda:owner-ready'));}
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
  const ts=tracking?.students||[],gs=activeGroups(),hist=lessons(),att=tracking?.groups||[];
  const present=att.reduce((n,g)=>n+g.present,0),absent=att.reduce((n,g)=>n+g.absent,0);
  const month=today().slice(0,7),totalHours=hist.filter(r=>r.date?.startsWith(month)&&r.status==='İşlendi').reduce((n,r)=>n+hours(r.actual),0);
  const root=$('ownerKpis');root.replaceChildren(
   kpi('Bugünkü planlı ders',(overview.todayLessons||[]).length,'Bugün: '+fmt(today())),
   kpi('Eksik akademik kayıt',reminders?.total??'—','Ders raporu ve yoklama',reminders?.total?'warn':undefined),
   kpi('Aktif grup',gs.length,'Tüm gruplar: '+(overview.groups||[]).length),
   kpi('Aktif öğretmen',(overview.teachers||[]).filter(t=>t.status==='Aktif').length),
   kpi('Kayıtlı öğrenci',tracking?ts.length:'—','Aktif öğrenci listesi'),
   kpi('Bu ay işlenen saat',hoursText(totalHours),'Grup ve özel ders')
  );
  $('ownerAlertBadge').textContent=(tracking||reminders)?'('+((tracking?.alerts||[]).length+(reminders?.total||0))+')':'';
  $('ownerUpdated').textContent='Güncellendi: '+new Date().toLocaleString('tr-TR');
 }
 function renderHighlights(){
  const root=$('ownerHighlights');root.replaceChildren();
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
  const todayRows=(overview.todayLessons||[]),todayRoot=$('ownerToday');todayRoot.replaceChildren();
  for(const r of todayRows){const c=add(todayRoot,'div','owner-schedule-card');add(c,'strong','',r.group||gName(r.groupId));add(c,'small','',r.start+' – '+r.end+' · '+tName((overview.groups||[]).find(g=>g.id===r.groupId)?.teacherId));}
  if(!todayRows.length)showEmpty('ownerToday','Bugün planlı ders yok.');
  const r=$('ownerRecent');r.replaceChildren();for(const x of lessons().slice(0,5))r.append(lessonRow(x,true));if(!r.children.length)showEmpty('ownerRecent','Henüz ders kaydı yok.');
  const preview=$('ownerGroupPreview');preview.replaceChildren();for(const g of activeGroups().slice(0,6))preview.append(groupCard(g));
  if(!preview.children.length)showEmpty('ownerGroupPreview','Aktif grup bulunamadı.');
 }
 function groupCard(g){
  const total=unit(g),done=unitsDone(g),percent=Math.min(100,Math.round(done/total*100)),stat=(tracking?.groups||[]).find(x=>x.id===g.id),dates=dateStatus(g);
  const box=node('article','owner-group-card');const head=add(box,'div','owner-group-head'),title=add(head,'div');
  add(title,'span','owner-level',g.level||'—');add(title,'h3','',g.name);head.append(pill(g.status||'—',g.status==='Aktif'?'regular':'untracked'));
  add(box,'div','owner-group-meta',tName(g.teacherId)+' · '+(stat?stat.students:g.students||0)+' öğrenci');
  const prog=add(box,'div','owner-progress-info');add(prog,'strong','',done+' / '+total+' ünite');add(prog,'span','',percent+'%');
  const bar=add(box,'div','owner-progress'),fill=add(bar,'div');fill.style.width=percent+'%';
  const statRow=add(box,'div','owner-group-stats');for(const x of [stat?'Katılım '+round(stat.present,stat.present+stat.absent):'Yoklama henüz yok',stat?'Ödev eksik '+stat.homeworkMissing:'Ödev bekleniyor',stat?.atRisk?stat.atRisk+' öncelikli öğrenci':null])if(x)add(statRow,'span','',x);
  const detail=add(box,'details');add(detail,'summary','','Program, son rapor ve tahmini tarihler');
  const body=add(detail,'div','owner-group-detail');
  add(body,'p','','Başlangıç: '+fmt(g.start)+' · Planlanan bitiş: '+fmt(g.end));
  add(body,'p','','24./son ünite tahmini: '+dates.unit+' · 2 hazırlık dersi sonrası: '+dates.exam);
  const program=(overview.schedule||[]).filter(r=>r.groupId===g.id);
  add(body,'p','','Ders günleri: '+(program.map(p=>p.day+' '+p.start+'–'+p.end).join(' · ')||'Henüz program yok'));
  const latest=(overview.history||[]).filter(r=>r.groupId===g.id).sort((a,b)=>b.date.localeCompare(a.date))[0];
  if(latest)add(body,'p','','Son rapor: '+fmt(latest.date)+' · '+latest.status+(latest.note?' · '+latest.note:''));
  const assigned=(lessonHomework?.items||[]).filter(r=>r.groupId===g.id).slice(0,6);
  if(assigned.length){
   const hw=add(body,'details','ayda-group-homework-detail');
   const pending=assigned.filter(r=>r.shareStatus==='Bekliyor').length;
   add(hw,'summary','','Verilen ödevler · '+assigned.length+' son kayıt'+(pending?' · '+pending+' WhatsApp bekliyor':''));
   for(const r of assigned)add(hw,'p','',fmt(r.date)+' · '+r.text+' · '+(r.shareStatus==='Paylaşıldı'?'Gruba gönderildi (öğretmen onayı)':r.shareStatus==='Bekliyor'?'Paylaşım bekliyor':'Paylaşım bilgisi yok'));
  }
  box.append(quick('Grubun öğrencilerini gör →',()=>{activate('students');$('ownerStudentGroup').value=g.id;renderStudents();}));
  return box;
 }
 function renderGroups(){
  const groups=overview.groups||[],level=$('ownerGroupLevel').value,q=$('ownerGroupSearch').value.trim().toLocaleLowerCase('tr'),state=$('ownerGroupStatus').value;
  const rows=groups.filter(g=>(!level||g.level===level)&&(!state||g.status===state)&&(!q||(g.name+' '+g.level+' '+tName(g.teacherId)).toLocaleLowerCase('tr').includes(q)));
  const root=$('ownerGroupList');root.replaceChildren();for(const g of rows)root.append(groupCard(g));
  if(!rows.length)showEmpty('ownerGroupList','Bu koşullara uygun grup bulunamadı.');
 }
 function lastRecord(item,type){if(!item)return 'Kayıt yok';return (type==='attendance'&&item.excused&&item.status==='Gelmedi'?'Mazeretli':item.status)+' · '+fmt(item.date);}
 function studentCard(s){
  const box=node('article','owner-student-card');const g=(overview.groups||[]).find(g=>g.id===s.groupId);
  const head=add(box,'div','owner-student-head'),identity=add(head,'div');
  add(identity,'h3','',s.name);add(identity,'small','',gName(s.groupId)+' · '+tName(g?.teacherId));
  head.append(pill(formats[status(s)],status(s)));
  if(status(s)==='danger'){
   const state=add(box,'div','owner-student-recent');add(state,'span','','İlgilenme durumu: '+(s.followupStatus||'Yeni'));
   for(const option of ['Takipte','Çözüldü']){
    const b=quick(option,async()=>{b.disabled=true;try{const out=await api('setFollowup',token,{payload:payload64(JSON.stringify({studentId:s.id,status:option}))});if(!out.saved)throw Error('Kayıt onayı alınamadı.');tracking=await api('trackingSummary',token);renderAll();}catch(e){alert('Takip güncellenemedi: '+e.message);}finally{b.disabled=false;}});
    state.append(b);
   }
  }
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
  window.AYDA_NOTES?.mount(box,s,(action,params)=>api(action,token,params));
  box.append(quick('Öğrenciye WhatsApp mesajı hazırla',()=>{activate('messages');window.dispatchEvent(new CustomEvent('ayda:compose-student',{detail:{studentId:s.id,groupId:s.groupId}}));}));
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
  $('ownerStudentCount').textContent=values.length+' / '+all.length+' öğrenci';
  const root=$('ownerStudentList');root.replaceChildren();for(const s of values)root.append(studentCard(s));
  if(!values.length)showEmpty('ownerStudentList',tracking?'Kriterlere uygun öğrenci yok.':'Öğrenci verileri yüklenemedi.');
 }
 function table(rootId,headers,rows){
  const root=$(rootId);root.replaceChildren();if(!rows.length){showEmpty(rootId,'Henüz kayıt yok.');return;}
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
  $('ownerLessonCount').textContent='Gösterilen: '+Math.min(lessonLimit,list.length)+' / '+list.length+' rapor';
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
    if(group.start&&date<group.start||group.end&&date>group.end)continue;
    if(entry.day!==weekdays[new Date(Date.UTC(year,mon-1,day)).getUTCDay()])continue;
    planned.add(entry.groupId+'|'+date+'|'+entry.start);
   }
  }
  const completedThisMonth=(overview?.history||[]).filter(r=>r.date?.startsWith(month)&&r.status==='İşlendi').length;
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
 function renderAll(){
  if(!overview)return;
  const work=[
   ['ownerKpis',renderKpis],['ownerHighlights',renderHighlights],['ownerToday',renderOverview],['ownerWeekly',renderWeekly],
   ['ownerGroupList',renderGroups],['ownerStudentList',renderStudents],['ownerAttendanceKpis',renderAttendance],
   ['ownerLessonList',renderLessons],['ownerTeacherTable',renderTeachers],['ownerScheduleList',renderSchedule],
   ['ownerAlertList',renderAlerts],['ownerAccountsTable',renderAccounts]
  ];
  robust('ownerStudentList',updateGroupSelectors);
  for(const [id,fn] of work)robust(id,fn);
 }
 $('ownerLoginForm').addEventListener('submit',e=>{e.preventDefault();login($('ownerKey').value);});
 $('ownerRefresh').addEventListener('click',refresh);
 $('ownerLogout').addEventListener('click',()=>{sessionStorage.removeItem('aydaKey');token='';overview=null;tracking=null;reminders=null;contactDirectory=null;lessonHomework=null;activeApi='';$('ownerVaultSecrets').replaceChildren();$('ownerVaultSecrets').hidden=true;$('ownerVaultReveal').hidden=false;$('ownerVaultHide').hidden=true;$('ownerApp').hidden=true;$('ownerLogin').hidden=false;$('ownerLogout').hidden=true;errorMessage('');$('ownerLoginError').textContent='';const skip=$('ownerSkip');if(skip){skip.href='#ownerLogin';skip.textContent='Giriş bölümüne geç';}window.dispatchEvent(new Event('ayda:owner-logout'));});
 $('ownerNav').addEventListener('click',e=>{const b=e.target.closest('[data-tab]');if(b)activate(b.dataset.tab);});
 window.addEventListener('hashchange',()=>{const n=location.hash.slice(1);if(['overview','messages','alerts','attendance','students','groups','lessons','teachers','schedule','accounts'].includes(n)&&token)activate(n);});
 for(const b of document.querySelectorAll('[data-jump]'))b.addEventListener('click',()=>activate(b.dataset.jump));
 for(const id of ['ownerStudentSearch','ownerStudentGroup','ownerStudentStatus','ownerStudentSort'])$(id).addEventListener(id==='ownerStudentSearch'?'input':'change',renderStudents);
 for(const id of ['ownerGroupSearch','ownerGroupLevel','ownerGroupStatus'])$(id).addEventListener(id==='ownerGroupSearch'?'input':'change',renderGroups);
 $('ownerAttendanceFilter').addEventListener('change',renderAttendance);
 for(const id of ['ownerLessonSearch','ownerLessonMonth','ownerLessonType','ownerLessonStatus'])$(id).addEventListener(id==='ownerLessonSearch'?'input':'change',()=>{lessonLimit=40;renderLessons();});
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
 const previous=sessionStorage.getItem('aydaKey');if(previous)login(previous);
})();
