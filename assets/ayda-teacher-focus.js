/* AYDA Teacher Focus v3.0: presentation-only screen separation. No API/data changes. */
(()=>{
 'use strict';
 const root=document.getElementById('app');
 if(!root||!document.body.classList.contains('ayda-teacher'))return;
 const $=id=>document.getElementById(id);
 const teacher=()=>typeof data!=='undefined'&&data?.user?.role==='teacher';
 const route={todayLessons:'home',home:'home',aydaTeacherDashboard:'home',daily:'daily',aydaMakeupCenter:'daily',groups:'groups',teacherResources:'groups',teacherTracking:'students',students:'students',schedule:'schedule',history:'history',aydaMonthOverview:'history',selfPassword:'settings',aydaTeacherFeedback:'support'};
 const meta={home:['Ana Sayfa','Günlük izleme, eksik kayıtlar ve aylık ders özetin.'],daily:['Ders Kaydı','Dersini, yoklamanı ve verdiğin ödevi burada kaydet.'],groups:['Gruplarım','Gruplarına ve ders materyallerine ulaş.'],students:['Öğrenciler','Yoklama, ödev ve bireysel takip bu ayrı bölümde.'],schedule:['Haftalık Program','Haftalık ders saatlerin ve sınıfların.'],history:['Ders Geçmişim','Geçmiş ders raporların ve aylık ders durumun.'],settings:['Hesap Ayarlarım','Giriş parolanı bu bölümden değiştirebilirsin.'],support:['Öneri ve Yardım','Sistemle ilgili görüşünü yönetime ilet.']};
 let marked=false;
 const elem=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e;};
 const intro=elem('header','ayda-teacher-view-intro');intro.id='aydaTeacherViewIntro';intro.dataset.aydaPage='subview';
 const crumb=elem('div','ayda-teacher-crumb','ÖĞRETMEN PORTALI');
 const heading=elem('h1','', '');heading.id='aydaTeacherViewTitle';
 const description=elem('p','', '');description.id='aydaTeacherViewDescription';
 const back=elem('button','ayda-teacher-back','← Ana sayfaya dön');back.type='button';back.dataset.aydaNav='home';
 intro.append(crumb,heading,description,back);
 const shortcuts=elem('div','ayda-teacher-home-actions');shortcuts.id='aydaTeacherHomeActions';shortcuts.dataset.aydaPage='home';
 const action1=elem('button','ayda-teacher-primary-action','+ Ders kaydı oluştur');action1.type='button';action1.dataset.aydaNav='daily';action1.id='aydaPrimaryLessonAction';
 const action2=elem('button','ayda-teacher-secondary-action','Haftalık programım →');action2.type='button';action2.dataset.aydaNav='schedule';
 shortcuts.append(action1,action2);
 const hero=root.querySelector('.hero');if(hero){hero.insertAdjacentElement('afterend',shortcuts);shortcuts.insertAdjacentElement('afterend',intro);}
 const getPage=node=>{
  if(node===intro)return 'subview';
  if(node===shortcuts||node===hero||node.id==='todayLessons')return 'home';
  if(node.classList.contains('stats'))return 'unused';
  if(node.id&&route[node.id])return route[node.id];
  if(node.id==='aydaAutomation'||node.id==='aydaShareBacklog'||node.id==='aydaSharePendingNotice')return 'daily';
  if(node.classList.contains('self-password-section'))return 'settings';
  if(node.classList.contains('section')){
   if(node.querySelector('#groupTitle'))return 'groups';
   const txt=node.querySelector('h2')?.textContent||'';
   if(txt.includes('Bugünkü Ders'))return 'home';
   if(txt.includes('Haftalık Ders'))return 'schedule';
   if(txt.includes('Geçmiş Ders'))return 'history';
  }
  return 'daily';
 };
 const chrome=new Set(['globalMessage','adminArea','aydaTeacherRail','aydaMobileDock','aydaMobileShade','aydaMobileSheet']);
 function mark(){
  for(const node of [...root.children]){
   if(chrome.has(node.id))continue;
   node.dataset.aydaPage=getPage(node);
  }
  marked=true;
 }
 function selected(page){
  const canonical={home:'todayLessons',daily:'daily',groups:'groups',students:'teacherTracking',schedule:'schedule',history:'history',settings:'selfPassword',support:'aydaTeacherFeedback'}[page];
  for(const btn of document.querySelectorAll('#aydaMobileDock [data-ux-target],#aydaMobileSheet [data-ux-target]')){
   const active=route[btn.dataset.uxTarget]===page;btn.classList.toggle('active',active);
   if(active)btn.setAttribute('aria-current','page');else btn.removeAttribute('aria-current');
  }
  for(const link of document.querySelectorAll('#aydaTeacherRail .ayda-rail-link,.ayda-main-nav a[href^="#"]')){
   const active=route[link.hash.slice(1)]===page;link.classList.toggle('active',active);
   if(active)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');
  }
  const more=document.querySelector('#aydaMobileDock [data-ux-more]');
  if(more)more.classList.toggle('active',!['home','daily','groups','students'].includes(page));
  if(canonical&&window.history?.replaceState)window.history.replaceState(null,'','#'+canonical);
 }
 function open(target,options={}){
  if(!teacher())return false;
  const page=route[target];if(!page||!meta[page])return false;
  if(!marked)mark();
  document.body.dataset.aydaTeacherView=page;
  for(const node of root.querySelectorAll(':scope > [data-ayda-page]'))node.dataset.aydaActive=(node.dataset.aydaPage===page||node===intro&&page!=='home')?'true':'false';
  heading.textContent=meta[page][0];description.textContent=meta[page][1];
  if(page==='support'){$('aydaTeacherFeedback')&&( $('aydaTeacherFeedback').open=true );}
  selected(page);
  document.body.classList.remove('ayda-ux-sheet-open');
  const sheet=$('aydaMobileSheet');if(sheet)sheet.setAttribute('aria-hidden','true');
  if(!options.preserveScroll){
   const offset=root.getBoundingClientRect().top+window.scrollY-92;
   window.scrollTo({top:Math.max(0,offset),behavior:'instant'});
  }
  window.dispatchEvent(new CustomEvent('ayda:teacher-page-open',{detail:{page}}));
  return true;
 }
 window.AYDA_TEACHER_VIEWS={open};
 document.addEventListener('click',event=>{
  if(!teacher())return;
  const button=event.target.closest('[data-ayda-nav]');
  if(button){event.preventDefault();if(button.id==='aydaPrimaryLessonAction'&&$('daily')?.classList.contains('ayda-lesson-saved'))$('aydaNewLesson')?.click();open(button.dataset.aydaNav);return;}
  const anchor=event.target.closest('a[href^="#"]');
  if(anchor&&route[anchor.hash.slice(1)]){event.preventDefault();open(anchor.hash.slice(1));}
 });
 window.addEventListener('hashchange',()=>{if(teacher()&&route[location.hash.slice(1)])open(location.hash.slice(1));});
 window.addEventListener('ayda:login',()=>{
  if(!teacher()){delete document.body.dataset.aydaTeacherView;return;}
  mark();open(location.hash.slice(1)||'home');
 });
 window.addEventListener('ayda:logout',()=>{delete document.body.dataset.aydaTeacherView;for(const node of root.querySelectorAll(':scope > [data-ayda-page]'))node.removeAttribute('data-ayda-active');});
 if(teacher()){mark();open(location.hash.slice(1)||'home');}
})();