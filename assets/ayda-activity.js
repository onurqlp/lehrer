/* AYDA | Ortak işlem durumu: yalnızca tarayıcı arayüzü, Google veri şemasına dokunmaz. */
(()=>{'use strict';
 if(window.AYDA_ACTIVITY)return;
 let serial=0,visible=false,lastChecked=0,lastSaved=0,lastError='',refreshHandler=null,refreshing=false,dismissTimer=0;
 const jobs=new Map();
 const readActions=new Set(['overview','ping','studentRoster','trackingSummary','reminders','teacherMonthly','studentNotes','studentList','adminStudents','lessonHomework','homeworkTasks','makeupList','contactDirectory','feedbackInbox','teacherFeedback','infoFormSummary','surveySummary','surveyOptions','integrityStatus','backupStatus']);
 const names={overview:'Veriler yükleniyor',studentRoster:'Öğrenci listesi yükleniyor',trackingSummary:'Yoklama ve ödev bilgileri yükleniyor',reminders:'Eksik kayıtlar kontrol ediliyor',teacherMonthly:'Ders saatleri hesaplanıyor',adminStudents:'Öğrenci kayıtları yükleniyor',lessonHomework:'Ödevler yükleniyor',homeworkTasks:'Ödev görevleri yükleniyor',makeupList:'Eksik yoklamalar yükleniyor',contactDirectory:'İletişim bilgileri yükleniyor',feedbackInbox:'Mesajlar yükleniyor',teacherFeedback:'Geri bildirimler yükleniyor',infoFormSummary:'Öğrenci başvuruları yükleniyor',surveySummary:'Anket sonuçları yükleniyor',surveyOptions:'Kurs ve öğretmen listesi yükleniyor',submitSurvey:'Değerlendirme gönderiliyor',save:'Ders raporu kaydediliyor',saveAttendance:'Yoklama kaydediliyor',teacherAddStudent:'Öğrenci ekleniyor',saveStudent:'Öğrenci bilgileri kaydediliyor',removeTeacher:'Öğretmen hesabı kaldırılıyor',confirmHomeworkShare:'WhatsApp paylaşım onayı kaydediliyor',submitInfoForm:'Öğrenci bilgi formu gönderiliyor',updateReport:'Ders raporu güncelleniyor'};
 const writeActions=new Set(['save','saveAttendance','teacherAddStudent','saveStudent','removeTeacher','confirmHomeworkShare','submitInfoForm','submitSurvey','updateReport','saveHomeworkTask','updateHomeworkTask','setPassword','setTeacherAccountStatus','updateGroupSchedule','createTeacher','createGroup','updateGroup','updateContact','saveStudentNote','saveFeedback','feedbackReply','saveHomework','changePassword','rotateKey']);
 const styles=`
 .ayda-activity{position:fixed;right:14px;bottom:14px;z-index:60;display:flex;align-items:center;gap:10px;max-width:min(390px,calc(100vw - 28px));min-width:210px;padding:10px 12px;background:#ffffff;color:#18334a;border:1px solid #d2e3e0;border-radius:14px;box-shadow:0 9px 28px #0b263527;font:13px/1.35 system-ui,-apple-system,"Segoe UI",sans-serif}
 .ayda-activity[hidden]{display:none!important}
 .ayda-activity__light{width:9px;height:9px;flex:0 0 9px;border-radius:50%;background:#4d9b81}
 .ayda-activity[data-mode="busy"] .ayda-activity__light{width:15px;height:15px;flex-basis:15px;background:transparent;border:2px solid #c6e6db;border-top-color:#117453;animation:ayda-ui-spin .75s linear infinite}
 .ayda-activity[data-mode="error"] .ayda-activity__light{background:#b56533}
 .ayda-activity__words{display:grid;min-width:0;flex:1;gap:1px}
 .ayda-activity__title{font-size:13px;font-weight:700;overflow-wrap:anywhere}
 .ayda-activity__meta{font-size:11px;color:#697b82}
 .ayda-activity__refresh{border:1px solid #b9d5cb;background:#eff8f4;color:#075d48;border-radius:9px;padding:7px 9px;cursor:pointer;font:700 12px/1 system-ui,sans-serif;white-space:nowrap}
 .ayda-activity__refresh:disabled{opacity:.5;cursor:wait}
 .ayda-activity__refresh[hidden]{display:none!important}
 @keyframes ayda-ui-spin{to{transform:rotate(360deg)}}
 @media(prefers-reduced-motion:reduce){.ayda-activity[data-mode="busy"] .ayda-activity__light{animation:none;border-top-color:#117453}}
 @media(max-width:560px){.ayda-activity{bottom:calc(88px + env(safe-area-inset-bottom,0px));right:10px;padding:9px 10px;max-width:calc(100vw - 20px);min-width:0}.ayda-activity__refresh{padding:8px}}
 `;
 const st=document.createElement('style');st.textContent=styles;document.head.append(st);
 const box=document.createElement('div');box.className='ayda-activity';box.hidden=true;box.setAttribute('role','status');box.setAttribute('aria-live','polite');box.dataset.mode='idle';
 const dot=document.createElement('span');dot.className='ayda-activity__light';dot.setAttribute('aria-hidden','true');
 const body=document.createElement('div');body.className='ayda-activity__words';
 const title=document.createElement('strong');title.className='ayda-activity__title';title.textContent='Bağlantı hazır';
 const meta=document.createElement('span');meta.className='ayda-activity__meta';body.append(title,meta);
 const button=document.createElement('button');button.type='button';button.className='ayda-activity__refresh';button.textContent='↻ Yenile';button.hidden=true;
 box.append(dot,body,button);
 function mount(){if(!box.isConnected&&document.body)document.body.append(box);}
 if(document.body)mount();else document.addEventListener('DOMContentLoaded',mount,{once:true});
 function clock(date){return new Intl.DateTimeFormat('tr-TR',{hour:'2-digit',minute:'2-digit',second:'2-digit'}).format(date);}
 function mode(){
  const all=[...jobs.values()],writes=all.filter(x=>x.write);
  return {all,writes};
 }
 function paint(force=false){
  if(dismissTimer){clearTimeout(dismissTimer);dismissTimer=0;}
  const {all,writes}=mode();
  if(all.length&&!visible&&!force)return;
  mount();box.hidden=!visible&&!all.length;if(!visible&&force)visible=true;box.hidden=!visible;
  box.dataset.mode=all.length?'busy':lastError?'error':'idle';
  if(all.length){
   const current=writes[0]||all[all.length-1];
   title.textContent=current.label+(all.length>1?' · '+all.length+' işlem':'')+'…';
   meta.textContent=writes.length?'Lütfen bekleyin; işlemi yeniden göndermeyin.':'Lütfen bekleyin; veriler Google’dan alınıyor.';
  }else{
   title.textContent=lastError?'Bağlantı kontrolü gerekli':lastSaved>lastChecked?'İşlem tamamlandı':'Veriler kontrol edildi';
   meta.textContent=lastError?lastError:lastChecked?'Son kontrol: '+clock(new Date(lastChecked)):lastSaved?'Son kayıt yanıtı: '+clock(new Date(lastSaved)):'';
  }
  button.hidden=!refreshHandler;button.disabled=all.length>0||refreshing;
  if(!all.length&&visible)dismissTimer=setTimeout(()=>{if(!jobs.size){visible=false;box.hidden=true;}},lastError?8000:3500);
 }
 function start(action,label){
  const id=++serial,write=writeActions.has(action)||action==='refresh-write';
  jobs.set(id,{action,write,label:label||names[action]||(write?'İşlem kaydediliyor':'Veriler yükleniyor')});
  lastError='';
  // Tiny requests should not flash a banner.
  setTimeout(()=>{if(jobs.has(id)){visible=true;paint(true);}},220);
  if(visible)paint(true);
  return id;
 }
 function finish(id,success=true){
  const job=jobs.get(id);if(!job)return;
  jobs.delete(id);
  if(success){
   if(job.write)lastSaved=Date.now();
   else if(readActions.has(job.action)||job.action==='refresh')lastChecked=Date.now();
   lastError='';
  }else lastError=job.write?'Kayıt onayını kontrol edin; otomatik tekrar gönderilmiyor.':'Yükleme tamamlanamadı; yeniden deneyin.';
  if(!visible&&jobs.size===0)visible=true;
  paint();
 }
 function bindRefresh(fn){
  refreshHandler=typeof fn==='function'?fn:null;paint();
 }
 button.addEventListener('click',async()=>{
  if(!refreshHandler||refreshing||jobs.size)return;
  refreshing=true;const id=start('refresh','Veriler yenileniyor');
  try{await refreshHandler();finish(id,true);}
  catch(error){finish(id,false);title.textContent='Yenilenemedi';meta.textContent=String(error?.message||error).slice(0,160);}
  finally{refreshing=false;paint();}
 });
 window.AYDA_ACTIVITY={start,finish,bindRefresh,isBusy:()=>jobs.size>0,isWriting:()=>[...jobs.values()].some(x=>x.write),clear(){
  jobs.clear();lastChecked=0;lastSaved=0;lastError='';visible=false;box.hidden=true;
 }};
})();
