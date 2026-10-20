/* AYDA | Archive navigation, no API or storage writes. */
(()=>{'use strict';
 const el=(tag,cls,text)=>{const x=document.createElement(tag);if(cls)x.className=cls;if(text!==undefined)x.textContent=text;return x;};
 const owner=document.body.classList.contains('ayda-manager');
 const get=(id)=>document.getElementById(id);
 const addLink=(parent,id,label,href,first)=>{
  if(!parent||get(id))return;
  const a=el('a','ayda-archive-shortcut',label);a.id=id;a.href=href;
  if(first)parent.prepend(a);else parent.append(a);
  return a;
 };
 const href='./grup-arsivi.html';
 if(owner){
  const parent=document.querySelector('#ownerApp .owner-heading .owner-controls');
  addLink(parent,'aydaOwnerArchiveEntry','▤ Grup Arşivi',href,true);
 }else{
  const hero=document.querySelector('#app>.hero');
  const quick=document.querySelector('#adminArea>.adminQuick');
  const rail=document.getElementById('aydaTeacherRail');
  addLink(hero,'aydaTeacherArchiveEntry','▤ Grupların arşivini aç ↗',href);
  addLink(quick,'aydaAdminArchiveEntry','▤ Grup Arşivi ve Raporlar ↗',href);
  addLink(rail,'aydaTeacherArchiveRail','▤ Grup Arşivi ↗',href);
  const statusForm=get('aydaFixStatusForm');
  if(statusForm){
   const notice=el('div','ayda-group-close-note');
   const title=el('strong','','Grubu tamamlamadan önce akademik arşivini indirin.');
   const explanation=el('span','','Mevcut Google API, grup kapandıktan sonra bazı öğrenci yoklama/ödev ayrıntılarını artık göstermiyor. Yalnızca mevcut kayıtlardan arşiv dosyası alınabilir.');
   const link=el('a','ayda-group-archive-link','Seçili grubun arşivini aç ↗');
   const picker=get('aydaFixStatusGroup');
   const syncLink=()=>{link.href='./grup-arsivi.html?group='+encodeURIComponent(picker?.value||'');};
   syncLink();picker?.addEventListener('change',syncLink);
   notice.append(title,explanation,link);statusForm.prepend(notice);
  }
  const sync=()=>{
   const authorized=typeof data!=='undefined'&&data?.user&&['admin','teacher'].includes(data.user.role);
   for(const id of ['aydaTeacherArchiveEntry','aydaAdminArchiveEntry','aydaTeacherArchiveRail']){
    const x=get(id);if(x)x.hidden=!authorized;
   }
  };
  window.addEventListener('ayda:login',sync);
  window.addEventListener('ayda:logout',sync);
  window.addEventListener('ayda:admin-data-updated',sync);
  sync();
 }
 const links=document.querySelector('#aydaMobileSheet .ayda-ux-sheet-links');
 const mobile=addLink(links,'aydaArchiveMobileMenu','▤ Grup Arşivi ↗',href);
 if(mobile){
  mobile.classList.add('ayda-mobile-archive-link');
  if(!owner){
   const sync=()=>{mobile.hidden=!(typeof data!=='undefined'&&data?.user&&['admin','teacher'].includes(data.user.role));};
   window.addEventListener('ayda:login',sync);window.addEventListener('ayda:logout',sync);sync();
  }
 }
})();