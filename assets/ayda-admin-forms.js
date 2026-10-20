/* AYDA · Formlar, mevcut admin oturumundan yönetilir. */
(()=>{'use strict';
 const root=document.getElementById('aydaAdminForms'),frame=document.getElementById('aydaFormResponses');
 if(!root||!frame)return;
 const ready=()=>typeof data!=='undefined'&&data?.user?.role==='admin';
 function load(reload=false){
  if(!ready())return;
  if(!frame.getAttribute('src')||reload){
   const url=new URL(frame.dataset.src,location.href);
   if(reload)url.searchParams.set('v',Date.now().toString());
   frame.src=url.href;
  }
 }
 window.addEventListener('ayda:forms-open',()=>load());
 window.addEventListener('ayda:login',()=>{if(window.AYDA_ADMIN_MENU?.active?.()==='forms')load()});
 window.addEventListener('ayda:logout',()=>frame.removeAttribute('src'));
 document.getElementById('aydaFormsReload')?.addEventListener('click',()=>load(true));
 if(ready()&&window.AYDA_ADMIN_MENU?.active?.()==='forms')load();
})();