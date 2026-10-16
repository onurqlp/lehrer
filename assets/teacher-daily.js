"use strict";
/* AYDA teacher first: count lessons, finish missed records, receive optional development feedback. */
(()=>{
 const $=id=>document.getElementById(id);
 const el=(tag,cls,text)=>{const x=document.createElement(tag);if(cls)x.className=cls;if(text!==undefined)x.textContent=String(text);return x;};
 const makeButton=(text,handle)=>{const b=el('button','ayda-inline-btn',text);b.type='button';b.addEventListener('click',handle);return b;};
 const tr=()=>typeof data!=='undefined'&&data?.user?.role==='teacher';
 const monthOf=()=>String(data?.today||new Date().toISOString().slice(0,10)).slice(0,7);
 const formatDate=date=>String(date).replace(/^(\d{4})-(\d\d)-(\d\d)$/,'$3.$2.$1');
 const monthWrap=el('section','ayda-month-overview hidden');monthWrap.id='aydaMonthOverview';
 const monthTop=el('div','ayda-auto-title');monthTop.append(el('h2','','Bu ay ders durumum'));
 const monthInput=el('input');monthInput.type='month';monthInput.id='aydaMonthSelect';monthInput.setAttribute('aria-label','Aylık ders durumunu seç');
 monthTop.append(monthInput);monthWrap.append(monthTop);
 const monthNumbers=el('div','ayda-auto-metrics');monthWrap.append(monthNumbers);
 const monthInfo=el('p','ayda-auto-subtle');monthWrap.append(monthInfo);
 const stats=$('app')?.querySelector('.stats');if(stats)stats.insertAdjacentElement('afterend',monthWrap);
 const daily=$('daily'),groupTitle=$('groupTitle')?.closest('.section');
 if(daily&&groupTitle){groupTitle.parentNode.insertBefore(daily,groupTitle);}
 const tracker=$('teacherTracking'),history=$('history'),historyTitle=history?.previousElementSibling;
 if(tracker&&historyTitle)historyTitle.parentNode.insertBefore(tracker,historyTitle);
 const makeup=el('section','ayda-makeup-center hidden');makeup.id='aydaMakeupCenter';
 const head=el('div','ayda-auto-title');head.append(el('h2','','Sonradan tamamla'));const reload=makeButton('↻ Yenile',()=>loadMakeup());head.append(reload);
 const makeupIntro=el('p','ayda-auto-subtle','Eksik yoklama için yeni ders raporu yazılmaz. Ödev kontrolü ise tamamen isteğe bağlıdır.');const makeupBody=el('div','ayda-makeup-body');makeup.append(head,makeupIntro,makeupBody);
 daily?.insertAdjacentElement('afterend',makeup);
 const feedback=el('details','ayda-feedback hidden');feedback.id='aydaTeacherFeedback';
 feedback.append(el('summary','','Sistemle ilgili fikrim / sorun bildirimim'));
 const inner=el('div','ayda-feedback-inner');inner.append(el('p','ayda-auto-subtle','Sistemi daha iyi yapmak için önerinizi doğrudan AYDA yönetimine iletin. Ders kayıtlarını etkilemez.'));
 const feedbackForm=el('form','ayda-feedback-form');feedbackForm.id='aydaFeedbackForm';
 const choice=el('select');choice.id='aydaFeedbackCategory';choice.setAttribute('aria-label','Geri bildirim türü');
 for(const [value,label] of [['Fikir','Geliştirme fikri'],['Sorun','Teknik sorun'],['İyileştirme','Kullanım kolaylığı'],['Diğer','Diğer']])choice.add(new Option(label,value));
 const text=el('textarea');text.id='aydaFeedbackText';text.placeholder='Örn. Ders yoklamasını telefondan biraz daha hızlı girebilmek istiyorum…';text.rows=3;text.minLength=8;text.maxLength=1400;text.required=true;text.setAttribute('aria-label','Geliştirme öneriniz');
 const submit=el('button','primary','Yönetime gönder');submit.type='submit';
 const feedbackState=el('p','ayda-note-state');feedbackState.id='aydaFeedbackState';feedbackState.setAttribute('role','status');
 feedbackForm.append(choice,text,submit,feedbackState);
 const replies=el('div','ayda-feedback-replies');replies.id='aydaFeedbackReplies';
 inner.append(feedbackForm,replies);feedback.append(inner);
 if(tracker)tracker.insertAdjacentElement('afterend',feedback);else daily?.insertAdjacentElement('afterend',feedback);
 let request=0,lastMonth=null,lastMakeup=null;
 function metric(parent,label,value){
  const card=el('div','ayda-auto-metric');card.append(el('strong','',value),el('span','',label));parent.append(card);
 }
 function monthFallback(month){
  const groups=data.groups||[],members=new Map(groups.filter(g=>g.status==='Aktif').map(g=>[g.id,g]));
  const sch=(data.schedule||[]).filter(s=>members.has(s.groupId));
  const year=Number(month.slice(0,4)),mon=Number(month.slice(5,7))-1,days=new Date(Date.UTC(year,mon+1,0)).getUTCDate();
  const week=['Pazar','Pazartesi','Salı','Çarşamba','Perşembe','Cuma','Cumartesi'],set=new Set();
  for(let day=1;day<=days;day++){
   const d=new Date(Date.UTC(year,mon,day)),date=d.toISOString().slice(0,10);
   for(const item of sch){const g=members.get(item.groupId);
    if(item.day!==week[d.getUTCDay()]||(g.start&&date<g.start)||(g.end&&date>g.end))continue;
    set.add(item.groupId+'|'+date+'|'+item.start);
   }
  }
  const lessons=(data.history||[]).filter(x=>x.date?.startsWith(month));
  const completed=lessons.filter(x=>x.status==='İşlendi').length,cancelled=lessons.filter(x=>x.status!=='İşlendi').length;
  const privateCompleted=(data.privateHistory||[]).filter(x=>x.date?.startsWith(month)&&x.status==='İşlendi').length;
  return {planned:set.size,completed,privateCompleted,cancelled,remaining:Math.max(0,set.size-completed-cancelled),fallback:true};
 }
 function paintMonth(result){
  if(!tr())return;monthWrap.classList.remove('hidden');monthNumbers.replaceChildren();
  metric(monthNumbers,'Planlanan grup dersi',result.planned??'—');
  metric(monthNumbers,'İşlediğim grup dersi',result.completed??'—');
  metric(monthNumbers,'Kalan planlı ders',result.remaining??'—');
  metric(monthNumbers,'Özel ders kaydı',result.privateCompleted??'—');
  monthInfo.textContent='Bu sayılar '+monthInput.value+' ayındaki kayıtlı haftalık programa göredir. Tatiller, değişen öğretmenler ve program dışı dersler nedeniyle gerçekleşen takvim farklı olabilir.'+(result.fallback?' · Mevcut ekran verilerinden hesaplandı.':'');
 }
 async function loadMonth(){
  if(!tr())return;monthInput.value=monthInput.value||monthOf();
  const month=monthInput.value,local=monthFallback(month);paintMonth(local);
  try{const fresh=await jsonp('teacherMonthly',{month});if(fresh?.month===month&&monthInput.value===month){lastMonth=fresh;paintMonth(fresh);}}
  catch{ /* Older Apps Script: local snapshot remains usable. */ }
 }
 function makeActionContent(item){
  const form=el('div','ayda-makeup-expanded hidden');
  const tally=el('p','ayda-auto-subtle','Ödev kontrolü yapılmış öğrencileri işaretleyin. Gelmeyenler ve kontrol edilmeyenler başarısız sayılmaz.');
  const controls=el('div','ayda-makeup-students');const state=el('span','ayda-note-state');const submit=makeButton('Ödev kontrolünü kaydet',async()=>{
   const answers=[...controls.querySelectorAll('select[data-student]')].map(x=>({studentId:x.dataset.student,status:x.value}));
   if(!answers.some(a=>a.status!=='Kontrol edilmedi')){state.textContent='En az bir öğrencinin ödevini kontrol etmiş olmalısınız.';return;}
   submit.disabled=true;state.textContent='Kaydediliyor…';
   try{const payload=utf8Base64Url(JSON.stringify({groupId:item.groupId,date:item.date,answers}));
    const result=await jsonp('saveHomework',{payload});if(!result.saved)throw Error('Kayıt onayı alınamadı.');
    state.textContent='Ödevler kaydedildi.';window.dispatchEvent(new Event('ayda:saved'));await loadMakeup();
   }catch(err){state.textContent='Kayıt doğrulanamadı. Tekrar denemeden önce kontrol edin: '+err.message;}
   finally{submit.disabled=false;}
  });
  for(const student of item.students||[]){
   const line=el('div','ayda-makeup-student');line.append(el('span','',student.name));
   const select=el('select');select.dataset.student=student.id;select.setAttribute('aria-label',student.name+' ödev durumu');
   for(const opt of ['Kontrol edilmedi','Yaptı','Yapmadı'])select.add(new Option(opt,opt));
   if(!student.present){select.disabled=true;select.title='Yoklamada gelmedi olarak kayıtlı';}
   line.append(select);controls.append(line);
  }
  form.append(tally,controls,submit,state);return form;
 }
 function paintMakeup(list){
  if(!tr())return;makeup.classList.remove('hidden');makeupBody.replaceChildren();
  const absent=list?.missingAttendance||[],homework=list?.optionalHomework||[];
  const attendanceTitle=el('h3','',absent.length?'Yoklaması eksik dersler ('+absent.length+')':'Yoklama eksikleri');
  makeupBody.append(attendanceTitle);
  if(!absent.length)makeupBody.append(el('p','ayda-auto-done','Yoklaması eksik kaydedilmiş ders bulunmuyor.'));
  for(const item of absent.slice(0,12)){
   const card=el('div','ayda-auto-line ayda-auto-warning');
   card.append(el('span','',item.group+' · '+formatDate(item.date)));
   card.append(makeButton('Yoklamayı doldur',()=>window.AYDA_OPEN_LESSON?.(item.groupId,item.date,true)));
   makeupBody.append(card);
  }
  if(absent.length>12)makeupBody.append(el('p','ayda-auto-subtle','İlk 12 ders gösteriliyor.'));
  const details=el('details','ayda-optional-homework');
  const summary=el('summary','','Ödev kontrolünü sonradan girmek (isteğe bağlı) · '+homework.length+' ders');details.append(summary);
  const opt=el('div','ayda-optional-list');
  if(!homework.length)opt.append(el('p','ayda-auto-subtle','Son 21 gün içinde sonradan ödev kontrolü eklenebilecek ders yok.'));
  for(const item of homework.slice(0,14)){
   const line=el('div','ayda-makeup-optional');
   line.append(el('strong','',item.group+' · '+formatDate(item.date)));
   const form=makeActionContent(item);
   line.append(makeButton('Ödevleri işaretle',()=>{form.classList.toggle('hidden');}));
   line.append(form);opt.append(line);
  }
  details.append(opt);makeupBody.append(details);
 }
 async function loadMakeup(){
  if(!tr())return;
  const my=++request;reload.disabled=true;makeup.classList.remove('hidden');
  makeupBody.replaceChildren(el('p','ayda-auto-subtle','Son kayıtlar kontrol ediliyor…'));
  try{const list=await jsonp('makeupList');if(my!==request)return;lastMakeup=list;paintMakeup(list);}
  catch(e){if(my===request)makeupBody.replaceChildren(el('p','ayda-auto-subtle','Sonradan tamamlama özellikleri için güncel Apps Script sürümünün yayımlanması gerekiyor.'));}
  finally{if(my===request)reload.disabled=false;}
 }
 async function loadFeedback(){
  if(!tr())return;
  replies.replaceChildren();
  try{const result=await jsonp('teacherFeedback');const list=result?.rows||[];
   if(!list.length){replies.append(el('p','ayda-auto-subtle','Henüz geri bildiriminiz yok.'));return;}
   const label=el('h3','','Gönderdiğim öneriler');replies.append(label);
   for(const item of list.slice(0,5)){
    const card=el('div','ayda-feedback-reply');
    card.append(el('strong','',item.category+' · '+item.status),el('small','',item.created||''),el('p','',item.message));
    if(item.reply)card.append(el('p','ayda-feedback-admin','Yönetim yanıtı: '+item.reply));
    replies.append(card);
   }
  }catch{replies.append(el('p','ayda-auto-subtle','Geri bildirim geçmişi için güncel Apps Script sürümü gerekiyor.'));}
 }
 feedbackForm.addEventListener('submit',async event=>{
  event.preventDefault();if(!tr())return;submit.disabled=true;feedbackState.textContent='Yönetime iletiliyor…';
  try{
   const result=await jsonp('saveFeedback',{payload:utf8Base64Url(JSON.stringify({category:choice.value,message:text.value.trim()}))});
   if(!result.saved)throw Error('Sunucu kayıt onayı vermedi.');
   text.value='';feedbackState.textContent='Öneriniz yönetim paneline kaydedildi. Teşekkürler.';await loadFeedback();
  }catch(e){feedbackState.textContent='İleti doğrulanamadı. Tekrar göndermeden önce kontrol edin: '+e.message;}
  finally{submit.disabled=false;}
 });
 monthInput.addEventListener('change',loadMonth);
 feedback.addEventListener('toggle',()=>{if(feedback.open)loadFeedback();});
 window.addEventListener('ayda:login',()=>{if(!tr())return;monthInput.value=monthOf();monthWrap.classList.remove('hidden');feedback.classList.remove('hidden');loadMonth();loadMakeup();});
 window.addEventListener('ayda:saved',()=>{if(tr()){loadMonth();loadMakeup();}});
 window.addEventListener('ayda:logout',()=>{request++;monthWrap.classList.add('hidden');makeup.classList.add('hidden');feedback.classList.add('hidden');feedback.open=false;replies.replaceChildren();makeupBody.replaceChildren();monthNumbers.replaceChildren();text.value='';});
})();