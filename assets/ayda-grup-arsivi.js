/* AYDA Group Archive | Browser-only, read-only, ID-linked academic reporting. */
(()=>{'use strict';
 const $=id=>document.getElementById(id);
 const el=(tag,cls,value)=>{const x=document.createElement(tag);if(cls)x.className=cls;if(value!==undefined)x.textContent=String(value);return x;};
 const add=(parent,tag,cls,value)=>{const x=el(tag,cls,value);parent.append(x);return x;};
 const array=x=>Array.isArray(x)?x:[];
 const moneylessNum=n=>new Intl.NumberFormat('tr-TR',{maximumFractionDigits:1}).format(Number(n)||0);
 const fmt=x=>/^\d{4}-\d{2}-\d{2}$/.test(String(x||''))?x.slice(8,10)+'.'+x.slice(5,7)+'.'+x.slice(0,4):(String(x||'')||'—');
 const hours=x=>{if(typeof x==='number')return x;const m=/^(\d{1,2}):(\d{2})/.exec(String(x||''));return m?Number(m[1])+Number(m[2])/60:0;};
 const slug=s=>String(s||'grup').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^A-Za-z0-9_-]/g,'-').slice(0,48);
 const state={key:'',overview:null,tracking:null,homeworks:null,tasks:null,reminders:null,surveys:null,errors:[],id:'',busy:false,loadedAt:''};
 const sourceNames={trackingSummary:'Öğrenci takibi',lessonHomework:'Ders ödevleri',homeworkTasks:'Ödev görevleri',reminders:'Eksik ders kontrolü',surveySummary:'Memnuniyet anketleri'};
 let serial=0;
 function sessionKeys(){
  const keys=[];
  const addKey=s=>{if(typeof s==='string'&&s.length>0&&s.length<=150&&!keys.includes(s))keys.push(s);};
  try{addKey(sessionStorage.getItem('aydaKey'));}catch(_){}
  for(const name of ['aydaAdminSession','aydaViewerSession']){
   try{const p=JSON.parse(localStorage.getItem(name)||'null');if(p?.expires>Date.now())addKey(p.key);}catch(_){}
  }
  return keys;
 }
 function request(action,key){
  return new Promise((resolve,reject)=>{
   if(!window.AYDA_API_URL)return reject(Error('Google API adresi bulunamadı.'));
   const callback='ayda_cb_arch_'+(++serial),script=document.createElement('script');
   let done=false;
   const finish=(error,result)=>{
    if(done)return;done=true;clearTimeout(timer);delete window[callback];script.remove();
    if(error)reject(error);else resolve(result);
   };
   const timer=setTimeout(()=>finish(Error(action+' zaman aşımına uğradı.')),27000);
   window[callback]=value=>{
    if(!value?.ok)return finish(Error(String(value?.error||action+' sunucu yanıtı başarısız')));
    finish(null,value.data);
   };
   const url=new URL(window.AYDA_API_URL);
   url.searchParams.set('action',action);
   url.searchParams.set('key',key);
   url.searchParams.set('callback',callback);
   url.searchParams.set('_t',String(Date.now()));
   script.onerror=()=>finish(Error(action+' bağlantısı kurulamadı.'));
   script.src=url.href;document.head.append(script);
  });
 }
 function status(msg){$('archiveStatus').textContent=msg;}
 function warning(message,kind){
  const item=add($('archiveWarnings'),'p','archive-warning '+(kind||''),message);
  item.setAttribute('role','status');
 }
 function showAuth(title,detail){
  $('archiveAuth').hidden=false;$('archiveWorkspace').hidden=true;
  const a=$('archiveAuth');a.replaceChildren();
  const b=add(a,'div');add(b,'strong','',title);add(b,'p','',detail);
  const link=add(a,'a','','AYDA giriş sayfasına git →');link.href='./index.html';
 }
 function tab(name){
  for(const btn of document.querySelectorAll('[data-archive-tab]')){
   btn.classList.toggle('active',btn.dataset.archiveTab===name);
   if(btn.dataset.archiveTab===name)btn.setAttribute('aria-current','page');else btn.removeAttribute('aria-current');
  }
  for(const p of document.querySelectorAll('.archive-panel'))p.hidden=p.id!=='archivePanel-'+name;
 }
 const current=()=>array(state.overview?.groups).find(g=>g.id===state.id)||null;
 const groupLessons=()=>array(state.overview?.history).filter(r=>r.groupId===state.id).sort((a,b)=>String(b.date||'').localeCompare(String(a.date||'')));
 const groupStudents=()=>array(state.tracking?.students).filter(s=>s.groupId===state.id).sort((a,b)=>String(a.name).localeCompare(String(b.name),'tr'));
 const groupAttendance=()=>array(state.tracking?.groups).find(g=>g.id===state.id)||null;
 const groupHomework=()=>array(state.homeworks?.items).filter(h=>h.groupId===state.id).sort((a,b)=>String(b.date||'').localeCompare(String(a.date||'')));
 const groupTasks=()=>array(state.tasks?.tasks).filter(t=>t.groupId===state.id);
 const groupReminders=()=>array(state.reminders?.items).filter(r=>r.groupId===state.id);
 const groupSurveys=()=>array(state.surveys?.rows).filter(r=>r.group===current()?.name);
 const teacher=id=>array(state.overview?.teachers).find(t=>t.id===id)?.name||id||'—';
 function row(label,value){
  const r=el('div','archive-dl-row');
  add(r,'dt','',label);add(r,'dd','',value===null||value===undefined||value===''?'—':value);
  return r;
 }
 function empty(root,phrase){root.replaceChildren(el('p','archive-empty',phrase));}
 function kpi(label,value,sub,tone){
  const n=el('article','archive-kpi '+(tone||''));
  add(n,'span','',label);add(n,'strong','',value);if(sub)add(n,'small','',sub);
  return n;
 }
 function percent(a,b){return b?Math.round(a/b*100):null;}
 function renderKpis(){
  const g=current();if(!g)return;
  const lessons=groupLessons(),done=lessons.filter(l=>l.status==='İşlendi'),attendance=groupAttendance();
  const total=Number(g.total)||0,completed=Number(g.completed)||0;
  const p=total?percent(completed,total):null;
  const cards=[
   kpi('Müfredat ilerlemesi',p===null?'—':p+'%',completed+' / '+(total||'—')+' ünite','blue'),
   kpi('Kaydedilmiş ders',done.length,lessons.filter(x=>x.status==='İptal').length+' iptal · '+lessons.filter(x=>x.status==='Ertelendi').length+' erteleme','teal'),
   kpi('İşlenen ders saati',moneylessNum(done.reduce((a,l)=>a+hours(l.actual),0)), 'Tamamlanan dersler','purple'),
   kpi('Öğrenci',attendance?attendance.students:g.students||'—',attendance?'Aktif yoklama listesi':'Grup kartındaki sayı','gold'),
   kpi('Yoklama katılımı',attendance?(percent(attendance.present,attendance.present+attendance.absent)??'—')+'%':'—',attendance?'Girilen yoklamalara göre':'Bu grup için takip verisi yok','blue'),
   kpi('Bekleyen kayıt',state.reminders?groupReminders().length:'—',state.reminders?'Eksik rapor / yoklama':'Kaynak henüz doğrulanmadı','orange')
  ];
  $('archiveKpis').replaceChildren(...cards);
 }
 function renderOverview(){
  const g=current();if(!g)return;
  const info=$('archiveIdentity'),progress=$('archiveProgress');info.replaceChildren();progress.replaceChildren();
  const dl=add(info,'dl','archive-dl');
  for(const [name,value] of [['Grup kimliği',g.id],['Seviye',g.level],['Durum',g.status],['Sorumlu öğretmen',teacher(g.teacherId)],['Başlangıç',fmt(g.start)],['Planlanan bitiş',fmt(g.end)],['Kayıtlı öğrenci',g.students]])dl.append(row(name,value));
  const schedule=array(state.overview?.schedule).filter(x=>x.groupId===g.id);
  const sc=add(info,'div','archive-schedule');add(sc,'h4','','Kayıtlı aktif haftalık program');
  if(schedule.length)for(const x of schedule)add(sc,'p','',x.day+' · '+(x.start||'—')+'–'+(x.end||'—'));else add(sc,'p','archive-empty','Aktif haftalık program bilgisi bulunamadı; eski program değişiklikleri bu API’de sunulmuyor.');
  const complete=Number(g.completed)||0,all=Number(g.total)||0,p=all?Math.min(100,percent(complete,all)):0;
  const progressRow=add(progress,'div','archive-progress-stats');add(progressRow,'strong','',all?complete+' / '+all+' ünite':'Ünite hedefi belirtilmemiş');add(progressRow,'span','',all?p+'%':'—');
  const bar=add(progress,'div','archive-progress-track');add(bar,'span').style.width=p+'%';
  const lessons=groupLessons(),latest=lessons[0];
  const summary=add(progress,'dl','archive-dl');
  for(const [name,value] of [['Kalan ünite',all?Math.max(0,all-complete):'—'],['Son rapor tarihi',latest?fmt(latest.date):'Henüz rapor yok'],['Son ders durumu',latest?.status||'—'],['Son tamamlanan ünite',latest?.completed??'—'],['Ödev toplamı',state.homeworks?groupHomework().length:'—']])summary.append(row(name,value));
  const perMonth=new Map();
  for(const l of lessons){const month=String(l.date||'').slice(0,7)||'Tarihsiz';if(!perMonth.has(month))perMonth.set(month,{month,done:0,hours:0,cancelled:0,delayed:0});const m=perMonth.get(month);if(l.status==='İşlendi'){m.done++;m.hours+=hours(l.actual);}if(l.status==='İptal')m.cancelled++;if(l.status==='Ertelendi')m.delayed++;}
  const monthly=$('archiveMonthly');monthly.replaceChildren();
  if(!perMonth.size)empty(monthly,'Bu gruba ait ders kaydı henüz bulunamadı.');
  else{
   const t=add(monthly,'div','archive-table-wrap'),table=add(t,'table','archive-table');
   const tr=add(add(table,'thead'),'tr');for(const h of ['Ay','İşlenen ders','Toplam saat','İptal','Erteleme'])add(tr,'th','',h);
   const body=add(table,'tbody');
   for(const m of [...perMonth.values()].sort((a,b)=>b.month.localeCompare(a.month))){
    const r=add(body,'tr');for(const v of [m.month,m.done,moneylessNum(m.hours),m.cancelled,m.delayed])add(r,'td','',v);
   }
  }
  const recent=$('archiveRecent');recent.replaceChildren();
  const selected=lessons.slice(0,4);
  if(!selected.length)empty(recent,'Henüz ders raporu bulunmuyor.');
  for(const l of selected){
   const block=add(recent,'article','archive-event');
   const head=add(block,'div','archive-event-heading');add(head,'strong','',fmt(l.date)+' · '+(l.status||'—'));add(head,'span','',teacher(l.teacherId));
   add(block,'p','',l.topic||'Konu belirtilmemiş');
   if(l.note)add(block,'small','archive-note',l.note);
  }
 }
 function recordTable(root,headers,rows){
  root.replaceChildren();
  if(!rows.length)return empty(root,'Bu bölümde kayıt bulunamadı.');
  const wrap=add(root,'div','archive-table-wrap'),table=add(wrap,'table','archive-table'),head=add(add(table,'thead'),'tr');
  for(const h of headers)add(head,'th','',h);
  const body=add(table,'tbody');
  for(const values of rows){const tr=add(body,'tr');for(const value of values)add(tr,'td','',value??'—');}
 }
 function renderLessons(){
  const lessons=groupLessons();$('archiveLessonCount').textContent=lessons.length+' rapor';
  const root=$('archiveLessons');root.replaceChildren();
  if(!lessons.length)return empty(root,'Bu gruba ait kayıtlı ders raporu bulunmuyor.');
  for(const l of lessons){
   const wrap=add(root,'details','archive-lesson');
   const top=add(wrap,'summary','','');
   const name=add(top,'span','','');add(name,'strong','',fmt(l.date)+' · '+l.status);add(name,'small','',l.topic||'Konu bilgisi yok');
   add(top,'span','archive-lesson-time',l.status==='İşlendi'?(l.actual||'—')+' saat':'—');
   const body=add(wrap,'div','archive-lesson-detail');
   const dl=add(body,'dl','archive-dl');
   for(const [label,value] of [['Ders kayıt ID',l.id],['Öğretmen',teacher(l.teacherId)],['Tarih',fmt(l.date)],['Durum',l.status],['Planlanan saat',(l.plannedStart||'—')+'–'+(l.plannedEnd||'—')],['Gerçekleşen süre',l.actual],['İşlenen ünite',l.unit],['Tamamlanan ünite',l.completed],['İşlenen konu',l.topic],['Öğretmen notu',l.note]])dl.append(row(label,value));
   const hw=groupHomework().filter(h=>h.lessonId===l.id);
   if(hw.length){add(body,'h4','','Verilen ödev');for(const h of hw)add(body,'p','archive-note',h.text+' · Paylaşım: '+h.shareStatus);}
  }
 }
 function renderStudents(){
  const root=$('archiveStudents');root.replaceChildren();
  const students=groupStudents(),grp=groupAttendance(),g=current();
  if(!state.tracking){return empty(root,'Öğrenci takip verileri şu anda yüklenemedi. Veri yok sonucu olarak değerlendirilmez.');}
  if(g.status!=='Aktif'){return empty(root,'Bu grup aktif değil. Mevcut Google öğrenci takibi API’si pasif/tamamlanmış grupların geçmiş yoklama ve ödev ayrıntılarını döndürmüyor. Eski ders raporları korunmuştur; tam geçmiş için Google API arşiv erişimi gerekir.');}
  const headline=add(root,'p','archive-context','Güncel aktif grup: '+students.length+' öğrenci · '+(grp?(grp.present||0)+' katılım, '+(grp.absent||0)+' gelmeme ve '+(grp.homeworkMissing||0)+' eksik ödev kaydı':'Toplu veri henüz yok')+'. API, öğrenci başına yalnızca son 5 yoklama ve ödev kontrolünün tarihli ayrıntısını sağlar.');
  if(!students.length)return;
  const list=add(root,'div','archive-student-list');
  for(const s of students){
   const card=add(list,'details','archive-student-card'),top=add(card,'summary');
   const who=add(top,'span');add(who,'strong','',s.name);add(who,'small','',s.riskLevel==='danger'?'Öncelikli takip':s.riskLevel==='watch'?'Takip edilmeli':s.riskLevel==='regular'?'Düzenli':'Takip verisi yok');
   const right=add(top,'span','archive-student-tally','Katılım '+(s.attendanceRate===null?'—':s.attendanceRate+'%')+' · Eksik ödev '+(s.homeworkMissing||0));
   const detail=add(card,'div','archive-student-detail');
   const dl=add(detail,'dl','archive-dl');
   for(const [n,v] of [['Geldi',s.present],['Gelmedi',s.absent],['Mazeretli',s.excused],['Ödev yaptı',s.homeworkDone],['Ödev eksik',s.homeworkMissing],['Takip durumu',s.followupStatus]])dl.append(row(n,v));
   add(detail,'h4','','Son yoklama kayıtları (en fazla 5)');
   const att=array(s.recentAttendance);if(att.length)for(const a of att)add(detail,'p','archive-entry',fmt(a.date)+' · '+a.status+(a.excused?' (Mazeretli)':''));else add(detail,'p','archive-empty','Tarihli yoklama yok.');
   add(detail,'h4','','Son ödev kontrolleri (en fazla 5)');
   const hw=array(s.recentHomework);if(hw.length)for(const a of hw)add(detail,'p','archive-entry',fmt(a.date)+' · '+a.status);else add(detail,'p','archive-empty','Tarihli ödev kontrolü yok.');
  }
 }
 function renderHomework(){
  const a=$('archiveHomeworks'),b=$('archiveTasks');a.replaceChildren();b.replaceChildren();
  if(!state.homeworks)empty(a,'Ders ödevleri alınamadı.');
  else if(!groupHomework().length)empty(a,'Kayıtlı ders ödevi yok.');
  else for(const h of groupHomework()){
   const card=add(a,'article','archive-event');const hTop=add(card,'div','archive-event-heading');
   add(hTop,'strong','',fmt(h.date));add(hTop,'span','',h.shareStatus||'—');
   add(card,'p','',h.text||'Ödev metni boş');
   add(card,'small','archive-note','Ders: '+h.lessonId+' · Öğretmen: '+teacher(h.teacherId));
  }
  if(!state.tasks)empty(b,'Ödev görevleri alınamadı.');
  else if(!groupTasks().length)empty(b,'Teslim tarihli görev bulunmuyor.');
  else for(const t of groupTasks()){
   const card=add(b,'article','archive-event'),head=add(card,'div','archive-event-heading');
   add(head,'strong','',t.title);add(head,'span','',t.status);
   if(t.description)add(card,'p','',t.description);
   add(card,'small','archive-note','Veriliş: '+fmt(t.createdDate)+' · Son teslim: '+fmt(t.dueDate)+' · Ek süre: '+(t.extensionCount||0)+' kez'+(t.overdue?' · Gecikmiş':''));
  }
 }
 function renderEvaluation(){
  const root=$('archiveEvaluation'),coverage=$('archiveCoverage'),survey=$('archiveSurveys');root.replaceChildren();coverage.replaceChildren();survey.replaceChildren();
  const g=current(),lessons=groupLessons(),done=lessons.filter(l=>l.status==='İşlendi'),att=groupAttendance(),issues=[],positives=[];
  if(done.length)positives.push(done.length+' işlenmiş dersin '+moneylessNum(done.reduce((n,l)=>n+hours(l.actual),0))+' saatlik akademik kaydı mevcut.');
  else issues.push('Bu grup için işlenmiş ders kaydı yok; eğitim ilerlemesi raporlardan teyit edilemiyor.');
  if(g.total&&Number(g.completed)>=Number(g.total))positives.push('Kayıtlı ünite hedefi tamamlanmış görünüyor.');
  else if(g.total)issues.push('Tamamlanması gereken '+Math.max(0,Number(g.total)-Number(g.completed))+' ünite var.');
  if(att){
   const total=(att.present||0)+(att.absent||0),rate=percent(att.present,total);
   if(rate!==null&&rate<80)issues.push('Kaydedilmiş yoklamalarda katılım %'+rate+'; devamsızlık nedenlerini inceleyin.');
   else if(rate!==null)positives.push('Kaydedilmiş yoklamalarda katılım %'+rate+'.');
   if(att.atRisk)issues.push(att.atRisk+' öğrenci öncelikli takip listesinde.');
   if(att.homeworkMissing)issues.push(att.homeworkMissing+' eksik ödev kontrol kaydı bulunuyor.');
   if(Number(att.students)!==Number(g.students))issues.push('Grup kartı ile güncel yoklama öğrenci sayısı farklı.');
  }
  if(state.reminders&&groupReminders().length)issues.push(groupReminders().length+' ders raporu/yoklama eksik kaydı kontrol edilmeli.');
  if(groupTasks().some(t=>t.overdue))issues.push(groupTasks().filter(t=>t.overdue).length+' aktif teslim tarihi geçmiş ödev bulunuyor.');
  if(g.status!=='Aktif')issues.push('Grup tamamlanmış/pasif: öğrenci takip kayıtları mevcut API’den alınamıyor.');
  const addBlock=(name,arr,cls)=>{
   const wrap=add(root,'div','archive-assessment '+cls);add(wrap,'h4','',name);
   const ul=add(wrap,'ul');
   if(!arr.length)add(ul,'li','','Bu başlık için yeterli doğrulanmış kayıt yok.');
   else for(const item of arr)add(ul,'li','',item);
  };
  addBlock('Kayıtlarda olumlu göstergeler',positives,'positive');
  addBlock('İncelenmesi önerilen konular',issues,'warning');
  add(root,'p','archive-context','Bu bölüm otomatik sayısal kontrol listesidir. Öğrencilerin başarısı ya da öğretmenin niteliği hakkında kesin yargı değildir.');
  const notes=[
   'Akademik veri başlangıcı: 20.10.2026. Önceki ders kayıtları bu API çıktısına dahil değildir.',
   'Grup kaydı ve ders raporları Google Sheets üzerinde tutuluyor; bu sayfa verileri yeniden derliyor, bağımsız bir sunucu arşivi yazmıyor.',
   'Yoklama/ödev ayrıntıları yalnızca aktif öğrenci kayıtları için ve kişi başına son 5 tarihli kontrolle sınırlı; eski tam tarihçe API’de mevcut değil.',
   'Ders ödevleri en fazla 400; teslim tarihli ödev görevleri en fazla 180; eksik kayıtlar en fazla 120 kayıt olarak dönebiliyor.',
   'Öğretmen değişikliği ve haftalık programın eski sürümleri bu API’den dönmüyor; yalnızca mevcut atama ve aktif program gösterilir.',
   'WhatsApp paylaşım durumu, öğretmenin uygulama içindeki onayına dayanır; WhatsApp tarafından doğrulanmaz.',
   'Arşiv JSON dosyası raporun alındığı andaki mevcut kayıtlarının yetkili kullanıcıda saklanacak bir kopyasıdır.'
  ];
  for(const failure of state.errors)notes.unshift('Kaynak yüklenemedi: '+failure);
  if(state.homeworks&&Number(state.homeworks.total)>array(state.homeworks.items).length)notes.unshift('Ders ödevi yanıtı kısaltılmış: '+state.homeworks.items.length+' / '+state.homeworks.total+'.');
  if(state.tasks&&Number(state.tasks.total)>array(state.tasks.tasks).length)notes.unshift('Ödev görevi yanıtı kısaltılmış: '+state.tasks.tasks.length+' / '+state.tasks.total+'.');
  if(state.reminders&&Number(state.reminders.total)>array(state.reminders.items).length)notes.unshift('Eksik kayıt yanıtı kısaltılmış; toplam eksik kayıt sayısı bu grup için eksik olabilir.');
  if(g.status!=='Aktif')notes.unshift('Bu grup tamamlanmış veya pasif: öğrenci isimlerinin eski kayıtları, yoklama ve ödev geçmişi geri alınamıyor.');
  const ul=add(coverage,'ul','archive-coverage-list');for(const note of notes)add(ul,'li','',note);
  if(!state.surveys)return empty(survey,state.overview?.user?.role==='teacher'?'Anket özetleri yalnızca yönetici/izleme hesaplarında görüntülenir.':'Anket verileri yüklenemedi.');
  const rows=groupSurveys();
  add(survey,'p','archive-context','Anket API’si grup kimliği sağlamadığı için aşağıdaki sonuçlar yalnızca grup adına göre eşleştirilmiştir. Aynı isimli farklı gruplar karışabilir.');
  if(!rows.length)return add(survey,'p','archive-empty','Bu adla eşleşen anket kaydı bulunamadı.');
  const tableWrap=add(survey,'div','archive-table-wrap'),table=add(tableWrap,'table','archive-table'),head=add(add(table,'thead'),'tr');
  for(const name of ['Tarih','Öğretmen','Puan','Tavsiye','Geliştirme notu'])add(head,'th','',name);
  const tbody=add(table,'tbody');
  for(const x of rows){const tr=add(tbody,'tr');for(const field of [x.date,x.teacher,x.score,x.recommend,x.improve||x.additional])add(tr,'td','',field||'—');}
 }
 function render(){
  const g=current();if(!g)return;
  $('archiveGroupName').textContent=g.name||g.id;
  $('archiveGroupTag').textContent=(g.level||'Grup')+' · '+g.id;
  $('archiveGroupMeta').textContent=teacher(g.teacherId)+' · Başlangıç '+fmt(g.start)+' · '+(g.students||'—')+' kayıtlı öğrenci';
  $('archiveGroupBadge').textContent=g.status||'—';
  $('archiveGroupBadge').dataset.status=g.status==='Aktif'?'active':'archive';
  $('archiveUpdated').textContent=state.loadedAt?'Son okuma: '+state.loadedAt:'';
  $('archiveExport').disabled=false;$('archiveCsv').disabled=false;$('archivePrint').disabled=false;
  $('archiveWarnings').replaceChildren();
  if(g.status!=='Aktif')warning('Bu grup arşiv durumunda. Ders kayıtları gösteriliyor; tamamlanmış grupların öğrenci/yoklama/ödev geçmişini mevcut API eksiksiz getirmiyor.','amber');
  if(state.errors.length)warning('Bazı veri kaynaklarına ulaşılamadı: '+state.errors.join(' · '),'amber');
  if(state.homeworks&&Number(state.homeworks.total)>array(state.homeworks.items).length)warning('Ders ödevi listesi API sınırı nedeniyle eksik olabilir.','amber');
  renderKpis();renderOverview();renderLessons();renderStudents();renderHomework();renderEvaluation();
 }
 function createPayload(){
  const g=current();return {
   archiveFormat:'AYDA_GRUP_ARSIVI_V1',groupId:g.id,generatedAt:new Date().toISOString(),periodStart:'2026-10-20',
   disclaimer:'Google API sinirlamalari ve kesilmis listeler mevcut olabilir; bu dosya sunucu tarafinda kaydedilmis arsiv degildir.',
   scope:state.overview.user.role,group:g,teacher:{id:g.teacherId,name:teacher(g.teacherId)},
   activeSchedule:array(state.overview.schedule).filter(x=>x.groupId===g.id),
   lessonReports:groupLessons(),studentTracking:state.tracking?groupStudents():null,
   attendanceAggregate:groupAttendance(),lessonHomework:state.homeworks?groupHomework():null,
   assignedHomework:state.tasks?groupTasks():null,missingRecords:state.reminders?groupReminders():null,
   surveysMatchedByName:state.surveys?groupSurveys():null,unavailableSources:state.errors,
   coverage:{lessonHomeworkReturned:state.homeworks?.items?.length??null,lessonHomeworkTotal:state.homeworks?.total??null,homeworkTasksReturned:state.tasks?.tasks?.length??null,homeworkTasksTotal:state.tasks?.total??null,studentHistory:'yalnizca aktif grup ve son 5 tarihli kontrol',historicPlanChanges:'mevcut degil',pre20261020:'mevcut degil'}
  };
 }
 function saveFile(textValue,name,type){
  const blob=new Blob([textValue],{type}),u=URL.createObjectURL(blob),a=el('a');
  a.href=u;a.download=name;document.body.append(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(u),2000);
 }
 function exportJson(){
  if(!current())return;
  saveFile(JSON.stringify(createPayload(),null,2),'AYDA-Grup-Arsivi-'+slug(current().id)+'-'+new Date().toISOString().slice(0,10)+'.json','application/json;charset=utf-8');
 }
 function exportCsv(){
  if(!current())return;
  const h=['Kayıt ID','Tarih','Grup ID','Öğretmen ID','Durum','Süre','Ünite','Tamamlanan','Konu','Öğretmen notu'];
  const esc=v=>{let s=String(v??'');if(/^[\s]*[=+@-]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';};
  const rows=groupLessons().map(l=>[l.id,l.date,l.groupId,l.teacherId,l.status,l.actual,l.unit,l.completed,l.topic,l.note]);
  saveFile('\ufeff'+[h,...rows].map(x=>x.map(esc).join(';')).join('\r\n'),'AYDA-Ders-Arsivi-'+slug(current().id)+'.csv','text/csv;charset=utf-8');
 }
 async function refresh(){
  if(state.busy||!state.key)return;
  state.busy=true;status('Veriler yenileniyor…');$('archiveRefresh').disabled=true;
  state.errors=[];
  try{
   const over=await request('overview',state.key);
   if(!['admin','viewer','teacher'].includes(over?.user?.role))throw Error('Akademik arşiv için yetkili kullanıcı gerekir.');
   state.overview=over;
   const calls=['trackingSummary','lessonHomework','homeworkTasks','reminders'];
   if(over.user.role!=='teacher')calls.push('surveySummary');
   const results=await Promise.allSettled(calls.map(x=>request(x,state.key)));
   calls.forEach((name,i)=>{const key={trackingSummary:'tracking',lessonHomework:'homeworks',homeworkTasks:'tasks',reminders:'reminders',surveySummary:'surveys'}[name];const r=results[i];state[key]=r.status==='fulfilled'?r.value:null;if(r.status==='rejected')state.errors.push((sourceNames[name]||name)+': '+String(r.reason?.message||'hata'));});
   if(over.user.role==='teacher')state.surveys=null;
   const groups=array(over.groups).slice().sort((a,b)=>(a.status==='Aktif'?0:1)-(b.status==='Aktif'?0:1)||String(a.name).localeCompare(String(b.name),'tr'));
   if(!groups.length)throw Error('Bu hesap için görüntülenebilir grup bulunamadı.');
   const preferred=state.id||new URLSearchParams(location.search).get('group')||'';
   const select=$('archiveGroup');select.replaceChildren();
   for(const g of groups)select.add(new Option(g.name+' · '+g.level+' · '+g.status,g.id));
   state.id=groups.some(g=>g.id===preferred)?preferred:groups[0].id;select.value=state.id;
   state.loadedAt=new Date().toLocaleString('tr-TR');render();
   status(state.errors.length?'Yüklendi · '+state.errors.length+' kaynak eksik':'Veriler güncel');
  }catch(e){status('Veri alınamadı');warning('Arşiv güncellenemedi: '+String(e.message||e),'amber');if(!state.overview)showAuth('Grup arşivi açılamadı.',String(e.message||e));}
  finally{state.busy=false;$('archiveRefresh').disabled=false;}
 }
 async function start(){
  const keys=sessionKeys();
  if(!keys.length){showAuth('Önce AYDA hesabınızla giriş yapın.','Öğretmen, yönetici veya izleme hesabıyla ana sitede oturum açın; ardından arşive dönün.');return;}
  let found=null,err=null;
  for(const k of keys){try{const o=await request('overview',k);if(['teacher','admin','viewer'].includes(o?.user?.role)){found={key:k,overview:o};break;}}catch(e){err=e;}}
  if(!found){showAuth('Oturum doğrulanamadı.','Yetkili bir AYDA hesabıyla tekrar giriş yapın. '+(err?.message||''));return;}
  state.key=found.key;state.overview=found.overview;
  $('archiveAuth').hidden=true;$('archiveWorkspace').hidden=false;status('Arşiv verileri yükleniyor…');
  await refresh();
 }
 $('archiveGroup').addEventListener('change',e=>{
  state.id=e.target.value;const u=new URL(location.href);u.searchParams.set('group',state.id);history.replaceState(null,'',u.pathname+u.search);
  render();tab('overview');
 });
 $('archiveRefresh').addEventListener('click',refresh);
 $('archiveExport').addEventListener('click',exportJson);
 $('archiveCsv').addEventListener('click',exportCsv);
 $('archivePrint').addEventListener('click',()=>window.print());
 for(const b of document.querySelectorAll('[data-archive-tab]'))b.addEventListener('click',()=>tab(b.dataset.archiveTab));
 for(const b of document.querySelectorAll('[data-archive-jump]'))b.addEventListener('click',()=>tab(b.dataset.archiveJump));
 start();
})();