/* AYDA Teacher Monitor V4: teacher-only monitoring from existing authorized endpoints. */
(()=>{
'use strict';
const root=document.getElementById('app');
if(!root||!document.body.classList.contains('ayda-teacher'))return;
const el=(t,c,s)=>{const n=document.createElement(t);if(c)n.className=c;if(s!==undefined)n.textContent=String(s);return n;};
const teacher=()=>typeof data!=='undefined'&&data?.user?.role==='teacher';
const dateTR=s=>String(s||'').replace(/^(\d{4})-(\d\d)-(\d\d)$/,'$3.$2.$1');
const box=el('section','ayda-monitor');box.id='aydaTeacherDashboard';box.dataset.aydaPage='home';box.setAttribute('aria-label','Öğretmen günlük izleme paneli');
const top=el('div','ayda-monitor-head'),intro=el('div');
intro.append(el('span','ayda-monitor-eyebrow','GÜNLÜK KONTROL'),el('h2','','Günlük akademik durum'),el('p','','Eksik kayıtlar, ders durumun ve yaklaşan program.'));
const refresh=el('button','ayda-monitor-refresh','↻ Yenile');refresh.type='button';top.append(intro,refresh);box.append(top);
const state=el('p','ayda-monitor-status','Kontrol ediliyor…');state.setAttribute('role','status');state.setAttribute('aria-live','polite');box.append(state);
const numbers=el('div','ayda-monitor-summary');box.append(numbers);
const grid=el('div','ayda-monitor-grid');box.append(grid);
const alertCard=el('section','ayda-monitor-card'),ah=el('div','ayda-monitor-section-title'),flag=el('span','ayda-monitor-tag','Kontrol ediliyor');
ah.append(el('h3','','Eksik Kayıtlarım'),flag);alertCard.classList.add('ayda-monitor-priority');alertCard.append(ah,el('p','ayda-monitor-caption','Son 30 gündeki, ders bitiminden 12 saat sonra hâlâ tamamlanmamış rapor ve yoklamalar. Grup ve tarih üzerinden tek dokunuşla tamamlayın.'));
const alertList=el('div','ayda-monitor-alert-list');alertCard.append(alertList);
let expanded=false;const all=el('button','ayda-monitor-subaction','Diğer eksikleri göster ↓');all.type='button';all.setAttribute('aria-expanded','false');all.addEventListener('click',()=>{expanded=!expanded;render();});alertCard.append(all);box.insertBefore(alertCard,numbers);
const monthCard=el('section','ayda-monitor-card'),mh=el('div','ayda-monitor-section-title'),monthTag=el('span','ayda-monitor-tag','Bu ay');
mh.append(el('h3','','Aylık ders takibi'),monthTag);monthCard.append(mh);
const monthNumbers=el('div','ayda-monitor-month-numbers'),groups=el('div','ayda-monitor-group-list');
monthCard.append(monthNumbers,el('p','ayda-monitor-caption','Planlar kayıtlı haftalık programa göredir; tatiller ve değişiklikler farklılık yaratabilir.'),groups);
const monthLink=el('button','ayda-monitor-subaction','Ayrıntılı aylık çizelge →');monthLink.type='button';monthLink.addEventListener('click',()=>window.AYDA_TEACHER_VIEWS?.open?.('history'));monthCard.append(monthLink);grid.append(monthCard);
const upcoming=el('section','ayda-monitor-upcoming'),uh=el('div','ayda-monitor-upcoming-head'),upLink=el('button','ayda-monitor-subaction','Tüm program →');
upLink.type='button';upLink.addEventListener('click',()=>window.AYDA_TEACHER_VIEWS?.open?.('schedule'));uh.append(el('h3','','Yaklaşan dersler'),upLink);upcoming.append(uh);
const future=el('div','ayda-monitor-upcoming-list');upcoming.append(future);box.append(upcoming);
box.append(el('p','ayda-monitor-footer','Bu özet, AYDA yönetim panelinin kullandığı ders kayıtlarına dayanır. Öğrenci ayrıntıları ayrı “Öğrenciler” menüsündedir.'));
const today=document.getElementById('todayLessons'),shortcuts=document.getElementById('aydaTeacherHomeActions');
if(shortcuts)shortcuts.insertAdjacentElement('afterend',box);else if(today)today.insertAdjacentElement('beforebegin',box);else root.prepend(box);
let alerts=null,month=null,alertsStatus='pending',monthStatus='pending',userId='';
// When the reminders endpoint is unavailable, only missing reports can be inferred from the signed-in snapshot.
function reportFallback(){
 const today=String(data?.today||'');if(!/^\d{4}-\d{2}-\d{2}$/.test(today))return null;
 const groups=new Map((data.groups||[]).filter(g=>g.status==='Aktif').map(g=>[String(g.id),g]));
 const existing=new Set((data.history||[]).map(r=>String(r.groupId)+'|'+String(r.date)));
 const week=['Pazar','Pazartesi','Salı','Çarşamba','Perşembe','Cuma','Cumartesi'];
 const now=Date.now(),base=new Date(today+'T12:00:00Z'),results=[],seen=new Set();
 for(let back=0;back<=30;back++){
  const date=new Date(base.getTime()-back*86400000).toISOString().slice(0,10);
  if(date<'2026-10-19')continue;
  const weekday=week[new Date(date+'T12:00:00Z').getUTCDay()];
  for(const slot of data.schedule||[]){
   const g=groups.get(String(slot.groupId)),end=String(slot.end||'').trim();
   if(!g||slot.day!==weekday||(g.start&&date<g.start)||(g.end&&date>g.end)||!/^([01]\d|2[0-3]):[0-5]\d$/.test(end))continue;
   const key=String(g.id)+'|'+date,finish=new Date(date+'T'+end+':00+03:00').getTime();
   if(seen.has(key)||existing.has(key)||now-finish<12*3600000)continue;
   seen.add(key);results.push({type:'report',groupId:g.id,group:g.name,date,end,ageHours:Math.floor((now-finish)/3600000)});
  }
 }
 results.sort((a,b)=>b.date.localeCompare(a.date)||String(a.group).localeCompare(String(b.group)));
 return {items:results.slice(0,120),reports:results.length,total:results.length,attendance:null,fallback:true};
}
const metric=(label,value,extra,highlight)=>{const n=el('div','ayda-monitor-metric'+(highlight?' is-featured':''));n.append(el('strong','',value),el('span','',label));if(extra)n.append(el('small','',extra));return n;};
const button=(label,cb)=>{const n=el('button','ayda-monitor-item-button',label);n.type='button';n.addEventListener('click',cb);return n;};
function approaching(){
 future.replaceChildren();
 const today=String(data?.today||''),schedule=data?.schedule||[],map=new Map((data?.groups||[]).map(g=>[String(g.id),g]));
 if(!/^\d{4}-\d\d-\d\d$/.test(today))return;
 const base=new Date(today+'T12:00:00Z'),days=['Pazar','Pazartesi','Salı','Çarşamba','Perşembe','Cuma','Cumartesi'],found=[];
 for(let i=1;i<=7;i++){
  const d=new Date(base.getTime()+i*86400000),date=d.toISOString().slice(0,10);
  for(const lesson of schedule){
   if(lesson.day!==days[d.getUTCDay()])continue;
   const g=map.get(String(lesson.groupId));if(!g||(g.start&&date<g.start)||(g.end&&date>g.end))continue;
   found.push({date,day:days[d.getUTCDay()],name:g.name,start:lesson.start||'',end:lesson.end||''});
  }
 }
 found.sort((a,b)=>a.date.localeCompare(b.date)||String(a.start).localeCompare(String(b.start)));
 if(!found.length){future.append(el('p','ayda-monitor-empty','Önümüzdeki 7 gün için planlı grup dersi yok.'));return;}
 for(const x of found.slice(0,3)){
  const item=el('div','ayda-monitor-next-item'),when=el('div','ayda-monitor-next-date'),info=el('div','ayda-monitor-next-info');
  when.append(el('strong','',x.date.slice(8)),el('span','',x.day.slice(0,3)));
  info.append(el('strong','',x.name),el('span','',dateTR(x.date)+' · '+x.start+(x.end?'–'+x.end:'')));
  item.append(when,info);future.append(item);
 }
}
function render(){
 if(!teacher())return;
 state.textContent=alertsStatus==='pending'?'Eksik rapor ve yoklamalar kontrol ediliyor…':alertsStatus==='fallback'?'Raporlar mevcut ders programından hesaplandı; yoklama doğrulanamadı.':alertsStatus==='error'?'Eksik kayıt bilgisi alınamadı; yeniden deneyin.':monthStatus==='pending'?'Eksik kayıtlar güncel · Aylık özet hazırlanıyor…':monthStatus==='error'?'Eksik kayıtlar güncel · Aylık özet alınamadı.':'Eksik kayıtlar ve aylık program kontrol edildi.';
 const rc=['success','fallback'].includes(alertsStatus)?Number(alerts?.reports)||0:null,ac=alertsStatus==='success'?Number(alerts?.attendance)||0:null;
 numbers.replaceChildren(metric('Eksik ders raporu',rc===null?'—':rc,'Son 30 gün',rc>0),metric('Eksik yoklama',ac===null?'—':ac,'Tamamlanması gereken',ac>0),metric('Aylık planlanan ders',month?.planned??'—','Grup dersleri'),metric('İşlenen ders',month?.completed??'—','Bu ay · Grup'));
 alertList.replaceChildren();
 if(!['success','fallback'].includes(alertsStatus)){
  flag.className='ayda-monitor-tag';flag.textContent=alertsStatus==='error'?'Bağlantı yok':'Kontrol ediliyor';
  alertList.append(el('p','ayda-monitor-empty',alertsStatus==='error'?'Eksik kayıtlar doğrulanamadı. Yeniden deneyin.':'Eksik kayıtlar yükleniyor…'));all.hidden=true;
 }else{
  const list=(Array.isArray(alerts?.items)?alerts.items:[]).filter(row=>row&&['report','attendance'].includes(row.type));flag.textContent=alertsStatus==='fallback'?'Rapor kontrolü':list.length?String(alerts.total??list.length)+' eksik':'Tamamlandı';
  flag.className='ayda-monitor-tag'+(list.length?' is-warning':' is-clear');
  if(!list.length)alertList.append(el('p','ayda-monitor-ok',alertsStatus==='fallback'?'Ders programına göre eksik rapor bulunamadı. Yoklamalar doğrulanamadı.':'✓ Son 30 gün için eksik rapor veya yoklama bulunmuyor.'));
  for(const row of list.slice(0,expanded?120:5)){
   if(row.type!=='report'&&row.type!=='attendance')continue;
   const wrap=el('div','ayda-monitor-alert-item'),copy=el('div','ayda-monitor-alert-copy');
   const type=row.type==='report'?'Ders raporu eksik':'Yoklama eksik';
   const elapsed=Number(row.ageHours),delay=Number.isFinite(elapsed)&&elapsed>=0?(elapsed>=48?Math.floor(elapsed/24)+' gün önce':elapsed+' saat önce'):'';
   copy.append(el('strong','',type),el('span','',String(row.group||'Grup')+' · '+dateTR(row.date)+(row.end?' · '+row.end:'')),el('small','ayda-monitor-age',delay));
   wrap.append(copy,button(row.type==='report'?'Raporu doldur':'Yoklamayı tamamla',()=>{
    if(row.groupId&&row.date&&window.AYDA_OPEN_LESSON)window.AYDA_OPEN_LESSON(row.groupId,row.date,row.type==='attendance');
    else window.AYDA_TEACHER_VIEWS?.open?.('daily');
   }));alertList.append(wrap);
  }
  all.hidden=list.length<=5;
  all.textContent=expanded?'Daha az göster ↑':`Diğer ${list.length-5} eksik kaydı burada göster ↓`;
  all.setAttribute('aria-expanded',expanded?'true':'false');
  if(Number(alerts?.total)>list.length&&expanded){alertList.append(el('p','ayda-monitor-caption',`İlk ${list.length} kayıt gösteriliyor. Güncel tam liste için yönetime başvurun.`));}
 }
 monthNumbers.replaceChildren();groups.replaceChildren();
 if(month){
  const [y,m]=String(month.month||data.today.slice(0,7)).split('-');
  monthTag.textContent=new Intl.DateTimeFormat('tr-TR',{month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(Date.UTC(Number(y),Number(m)-1,1)));
  monthNumbers.append(metric('Kalan planlı',month.remaining??'—'),metric('Özel ders',month.privateCompleted??'—'),metric('İptal',month.cancelled??'—'),metric('Ertelenen',month.postponed??'—'),metric('İşlenen toplam saat',month.hours===undefined?'—':Number(month.hours).toLocaleString('tr-TR',{maximumFractionDigits:2}),month.hours===undefined?'Saat bilgisi bekleniyor':''));
  const list=Array.isArray(month.byGroup)?month.byGroup:[];
  for(const g of list.slice(0,5)){
   const line=el('div','ayda-monitor-group'),label=el('div','ayda-monitor-group-label');
   label.append(el('span','',g.name||'Grup'),el('strong','',String(g.done||0)+' / '+String(g.planned||0)+' ders'));
   const track=el('div','ayda-monitor-progress'),fill=el('span');fill.style.width=Math.min(100,Math.max(0,100*Number(g.done||0)/Math.max(1,Number(g.planned||0))))+'%';
   track.append(fill);line.append(label,track);groups.append(line);
  }
  if(list.length>5)groups.append(el('p','ayda-monitor-caption','Diğer grupları ayrıntılı çizelgeden görüntüleyin.'));
 }else{
  monthTag.textContent='Bu ay';monthNumbers.append(el('p','ayda-monitor-empty',monthStatus==='error'?'Aylık ders bilgisi alınamadı.':'Aylık çizelge yükleniyor…'));
 }
 approaching();
}
refresh.addEventListener('click',()=>{
 if(!teacher())return;expanded=false;alerts=null;month=null;alertsStatus='pending';monthStatus='pending';render();
 refresh.disabled=true;refresh.textContent='Yenileniyor…';
 window.dispatchEvent(new Event('ayda:teacher-monitor-refresh'));
});
window.addEventListener('ayda:reminders-result',ev=>{
 if(!teacher())return;
 const d=ev.detail||{};alertsStatus=d.state==='success'?'success':d.state==='error'?'error':'pending';
 alerts=alertsStatus==='success'?d.data:null;
 if(alertsStatus==='error'){const estimated=reportFallback();if(estimated){alerts=estimated;alertsStatus='fallback';}}
 refresh.disabled=false;refresh.textContent='↻ Yenile';render();
});
window.addEventListener('ayda:month-result',ev=>{
 if(!teacher())return;
 const d=ev.detail||{};
 if(d.data?.month===String(data.today).slice(0,7)){month=d.data;monthStatus='success';}
 else if(d.state==='error'&&!month)monthStatus='error';
 refresh.disabled=false;refresh.textContent='↻ Yenile';render();
});
window.addEventListener('ayda:login',()=>{
 if(!teacher())return;
 /* Preserve fallback monthly figures already received during login. */ userId=String(data.user.id);
 render();
});
window.addEventListener('ayda:saved',()=>{if(teacher()){alertsStatus='pending';render();}});
window.addEventListener('ayda:logout',()=>{userId='';expanded=false;alerts=null;month=null;alertsStatus='pending';monthStatus='pending';});
if(teacher())render();
})();