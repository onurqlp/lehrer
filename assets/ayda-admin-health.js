/* AYDA ortak Sistem Sağlığı — yonetici.html ile aynı kontrol kuralları, Admin içinde düzenleme. */
(()=>{
'use strict';
const root=document.getElementById('aydaAdminHealthIssues');if(!root)return;
const overviewReady=()=>typeof data!=='undefined'&&data?.user?.role==='admin';
const make=(tag,txt)=>{const n=document.createElement(tag);if(txt!==undefined)n.textContent=String(txt);return n;};
const formatDate=value=>{const v=String(value||'');return /^\d{4}-\d\d-\d\d$/.test(v)?v.slice(8)+'.'+v.slice(5,7)+'.'+v.slice(0,4):v;};
let requestId=0,cache={tracking:null,reminders:null,contacts:null},loading=false;
function render(overview,tracking,reminders,contactDirectory){
 root.replaceChildren();
 const tName=id=>overview.teachers?.find(t=>t.id===id)?.name||id||'—';
 const gName=id=>overview.groups?.find(g=>g.id===id)?.name||id||'—';
 const fmt=formatDate;
  const groups=overview.groups||[],teachers=overview.teachers||[],schedule=overview.schedule||[],issues=[];
  const validTeachers=new Set(teachers.map(t=>t.id));
  const activeTeachers=new Set(teachers.filter(t=>t.status==='Aktif').map(t=>t.id));
  const validGroups=new Set(groups.map(g=>g.id));
  const rosterGroups=new Map((tracking?.groups||[]).map(g=>[g.id,g]));
  const action=(label,fix,groupId,more={})=>({label,fix,groupId,...more});
  const panel=(label,tab,focus)=>({label,tab,focus});
  const warn=(title,detail,actions=[])=>issues.push({title,detail,actions});
  for(const g of groups){
   if(g.status!=='Aktif')continue;
   if(!g.teacherId||!validTeachers.has(g.teacherId))
    warn(g.name+' · Öğretmen atanmadı','Öğretmen seçilmeden ders ve yoklama kaydedilemez.',[action('Öğretmen ata →','teacher',g.id)]);
   else if(!activeTeachers.has(g.teacherId))
    warn(g.name+' · Öğretmen hesabı pasif','Öğretmeni veya hesap durumunu kontrol edin: '+tName(g.teacherId),[
     panel('Hesabı etkinleştir →','accounts','aydaTeacherManage'),action('Öğretmen değiştir →','teacher',g.id)
    ]);
   const plans=schedule.filter(r=>r.groupId===g.id);
   if(!plans.length)
    warn(g.name+' · Haftalık program yok','Ders günü ile başlangıç/bitiş saati girilmeli.',[action('Programı oluştur →','schedule',g.id)]);
   else if(plans.some(p=>p.status!=='Aktif'||!p.start||!/^([01]\d|2[0-3]):[0-5]\d$/.test(String(p.end||''))))
    warn(g.name+' · Ders saati eksik','Programdaki başlangıç veya bitiş saatlerini tamamlayın.',[action('Ders saatlerini düzenle →','schedule',g.id)]);
   if(!Number(g.students))
    warn(g.name+' · Öğrenci sayısı sıfır','Sınıf öğrenci listesini kontrol edin.',[action('Öğrenci ekle →','student',g.id)]);
   const actual=rosterGroups.get(g.id)?.students;
   if(Number.isFinite(Number(actual))&&Number(actual)!==Number(g.students))
    warn(g.name+' · Öğrenci sayıları uyuşmuyor','Grup kartı: '+g.students+' / Öğrenci listesi: '+actual+'. Kimlikleri kontrol edin.',[
     action('Grup sayısını düzelt →','count',g.id),action('Öğrencileri düzenle →','student',g.id)
    ]);
   if(g.end&&g.end<'2026-10-20')
    warn(g.name+' · Önceki dönem grubu hâlâ aktif','Kurs tamamlandıysa geçmişe taşıyın; kayıtları silmeyin.',[action('Grubu tamamlandı yap →','status',g.id)]);
  }
  // Sadece bir gruba bağlı öğrenci kayıtları; isim alanındaki CRM notlarını uyarıya çıkar.
  const issueWords=/(?:^|\s)(?:ödendi|ödenmedi|taksit(?:ler)?|borç|bakiye|ödeme|peşin|hesap|öğrenci|toplamı|danışmanlık|abisi|oğlu|kızı|eltden|elt|cncler|multimanustan|imam|ark|ağustos|agustos|ank|elazığ|yeni|hanım|bey|müsdavdan|yaseminden)(?=\s|$)/iu;
  const nameIssue=name=>{
   const parts=String(name||'').trim().split(/\s+/).filter(Boolean);
   if(parts.length<2)return 'Ad ve soyad birlikte yazılmalı.';
   if(/[0-9?!@]/.test(name))return 'İsim içinde sayı veya açıklama işareti var.';
   if(issueWords.test(name))return 'İsim alanında ödeme, yakınlık veya CRM açıklaması bulunuyor.';
   if(parts.length>4)return 'İsim çok uzun; ad-soyad dışı açıklama olabilir.';
   return '';
  };
  for(const student of tracking?.students||[]){
   if(!validGroups.has(student.groupId)||!student.id)continue;
   const reason=nameIssue(student.name);
   if(reason)warn('Öğrenci adı kontrolü · '+student.name,reason+' · '+gName(student.groupId),[action('Öğrenci adını düzelt →','student',student.groupId,{studentId:student.id})]);
  }
  const duplicates=new Map();for(const t of teachers)duplicates.set(t.id,(duplicates.get(t.id)||0)+1);
  for(const [id,count] of duplicates)if(id&&count>1)
   warn('Hesaplarda ortak öğretmen ID','Öğretmen ID: '+id+' · '+count+' hesap aynı gruplara erişebilir; eşleşmeleri doğrulayın.',[panel('Hesapları incele →','accounts','ownerAccountsTable')]);
  for(const t of teachers.filter(t=>t.status==='Aktif'&&!groups.some(g=>g.teacherId===t.id)))
   warn(t.name+' · Sınıf eşleşmesi yok','Özel ders öğretmeniyse bu durum normal olabilir.',[action('Sınıfa öğretmen ata →','teacher','',{teacherId:t.id})]);
  for(const r of schedule)if(r.status==='Aktif'&&!validGroups.has(r.groupId))
   warn('Program · Tanımsız sınıf','Grup ID: '+r.groupId,[panel('Programı incele →','schedule','ownerScheduleList')]);
  for(const row of (reminders?.items||[]).filter(x=>String(x.date||'')>='2026-10-20'))
   warn((row.type==='attendance'?'Eksik yoklama':'Eksik ders raporu')+' · '+(row.group||'Sınıf'),fmt(row.date)+' · '+tName(row.teacherId),[
    {label:'Öğretmene hatırlat →',compose:{teacherId:row.teacherId,groupId:row.groupId,date:row.date,type:row.type}}
   ]);
  if(contactDirectory?.missingStudentPhones)
   warn('Öğrenci iletişim bilgileri eksik',contactDirectory.missingStudentPhones+' öğrencinin kayıtlı veya geçerli telefonu yok.',[panel('Telefonları düzenle →','messages','aydaMsgStudentSearch')]);
  if(!reminders)
   warn('Eksik rapor kontrolü kullanılamıyor','Google Apps Script bağlantısını ve güncel dağıtımı kontrol edin.',[{label:'Verileri yenile →',refresh:true}]);

 const header=document.getElementById('aydaAdminHealthShow');
 if(header)header.textContent=issues.length?'Toplam '+issues.length+' uyarı · İncele →':'Sistem Sağlığı · Tüm kontroller →';
 const btn=document.querySelector('#adminNav [data-target="health"]');
 if(btn)btn.textContent=issues.length?'✚ Sistem Sağlığı · '+issues.length:'✚ Sistem Sağlığı';
 if(!issues.length){root.append(make('p',reminders?'Kontrol edilen alanlarda eksik bilgi yok.':'Temel kontroller tamam. Eksik rapor servisi henüz yanıt vermedi.'));return;}
 for(const item of issues){
  const card=make('article');card.className='ayda-shared-health-item';
  card.append(make('strong',item.title),make('small',item.detail));
  for(const a of item.actions){
   const button=make('button',a.label);button.type='button';button.className='ayda-health-fix-button';
   button.addEventListener('click',()=>{
    if(a.fix){
     window.AYDA_HEALTH_EDITORS?.open({fix:a.fix,groupId:a.groupId||'',studentId:a.studentId||'',teacherId:a.teacherId||''});
    }else if(a.compose){
     window.AYDA_ADMIN_MENU?.open('messages');
     window.dispatchEvent(new CustomEvent('ayda:compose-teacher',{detail:a.compose}));
    }else if(a.refresh){update(true)}
    else if(a.tab){
     const tab=a.tab==='accounts'?'teachers':a.tab==='messages'?'messages':a.tab==='schedule'?'groups':a.tab;
     window.AYDA_ADMIN_MENU?.open(tab);
     const target=document.getElementById(a.focus);
     target?.scrollIntoView({behavior:'smooth',block:'center'});
    }
   });
   card.append(button);
  }
  root.append(card);
 }
}
async function update(force=false){
 if(!overviewReady())return;
 const ticket=++requestId;
 if(!force&&cache.tracking&&cache.reminders){render(data,cache.tracking,cache.reminders,cache.contacts);return}
 root.replaceChildren(make('p','Sistem Sağlığı kontrol ediliyor…'));
 // Temel kontroller yüklenmese bile gösterilmeye devam eder.
 render(data,cache.tracking,cache.reminders,cache.contacts);
 loading=true;
 const read=async action=>{try{return await jsonp(action)}catch{return null}};
 const [tracking,reminders,contacts]=await Promise.all([read('trackingSummary'),read('reminders'),read('contactDirectory')]);
 if(ticket!==requestId||!overviewReady())return;
 cache={tracking,reminders,contacts};loading=false;
 render(data,tracking,reminders,contacts);
}
window.AYDA_ADMIN_HEALTH={refresh:()=>update(true)};
window.addEventListener('ayda:health-open',()=>update(false));
window.addEventListener('ayda:login',()=>update(false));
window.addEventListener('ayda:admin-data-updated',()=>{cache={tracking:null,reminders:null,contacts:null};update(true)});
window.addEventListener('ayda:logout',()=>{requestId++;cache={tracking:null,reminders:null,contacts:null};root.replaceChildren(make('p','Yönetici girişi gerekli.'))});
if(overviewReady())update(false);
})();