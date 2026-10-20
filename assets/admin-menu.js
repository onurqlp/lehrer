"use strict";
/* AYDA — Yöneticinin en sık yaptığı işler tek seviyeli menüde. */
(()=>{
 const area=document.getElementById('adminArea'),nav=document.getElementById('adminNav');
 if(!area||!nav)return;
 const tabs=[
  {id:'academic',label:'◉ Genel Bakış'},
  {id:'health',label:'✚ Sistem Sağlığı'},
  {id:'students',label:'👥 Öğrenciler'},
  {id:'groups',label:'▦ Gruplar'},
  {id:'teachers',label:'◉ Öğretmenler'},
  {id:'messages',label:'✉ İletişim'},
  {id:'forms',label:'▤ Formlar'},
  {id:'money',label:'◷ Ders Saatleri'}
 ];
 const sectionMap={
  'Yönetim · Aylık Ders ve Ücret Çizelgesi':'money',
  'Akademik Planlama · 24 Ünite + 2 Sınav Hazırlığı':'academic',
  'Öğrenci Takibi · Devamsızlık ve Ödev':'students',
  'CRM CSV Karşılaştırması · İsteğe Bağlı':'students',
  'Yeni Öğretmen Ekle':'teachers',
  'Öğretmenlerin Sınıflarını Değiştir':'teachers',
  'Öğrenci Kayıt İşlemleri':'students',
  'Yeni Grup Aç ve Programını Belirle':'groups',
  'Mevcut Grup Bilgilerini Düzenle':'groups',
  'Grup Eksiklerini Tamamla':'groups',
  'Öğretmen Hesapları ve Anahtar Arşivi':'teachers',
  'Kolay Parola Yönetimi':'teachers',
  'Giriş Anahtarı Yönetimi':'teachers',
  'Grup Durumu ve Son İşlenen Konular':'groups'
 };
 let section='academic',active='academic';
 // Kayıt formları aynı DOM'da kalır; sadece ilgili görevde gösterilir.
 for(const child of [...area.children]){
  if(child.id==='adminNav'||child.classList.contains('adminQuick'))continue;
  if(child.id==='aydaAdminHealth'){child.dataset.adminTab='health';continue;}
  if(child.id==='owner-messages'){child.dataset.adminTab='messages';continue;}
  if(child.id==='aydaAdminForms'){child.dataset.adminTab='forms';continue;}
  if(child.classList.contains('section')){
   const title=child.querySelector('h2')?.textContent?.trim();
   if(sectionMap[title])section=sectionMap[title];
  }
  child.dataset.adminTab=section;
 }
 const legacyNav=document.getElementById('adminSettingsNav');
 if(legacyNav)legacyNav.remove();
 nav.replaceChildren();
 for(const tab of tabs){
  const b=document.createElement('button');
  b.type='button';b.dataset.target=tab.id;b.textContent=tab.label;b.setAttribute('aria-pressed','false');
  b.addEventListener('click',()=>open(tab.id,true));
  nav.append(b);
 }
 function normalize(tab,sub){
  if(tab==='settings'||tab==='ayarlar')return sub==='teachers'?'teachers':sub==='students'?'students':sub==='money'?'money':'groups';
  if(tab==='update')return 'groups';
  if(tab==='accounts')return 'teachers';
  if(tab==='messages'||tab==='mesajlar')return 'messages';
  if(tab==='forms'||tab==='formlar')return 'forms';
  if(tab==='saglik'||tab==='sağlık')return 'health';
  return tabs.some(x=>x.id===tab)?tab:'academic';
 }
 function open(tab,scroll){
  active=normalize(tab);
  document.body.classList.toggle('ayda-admin-overview',active==='academic');
  document.body.classList.toggle('ayda-admin-health-page',active==='health');
  for(const child of area.querySelectorAll(':scope > [data-admin-tab]')){
   child.hidden=child.dataset.adminTab==='health'
    ?!['academic','health'].includes(active)
    :child.dataset.adminTab!==active;
  }
  for(const b of nav.querySelectorAll('button')){
   const selected=b.dataset.target===active;
   b.classList.toggle('active',selected);b.setAttribute('aria-pressed',String(selected));
  }
  try{sessionStorage.setItem('aydaAdminTab',active)}catch(_){}
  if(active==='health')window.dispatchEvent(new Event('ayda:health-open'));
  if(active==='forms')window.dispatchEvent(new Event('ayda:forms-open'));
  if(active==='messages')window.dispatchEvent(new Event('ayda:messages-open'));
  if(scroll)nav.scrollIntoView({block:'start',behavior:'smooth'});
 }
 function hashTab(){
  const hash=decodeURIComponent(location.hash.slice(1)).toLocaleLowerCase('tr-TR');
  if(['saglik','sağlık','health','sistem-sagligi'].includes(hash))return 'health';
  if(['formlar','forms'].includes(hash))return 'forms';
  if(['mesajlar','iletisim','iletişim'].includes(hash))return 'messages';
  if(['grup-islemleri','gruplar','duzenle'].includes(hash))return 'groups';
  if(['ogretmenler','hesaplar'].includes(hash))return 'teachers';
  if(['ogrenciler','öğrenciler'].includes(hash))return 'students';
  if(['ders-saatleri','muhasebe'].includes(hash))return 'money';
  if(['ayarlar','settings'].includes(hash))return 'groups';
  return '';
 }
 function applyHash(){
  if(!document.body.classList.contains('ayda-is-admin'))return;
  const target=hashTab();if(target)open(target,false);
 }
 const old=sessionStorage.getItem('aydaAdminTab')||'academic';
 open(hashTab()||old,false);
 window.addEventListener('hashchange',applyHash);
 window.addEventListener('ayda:login',applyHash);
 document.getElementById('aydaOpenHealth')?.addEventListener('click',event=>{event.preventDefault();open('health',true);if(location.hash!=='#saglik')history.replaceState(null,'','#saglik');});
 document.getElementById('aydaAdminHealthShow')?.addEventListener('click',event=>{event.preventDefault();open('health',true);if(location.hash!=='#saglik')history.replaceState(null,'','#saglik');});
 window.AYDA_ADMIN_MENU={open:(tab,sub)=>open(normalize(tab,sub),false),active:()=>active};
 // Her görev tek tıklamayla açılır, yan menüye ya da ayrı sayfaya gitmez.
 const shortcuts=[
  {text:'＋ Yeni grup',tab:'groups',target:'groupCreateForm'},
  {text:'＋ Öğrenci ekle / düzenle',tab:'students',target:'adminStudentForm'},
  {text:'◉ Öğretmen işlemleri',tab:'teachers',target:'teacherGroupsForm'},
  {text:'✉ Mesajlar',tab:'messages',target:'owner-messages'},
  {text:'▤ Form Yanıtları',tab:'forms',target:'aydaAdminForms'},
  {text:'✚ Eksikleri düzelt',tab:'health',target:'aydaAdminHealth'}
 ];
 const quick=document.querySelector('#adminArea > .adminQuick');
 if(quick&&!document.getElementById('aydaAdminQuickActions')){
  const actions=document.createElement('div');
  actions.id='aydaAdminQuickActions';actions.className='ayda-admin-quick-actions';
  for(const item of shortcuts){
   const b=document.createElement('button');b.type='button';b.textContent=item.text;b.dataset.quickTab=item.tab;
   b.addEventListener('click',()=>{
    open(item.tab,false);
    const target=document.getElementById(item.target);
    if(target){target.scrollIntoView({block:'start',behavior:'smooth'});if(item.target!=='aydaAdminHealth')target.querySelector('input:not([disabled]),select:not([disabled])')?.focus({preventScroll:true})}
   });actions.append(b);
  }
  quick.append(actions);
 }
})();
