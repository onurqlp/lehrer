/** AYDA Akademik Takip API — Google Sheets / GitHub Pages */
const AYDA_DB_ID = '1Zf4w6FYBTR8u2pOUwjXKVvqQ1JFy0cufjA4fvchKJAw';
const AYDA_TZ = 'Europe/Istanbul';
// Sıfırdan başlayan sistem için eski dersleri eksik kayda dahil etme.
const AYDA_TRACKING_START = '2026-10-19';

function aydaDb_(){ return SpreadsheetApp.openById(AYDA_DB_ID); }
function aydaSheet_(name){ const s=aydaDb_().getSheetByName(name); if(!s) throw Error('Tablo bulunamadı: '+name); return s; }
function aydaRead_(name){ const v=aydaSheet_(name).getDataRange().getDisplayValues(); const h=(v.shift()||[]).map(x=>String(x).trim()); return v.filter(r=>r.some(Boolean)).map(r=>Object.fromEntries(h.map((k,i)=>[k,r[i]]).filter(x=>x[0]))); }
function aydaHash_(s){ return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,String(s),Utilities.Charset.UTF_8).map(b=>('0'+(b&255).toString(16)).slice(-2)).join(''); }
function aydaToday_(){return Utilities.formatDate(new Date(),AYDA_TZ,'yyyy-MM-dd');}
function aydaDate_(v){let s=String(v||'').trim(); let m=s.match(/^(\d{1,2})[./](\d{1,2})[./](\d{4})$/); if(m)return m[3]+'-'+m[2].padStart(2,'0')+'-'+m[1].padStart(2,'0'); return /^\d{4}-\d{2}-\d{2}$/.test(s)?s:'';}
function aydaWeekday_(s){const [y,m,d]=s.split('-').map(Number);return ['Pazar','Pazartesi','Salı','Çarşamba','Perşembe','Cuma','Cumartesi'][new Date(Date.UTC(y,m-1,d)).getUTCDay()];}
function aydaValidateDate_(s){if(!/^\d{4}-\d{2}-\d{2}$/.test(s))return false;const [y,m,d]=s.split('-').map(Number);const t=new Date(Date.UTC(y,m-1,d));return t.getUTCFullYear()===y&&t.getUTCMonth()===m-1&&t.getUTCDate()===d;}
function aydaAuth_(key){
  const token=String(key||'');if(!token||token.length>150)throw Error('Parola veya giriş anahtarı eksik veya geçersiz.');
  const hash=aydaHash_(token),props=PropertiesService.getScriptProperties();
  if(props.getProperty('AYDA_ADMIN_HASH')===hash)return {role:'admin',id:'ADMIN',name:'Yönetici'};
  const u=aydaRead_('KULLANICILAR').find(x=>x['Rol']==='Öğretmen'&&x['Durum']==='Aktif'&&props.getProperty('AYDA_GIRIS_'+x['Kullanıcı ID'])===hash);
  if(!u)throw Error('Parola veya giriş anahtarı geçersiz ya da hesap pasif.');
  return {role:'teacher',id:u['Öğretmen ID'],accountId:u['Kullanıcı ID'],name:u['Kullanıcı Adı']};
}
function aydaGroups_(user){return aydaRead_('GRUPLAR').filter(g=>user.role==='admin'||(g['Öğretmen ID']===user.id&&g['Durum']==='Aktif')).map(g=>({id:g['ID'],name:g['Grup'],level:g['Seviye'],teacherId:g['Öğretmen ID'],start:aydaDate_(g['Başlangıç']),end:aydaDate_(g['Planlanan Bitiş']),students:g['Öğrenci'],completed:Number(g['Son Tamamlanan Ünite'])||0,total:Number(g['Toplam Ünite'])||0,status:g['Durum'],whatsapp:String(g['WhatsApp']||'').trim()}));}
function aydaSchedule_(groups){const ids=new Set(groups.map(g=>g.id)),map=Object.fromEntries(groups.map(g=>[g.id,g]));return aydaRead_('HAFTALIK_PROGRAM').filter(p=>ids.has(p['Grup ID'])&&(p['Durum']==='Aktif'||p['Durum']==='Eksik saat')).map(p=>({groupId:p['Grup ID'],group:map[p['Grup ID']].name,day:p['Gün'],start:p['Başlangıç'],end:p['Bitiş']||'Belirtilmemiş',status:p['Durum']}));}
function aydaHistory_(user,groups){const ids=new Set(groups.map(g=>g.id));return aydaRead_('DERS_KAYITLARI').filter(r=>ids.has(r['Grup ID'])&&(user.role==='admin'||r['Öğretmen ID']===user.id)).map(r=>({id:r['Kayıt ID'],date:aydaDate_(r['Tarih']),groupId:r['Grup ID'],teacherId:r['Öğretmen ID'],plannedStart:r['Planlanan Başlangıç'],plannedEnd:r['Planlanan Bitiş'],actual:r['Gerçekleşen Ders Saati'],status:r['Durum'],unit:r['İşlenen Ünite'],completed:r['Tamamlanan Ünite'],topic:r['İşlenen Konu'],note:r['Öğretmen Notu']})).sort((a,b)=>b.date.localeCompare(a.date));}
function aydaPrivateSheet_(){const db=aydaDb_();let s=db.getSheetByName('AYDA_OZEL_DERS_CIZELGESI');if(!s){s=db.insertSheet('AYDA_OZEL_DERS_CIZELGESI');s.appendRow(['Kayıt ID','Tarih','Öğretmen ID','Öğrenci','Gerçekleşen Ders Saati','Durum','İşlenen Ünite','Tamamlanan Ünite','İşlenen Konu','Öğretmen Notu','Kayıt Zamanı']);}return s;}
function aydaPrivateHistory_(user){const s=aydaDb_().getSheetByName('AYDA_OZEL_DERS_CIZELGESI');if(!s||s.getLastRow()<2)return [];const v=s.getDataRange().getDisplayValues(),h=v.shift().map(String);return v.filter(r=>user.role==='admin'||r[h.indexOf('Öğretmen ID')]===user.id).map(r=>{const x=Object.fromEntries(h.map((k,i)=>[k,r[i]]));return {id:x['Kayıt ID'],date:aydaDate_(x['Tarih']),teacherId:x['Öğretmen ID'],student:x['Öğrenci'],groupId:'',actual:x['Gerçekleşen Ders Saati'],status:x['Durum'],unit:x['İşlenen Ünite'],completed:x['Tamamlanan Ünite'],topic:x['İşlenen Konu'],note:x['Öğretmen Notu']};}).sort((a,b)=>b.date.localeCompare(a.date));}
function aydaPrivateSave_(user,p){if(user.role!=='teacher')throw Error('Özel ders kaydı için öğretmen girişi gerekir.');const date=String(p.date||''),student=String(p.student||'').trim(),topic=String(p.topic||'').trim(),note=String(p.note||'').trim(),actual=String(p.actual||''),status=String(p.status||'İşlendi');if(!aydaValidateDate_(date)||date>aydaToday_())throw Error('Geçersiz tarih.');if(!student||student.length>120||topic.length>300||note.length<3||note.length>2000)throw Error('Öğrenci adı veya not geçersiz.');if(!/^(?:00:30|0[1-5]:(?:00|30)|06:00)$/.test(actual))throw Error('Özel ders süresi 30 dakika ile 6 saat arasında, 30 dakikalık aralıklarla olmalı.');if(!['İşlendi','İptal','Ertelendi'].includes(status))throw Error('Geçersiz durum.');const unit=Number(p.unit||0),completed=Number(p.completed||0);if(!Number.isInteger(unit)||unit<0||unit>100||!Number.isInteger(completed)||completed<0||completed>unit)throw Error('Ünite bilgisi geçersiz.');const lock=LockService.getScriptLock();lock.waitLock(20000);try{const s=aydaPrivateSheet_();const v=s.getDataRange().getDisplayValues();if(v.slice(1).some(r=>aydaDate_(r[1])===date&&r[2]===user.id&&r[3]===student))throw Error('Bu öğrenci için aynı gün kayıt var.');const id='OD-'+Utilities.getUuid();s.appendRow([id,date,user.id,student,actual,status,unit,completed,topic,note,new Date()]);return {saved:true,id};}finally{lock.releaseLock();}}
function aydaTeachers_(){
 const users=aydaRead_('KULLANICILAR').filter(x=>x['Rol']==='Öğretmen');
 return users.map(u=>({id:u['Öğretmen ID'],userId:u['Kullanıcı ID'],name:u['Kullanıcı Adı'],status:u['Durum']}));
}
function aydaNextId_(sheet,header,prefix){const rows=aydaRead_(sheet),max=rows.reduce((n,r)=>Math.max(n,Number(String(r[header]||'').replace(/[^0-9]/g,''))||0),0);return prefix+String(max+1).padStart(3,'0');}
function aydaAppendNamed_(sheet,values){const sh=aydaSheet_(sheet),head=sh.getRange(1,1,1,sh.getLastColumn()).getDisplayValues()[0].map(x=>String(x).trim());sh.appendRow(head.map(h=>Object.prototype.hasOwnProperty.call(values,h)?values[h]:''));}
/** Giriş anahtarları mevcut akademik veritabanından AYRI, özel bir Drive tablosunda tutulur. */
function aydaVaultSheet_(){
 const props=PropertiesService.getScriptProperties();let id=props.getProperty('AYDA_VAULT_SPREADSHEET_ID');let book;
 if(id){book=SpreadsheetApp.openById(id);}else{
   book=SpreadsheetApp.create('AYDA - GIZLI HESAP VE GIRIS ANAHTARLARI');
   props.setProperty('AYDA_VAULT_SPREADSHEET_ID',book.getId());
 }
 let sh=book.getSheetByName('ANAHTARLAR');if(!sh){sh=book.getSheets()[0];sh.setName('ANAHTARLAR');}
 if(sh.getLastRow()===0)sh.appendRow(['Hesap ID','Rol','Ad Soyad','Giriş Anahtarı','Oluşturma Zamanı','Durum']);
 sh.setFrozenRows(1);return sh;
}
function aydaVaultSave_(target,role,name,key){
 const sh=aydaVaultSheet_(),last=sh.getLastRow();
 if(last>1){const ids=sh.getRange(2,1,last-1,1).getDisplayValues();
   ids.forEach((r,i)=>{if(r[0]===target)sh.getRange(i+2,6).setValue('Eski / geçersiz');});}
 sh.appendRow([target,role,name,key,new Date(),'Güncel']);
}
function aydaVaultRows_(user){
 if(user.role!=='admin')throw Error('Yönetici yetkisi gerekir.');
 const id=PropertiesService.getScriptProperties().getProperty('AYDA_VAULT_SPREADSHEET_ID');if(!id)return [];
 const sh=SpreadsheetApp.openById(id).getSheetByName('ANAHTARLAR');if(!sh||sh.getLastRow()<2)return [];
 return sh.getRange(2,1,sh.getLastRow()-1,6).getDisplayValues().map(r=>({accountId:r[0],role:r[1],name:r[2],key:r[3],created:r[4],status:r[5]}));
}
function aydaVaultStatus_(user){
 if(user.role!=='admin')return [];
 const rows=aydaVaultRows_(user).filter(r=>r.status==='Güncel');
 return rows.map(({accountId,role,name,created})=>({accountId,role,name,created}));
}
function aydaAdminCreateTeacher_(user,p){
 if(user.role!=='admin')throw Error('Yönetici yetkisi gerekir.');
 const name=String(p.name||'').trim();if(name.length<3||name.length>100)throw Error('Öğretmen adı 3–100 karakter olmalı.');
 const lock=LockService.getScriptLock();lock.waitLock(20000);
 try{
 const teacherId=aydaNextId_('OGRETMENLER','Öğretmen ID','H'),userId=aydaNextId_('KULLANICILAR','Kullanıcı ID','U');
 const ts=aydaSheet_('OGRETMENLER'),th=ts.getRange(1,1,1,ts.getLastColumn()).getDisplayValues()[0];
 const rec={};for(const k of th){if(/^(Öğretmen ID|ID)$/.test(k))rec[k]=teacherId;else if(/^(Öğretmen|Ad Soyad|Ad|Öğretmen Adı)$/.test(k))rec[k]=name;else if(k==='Durum')rec[k]='Aktif';}
 if(!Object.values(rec).includes(teacherId))throw Error('OGRETMENLER tablosunda öğretmen ID başlığı bulunamadı.');
 ts.appendRow(th.map(k=>rec[k]||''));
 aydaAppendNamed_('KULLANICILAR',{'Kullanıcı ID':userId,'Kullanıcı Adı':name,'Öğretmen ID':teacherId,'Rol':'Öğretmen','Durum':'Aktif'});
 const key=[Utilities.getUuid(),Utilities.getUuid()].join('-');aydaVaultSave_(userId,'Öğretmen',name,key);PropertiesService.getScriptProperties().setProperty('AYDA_GIRIS_'+userId,aydaHash_(key));
 return {teacherId,userId,key,name};
 }finally{lock.releaseLock();}
}
function aydaAdminCreateGroup_(user,p){
 if(user.role!=='admin')throw Error('Yönetici yetkisi gerekir.');
 const name=String(p.name||'').trim(),level=String(p.level||'').trim(),teacherId=String(p.teacherId||'').trim(),start=String(p.start||'').trim();
 const students=Number(p.students||0),total=Number(p.total||24),completed=Number(p.completed||0);
 if(name.length<2||name.length>100||!['A1','A2','B1','B2','C1','C2'].includes(level)||!aydaValidateDate_(start))throw Error('Grup adı, seviye veya başlangıç tarihi geçersiz.');
 if(!Number.isInteger(students)||students<0||students>500||!Number.isInteger(total)||total<1||total>100||!Number.isInteger(completed)||completed<0||completed>total)throw Error('Öğrenci veya ünite sayısı geçersiz.');
 if(!aydaTeachers_().some(t=>t.id===teacherId&&t.status==='Aktif'))throw Error('Aktif öğretmen seçin.');
 const days=Array.isArray(p.days)?p.days:[],dayNames=['Pazartesi','Salı','Çarşamba','Perşembe','Cuma','Cumartesi','Pazar'];
 if(!days.length||days.some(d=>!dayNames.includes(d))||new Set(days).size!==days.length)throw Error('En az bir ders günü seçin.');
 const time=String(p.time||'').trim(),end=String(p.end||'').trim();if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)||!/^([01]\d|2[0-3]):[0-5]\d$/.test(end)||end<=time)throw Error('Başlangıç ve bitiş saatlerini kontrol edin.');
 const lock=LockService.getScriptLock();lock.waitLock(20000);
 try{
  const groupSheet=aydaSheet_('GRUPLAR'),planSheet=aydaSheet_('HAFTALIK_PROGRAM');
  const gh=groupSheet.getRange(1,1,1,groupSheet.getLastColumn()).getDisplayValues()[0].map(String);
  const ph=planSheet.getRange(1,1,1,planSheet.getLastColumn()).getDisplayValues()[0].map(String);
  for(const key of ['ID','Grup','Öğretmen ID','Durum'])if(!gh.includes(key))throw Error('Grup sütunu eksik: '+key);
  for(const key of ['Grup ID','Gün','Başlangıç','Bitiş','Durum'])if(!ph.includes(key))throw Error('Program sütunu eksik: '+key);
  const beforeGroup=groupSheet.getLastRow(),beforePlan=planSheet.getLastRow(),id=aydaNextId_('GRUPLAR','ID','G');
  try{
   aydaAppendNamed_('GRUPLAR',{'ID':id,'Grup':name,'Seviye':level,'Öğretmen ID':teacherId,'Başlangıç':start,'Planlanan Bitiş':'','Öğrenci':students,'Son Tamamlanan Ünite':completed,'Toplam Ünite':total,'Durum':'Aktif','WhatsApp':''});
   for(const day of days)aydaAppendNamed_('HAFTALIK_PROGRAM',{'Grup ID':id,'Gün':day,'Başlangıç':time,'Bitiş':end,'Durum':'Aktif'});
   SpreadsheetApp.flush();
   if(groupSheet.getLastRow()!==beforeGroup+1||planSheet.getLastRow()!==beforePlan+days.length)throw Error('Grup/program satır sayıları tutarsız.');
   return {id,name};
  }catch(e){
   let rollbackFailed=false;
   for(const item of [{sheet:planSheet,before:beforePlan},{sheet:groupSheet,before:beforeGroup}]){
    try{const count=item.sheet.getLastRow()-item.before;if(count>0)item.sheet.deleteRows(item.before+1,count);}catch(err){rollbackFailed=true;Logger.log('AYDA grup rollback: '+err.message);}
   }
   throw Error(rollbackFailed?'Grup kaydı yarım kaldı; yönetici kontrolü gerekiyor.':'Grup kaydı geri alındı: '+e.message);
  }
 }finally{lock.releaseLock();}
}
function aydaAdminSetGroup_(user,p){
 if(user.role!=='admin')throw Error('Yönetici yetkisi gerekir.');
 const id=String(p.id||''),completed=Number(p.completed),students=Number(p.students);
  const wantsWhatsapp=Object.prototype.hasOwnProperty.call(p,'whatsapp'),whatsapp=String(p.whatsapp||'').trim();
  if(wantsWhatsapp&&whatsapp&&!/^https:\/\/(chat\.whatsapp\.com\/[A-Za-z0-9_-]+|wa\.me\/[0-9]+)(?:[?][^#]*)?$/.test(whatsapp))throw Error('Geçerli WhatsApp grup bağlantısı girin.');
 if(!Number.isInteger(completed)||completed<0||completed>100||!Number.isInteger(students)||students<0||students>500)throw Error('Değerleri kontrol edin.');
 const lock=LockService.getScriptLock();lock.waitLock(20000);
 try{const sh=aydaSheet_('GRUPLAR'),rows=sh.getDataRange().getDisplayValues(),h=rows[0],ix=rows.findIndex((r,i)=>i>0&&r[h.indexOf('ID')]===id);if(ix<1)throw Error('Grup bulunamadı.');const total=Number(rows[ix][h.indexOf('Toplam Ünite')])||24;if(completed>total)throw Error('Tamamlanan ünite toplamı aşamaz.');sh.getRange(ix+1,h.indexOf('Son Tamamlanan Ünite')+1).setValue(completed);sh.getRange(ix+1,h.indexOf('Öğrenci')+1).setValue(students);if(wantsWhatsapp){const wc=h.indexOf('WhatsApp');if(wc<0)throw Error('GRUPLAR tablosunda WhatsApp sütunu bulunamadı.');sh.getRange(ix+1,wc+1).setValue(whatsapp);}return {id,completed,students};}finally{lock.releaseLock();}
}
function aydaOverview_(user){const groups=aydaGroups_(user),schedule=aydaSchedule_(groups),history=aydaHistory_(user,groups),today=aydaToday_(),day=aydaWeekday_(today);return {user,groups,schedule,history,privateHistory:aydaPrivateHistory_(user),today,todayLessons:schedule.filter(p=>{const g=groups.find(x=>x.id===p.groupId);return p.day===day&&g&&(!g.start||g.start<=today)&&(!g.end||g.end>=today);}),accounts:user.role==='admin'?aydaRead_('KULLANICILAR').filter(x=>x['Rol']==='Öğretmen').map(x=>({id:x['Kullanıcı ID'],name:x['Kullanıcı Adı'],status:x['Durum']})):[],teachers:user.role==='admin'?aydaTeachers_():[],vaultStatus:user.role==='admin'?aydaVaultStatus_(user):[]};}
function aydaSave_(user,p){
  if(!p||typeof p!=='object')throw Error('Rapor bilgileri eksik.');
  const groupId=String(p.groupId||'').trim(),date=String(p.date||'').trim(),topic=String(p.topic||'').trim(),note=String(p.note||'').trim(),unit=Number(p.unit),completed=Number(p.completed),actual=String(p.actual||'').trim(),status=String(p.status||'İşlendi');
  if(!aydaValidateDate_(date)||date>aydaToday_())throw Error('Geçerli bir geçmiş veya bugünkü tarih girin.');
  if(!Number.isInteger(unit)||unit<0||unit>100||!Number.isInteger(completed)||completed<0||completed>unit)throw Error('Ünite değerlerini kontrol edin.');
  if(topic.length>300||note.length<3||note.length>2000)throw Error('Konu veya not uzunluğu geçersiz.');
  if(!/^(?:00:30|0[1-5]:(?:00|30)|06:00)$/.test(actual))throw Error('Ders süresi 30 dakika ile 6 saat arasında, 30 dakikalık aralıklarla olmalı.');
  if(!['İşlendi','İptal','Ertelendi'].includes(status))throw Error('Ders durumu geçersiz.');
  const lock=LockService.getScriptLock();lock.waitLock(20000);
  try{
    const group=aydaGroups_(user).find(g=>g.id===groupId);if(!group)throw Error('Bu grup için yetkiniz yok.');
    const s=aydaSheet_('DERS_KAYITLARI'),values=s.getDataRange().getDisplayValues(),h=values[0].map(x=>String(x).trim()),di=h.indexOf('Tarih'),gi=h.indexOf('Grup ID');
    if(di<0||gi<0)throw Error('DERS_KAYITLARI başlıkları eksik.');
    if(values.slice(1).some(r=>r[gi]===groupId&&aydaDate_(r[di])===date))throw Error('Bu grup ve tarihe ait rapor zaten var.');
    const plan=aydaSchedule_([group]).find(x=>x.day===aydaWeekday_(date));
    const record={'Kayıt ID':'DK-'+Utilities.getUuid(),'Tarih':date,'Grup ID':groupId,'Öğretmen ID':group.teacherId,'Planlanan Başlangıç':plan?plan.start:'','Planlanan Bitiş':plan&&plan.end!=='Belirtilmemiş'?plan.end:'','Gerçekleşen Ders Saati':actual,'Durum':status,'İşlenen Ünite':unit,'Tamamlanan Ünite':completed,'İşlenen Konu':/^[=+@-]/.test(topic)?"'"+topic:topic,'Öğretmen Notu':/^[=+@-]/.test(note)?"'"+note:note,'Kayıt Zamanı':new Date()};
    if(Object.keys(record).some(k=>!h.includes(k)))throw Error('DERS_KAYITLARI tablosunun başlıkları eksik.');
    // İşlenen grup dersi için yoklama + verilen ödev zorunlu; iptal/erteleme istisnadır.
    if(Object.prototype.hasOwnProperty.call(p,'attendance')&&!Array.isArray(p.attendance))throw Error('Yoklama biçimi geçersiz.');
    const hasTracking=Array.isArray(p.attendance);
    if(status==='İşlendi'&&!hasTracking)throw Error('Önce tüm öğrencilerin yoklamasını işaretleyin. Yoklama alınmadan ders raporu kaydedilemez.');
    if(hasTracking&&status!=='İşlendi')throw Error('Yoklama yalnızca işlenen derse eklenebilir.');
    const homeworkText=String(p.homeworkText||'').trim();
    if(status==='İşlendi'&&(homeworkText.length<3||homeworkText.length>1000))
      throw Error('Verilen ödevi yazın (3–1000 karakter). Ödev verilmediyse nedenini açıkça belirtin.');
    const safeHomework=/^[=+@-]/.test(homeworkText)?"'"+homeworkText:homeworkText;
    const entries=hasTracking?aydaTrackingPrepare_(user,groupId,p.attendance,p.homeworkEnabled===true):null;
    const yoklama=hasTracking?aydaTrackingHeaders_('YOKLAMA',['YOKLAMA_ID','DERS_KAYIT_ID','TARIH','GRUP_ID','OGRENCI_ID','KATILIM','MAZERETLI','OGRETMEN_ID','KAYIT_ZAMANI']):null;
    const odev=hasTracking&&p.homeworkEnabled===true?aydaTrackingHeaders_('ODEV_TAKIBI',['ODEV_KAYIT_ID','DERS_KAYIT_ID','TARIH','GRUP_ID','OGRENCI_ID','ODEV_DURUMU','OGRETMEN_ID','KAYIT_ZAMANI']):null;
    const homeworkSheet=status==='İşlendi'?aydaTrackingHeaders_('DERS_ODEVLERI',['ODEV_ID','DERS_KAYIT_ID','TARIH','GRUP_ID','OGRETMEN_ID','VERILEN_ODEV','KAYIT_ZAMANI','PAYLASIM_DURUMU','PAYLASIM_ZAMANI','PAYLASAN_OGRETMEN_ID']):null;
    const homeworkId=homeworkSheet?'DO-'+Utilities.getUuid():'';
    const rows=hasTracking?aydaTrackingRows_(entries,date,groupId,group.teacherId,record['Kayıt ID'],p.homeworkEnabled===true,yoklama.header,odev?odev.header:[]):null;
    // Tek işlem: önce ders, sonra yoklama ve ödev. Başarısızlıkta bu isteğin satırlarını geri al.
    const marks=[{sheet:s,last:s.getLastRow()}];
    if(yoklama)marks.push({sheet:yoklama.sheet,last:yoklama.sheet.getLastRow()});
    if(odev)marks.push({sheet:odev.sheet,last:odev.sheet.getLastRow()});
    if(homeworkSheet)marks.push({sheet:homeworkSheet.sheet,last:homeworkSheet.sheet.getLastRow()});
    try{
      s.appendRow(h.map(k=>Object.prototype.hasOwnProperty.call(record,k)?record[k]:''));
      if(rows){
        yoklama.sheet.getRange(yoklama.sheet.getLastRow()+1,1,rows.attendance.length,yoklama.header.length).setValues(rows.attendance);
        if(odev&&rows.homework.length)odev.sheet.getRange(odev.sheet.getLastRow()+1,1,rows.homework.length,odev.header.length).setValues(rows.homework);
      }
      if(homeworkSheet){
        const entry={ODEV_ID:homeworkId,DERS_KAYIT_ID:record['Kayıt ID'],TARIH:date,GRUP_ID:groupId,
          OGRETMEN_ID:user.id,VERILEN_ODEV:safeHomework,KAYIT_ZAMANI:new Date(),PAYLASIM_DURUMU:'Bekliyor',PAYLASIM_ZAMANI:'',PAYLASAN_OGRETMEN_ID:''};
        homeworkSheet.sheet.getRange(homeworkSheet.sheet.getLastRow()+1,1,1,homeworkSheet.header.length)
          .setValues([homeworkSheet.header.map(k=>Object.prototype.hasOwnProperty.call(entry,k)?entry[k]:'')]);
      }
      SpreadsheetApp.flush(); // Alt tablolar tamamlanmadan kayda onay verme.
      const persisted=s.getRange(s.getLastRow(),1,1,h.length).getDisplayValues()[0];
      if(persisted[h.indexOf('Kayıt ID')]!==record['Kayıt ID'])throw Error('Ders kaydı doğrulanamadı.');
      if(rows){
       const rowCount=rows.attendance.length,idColumn=yoklama.header.indexOf('DERS_KAYIT_ID');
       const written=yoklama.sheet.getRange(yoklama.sheet.getLastRow()-rowCount+1,1,rowCount,yoklama.header.length).getDisplayValues();
       if(idColumn<0||written.some(row=>row[idColumn]!==record['Kayıt ID']))throw Error('Yoklama kayıtları doğrulanamadı.');
      }
    }catch(writeErr){
      let rollbackIssue=false;
      for(const m of marks.slice().reverse()){
        try{const count=m.sheet.getLastRow()-m.last;if(count>0)m.sheet.deleteRows(m.last+1,count);}catch(rollbackError){rollbackIssue=true;Logger.log('AYDA rollback: '+rollbackError.message);}
      }
      throw Error(rollbackIssue?'Kayıt tamamlanamadı ve geri alma kısmen başarısız oldu; yöneticinin tabloyu kontrol etmesi gerekir.':'Kayıt tamamlanamadı; hiçbir değişiklik uygulanmadı. '+writeErr.message);
    }
    let progressWarning='';
    if(status==='İşlendi'){
      try{
       const gs=aydaSheet_('GRUPLAR'),gv=gs.getDataRange().getDisplayValues(),gh=gv[0],idc=gh.indexOf('ID'),uc=gh.indexOf('Son Tamamlanan Ünite');
       if(idc>=0&&uc>=0){const ix=gv.findIndex((r,i)=>i>0&&r[idc]===groupId);if(ix>0){const cell=gs.getRange(ix+1,uc+1);if(completed>(Number(cell.getValue())||0))cell.setValue(completed);}}
      }catch(e){progressWarning='Ders kaydedildi; grup ilerleme özeti güncellenemedi.';Logger.log('AYDA grup ilerleme: '+e.message);}
    }
    return {saved:true,id:record['Kayıt ID'],trackingSaved:hasTracking,attendanceCount:entries?entries.length:0,homeworkSaved:!!homeworkSheet,homeworkId,progressWarning};
  }finally{lock.releaseLock();}
}
function aydaAdminKeyOlustur(){
  const props=PropertiesService.getScriptProperties();
  if(props.getProperty('AYDA_ADMIN_HASH')){Logger.log('Yönetici anahtarı zaten var.');return;}
  const key=[Utilities.getUuid(),Utilities.getUuid(),Utilities.getUuid()].join('-');
  props.setProperty('AYDA_ADMIN_HASH',aydaHash_(key));
  aydaVaultSave_('ADMIN','Yönetici','Yönetici',key);
  const file=SpreadsheetApp.create('AYDA - GIZLI YONETICI ANAHTARI');
  file.getSheets()[0].getRange(1,1,2,2).setValues([['Rol','Giriş Anahtarı'],['Yönetici',key]]);
  Logger.log('Yönetici anahtarı oluşturuldu. Google Drive: AYDA - GIZLI YONETICI ANAHTARI');
}
function aydaRotateKey_(user,target){
  if(user.role!=='admin')throw Error('Yalnızca yönetici anahtar oluşturabilir.');
  target=String(target||'').trim();
  if(target!=='ADMIN'){
    const account=aydaRead_('KULLANICILAR').find(x=>x['Kullanıcı ID']===target&&x['Rol']==='Öğretmen'&&x['Durum']==='Aktif');
    if(!account)throw Error('Aktif öğretmen hesabı bulunamadı.');
  }
  const key=[Utilities.getUuid(),Utilities.getUuid(),Utilities.getUuid()].join('-');
  const prop=target==='ADMIN'?'AYDA_ADMIN_HASH':'AYDA_GIRIS_'+target;
  const person=target==='ADMIN'?{name:'Yönetici'}:aydaRead_('KULLANICILAR').find(x=>x['Kullanıcı ID']===target);
  aydaVaultSave_(target,target==='ADMIN'?'Yönetici':'Öğretmen',target==='ADMIN'?'Yönetici':person['Kullanıcı Adı'],key);
  PropertiesService.getScriptProperties().setProperty(prop,aydaHash_(key));
  return {key: key, target:target};
}

/**
 * AYDA Öğrenci Takibi v1
 * Erişim: sadece doğrulanmış öğretmen kendi aktif gruplarını, yönetici aktif grupları görür.
 * Herkese açık publicDashboard yanıtına öğrenci ismi / yoklama eklenmez.
 */
function aydaStudentRoster_(user){
  const allowed=new Set(aydaGroups_(user).filter(g=>g.status==='Aktif').map(g=>g.id));
  if(!allowed.size)return [];
  return aydaRead_('OGRENCILER').filter(r=>allowed.has(r['GRUP_ID'])&&r['OGRENCI_ID']&&r['AD_SOYAD'])
    .map(r=>({id:String(r['OGRENCI_ID']).trim(),name:String(r['AD_SOYAD']).trim(),groupId:String(r['GRUP_ID']).trim()}));
}
function aydaTrackingPrepare_(user,groupId,entries,homeworkEnabled){
  if(!Array.isArray(entries))throw Error('Yoklama listesi eksik. Öğrenci listesini yenileyin.');
  const students=aydaStudentRoster_(user).filter(s=>s.groupId===groupId);
  if(!students.length)throw Error('Bu grubun öğrenci listesi bulunamadı. Yöneticiyle iletişime geçin.');
  if(entries.length!==students.length)throw Error('Yoklamadaki öğrenci sayısı değişmiş. Sayfayı yenileyin.');
  const expected=new Set(students.map(s=>s.id)),found=new Set(),prepared=[];
  if(typeof homeworkEnabled!=='boolean')throw Error('Ödev kontrolü bilgisi eksik.');
  for(const entry of entries){
    if(!entry||typeof entry!=='object')throw Error('Yoklama kaydı geçersiz.');
    const studentId=String(entry.studentId||''),status=String(entry.status||''),excused=entry.excused===true;
    if(!expected.has(studentId)||found.has(studentId))throw Error('Yoklamada geçersiz veya tekrarlanan öğrenci var.');
    if(status!=='Geldi'&&status!=='Gelmedi')throw Error('Yoklama durumu Geldi veya Gelmedi olmalı.');
    if(status==='Geldi'&&excused)throw Error('Gelen öğrenci mazeretli olamaz.');
    const hw=String(entry.homework||'Kontrol edilmedi');
    if(!['Yaptı','Yapmadı','Kontrol edilmedi'].includes(hw))throw Error('Ödev durumu geçersiz.');
    if((status==='Gelmedi'||!homeworkEnabled)&&hw!=='Kontrol edilmedi')throw Error('Gelmeyen veya ödevi kontrol edilmeyen öğrenciye ödev durumu girilemez.');
    found.add(studentId);prepared.push({studentId,status,excused,hw});
  }
  return prepared;
}
function aydaTrackingHeaders_(sheetName,required){
  const sh=aydaSheet_(sheetName),header=sh.getRange(1,1,1,sh.getLastColumn()).getDisplayValues()[0].map(s=>String(s).trim());
  for(const label of required)if(!header.includes(label))throw Error(sheetName+' sütunu eksik: '+label);
  return {sheet:sh,header};
}
function aydaTrackingRows_(prepared,date,groupId,teacherId,lessonId,homeworkEnabled,attendanceHeader,homeworkHeader){
  const stamp=new Date();
  const make=(headers,object)=>headers.map(k=>Object.prototype.hasOwnProperty.call(object,k)?object[k]:'');
  const attendance=prepared.map(r=>make(attendanceHeader,{
    YOKLAMA_ID:'YK-'+Utilities.getUuid(),DERS_KAYIT_ID:lessonId,TARIH:date,GRUP_ID:groupId,OGRENCI_ID:r.studentId,
    KATILIM:r.status,MAZERETLI:r.status==='Gelmedi'&&r.excused?'Evet':'Hayır',OGRETMEN_ID:teacherId,KAYIT_ZAMANI:stamp
  }));
  const homework=homeworkEnabled?prepared.map(r=>make(homeworkHeader,{
    ODEV_KAYIT_ID:'OV-'+Utilities.getUuid(),DERS_KAYIT_ID:lessonId,TARIH:date,GRUP_ID:groupId,OGRENCI_ID:r.studentId,
    ODEV_DURUMU:r.hw,OGRETMEN_ID:teacherId,KAYIT_ZAMANI:stamp
  })):[];
  return {attendance,homework};
}
function aydaTrackingSummary_(user){
  // Öğretmen sadece kendi aktif gruplarını görür. Yönetici tüm aktif grupları görür.
  if(user.role!=='admin'&&user.role!=='teacher')throw Error('Öğrenci takibi için oturum açın.');
  const groups=aydaGroups_(user).filter(g=>g.status==='Aktif');
  const roster=aydaStudentRoster_(user);
  const byGroup=new Map(groups.map(g=>[g.id,{
    id:g.id,name:g.name,students:0,present:0,absent:0,excused:0,
    homeworkDone:0,homeworkMissing:0,atRisk:0,watch:0,untracked:0
  }]));
  const byStudent=new Map();
  for(const r of roster){
    const group=byGroup.get(r.groupId);
    if(!group)continue;
    group.students++;
    byStudent.set(r.id,{id:r.id,name:r.name,groupId:r.groupId,present:0,absent:0,
      excused:0,homeworkDone:0,homeworkMissing:0,attendanceHistory:[],homeworkHistory:[]});
  }
  for(const r of aydaRead_('YOKLAMA')){
    const s=byStudent.get(String(r['OGRENCI_ID']||'').trim());
    if(!s||s.groupId!==r['GRUP_ID'])continue;
    const group=byGroup.get(s.groupId);
    const status=r['KATILIM'],excused=r['MAZERETLI']==='Evet',date=aydaDate_(r['TARIH']);
    if(status==='Geldi'){s.present++;group.present++;}
    else if(status==='Gelmedi'){s.absent++;group.absent++;if(excused){s.excused++;group.excused++;}}
    else continue;
    s.attendanceHistory.push({date,status,excused});
  }
  for(const r of aydaRead_('ODEV_TAKIBI')){
    const s=byStudent.get(String(r['OGRENCI_ID']||'').trim());
    if(!s||s.groupId!==r['GRUP_ID'])continue;
    const group=byGroup.get(s.groupId),status=r['ODEV_DURUMU'],date=aydaDate_(r['TARIH']);
    if(status==='Yaptı'){s.homeworkDone++;group.homeworkDone++;}
    else if(status==='Yapmadı'){s.homeworkMissing++;group.homeworkMissing++;}
    else continue;
    s.homeworkHistory.push({date,status});
  }
  const alerts=[],followups=aydaFollowupMap_();
  for(const s of byStudent.values()){
    s.attendanceHistory.sort((a,b)=>b.date.localeCompare(a.date));
    s.homeworkHistory.sort((a,b)=>b.date.localeCompare(a.date));
    const recentAttendance=s.attendanceHistory.slice(0,5);
    const recentHomework=s.homeworkHistory.slice(0,5);
    const lastFourChecked=s.homeworkHistory.slice(0,4);
    const recentAbsent=recentAttendance.filter(x=>x.status==='Gelmedi'&&!x.excused).length;
    const absenceStreak=recentAttendance.findIndex(x=>x.status!=='Gelmedi'||x.excused)===-1?recentAttendance.length:recentAttendance.findIndex(x=>x.status!=='Gelmedi'||x.excused);
    const consecutiveAbsent=absenceStreak>=3;
    const recentExcused=recentAttendance.filter(x=>x.status==='Gelmedi'&&x.excused).length;
    const recentHw=lastFourChecked.filter(x=>x.status==='Yapmadı').length;
    s.lastAttendance=recentAttendance[0]||null;
    s.lastHomework=recentHomework[0]||null;
    s.recentAttendance=recentAttendance;
    s.recentHomework=recentHomework;
    s.recentAbsent=recentAbsent;
    s.recentHomeworkMissing=recentHw;
    s.consecutiveAbsent=consecutiveAbsent;
    s.absenceStreak=absenceStreak;
    s.attendanceRate=(s.present+s.absent)?Math.round(s.present*100/(s.present+s.absent)):null;
    s.riskSignature=[s.lastAttendance?.date||'',s.lastAttendance?.status||'',String(!!s.lastAttendance?.excused),s.lastHomework?.date||'',s.lastHomework?.status||''].join('|');
    const follow=followups.get(s.id);s.followupStatus=follow?.signature===s.riskSignature?follow.status:'Yeni';
    s.riskLevel=consecutiveAbsent||recentHw>=3?'danger':
      absenceStreak>=2||recentAbsent>=1||recentHw>=2?'watch':
      recentAttendance.length||recentHomework.length?'regular':'untracked';
    const group=byGroup.get(s.groupId);
    if(s.riskLevel==='danger'&&s.followupStatus!=='Çözüldü'){
      group.atRisk++;
      alerts.push({studentId:s.id,name:s.name,groupId:s.groupId,group:group.name,
        recentAbsent,recentExcused,recentHomeworkMissing:recentHw,consecutiveAbsent,absenceStreak,followupStatus:s.followupStatus,excused:s.excused});
    }else if(s.riskLevel==='watch')group.watch++;
    else if(s.riskLevel==='untracked')group.untracked++;
    delete s.attendanceHistory;
    delete s.homeworkHistory;
  }
  alerts.sort((a,b)=>Number(b.consecutiveAbsent)-Number(a.consecutiveAbsent)||b.recentAbsent-a.recentAbsent||b.recentHomeworkMissing-a.recentHomeworkMissing);
  return {groups:[...byGroup.values()],students:[...byStudent.values()],alerts,
    scope:user.role==='admin'?'all':'own',updatedAt:aydaToday_()};
}

/** Planlanan dersin bitiminden 12 saat sonra, eksik rapor / eksik yoklamayı saptar.
 * Uyarılar öğretmen ile yöneticinin girişli panelindedir; otomatik WhatsApp gönderilmez.
 */

/** Girişli yönetici/öğretmen: rapora bağlı verilen ödevleri, grup yetkisine göre getirir. */
function aydaLessonHomework_(user){
 if(user.role!=='teacher'&&user.role!=='admin')throw Error('Yetkili giriş gerekir.');
 const groups=aydaGroups_(user),allowed=new Map(groups.map(g=>[g.id,g.name]));
 const list=aydaRead_('DERS_ODEVLERI')
  .filter(r=>allowed.has(r['GRUP_ID']))
  .map(r=>({id:r['ODEV_ID'],lessonId:r['DERS_KAYIT_ID'],date:aydaDate_(r['TARIH']),
    groupId:r['GRUP_ID'],group:allowed.get(r['GRUP_ID']),teacherId:r['OGRETMEN_ID'],text:r['VERILEN_ODEV'],
    shareStatus:r['PAYLASIM_DURUMU']||'Eski kayıt',sharedAt:r['PAYLASIM_ZAMANI']||'',sharedBy:r['PAYLASAN_OGRETMEN_ID']||''}))
  .sort((a,b)=>b.date.localeCompare(a.date));
 return {items:list.slice(0,400),total:list.length,pending:list.filter(r=>r.shareStatus==='Bekliyor').length,scope:user.role==='admin'?'all':'own'};
}

/** Öğretmenin WhatsApp grubuna manuel gönderim beyanı.
 * WhatsApp gönderimi platform üzerinden doğrulanamaz; bu bir öğretmen onayıdır.
 * Ders raporuna dokunmaz ve yalnızca yetkili grubun ödev satırını günceller.
 */
function aydaConfirmHomeworkShare_(user,p){
 if(user.role!=='teacher')throw Error('Grup paylaşımını yalnızca öğretmen onaylayabilir.');
 const id=String(p&&p.id||'').trim();
 if(!/^DO-[A-Za-z0-9-]{8,80}$/.test(id))throw Error('Ödev kaydı geçersiz.');
 const lock=LockService.getScriptLock();lock.waitLock(20000);
 try{
  const sh=aydaSheet_('DERS_ODEVLERI'),rows=sh.getDataRange().getDisplayValues();
  if(!rows.length)throw Error('Ödev kayıt tablosu boş.');
  const header=rows[0].map(v=>String(v).trim());
  const cols=['ODEV_ID','DERS_KAYIT_ID','GRUP_ID','OGRETMEN_ID','PAYLASIM_DURUMU','PAYLASIM_ZAMANI','PAYLASAN_OGRETMEN_ID'];
  for(const key of cols)if(!header.includes(key))throw Error('Ödev tablosunda gerekli alan eksik: '+key);
  const idx=header.indexOf('ODEV_ID');
  const rowIndex=rows.findIndex((r,i)=>i>0&&r[idx]===id);
  if(rowIndex<1)throw Error('Ödev kaydı bulunamadı.');
  const row=rows[rowIndex],gid=row[header.indexOf('GRUP_ID')];
  if(!aydaGroups_(user).some(g=>g.id===gid&&g.status==='Aktif'))
    throw Error('Bu grubun WhatsApp paylaşımını onaylama yetkiniz yok.');
  const statusCol=header.indexOf('PAYLASIM_DURUMU'),status=String(row[statusCol]||'');
  if(status==='Paylaşıldı')return {saved:true,alreadyShared:true,id,shareStatus:'Paylaşıldı'};
  if(status!==''&&status!=='Bekliyor')throw Error('Paylaşım durumu güncellenemiyor.');
  const stampCol=header.indexOf('PAYLASIM_ZAMANI'),byCol=header.indexOf('PAYLASAN_OGRETMEN_ID');
  const old={status:row[statusCol],stamp:row[stampCol],by:row[byCol]};
  try{
   sh.getRange(rowIndex+1,statusCol+1).setValue('Paylaşıldı');
   sh.getRange(rowIndex+1,stampCol+1).setValue(new Date());
   sh.getRange(rowIndex+1,byCol+1).setValue(user.id);
  }catch(err){
   for(const [column,value] of [[statusCol,old.status],[stampCol,old.stamp],[byCol,old.by]]){
    try{sh.getRange(rowIndex+1,column+1).setValue(value);}catch(rollbackError){Logger.log('AYDA share rollback: '+rollbackError.message);}
   }
   throw Error('Grup paylaşım onayı kaydedilemedi: '+err.message);
  }
  return {saved:true,id,shareStatus:'Paylaşıldı'};
 }finally{lock.releaseLock();}
}

/** Eksiksiz yoklama: her kayıtlı öğrenci için tek ve geçerli satır. */
function aydaAttendanceComplete_(studentIds,rows){
 const expected=new Set(studentIds||[]);if(!expected.size)return false;
 const seen=new Set();
 for(const r of rows||[]){
  const id=String(r['OGRENCI_ID']||'').trim(),status=String(r['KATILIM']||'').trim();
  if(!expected.has(id)||seen.has(id)||!['Geldi','Gelmedi'].includes(status))return false;
  seen.add(id);
 }
 return seen.size===expected.size;
}
function aydaReminders_(user){
 if(user.role!=='admin'&&user.role!=='teacher')throw Error('Giriş gerekli.');
 const groups=aydaGroups_(user).filter(g=>g.status==='Aktif');
 const byId=new Map(groups.map(g=>[g.id,g]));
 const today=aydaToday_(),now=new Date().getTime();
 const schedules=aydaSchedule_(groups);
 const allowed=new Set(groups.map(g=>g.id));
 const history=aydaRead_('DERS_KAYITLARI').filter(r=>allowed.has(r['Grup ID'])).map(r=>({id:r['Kayıt ID'],groupId:r['Grup ID'],date:aydaDate_(r['Tarih']),status:r['Durum']}));
 const existing=new Map(history.map(r=>[r.groupId+'|'+r.date,r]));
 const attendance=new Map();
 for(const r of aydaRead_('YOKLAMA')){const key=String(r['GRUP_ID'])+'|'+aydaDate_(r['TARIH']);if(!attendance.has(key))attendance.set(key,[]);attendance.get(key).push(r);}
 const roster=new Map();
 for(const r of aydaStudentRoster_(user)){if(!roster.has(r.groupId))roster.set(r.groupId,[]);roster.get(r.groupId).push(r.id);}
 const missing=[];
 const ref=new Date(today+'T00:00:00Z');
 for(let back=0;back<=30;back++){
  const d=new Date(ref.getTime()-back*86400000),date=d.toISOString().slice(0,10),day=aydaWeekday_(date);
  for(const item of schedules){
   if(item.day!==day||!byId.has(item.groupId))continue;
   const group=byId.get(item.groupId);
   if(date<AYDA_TRACKING_START||(group.start&&date<group.start)||(group.end&&date>group.end))continue;
   const end=String(item.end||'').trim();
   if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(end))continue;
   const finish=new Date(date+'T'+end+':00+03:00').getTime();
   if(!Number.isFinite(finish)||now-finish<12*3600000)continue;
   const record=existing.get(item.groupId+'|'+date);
   if(!record)missing.push({type:'report',groupId:group.id,group:group.name,teacherId:group.teacherId,date,end,ageHours:Math.floor((now-finish)/3600000)});
   else if(record.status==='İşlendi'&&roster.has(group.id)&&!aydaAttendanceComplete_(roster.get(group.id),attendance.get(group.id+'|'+date)))
    missing.push({type:'attendance',groupId:group.id,group:group.name,teacherId:group.teacherId,date,end,lessonId:record.id,ageHours:Math.floor((now-finish)/3600000)});
  }
 }
 missing.sort((a,b)=>b.date.localeCompare(a.date)||a.group.localeCompare(b.group));
 return {thresholdHours:12,scope:user.role==='admin'?'all':'own',total:missing.length,
  reports:missing.filter(x=>x.type==='report').length,attendance:missing.filter(x=>x.type==='attendance').length,
  items:missing.slice(0,120),checkedAt:Utilities.formatDate(new Date(),AYDA_TZ,'yyyy-MM-dd HH:mm')};
}
/** İsteğe bağlı öğrenci gözlemleri: yalnızca yetkili öğretmen ve yönetici. */

/** Daha önce kaydedilmiş, yoklaması eksik bir dersin yoklamasını sonradan tamamlar.
 * Ders raporunu ikinci kez kaydetmez; aynı derse ikinci yoklama yazılmaz.
 */
function aydaSaveAttendance_(user,p){
 if(!p||typeof p!=='object')throw Error('Yoklama bilgisi eksik.');
 const groupId=String(p.groupId||'').trim(),date=String(p.date||'').trim();
 if(!aydaValidateDate_(date)||date>aydaToday_())throw Error('Yoklama tarihi geçersiz.');
 const lock=LockService.getScriptLock();lock.waitLock(20000);
 try{
  const group=aydaGroups_(user).find(g=>g.id===groupId);
  if(!group)throw Error('Grup yetkisi bulunamadı.');
  const lessonRaw=aydaRead_('DERS_KAYITLARI').find(r=>r['Grup ID']===groupId&&aydaDate_(r['Tarih'])===date);
  const lesson=lessonRaw?{id:lessonRaw['Kayıt ID'],status:lessonRaw['Durum']}:null;
  if(!lesson||lesson.status!=='İşlendi')throw Error('Önce bu tarihin işlenen ders raporu kaydedilmeli.');
  const previous=aydaRead_('YOKLAMA').filter(r=>r['DERS_KAYIT_ID']===lesson.id||(r['GRUP_ID']===groupId&&aydaDate_(r['TARIH'])===date));
  const entries=aydaTrackingPrepare_(user,groupId,p.attendance,p.homeworkEnabled===true);
  const known=new Set(entries.map(r=>r.studentId)),seen=new Set();
  for(const row of previous){const id=String(row['OGRENCI_ID']||'').trim();
   if(!known.has(id)||seen.has(id))throw Error('Mevcut yoklamada mükerrer veya geçersiz öğrenci kaydı var. Yönetici kontrol etmeli.');
   seen.add(id);
  }
  const pending=entries.filter(r=>!seen.has(r.studentId));
  if(!pending.length)throw Error('Bu dersin yoklaması zaten tamamlanmış.');
  const at=aydaTrackingHeaders_('YOKLAMA',['YOKLAMA_ID','DERS_KAYIT_ID','TARIH','GRUP_ID','OGRENCI_ID','KATILIM','MAZERETLI','OGRETMEN_ID','KAYIT_ZAMANI']);
  const hw=p.homeworkEnabled===true?aydaTrackingHeaders_('ODEV_TAKIBI',['ODEV_KAYIT_ID','DERS_KAYIT_ID','TARIH','GRUP_ID','OGRENCI_ID','ODEV_DURUMU','OGRETMEN_ID','KAYIT_ZAMANI']):null;
  const rows=aydaTrackingRows_(pending,date,groupId,group.teacherId,lesson.id,p.homeworkEnabled===true,at.header,hw?hw.header:[]);
  const marks=[{sheet:at.sheet,last:at.sheet.getLastRow()}];
  if(hw)marks.push({sheet:hw.sheet,last:hw.sheet.getLastRow()});
  try{
   at.sheet.getRange(at.sheet.getLastRow()+1,1,rows.attendance.length,at.header.length).setValues(rows.attendance);
   if(hw&&rows.homework.length)hw.sheet.getRange(hw.sheet.getLastRow()+1,1,rows.homework.length,hw.header.length).setValues(rows.homework);
  }catch(err){
   for(const item of marks.slice().reverse()){const n=item.sheet.getLastRow()-item.last;if(n>0)item.sheet.deleteRows(item.last+1,n);}
   throw Error('Yoklama kaydedilemedi: '+err.message);
  }
  return {saved:true,id:lesson.id,trackingSaved:true,attendanceCount:entries.length,attendanceOnly:true,added:pending.length};
 }finally{lock.releaseLock();}
}
function aydaStudentNotesSheet_(create){
 const db=aydaDb_();let sh=db.getSheetByName('OGRENCI_NOTLARI');
 if(!sh&&create){sh=db.insertSheet('OGRENCI_NOTLARI');sh.appendRow(['NOT_ID','OGRENCI_ID','GRUP_ID','OGRETMEN_ID','NOT','KAYIT_ZAMANI']);sh.setFrozenRows(1);}
 return sh;
}
function aydaStudentNotes_(user,p){
 const studentId=String((p||{}).studentId||'').trim();
 const student=aydaStudentRoster_(user).find(s=>s.id===studentId);
 if(!student)throw Error('Bu öğrencinin notlarına erişim yetkiniz yok.');
 const sh=aydaStudentNotesSheet_(false);
 if(!sh||sh.getLastRow()<2)return {studentId,notes:[]};
 const h=sh.getRange(1,1,1,sh.getLastColumn()).getDisplayValues()[0];
 const rows=sh.getRange(2,1,sh.getLastRow()-1,h.length).getDisplayValues();
 const notes=rows.map(r=>Object.fromEntries(h.map((x,i)=>[x,r[i]])))
 .filter(r=>r['OGRENCI_ID']===studentId&&r['GRUP_ID']===student.groupId)
 .map(r=>({id:r['NOT_ID'],text:r['NOT'],teacherId:r['OGRETMEN_ID'],created:r['KAYIT_ZAMANI']})).reverse().slice(0,30);
 return {studentId,notes};
}
function aydaSaveStudentNote_(user,p){
 if(!p||typeof p!=='object')throw Error('Gözlem bilgisi eksik.');
 const studentId=String(p.studentId||'').trim(),note=String(p.note||'').trim();
 if(note.length<3||note.length>700)throw Error('Not 3–700 karakter olmalı.');
 const student=aydaStudentRoster_(user).find(s=>s.id===studentId);
 if(!student)throw Error('Bu öğrenciye not yazma yetkiniz yok.');
 const lock=LockService.getScriptLock();lock.waitLock(20000);
 try{
  const sh=aydaStudentNotesSheet_(true),id='ON-'+Utilities.getUuid();
  sh.appendRow([id,student.id,student.groupId,user.id,/^[=+@-]/.test(note)?"'"+note:note,new Date()]);
  return {saved:true,id};
 }finally{lock.releaseLock();}
}


/** Audit kaydı tutan kontrollü rapor düzeltmesi: sadece not ve ders süresi. */
function aydaUpdateReport_(user,p){
 if(!p||typeof p!=='object')throw Error('Düzeltme bilgisi eksik.');
 const id=String(p.id||'').trim(),note=String(p.note||'').trim(),actual=String(p.actual||'').trim();
 if(note.length<3||note.length>2000)throw Error('Not 3–2000 karakter olmalı.');
 if(!/^(?:00:30|0[1-5]:(?:00|30)|06:00)$/.test(actual))throw Error('Ders süresi 30 dakika ile 6 saat arasında, 30 dakikalık aralıklarla olmalı.');
 const lock=LockService.getScriptLock();lock.waitLock(20000);
 try{
  const sh=aydaSheet_('DERS_KAYITLARI'),rows=sh.getDataRange().getDisplayValues(),h=rows[0].map(String);
  const idc=h.indexOf('Kayıt ID'),ix=rows.findIndex((r,i)=>i>0&&r[idc]===id);
  if(idc<0||ix<1)throw Error('Ders raporu bulunamadı.');
  const r=rows[ix],gid=r[h.indexOf('Grup ID')],tid=r[h.indexOf('Öğretmen ID')];
  if(user.role!=='admin'&&(tid!==user.id||!aydaGroups_(user).some(g=>g.id===gid)))throw Error('Bu raporda düzeltme yetkiniz yok.');
  const nc=h.indexOf('Öğretmen Notu'),ac=h.indexOf('Gerçekleşen Ders Saati');
  if(nc<0||ac<0)throw Error('Ders raporu sütunları eksik.');
  const oldNote=r[nc],oldActual=r[ac];
  if(oldNote===note&&oldActual===actual)return {saved:true,unchanged:true,id};
  const db=aydaDb_();let audit=db.getSheetByName('RAPOR_DUZELTME_GECMISI');
  if(!audit){audit=db.insertSheet('RAPOR_DUZELTME_GECMISI');audit.appendRow(['KAYIT_ID','DUZELTEN_ID','ESKI_NOT','YENI_NOT','ESKI_SURE','YENI_SURE','ZAMAN']);audit.setFrozenRows(1);}
  const safe=/^[=+@-]/.test(note)?"'"+note:note;
  sh.getRange(ix+1,nc+1).setValue(safe);
  try{sh.getRange(ix+1,ac+1).setValue(actual);audit.appendRow([id,user.id,oldNote,safe,oldActual,actual,new Date()]);}
  catch(e){sh.getRange(ix+1,nc+1).setValue(oldNote);sh.getRange(ix+1,ac+1).setValue(oldActual);throw Error('Rapor düzeltilemedi: '+e.message);}
  return {saved:true,id};
 }finally{lock.releaseLock();}
}
function aydaFollowupSheet_(create){
 let sh=aydaDb_().getSheetByName('TAKIP_ISLEMLERI');
 if(!sh&&create){sh=aydaDb_().insertSheet('TAKIP_ISLEMLERI');sh.appendRow(['OGRENCI_ID','GRUP_ID','DURUM','RISK_IMZASI','YONETICI_ID','KAYIT_ZAMANI']);sh.setFrozenRows(1);}
 return sh;
}
function aydaFollowupMap_(){
 const sh=aydaFollowupSheet_(false),map=new Map();
 if(!sh||sh.getLastRow()<2)return map;
 const h=sh.getRange(1,1,1,sh.getLastColumn()).getDisplayValues()[0];
 for(const line of sh.getRange(2,1,sh.getLastRow()-1,h.length).getDisplayValues()){
  const r=Object.fromEntries(h.map((k,i)=>[k,line[i]]));
  if(r['OGRENCI_ID'])map.set(r['OGRENCI_ID'],{status:r['DURUM'],signature:r['RISK_IMZASI']});
 }
 return map;
}
function aydaSetFollowup_(user,p){
 if(user.role!=='admin')throw Error('Yalnızca yönetici takip durumunu değiştirebilir.');
 const id=String((p||{}).studentId||'').trim(),status=String((p||{}).status||'').trim();
 if(!['Takipte','Çözüldü'].includes(status))throw Error('Geçersiz takip durumu.');
 const lock=LockService.getScriptLock();lock.waitLock(20000);
 try{
  const student=aydaTrackingSummary_(user).students.find(s=>s.id===id);
  if(!student||student.riskLevel!=='danger')throw Error('Risk uyarısı bulunan öğrenci seçin.');
  aydaFollowupSheet_(true).appendRow([id,student.groupId,status,student.riskSignature,user.id,new Date()]);
  return {saved:true,studentId:id,status};
 }finally{lock.releaseLock();}
}


/** AYDA personel mesajlaşma ve öğretmen hizmet ekranları.
 * Öğrenci ve öğretmen telefonlarını yalnızca yönetici anahtarıyla döndürür.
 * publicDashboard ve anonim endpoint'ler kesinlikle iletişim bilgisi içermez.
 */
function aydaPhone_(value){
 const digits=String(value||'').replace(/\D/g,'');
 if(/^90[1-9]\d{9}$/.test(digits))return digits;
 if(/^0[1-9]\d{9}$/.test(digits))return '9'+digits;
 if(/^[1-9]\d{9}$/.test(digits))return '90'+digits;
 return '';
}
function aydaContactDirectory_(user){
 if(user.role!=='admin')throw Error('İletişim rehberi yalnızca yönetime açıktır.');
 const roster=aydaStudentRoster_(user);
 const contact=new Map(aydaRead_('OGRENCI_ILETISIM').map(r=>[String(r['OGRENCI_ID']||''),aydaPhone_(r['TELEFON'])]));
 const names=new Map(aydaGroups_(user).map(g=>[g.id,g.name]));
 const students=roster.map(r=>({id:r.id,name:r.name,groupId:r.groupId,group:names.get(r.groupId)||r.groupId,phone:contact.get(r.id)||'',hasPhone:!!contact.get(r.id)}));
 const teachers=aydaRead_('OGRETMEN_REHBERI').map(r=>({
  id:String(r['KISI_ID']||''),name:String(r['AD_SOYAD']||''),
  phone:aydaPhone_(r['TELEFON']),note:String(r['KURUM_NOTU']||''),
  teacherId:String(r['OGRETMEN_ID']||''),match:String(r['ESLESME']||''),status:String(r['DURUM']||'')
 }));
 return {students,teachers,missingStudentPhones:students.filter(x=>!x.phone).length,scope:'admin'};
}

/** Yönetici kişi rehberinde yalnızca tanımlı kaydın telefonunu düzenler. */
function aydaUpdateContact_(user,p){
 if(user.role!=='admin')throw Error('Telefon güncelleme yetkisi yalnızca yöneticidedir.');
 const type=String((p||{}).type||''),id=String((p||{}).id||'').trim();
 const input=String((p||{}).phone||'').trim();
 if(!['teacher','student'].includes(type)||!id||id.length>80)throw Error('Kişi kaydı geçersiz.');
 const phone=input?aydaPhone_(input):'';
 if(input&&!phone)throw Error('Telefonu 10 haneli Türkiye cep numarası olarak girin.');
 const sheetName=type==='teacher'?'OGRETMEN_REHBERI':'OGRENCI_ILETISIM';
 const idCol=type==='teacher'?'KISI_ID':'OGRENCI_ID';
 const lock=LockService.getScriptLock();lock.waitLock(20000);
 try{
  const sh=aydaSheet_(sheetName),v=sh.getDataRange().getDisplayValues(),h=v[0].map(String);
  const idIndex=h.indexOf(idCol),phoneIndex=h.indexOf('TELEFON');
  if(idIndex<0||phoneIndex<0)throw Error('Rehber sütunları eksik.');
  const row=v.findIndex((r,i)=>i>0&&r[idIndex]===id);
  if(row<1)throw Error('Kişi bulunamadı.');
  sh.getRange(row+1,phoneIndex+1).setValue(phone?'+'+phone:'');
  if(type==='teacher'){
   const match=h.indexOf('ESLESME');
   if(match>=0&&v[row][match]==='Telefon eksik/geçersiz'&&phone)sh.getRange(row+1,match+1).setValue('Telefon doğrulandı · Hesap eşleştirmesi bekliyor');
  }
  return {saved:true,type,id,phone};
 }finally{lock.releaseLock();}
}

function aydaFeedbackSheet_(){return aydaSheet_('OGRETMEN_GERI_BILDIRIM');}
function aydaTeacherFeedback_(user){
 if(user.role!=='teacher')throw Error('Öğretmen oturumu gereklidir.');
 return {rows:aydaRead_('OGRETMEN_GERI_BILDIRIM').filter(r=>r['OGRETMEN_ID']===user.id)
 .slice(-12).reverse().map(r=>({id:r['GERI_BILDIRIM_ID'],created:r['KAYIT_ZAMANI'],
  category:r['KATEGORI'],message:r['MESAJ'],status:r['DURUM'],reply:r['YONETICI_YANITI']||''}))};
}
function aydaFeedbackInbox_(user){
 if(user.role!=='admin')throw Error('Yönetici yetkisi gerekir.');
 return {rows:aydaRead_('OGRETMEN_GERI_BILDIRIM').slice(-150).reverse().map(r=>({
  id:r['GERI_BILDIRIM_ID'],created:r['KAYIT_ZAMANI'],teacherId:r['OGRETMEN_ID'],
  teacher:r['OGRETMEN_ADI'],category:r['KATEGORI'],
  message:r['MESAJ'],status:r['DURUM'],reply:r['YONETICI_YANITI']||''
 }))};
}
function aydaSaveFeedback_(user,p){
 if(user.role!=='teacher')throw Error('Öğretmen olarak oturum açın.');
 const category=String((p||{}).category||'Fikir'),message=String((p||{}).message||'').trim();
 if(!['Fikir','Sorun','İyileştirme','Diğer'].includes(category))throw Error('Kategori geçersiz.');
 if(message.length<8||message.length>1400)throw Error('Mesaj 8–1400 karakter olmalı.');
 const sanitize=s=>/^[=+@-]/.test(s)?"'"+s:s;
 const lock=LockService.getScriptLock();lock.waitLock(20000);
 try{const id='FB-'+Utilities.getUuid();
  aydaAppendNamed_('OGRETMEN_GERI_BILDIRIM',{
   GERI_BILDIRIM_ID:id,KAYIT_ZAMANI:new Date(),OGRETMEN_ID:user.id,
   OGRETMEN_ADI:user.name,KATEGORI:category,MESAJ:sanitize(message),
   DURUM:'Yeni',INCELEME_ZAMANI:'',YONETICI_YANITI:''
  });
  return {saved:true,id};
 }finally{lock.releaseLock();}
}
function aydaFeedbackReply_(user,p){
 if(user.role!=='admin')throw Error('Yönetici yetkisi gerekir.');
 const id=String((p||{}).id||''),reply=String((p||{}).reply||'').trim();
 const status=String((p||{}).status||'İncelendi');
 if(!['Yeni','İncelendi','Yanıtlandı','Kapatıldı'].includes(status))throw Error('Durum geçersiz.');
 if(reply.length>1400)throw Error('Yanıt çok uzun.');
 const lock=LockService.getScriptLock();lock.waitLock(20000);
 try{
  const sh=aydaFeedbackSheet_(),rows=sh.getDataRange().getDisplayValues(),h=rows[0].map(String);
  const idx=rows.findIndex((r,i)=>i>0&&r[h.indexOf('GERI_BILDIRIM_ID')]===id);
  if(idx<1)throw Error('Mesaj bulunamadı.');
  for(const col of ['DURUM','INCELEME_ZAMANI','YONETICI_YANITI'])if(h.indexOf(col)<0)throw Error('Geri bildirim sütunu eksik: '+col);
  sh.getRange(idx+1,h.indexOf('DURUM')+1).setValue(status);
  sh.getRange(idx+1,h.indexOf('INCELEME_ZAMANI')+1).setValue(new Date());
  sh.getRange(idx+1,h.indexOf('YONETICI_YANITI')+1).setValue(/^[=+@-]/.test(reply)?"'"+reply:reply);
  return {saved:true,id,status};
 }finally{lock.releaseLock();}
}
function aydaTeacherMonthly_(user,p){
 if(user.role!=='teacher')throw Error('Öğretmen oturumu gerekir.');
 const month=String((p||{}).month||aydaToday_().slice(0,7));
 if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(month))throw Error('Ay biçimi geçersiz.');
 const from=month+'-01',monthDate=new Date(month+'-01T00:00:00Z');
 const last=new Date(Date.UTC(monthDate.getUTCFullYear(),monthDate.getUTCMonth()+1,0));
 const to=last.toISOString().slice(0,10);
 const weekday=['Pazar','Pazartesi','Salı','Çarşamba','Perşembe','Cuma','Cumartesi'];
 const groups=aydaGroups_(user).filter(g=>g.status==='Aktif'),byGroup=new Map(groups.map(g=>[g.id,g]));
 const schedule=aydaSchedule_(groups),seen=new Set();const plannedByGroup=new Map(),unplanned=[];
 for(const item of schedule){const g=byGroup.get(item.groupId);if(!g)continue;
  for(let day=1;day<=last.getUTCDate();day++){
   const d=new Date(Date.UTC(monthDate.getUTCFullYear(),monthDate.getUTCMonth(),day));
   if(weekday[d.getUTCDay()]!==item.day)continue;
   const date=d.toISOString().slice(0,10);
   if(g.start&&date<g.start||g.end&&date>g.end)continue;
   const key=g.id+'|'+date+'|'+item.start;if(seen.has(key))continue;seen.add(key);
   plannedByGroup.set(g.id,(plannedByGroup.get(g.id)||0)+1);
  }
 }
 const history=aydaRead_('DERS_KAYITLARI').filter(r=>r['Öğretmen ID']===user.id&&aydaDate_(r['Tarih'])>=from&&aydaDate_(r['Tarih'])<=to);
 const completed=history.filter(r=>r['Durum']==='İşlendi');
 const cancelledRecords=history.filter(r=>r['Durum']==='İptal');
 const postponedRecords=history.filter(r=>r['Durum']==='Ertelendi');
 const privateLessons=aydaPrivateHistory_(user).filter(r=>r.date>=from&&r.date<=to&&r.status==='İşlendi');
 const hours=s=>{const m=String(s||'').match(/^(\d{1,2}):(\d{2})/);return m?(+m[1])+(+m[2])/60:0;};
 const planned=[...plannedByGroup.values()].reduce((a,b)=>a+b,0);
 return {month,planned,completed:completed.length,cancelled:cancelledRecords.length,postponed:postponedRecords.length,
  privateCompleted:privateLessons.length,remaining:Math.max(0,planned-completed.length-cancelledRecords.length),
  hours:Math.round(100*(completed.reduce((a,r)=>a+hours(r['Gerçekleşen Ders Saati']),0)
  +privateLessons.reduce((a,r)=>a+hours(r.actual),0)))/100,
  byGroup:groups.map(g=>({id:g.id,name:g.name,planned:plannedByGroup.get(g.id)||0,
   done:completed.filter(r=>r['Grup ID']===g.id).length})),
  note:'Planlanan sayısı, mevcut haftalık program ve grup tarihlerine göredir. Tatil/öğretmen devri otomatik tahmin edilmez.'};
}
/** İşlenmiş dersler için sonradan tamamlama. Ödev isteğe bağlıdır; asla eksik ders uyarısı değildir. */
function aydaMakeupList_(user){
 if(user.role!=='teacher')throw Error('Öğretmen oturumu gerekir.');
 const groups=aydaGroups_(user).filter(g=>g.status==='Aktif'),groupNames=new Map(groups.map(g=>[g.id,g.name]));
 const today=aydaToday_(),cutoff=new Date(today+'T00:00:00Z');
 cutoff.setUTCDate(cutoff.getUTCDate()-45);const min=cutoff.toISOString().slice(0,10);
 const lessons=aydaRead_('DERS_KAYITLARI').filter(r=>groupNames.has(r['Grup ID'])&&r['Durum']==='İşlendi'&&aydaDate_(r['Tarih'])>=min&&aydaDate_(r['Tarih'])<=today);
 const attendance=aydaRead_('YOKLAMA'),homeworks=aydaRead_('ODEV_TAKIBI');
 const byLesson=new Map();for(const r of attendance){const key=r['GRUP_ID']+'|'+aydaDate_(r['TARIH']);if(!byLesson.has(key))byLesson.set(key,[]);byLesson.get(key).push(r);}
 const hwLessons=new Set(homeworks.map(r=>r['GRUP_ID']+'|'+aydaDate_(r['TARIH'])));
 const roster=aydaStudentRoster_(user),byStudents=new Map();
 for(const r of roster){if(!byStudents.has(r.groupId))byStudents.set(r.groupId,new Map());byStudents.get(r.groupId).set(r.id,r.name);}
 const missingAttendance=[],optionalHomework=[];
 for(const r of lessons){
  const groupId=r['Grup ID'],date=aydaDate_(r['Tarih']),key=groupId+'|'+date,att=byLesson.get(key)||[];
  const common={groupId,group:groupNames.get(groupId),date,lessonId:r['Kayıt ID']};
  if(!aydaAttendanceComplete_(Array.from(byStudents.get(groupId)?.keys()||[]),att)){missingAttendance.push(common);continue;}
  if(hwLessons.has(key))continue;
  const days=(new Date(today+'T00:00:00Z')-new Date(date+'T00:00:00Z'))/86400000;
  if(days>21)continue;
  optionalHomework.push({...common,students:att.map(v=>({id:v['OGRENCI_ID'],name:byStudents.get(groupId)?.get(v['OGRENCI_ID'])||'Öğrenci',
   present:v['KATILIM']==='Geldi',excused:v['MAZERETLI']==='Evet'}))});
 }
 missingAttendance.sort((a,b)=>b.date.localeCompare(a.date));optionalHomework.sort((a,b)=>b.date.localeCompare(a.date));
 return {missingAttendance:missingAttendance.slice(0,35),optionalHomework:optionalHomework.slice(0,30),
  attendanceTotal:missingAttendance.length,homeworkOptionsTotal:optionalHomework.length,
  scope:'own'};
}
function aydaSaveHomework_(user,p){
 if(user.role!=='teacher')throw Error('Öğretmen girişi gerekli.');
 const gid=String((p||{}).groupId||''),date=String((p||{}).date||''),answers=(p||{}).answers;
 if(!aydaValidateDate_(date)||date>aydaToday_())throw Error('Tarih geçersiz.');
 if(!aydaGroups_(user).some(g=>g.id===gid&&g.status==='Aktif'))throw Error('Bu grupta yetkiniz yok.');
 if(!Array.isArray(answers)||!answers.length)throw Error('Ödev kontrol listesi boş.');
 const lock=LockService.getScriptLock();lock.waitLock(20000);
 try{
  const lesson=aydaRead_('DERS_KAYITLARI').find(r=>r['Grup ID']===gid&&aydaDate_(r['Tarih'])===date&&r['Durum']==='İşlendi');
  if(!lesson)throw Error('Bu tarihin işlenmiş ders raporu bulunamadı.');
  if(aydaRead_('ODEV_TAKIBI').some(r=>r['GRUP_ID']===gid&&aydaDate_(r['TARIH'])===date))
   throw Error('Bu dersin ödev kontrolü zaten kayıtlı. Mükerrer kayıt önlendi.');
  const presentRows=aydaRead_('YOKLAMA').filter(r=>r['GRUP_ID']===gid&&aydaDate_(r['TARIH'])===date);
  if(!presentRows.length)throw Error('Bu derse ait yoklama bulunamadı.');
  const allowed=new Map(presentRows.map(r=>[r['OGRENCI_ID'],r['KATILIM']==='Geldi']));
  const submitted=new Set();let marked=0;
  for(const a of answers){
   const id=String((a||{}).studentId||''),status=String((a||{}).status||'');
   if(!allowed.has(id)||submitted.has(id))throw Error('Öğrenci listesi güncellendi. Sayfayı yenileyin.');
   if(!['Yaptı','Yapmadı','Kontrol edilmedi'].includes(status))throw Error('Ödev durumu geçersiz.');
   if(!allowed.get(id)&&status!=='Kontrol edilmedi')throw Error('Gelmeyen öğrenci için ödev kontrolü yapılamaz.');
   if(status!=='Kontrol edilmedi')marked++;
   submitted.add(id);
  }
  if(submitted.size!==allowed.size)throw Error('Ödev kontrolü öğrenci listesinde eksik satır var.');
  if(!marked)throw Error('En az bir öğrenci için ödev kontrol sonucu işaretleyin.');
  const sh=aydaTrackingHeaders_('ODEV_TAKIBI',['ODEV_KAYIT_ID','DERS_KAYIT_ID','TARIH','GRUP_ID','OGRENCI_ID','ODEV_DURUMU','OGRETMEN_ID','KAYIT_ZAMANI']);
  const time=new Date(),rows=answers.map(a=>sh.header.map(k=>({
    ODEV_KAYIT_ID:'OV-'+Utilities.getUuid(),DERS_KAYIT_ID:lesson['Kayıt ID'],TARIH:date,GRUP_ID:gid,
    OGRENCI_ID:a.studentId,ODEV_DURUMU:a.status,OGRETMEN_ID:user.id,KAYIT_ZAMANI:time
   }[k]??'')));
  sh.sheet.getRange(sh.sheet.getLastRow()+1,1,rows.length,sh.header.length).setValues(rows);
  return {saved:true,groupId:gid,date,marked};
 }finally{lock.releaseLock();}
}


/** İsteğe bağlı ödev görevleri: günlük yoklama/ödev kontrolünden ayrı, teslim tarihli grup çalışmaları. */
function aydaHomeworkTasks_(user){
 if(!['teacher','admin'].includes(user.role))throw Error('Giriş gerekli.');
 const groups=aydaGroups_(user),allowed=new Map(groups.map(g=>[g.id,g]));
 const today=aydaToday_();
 const extensions=new Map();
 for(const h of aydaRead_('ODEV_GOREV_GECMISI')){
  if(h['ISLEM_TURU']!=='Ek süre')continue;
  const id=h['GOREV_ID'],item=extensions.get(id)||{count:0,days:0};
  const oldDate=aydaDate_(h['ESKI_TESLIM_TARIHI']),newDate=aydaDate_(h['YENI_TESLIM_TARIHI']);
  const diff=oldDate&&newDate?(new Date(newDate+'T12:00:00Z')-new Date(oldDate+'T12:00:00Z'))/86400000:0;
  item.count++;item.days+=Number.isFinite(diff)&&diff>0?diff:0;
  extensions.set(id,item);
 }
 const tasks=aydaRead_('ODEV_GOREVLERI').filter(r=>allowed.has(r['GRUP_ID']))
  .map(r=>({
   id:r['GOREV_ID'],groupId:r['GRUP_ID'],group:allowed.get(r['GRUP_ID']).name,
   teacherId:r['OGRETMEN_ID'],title:r['BASLIK'],description:r['ACIKLAMA'],
   createdDate:aydaDate_(r['VERILIS_TARIHI']),dueDate:aydaDate_(r['TESLIM_TARIHI']),
   status:r['DURUM'],updatedAt:r['GUNCELLEME_ZAMANI'],
   extensionCount:extensions.get(r['GOREV_ID'])?.count||0,extraDays:extensions.get(r['GOREV_ID'])?.days||0,
   overdue:r['DURUM']==='Aktif'&&aydaDate_(r['TESLIM_TARIHI'])<today
  })).sort((a,b)=>a.status.localeCompare(b.status,'tr')||a.dueDate.localeCompare(b.dueDate));
 return {tasks:tasks.slice(0,180),total:tasks.length,overdue:tasks.filter(t=>t.overdue).length,scope:user.role==='admin'?'all':'own',today};
}
function aydaHomeworkSafeText_(text){
 const s=String(text||'').trim();
 return /^[=+@-]/.test(s)?"'"+s:s;
}
function aydaHomeworkPlusDays_(date,days){
 const d=new Date(String(date)+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+Number(days));return d.toISOString().slice(0,10);
}
function aydaSaveHomeworkTask_(user,p){
 if(user.role!=='teacher')throw Error('Görevi yalnızca yetkili öğretmen ekleyebilir.');
 if(!p||typeof p!=='object')throw Error('Ödev bilgileri eksik.');
 const groupId=String(p.groupId||'').trim(),title=String(p.title||'').trim(),
  description=String(p.description||'').trim(),dueDate=String(p.dueDate||'').trim(),today=aydaToday_();
 if(!aydaGroups_(user).some(g=>g.id===groupId&&g.status==='Aktif'))throw Error('Bu grupta görev oluşturma yetkiniz yok.');
 if(title.length<4||title.length>150||description.length>1000)throw Error('Ödev başlığı 4–150, açıklama en fazla 1000 karakter olmalı.');
 if(!aydaValidateDate_(dueDate)||dueDate<today||dueDate>aydaHomeworkPlusDays_(today,90))throw Error('Teslim tarihi bugünden sonraki 90 gün içinde olmalı.');
 const lock=LockService.getScriptLock();lock.waitLock(20000);
 try{
  const id='HG-'+Utilities.getUuid();
  aydaAppendNamed_('ODEV_GOREVLERI',{
   GOREV_ID:id,GRUP_ID:groupId,OGRETMEN_ID:user.id,BASLIK:aydaHomeworkSafeText_(title),
   ACIKLAMA:aydaHomeworkSafeText_(description),VERILIS_TARIHI:today,TESLIM_TARIHI:dueDate,
   DURUM:'Aktif',OLUSTURMA_ZAMANI:new Date(),GUNCELLEME_ZAMANI:new Date()
  });
  return {saved:true,id,groupId,dueDate};
 }finally{lock.releaseLock();}
}
function aydaUpdateHomeworkTask_(user,p){
 if(user.role!=='teacher')throw Error('Ödev teslim süresini yalnızca öğretmen değiştirebilir.');
 if(!p||typeof p!=='object')throw Error('Güncelleme bilgisi eksik.');
 const id=String(p.id||'').trim(),kind=String(p.kind||'').trim(),today=aydaToday_();
 if(!['extend','complete','reactivate'].includes(kind))throw Error('Geçersiz ödev işlemi.');
 const days=Number(p.days||0);
 if(kind==='extend'&&(!Number.isInteger(days)||days<1||days>30))throw Error('Ek süre 1–30 gün olmalı.');
 const lock=LockService.getScriptLock();lock.waitLock(20000);
 try{
  const sh=aydaSheet_('ODEV_GOREVLERI'),v=sh.getDataRange().getDisplayValues(),h=v[0].map(String),
   ic=h.indexOf('GOREV_ID'),ix=v.findIndex((r,i)=>i>0&&r[ic]===id);
  if(ic<0||ix<1)throw Error('Ödev bulunamadı.');
  const r=Object.fromEntries(h.map((key,i)=>[key,v[ix][i]]));
  const group=aydaGroups_(user).find(g=>g.id===r['GRUP_ID']&&g.status==='Aktif');
  if(!group)throw Error('Bu ödeve işlem yapma yetkiniz yok.'); // Grup yeni öğretmene devredildiyse görev yönetimi yeni yetkiliye geçer.
  if(kind==='extend'&&r['DURUM']!=='Aktif')throw Error('Yalnızca aktif ödevin teslim tarihi uzatılabilir.');
  const oldDate=aydaDate_(r['TESLIM_TARIHI']),newDate=kind==='extend'?aydaHomeworkPlusDays_(oldDate,days):oldDate;
  if(kind==='extend'&&(!aydaValidateDate_(newDate)||newDate<=oldDate||newDate>aydaHomeworkPlusDays_(today,90)))
   throw Error('Uzatılan teslim tarihi en fazla 90 gün ileriye alınabilir.');
  const updatedStatus=kind==='complete'?'Tamamlandı':kind==='reactivate'?'Aktif':r['DURUM'];
  if(updatedStatus===r['DURUM']&&newDate===oldDate)return {saved:true,unchanged:true,id};
  const dcol=h.indexOf('TESLIM_TARIHI'),scol=h.indexOf('DURUM'),tcol=h.indexOf('GUNCELLEME_ZAMANI');
  if([dcol,scol,tcol].some(n=>n<0))throw Error('Ödev tablosunda sütun eksik.');
  const row=ix+1;
  try{
   sh.getRange(row,dcol+1).setValue(newDate);
   sh.getRange(row,scol+1).setValue(updatedStatus);
   sh.getRange(row,tcol+1).setValue(new Date());
   aydaAppendNamed_('ODEV_GOREV_GECMISI',{
    ISLEM_ID:'HGI-'+Utilities.getUuid(),GOREV_ID:id,ESKI_TESLIM_TARIHI:oldDate,
    YENI_TESLIM_TARIHI:newDate,ISLEM_TURU:kind==='extend'?'Ek süre':kind==='complete'?'Tamamlandı':'Yeniden açıldı',
    OGRETMEN_ID:user.id,ACIKLAMA:kind==='extend'?days+' gün ek süre':'Durum güncellendi',ZAMAN:new Date()
   });
  }catch(e){
   sh.getRange(row,dcol+1).setValue(oldDate);
   sh.getRange(row,scol+1).setValue(r['DURUM']);
   sh.getRange(row,tcol+1).setValue(r['GUNCELLEME_ZAMANI']);
   throw Error('Ödev güncellenemedi: '+e.message);
  }
  return {saved:true,id,dueDate:newDate,status:updatedStatus};
 }finally{lock.releaseLock();}
}

function aydaSetPassword_(user,p){
  if(!p||typeof p!=='object')throw Error('Parola bilgileri eksik.');
  const target=String(p.target||'').trim(),password=String(p.password||'');
  let accountId=target;
  const teachers=aydaRead_('KULLANICILAR').filter(a=>a['Rol']==='Öğretmen'&&a['Durum']==='Aktif');
  const ownAccount=user.role==='admin'?'ADMIN':String(user.accountId||'');
  if(user.role!=='admin'&&target&&target!==ownAccount)throw Error('Başkasının parolasını değiştiremezsiniz.');
  if(!accountId)accountId=ownAccount;
  if(!accountId)throw Error('Hesabınız bulunamadı.');
  if(accountId!=='ADMIN'&&!teachers.some(a=>a['Kullanıcı ID']===accountId))throw Error('Aktif hesap bulunamadı.');
  if(user.role!=='admin'&&accountId!==ownAccount)throw Error('Yetkisiz parola işlemi.');
  // Yönetici ve öğretmen hesaplarında en az 3 karakter yeterli;
  // rakam, harf, özel karakter veya belirli bir desen zorunlu değildir.
  // Giriş API'sinin 150 karakterlik teknik üst sınırıyla uyumlu tutulur.
  if(password.length<3||password.length>150)
    throw Error('Yeni parola en az 3, en fazla 150 karakter olmalı.');
  const props=PropertiesService.getScriptProperties(),field=accountId==='ADMIN'?'AYDA_ADMIN_HASH':'AYDA_GIRIS_'+accountId;
  const lock=LockService.getScriptLock();lock.waitLock(20000);
  try{
    props.setProperty(field,aydaHash_(password));
    // Eski, uzun anahtarlar arşivde "güncel" olarak görünmesin. Yeni parola arşive yazılmaz.
    const vaultId=props.getProperty('AYDA_VAULT_SPREADSHEET_ID');
    if(vaultId){
      try{const sh=SpreadsheetApp.openById(vaultId).getSheetByName('ANAHTARLAR');if(sh&&sh.getLastRow()>1){
        const ids=sh.getRange(2,1,sh.getLastRow()-1,1).getDisplayValues();
        ids.forEach((r,i)=>{if(r[0]===accountId)sh.getRange(i+2,6).setValue('Eski / geçersiz');});
      }}catch(err){Logger.log('Arşiv uyarısı: '+err.message);}
    }
    return {updated:true,target:accountId,isSelf:accountId===ownAccount};
  }finally{lock.releaseLock();}
}

/** Anonim, salt-okunur pano. DÖNEN HER ALAN İNTERNETE AÇIKTIR.
 * Öğrenci adları, hesaplar, anahtarlar, özel ders öğrenci isimleri ve öğretmen özel notları dışarı verilmez.
 */
function aydaPublicDashboard_(){
  const admin={role:'admin',id:'ADMIN',name:'Yönetici'};
  const groups=aydaGroups_(admin).map(g=>({id:g.id,name:g.name,level:g.level,teacherId:g.teacherId,start:g.start,end:g.end,completed:g.completed,total:24,status:g.status,students:Number(g.students)||0}));
  const schedule=aydaSchedule_(groups).map(p=>({groupId:p.groupId,day:p.day,status:p.status,start:p.start,end:p.end}));
  const history=aydaHistory_(admin,groups).map(r=>({date:r.date,groupId:r.groupId,teacherId:r.teacherId,actual:r.actual,status:r.status,completed:r.completed}));
  // Özel dersin öğrenci adını, notunu veya diğer özel bilgisini paylaşma.
  const privateHistory=aydaPrivateHistory_(admin).map(r=>({date:r.date,teacherId:r.teacherId,actual:r.actual,status:r.status}));
  const teachers=aydaTeachers_().filter(t=>t.status==='Aktif').map(t=>({id:t.id,name:t.name}));
  return {user:{role:'public',name:'AYDA Akademik Pano'},today:aydaToday_(),groups,schedule,history,privateHistory,teachers};
}

/** Elle çalıştırılabilir kurulum testi: Google yetkilendirmesini tamamlar. */
function aydaHealthCheck(){
  const db=aydaDb_();
  const required=['GRUPLAR','KULLANICILAR','DERS_KAYITLARI','OGRENCILER','YOKLAMA','ODEV_TAKIBI','ODEV_GOREVLERI','ODEV_GOREV_GECMISI','DERS_ODEVLERI','OGRETMEN_GERI_BILDIRIM'];
  const missing=required.filter(name=>!db.getSheetByName(name));
  if(missing.length)throw Error('Eksik Google Sheets sekmeleri: '+missing.join(', '));
  const result={ok:true,version:'2026-10-19.8',sheetCount:db.getSheets().length,groups:Math.max(0,db.getSheetByName('GRUPLAR').getLastRow()-1),students:Math.max(0,db.getSheetByName('OGRENCILER').getLastRow()-1)};
  Logger.log(JSON.stringify(result));
  return result;
}

/** Ayrı Google Drive dosyasında, silinmeden saklanan tam veritabanı kopyası. */
function aydaBackupNow_(){
 const lock=LockService.getScriptLock();lock.waitLock(20000);
 const props=PropertiesService.getScriptProperties();
 try{
  const folderId=props.getProperty('AYDA_BACKUP_FOLDER_ID');
  let folder=folderId?DriveApp.getFolderById(folderId):null;
  if(!folder){folder=DriveApp.createFolder('AYDA - Akademik Takip Otomatik Yedekler');props.setProperty('AYDA_BACKUP_FOLDER_ID',folder.getId());}
  SpreadsheetApp.flush();
  const source=aydaDb_(),required=['GRUPLAR','KULLANICILAR','HAFTALIK_PROGRAM','DERS_KAYITLARI','OGRENCILER','YOKLAMA','ODEV_TAKIBI','ODEV_GOREVLERI','ODEV_GOREV_GECMISI','DERS_ODEVLERI'];
  const counts={};
  for(const name of required)if(!source.getSheetByName(name))throw Error('Yedekleme öncesi eksik tablo: '+name);
  for(const sheet of source.getSheets())counts[sheet.getName()]=sheet.getLastRow();
  const now=new Date(),stamp=Utilities.formatDate(now,AYDA_TZ,'yyyy-MM-dd_HH-mm-ss');
  const copy=DriveApp.getFileById(AYDA_DB_ID).makeCopy('AYDA-KAYIT-TAM-YEDEK-'+stamp,folder);
  const replica=SpreadsheetApp.openById(copy.getId());
  for(const name of Object.keys(counts)){const sheet=replica.getSheetByName(name);if(!sheet||sheet.getLastRow()!==counts[name])throw Error('Yedek kontrolü başarısız: '+name);}
  props.setProperties({AYDA_LAST_BACKUP_ID:copy.getId(),AYDA_LAST_BACKUP_AT:Utilities.formatDate(now,AYDA_TZ,"yyyy-MM-dd'T'HH:mm:ss"),AYDA_LAST_BACKUP_ERROR:''});
  return {ok:true,at:props.getProperty('AYDA_LAST_BACKUP_AT'),fileId:copy.getId(),sheets:Object.keys(counts).length,verified:true};
 }catch(error){
  props.setProperty('AYDA_LAST_BACKUP_ERROR',String(error.message||error).slice(0,350));
  throw error;
 }finally{lock.releaseLock();}
}
function aydaDailyBackupTrigger(){return aydaBackupNow_();}
function aydaBackupSetup_(user){
 if(user.role!=='admin')throw Error('Yalnızca yönetici yedeklemeyi kurabilir.');
 const first=aydaBackupNow_();
 const triggers=ScriptApp.getProjectTriggers().filter(t=>t.getHandlerFunction()==='aydaDailyBackupTrigger');
 if(!triggers.length)ScriptApp.newTrigger('aydaDailyBackupTrigger').timeBased().atHour(3).everyDays(1).inTimezone(AYDA_TZ).create();
 return {...first,daily:true};
}
function aydaBackupStatus_(user){
 if(user.role!=='admin')throw Error('Yönetici yetkisi gerekli.');
 const props=PropertiesService.getScriptProperties();
 const id=props.getProperty('AYDA_LAST_BACKUP_ID')||'';
 const installed=ScriptApp.getProjectTriggers().some(t=>t.getHandlerFunction()==='aydaDailyBackupTrigger');
 let exists=false;
 if(id){try{exists=!!DriveApp.getFileById(id).getId();}catch(_){}}
 return {installed,exists,at:props.getProperty('AYDA_LAST_BACKUP_AT')||'',error:props.getProperty('AYDA_LAST_BACKUP_ERROR')||''};
}

/** Salt-okunur, yöneticiye özel veri bütünlüğü sayacı; kişisel kayıt içermez. */
function aydaIntegrityStatus_(user){
 if(user.role!=='admin')throw Error('Veri kontrolünü yalnızca yönetici yapabilir.');
 const required=['GRUPLAR','HAFTALIK_PROGRAM','DERS_KAYITLARI','OGRENCILER','YOKLAMA','DERS_ODEVLERI','ODEV_TAKIBI','ODEV_GOREVLERI'];
 const counts={},issues=[],db=aydaDb_();
 for(const name of required){
  const sheet=db.getSheetByName(name);
  if(!sheet){issues.push('Eksik tablo: '+name);continue;}
  counts[name]=Math.max(0,sheet.getLastRow()-1);
 }
 if(issues.length)return {ok:false,issues,counts,checkedAt:Utilities.formatDate(new Date(),AYDA_TZ,'yyyy-MM-dd HH:mm')};
 const groups=aydaRead_('GRUPLAR'),lessons=aydaRead_('DERS_KAYITLARI'),att=aydaRead_('YOKLAMA');
 const names=new Set(groups.map(g=>String(g['ID']))),ids=new Set(),keys=new Set();
 let duplicateLessons=0,orphanLessons=0,orphanAttendance=0,duplicateAttendance=0,incompleteAttendance=0,orphanHomework=0;
 for(const lesson of lessons){
  const id=String(lesson['Kayıt ID']||''),key=String(lesson['Grup ID']||'')+'|'+aydaDate_(lesson['Tarih']);
  if(!id||ids.has(id)||keys.has(key))duplicateLessons++;
  ids.add(id);keys.add(key);
  if(!names.has(String(lesson['Grup ID']||'')))orphanLessons++;
 }
 const attendance=new Map();
 for(const row of att){
  const id=String(row['DERS_KAYIT_ID']||''),student=String(row['OGRENCI_ID']||'');
  if(!ids.has(id))orphanAttendance++;
  if(!attendance.has(id))attendance.set(id,new Set());
  const seen=attendance.get(id);
  if(!student||seen.has(student))duplicateAttendance++;
  seen.add(student);
 }
 const roster=new Map();
 for(const s of aydaRead_('OGRENCILER')){
  const key=String(s['GRUP_ID']||'');
  if(!roster.has(key))roster.set(key,new Set());
  roster.get(key).add(String(s['OGRENCI_ID']||''));
 }
 for(const lesson of lessons){
  const date=aydaDate_(lesson['Tarih']),gid=String(lesson['Grup ID']||'');
  if(lesson['Durum']!=='İşlendi'||date<AYDA_TRACKING_START)continue;
  const expected=roster.get(gid),actual=attendance.get(String(lesson['Kayıt ID']||''));
  if(expected&&expected.size&&(!actual||expected.size!==actual.size||[...expected].some(id=>!actual.has(id))))incompleteAttendance++;
 }
 for(const row of aydaRead_('DERS_ODEVLERI'))if(!ids.has(String(row['DERS_KAYIT_ID']||'')))orphanHomework++;
 for(const [count,label] of [[duplicateLessons,'Mükerrer ders kaydı'],[orphanLessons,'Grubu bulunmayan ders'],[orphanAttendance,'Derse bağlı olmayan yoklama'],[duplicateAttendance,'Mükerrer öğrenci yoklaması'],[incompleteAttendance,'Eksik öğrenci yoklaması'],[orphanHomework,'Derse bağlı olmayan ödev']])if(count)issues.push(label+': '+count);
 return {ok:issues.length===0,issues,counts,checkedAt:Utilities.formatDate(new Date(),AYDA_TZ,'yyyy-MM-dd HH:mm')};
}

function doGet(e){
  const p=e&&e.parameter||{},cb=String(p.callback||'');
  if(!/^ayda_cb_[A-Za-z0-9_]{1,64}$/.test(cb))return ContentService.createTextOutput('Invalid callback').setMimeType(ContentService.MimeType.TEXT);
  let out;
  try{
    const action=String(p.action||'overview');
    if(action==='ping'){out={ok:true,data:{status:'ok',version:'2026-10-19.8'}};}
    else if(action==='publicDashboard'){out={ok:true,data:aydaPublicDashboard_()};}
    else if(action==='publicTrackingDashboard'){out={ok:false,error:'Öğrenci bilgileri anonim erişime kapalı.'};}
    else {const user=aydaAuth_(p.key);
    if(action==='overview')out={ok:true,data:aydaOverview_(user)};
    else if(action==='createTeacher')out={ok:true,data:aydaAdminCreateTeacher_(user,JSON.parse(Utilities.newBlob(Utilities.base64DecodeWebSafe(String(p.payload||''))).getDataAsString('UTF-8')))};
    else if(action==='createGroup')out={ok:true,data:aydaAdminCreateGroup_(user,JSON.parse(Utilities.newBlob(Utilities.base64DecodeWebSafe(String(p.payload||''))).getDataAsString('UTF-8')))};
    else if(action==='updateGroup')out={ok:true,data:aydaAdminSetGroup_(user,JSON.parse(Utilities.newBlob(Utilities.base64DecodeWebSafe(String(p.payload||''))).getDataAsString('UTF-8')))};
    else if(action==='rotateKey')out={ok:true,data:aydaRotateKey_(user,p.target)};
    else if(action==='vaultExport')out={ok:true,data:{rows:aydaVaultRows_(user)}};
    else if(action==='studentRoster')out={ok:true,data:{students:aydaStudentRoster_(user)}};
    else if(action==='trackingSummary')out={ok:true,data:aydaTrackingSummary_(user)};
    else if(action==='reminders')out={ok:true,data:aydaReminders_(user)};
    else if(action==='integrityStatus')out={ok:true,data:aydaIntegrityStatus_(user)};
    else if(action==='backupStatus')out={ok:true,data:aydaBackupStatus_(user)};
    else if(action==='backupSetup')out={ok:true,data:aydaBackupSetup_(user)};
    else if(action==='studentNotes')out={ok:true,data:aydaStudentNotes_(user,{studentId:p.studentId})};
    else if(action==='saveStudentNote')out={ok:true,data:aydaSaveStudentNote_(user,JSON.parse(Utilities.newBlob(Utilities.base64DecodeWebSafe(String(p.payload||''))).getDataAsString('UTF-8')))};
    else if(action==='saveAttendance')out={ok:true,data:aydaSaveAttendance_(user,JSON.parse(Utilities.newBlob(Utilities.base64DecodeWebSafe(String(p.payload||''))).getDataAsString('UTF-8')))};
    else if(action==='updateReport')out={ok:true,data:aydaUpdateReport_(user,JSON.parse(Utilities.newBlob(Utilities.base64DecodeWebSafe(String(p.payload||''))).getDataAsString('UTF-8')))};
    else if(action==='setFollowup')out={ok:true,data:aydaSetFollowup_(user,JSON.parse(Utilities.newBlob(Utilities.base64DecodeWebSafe(String(p.payload||''))).getDataAsString('UTF-8')))};
    else if(action==='contactDirectory')out={ok:true,data:aydaContactDirectory_(user)};
    else if(action==='updateContact')out={ok:true,data:aydaUpdateContact_(user,JSON.parse(Utilities.newBlob(Utilities.base64DecodeWebSafe(String(p.payload||''))).getDataAsString('UTF-8')))};
    else if(action==='teacherMonthly')out={ok:true,data:aydaTeacherMonthly_(user,{month:p.month})};
    else if(action==='makeupList')out={ok:true,data:aydaMakeupList_(user)};
    else if(action==='homeworkTasks')out={ok:true,data:aydaHomeworkTasks_(user)};
    else if(action==='lessonHomework')out={ok:true,data:aydaLessonHomework_(user)};
    else if(action==='confirmHomeworkShare')out={ok:true,data:aydaConfirmHomeworkShare_(user,JSON.parse(Utilities.newBlob(Utilities.base64DecodeWebSafe(String(p.payload||''))).getDataAsString('UTF-8')))};
    else if(action==='saveHomeworkTask')out={ok:true,data:aydaSaveHomeworkTask_(user,JSON.parse(Utilities.newBlob(Utilities.base64DecodeWebSafe(String(p.payload||''))).getDataAsString('UTF-8')))};
    else if(action==='updateHomeworkTask')out={ok:true,data:aydaUpdateHomeworkTask_(user,JSON.parse(Utilities.newBlob(Utilities.base64DecodeWebSafe(String(p.payload||''))).getDataAsString('UTF-8')))};
    else if(action==='teacherFeedback')out={ok:true,data:aydaTeacherFeedback_(user)};
    else if(action==='feedbackInbox')out={ok:true,data:aydaFeedbackInbox_(user)};
    else if(action==='saveFeedback')out={ok:true,data:aydaSaveFeedback_(user,JSON.parse(Utilities.newBlob(Utilities.base64DecodeWebSafe(String(p.payload||''))).getDataAsString('UTF-8')))};
    else if(action==='feedbackReply')out={ok:true,data:aydaFeedbackReply_(user,JSON.parse(Utilities.newBlob(Utilities.base64DecodeWebSafe(String(p.payload||''))).getDataAsString('UTF-8')))};
    else if(action==='saveHomework')out={ok:true,data:aydaSaveHomework_(user,JSON.parse(Utilities.newBlob(Utilities.base64DecodeWebSafe(String(p.payload||''))).getDataAsString('UTF-8')))};
    else if(action==='setPassword')out={ok:true,data:aydaSetPassword_(user,JSON.parse(Utilities.newBlob(Utilities.base64DecodeWebSafe(String(p.payload||''))).getDataAsString('UTF-8')))};
    else if(action==='save'){
      const input=JSON.parse(Utilities.newBlob(Utilities.base64DecodeWebSafe(String(p.payload||''))).getDataAsString('UTF-8'));
      out={ok:true,data:input.type==='private'?aydaPrivateSave_(user,input):aydaSave_(user,input)};
    }else throw Error('Bilinmeyen işlem.');
    }
  }catch(err){out={ok:false,error:String(err.message||err)};}
  return ContentService.createTextOutput(cb+'('+JSON.stringify(out).replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029')+');').setMimeType(ContentService.MimeType.JAVASCRIPT);
}