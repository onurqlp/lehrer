"use strict";
/* AYDA manager priorities: track/act first; infrequently used mutations live under Settings. */
(()=>{
 const area=document.getElementById('adminArea'),nav=document.getElementById('adminNav');
 if(!area||!nav)return;
 const $=id=>document.getElementById(id);
 const main=[
  {id:'academic',label:'📊 Genel Bakış'},
  {id:'students',label:'👥 Öğrenci Takibi'},
  {id:'money',label:'🗓️ Ders ve Muhasebe'},
  {id:'settings',label:'⚙️ Ayarlar'}
 ];
 const settingItems=[
  {id:'groups',label:'🏫 Grup İşlemleri'},
  {id:'teachers',label:'👩‍🏫 Öğretmenler ve Anahtarlar'},
  {id:'update',label:'⚙️ Düzenle'}
 ];
 const map={
  'Yönetim · Aylık Ders ve Ücret Çizelgesi':'money',
  'Akademik Planlama · 24 Ünite + 2 Sınav Hazırlığı':'academic',
  'Öğrenci Takibi · Devamsızlık ve Ödev':'students',
  'CRM CSV Karşılaştırması · İsteğe Bağlı':'students',
  'Yeni Öğretmen Ekle':'teachers',
  'Yeni Grup Aç ve Programını Belirle':'groups',
  'Mevcut Grup Bilgilerini Düzenle':'update',
  'Grup Eksiklerini Tamamla':'update',
  'Öğrenci Kayıt İşlemleri':'groups',
  'Öğretmen Hesapları ve Anahtar Arşivi':'teachers',
  'Kolay Parola Yönetimi':'teachers',
  'Giriş Anahtarı Yönetimi':'teachers',
  'Grup Durumu ve Son İşlenen Konular':'academic'
 };
 let current='academic',settingsTab='groups',section='academic';
 for(const child of [...area.children]){
  if(child.classList.contains('section')){
   const title=child.querySelector('h2')?.textContent?.trim();
   if(map[title])section=map[title];
  }
  if(child.id==='adminNav'||child.id==='aydaAdminHealth'||child.classList.contains('adminQuick'))continue;
  child.dataset.adminTab=section;
 }
 const sub=document.createElement('nav');sub.id='adminSettingsNav';sub.className='admin-settings-nav';
 sub.setAttribute('aria-label','Yönetim ayarları');
 nav.insertAdjacentElement('afterend',sub);
 const label=document.createElement('div');label.className='admin-settings-intro';label.textContent='Hesap, grup ve parola işlemleri günlük takibin dışında tutulur.';
 sub.append(label);
 function btn(id,name,parent,isSettings){
  const b=document.createElement('button');b.type='button';b.textContent=name;b.dataset.target=id;
  b.setAttribute('aria-pressed','false');
  b.addEventListener('click',()=>isSettings?select('settings',id):select(id));
  parent.append(b);return b;
 }
 for(const x of main)btn(x.id,x.label,nav,false);
 for(const x of settingItems)btn(x.id,x.label,sub,true);
 function select(tab,subTab){
  const isDirectSettings=settingItems.some(x=>x.id===tab);
  if(isDirectSettings){subTab=tab;tab='settings';}
  current=main.some(x=>x.id===tab)?tab:'academic';
  if(settingItems.some(x=>x.id===subTab))settingsTab=subTab;
  sub.hidden=current!=='settings';
  for(const child of area.querySelectorAll(':scope > [data-admin-tab]')){
   child.hidden=child.dataset.adminTab!==(current==='settings'?settingsTab:current);
  }
  for(const b of nav.querySelectorAll(':scope > button')){
   const active=b.dataset.target===current;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));
  }
  for(const b of sub.querySelectorAll('button')){
   const active=b.dataset.target===settingsTab;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));
  }
  try{
   sessionStorage.setItem('aydaAdminTab',current);
   sessionStorage.setItem('aydaAdminSettingsTab',settingsTab);
  }catch{}
 }
 const oldTab=sessionStorage.getItem('aydaAdminTab')||'academic';
 const oldSetting=sessionStorage.getItem('aydaAdminSettingsTab')||'groups';
 select(oldTab,oldSetting);
 const hash=()=>String(location.hash||'').replace(/^#/,'').toLocaleLowerCase('tr-TR');
 function applyHash(){
  if(!document.body.classList.contains('ayda-is-admin'))return;
  if(['ayarlar','settings'].includes(hash()))select('settings');
  else if(['grup-islemleri','gruplar'].includes(hash()))select('settings','groups');
  else if(['ogretmenler','hesaplar'].includes(hash()))select('settings','teachers');
  else if(['duzenle'].includes(hash()))select('settings','update');
 }
 window.addEventListener('hashchange',applyHash);
 window.addEventListener('ayda:login',applyHash);
 window.AYDA_ADMIN_MENU={open:(tab,subTab)=>select(tab,subTab)};
})();