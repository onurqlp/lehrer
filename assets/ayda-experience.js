/* AYDA Experience 2.0 — navigation only; preserves all existing handlers. */
(()=>{
 'use strict';
 const qs=(selector,root=document)=>root.querySelector(selector);
 const el=(tag,cls,text)=>{const node=document.createElement(tag);if(cls)node.className=cls;if(text!==undefined)node.textContent=text;return node;};
 const isOwner=document.body.classList.contains('ayda-manager');
 const host=document.getElementById(isOwner?'ownerApp':'app');
 if(!host||document.getElementById('aydaMobileDock'))return;
 const destinations=isOwner?[
  ['overview','Genel Bakış','⌂'],['students','Öğrenciler','♙'],['groups','Gruplar','▦'],['messages','Mesajlar','✉']
 ]:[
  ['todayLessons','Bugün','⌂'],['daily','Ders Kaydı','＋'],['groups','Gruplar','▦'],['schedule','Program','◷']
 ];
 const full=isOwner?[
  ['overview','Genel Bakış'],['students','Öğrenciler'],['attendance','Yoklama ve Ödev'],['groups','Gruplar'],['lessons','Ders Kayıtları'],['teachers','Öğretmenler ve Saat'],['schedule','Ders Programı'],['alerts','Uyarılar'],['messages','Mesaj Merkezi'],['accounts','Hesaplar']
 ]:[
  ['todayLessons','Ana Sayfa'],['daily','Ders Kaydı ve Yoklama'],['groups','Gruplarım'],['schedule','Ders Programı'],['history','Ders Geçmişim'],['aydaTeacherFeedback','Öneri ve Sorun Bildirimi'],['selfPassword','Parolamı Değiştir']
 ];
 if(!isOwner){
  const rail=el('aside','ayda-teacher-rail');rail.id='aydaTeacherRail';rail.setAttribute('aria-label','Öğretmen hızlı erişim');
  for(const [target,label] of full){if(target==='selfPassword')continue;const link=el('a','ayda-rail-link',label);link.href='#'+target;rail.append(link);}
  host.append(rail);
  const history=qs('#history'),password=qs('.self-password-section'),schedule=qs('#schedule');
  if(password&&!password.id)password.id='selfPassword';
  if(schedule&&!schedule.id)schedule.id='schedule';
  if(history&&!history.id)history.id='history';
 }
 const dock=el('nav','ayda-ux-dock');dock.id='aydaMobileDock';dock.setAttribute('aria-label','Mobil hızlı menü');
 const shade=el('div','ayda-ux-shade');shade.id='aydaMobileShade';shade.setAttribute('aria-hidden','true');
 const sheet=el('section','ayda-ux-sheet');sheet.id='aydaMobileSheet';sheet.setAttribute('role','dialog');sheet.setAttribute('aria-modal','true');sheet.setAttribute('aria-label','Tüm bölümler');sheet.setAttribute('aria-hidden','true');sheet.setAttribute('tabindex','-1');
 const head=el('div','ayda-ux-sheet-head'),heading=el('h2','', 'Tüm bölümler'),close=el('button','','×');close.type='button';close.setAttribute('aria-label','Menüyü kapat');head.append(heading,close);sheet.append(head);
 const links=el('div','ayda-ux-sheet-links');sheet.append(links);
 let previousFocus=null,current=isOwner?'overview':'todayLessons';
 function closeSheet(){document.body.classList.remove('ayda-ux-sheet-open');sheet.setAttribute('aria-hidden','true');if(previousFocus?.isConnected)previousFocus.focus({preventScroll:true});}
 function openSheet(){previousFocus=document.activeElement;document.body.classList.add('ayda-ux-sheet-open');sheet.setAttribute('aria-hidden','false');close.focus({preventScroll:true});}
 function updateActive(key){current=key;for(const b of dock.querySelectorAll('button[data-ux-target]')){const active=b.dataset.uxTarget===key;b.classList.toggle('active',active);if(active)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');}
  const menuButton=dock.querySelector('[data-ux-more]');if(menuButton)menuButton.classList.toggle('active',!destinations.some(x=>x[0]===key));
  for(const b of links.querySelectorAll('[data-ux-target]'))b.classList.toggle('active',b.dataset.uxTarget===key);
  for(const a of document.querySelectorAll('#aydaTeacherRail .ayda-rail-link'))a.classList.toggle('active',a.hash==='#'+key);
 }
 function go(key){
  closeSheet();
  if(isOwner){const native=qs('#ownerNav button[data-tab="'+key+'"]');if(native){native.click();updateActive(key);const title=qs('.owner-heading');if(title)title.scrollIntoView({behavior:'smooth',block:'start'});}return;}
  if(window.AYDA_TEACHER_VIEWS?.open?.(key)){updateActive(key);return;}
  const target=document.getElementById(key);if(!target)return;
  if(target.classList.contains('hidden')||target.hidden)return;
  updateActive(key);target.scrollIntoView({behavior:'smooth',block:'start'});
  if(window.history?.replaceState)window.history.replaceState(null,'','#'+key);
 }
 for(const [target,label,glyph] of destinations){const b=el('button','',label),g=el('span','ux-glyph',glyph),s=el('span','',label);b.textContent='';b.append(g,s);b.type='button';b.dataset.uxTarget=target;b.addEventListener('click',()=>go(target));dock.append(b);}
 const more=el('button','','Menü');more.type='button';more.dataset.uxMore='true';const icon=el('span','ux-glyph','☰'),word=el('span','','Menü');more.textContent='';more.append(icon,word);more.setAttribute('aria-label','Tüm bölümleri aç');more.setAttribute('aria-controls','aydaMobileSheet');more.addEventListener('click',openSheet);dock.append(more);
 for(const [target,label] of full){const b=el('button','',label);b.type='button';b.dataset.uxTarget=target;b.addEventListener('click',()=>go(target));links.append(b);}
 if(!isOwner){const manager=el('button','','Yönetici kontrol merkezi ↗');manager.type='button';manager.hidden=true;manager.addEventListener('click',()=>{location.href='./yonetici.html';});links.append(manager);const sync=()=>{manager.hidden=!(typeof data!=='undefined'&&data?.user?.role==='admin');};window.addEventListener('ayda:login',sync);window.addEventListener('ayda:logout',sync);sync();}
 close.addEventListener('click',closeSheet);shade.addEventListener('click',closeSheet);
 document.addEventListener('keydown',event=>{if(event.key==='Escape'&&document.body.classList.contains('ayda-ux-sheet-open')){event.preventDefault();closeSheet();}});
 document.addEventListener('click',event=>{if(isOwner){const b=event.target.closest('#ownerNav button[data-tab], [data-jump]');if(b){const target=b.dataset.tab||b.dataset.jump;if(target)updateActive(target);}}else{const a=event.target.closest('.ayda-main-nav a[href^="#"], #aydaTeacherRail a[href^="#"]');if(a)updateActive(a.hash.slice(1));}});
 if(isOwner){const native=qs('#ownerNav');if(native&&window.MutationObserver){new MutationObserver(()=>{const active=qs('button.active[data-tab]',native);if(active&&active.dataset.tab!==current)updateActive(active.dataset.tab);}).observe(native,{attributes:true,attributeFilter:['class'],subtree:true});}}
 else if(location.hash){const target=location.hash.slice(1);if(full.some(x=>x[0]===target))current=target;}
 host.append(dock,shade,sheet);updateActive(current);
})();
