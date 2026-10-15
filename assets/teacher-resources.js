"use strict";
/* AYDA teaching resources: internal operational shortcuts, never promotions. */
(()=>{
 const groups=document.getElementById('groups');
 if(!groups)return;
 const root=document.createElement('details');
 root.id='teacherResources';
 root.className='ayda-staff-resources hidden';
 root.setAttribute('aria-label','Öğretmen kaynakları');
 const summary=document.createElement('summary');
 summary.textContent='Öğretmen kaynakları';
 const intro=document.createElement('p');
 intro.className='ayda-resource-lead';
 intro.textContent='Ders anlatımı, tekrar ve sınav çalışması için mevcut AYDA içerikleri. Kaynak sayfalarının kendi erişim kuralları değişmez.';
 const grid=document.createElement('div');
 grid.className='ayda-resource-grid';
 root.append(summary,intro,grid);
 groups.insertAdjacentElement('afterend',root);
 const all=Object.freeze([
  {id:'a1',title:'A1 ders tekrarları',description:'A1 grubunda konu ve ödev takibi',url:'https://www.aydadil.com/a1ayda/',level:'A1'},
  {id:'a2',title:'A2 ders tekrarları',description:'A2 grubu için tekrar ve pratik',url:'https://www.aydadil.com/a2ayda/',level:'A2'},
  {id:'b1',title:'B1 ders tekrarları',description:'B1 seviyesi için ders materyali',url:'https://www.aydadil.com/b1ayda/',level:'B1'},
  {id:'library',title:'Dijital kütüphane',description:'Materyaller ve ek kaynaklar',url:'https://www.aydadil.com/bibliothek/'},
  {id:'exam',title:'Sınav hazırlık kaynakları',description:'telc / ÖSD / Goethe çalışmalarında kullanım',url:'https://www.aydadil.com/sinavhazirlik/'},
  {id:'portal',title:'Ders kayıtları portalı',description:'Derslerin tekrar kayıtları ve sınıf içerikleri',url:'https://kurs.aydadil.com/'}
 ]);
 function render(){
  const current=(typeof data!=='undefined'&&data&&data.user)?data.user:null;
  const teacher=current?.role==='teacher';
  document.body.classList.toggle('ayda-session-active',Boolean(current));
  document.body.dataset.aydaRole=current?.role||'';
  const skip=document.getElementById('aydaSkip');if(skip){skip.href=current?'#app':'#login';skip.textContent=current?'Ana içeriğe geç':'Giriş bölümüne geç';}
  root.classList.toggle('hidden',!teacher);
  if(!teacher){grid.replaceChildren();root.open=false;return;}
  const levels=new Set((data.groups||[]).filter(g=>g.status==='Aktif').map(g=>String(g.level||'').toUpperCase()));
  const applicable=all.filter(r=>!r.level||levels.has(r.level));
  grid.replaceChildren();
  for(const item of applicable){
   const link=document.createElement('a');
   link.className='ayda-resource-link';
   link.href=item.url;
   link.target='_blank';
   link.rel='noopener noreferrer';
   const h=document.createElement('strong');
   h.textContent=item.title+' ↗';
   const desc=document.createElement('span');
   desc.textContent=item.description;
   link.append(h,desc);
   grid.append(link);
  }
 }
 window.addEventListener('ayda:login',render);
 window.addEventListener('ayda:logout',render);
 render();
})();