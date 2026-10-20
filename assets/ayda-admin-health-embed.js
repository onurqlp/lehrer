/* Shared Admin System Health: render the already-working monitoring view, not a second implementation. */
(()=>{'use strict';
 const frame=document.getElementById('aydaAdminHealthFrame'),status=document.getElementById('aydaAdminHealthFrameStatus');
 if(!frame)return;
 let loaded=false;
 const isAdmin=()=>typeof data!=='undefined'&&data?.user?.role==='admin';
 function openAdminTab(section,focus){
  const tab=section==='accounts'?'teachers':section==='schedule'?'groups':section==='alerts'?'messages':section;
  window.AYDA_ADMIN_MENU?.open(tab);
  if(focus)requestAnimationFrame(()=>document.getElementById(focus)?.scrollIntoView({behavior:'smooth',block:'center'}));
 }
 // The academic health view is read-only. Editing always takes place in this Admin document.
 window.addEventListener('message',event=>{
  if(event.origin!==location.origin||event.source!==frame.contentWindow||!isAdmin())return;
  const request=event.data;
  if(!request||request.aydaHealthEmbed!==1)return;
  if(request.action==='fix'){
   const ctx=request.context||{};
   const allowed=['teacher','schedule','status','count','student','account'];
   if(allowed.includes(ctx.fix))window.AYDA_HEALTH_EDITORS?.open(ctx);
  }else if(request.action==='tab'){
   openAdminTab(request.tab||'health',request.focus||'');
  }else if(request.action==='compose'){
   openAdminTab('messages');
   window.dispatchEvent(new CustomEvent('ayda:compose-teacher',{detail:request.context||{}}));
  }
 });
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
 window.AYDA_ADMIN_HEALTH={refresh(){if(!loaded){show();return;}const u=new URL(frame.dataset.src,location.href);u.searchParams.set('r',Date.now().toString());frame.src=u.href;}};
 if(typeof data!=='undefined'&&data?.user?.role==='admin'&&window.AYDA_ADMIN_MENU?.active?.()==='health')show();
})();