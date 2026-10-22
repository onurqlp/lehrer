/* AYDA V4.4 — Yönetici için sessiz ve isteğe bağlı veri sağlığı kontrolleri. */
(()=>{
 'use strict';
 const host=document.getElementById('owner-health');
 if(!host||document.getElementById('aydaDataControl'))return;
 const make=(tag,cls,value)=>{
  const e=document.createElement(tag);if(cls)e.className=cls;
  if(value!==undefined)e.textContent=value;
  return e;
 };
 const card=make('details','card');card.id='aydaDataControl';
 const summary=make('summary','','Beta veritabanı bütünlüğü ve kopya durumu');
 const state=make('p','muted','Henüz kontrol edilmedi.');
 state.setAttribute('role','status');state.setAttribute('aria-live','polite');
 const actions=make('div','actions');
 const check=make('button','ayda-inline-btn','Kayıt bütünlüğünü kontrol et');
 const backup=make('button','ayda-inline-btn','İsteğe bağlı beta kopyası al');
 check.type='button';backup.type='button';
 actions.append(check,backup);
 const details=make('p','tiny','Kontrol ve kopya alma yalnızca yöneticiye açıktır. Beta kayıtları ayrı Neon veritabanındadır; bu ortamda zamanlanmış yedekleme yoktur.');
 const result=make('div','muted');
 card.append(summary,state,details,actions,result);
 const target=document.getElementById('ownerHealthIssues');
 if(target)target.insertAdjacentElement('beforebegin',card);else host.prepend(card);
 const bridge=()=>window.AYDA_OWNER_BRIDGE;
 const refreshPermissions=()=>{backup.hidden=true;details.textContent='Akademik kayıt bütünlüğü ve son yedekleme durumu salt okunur. Yedekleme kurulumu yalnızca Admin Panelinde yapılır.';};
 window.addEventListener('ayda:owner-role',refreshPermissions);
 window.addEventListener('ayda:owner-logout',refreshPermissions);
 refreshPermissions();
 const change=(busy)=>{check.disabled=busy;backup.disabled=busy;};
 async function call(action){
  const b=bridge();if(!b?.ready?.())throw Error('Yönetici oturumu gerekli.');
  return b.api(action);
 }
 async function showHealth(){
  change(true);state.textContent='Kayıtlar karşılaştırılıyor…';result.replaceChildren();
  try{
   const [integrity,backupStatus]=await Promise.all([call('integrityStatus'),call('backupStatus')]);
   const healthy=integrity?.ok===true;
   state.textContent=healthy?'Kayıt bütünlüğü: kontrol başarılı.':'Kayıt bütünlüğü: kontrol gerektiriyor.';
   const counts=integrity?.counts||{};
   result.append(make('p','',Object.entries(counts).map(([k,v])=>k+': '+v).join(' · ')));
   for(const issue of integrity?.issues||[])result.append(make('p','',issue));
   if(backupStatus?.provider==='Neon beta'){
    result.append(make('p','',backupStatus.exists?'İsteğe bağlı kopya mevcut · Son kopya: '+(backupStatus.at||'bilinmiyor'):'Henüz beta kopyası alınmadı.'));
    result.append(make('p','',backupStatus.error||'Otomatik zamanlanmış yedekleme yok.'));
   }else if(backupStatus?.installed&&backupStatus?.exists){
    result.append(make('p','','Günlük yedek açık · Son yedek: '+(backupStatus.at||'bilinmiyor')));
    if(backupStatus.url){const link=make('a','','Son doğrulanmış yedeği aç ↗');link.href=backupStatus.url;link.target='_blank';link.rel='noopener noreferrer';result.append(link);}
    if(backupStatus.error)result.append(make('p','','Son yedekleme uyarısı: '+backupStatus.error));
   }else{
    result.append(make('p','','Otomatik yedekleme doğrulanamadı. Önce günlük yedeklemeyi kurun.'));
   }
  }catch(e){
   state.textContent='Beta kayıt kontrol servisi yanıt vermedi.';
   result.append(make('p','','Beta Vercel API ve veritabanı bağlantısını kontrol edin. '+String(e.message||e)));
  }finally{change(false);}
 }
 check.addEventListener('click',showHealth);
 backup.addEventListener('click',async()=>{
  change(true);state.textContent='Neon beta veritabanının doğrulanmış kopyası alınıyor…';result.replaceChildren();
  const detail=(msg)=>result.append(make('p','',msg));
  try{
   const current=await call('backupStatus').catch(()=>null);
   const response=await call('backupSetup');
   if(!response?.ok||!response?.verified||response?.provider!=='Neon beta')throw Error('Beta veritabanı kopyası doğrulanamadı.');
   state.textContent='Beta veritabanı kopyası doğrulandı.';
   detail('İlk yedek: '+(response.at||'—')+' · Kontrol edilen sekme: '+(response.sheets??'—'));
   detail('Bu kopya isteğe bağlıdır; otomatik zamanlanmış yedekleme yoktur.');
  }catch(error){
   // JSONP zaman aşımında işlem sunucuda sürebilir; tekrar kopya oluşturmadan sorgula.
   let verification=null,checkError='';
   try{verification=await call('backupStatus');}catch(e){checkError=String(e?.message||e);}
   if(verification?.provider==='Neon beta'&&verification?.exists){
    state.textContent='Beta veritabanı kopyası mevcut.';
    detail('Son yedek: '+(verification.at||'—'));
    if(verification.error)detail(verification.error);
   }else{
    state.textContent='Yedekleme henüz doğrulanamadı.';
    detail('Beta yedekleme hatası: '+String(error?.message||error));
    if(verification){
     detail('Beta kopyası: '+(verification.exists?'Mevcut':'Doğrulanamadı'));
     if(verification.error)detail(verification.error);
    }
    if(checkError)detail('Durum kontrolü hatası: '+checkError);
    const msg=String(error?.message||error)+' '+checkError+' '+(verification?.error||'');
    if(/zaman aşımı|timeout|timed out|yanıt vermedi/i.test(msg))detail('Kopya işlemi sürüyor olabilir. Bir dakika sonra beta kopya durumunu yeniden kontrol edin.');
    else detail('Bu hata beta veritabanı kopyasının alınamadığını gösteriyor.');
   }
  }finally{change(false);}
 });
 window.addEventListener('ayda:owner-ready',()=>{state.textContent='Kayıt sağlığını incelemek için açıp kontrol et.';result.replaceChildren();});
 window.addEventListener('ayda:owner-logout',()=>{state.textContent='Yönetici girişi gerekli.';result.replaceChildren();card.open=false;});
})();
