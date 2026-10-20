/* AYDA | İki yönetici ekranında aynı Sistem Sağlığı uyarıları. Salt okunur. */
(()=>{'use strict';
const root=document.getElementById('aydaAdminHealthIssues');if(!root)return;
if(new URLSearchParams(location.search).get('aydaEmbed')==='1')return;
const make=(tag,text)=>{const x=document.createElement(tag);if(text!==undefined)x.textContent=String(text);return x;};
const names=/(?:^|\s)(?:ödendi|ödenmedi|taksit(?:ler)?|borç|bakiye|ödeme|peşin|hesap|öğrenci|toplamı|danışmanlık|abisi|oğlu|kızı|eltden|elt|cncler|multimanustan|imam|ark|ağustos|agustos|ank|elazığ|yeni|hanım|bey|müsdavdan|yaseminden)(?=\s|$)/iu;
function issueName(s){const p=String(s||'').trim().split(/\s+/).filter(Boolean);return p.length<2||/[0-9?!@]/.test(s)||names.test(s)||p.length>4;}
function add(title,detail,href,label){
 const c=make('div');c.className='ayda-shared-health-item';
 const a=make('strong',title),b=make('small',detail),link=make('a',label||'Düzenle →');
 link.href=href;c.append(a,b,link);root.append(c);return c;
}
const link=(fix,groupId,studentId)=>{
 const u=new URL('./index.html',location.href);u.searchParams.set('aydaFix',fix);
 if(groupId)u.searchParams.set('groupId',groupId);
 if(studentId)u.searchParams.set('studentId',studentId);
 u.hash=fix==='student'?'grup-islemleri':'duzenle';return u.href;
};
const manager=tab=>'#'+(tab==='messages'||tab==='alerts'?'mesajlar':tab==='health'?'saglik':tab==='accounts'?'ogretmenler':'gruplar');
let requestId=0;
async function update(){
 if(typeof data==='undefined'||data?.user?.role!=='admin')return;
 const ticket=++requestId;
 const initialGroups=data.groups||[];
 root.replaceChildren(make('p','Sistem Sağlığı açık · '+initialGroups.filter(g=>g.status==='Aktif').length+' aktif grup kontrol ediliyor. Ayrıntılı uyarılar yükleniyor…'));
 const current=data,groups=current.groups||[],schedule=current.schedule||[],teachers=current.teachers||[];
 const active=groups.filter(g=>g.status==='Aktif'),activeIds=new Set(active.map(g=>g.id));
 // Temel grup/öğretmen kontrollerini Google ayrıntı sorgularını bekletmeden göster.
 const requests=[
  Promise.resolve().then(()=>jsonp('trackingSummary')),
  Promise.resolve().then(()=>jsonp('reminders')),
  Promise.resolve().then(()=>jsonp('contactDirectory'))
 ];
 const withLimit=(promise)=>Promise.race([promise,new Promise((_,reject)=>setTimeout(()=>reject(Error('Google yanıtı gecikti')),16000))]);
 const [tResult,rResult,cResult]=await Promise.allSettled(requests.map(withLimit));
 if(ticket!==requestId||typeof data==='undefined'||data?.user?.role!=='admin')return;
 const tracking=tResult.status==='fulfilled'?tResult.value:null;
 const reminders=rResult.status==='fulfilled'?rResult.value:null;
 const contacts=cResult.status==='fulfilled'?cResult.value:null;
 root.replaceChildren();
 const teacherIds=new Set(teachers.map(t=>t.id)),activeTeachers=new Set(teachers.filter(t=>t.status==='Aktif').map(t=>t.id));
 const roster=new Map((tracking?.groups||[]).map(g=>[g.id,g]));
 for(const g of active){
  if(!g.teacherId||!teacherIds.has(g.teacherId))add(g.name+' · Öğretmen atanmadı','Sınıfa yetkili öğretmen atanmalı.',link('teacher',g.id),'Öğretmen ata →');
  else if(!activeTeachers.has(g.teacherId))add(g.name+' · Öğretmen hesabı pasif','Hesabı etkinleştirin ya da grup öğretmenini değiştirin.','#ogretmenler','Hesabı incele →');
  const plans=schedule.filter(r=>r.groupId===g.id);
  if(!plans.length)add(g.name+' · Haftalık program yok','Grubun ders günleri ve saatleri belirtilmemiş.',link('schedule',g.id),'Programı oluştur →');
  else if(plans.some(p=>p.status!=='Aktif'||!p.start||!/^([01]\d|2[0-3]):[0-5]\d$/.test(String(p.end||''))))
   add(g.name+' · Ders saati eksik','Ders başlangıç/bitiş saatlerini tamamlayın.',link('schedule',g.id),'Ders saatlerini düzenle →');
  if(!Number(g.students))add(g.name+' · Öğrenci sayısı sıfır','Sınıf öğrenci listesini kontrol edin.',link('student',g.id),'Öğrenci ekle →');
  const actual=roster.get(g.id)?.students;
  if(actual!==undefined&&Number(actual)!==Number(g.students))
   add(g.name+' · Öğrenci sayıları uyuşmuyor','Grup: '+g.students+' · Öğrenci listesi: '+actual,link('count',g.id),'Grup sayısını düzelt →');
  if(g.end&&g.end<'2026-10-20')add(g.name+' · Eski grup aktif','Geçmiş kayıtları silmeden grubu tamamlayın.',link('status',g.id),'Grubu tamamlandı yap →');
 }
 const count=new Map();for(const t of teachers)count.set(t.id,(count.get(t.id)||0)+1);
 for(const [id,n] of count)if(id&&n>1)add('Aynı öğretmen ID birden fazla hesapta','Öğretmen '+id+' · '+n+' hesap. Kimlik eşleşmelerini inceleyin.','#ogretmenler','Hesapları incele →');
 for(const t of teachers.filter(t=>t.status==='Aktif'&&!groups.some(g=>g.teacherId===t.id)))
  add(t.name+' · Sınıf eşleşmesi yok','Özel ders öğretmeniyse bu uyarı normal olabilir.',link('teacher',''),'Öğretmen ata →');
 for(const row of schedule)if(row.status==='Aktif'&&!groups.some(g=>g.id===row.groupId))
  add('Program · Tanımsız grup','Grup: '+row.groupId,'#gruplar','Programı incele →');
 for(const student of (tracking?.students||[]).filter(x=>activeIds.has(x.groupId)&&x.riskLevel==='danger'&&x.followupStatus!=='Çözüldü')){
  const group=groups.find(x=>x.id===student.groupId);
  const card=add('Öncelikli öğrenci · '+student.name,
   (group?.name||student.groupId)+' · Gelmedi: '+(student.absent||0)+' · Ödev eksik: '+(student.homeworkMissing||0),
   './index.html#ogrenciler','Öğrenciyi incele →');
  const actions=document.createElement('div');actions.className='ayda-health-followup-actions';
  for(const status of ['Takipte','Çözüldü']){
   const button=make('button',status);button.type='button';button.className='outline';
   button.addEventListener('click',async()=>{
    if(button.disabled||!confirm(student.name+' öğrencisinin takip durumunu "'+status+'" olarak kaydedelim mi?'))return;
    button.disabled=true;button.textContent='Kaydediliyor…';
    try{
     const response=await jsonp('setFollowup',{payload:utf8Base64Url(JSON.stringify({studentId:student.id,status}))});
     if(!response?.saved)throw Error('Google kayıt onayı alınamadı.');
     window.dispatchEvent(new Event('ayda:admin-data-updated'));
    }catch(error){button.textContent='Hata: '+error.message;button.disabled=false;}
   });actions.append(button);
  }
  card.append(actions);
 }
  for(const student of tracking?.students||[]){
  if(!activeIds.has(student.groupId)||!student.id||!issueName(student.name))continue;
  add('Öğrenci adı · '+student.name,'Ad-soyad alanında eksik isim veya CRM notu var.',link('student',student.groupId,student.id),'Öğrenci adını düzelt →');
 }
 for(const item of (reminders?.items||[]).filter(r=>String(r.date||'')>='2026-10-20'))
  add((item.type==='attendance'?'Eksik yoklama':'Eksik ders raporu')+' · '+(item.group||'Grup'),item.date+' tarihli kayıt tamamlanmalı.',manager('alerts'),'Öğretmene hatırlat →');
 if(contacts?.missingStudentPhones)
  add('Öğrenci telefon bilgileri eksik',contacts.missingStudentPhones+' öğrenci için telefon doğrulaması gerekiyor.',manager('messages'),'Telefonları düzenle →');
 if(!tracking)add('Öğrenci takip verileri alınamadı','Bağlantıyı kontrol etmek için ayrıntılı panele geçin.',manager('health'),'Kontrol ekranını aç →');
 if(!reminders)add('Eksik rapor kontrolü yanıt vermedi','Google bağlantısını veya son Apps Script dağıtımını inceleyin.',manager('health'),'Kontrol ekranını aç →');
 if(!root.children.length)root.append(make('p','Kontrol edilen alanlarda sorun bulunmadı.'));
 const issueCount=root.querySelectorAll('.ayda-shared-health-item').length;
 const link=document.getElementById('aydaAdminHealthShow');
 if(link)link.textContent=issueCount?'Tüm '+issueCount+' uyarıyı incele →':'Sistem Sağlığını aç →';
 const tab=document.querySelector('#adminNav button[data-target="health"]');
 if(tab)tab.textContent=issueCount?'✚ Sistem Sağlığı · '+issueCount:'✚ Sistem Sağlığı';
}
// Sağlık sekmesi her zaman ulaşılabilir; geciken servisler için yeniden kontrol sun.
window.AYDA_ADMIN_HEALTH={refresh:update};
window.addEventListener('ayda:health-open',update);
window.addEventListener('ayda:login',update);
window.addEventListener('ayda:logout',()=>{requestId++;root.replaceChildren(make('p','Yönetici girişi gerekli.'));});
window.addEventListener('ayda:admin-data-updated',update);
if(typeof data!=='undefined'&&data?.user?.role==='admin')update();
})();