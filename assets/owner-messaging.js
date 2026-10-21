"use strict";
/* AYDA private message center. No phone/name ever ships in public GitHub source or publicDashboard. */
(()=>{
 const root=document.getElementById('owner-messages');if(!root)return;
 const monitoring=document.body.classList.contains('ayda-manager');
 const $=id=>document.getElementById(id);
 const bridge=()=>window.AYDA_OWNER_BRIDGE;
 const node=(tag,cls,text)=>{const x=document.createElement(tag);if(cls)x.className=cls;if(text!==undefined)x.textContent=String(text);return x;};
 const appendOption=(select,value,label)=>select.add(new Option(label,value));
 const fmt=s=>/^\d{4}-\d\d-\d\d$/.test(String(s||''))?s.slice(8)+'.'+s.slice(5,7)+'.'+s.slice(0,4):s||'';
 const digits=s=>String(s||'').replace(/\D/g,'');
 const text64=s=>{const bytes=new TextEncoder().encode(s);let raw='';for(const b of bytes)raw+=String.fromCharCode(b);return btoa(raw).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');};
 let contacts=null,inbox=null,loadNo=0;
 const teachers=$('aydaMsgTeacher'),students=$('aydaMsgStudent');
 const group=$('aydaMsgGroup'),dateSelect=$('aydaMsgMissing'),studentSearch=$('aydaMsgStudentSearch');
 const teacherType=$('aydaMsgTeacherType'),studentType=$('aydaMsgStudentType');
 const teacherText=$('aydaMsgTeacherText'),studentText=$('aydaMsgStudentText');
 const teacherStatus=$('aydaMsgTeacherStatus'),studentStatus=$('aydaMsgStudentStatus');
 const feedbacks=$('aydaManagerFeedbackList'),feedbackStatus=$('aydaManagerFeedbackStatus');
 function rows(){return contacts?.teachers||[];}
 function roster(){return contacts?.students||[];}
 function currentTeacher(){return rows().find(t=>t.id===teachers.value);}
 function currentStudent(){return roster().find(s=>s.id===students.value);}
 function openWhatsapp(phone,text){
  const number=digits(phone),message=String(text||'').trim();
  if(!/^90[1-9]\d{9}$/.test(number))throw Error('Geçerli WhatsApp numarası bulunamadı.');
  if(message.length<6)throw Error('Mesaj metni çok kısa.');
  window.open('https://wa.me/'+number+'?text='+encodeURIComponent(message),'_blank','noopener,noreferrer');
 }
 function messageTeacher(){
  const t=currentTeacher(),item=(bridge()?.reminders()?.items||[]).find(i=>i.groupId+'|'+i.date+'|'+i.type===dateSelect.value);
  if(!t){teacherText.value='';teacherStatus.textContent=monitoring?'Eksik raporu bulunan öğretmeni seçin.':'Öğretmen seçin.';return;}
  const a=t.name.split(/ +/)[0].toLocaleLowerCase('tr-TR');
  const name=a.slice(0,1).toLocaleUpperCase('tr-TR')+a.slice(1);
  const intro='Merhaba '+name+' Hocam, ';
  let body='';
  if(item&&teacherType.value==='auto'){
   body=intro+fmt(item.date)+' tarihli '+item.group+' grubunun '+(item.type==='attendance'?'ders yoklaması':'ders raporu')+' sistemde eksik görünüyor. Uygun olduğunuzda AYDA Akademik Takip panelinden tamamlamanızı rica ederiz. Teşekkürler.';
  }else if(teacherType.value==='report'){
   body=intro+'AYDA Akademik Takip sistemindeki eksik ders raporlarınızı kontrol ederek tamamlayabilir misiniz? Teşekkürler.';
  }else if(teacherType.value==='attendance'){
   body=intro+'AYDA Akademik Takip sistemindeki eksik yoklamalarınızı kontrol ederek tamamlayabilir misiniz? Teşekkürler.';
  }else if(teacherType.value==='meeting'){
   body=intro+'Akademik süreçlerle ilgili kısa bir görüşme planlamak istiyoruz. Müsait olduğunuz bir zamanı paylaşabilir misiniz? Teşekkürler.';
  }else{
   body=intro+'Akademik Takip panelindeki kayıtlarınızı kontrol etmenizi rica ederiz. Takıldığınız noktaları bizimle paylaşabilirsiniz. Teşekkürler.';
  }
  teacherText.value=body;
  $('aydaMsgTeacherPhone').value=t.phone?'+'+t.phone:'';
  teacherStatus.textContent=t.phone?'Hazır mesaj WhatsApp ile açılır; gönderme kararı size aittir.':"Bu öğretmenin kullanılabilir numarası yok. Numarayı doğrulayın.";
 }
 function messageStudent(){
  const s=currentStudent(),tracking=bridge()?.tracking()?.students?.find(x=>x.id===s?.id);
  if(!s){studentText.value='';studentStatus.textContent=monitoring?'Takip gerektiren bir öğrenci seçin.':'Öğrenci seçin.';return;}
  if(monitoring&&!['danger','watch'].includes(tracking?.riskLevel)){studentText.value='';studentStatus.textContent='Bu öğrenci öncelikli takip listesinde değil.';return;}
  const first=s.name.split(/\s+/)[0];
  let body='Merhaba '+first+', AYDA Dil Akademisi olarak '+s.group+' grubundaki süreciniz hakkında sizinle iletişime geçiyoruz. ';
  if(studentType.value==='absence'){
   body+=tracking?.absenceStreak>=3?'Son derslerde üst üste devamsızlık kaydınız görünüyor. Bir sorun yaşıyorsanız bize bilgi verebilir misiniz?':'Ders katılımınızla ilgili kısa bir görüşme yapmak istiyoruz. Uygun olduğunuzda dönüş yapabilir misiniz?';
  }else if(studentType.value==='homework'){
   body+=tracking?.recentHomeworkMissing>=3?'Son kontrol edilen ödevlerinizde eksikler görülüyor. Çalışma planınızı birlikte gözden geçirmek isteriz.':'Ders çalışma ve ödev takibiniz hakkında kısa bir değerlendirme yapmak istiyoruz.';
  }else if(studentType.value==='positive'){
   body+='Çalışmalarınızda başarılar diliyoruz. Düzenli katılım ve tekrar çalışmalarınızda yanınızdayız.';
  }else{
   body+='Derslerle veya çalışmalarınızla ilgili desteğe ihtiyaç duyuyorsanız bize yazabilirsiniz.';
  }
  studentText.value=body+' İyi çalışmalar dileriz.';
  $('aydaMsgStudentPhone').value=s.phone?'+'+s.phone:'';
  studentStatus.textContent=s.phone?'Mesaj gönderilmeden önce düzenlenebilir. WhatsApp penceresinden manuel olarak gönderilir.':'Öğrencinin telefon kaydı eksik veya geçersiz. Mesaj hazır ama WhatsApp bağlantısı açılamaz.';
 }
 function fillMissing(){
  const prev=dateSelect.value;dateSelect.replaceChildren();appendOption(dateSelect,'','Kayıttan bağımsız genel mesaj');
  const t=currentTeacher();
  const pending=bridge()?.reminders()?.items||[];
  for(const r of pending.filter(r=>Boolean(t?.teacherId)&&r.teacherId===t.teacherId)){
   appendOption(dateSelect,r.groupId+'|'+r.date+'|'+r.type,(r.type==='attendance'?'Yoklama':'Ders raporu')+' · '+r.group+' · '+fmt(r.date));
  }
  if([...dateSelect.options].some(o=>o.value===prev))dateSelect.value=prev;
  else if(monitoring&&dateSelect.options.length>1)dateSelect.selectedIndex=1;
 }
 function fillStudent(){
  const prev=students.value,query=studentSearch.value.toLocaleLowerCase('tr-TR').trim();
  students.replaceChildren();appendOption(students,'','Öğrenci seçin');
  const atRisk=new Set((bridge()?.tracking()?.students||[]).filter(s=>['danger','watch'].includes(s.riskLevel)).map(s=>s.id));
  const selected=roster().filter(s=>(!monitoring||atRisk.has(s.id))&&(!group.value||s.groupId===group.value)&&(!query||s.name.toLocaleLowerCase('tr-TR').includes(query))).sort((a,b)=>a.name.localeCompare(b.name,'tr'));
  for(const s of selected)appendOption(students,s.id,s.name+' · '+s.group);
  if([...students.options].some(o=>o.value===prev))students.value=prev;
  messageStudent();
 }
 function fill(){
  const prevTeacher=teachers.value;
  teachers.replaceChildren();appendOption(teachers,'','Öğretmen seçin');
  const pendingIds=new Set((bridge()?.reminders()?.items||[]).map(x=>x.teacherId));
  for(const t of rows().filter(t=>!monitoring||pendingIds.has(t.teacherId)).sort((a,b)=>a.name.localeCompare(b.name,'tr')))
   appendOption(teachers,t.id,t.name+(t.phone?'':' · Telefon eksik')+(t.teacherId?'':' · Giriş hesabı eşleşmemiş'));
  if([...teachers.options].some(o=>o.value===prevTeacher))teachers.value=prevTeacher;
  const prevGroup=group.value;group.replaceChildren();appendOption(group,'','Tüm gruplar');
  const m=new Map(roster().map(s=>[s.groupId,s.group]));
  for(const [id,name] of m)appendOption(group,id,name);
  group.value=prevGroup&&m.has(prevGroup)?prevGroup:'';
  fillMissing();fillStudent();messageTeacher();
  $('aydaMsgContactMeta').textContent=monitoring?'Yalnızca eksik raporu olan öğretmenlere ve akademik takibi gereken öğrencilere WhatsApp hatırlatması hazırlanır. Mesajı siz gönderirsiniz.':rows().length+' öğretmen profili · '+roster().length+' öğrenci.';
 }

 function paintInboxOverview(){
  if(monitoring)return;
  const preview=$('ownerInboxPreview');if(!preview)return;
  preview.replaceChildren();
  if(!inbox)return;
  const list=inbox.rows||[],newCount=list.filter(r=>r.status==='Yeni').length;
  const btn=node('button','ayda-owner-inbox-link');btn.type='button';
  const title=node('strong','',newCount?'Öğretmenlerden '+newCount+' yeni mesaj':'Öğretmen geri bildirimleri');
  const sub=node('span','',newCount?'Yeni fikir veya sorunları incelemek için Mesaj Merkezi’ni açın.':(list.length?'Tüm geri bildirimler incelenmiş görünüyor.':'Henüz öğretmenlerden mesaj yok.'));
  btn.append(title,sub,node('span','', 'Mesaj Merkezi →'));
  btn.addEventListener('click',()=>bridge()?.openTab('messages'));
  preview.append(btn);
 }

 function showInbox(){
  paintInboxOverview();
  feedbacks.replaceChildren();
  if(monitoring){feedbackStatus.textContent='Öğretmen geri bildirimlerine yanıt ve kayıt değişiklikleri yalnızca Admin Panelindedir.';return;}
  if(!inbox){feedbacks.append(node('p','ayda-auto-subtle','Öğretmen geri bildirimi servisi için Apps Script güncellenmelidir.'));return;}
  const list=inbox.rows||[];const unopened=list.filter(m=>m.status==='Yeni').length;
  const badge=$('aydaMsgBadge');if(badge)badge.textContent=unopened?' ('+unopened+' yeni)':'';
  feedbackStatus.textContent=unopened?unopened+' okunmamış öğretmen mesajı var.':'Bekleyen yeni mesaj yok.';
  if(!list.length){feedbacks.append(node('p','ayda-auto-subtle','Henüz öğretmenlerden bir geri bildirim gelmedi.'));return;}
  for(const item of list.slice(0,50)){
   const card=node('article','ayda-feedback-inbox'+(item.status==='Yeni'?' is-new':''));
   const title=node('div','ayda-inbox-title');
   title.append(node('strong','',item.teacher+' · '+item.category),node('span','',item.status));
   card.append(title,node('small','',item.created||''),node('p','',item.message));
   const reply=node('textarea');reply.value=item.reply||'';reply.maxLength=1400;reply.rows=2;reply.placeholder='Hocaya yanıt (isteğe bağlı)';reply.setAttribute('aria-label',item.teacher+' için yönetim yanıtı');
   const row=node('div','ayda-inbox-actions'),state=node('span','ayda-note-state');
   const option=node('select');option.setAttribute('aria-label','Geri bildirim durumunu değiştir');
   for(const n of ['Yeni','İncelendi','Yanıtlandı','Kapatıldı'])option.add(new Option(n,n));
   option.value=item.status||'Yeni';
   const save=node('button','ayda-inline-btn','Kaydet');save.type='button';
   save.addEventListener('click',async()=>{
    save.disabled=true;state.textContent='Kaydediliyor…';
    try{const payload=text64(JSON.stringify({id:item.id,reply:reply.value.trim(),status:option.value}));
     const ok=await bridge().api('feedbackReply',{payload});if(!ok.saved)throw Error('Onay alınamadı.');
     state.textContent='Kaydedildi.';await loadInbox();
    }catch(e){state.textContent='Yanıt doğrulanamadı: '+e.message;}
    finally{save.disabled=false;}
   });
   row.append(option,save,state);card.append(reply,row);feedbacks.append(card);
  }
 }
 async function loadInbox(){
  try{inbox=await bridge().api('feedbackInbox');showInbox();}
  catch(e){inbox=null;feedbackStatus.textContent=e.message;showInbox();}
 }
 async function load(){
  if(!bridge()?.ready())return;
  const n=++loadNo;
  $('aydaMsgContactMeta').textContent='İletişim rehberi yükleniyor…';
  const [directory,feedback]=await Promise.allSettled([bridge().api('contactDirectory'),monitoring?Promise.resolve(null):bridge().api('feedbackInbox')]);
  if(n!==loadNo)return;
  contacts=directory.status==='fulfilled'?directory.value:null;
  inbox=feedback.status==='fulfilled'?feedback.value:null;
  if(contacts)fill();else $('aydaMsgContactMeta').textContent='İletişim rehberine ulaşılamadı. Bağlantıyı kontrol edip verileri yenileyin.';
  showInbox();
 }
 teachers.addEventListener('change',()=>{fillMissing();messageTeacher();});
 dateSelect.addEventListener('change',()=>{if(dateSelect.value)teacherType.value='auto';messageTeacher();});
 teacherType.addEventListener('change',messageTeacher);
 group.addEventListener('change',fillStudent);studentSearch.addEventListener('input',fillStudent);
 students.addEventListener('change',()=>{
  if(monitoring){
   const p=bridge()?.tracking()?.students?.find(x=>x.id===students.value);
   studentType.value=(p?.recentHomeworkMissing||0)>=3&&(p?.absenceStreak||p?.consecutiveAbsent||0)<3?'homework':'absence';
  }
  messageStudent();
 });studentType.addEventListener('change',messageStudent);
 $('aydaMsgTeacherSend').addEventListener('click',()=>{try{const t=currentTeacher();if(!t)throw Error('Öğretmen seçin.');openWhatsapp(t.phone,teacherText.value);}catch(e){teacherStatus.textContent=e.message;}});
 $('aydaMsgStudentSend').addEventListener('click',()=>{try{const s=currentStudent();if(!s)throw Error('Öğrenci seçin.');openWhatsapp(s.phone,studentText.value);}catch(e){studentStatus.textContent=e.message;}});

 for(const [type,inputId,buttonId,getCurrent,state] of [
  ['teacher','aydaMsgTeacherPhone','aydaMsgTeacherPhoneSave',currentTeacher,teacherStatus],
  ['student','aydaMsgStudentPhone','aydaMsgStudentPhoneSave',currentStudent,studentStatus]
 ]){
  $(buttonId).addEventListener('click',async()=>{
   const selected=getCurrent();if(!selected){state.textContent='Önce kişi seçin.';return;}
   const btn=$(buttonId);btn.disabled=true;state.textContent='Telefon kaydediliyor…';
   try{const payload=text64(JSON.stringify({type,id:selected.id,phone:$(inputId).value.trim()}));
    const ok=await bridge().api('updateContact',{payload});if(!ok.saved)throw Error('Onay alınamadı.');
    state.textContent='Telefon güncellendi.';await load();
   }catch(e){state.textContent='Numara güncellenemedi: '+e.message;}
   finally{btn.disabled=false;}
  });
 }

 $('aydaMsgReload').addEventListener('click',load);

 async function applyTeacherContext(ctx){
  if(!bridge()?.ready())return;
  if(!contacts)await load();
  const found=rows().filter(t=>t.teacherId===ctx.teacherId);
  if(found.length!==1){
   teacherStatus.textContent='Bu dersin öğretmeni rehberde kesin olarak eşleşmiyor. Yanlış kişiye mesaj gitmemesi için öğretmeni siz seçin.';
   return;
  }
  teachers.value=found[0].id;fillMissing();
  const key=ctx.groupId+'|'+ctx.date+'|'+ctx.type;
  if([...dateSelect.options].some(o=>o.value===key)){dateSelect.value=key;teacherType.value='auto';}
  else teacherType.value=ctx.type==='attendance'?'attendance':'report';
  messageTeacher();
 }
 async function applyStudentContext(ctx){
  if(!bridge()?.ready())return;
  if(!contacts)await load();
  group.value=ctx.groupId;studentSearch.value='';fillStudent();students.value=ctx.studentId;
  const profile=bridge().tracking()?.students?.find(s=>s.id===ctx.studentId);
  studentType.value=(profile?.absenceStreak||0)>=3?'absence':(profile?.recentHomeworkMissing||0)>=3?'homework':'general';
  messageStudent();
 }
 window.addEventListener('ayda:compose-teacher',e=>{applyTeacherContext(e.detail||{}).catch(err=>{teacherStatus.textContent=err.message;});});
 window.addEventListener('ayda:compose-student',e=>{applyStudentContext(e.detail||{}).catch(err=>{studentStatus.textContent=err.message;});});

 // İletişim rehberini ana sayfa açılışında indirme: mesajlar açılınca getir.
 let lastContactRequest=0;
 const needed=()=>!root.hidden&&bridge()?.ready();
 const loadWhenNeeded=()=>{
  if(!needed())return;
  // Çift 'owner-ready' olayı aynı rehberi iki kez indirmesin.
  if(contacts){fill();return;}
  if(Date.now()-lastContactRequest<10000)return;
  lastContactRequest=Date.now();load();
 };
 window.addEventListener('ayda:owner-ready',loadWhenNeeded);
 window.addEventListener('ayda:messages-open',loadWhenNeeded);
 window.addEventListener('ayda:owner-logout',()=>{
  loadNo++;lastContactRequest=0;contacts=null;inbox=null;students.replaceChildren();teachers.replaceChildren();dateSelect.replaceChildren();feedbacks.replaceChildren();$('ownerInboxPreview')?.replaceChildren();
  teacherText.value='';studentText.value='';studentSearch.value='';$('aydaMsgContactMeta').textContent='Giriş yapın.';feedbackStatus.textContent='';
 });
 if(needed())loadWhenNeeded();
})();