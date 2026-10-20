/* AYDA | Birleşik Yönetim Alanı. İki eski ekran aynı pencerede yönetilir. */
(()=>{'use strict';
 const params=new URLSearchParams(location.search);
 const embedded=params.get('aydaEmbed')==='1';
 const owner=document.body.classList.contains('ayda-manager');
 const isAdmin=()=>owner?!!window.AYDA_OWNER_BRIDGE?.ready?.():typeof data!=='undefined'&&data?.user?.role==='admin';
 if(embedded){
  document.body.classList.add('ayda-workspace-embedded');
  // İç panelden diğer yönetici ekranına link verilirse çerçeveyi değiştirmek yerine
  // dıştaki çalışma alanında ilgili sekmeyi aç.
  document.addEventListener('click',event=>{
   const link=event.target.closest('a[href]');if(!link)return;
   let url;try{url=new URL(link.href,location.href)}catch{return;}
   if(url.origin!==location.origin)return;
   const name=url.pathname.split('/').pop();
   if((owner&&name==='index.html')||(!owner&&name==='yonetici.html')){
    event.preventDefault();
    const view=name==='yonetici.html'?'tracking':'admin';
    const context=view==='tracking'?{tab:(url.hash||'#overview').slice(1)}:{hash:(url.hash||'#ayarlar').slice(1)};
    window.parent.postMessage({aydaWorkspace:1,view,context},location.origin);
   }
  });
  return;
 }
 const $=id=>document.getElementById(id);
 let modal=null,frame=null,title=null,closeBtn=null,previousFocus=null,currentView='',previousScroll=0;
 function create(){
  if(modal)return;
  modal=document.createElement('div');modal.id='aydaUnifiedWorkspace';modal.className='ayda-workspace';modal.hidden=true;
  modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');modal.setAttribute('aria-label','AYDA birleşik yönetim');
  const shell=document.createElement('div');shell.className='ayda-workspace-shell';
  const header=document.createElement('header');header.className='ayda-workspace-header';
  const heading=document.createElement('div');heading.className='ayda-workspace-title';
  title=document.createElement('strong');title.textContent='AYDA Yönetim';
  const hint=document.createElement('small');hint.textContent='Aynı oturum · sayfadan ayrılmadan';
  heading.append(title,hint);
  const actions=document.createElement('div');actions.className='ayda-workspace-actions';
  closeBtn=document.createElement('button');closeBtn.type='button';closeBtn.className='ayda-workspace-close';closeBtn.textContent='✕ Kapat';
  closeBtn.addEventListener('click',close);
  actions.append(closeBtn);header.append(heading,actions);
  frame=document.createElement('iframe');frame.className='ayda-workspace-frame';frame.title='AYDA yönetim işlemleri';frame.setAttribute('loading','eager');
  shell.append(header,frame);modal.append(shell);document.body.append(modal);
  modal.addEventListener('click',event=>{if(event.target===modal)close();});
 }
 function close(){
  if(!modal||modal.hidden)return;
  modal.hidden=true;document.body.classList.remove('ayda-workspace-open');
  document.body.style.overflow='';
  frame.src='about:blank';
  currentView='';
  if(previousFocus?.isConnected)previousFocus.focus({preventScroll:true});
  else window.scrollTo({top:previousScroll,behavior:'instant'});
 }
 function show(view,context={}){
  // Yönetici oturumu yokken iframe normal girişini gösterebilir; kullanıcıyı yetkisiz işlemle başlatmayız.
  create();
  const url=new URL(view==='admin'?'./index.html':'./yonetici.html',location.href);
  url.searchParams.set('aydaEmbed','1');
  if(view==='admin'){
   if(context.fix)url.searchParams.set('aydaFix',context.fix);
   if(context.groupId)url.searchParams.set('groupId',context.groupId);
   if(context.teacherId)url.searchParams.set('teacherId',context.teacherId);
   if(context.studentId)url.searchParams.set('studentId',context.studentId);
   url.hash=context.fix==='student'?'grup-islemleri':context.fix==='account'?'ogretmenler':context.fix?'duzenle':(context.hash||'ayarlar');
  }else{
   url.hash=context.tab||'overview';
  }
  previousFocus=modal.hidden?document.activeElement:previousFocus;
  previousScroll=window.scrollY;
  modal.hidden=false;document.body.classList.add('ayda-workspace-open');document.body.style.overflow='hidden';
  title.textContent=view==='admin'?'Yönetim İşlemleri · Düzenle':'Akademik Kontrol · İzleme';
  if(frame.src!==url.href||currentView!==view)frame.src=url.href;
  currentView=view;closeBtn.focus({preventScroll:true});
 }
 // Alt sayfada aynı UI açılmaz; tüm geçişler tek ana panelin penceresinde kalır.
 function openAdmin(context={}){
  if(!owner&&isAdmin()){
   close();
   if(context.fix&&window.AYDA_HEALTH_EDITORS?.open){window.AYDA_HEALTH_EDITORS.open(context);return;}
   const tab=(context.hash||'ayarlar').replace(/^#/,'');
   const sub=['ogretmenler','hesaplar'].includes(tab)?'teachers':tab==='duzenle'?'update':'groups';
   window.AYDA_ADMIN_MENU?.open('settings',sub);
   document.getElementById('adminArea')?.scrollIntoView({behavior:'smooth',block:'start'});
   return;
  }
  show('admin',context);
 }
 function openTracking(context={}){
  if(owner&&isAdmin()){
   close();
   window.AYDA_OWNER_BRIDGE?.openTab?.(context.tab||'overview');
   document.getElementById('ownerApp')?.scrollIntoView({behavior:'smooth',block:'start'});
   return;
  }
  show('tracking',context);
 }
 window.AYDA_UNIFIED_WORKSPACE={
  openAdmin,openTracking,close,
  isOpen(){return Boolean(modal&&!modal.hidden);}
 };
 const toolbar=owner?document.querySelector('.owner-controls'):document.querySelector('.ayda-admin-priority-links');
 if(owner&&toolbar){
  const btn=document.createElement('button');btn.id='aydaWorkspaceAdminBtn';btn.type='button';btn.className='outline ayda-workspace-entry';btn.textContent='✎ Yönetim İşlemleri';
  btn.addEventListener('click',()=>show('admin',{hash:'ayarlar'}));
  toolbar.prepend(btn);
 }
 if(!owner&&toolbar){
  const btn=document.createElement('button');btn.id='aydaWorkspaceTrackingBtn';btn.type='button';btn.className='ayda-workspace-entry';btn.textContent='◉ Takip Merkezi';
  btn.addEventListener('click',()=>show('tracking',{tab:'overview'}));
  toolbar.prepend(btn);
 }
 document.addEventListener('click',event=>{
  const anchor=event.target.closest('a[href]');
  if(!anchor)return;
  let url;
  try{url=new URL(anchor.href,location.href)}catch{return;}
  if(url.origin!==location.origin)return;
  const path=url.pathname.split('/').pop();
  if(owner&&path==='index.html'){
   // Yönetici panelinin tüm ayar bağlantıları artık diğer sayfaya gitmez.
   event.preventDefault();show('admin',{hash:(url.hash||'#ayarlar').slice(1)});
  }else if(!owner&&path==='yonetici.html'){
   event.preventDefault();show('tracking',{tab:(url.hash||'#overview').slice(1)});
  }
 });
 document.addEventListener('keydown',event=>{
  if(!modal||modal.hidden)return;
  if(event.key==='Escape'){event.preventDefault();close();}
  else if(event.key==='Tab'&&document.activeElement===closeBtn){event.preventDefault();closeBtn.focus();}
 });
 // Alt sayfa iframe'i yönetildiğinde parent direkt hedef ekranı açar.
 window.addEventListener('message',event=>{
  if(event.origin!==location.origin||event.source!==frame?.contentWindow)return;
  const request=event.data;
  if(!request||request.aydaWorkspace!==1)return;
  if(request.view==='admin')openAdmin(request.context||{});
  else if(request.view==='tracking')openTracking(request.context||{});
  else if(request.view==='close')close();
 });
})();