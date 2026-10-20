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
    if(backupStatus.url){const link=make('a','','Son doğrulanmış yedeği Drive’da aç ↗');link.href=backupStatus.url;link.target='_blank';link.rel='noopener noreferrer';result.append(link);}
    if(backupStatus.error)result.append(make('p','','Son yedekleme uyarısı: '+backupStatus.error));
   }else{
    result.append(make('p','','Otomatik yedekleme doğrulanamadı. Önce günlük yedeklemeyi kurun.'));
   }
  }catch(e){
   state.textContent='Google kayıt kontrol servisi henüz hazır değil.';
   result.append(make('p','','Google Apps Script bağlantısı veya izinleri kontrol edilmeli. '+String(e.message||e)));
  }finally{change(false);}
 }
 check.addEventListener('click',showHealth);
 backup.addEventListener('click',async()=>{
  change(true);state.textContent='Google Drive yedeği oluşturuluyor; bu işlem bir dakikadan uzun sürebilir…';result.replaceChildren();
  const detail=(msg)=>result.append(make('p','',msg));
  try{
   // İkinci tıklamada tamamlanmış günlük kurulumu gereksiz yere tekrar başlatma.
   const current=await call('backupStatus').catch(()=>null);
   if(current?.installed&&current?.exists){
    state.textContent='Günlük otomatik yedekleme zaten kurulu.';
    detail('Son yedek: '+(current.at||'Tarihi bilinmiyor'));
    if(current.error)detail('Son kayıtlı Google uyarısı: '+current.error);
    return;
   }
   const response=await call('backupSetup');
   if(!response?.ok||!response?.verified||!response?.daily)throw Error('Google yanıtında doğrulanmış yedek veya günlük tetikleyici bilgisi eksik.');
   state.textContent='Tam yedek doğrulandı; günlük otomatik yedekleme kuruldu.';
   detail('İlk yedek: '+(response.at||'—')+' · Kontrol edilen sekme: '+(response.sheets??'—'));
  }catch(error){
   // JSONP zaman aşımında işlem sunucuda sürebilir; tekrar kopya oluşturmadan sorgula.
   let verification=null,checkError='';
   try{verification=await call('backupStatus');}catch(e){checkError=String(e?.message||e);}
   if(verification?.installed&&verification?.exists){
    state.textContent='Günlük yedekleme etkin. Yedek, Google üzerinden doğrulandı.';
    detail('Son yedek: '+(verification.at||'—'));
    if(verification.error)detail('Google uyarısı: '+verification.error);
   }else{
    state.textContent='Yedekleme henüz doğrulanamadı.';
    detail('Google hata ayrıntısı: '+String(error?.message||error));
    if(verification){
     detail('Günlük tetikleyici: '+(verification.installed?'Kurulu':'Kurulu değil')+' · Drive yedeği: '+(verification.exists?'Mevcut':'Doğrulanamadı'));
     if(verification.error)detail('Son Google yedekleme hatası: '+verification.error);
    }
    if(checkError)detail('Durum kontrolü hatası: '+checkError);
    const msg=String(error?.message||error)+' '+checkError+' '+(verification?.error||'');
    if(/permission|authorization|authorize|access denied|insufficient|yetki|izin/i.test(msg))detail('Google Apps Script düzenleyicisinde aydaBackupYetkilendir işlevini çalıştırıp Drive ve tetikleyici izinlerini onaylayın.');
    else if(/zaman aşımı|timeout|timed out|yanıt vermedi/i.test(msg))detail('Google işlemi sürüyor olabilir. 1–2 dakika sonra Kayıt bütünlüğünü kontrol et düğmesiyle yedek durumunu yeniden sorgulayın; tekrar kurulum başlatmayın.');
    else detail('Bu ayrıntıyı paylaşın; hata kaynağına göre Google tarafını düzeltebiliriz.');
   }
  }finally{change(false);}
 });
 window.addEventListener('ayda:owner-ready',()=>{state.textContent='Kayıt sağlığını incelemek için açıp kontrol et.';result.replaceChildren();});
 window.addEventListener('ayda:owner-logout',()=>{state.textContent='Yönetici girişi gerekli.';result.replaceChildren();card.open=false;});
})();