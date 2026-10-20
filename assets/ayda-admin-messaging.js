/* AYDA Admin — shared teacher/student WhatsApp composer and feedback editor. */
(()=>{'use strict';
 const root=document.getElementById('owner-messages');if(!root)return;
 let currentReminders=null,currentTracking=null;
 const isReady=()=>typeof data!=='undefined'&&data?.user?.role==='admin'&&typeof jsonp==='function';
 window.AYDA_OWNER_BRIDGE={
  ready:isReady,canManage:isReady,isViewer:()=>false,
  api:(action,payload={})=>{if(!isReady())return Promise.reject(Error('Yönetici oturumu gerekli.'));return jsonp(action,payload);},
  overview:()=>isReady()?data:null,
  reminders:()=>currentReminders,tracking:()=>currentTracking,
  openTab:tab=>window.AYDA_ADMIN_MENU?.open(tab==='messages'?'messages':tab)
 };
 let sequence=0;
 async function refresh(){
  if(!isReady())return;
  const request=++sequence;
  const [reminders,tracking]=await Promise.allSettled([jsonp('reminders'),jsonp('trackingSummary')]);
  if(request!==sequence)return;
  currentReminders=reminders.status==='fulfilled'?reminders.value:null;
  currentTracking=tracking.status==='fulfilled'?tracking.value:null;
  window.dispatchEvent(new Event('ayda:owner-ready'));
 }
 window.addEventListener('ayda:login',refresh);
 window.addEventListener('ayda:messages-open',()=>{if(isReady()&&!currentReminders)refresh()});
 window.addEventListener('ayda:admin-data-updated',refresh);
 window.addEventListener('ayda:logout',()=>{sequence++;currentReminders=null;currentTracking=null;window.dispatchEvent(new Event('ayda:owner-logout'))});
 if(isReady())refresh();
})();