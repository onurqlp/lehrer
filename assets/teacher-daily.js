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

 /* Teachers can confirm a concise lesson description with one click; no fabricated automatic note. */
 const noteInput=$('note'),actualInput=$('actual');
 if(actualInput){
  const choices=Array.from({length:6},(_,i)=>{const hour=i+1;return [String(hour).padStart(2,'0')+':00',hour+' saat'];});
  const previous=actualInput.value;actualInput.replaceChildren();
  for(const [value,label] of choices)actualInput.add(new Option(label,value));
  actualInput.value=choices.some(([value])=>value===previous)?previous:'02:00';
 }
 if(noteInput){
  const noteShortcuts=el('div','ayda-note-shortcuts');noteShortcuts.append(el('span','', 'Ödevini hızlı yaz:'));
  for(const [label,make] of [
   ['Ünite alıştırmaları',()=>'Ünite '+($('completed')?.value||'—')+' çalışma kitabındaki alıştırmaları tamamlayın.'],
   ['Kelime tekrarı',()=>'Bu ünitedeki yeni kelimeleri tekrar edip her biriyle bir cümle yazın.'],
   ['Konuşma hazırlığı',()=>'Son işlenen konuyla ilgili kısa bir konuşma hazırlayın.'],
   ['Yazma çalışması',()=>'Son işlediğimiz konuyla ilgili 5 Almanca cümle yazın.']
  ]){
   noteShortcuts.append(makeButton(label,()=>{noteInput.value=make();noteInput.dispatchEvent(new Event('input',{bubbles:true}));noteInput.focus();}));
  }
  noteInput.insertAdjacentElement('afterend',noteShortcuts);
 }
 function suggestDuration(){
  if(!tr()||$('lessonType')?.value!=='group'||!actualInput)return;
  const gid=$('groupId')?.value,day=$('lessonDate')?.value;
  if(!gid||!day)return;
  const wd=['Pazar','Pazartesi','Salı','Çarşamba','Perşembe','Cuma','Cumartesi'][new Date(day+'T12:00:00Z').getUTCDay()];
  const schedule=(data.schedule||[]).find(item=>item.groupId===gid&&item.day===wd);
  if(!schedule)return;
  const a=String(schedule.start||'').match(/^(\d{1,2}):(\d{2})/),b=String(schedule.end||'').match(/^(\d{1,2}):(\d{2})/);
  if(!a||!b)return;
  const minutes=(+b[1]*60+(+b[2]))-(+a[1]*60+(+a[2]));
  if(minutes<=0||minutes>360)return;
  const value=String(Math.floor(minutes/60)).padStart(2,'0')+':'+String(minutes%60).padStart(2,'0');
   if(minutes%60!==0)return;
  if([...actualInput.options].some(opt=>opt.value===value))actualInput.value=value;
 }
 for(const id of ['lessonDate','groupId','lessonType'])$(id)?.addEventListener('change',suggestDuration);

 const daily=$('daily'),groupTitle=$('groupTitle')?.closest('.section');
 if(daily&&groupTitle){groupTitle.parentNode.insertBefore(daily,groupTitle);}
 const tracker=$('teacherTracking'),history=$('history'),historyTitle=history?.previousElementSibling;
 if(tracker&&historyTitle)historyTitle.parentNode.insertBefore(tracker,historyTitle);
 const makeup=el('section','ayda-makeup-center hidden');makeup.id='aydaMakeupCenter';
 const head=el('div','ayda-auto-title');head.append(el('h2','','Sonradan tamamla'));const reload=makeButton('↻ Yenile',()=>loadMakeup());head.append(reload);
 const makeupIntro=el('p','ayda-auto-subtle','Eksik yoklama için yeni ders raporu yazılmaz. Ödev kontrolü ise tamamen isteğe bağlıdır.');const makeupBody=el('div','ayda-makeup-body');makeup.append(head,makeupIntro,makeupBody);
 daily?.insertAdjacentElement('afterend',makeup);

 const homeworkTasks=el('details','ayda-optional-homework ayda-assignment-section');
 homeworkTasks.id='aydaHomeworkTasks';
 homeworkTasks.append(el('summary','','Yeni ödev ver / teslim süresini uzat (isteğe bağlı)'));
 const homeworkBody=el('div','ayda-assignment-body');
 homeworkBody.append(el('p','ayda-auto-subtle','Ödev başlığı ve teslim tarihi girin. Bu ayrı bir görev planıdır; yoklama ve ödev kontrolü notlarını değiştirmez. Öğrenciye otomatik mesaj gönderilmez.'));
 const assignmentForm=el('form','ayda-assignment-form');assignmentForm.id='aydaAssignmentForm';
 const groupLabel=el('label','','Grup');groupLabel.htmlFor='aydaAssignmentGroup';
 const groupSelect=el('select');groupSelect.id='aydaAssignmentGroup';groupSelect.required=true;
 const titleLabel=el('label','','Ödev adı');titleLabel.htmlFor='aydaAssignmentTitle';
 const assignmentTitle=el('input');assignmentTitle.id='aydaAssignmentTitle';assignmentTitle.maxLength=150;assignmentTitle.minLength=4;assignmentTitle.required=true;assignmentTitle.placeholder='Örn. Menschen A2 · Ünite 7 alıştırmaları';
 const descLabel=el('label','','Kısa açıklama (isteğe bağlı)');descLabel.htmlFor='aydaAssignmentDescription';
 const assignmentDesc=el('textarea');assignmentDesc.id='aydaAssignmentDescription';assignmentDesc.maxLength=1000;assignmentDesc.rows=2;assignmentDesc.placeholder='Sayfa, etkinlik ve çalışma yönlendirmesi';
 const dueLabel=el('label','','Teslim tarihi');dueLabel.htmlFor='aydaAssignmentDue';
 const assignmentDue=el('input');assignmentDue.type='date';assignmentDue.id='aydaAssignmentDue';assignmentDue.required=true;
 const sendTask=el('button','primary','Ödevi kaydet');sendTask.type='submit';
 const taskFeedback=el('p','ayda-note-state');taskFeedback.setAttribute('role','status');
 assignmentForm.append(groupLabel,groupSelect,titleLabel,assignmentTitle,descLabel,assignmentDesc,dueLabel,assignmentDue,sendTask,taskFeedback);
 const taskList=el('div','ayda-assignment-list');homeworkBody.append(assignmentForm,taskList);homeworkTasks.append(homeworkBody);
 makeup.append(homeworkTasks);
 let taskRequest=0,taskResult=null;
 function nextDay(date,plus=1){const d=new Date(date+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+plus);return d.toISOString().slice(0,10);}
 function groupOptions(){
  const old=groupSelect.value;groupSelect.replaceChildren(new Option('Grup seçin',''));
  for(const g of (data?.groups||[]).filter(g=>g.status==='Aktif'))groupSelect.add(new Option(g.name,g.id));
  if([...groupSelect.options].some(o=>o.value===old))groupSelect.value=old;
  assignmentDue.min=String(data?.today||'');assignmentDue.max=nextDay(String(data?.today||'2026-10-16'),90);
  if(!assignmentDue.value)assignmentDue.value=nextDay(String(data?.today||'2026-10-16'),3);
 }
 async function changeTask(task,kind,days=0,feedbackNode,button){
  if(button)button.disabled=true;
  if(feedbackNode)feedbackNode.textContent='Güncelleniyor…';
  try{
   const payload=utf8Base64Url(JSON.stringify({id:task.id,kind,days}));
   const result=await jsonp('updateHomeworkTask',{payload});if(!result.saved)throw Error('Kayıt onayı alınamadı.');
   if(feedbackNode)feedbackNode.textContent='Güncellendi.';
   await loadTasks();
  }catch(e){if(feedbackNode)feedbackNode.textContent='İşlem doğrulanamadı: '+e.message;}
  finally{if(button)button.disabled=false;}
 }
 function assignmentCard(task){
  const card=el('article','ayda-task-card'),header=el('div','ayda-task-card-header');
  header.append(el('strong','',task.title),el('span','ayda-task-pill'+(task.overdue?' overdue':''),task.status==='Aktif'?(task.overdue?'Teslim tarihi geçti':'Aktif'):task.status));
  card.append(header,el('small','',task.group+' · Son teslim: '+formatDate(task.dueDate)));
  if(task.description)card.append(el('p','',task.description));
  if(task.status==='Aktif'){
   const actions=el('div','ayda-task-actions'),state=el('span','ayda-note-state');
   for(const days of [3,7]){
    let b=makeButton('+'+days+' gün',()=>changeTask(task,'extend',days,state,b));actions.append(b);
   }
   let complete=makeButton('Tamamlandı',()=>changeTask(task,'complete',0,state,complete));actions.append(complete);
   const share=makeButton('Ödevi gruba yaz →',()=>{
    const msg='AYDA Dil Akademisi · '+task.group+'\nVerilen ödev: '+task.title+'\n'+(task.description||'')+'\nSon teslim: '+formatDate(task.dueDate)+'\nİyi çalışmalar.';
    window.open('https://wa.me/?text='+encodeURIComponent(msg),'_blank','noopener,noreferrer');
    state.textContent='WhatsApp açıldı. Grubunuzu seçip Gönder’e basın.';
   });actions.append(share);card.append(actions,state);
  }else{
   const state=el('span','ayda-note-state');let re=makeButton('Yeniden aç',()=>changeTask(task,'reactivate',0,state,re));
   card.append(re,state);
  }
  return card;
 }
 function paintTasks(result){
  taskList.replaceChildren();
  const tasks=(result?.tasks||[]).slice().sort((a,b)=>(a.status==='Aktif'?0:1)-(b.status==='Aktif'?0:1)||a.dueDate.localeCompare(b.dueDate));
  const active=tasks.filter(t=>t.status==='Aktif');
  taskList.append(el('h3','',active.length+' aktif ödev görevi'));
  if(!tasks.length){taskList.append(el('p','ayda-auto-subtle','Henüz ödev görevi kaydedilmemiş.'));return;}
  for(const t of active.slice(0,25))taskList.append(assignmentCard(t));
  const previous=tasks.filter(t=>t.status!=='Aktif');
  if(previous.length){
   const old=el('details','ayda-assignment-past');old.append(el('summary','','Tamamlanan ve arşivlenen ödevler · '+previous.length));
   const list=el('div');for(const t of previous.slice(0,15))list.append(assignmentCard(t));
   old.append(list);taskList.append(old);
  }
 }
 async function loadTasks(){
  if(!tr())return;
  const n=++taskRequest;
  taskList.replaceChildren(el('p','ayda-auto-subtle','Ödev görevleri yükleniyor…'));
  try{const x=await jsonp('homeworkTasks');if(n!==taskRequest)return;taskResult=x;paintTasks(x);}
  catch(e){if(n===taskRequest)taskList.replaceChildren(el('p','ayda-auto-subtle','Ödev görevleri şu anda alınamadı: '+(e?.message||'Bağlantı hatası')+'. ↻ Yenile ile tekrar kontrol edin.'));}
 }
 assignmentForm.addEventListener('submit',async(e)=>{
  e.preventDefault();if(!tr())return;sendTask.disabled=true;taskFeedback.textContent='Kaydediliyor…';
  try{const p={groupId:groupSelect.value,title:assignmentTitle.value.trim(),description:assignmentDesc.value.trim(),dueDate:assignmentDue.value};
   const result=await jsonp('saveHomeworkTask',{payload:utf8Base64Url(JSON.stringify(p))});
   if(!result.saved)throw Error('Görev kaydı doğrulanamadı.');
   assignmentTitle.value='';assignmentDesc.value='';taskFeedback.textContent='Ödev görevi kaydedildi. Öğrencilere otomatik mesaj gönderilmedi.';await loadTasks();
  }catch(err){taskFeedback.textContent='Kayıt doğrulanamadı: '+err.message;}
  finally{sendTask.disabled=false;}
 });
 homeworkTasks.addEventListener('toggle',()=>{if(homeworkTasks.open&&tr()){groupOptions();loadTasks();}});

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
  const week=['Pazar','Pazartesi','Salı','Çarşamba','Perşembe','Cuma','Cumartesi'],set=new Set(),byPlan=new Map();
  for(let day=1;day<=days;day++){
   const d=new Date(Date.UTC(year,mon,day)),date=d.toISOString().slice(0,10);
   for(const item of sch){const g=members.get(item.groupId);
    if(item.day!==week[d.getUTCDay()]||(g.start&&date<g.start)||(g.end&&date>g.end))continue;
    const key=item.groupId+'|'+date+'|'+item.start;
     if(!set.has(key)){set.add(key);byPlan.set(item.groupId,(byPlan.get(item.groupId)||0)+1);}
   }
  }
  const lessons=(data.history||[]).filter(x=>x.date?.startsWith(month));
  const completed=lessons.filter(x=>x.status==='İşlendi').length,cancelled=lessons.filter(x=>x.status==='İptal').length;
   const postponed=lessons.filter(x=>x.status==='Ertelendi').length;
  const privateCompleted=(data.privateHistory||[]).filter(x=>x.date?.startsWith(month)&&x.status==='İşlendi').length;
  return {planned:set.size,completed,privateCompleted,cancelled,postponed,remaining:Math.max(0,set.size-completed-cancelled),byGroup:[...members.values()].map(g=>({id:g.id,name:g.name,planned:byPlan.get(g.id)||0,done:lessons.filter(x=>x.groupId===g.id&&x.status==='İşlendi').length})),fallback:true};
 }
 function paintMonth(result){
  if(!tr())return;monthWrap.classList.remove('hidden');monthNumbers.replaceChildren();
  metric(monthNumbers,'Planlanan grup dersi',result.planned??'—');
  metric(monthNumbers,'İşlediğim grup dersi',result.completed??'—');
  metric(monthNumbers,'Kalan planlı ders',result.remaining??'—');
  metric(monthNumbers,'Özel ders kaydı',result.privateCompleted??'—');
   metric(monthNumbers,'İptal',result.cancelled??'—');
   metric(monthNumbers,'Ertelenen',result.postponed??'—');
  monthInfo.textContent='Planlanan dersler mevcut haftalık programa göredir. İptal düşülür; ertelenen ders kalan plan içinde tutulur. Tatil ve program değişiklikleri ders durumu olarak kaydedilmelidir.'+(result.fallback?' · Mevcut ekran verilerinden hesaplandı.':'');
  window.dispatchEvent(new CustomEvent('ayda:month-result',{detail:{state:'success',data:{...result,month:monthInput.value}}}));
 }
 async function loadMonth(){
  if(!tr())return;monthInput.value=monthInput.value||monthOf();
  const month=monthInput.value,local=monthFallback(month);paintMonth(local);
  try{const fresh=await jsonp('teacherMonthly',{month});if(fresh?.month===month&&monthInput.value===month){const normalized={...fresh,cancelled:local.cancelled,postponed:local.postponed,remaining:Math.max(0,Number(fresh.planned||0)-Number(fresh.completed||0)-local.cancelled)};lastMonth=normalized;paintMonth(normalized);}}
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
 window.addEventListener('ayda:teacher-monitor-refresh',()=>{if(tr()){monthInput.value=monthOf();loadMonth();}});
 feedback.addEventListener('toggle',()=>{if(feedback.open)loadFeedback();});
 function openFeedbackWhenLinked(){
  if(location.hash==='#aydaTeacherFeedback'&&tr()){
   feedback.open=true;feedback.scrollIntoView({behavior:'smooth',block:'start'});
  }
 }
 window.addEventListener('hashchange',openFeedbackWhenLinked);

 /* The makeup records are useful on the lesson page, but not needed for the home dashboard. */
 let makeupLoadedThisSession=false;
 window.addEventListener('ayda:teacher-page-open',event=>{
  if(tr()&&event.detail?.page==='daily'&&!makeupLoadedThisSession){
   makeupLoadedThisSession=true;loadMakeup();
  }
 });
 window.addEventListener('ayda:login',()=>{
  if(!tr())return;
  makeupLoadedThisSession=false;
  monthInput.value=monthOf();
  monthWrap.classList.remove('hidden');feedback.classList.remove('hidden');
  suggestDuration();groupOptions();loadMonth();
  if(homeworkTasks.open)loadTasks();
  openFeedbackWhenLinked();
 });
 window.addEventListener('ayda:saved',()=>{
  if(!tr())return;
  loadMonth();makeupLoadedThisSession=false;
  if(document.body.dataset.aydaTeacherView==='daily'){makeupLoadedThisSession=true;loadMakeup();}
  if(homeworkTasks.open)loadTasks();
 });
 window.addEventListener('ayda:logout',()=>{makeupLoadedThisSession=false;taskRequest++;taskResult=null;homeworkTasks.open=false;taskList.replaceChildren();assignmentForm.reset();request++;monthWrap.classList.add('hidden');makeup.classList.add('hidden');feedback.classList.add('hidden');feedback.open=false;replies.replaceChildren();makeupBody.replaceChildren();monthNumbers.replaceChildren();text.value='';});
})();