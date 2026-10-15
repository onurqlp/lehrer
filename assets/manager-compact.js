"use strict";
/* A different layout for the SAME AYDA application. All existing admin forms,
   report handlers and permissions come from app.js + admin-menu.js. */
(()=>{
 const $=id=>document.getElementById(id);
 const create=(tag,cls,txt)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(txt!==undefined)e.textContent=String(txt);return e;};
 const admin=$('adminArea'),app=$('app'),nav=$('adminNav');
 if(!admin||!app||!nav)return;
 let tracking=null,request=0,studentOpen=false,showOps=false;
 const statusLabels={danger:'Öncelikli',watch:'Takip edilmeli',regular:'Düzenli',untracked:'Veri yok'};
 const fmt=date=>/^\d{4}-\d\d-\d\d$/.test(String(date||''))?date.slice(8)+'.'+date.slice(5,7)+'.'+date.slice(0,4):'—';
 const makeButton=(label,cls,callback)=>{const b=create('button',cls,label);b.type='button';b.addEventListener('click',callback);return b;};
 const append=(parent,tag,cls,txt)=>{const e=create(tag,cls,txt);parent.append(e);return e;};
 const before=el=>el?.previousElementSibling?.classList.contains('section')?el.previousElementSibling:null;
 const initialSections={
  today:[before($('todayLessons')),$('todayLessons'),before($('groups')),$('groups')],
  schedule:[before($('schedule')),$('schedule')],
  daily:[$('daily')],
  history:[before($('history')),$('history')],
  password:[document.querySelector('.self-password-section')]
 };
 const ops=create('section','compact-ops');ops.id='managerOps';
 const opsBanner=append(ops,'div','compact-ops-banner'),opsHeading=append(opsBanner,'div');
 append(opsHeading,'strong','','Diğer günlük işlemler ve kayıtlar');
 append(opsHeading,'p','','Ders raporu, yoklama, program, geçmiş kayıtlar ve parolalar burada; hiçbir işlem kaldırılmadı.');
 const opsToggle=makeButton('İşlemleri göster ↓','compact-action',()=>toggleOps(!showOps));
 opsBanner.append(opsToggle);
 const opsBody=append(ops,'div');opsBody.id='managerOpsBody';opsBody.hidden=true;
 const opsNav=append(opsBody,'nav','compact-ops-nav');opsNav.setAttribute('aria-label','Günlük işlemler');
 const opsPanels=append(opsBody,'div');
 const types=[['today','Bugün / Gruplar'],['schedule','Haftalık Program'],['daily','Ders Raporu + Yoklama'],['history','Ders Geçmişi'],['password','Parolam']];
 function showOpsPanel(id){
  for(const [key] of types)$(('managerOpsPanel'+key[0].toUpperCase()+key.slice(1))).hidden=key!==id;
  for(const b of opsNav.querySelectorAll('button'))b.classList.toggle('primary',b.dataset.panel===id);
 }
 for(const [id,label] of types){
  const panel=append(opsPanels,'div','compact-ops-panel');panel.id='managerOpsPanel'+id[0].toUpperCase()+id.slice(1);
  for(const child of initialSections[id])if(child)panel.append(child);
  const b=makeButton(label,'compact-action',()=>showOpsPanel(id));b.dataset.panel=id;opsNav.append(b);
 }
 showOpsPanel('today');
 function toggleOps(open,panel){
  showOps=open;opsBody.hidden=!open;opsToggle.textContent=open?'İşlemleri gizle ↑':'İşlemleri göster ↓';
  if(panel)showOpsPanel(panel);
  if(open)ops.scrollIntoView({behavior:'smooth',block:'start'});
 }
 // Keep the management tools first, move the shared teacher/admin auxiliary forms to a compact optional workspace.
 const stats=app.querySelector('.stats');
 const banner=create('section','compact-strip');banner.id='managerCompactStrip';
 const words=append(banner,'div','compact-strip-text');
 append(words,'strong','','Tam yetkili yönetim • tek veri kaynağı');
 append(words,'small','','Bu ekran ana panelle aynı Google Sheets verilerini ve yönetim işlemlerini kullanır.');
 const links=append(banner,'div','compact-strip-links');
 const insight=create('section','compact-insights');insight.id='managerCompactInsights';
 stats.after(banner);banner.after(insight);insight.after(admin);admin.after(ops);
 const jump=(tab)=>{
  toggleOps(false);
  const b=nav.querySelector('button[data-target="'+tab+'"]');
  if(b){b.click();nav.scrollIntoView({behavior:'smooth',block:'start'});}
 };
 links.append(makeButton('Öğrenciler','compact-action primary',()=>jump('students360')));
 links.append(makeButton('Akademik takip','compact-action',()=>jump('academic')));
 links.append(makeButton('Yoklama / Ders kaydet','compact-action',()=>toggleOps(true,'daily')));
 links.append(makeButton('Aylık saatler','compact-action',()=>jump('money')));
 links.append(makeButton('Grup düzenle','compact-action',()=>jump('update')));
 // Full student overview with individual rows, using the same authenticated trackingSummary endpoint.
 const studentsPanel=create('section');studentsPanel.id='managerStudents360';
 studentsPanel.dataset.adminTab='students360';studentsPanel.hidden=true;
 const heading=append(studentsPanel,'div','compact-student-head'),headText=append(heading,'div');
 append(headText,'h2','','Öğrenci 360 · Ayrıntılı takip');
 const count=append(heading,'span','compact-student-count');count.id='manager360Count';
 const filters=append(studentsPanel,'div','compact-student-filter');
 const inputWrap=append(filters,'label');inputWrap.append(document.createTextNode('Öğrenci ara'));
 const q=append(inputWrap,'input');q.id='manager360Search';q.placeholder='Ad soyad';
 const groupWrap=append(filters,'label');groupWrap.append(document.createTextNode('Grup'));
 const group=append(groupWrap,'select');group.id='manager360Group';group.add(new Option('Tüm gruplar',''));
 const riskWrap=append(filters,'label');riskWrap.append(document.createTextNode('Takip durumu'));
 const risk=append(riskWrap,'select');risk.id='manager360Risk';
 for(const [v,label] of [['','Tüm durumlar'],['danger','Öncelikli'],['watch','Takip edilmeli'],['regular','Düzenli'],['untracked','Henüz kayıt yok']])risk.add(new Option(label,v));
 const list=append(studentsPanel,'div');list.id='manager360List';
 const note=append(studentsPanel,'p','tiny','Riskler son beş yoklama ve ödev kontrolünden hesaplanır. Kayıt girilmeyen öğrenciler riskli sayılmaz.');
 admin.append(studentsPanel);
 const navButton=makeButton('👤 Öğrenci 360','',()=>{
   for(const el of admin.querySelectorAll(':scope > [data-admin-tab]'))el.hidden=el!==studentsPanel;
   for(const b of nav.querySelectorAll('button'))b.classList.toggle('active',b===navButton);
   studentOpen=true;
 });
 navButton.dataset.target='students360';
 const studentButton=nav.querySelector('button[data-target="students"]');
 if(studentButton)studentButton.after(navButton);else nav.append(navButton);
 for(const b of nav.querySelectorAll('button'))if(b!==navButton)b.addEventListener('click',()=>{studentOpen=false;});
 function riskOf(s){return statusLabels[s.riskLevel]?s.riskLevel:'untracked';}
 function rate(s){return s.attendanceRate===null||s.attendanceRate===undefined?'—':s.attendanceRate+'%';}
 function last(s,type){
  const item=type==='attendance'?s.lastAttendance:s.lastHomework;
  if(!item)return 'Kayıt yok';
  const label=type==='attendance'&&item.excused&&item.status==='Gelmedi'?'Mazeretli':item.status;
  return label+' · '+fmt(item.date);
 }
 function studentRow(s){
  const row=create('article','compact-student-row'),main=append(row,'div','compact-student-main');
  const ident=append(main,'div');
  append(ident,'div','compact-student-name',s.name);
  const g=(data?.groups||[]).find(x=>x.id===s.groupId);
  const instructor=(data?.teachers||[]).find(t=>t.id===g?.teacherId)?.name||'';
  append(ident,'div','compact-student-meta',(g?.name||s.groupId)+(instructor?' · '+instructor:''));
  const addCell=(label,value)=>{const e=append(main,'div','compact-student-cell');append(e,'small','',label);append(e,'strong','',value);};
  addCell('Katılım',rate(s));
  addCell('Gelmedi',s.absent||0);
  addCell('Ödev eksik',s.homeworkMissing||0);
  const recent=append(main,'div','compact-student-cell');
  append(recent,'small','','Son yoklama / ödev');
  append(recent,'div','',last(s,'attendance'));
  append(recent,'div','',last(s,'homework'));
  const state=append(main,'div','compact-student-cell');append(state,'small','','Durum');
  const tag=append(state,'span','compact-student-risk '+riskOf(s),statusLabels[riskOf(s)]);
  const details=append(row,'details');
  append(details,'summary','','Son beş yoklama ve ödev kaydını gör');
  const records=append(details,'div','compact-student-records');
  const att=append(records,'div');append(att,'strong','','Yoklama');const aList=append(att,'ul');
  for(const a of s.recentAttendance||[])append(aList,'li','',((a.status==='Gelmedi'&&a.excused)?'Mazeretli':a.status)+' · '+fmt(a.date));
  if(!aList.children.length)append(aList,'li','','Henüz yoklama girilmemiş');
  const hw=append(records,'div');append(hw,'strong','','Ödev');const hList=append(hw,'ul');
  for(const h of s.recentHomework||[])append(hList,'li','',h.status+' · '+fmt(h.date));
  if(!hList.children.length)append(hList,'li','','Henüz ödev kontrolü girilmemiş');
  return row;
 }
 function renderStudents(){
  if(!tracking)return;
  const query=q.value.trim().toLocaleLowerCase('tr'),groupId=group.value,level=risk.value;
  const all=tracking.students||[];
  const filtered=all.filter(s=>(!query||s.name.toLocaleLowerCase('tr').includes(query))&&(!groupId||s.groupId===groupId)&&(!level||riskOf(s)===level));
  count.textContent=filtered.length+' / '+all.length+' öğrenci';
  list.replaceChildren();
  if(!filtered.length){append(list,'div','compact-empty','Bu filtrelere uygun öğrenci bulunamadı.');return;}
  for(const s of filtered)list.append(studentRow(s));
 }
 function renderSummary(){
  if(!data||data.user?.role!=='admin')return;
  const gs=data.groups||[],today=data.today||'',active=gs.filter(g=>g.status==='Aktif');
  const reports=(data.history||[]).filter(h=>h.date.startsWith(today.slice(0,7))&&h.status==='İşlendi').length;
  const avg=gs.length?Math.round(gs.reduce((n,g)=>n+Math.min(24,Number(g.completed)||0),0)/gs.length/24*100):0;
  const alerts=tracking?.alerts||[];
  const next=active.filter(g=>Number(g.total||24)-Number(g.completed||0)<=3&&Number(g.completed||0)<Number(g.total||24));
  insight.replaceChildren();
  const cards=[
   ['Bu ay işlenen grup dersi',reports+' rapor',''],
   ['Genel müfredat ilerlemesi',avg+'% · '+gs.length+' grup',''],
   ['Öncelikli öğrenci',tracking?(alerts.length?alerts.length+' kişi: '+alerts.slice(0,2).map(a=>a.name).join(', '):'Takip uyarısı yok'):'Yoklama verisi bekleniyor',alerts.length?'danger':''],
   ['Bitişe yakın gruplar',next.length?next.length+' grup: '+next.slice(0,2).map(g=>g.name).join(', '):'Bitişe yakın grup yok',next.length?'warn':'']
  ];
  // Present four compact operational signals without duplicating the full academic cards.
  for(const [label,value,tone] of cards){
    const el=append(insight,'div','compact-insight '+tone);append(el,'strong','',label);append(el,'p','',value);
  }
  if(tracking){
    const old=group.value;
    group.replaceChildren(new Option('Tüm gruplar',''));
    for(const g of gs)group.add(new Option(g.name,g.id));
    group.value=[...group.options].some(x=>x.value===old)?old:'';
    renderStudents();
  }
 }
 async function loadTracking(){
  if(!data||data.user?.role!=='admin')return;
  const current=++request;tracking=null;renderSummary();
  list.replaceChildren(create('div','compact-empty','Öğrenci kayıtları yükleniyor…'));
  try{
    const result=await jsonp('trackingSummary');
    if(current!==request||!data||data.user.role!=='admin')return;
    if(result.scope!=='all')throw Error('Güncel Kod.gs sürümü gereklidir.');
    tracking=result;renderSummary();
  }catch(error){if(current===request)list.replaceChildren(create('div','compact-empty','Öğrenci takibi yüklenemedi: '+error.message));}
 }
 for(const control of [q,group,risk])control.addEventListener(control===q?'input':'change',renderStudents);
 window.addEventListener('ayda:login',()=>{
  if(!data)return;
  if(data.user.role!=='admin'){location.replace('index.html');return;}
  renderSummary();loadTracking();
 });
 window.addEventListener('ayda:logout',()=>{++request;tracking=null;list.replaceChildren();insight.replaceChildren();});
 // If login completed exceptionally fast, read the already-initialised shared state.
 if(typeof data!=='undefined'&&data?.user?.role==='admin'){renderSummary();loadTracking();}
})();
