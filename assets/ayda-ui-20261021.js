/* AYDA | 21.10.2026 | Presentation-only teacher/manager monitoring. */
(()=>{'use strict';
 const $=id=>document.getElementById(id);
 const el=(tag,cls,txt)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(txt!==undefined)n.textContent=String(txt);return n;};
 const add=(parent,tag,cls,txt)=>{const n=el(tag,cls,txt);parent.append(n);return n;};
 if(document.body.classList.contains('ayda-teacher')){
  const host=document.querySelector('.ayda-site-header .topright');if(!host)return;
  const link=el('a','ayda-owner-entry','Yönetici paneli');
  link.id='aydaOwnerEntry';link.href='./yonetici.html';link.hidden=true;
  link.setAttribute('aria-label','Akademik kontrol ve yönetici paneline geç');
  host.insertBefore(link,host.querySelector('.ayda-header-help'));
  const sync=()=>{const allowed=typeof data!=='undefined'&&data?.user?.role==='admin'&&!$('app')?.classList.contains('hidden');link.hidden=!allowed;};
  for(const event of ['ayda:login','ayda:logout','ayda:admin-data-updated'])window.addEventListener(event,sync);
  sync();return;
 }
 if(!document.body.classList.contains('ayda-manager'))return;
 const root=$('owner-overview'),groups=root?.querySelector('.ayda-partner-group-summary');
 if(!root||!groups)return;
 const schedule=root.querySelector('.owner-dual');if(schedule)root.insertBefore(groups,schedule);
 const section=el('section','ayda-teacher-watch');section.id='aydaTeacherWatch';
 const head=add(section,'div','ayda-teacher-watch-heading'),intro=add(head,'div','');
 add(intro,'span','ayda-kicker','GÜNLÜK OPERASYON TAKİBİ');
 add(intro,'h2','','Öğretmen eksikleri ve uyarılar');
 add(intro,'p','','Her öğretmenin bekleyen ders raporu ve yoklamaları · Canlı verilerden hesaplanır');
 const buttons=add(head,'div','ayda-teacher-watch-actions');
 const jump=tab=>{window.AYDA_OWNER_BRIDGE?.openTab(tab);window.scrollTo({top:0,behavior:'smooth'});};
 const allAlerts=add(buttons,'button','ayda-watch-link','Tüm uyarılar →');allAlerts.type='button';allAlerts.addEventListener('click',()=>jump('alerts'));
 const messages=add(buttons,'button','ayda-watch-link secondary','Mesaj merkezi →');messages.type='button';messages.addEventListener('click',()=>jump('messages'));
 const summary=add(section,'div','ayda-watch-status');summary.setAttribute('role','status');summary.setAttribute('aria-live','polite');
 const controls=add(section,'div','ayda-watch-controls'),counter=add(controls,'div','ayda-watch-count');
 const filter=add(controls,'select','ayda-watch-filter');filter.setAttribute('aria-label','Öğretmen eksikleri filtresi');
 filter.append(new Option('Tüm öğretmenler','all'),new Option('Yalnızca eksikleri olanlar','missing'));
 const list=add(section,'div','ayda-watch-grid');root.insertBefore(section,groups);
 const date=s=>/^\d{4}-\d{2}-\d{2}$/.test(String(s||''))?s.slice(8)+'.'+s.slice(5,7)+'.'+s.slice(0,4):'Tarih bilinmiyor';
 let teachers=[],remindersReady=false;
 function draw(){
  list.replaceChildren();
  const visible=filter.value==='missing'?teachers.filter(t=>t.pending.length):teachers;
  counter.textContent=remindersReady?teachers.filter(t=>t.pending.length).length+' öğretmende eksik kayıt · '+teachers.length+' öğretmen kontrol edildi':'Eksik kayıt servisi yanıtı bekleniyor';
  if(!visible.length){add(list,'p','ayda-watch-empty',remindersReady?'Bu filtreye uygun eksik kayıt yok.':'Öğretmen bilgileri bulunamadı.');return;}
  for(const t of visible){
   const card=add(list,'article','ayda-watch-card '+(!remindersReady?'pending':t.pending.length?'warning':'clear'));
   const header=add(card,'div','ayda-watch-card-head'),who=add(header,'div','');
   add(who,'strong','',t.name);
   add(who,'small','',t.groups.map(g=>g.name).join(' · ')||'Grup eşleşmesi yok / özel ders');
   add(header,'span','ayda-watch-pill',!remindersReady?'Kontrol bekleniyor':t.pending.length?t.pending.length+' eksik':'Eksik yok');
   if(t.pending.length){
    const notes=add(card,'ul','ayda-watch-missing-list');
    for(const r of t.pending.slice(0,3))add(notes,'li','',(r.type==='attendance'?'Yoklama':'Ders raporu')+' · '+(r.group||t.groups.find(g=>g.id===r.groupId)?.name||'Grup')+' · '+date(r.date));
    if(t.pending.length>3)add(card,'p','ayda-watch-more','+ '+(t.pending.length-3)+' bekleyen kayıt daha');
    const actions=add(card,'div','ayda-watch-card-actions'),send=add(actions,'button','ayda-watch-action','Hatırlatma mesajı hazırla →');
    send.type='button';send.addEventListener('click',()=>{const r=t.pending[0];jump('messages');window.dispatchEvent(new CustomEvent('ayda:compose-teacher',{detail:{teacherId:t.id,groupId:r.groupId,date:r.date,type:r.type}}));});
   }else add(card,'p','ayda-watch-description',remindersReady?'Bekleyen yoklama veya ders raporu tespit edilmedi.':'Eksik ders raporu servisi doğrulanamadı.');
  }
 }
 function render(){
  const b=window.AYDA_OWNER_BRIDGE;if(!b?.ready()){section.hidden=true;return;}section.hidden=false;
  const overview=b.overview()||{},r=b.reminders(),tracking=b.tracking();
  remindersReady=Array.isArray(r?.items);
  const missing=remindersReady?r.items:[],active=(Array.isArray(overview.teachers)?overview.teachers:[]).filter(t=>t.status==='Aktif');
  const groups=Array.isArray(overview.groups)?overview.groups:[];
  teachers=active.map(t=>({id:t.id,name:t.name||t.id,groups:groups.filter(g=>g.teacherId===t.id&&g.status==='Aktif'),pending:missing.filter(x=>x.teacherId===t.id).sort((a,b)=>String(b.date||'').localeCompare(String(a.date||'')))})).sort((a,b)=>b.pending.length-a.pending.length||a.name.localeCompare(b.name,'tr'));
  const unmatched=missing.filter(x=>!active.some(t=>t.id===x.teacherId));
  const risk=Array.isArray(tracking?.alerts)?tracking.alerts.length:null,total=remindersReady?missing.length:null;
  summary.replaceChildren();summary.classList.toggle('needs-attention',total===null||Boolean(total)||Boolean(risk));
  const dot=add(summary,'span','ayda-watch-status-icon',(total||risk)?'!':total===null?'…':'✓');dot.setAttribute('aria-hidden','true');
  const text=add(summary,'div','');
  add(text,'strong','',total===null?'Eksik kayıt kontrolü tamamlanamadı':total||risk?'Takip gerektiren kayıtlar var':'Akademik kayıt kontrolü tamamlandı');
  add(text,'p','',(total===null?'Eksik ders/yoklama kontrol edilemedi':total+' eksik ders raporu veya yoklama')+' · '+(risk===null?'Öğrenci uyarıları yüklenemedi':risk+' öncelikli öğrenci uyarısı'));
  if(unmatched.length)add(summary,'p','ayda-watch-unknown',unmatched.length+' kayıtta aktif öğretmen eşleşmesi bulunamadı; Uyarılar bölümünden inceleyin.');
  draw();
 }
 filter.addEventListener('change',draw);
 window.addEventListener('ayda:owner-ready',render);
 window.addEventListener('ayda:owner-logout',()=>{teachers=[];section.hidden=true;});
 render();
})();