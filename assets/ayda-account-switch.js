/* AYDA 4.5: admin session switching */
(()=>{
 const owner=document.body.classList.contains('ayda-manager');
 const add=(parent,title,href)=>{
  if(!parent)return;
  const a=document.createElement('a');a.className='outline';a.textContent=title;a.href=href;parent.prepend(a);
 };
 if(owner){
  add(document.querySelector('.owner-controls'),'Öğretmen paneli ↗','./index.html#todayLessons');
 }else{
  const header=document.querySelector('header .wrap')||document.querySelector('header');
  const link=document.createElement('a');
  link.textContent='Yönetim ↗';link.href='./yonetici.html#overview';
  link.className='ayda-switch-admin';link.hidden=true;header?.append(link);
  const refresh=()=>{link.hidden=!(typeof data!=='undefined'&&data?.user?.role==='admin');};
  window.addEventListener('ayda:login',refresh);
  window.addEventListener('ayda:logout',refresh);
  refresh();
 }
})();