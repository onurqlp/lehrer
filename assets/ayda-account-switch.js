/* AYDA 4.5: admin session switching */
(()=>{
 const owner=document.body.classList.contains('ayda-manager');
 const add=(parent,title,href)=>{
  if(!parent)return;
  const a=document.createElement('a');a.className='outline';a.textContent=title;a.href=href;parent.prepend(a);
 };
 if(owner){
  const adminPanelLink=document.createElement('a');adminPanelLink.className='outline ayda-admin-only';adminPanelLink.textContent='Admin Paneli ↗';adminPanelLink.href='./index.html#ayarlar';document.querySelector('.owner-controls')?.prepend(adminPanelLink);
  const bridge=()=>window.AYDA_OWNER_BRIDGE;
  const cards=document.getElementById('ownerTeacherCards');
  const panel=document.getElementById('owner-teachers');
  if(cards&&panel){
   const label=document.createElement('label');label.textContent='Öğretmen hesabını incele';
   const select=document.createElement('select');select.setAttribute('aria-label','Öğretmen hesabı');label.append(select);
   panel.insertBefore(label,cards);
   const sync=()=>{
    const teachers=bridge()?.overview?.()?.teachers||[],chosen=select.value;
    select.replaceChildren(new Option('Tüm öğretmenler',''));
    teachers.forEach(t=>select.add(new Option(t.name||t.id,t.id)));
    if(teachers.some(t=>t.id===chosen))select.value=chosen;
    for(const c of cards.children)c.hidden=!!select.value&&!c.textContent.includes('Öğretmen ID: '+select.value+' ·');
   };
   select.addEventListener('change',()=>{sync();bridge()?.openTab?.('teachers');});
   document.getElementById('ownerTeacherMonth')?.addEventListener('change',()=>queueMicrotask(sync));
   window.addEventListener('ayda:owner-ready',sync);
  }
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