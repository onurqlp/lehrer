/* AYDA · Bağlamsal Sistem Sağlığı düzeltme ekranları (yönetici). */
(()=>{
 'use strict';
 const $=id=>document.getElementById(id);
 const host=$('aydaHealthFixCard');if(!host)return;
 const days=['Pazartesi','Salı','Çarşamba','Perşembe','Cuma','Cumartesi','Pazar'];
 const url=new URLSearchParams(location.search);
 let focusType=url.get('aydaFix')||'',focusGroup=url.get('groupId')||'',focusTeacher=url.get('teacherId')||'';
 let focusStudent=url.get('studentId')||'';
 const formatGroup=g=>g.name+' · '+g.id;
 function currentData(){return typeof data!=='undefined'&&data?.user?.role==='admin'?data:null;}
 function options(id,values,label,selected){
  const select=$(id);if(!select)return;
  const prev=selected??select.value;select.replaceChildren(new Option(label,''));
  for(const item of values)select.add(new Option(item.label,item.id));
  if([...select.options].some(o=>o.value===prev))select.value=prev;
 }
 function note(id,msg,success){
  const n=$(id);if(!n)return;n.textContent=msg||'';n.className=success?'ayda-fix-ok':'ayda-fix-error';
 }
 function chooseGroup(id,gid){
  const el=$(id);if(!el)return;
  if([...el.options].some(o=>o.value===gid)){el.value=gid;el.dispatchEvent(new Event('change'));}
 }
 function setStatus(){
  const state=currentData(),g=state?.groups?.find(g=>g.id===$('aydaFixStatusGroup').value);
  $('aydaFixStatus').value=['Aktif','Pasif','Tamamlandı'].includes(g?.status)?g.status:'Aktif';
 }
 function setTeacher(){
  const state=currentData(),g=state?.groups?.find(g=>g.id===$('aydaFixTeacherGroup').value);
  $('aydaFixTeacher').value=(state?.teachers||[]).some(t=>t.id===g?.teacherId&&t.status==='Aktif')?g.teacherId:'';
 }
 function setSchedule(){
  const state=currentData(),gid=$('aydaFixScheduleGroup').value;
  const schedule=(state?.schedule||[]).filter(r=>r.groupId===gid);
  const root=$('aydaFixScheduleRows');root.replaceChildren();
  for(const day of days){
   const existing=schedule.find(r=>r.day===day);
   const row=document.createElement('div');row.className='ayda-fix-day-row';row.dataset.day=day;
   const dayLabel=document.createElement('label');dayLabel.className='ayda-fix-day-label';
   const cb=document.createElement('input');cb.type='checkbox';cb.checked=Boolean(existing);cb.className='ayda-fix-day-checked';
   dayLabel.append(cb,document.createTextNode(' '+day));
   const start=document.createElement('input');start.type='time';start.className='ayda-fix-start';start.setAttribute('aria-label',day+' başlangıç saati');
   const end=document.createElement('input');end.type='time';end.className='ayda-fix-end';end.setAttribute('aria-label',day+' bitiş saati');
   start.value=/^\d\d:\d\d$/.test(String(existing?.start||''))?existing.start:'';
   end.value=/^\d\d:\d\d$/.test(String(existing?.end||''))?existing.end:'';
   const sep=document.createElement('span');sep.textContent='–';sep.className='ayda-fix-time-sep';
   function toggle(){start.disabled=!cb.checked;end.disabled=!cb.checked;row.classList.toggle('is-selected',cb.checked);}
   cb.addEventListener('change',toggle);row.append(dayLabel,start,sep,end);toggle();root.append(row);
  }
 }
 function setup(){
  const state=currentData();if(!state)return;
  const gs=(state.groups||[]).map(g=>({id:g.id,label:formatGroup(g)}));
  const active=[...new Map((state.teachers||[]).filter(t=>t.status==='Aktif').map(t=>[t.id,t])).values()];
  options('aydaFixTeacherGroup',gs,'Grup seçin');
  options('aydaFixScheduleGroup',gs.filter(g=>(state.groups||[]).find(x=>x.id===g.id)?.status==='Aktif'),'Grup seçin');
  options('aydaFixStatusGroup',gs,'Grup seçin');
  options('aydaFixTeacher',active.map(t=>({id:t.id,label:t.name+' · '+t.id})),'Aktif öğretmen seçin');
  setTeacher();setStatus();setSchedule();
 }
 $('aydaFixTeacherGroup').addEventListener('change',setTeacher);
 $('aydaFixStatusGroup').addEventListener('change',setStatus);
 $('aydaFixScheduleGroup').addEventListener('change',setSchedule);
 async function save(action,payload,resultId,button){
  button.disabled=true;note(resultId,'Beta veritabanı kaydı doğrulanıyor…',true);
  try{
   const result=await jsonp(action,{payload:utf8Base64Url(JSON.stringify(payload))});
   if(!result?.saved||result.id!==payload.id)throw Error('Beta API kaydı doğrulamadı. Yeniden göndermeden önce verileri yenileyin.');
   note(resultId,'Kaydedildi. Sistem Sağlığı panelini yenilediğinizde sonuç güncellenecek.',true);
   try{data=await jsonp('overview');render();setup();window.dispatchEvent(new Event('ayda:admin-data-updated'));if(window.parent!==window)window.parent.postMessage({aydaWorkspace:1,view:'changed'},location.origin);}catch(readError){note(resultId,'Beta veritabanı kaydı tamamlandı; ekran yenilenemedi. Sayfayı yenileyin: '+readError.message,true);}
  }catch(err){note(resultId,'Kaydedilemedi: '+err.message,false);}
  finally{button.disabled=false;}
 }
 $('aydaQuickTeacherForm').addEventListener('submit',event=>{
  event.preventDefault();const id=$('aydaFixTeacherGroup').value,teacherId=$('aydaFixTeacher').value;
  if(!id||!teacherId){note('aydaFixTeacherResult','Öğretmen ve grup seçin.',false);return;}
  save('setGroupTeacher',{id,teacherId},'aydaFixTeacherResult',event.submitter||$('aydaQuickTeacherForm').querySelector('button'));
 });
 $('aydaQuickStatusForm').addEventListener('submit',event=>{
  event.preventDefault();const id=$('aydaFixStatusGroup').value,status=$('aydaFixStatus').value;
  if(!id){note('aydaFixStatusResult','Grup seçin.',false);return;}
  const original=currentData()?.groups?.find(g=>g.id===id);
  if(original?.status!==status&&!confirm(original.name+' grubu '+status+' durumuna alınsın mı? Mevcut ders ve öğrenci kayıtları silinmeyecek.'))return;
  save('setGroupStatus',{id,status},'aydaFixStatusResult',event.submitter||$('aydaQuickStatusForm').querySelector('button'));
 });
 $('aydaQuickScheduleForm').addEventListener('submit',event=>{
  event.preventDefault();const id=$('aydaFixScheduleGroup').value;
  const entries=[...$('aydaFixScheduleRows').querySelectorAll('.ayda-fix-day-row')].filter(r=>r.querySelector('.ayda-fix-day-checked').checked).map(r=>({day:r.dataset.day,start:r.querySelector('.ayda-fix-start').value,end:r.querySelector('.ayda-fix-end').value}));
  if(!id||!entries.length||entries.some(x=>!x.start||!x.end||x.end<=x.start)){
   note('aydaFixScheduleResult','Grup, ders günü ve doğru başlangıç/bitiş saatleri gerekli.',false);return;
  }
  if(!confirm('Seçtiğiniz '+entries.length+' ders günü için haftalık program değiştirilsin mi? Önceki ders kayıtları korunacaktır.'))return;
  save('updateGroupSchedule',{id,entries},'aydaFixScheduleResult',event.submitter||$('aydaQuickScheduleForm').querySelector('button'));
 });
 function focusContext(){
  if(!focusType)return;
  const state=currentData();if(!state)return;
  const valid=new Set(['teacher','schedule','status','count','student','account','program']);
  if(!valid.has(focusType))return;
  const action=focusType==='student'?'students':focusType==='account'?'teachers':'groups';
  window.AYDA_ADMIN_MENU?.open(action);
  const gid=(state.groups||[]).some(g=>g.id===focusGroup)?focusGroup:'';
  let target=null;
  if(focusType==='teacher'){
   chooseGroup('aydaFixTeacherGroup',gid);
   if(focusTeacher)$('aydaFixTeacher').value=focusTeacher;
   target=$('aydaQuickTeacherForm');
  }else if(focusType==='schedule'||focusType==='program'){
   chooseGroup('aydaFixScheduleGroup',gid);target=$('aydaQuickScheduleForm');
  }else if(focusType==='status'){
   chooseGroup('aydaFixStatusGroup',gid);target=$('aydaQuickStatusForm');
  }else if(focusType==='count'){
   const select=$('editGroupId');if(select&&[...select.options].some(x=>x.value===gid)){select.value=gid;select.dispatchEvent(new Event('change'));}
   target=$('groupUpdateForm');
  }else if(focusType==='student'){
   chooseGroup('adminStudentGroup',gid);
   if(focusStudent){const pick=$('adminStudentPick');if(pick&&[...pick.options].some(o=>o.value===focusStudent)){pick.value=focusStudent;pick.dispatchEvent(new Event('change'));}}
   target=$('adminStudentForm');
  }else if(focusType==='account'){window.AYDA_ADMIN_MENU?.open('settings','teachers');target=$('accountList');}
  if(target){
   $('aydaFixContext').textContent=gid?'Düzenlenecek grup: '+(state.groups.find(g=>g.id===gid)?.name||gid):'İlgili yönetim alanı açıldı.';
   requestAnimationFrame(()=>{target.scrollIntoView({behavior:'smooth',block:'center'});const el=target.querySelector('select:not([disabled]),input:not([disabled])');if(el)el.focus({preventScroll:true});});
  }
 }
 window.AYDA_HEALTH_EDITORS={open(context={}){
  focusType=String(context.fix||'');focusGroup=String(context.groupId||'');
  focusTeacher=String(context.teacherId||'');focusStudent=String(context.studentId||'');
  setup();focusContext();
  if(focusType==='student'&&focusStudent&&typeof aydaLoadAdminStudents==='function')aydaLoadAdminStudents();
 }};
 document.addEventListener('click',event=>{
  const link=event.target.closest('a[href]');if(!link)return;
  let target;try{target=new URL(link.href,location.href)}catch{return;}
  if(target.origin!==location.origin||!target.searchParams.has('aydaFix'))return;
  if(target.pathname.split('/').pop()!=='index.html'&&target.pathname!==location.pathname)return;
  event.preventDefault();
  window.AYDA_HEALTH_EDITORS.open({
   fix:target.searchParams.get('aydaFix'),groupId:target.searchParams.get('groupId'),
   teacherId:target.searchParams.get('teacherId'),studentId:target.searchParams.get('studentId')
  });
 });
 window.addEventListener('ayda:login',()=>{setup();focusContext();});
 window.addEventListener('ayda:students-loaded',()=>{if(focusType==='student'&&focusStudent)focusContext();});
 if(currentData()){setup();focusContext();}
})();