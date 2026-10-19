/* AYDA V4.4 — Yönetici için sessiz ve isteğe bağlı veri sağlığı kontrolleri. */
(()=>{
 'use strict';
 const host=document.getElementById('owner-overview');
 if(!host||document.getElementById('aydaDataControl'))return;
 const make=(tag,cls,value)=>{
  const e=document.createElement(tag);if(cls)e.className=cls;
  if(value!==undefined)e.textContent=value;
  return e;
 };
 const card=make('details','card');card.id='aydaDataControl';
 const summary=make('summary','','Kayıt güvenliği ve yedekleme');
 const state=make('p','muted','Henüz kontrol edilmedi.');
 state.setAttribute('role','status');state.setAttribute('aria-live','polite');
 const actions=make('div','actions');
 const check=make('button','ayda-inline-btn','Kayıt bütünlüğünü kontrol et');
 const backup=make('button','ayda-inline-btn','Günlük yedeklemeyi kur');
 check.type='button';backup.type='button';
 actions.append(check,backup);
 const details=make('p','tiny','Kontrol yalnızca yöneticiye açıktır. Testler canlı kayıtları değiştirmez. Yedekleme ayrı bir Drive kopyası oluşturur.');
 const result=make('div','muted');
 card.append(summary,state,details,actions,result);
 const target=document.getElementById('ownerHighlights');
 if(target)target.insertAdjacentElement('beforebegin',card);else host.prepend(card);
 const bridge=()=>window.AYDA_OWNER_BRIDGE;
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
   if(backupStatus?.installed&&backupStatus?.exists){
    result.append(make('p','','Günlük Drive yedeği açık · Son yedek: '+(backupStatus.at||'bilinmiyor')));
    if(backupStatus.error)result.append(make('p','','Son yedekleme uyarısı: '+backupStatus.error));
   }else{
    result.append(make('p','','Otomatik yedekleme doğrulanamadı. Önce günlük yedeklemeyi kurun.'));
   }
  }catch(e){
   state.textContent='Google kayıt kontrol servisi henüz hazır değil.';
   result.append(make('p','','Güncel Apps Script V4.4 yayımlanana kadar bu kontrol çalışmaz. '+String(e.message||e)));
  }finally{change(false);}
 }
 check.addEventListener('click',showHealth);
 backup.addEventListener('click',async()=>{
  change(true);state.textContent='Doğrulanmış Drive yedeği oluşturuluyor…';result.replaceChildren();
  try{
   const response=await call('backupSetup');
   if(!response?.ok||!response?.verified||!response?.daily)throw Error('Yedekleme doğrulanmadı.');
   state.textContent='Tam yedek doğrulandı; günlük otomatik yedekleme kuruldu.';
   result.append(make('p','','İlk yedek: '+response.at+' · Kontrol edilen tablo: '+response.sheets));
   await showHealth();
  }catch(e){
   state.textContent='Yedekleme kurulamadı; işlem yapılmadan önce Google sürümünü kontrol edin.';
   result.append(make('p','',String(e.message||e)));
  }finally{change(false);}
 });
 window.addEventListener('ayda:owner-ready',()=>{state.textContent='Kayıt sağlığını incelemek için açıp kontrol et.';result.replaceChildren();});
 window.addEventListener('ayda:owner-logout',()=>{state.textContent='Yönetici girişi gerekli.';result.replaceChildren();card.open=false;});
})();