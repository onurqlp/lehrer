"use strict";
(()=>{
 const $=id=>document.getElementById(id);
 const make=(tag,cls,text)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=String(text);return el;};
 const append=(el,tag,cls,text)=>{const n=make(tag,cls,text);el.append(n);return n;};
 const empty=(id,message)=>{const target=$(id);target.replaceChildren(make('div','empty',message));};
 let authKey='',overview=null,tracking=null,seq=0,busy=false,tab='overview',teacherExport=[];
 const API=String(window.AYDA_API_URL||'').trim();
 const riskLabel={danger:'Öncelikli',watch:'Takip edilmeli',regular:'Düzenli',untracked:'Henüz veri yok'};
 const fmt=date=>/^\d{4}-\d{2}-\d{2}$/.test(String(date||''))?date.slice(8)+'.'+date.slice(5,7)+'.'+date.slice(0,4):(date||'—');
 const today=()=>overview?.today||new Date().toISOString().slice(0,10);
 async function api(action,key){
  const id=API.match(/\/s\/([A-Za-z0-9_-]+)\/exec(?:$|\?)/)?.[1];
  const root='https://script.google.com/';
  const sources=id?[root+'a/macros/aydadil.com/s/'+id+'/exec',root+'a/aydadil.com/macros/s/'+id+'/exec',root+'macros/s/'+id+'/exec']:[API];
  let last;
  for(const url of [...new Set(sources)]){
    try{return await apiAt(url,action,key);}
    catch(error){last=error;if(!error.transport)throw error;}
  }
  throw last||Error('Google API bağlantısına ulaşılamadı.');
 }
 function apiAt(address,action,key){
  return new Promise((resolve,reject)=>{
   if(!/^https:\/\/script\.google\.com\/(?:macros\/s\/|a\/macros\/[^/]+\/s\/|a\/[^/]+\/macros\/s\/)/.test(address)){reject(Error('Google API adresi eksik.'));return;}
   const cb='ayda_cb_'+Date.now()+'_'+(++seq),script=document.createElement('script'),url=new URL(address);
   let done=false;
   const finish=(err,val)=>{if(done)return;done=true;clearTimeout(timer);script.remove();delete window[cb];err?reject(err):resolve(val);};
   const timer=setTimeout(()=>{const e=Error('Google sunucusundan yanıt gelmedi.');e.transport=true;finish(e);},12000);
   window[cb]=answer=>answer?.ok?finish(null,answer.data):finish(Error(answer?.error||'Sunucu yanıtı geçersiz.'));
   url.searchParams.set('callback',cb);url.searchParams.set('action',action);url.searchParams.set('key',key);
   script.onerror=()=>{const e=Error('Google Apps Script bağlantısına ulaşılamadı.');e.transport=true;finish(e);};
   script.onload=()=>{if(!done){const e=Error('Apps Script geçerli JSONP yanıtı üretmedi.');e.transport=true;finish(e);}};
   script.src=url.toString();document.head.append(script);
  });
 }
 function teacherName(id){return (overview?.teachers||[]).find(t=>t.id===id)?.name||id||'—';}
 function groupName(id){return (overview?.groups||[]).find(g=>g.id===id)?.name||id||'—';}
 function groupOf(s){return groupName(s.groupId);}
 function risk(s){return ['danger','watch','regular','untracked'].includes(s?.riskLevel)?s.riskLevel:'untracked';}
 function pill(label,type){return make('span','pill '+(type||'untracked'),label);}
 function setBusy(value){busy=value;$('managerLoginButton').disabled=value;$('managerRefresh').disabled=value;}
 function showError(text){$('managerStatus').textContent=text||'';}
 function setTab(id){if(!['overview','students','groups','teachers','lessons','alerts'].includes(id))return;tab=id;for(const button of $('managerTabs').querySelectorAll('[data-tab]'))button.classList.toggle('active',button.dataset.tab===id);for(const section of document.querySelectorAll('.tab-panel'))section.hidden=section.id!=='manager-'+id;}
 async function login(key){
  if(busy)return;const token=String(key||'');if(!token){$('managerLoginError').textContent='Yönetici parolasını girin.';return;}
  setBusy(true);$('managerLoginError').textContent='';showError('');
  try{
   const candidate=await api('overview',token);
   if(candidate?.user?.role!=='admin')throw Error('Bu sayfa yalnızca yönetici hesabına açıktır.');
   authKey=token;overview=candidate;sessionStorage.setItem('aydaKey',token);
   $('managerLogin').hidden=true;$('managerApp').hidden=false;$('managerLogout').hidden=false;$('managerKey').value='';
   if(!$('managerMonth').value)$('managerMonth').value=today().slice(0,7);
   if(!$('managerLessonMonth').value)$('managerLessonMonth').value=today().slice(0,7);
   await refreshTracking();
  }catch(error){$('managerLogin').hidden=false;$('managerApp').hidden=true;$('managerLogout').hidden=true;$('managerLoginError').textContent=error.message;authKey='';}
  finally{setBusy(false);}
 }
 async function refreshTracking(){
  try{const result=await api('trackingSummary',authKey);if(result?.scope!=='all')throw Error('Google Apps Script üzerinde yeni takip sürümü henüz yayımlanmadı.');tracking=result;showError('');}
  catch(error){tracking=null;showError('Öğrenci takibi yüklenemedi: '+error.message+' — Grup ve ders kayıtları görüntülenebilir.');}
  render();
 }
 async function refresh(){
  if(busy||!authKey)return;setBusy(true);showError('');
  try{overview=await api('overview',authKey);if(overview?.user?.role!=='admin')throw Error('Yönetici oturumu geçersiz.');await refreshTracking();}
  catch(error){showError('Yenileme başarısız: '+error.message);}
  finally{setBusy(false);}
 }
 function kpi(label,value,cls){const el=make('article','kpi '+(cls||''));append(el,'span','',label);append(el,'strong','',String(value));return el;}
 function renderKpis(){
  const active=(overview?.groups||[]).filter(g=>g.status==='Aktif');
  const students=tracking?.students||[];
  const risky=students.filter(s=>risk(s)==='danger').length;
  const upcoming=active.filter(g=>g.start&&g.start>=today()&&daysBetween(g.start,today())<=7).length;
  const reports=(overview?.history||[]).filter(x=>x.date===today()&&x.status==='İşlendi').length;
  const root=$('managerKpis');root.replaceChildren(kpi('Aktif grup',active.length),kpi('Kayıtlı öğrenci',tracking?students.length:'—'),kpi('Bugün raporlanan ders',reports),kpi('Öncelikli öğrenci',tracking?risky:'—','danger'),kpi('7 gün içinde başlayacak',upcoming,'warn'));
  $('managerAlertCount').textContent=tracking?'('+risky+')':'';
 }
 function daysBetween(a,b){const da=Date.parse(a+'T00:00:00Z'),db=Date.parse(b+'T00:00:00Z');return Number.isFinite(da)&&Number.isFinite(db)?Math.round((da-db)/86400000):Infinity;}
 function forecast(g){
  const rem=Math.max(0,(Number(g.total)||24)-(Number(g.completed)||0));
  if(rem===0)return {unit:'Tamamlandı',prep:'İşlendi'};
  const weekdays=['Pazar','Pazartesi','Salı','Çarşamba','Perşembe','Cuma','Cumartesi'];
  const days=new Set((overview.schedule||[]).filter(s=>s.groupId===g.id&&s.status==='Aktif').map(s=>s.day));
  if(!days.size)return {unit:'Program eksik',prep:'Program eksik'};
  const start=g.start&&g.start>today()?g.start:today(),d=new Date(start+'T00:00:00Z');
  if(!Number.isFinite(d.getTime()))return {unit:'Program eksik',prep:'Program eksik'};
  const matches=[];for(let i=0;i<900&&matches.length<rem+2;i++){if(days.has(weekdays[d.getUTCDay()]))matches.push(d.toISOString().slice(0,10));d.setUTCDate(d.getUTCDate()+1);}
  return {unit:fmt(matches[rem-1]),prep:fmt(matches[rem+1])};
 }
 function groupCard(g){
  const actual=Math.max(0,Number(g.completed)||0),total=Math.max(1,Number(g.total)||24),percent=Math.min(100,Math.round(actual*100/total)),stats=(tracking?.groups||[]).find(x=>x.id===g.id);
  const box=make('article','group-card'),top=append(box,'div','group-top'),name=make('div');
  append(name,'h3','',g.name);top.append(name,pill(g.level||'Grup','blue'));
  append(box,'div','group-info',teacherName(g.teacherId)+' · '+(stats?stats.students:(g.students||0))+' öğrenci · '+(g.status||'—'));
  const line=append(box,'div','line');append(line,'strong','',actual+' / '+total+' ünite');append(line,'span','subtle',percent+'%');
  const track=append(box,'div','progress-track');const bar=append(track,'div','progress-bar');bar.style.width=percent+'%';
  const footer=append(box,'div','group-footer');
  footer.append(make('span','metric',stats?stats.present+' katılım':'Yoklama bekleniyor'));
  if(stats?.atRisk)footer.append(make('span','metric alert',stats.atRisk+' öncelikli öğrenci'));
  if(stats?.watch)footer.append(make('span','metric',stats.watch+' takip edilmeli'));
  const dates=forecast(g),row=append(box,'div','group-dates');
  row.append(document.createTextNode('Tahmini son ünite: '));append(row,'strong','',dates.unit);
  append(row,'div','','2 sınav hazırlığı dersi sonrası: '+dates.prep);
  const open=append(box,'button','group-action','Bu grubun öğrencilerini gör →');open.type='button';open.addEventListener('click',()=>{$('managerStudentGroup').value=g.id;setTab('students');renderStudents();});
  return box;
 }
 function renderGroups(){
  const groups=overview?.groups||[],search=$('managerGroupSearch').value.toLocaleLowerCase('tr').trim(),level=$('managerGroupLevel').value;
  const filtered=groups.filter(g=>(!level||g.level===level)&&(!search||(g.name+' '+teacherName(g.teacherId)).toLocaleLowerCase('tr').includes(search)));
  for(const [id,arr] of [['managerGroupList',filtered],['managerGroupPreview',groups.slice(0,6)]]){
   const root=$(id);root.replaceChildren();for(const group of arr)root.append(groupCard(group));if(!arr.length)empty(id,'Bu ölçütlere uygun grup bulunamadı.');
  }
 }
 function recentLabel(item,type){
  if(!item)return 'Kayıt yok';
  if(type==='attendance')return (item.status==='Gelmedi'&&item.excused?'Mazeretli':item.status)+' · '+fmt(item.date);
  return item.status+' · '+fmt(item.date);
 }
 function studentCard(s){
  const box=make('article','student-card'),top=append(box,'div','student-top'),name=make('div'),level=risk(s);
  append(name,'h3','',s.name);top.append(name,pill(riskLabel[level],level));
  append(box,'div','student-meta',groupOf(s)+' · '+teacherName((overview.groups||[]).find(g=>g.id===s.groupId)?.teacherId));
  const stats=append(box,'div','student-stats');
  for(const [label,value] of [['Katılım',s.attendanceRate===null||s.attendanceRate===undefined?'—':s.attendanceRate+'%'],['Gelmedi',s.absent||0],['Eksik ödev',s.homeworkMissing||0]]){
   const cell=append(stats,'div','student-stat');append(cell,'span','',label);append(cell,'strong','',String(value));
  }
  const meta=append(box,'div','student-meta','Son yoklama: '+recentLabel(s.lastAttendance,'attendance'));
  meta.append(document.createTextNode(' · Son ödev: '+recentLabel(s.lastHomework,'homework')));
  const detail=append(box,'details');append(detail,'summary','','Son 5 kayıt ve durum ayrıntısı');
  const attendance=append(detail,'div','micro','Son yoklamalar');const alist=append(detail,'ol','detail-list');
  for(const x of s.recentAttendance||[])append(alist,'li','',recentLabel(x,'attendance'));
  if(!s.recentAttendance?.length)append(alist,'li','','Henüz yoklama kaydı yok');
  append(detail,'div','micro','Son ödev kontrolleri');const hlist=append(detail,'ol','detail-list');
  for(const x of s.recentHomework||[])append(hlist,'li','',recentLabel(x,'homework'));
  if(!s.recentHomework?.length)append(hlist,'li','','Henüz ödev kaydı yok');
  return box;
 }
 function renderStudents(){
  const groups=overview?.groups||[],select=$('managerStudentGroup'),selected=select.value;
  select.replaceChildren(new Option('Tüm gruplar',''));for(const g of groups)select.add(new Option(g.name,g.id));select.value=selected;
  const list=tracking?.students||[],search=$('managerStudentSearch').value.toLocaleLowerCase('tr').trim(),filter=select.value,riskFilter=$('managerStudentRisk').value;
  const shown=list.filter(s=>(!filter||s.groupId===filter)&&(!riskFilter||risk(s)===riskFilter)&&(!search||s.name.toLocaleLowerCase('tr').includes(search)));
  $('managerStudentTotal').textContent=shown.length+' / '+list.length+' öğrenci';const root=$('managerStudentList');root.replaceChildren();
  for(const s of shown)root.append(studentCard(s));
  if(!shown.length)empty('managerStudentList',tracking?'Öğrenci bulunamadı. Filtreleri kontrol edin.':'Öğrenci takip verileri yüklenemedi.');
 }
 function renderAlerts(){
  const root=$('managerAlertList');root.replaceChildren();
  const students=(tracking?.students||[]).filter(s=>risk(s)==='danger').sort((a,b)=>Number(b.consecutiveAbsent)-Number(a.consecutiveAbsent)||(b.recentAbsent||0)-(a.recentAbsent||0));
  for(const s of students)root.append(studentCard(s));
  if(!students.length)empty('managerAlertList',tracking?'Öncelikli takip gerektiren öğrenci kaydı yok.':'Öğrenci takip verisi bulunamadı.');
 }
 function renderHighlights(){
  const root=$('managerHighlights');root.replaceChildren();
  const alerts=tracking?.alerts||[];
  for(const a of alerts.slice(0,4)){
   const c=append(root,'article','note-card danger');
   append(c,'strong','',a.name+' · '+a.group);
   const info=[];if(a.consecutiveAbsent)info.push('Üst üste devamsızlık');if(a.recentAbsent)info.push('Son 5 derste '+a.recentAbsent+' mazeretsiz devamsızlık');if(a.recentHomeworkMissing)info.push('Son 5 ödevde '+a.recentHomeworkMissing+' eksik');
   append(c,'p','',info.join(' · '));
  }
  const nearby=(overview?.groups||[]).filter(g=>g.status==='Aktif'&&Number(g.total||24)-Number(g.completed||0)<=3&&Number(g.total||24)>Number(g.completed||0));
  for(const g of nearby.slice(0,3)){const c=append(root,'article','note-card warn');append(c,'strong','',g.name+' · Bitiş yaklaşıyor');append(c,'p','',Math.max(0,(Number(g.total)||24)-(Number(g.completed)||0))+' ünite kaldı · '+teacherName(g.teacherId));}
  if(!root.children.length)empty('managerHighlights',tracking?'Şu anda acil takip gerektiren kayıt yok.':'Takip verisi yüklenince uyarılar burada görünecek.');
 }
 function hours(v){const m=String(v||'').match(/^(\d{1,2}):(\d{2})$/);return m?Number(m[1])+Number(m[2])/60:(Number(v)||0);}
 function lessonRows(){
  return [...(overview?.history||[]).map(x=>({...x,kind:'Grup',groupName:groupName(x.groupId)})),...(overview?.privateHistory||[]).map(x=>({...x,kind:'Özel',groupName:'Özel ders'}))];
 }
 function renderTeachers(){
  const month=$('managerMonth').value,rows=lessonRows().filter(r=>String(r.date||'').startsWith(month)),totals=new Map();
  for(const t of overview?.teachers||[])totals.set(t.id,{name:t.name,group:0,private:0,hours:0,canceled:0});
  for(const r of rows){
   const t=totals.get(r.teacherId)||{name:teacherName(r.teacherId),group:0,private:0,hours:0,canceled:0};
   if(r.status==='İşlendi'){t[r.kind==='Özel'?'private':'group']++;t.hours+=hours(r.actual);}else t.canceled++;
   totals.set(r.teacherId,t);
  }
  teacherExport=[['Öğretmen','Grup dersi','Özel ders','İşlenen ders','Ders saati','İptal / erteleme']];
  const root=$('managerTeacherTable');root.replaceChildren();const table=append(root,'table'),head=append(table,'thead'),tr=append(head,'tr');
  for(const col of teacherExport[0])append(tr,'th','',col);
  const tbody=append(table,'tbody');for(const t of totals.values()){
   const row=[t.name,t.group,t.private,t.group+t.private,t.hours.toLocaleString('tr-TR',{maximumFractionDigits:2}),t.canceled];teacherExport.push(row);
   const tr=append(tbody,'tr');for(const value of row)append(tr,'td','',String(value));
  }
  if(!totals.size)empty('managerTeacherTable','Öğretmen bilgisi bulunamadı.');
 }
 function renderLessons(){
  const month=$('managerLessonMonth').value,search=$('managerLessonSearch').value.toLocaleLowerCase('tr').trim();
  const rows=lessonRows().filter(r=>(!month||r.date?.startsWith(month))&&(!search||(r.groupName+' '+teacherName(r.teacherId)).toLocaleLowerCase('tr').includes(search))).sort((a,b)=>String(b.date||'').localeCompare(String(a.date||''))).slice(0,150);
  const root=$('managerLessonList');root.replaceChildren();for(const row of rows){
   const c=append(root,'article','lesson-card'),left=append(c,'div');append(left,'strong','',row.groupName+' · '+teacherName(row.teacherId));
   append(left,'p','',fmt(row.date)+' · '+row.kind+' dersi · '+(row.actual||'Süre girilmedi')+' saat');
   if(row.topic)append(left,'p','',row.topic);
   c.append(pill(row.status||'—',row.status==='İşlendi'?'regular':'watch'));
  }
  if(!rows.length)empty('managerLessonList','Bu dönem için ders kaydı bulunamadı.');
 }
 function render(){
  if(!overview)return;
  $('managerUpdated').textContent='Son güncelleme: '+new Date().toLocaleString('tr-TR');
  renderKpis();renderHighlights();renderGroups();renderStudents();renderAlerts();renderTeachers();renderLessons();
 }
 $('managerLoginForm').addEventListener('submit',e=>{e.preventDefault();login($('managerKey').value);});
 $('managerRefresh').addEventListener('click',refresh);
 $('managerLogout').addEventListener('click',()=>{sessionStorage.removeItem('aydaKey');authKey='';overview=null;tracking=null;$('managerApp').hidden=true;$('managerLogin').hidden=false;$('managerLogout').hidden=true;showError('');$('managerLoginError').textContent='';});
 $('managerTabs').addEventListener('click',event=>{const b=event.target.closest('[data-tab]');if(b)setTab(b.dataset.tab);});
 document.querySelectorAll('[data-jump]').forEach(b=>b.addEventListener('click',()=>setTab(b.dataset.jump)));
 for(const id of ['managerStudentSearch','managerStudentRisk'])$(id).addEventListener(id==='managerStudentSearch'?'input':'change',renderStudents);
 $('managerStudentGroup').addEventListener('change',renderStudents);
 for(const id of ['managerGroupSearch','managerGroupLevel'])$(id).addEventListener(id==='managerGroupSearch'?'input':'change',renderGroups);
 $('managerMonth').addEventListener('change',renderTeachers);$('managerLessonMonth').addEventListener('change',renderLessons);$('managerLessonSearch').addEventListener('input',renderLessons);
 $('managerCsv').addEventListener('click',()=>{
  const quote=s=>'"'+String(s??'').replace(/^[\s]*[=+@-]/,m=>"'"+m).replace(/"/g,'""')+'"';
  const csv='\ufeff'+teacherExport.map(r=>r.map(quote).join(';')).join('\r\n'),blob=new Blob([csv],{type:'text/csv;charset=utf-8'});
  const u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download='AYDA-ogretmen-saatleri-'+$('managerMonth').value+'.csv';a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);
 });
 const saved=sessionStorage.getItem('aydaKey');if(saved)login(saved);
})();
