"use strict";
/* AYDA: authenticated quick actions, missing-report reminders, support and draft recovery. */
(()=>{
 const $=id=>document.getElementById(id);
 const el=(tag,cls,label)=>{const x=document.createElement(tag);if(cls)x.className=cls;if(label!==undefined)x.textContent=String(label);return x;};
 const validGroupUrl=value=>{try{const u=new URL(String(value||''));return u.protocol==='https:'&&((u.hostname==='chat.whatsapp.com'&&/^\/[A-Za-z0-9_-]+$/.test(u.pathname))||(u.hostname==='wa.me'&&/^\/[0-9]+$/.test(u.pathname)))?u.href:'';}catch{return '';}};
 /* Technical support is a single unobtrusive header action, not a floating promotional button. */
 const root=el('section','ayda-automation hidden');root.id='aydaAutomation';root.setAttribute('aria-label','Hızlı işlemler ve eksik kayıtlar');
 const title=el('div','ayda-auto-title');title.append(el('h2','','Hızlı İşlemler ve Hatırlatmalar'));
 const refresh=el('button','ayda-inline-btn','↻ Yenile');refresh.type='button';title.append(refresh);root.append(title);
 const metrics=el('div','ayda-auto-metrics'),items=el('div','ayda-auto-items');root.append(metrics,items);
 const anchor=$('todayLessons');if(anchor)anchor.parentElement.insertBefore(root,anchor);
 const draftKey='ayda-lesson-draft-v1',form=$('reportForm'),fieldIds=['lessonType','lessonDate','groupId','actual','status','completed','note'];
 let alerts=null,request=0;
 function group(id){return (typeof data!=='undefined'&&data?.groups||[]).find(g=>g.id===id);}
 function button(text,handler){const b=el('button','ayda-inline-btn',text);b.type='button';b.addEventListener('click',handler);return b;}
 function openLesson(groupId,date,forAttendance=false){
  if(!group(groupId))return;
  window.AYDA_MAKEUP_ATTENDANCE=forAttendance?{groupId,date}:null;
  $('lessonType').value='group';$('lessonType').dispatchEvent(new Event('change',{bubbles:true}));
  $('groupId').value=groupId;$('groupId').dispatchEvent(new Event('change',{bubbles:true}));
  $('lessonDate').value=date;$('lessonDate').dispatchEvent(new Event('change',{bubbles:true}));
  $('status').value='İşlendi';$('status').dispatchEvent(new Event('change',{bubbles:true}));
  if(forAttendance){const old=(data?.history||[]).find(x=>x.groupId===groupId&&x.date===date);
   if(old){$('note').value=old.note&&old.note.length>=3?old.note:'Önceden kaydedilmiş ders';$('completed').value=old.completed||0;}
   if($('attendancePreview'))$('attendancePreview').open=true;
  }
  window.AYDA_TEACHER_VIEWS?.open?.('daily',{preserveScroll:true});
  $('daily').scrollIntoView({behavior:'smooth',block:'start'});
  if(!forAttendance)$('note').focus({preventScroll:true});
 }
 window.AYDA_OPEN_LESSON=(groupId,date,forAttendance=false)=>openLesson(groupId,date,forAttendance);
 function metric(label,value){const c=el('div','ayda-auto-metric');c.append(el('strong','',value),el('span','',label));metrics.append(c);}
 function render(){
  if(!data?.user){root.classList.add('hidden');return;}
  root.classList.remove('hidden');metrics.replaceChildren();items.replaceChildren();
  metric('Bugünkü ders',data.todayLessons?.length||0);
  metric('Eksik ders raporu',alerts?.reports??'—');
  metric('Eksik yoklama',alerts?.attendance??'—');
  const next=el('div','ayda-auto-quick');
  for(const t of data.todayLessons||[]){
   const g=group(t.groupId);if(!g)continue;
   const line=el('div','ayda-auto-line');line.append(el('span','',g.name+' · '+t.start));
   line.append(button('Dersi aç',()=>openLesson(g.id,data.today)));
   const url=validGroupUrl(g.whatsapp);if(url){const link=el('a','ayda-inline-btn','WhatsApp grubu ↗');link.href=url;link.target='_blank';link.rel='noopener noreferrer';line.append(link);}
   next.append(line);
  }
  if(next.children.length)items.append(next);
  const head=el('div','ayda-auto-subhead',alerts?'Eksik kayıtlar · Son 30 gün':'Eksik kayıt kontrolü');
  items.append(head);
  if(!alerts){items.append(el('p','ayda-auto-subtle','Hatırlatmaların çalışması için Apps Script’in güncel sürümünün yayımlanması gerekir.'));return;}
  if(!alerts.items?.length){items.append(el('p','ayda-auto-done','✓ 12 saati aşan eksik ders veya yoklama kaydı yok.'));return;}
  for(const row of alerts.items.slice(0,12)){
   const wrap=el('div','ayda-auto-line ayda-auto-warning');
   const label=row.type==='attendance'?'Yoklama eksik':'Ders raporu eksik';
   const left=el('div','ayda-auto-copy');left.append(el('strong','',label+' · '+row.group),el('span','',row.date+' · '+row.end+' · '+Math.floor(row.ageHours/24)+' gün / '+row.ageHours%24+' saat önce'));
   wrap.append(left);
   const canOpen=!!group(row.groupId);
   if(canOpen)wrap.append(button(row.type==='attendance'?'Yoklamayı tamamla':'Raporu doldur',()=>openLesson(row.groupId,row.date,row.type==='attendance')));
   if(data.user.role==='admin'){
    const msg='Merhaba hocam, '+row.date+' tarihli '+row.group+' grubu '+(row.type==='attendance'?'ders yoklaması':'ders raporu')+' eksik görünüyor. Müsait olduğunuzda sisteme girip tamamlayabilir misiniz? Teşekkürler.';
    wrap.append(button('Mesajı kopyala',()=>{navigator.clipboard?.writeText(msg).then(()=>{wrap.lastChild.textContent='Kopyalandı ✓';}).catch(()=>{wrap.lastChild.textContent='Kopyalanamadı';});}));
   }
   items.append(wrap);
  }
  if(alerts.items.length>12)items.append(el('p','ayda-auto-subtle','İlk 12 eksik gösteriliyor. Güncelleyerek kontrol edebilirsiniz.'));
 }
 async function load(){
  if(!data?.user)return;const id=++request;alerts=null;render();refresh.disabled=true;
  window.dispatchEvent(new CustomEvent('ayda:reminders-result',{detail:{state:'pending'}}));
  try{const out=await jsonp('reminders');if(id===request){alerts=out;render();window.dispatchEvent(new CustomEvent('ayda:reminders-result',{detail:{state:'success',data:out}}));}}
  catch(e){if(id===request){alerts=null;render();window.dispatchEvent(new CustomEvent('ayda:reminders-result',{detail:{state:'error'}}));}}
  finally{if(id===request)refresh.disabled=false;}
 }
 function saveDraft(){
  if(!data?.user)return;
  const fields={};for(const id of fieldIds)fields[id]=$(id)?.value||'';
  try{sessionStorage.setItem(draftKey,JSON.stringify({teacherId:data.user.id,fields}));}catch{}
  const badge=$('aydaDraftStatus');if(badge)badge.textContent='Taslak bu sekmede saklandı.';
 }
 function restoreDraft(){
  let saved;try{saved=JSON.parse(sessionStorage.getItem(draftKey)||'null');}catch{return;}
  if(!saved||saved.teacherId!==data?.user?.id)return;
  const fields=saved.fields||{};
  for(const id of fieldIds){if(!$(id)||fields[id]===undefined)continue;
   if(id==='groupId'&&!group(fields[id]))continue;
   if(id==='lessonDate'&&(fields[id]>data.today||!/^\d{4}-\d\d-\d\d$/.test(fields[id])))continue;
   $(id).value=fields[id];$(id).dispatchEvent(new Event('change',{bubbles:true}));
  }
 }
 if(form){const label=el('p','ayda-draft-status','');label.id='aydaDraftStatus';form.append(label);
  form.addEventListener('input',saveDraft);form.addEventListener('change',saveDraft);
 }
 refresh.addEventListener('click',load);
 window.addEventListener('ayda:teacher-monitor-refresh',()=>{if(data?.user?.role==='teacher')load();});
 window.addEventListener('ayda:login',()=>{restoreDraft();load();});
 window.addEventListener('ayda:saved',()=>{try{sessionStorage.removeItem(draftKey);}catch{}const badge=$('aydaDraftStatus');if(badge)badge.textContent='';load();});
 window.addEventListener('ayda:logout',()=>{request++;alerts=null;try{sessionStorage.removeItem(draftKey);}catch{}root.classList.add('hidden');});
})();