/* Shared Admin System Health: render the already-working monitoring view, not a second implementation. */
(()=>{'use strict';
 const frame=document.getElementById('aydaAdminHealthFrame'),status=document.getElementById('aydaAdminHealthFrameStatus');
 if(!frame)return;
 let loaded=false,clock=0;
 function show(){
  if(typeof data==='undefined'||data?.user?.role!=='admin')return;
  const url=new URL(frame.dataset.src,location.href);
  if(!loaded){frame.src=url.href;loaded=true;status.textContent='Akademik Sistem Sağlığı yükleniyor…';}
  else{
   try{frame.contentWindow?.AYDA_OWNER_BRIDGE?.openTab?.('health');}catch(_){}
  }
 }
 frame.addEventListener('load',()=>{
  if(!frame.src||frame.src==='about:blank')return;
  status.textContent='';
  try{frame.contentWindow?.AYDA_OWNER_BRIDGE?.openTab?.('health');}catch(_){}
 });
 document.getElementById('aydaAdminHealth')?.addEventListener('click',e=>{
  const btn=e.target.closest('[data-fix-tab]');if(!btn)return;
  window.AYDA_ADMIN_MENU?.open(btn.dataset.fixTab);
  document.getElementById('adminNav')?.scrollIntoView({block:'start',behavior:'smooth'});
 });
 window.addEventListener('ayda:health-open',show);
 window.addEventListener('ayda:login',()=>{if(window.AYDA_ADMIN_MENU?.active?.()==='health')show()});
 window.addEventListener('ayda:logout',()=>{frame.src='about:blank';loaded=false;status.textContent='Yönetici girişi gerekli.';});
 window.AYDA_ADMIN_HEALTH={refresh(){if(!loaded){show();return;}frame.src=frame.dataset.src+'&r='+Date.now();}};
 if(typeof data!=='undefined'&&data?.user?.role==='admin'&&window.AYDA_ADMIN_MENU?.active?.()==='health')show();
})();