/** AYDA Akademik Takip API — Google Sheets / GitHub Pages */
const AYDA_DB_ID = '1Zf4w6FYBTR8u2pOUwjXKVvqQ1JFy0cufjA4fvchKJAw';
const AYDA_TZ = 'Europe/Istanbul';

function aydaDb_(){ return SpreadsheetApp.openById(AYDA_DB_ID); }
function aydaSheet_(name){ const s=aydaDb_().getSheetByName(name); if(!s) throw Error('Tablo bulunamadı: '+name); return s; }
function aydaRead_(name){ const v=aydaSheet_(name).getDataRange().getDisplayValues(); const h=(v.shift()||[]).map(x=>String(x).trim()); return v.filter(r=>r.some(Boolean)).map(r=>Object.fromEntries(h.map((k,i)=>[k,r[i]]).filter(x=>x[0]))); }
function aydaHash_(s){ return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,String(s),Utilities.Charset.UTF_8).map(b=>('0'+(b&255).toString(16)).slice(-2)).join(''); }
function aydaToday_(){return Utilities.formatDate(new Date(),AYDA_TZ,'yyyy-MM-dd');}
function aydaDate_(v){let s=String(v||'').trim(); let m=s.match(/^(\d{1,2})[./](\d{1,2})[./](\d{4})$/); if(m)return m[3]+'-'+m[2].padStart(2,'0')+'-'+m[1].padStart(2,'0'); return /^\d{4}-\d{2}-\d{2}$/.test(s)?s:'';}
function aydaWeekday_(s){const [y,m,d]=s.split('-').map(Number);return ['Pazar','Pazartesi','Salı','Çarşamba','Perşembe','Cuma','Cumartesi'][new Date(Date.UTC(y,m-1,d)).getUTCDay()];}
function aydaValidateDate_(s){if(!/^\d{4}-\d{2}-\d{2}$/.test(s))return false;const [y,m,d]=s.split('-').map(Number);const t=new Date(Date.UTC(y,m-1,d));return t.getUTCFullYear()===y&&t.getUTCMonth()===m-1&&t.getUTCDate()===d;}
function aydaAuth_(key){
  const token=String(key||'').trim();if(!token||token.length>150)throw Error('Parola veya giriş anahtarı eksik veya geçersiz.');
  const hash=aydaHash_(token),props=PropertiesService.getScriptProperties();
  if(props.getProperty('AYDA_ADMIN_HASH')===hash)return {role:'admin',id:'ADMIN',name:'Yönetici'};
  const u=aydaRead_('KULLANICILAR').find(x=>x['Rol']==='Öğretmen'&&x['Durum']==='Aktif'&&props.getProperty('AYDA_GIRIS_'+x['Kullanıcı ID'])===hash);
  if(!u)throw Error('Parola veya giriş anahtarı geçersiz ya da hesap pasif.');
  return {role:'teacher',id:u['Öğretmen ID'],accountId:u['Kullanıcı ID'],name:u['Kullanıcı Adı']};
}
function aydaGroups_(user){return aydaRead_('GRUPLAR').filter(g=>user.role==='admin'||(g['Öğretmen ID']===user.id&&g['Durum']==='Aktif')).map(g=>({id:g['ID'],name:g['Grup'],level:g['Seviye'],teacherId:g['Öğretmen ID'],start:aydaDate_(g['Başlangıç']),end:aydaDate_(g['Planlanan Bitiş']),students:g['Öğrenci'],completed:Number(g['Son Tamamlanan Ünite'])||0,total:Number(g['Toplam Ünite'])||0,status:g['Durum']}));}
function aydaSchedule_(groups){const ids=new Set(groups.map(g=>g.id)),map=Object.fromEntries(groups.map(g=>[g.id,g]));return aydaRead_('HAFTALIK_PROGRAM').filter(p=>ids.has(p['Grup ID'])&&(p['Durum']==='Aktif'||p['Durum']==='Eksik saat')).map(p=>({groupId:p['Grup ID'],group:map[p['Grup ID']].name,day:p['Gün'],start:p['Başlangıç'],end:p['Bitiş']||'Belirtilmemiş',status:p['Durum']}));}
function aydaHistory_(user,groups){const ids=new Set(groups.map(g=>g.id));return aydaRead_('DERS_KAYITLARI').filter(r=>ids.has(r['Grup ID'])&&(user.role==='admin'||r['Öğretmen ID']===user.id)).map(r=>({id:r['Kayıt ID'],date:aydaDate_(r['Tarih']),groupId:r['Grup ID'],teacherId:r['Öğretmen ID'],plannedStart:r['Planlanan Başlangıç'],plannedEnd:r['Planlanan Bitiş'],actual:r['Gerçekleşen Ders Saati'],status:r['Durum'],unit:r['İşlenen Ünite'],completed:r['Tamamlanan Ünite'],topic:r['İşlenen Konu'],note:r['Öğretmen Notu']})).sort((a,b)=>b.date.localeCompare(a.date));}
function aydaPrivateSheet_(){const db=aydaDb_();let s=db.getSheetByName('AYDA_OZEL_DERS_CIZELGESI');if(!s){s=db.insertSheet('AYDA_OZEL_DERS_CIZELGESI');s.appendRow(['Kayıt ID','Tarih','Öğretmen ID','Öğrenci','Gerçekleşen Ders Saati','Durum','İşlenen Ünite','Tamamlanan Ünite','İşlenen Konu','Öğretmen Notu','Kayıt Zamanı']);}return s;}
function aydaPrivateHistory_(user){const s=aydaDb_().getSheetByName('AYDA_OZEL_DERS_CIZELGESI');if(!s||s.getLastRow()<2)return [];const v=s.getDataRange().getDisplayValues(),h=v.shift().map(String);return v.filter(r=>user.role==='admin'||r[h.indexOf('Öğretmen ID')]===user.id).map(r=>{const x=Object.fromEntries(h.map((k,i)=>[k,r[i]]));return {id:x['Kayıt ID'],date:aydaDate_(x['Tarih']),teacherId:x['Öğretmen ID'],student:x['Öğrenci'],groupId:'',actual:x['Gerçekleşen Ders Saati'],status:x['Durum'],unit:x['İşlenen Ünite'],completed:x['Tamamlanan Ünite'],topic:x['İşlenen Konu'],note:x['Öğretmen Notu']};}).sort((a,b)=>b.date.localeCompare(a.date));}
function aydaPrivateSave_(user,p){if(user.role!=='teacher')throw Error('Özel ders kaydı için öğretmen girişi gerekir.');const date=String(p.date||''),student=String(p.student||'').trim(),topic=String(p.topic||'').trim(),note=String(p.note||'').trim(),actual=String(p.actual||''),status=String(p.status||'İşlendi');if(!aydaValidateDate_(date)||date>aydaToday_())throw Error('Geçersiz tarih.');if(!student||student.length>120||topic.length>300||note.length<3||note.length>2000)throw Error('Öğrenci adı veya not geçersiz.');if(!/^(?:\d|[01]\d|2[0-3]):[0-5]\d$/.test(actual))throw Error('Saat biçimi geçersiz.');if(!['İşlendi','İptal','Ertelendi'].includes(status))throw Error('Geçersiz durum.');const unit=Number(p.unit||0),completed=Number(p.completed||0);if(!Number.isInteger(unit)||unit<0||unit>100||!Number.isInteger(completed)||completed<0||completed>unit)throw Error('Ünite bilgisi geçersiz.');const lock=LockService.getScriptLock();lock.waitLock(20000);try{const s=aydaPrivateSheet_();const v=s.getDataRange().getDisplayValues();if(v.slice(1).some(r=>aydaDate_(r[1])===date&&r[2]===user.id&&r[3]===student))throw Error('Bu öğrenci için aynı gün kayıt var.');const id='OD-'+Utilities.getUuid();s.appendRow([id,date,user.id,student,actual,status,unit,completed,topic,note,new Date()]);return {saved:true,id};}finally{lock.releaseLock();}}
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
 try{const id=aydaNextId_('GRUPLAR','ID','G');aydaAppendNamed_('GRUPLAR',{'ID':id,'Grup':name,'Seviye':level,'Öğretmen ID':teacherId,'Başlangıç':start,'Planlanan Bitiş':'','Öğrenci':students,'Son Tamamlanan Ünite':completed,'Toplam Ünite':total,'Durum':'Aktif','WhatsApp':''});for(const day of days)aydaAppendNamed_('HAFTALIK_PROGRAM',{'Grup ID':id,'Gün':day,'Başlangıç':time,'Bitiş':end,'Durum':'Aktif'});return {id,name};}finally{lock.releaseLock();}
}
function aydaAdminSetGroup_(user,p){
 if(user.role!=='admin')throw Error('Yönetici yetkisi gerekir.');
 const id=String(p.id||''),completed=Number(p.completed),students=Number(p.students);
 if(!Number.isInteger(completed)||completed<0||completed>100||!Number.isInteger(students)||students<0||students>500)throw Error('Değerleri kontrol edin.');
 const lock=LockService.getScriptLock();lock.waitLock(20000);
 try{const sh=aydaSheet_('GRUPLAR'),rows=sh.getDataRange().getDisplayValues(),h=rows[0],ix=rows.findIndex((r,i)=>i>0&&r[h.indexOf('ID')]===id);if(ix<1)throw Error('Grup bulunamadı.');const total=Number(rows[ix][h.indexOf('Toplam Ünite')])||24;if(completed>total)throw Error('Tamamlanan ünite toplamı aşamaz.');sh.getRange(ix+1,h.indexOf('Son Tamamlanan Ünite')+1).setValue(completed);sh.getRange(ix+1,h.indexOf('Öğrenci')+1).setValue(students);return {id,completed,students};}finally{lock.releaseLock();}
}
function aydaOverview_(user){const groups=aydaGroups_(user),schedule=aydaSchedule_(groups),history=aydaHistory_(user,groups),today=aydaToday_(),day=aydaWeekday_(today);return {user,groups,schedule,history,privateHistory:aydaPrivateHistory_(user),today,todayLessons:schedule.filter(p=>{const g=groups.find(x=>x.id===p.groupId);return p.day===day&&g&&(!g.start||g.start<=today)&&(!g.end||g.end>=today);}),accounts:user.role==='admin'?aydaRead_('KULLANICILAR').filter(x=>x['Rol']==='Öğretmen').map(x=>({id:x['Kullanıcı ID'],name:x['Kullanıcı Adı'],status:x['Durum']})):[],teachers:user.role==='admin'?aydaTeachers_():[],vaultStatus:user.role==='admin'?aydaVaultStatus_(user):[]};}
function aydaSave_(user,p){
  if(!p||typeof p!=='object')throw Error('Rapor bilgileri eksik.');
  const groupId=String(p.groupId||'').trim(),date=String(p.date||'').trim(),topic=String(p.topic||'').trim(),note=String(p.note||'').trim(),unit=Number(p.unit),completed=Number(p.completed),actual=String(p.actual||'').trim(),status=String(p.status||'İşlendi');
  if(!aydaValidateDate_(date)||date>aydaToday_())throw Error('Geçerli bir geçmiş veya bugünkü tarih girin.');
  if(!Number.isInteger(unit)||unit<0||unit>100||!Number.isInteger(completed)||completed<0||completed>unit)throw Error('Ünite değerlerini kontrol edin.');
  if(topic.length>300||note.length<3||note.length>2000)throw Error('Konu veya not uzunluğu geçersiz.');
  if(actual&&!/^(?:\d|[01]\d|2[0-3]):[0-5]\d$/.test(actual))throw Error('Ders süresi SS:DD biçiminde olmalı.');
  if(!['İşlendi','İptal','Ertelendi'].includes(status))throw Error('Ders durumu geçersiz.');
  const lock=LockService.getScriptLock();lock.waitLock(20000);
  try{
    const group=aydaGroups_(user).find(g=>g.id===groupId);if(!group)throw Error('Bu grup için yetkiniz yok.');
    const s=aydaSheet_('DERS_KAYITLARI'),values=s.getDataRange().getDisplayValues(),h=values[0].map(x=>String(x).trim()),di=h.indexOf('Tarih'),gi=h.indexOf('Grup ID');
    if(di<0||gi<0)throw Error('DERS_KAYITLARI başlıkları eksik.');
    if(values.slice(1).some(r=>r[gi]===groupId&&aydaDate_(r[di])===date))throw Error('Bu grup ve tarihe ait rapor zaten var.');
    const plan=aydaSchedule_([group]).find(x=>x.day===aydaWeekday_(date));
    const record={'Kayıt ID':'DK-'+Utilities.getUuid(),'Tarih':date,'Grup ID':groupId,'Öğretmen ID':group.teacherId,'Planlanan Başlangıç':plan?plan.start:'','Planlanan Bitiş':plan&&plan.end!=='Belirtilmemiş'?plan.end:'','Gerçekleşen Ders Saati':actual,'Durum':status,'İşlenen Ünite':unit,'Tamamlanan Ünite':completed,'İşlenen Konu':topic,'Öğretmen Notu':note,'Kayıt Zamanı':new Date()};
    if(Object.keys(record).some(k=>!h.includes(k)))throw Error('DERS_KAYITLARI tablosunun başlıkları eksik.');
    // Öğrenci yoklaması gönderilmişse raporu kaydetmeden ÖNCE tüm öğrenci kimliklerini ve sütunları kontrol et.
    if(Object.prototype.hasOwnProperty.call(p,'attendance')&&!Array.isArray(p.attendance))throw Error('Yoklama biçimi geçersiz.');
    const hasTracking=Array.isArray(p.attendance);
    if(hasTracking&&status!=='İşlendi')throw Error('Yoklama yalnızca işlenen derse eklenebilir.');
    const entries=hasTracking?aydaTrackingPrepare_(user,groupId,p.attendance,p.homeworkEnabled===true):null;
    const yoklama=hasTracking?aydaTrackingHeaders_('YOKLAMA',['YOKLAMA_ID','DERS_KAYIT_ID','TARIH','GRUP_ID','OGRENCI_ID','KATILIM','MAZERETLI','OGRETMEN_ID','KAYIT_ZAMANI']):null;
    const odev=hasTracking&&p.homeworkEnabled===true?aydaTrackingHeaders_('ODEV_TAKIBI',['ODEV_KAYIT_ID','DERS_KAYIT_ID','TARIH','GRUP_ID','OGRENCI_ID','ODEV_DURUMU','OGRETMEN_ID','KAYIT_ZAMANI']):null;
    const rows=hasTracking?aydaTrackingRows_(entries,date,groupId,group.teacherId,record['Kayıt ID'],p.homeworkEnabled===true,yoklama.header,odev?odev.header:[]):null;
    // Tek işlem: önce ders, sonra yoklama ve ödev. Başarısızlıkta bu isteğin satırlarını geri al.
    const marks=[{sheet:s,last:s.getLastRow()}];
    if(yoklama)marks.push({sheet:yoklama.sheet,last:yoklama.sheet.getLastRow()});
    if(odev)marks.push({sheet:odev.sheet,last:odev.sheet.getLastRow()});
    try{
      s.appendRow(h.map(k=>Object.prototype.hasOwnProperty.call(record,k)?record[k]:''));
      if(rows){
        yoklama.sheet.getRange(yoklama.sheet.getLastRow()+1,1,rows.attendance.length,yoklama.header.length).setValues(rows.attendance);
        if(odev&&rows.homework.length)odev.sheet.getRange(odev.sheet.getLastRow()+1,1,rows.homework.length,odev.header.length).setValues(rows.homework);
      }
    }catch(writeErr){
      let rollbackIssue=false;
      for(const m of marks.slice().reverse()){
        try{const count=m.sheet.getLastRow()-m.last;if(count>0)m.sheet.deleteRows(m.last+1,count);}catch(rollbackError){rollbackIssue=true;Logger.log('AYDA rollback: '+rollbackError.message);}
      }
      throw Error(rollbackIssue?'Kayıt tamamlanamadı ve geri alma kısmen başarısız oldu; yöneticinin tabloyu kontrol etmesi gerekir.':'Kayıt tamamlanamadı; hiçbir değişiklik uygulanmadı. '+writeErr.message);
    }
    if(status==='İşlendi'){
      const gs=aydaSheet_('GRUPLAR'),gv=gs.getDataRange().getDisplayValues(),gh=gv[0],idc=gh.indexOf('ID'),uc=gh.indexOf('Son Tamamlanan Ünite');
      if(idc>=0&&uc>=0){const ix=gv.findIndex((r,i)=>i>0&&r[idc]===groupId);if(ix>0){const cell=gs.getRange(ix+1,uc+1);if(completed>(Number(cell.getValue())||0))cell.setValue(completed);}}
    }
    return {saved:true,id:record['Kayıt ID'],trackingSaved:hasTracking,attendanceCount:entries?entries.length:0};
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
  const alerts=[];
  for(const s of byStudent.values()){
    s.attendanceHistory.sort((a,b)=>b.date.localeCompare(a.date));
    s.homeworkHistory.sort((a,b)=>b.date.localeCompare(a.date));
    const recentAttendance=s.attendanceHistory.slice(0,5);
    const recentHomework=s.homeworkHistory.slice(0,5);
    const recentAbsent=recentAttendance.filter(x=>x.status==='Gelmedi'&&!x.excused).length;
    const consecutiveAbsent=recentAttendance.length>=2&&recentAttendance.slice(0,2).every(x=>x.status==='Gelmedi'&&!x.excused);
    const recentExcused=recentAttendance.filter(x=>x.status==='Gelmedi'&&x.excused).length;
    const recentHw=recentHomework.filter(x=>x.status==='Yapmadı').length;
    s.lastAttendance=recentAttendance[0]||null;
    s.lastHomework=recentHomework[0]||null;
    s.recentAttendance=recentAttendance;
    s.recentHomework=recentHomework;
    s.recentAbsent=recentAbsent;
    s.recentHomeworkMissing=recentHw;
    s.consecutiveAbsent=consecutiveAbsent;
    s.attendanceRate=(s.present+s.absent)?Math.round(s.present*100/(s.present+s.absent)):null;
    s.riskLevel=consecutiveAbsent||recentAbsent>=3||recentHw>=3?'danger':
      recentAbsent>=1||recentHw>=2?'watch':
      recentAttendance.length||recentHomework.length?'regular':'untracked';
    const group=byGroup.get(s.groupId);
    if(s.riskLevel==='danger'){
      group.atRisk++;
      alerts.push({studentId:s.id,name:s.name,groupId:s.groupId,group:group.name,
        recentAbsent,recentExcused,recentHomeworkMissing:recentHw,consecutiveAbsent,excused:s.excused});
    }else if(s.riskLevel==='watch')group.watch++;
    else if(s.riskLevel==='untracked')group.untracked++;
    delete s.attendanceHistory;
    delete s.homeworkHistory;
  }
  alerts.sort((a,b)=>Number(b.consecutiveAbsent)-Number(a.consecutiveAbsent)||b.recentAbsent-a.recentAbsent||b.recentHomeworkMissing-a.recentHomeworkMissing);
  return {groups:[...byGroup.values()],students:[...byStudent.values()],alerts,
    scope:user.role==='admin'?'all':'own',updatedAt:aydaToday_()};
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
  const min=accountId==='ADMIN'?10:8;
  if(password.length<min||password.length>64||!/\p{L}/u.test(password)||!/\d/.test(password)||/^\s|\s$/.test(password))
    throw Error('Parola '+min+'–64 karakter olmalı; en az bir harf ve bir rakam içermeli.');
  if(['ayda1234','password1','12345678','123456789','1234567890'].includes(password.toLocaleLowerCase('tr-TR')))
    throw Error('Bu parola çok kolay tahmin edilebilir. Farklı bir parola seçin.');
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
  const required=['GRUPLAR','KULLANICILAR','DERS_KAYITLARI','OGRENCILER','YOKLAMA','ODEV_TAKIBI'];
  const missing=required.filter(name=>!db.getSheetByName(name));
  if(missing.length)throw Error('Eksik Google Sheets sekmeleri: '+missing.join(', '));
  const result={ok:true,version:'2026-10-15.4',sheetCount:db.getSheets().length,groups:Math.max(0,db.getSheetByName('GRUPLAR').getLastRow()-1),students:Math.max(0,db.getSheetByName('OGRENCILER').getLastRow()-1)};
  Logger.log(JSON.stringify(result));
  return result;
}

function doGet(e){
  const p=e&&e.parameter||{},cb=String(p.callback||'');
  if(!/^ayda_cb_[A-Za-z0-9_]{1,64}$/.test(cb))return ContentService.createTextOutput('Invalid callback').setMimeType(ContentService.MimeType.TEXT);
  let out;
  try{
    const action=String(p.action||'overview');
    if(action==='ping'){out={ok:true,data:{status:'ok',version:'2026-10-15.4'}};}
    else if(action==='publicDashboard'){out={ok:true,data:aydaPublicDashboard_()};}
    else if(action==='publicTrackingDashboard'){out={ok:true,data:aydaTrackingSummary_({role:'admin',id:'ADMIN',name:'Yönetici'})};}
    else {const user=aydaAuth_(p.key);
    if(action==='overview')out={ok:true,data:aydaOverview_(user)};
    else if(action==='createTeacher')out={ok:true,data:aydaAdminCreateTeacher_(user,JSON.parse(Utilities.newBlob(Utilities.base64DecodeWebSafe(String(p.payload||''))).getDataAsString('UTF-8')))};
    else if(action==='createGroup')out={ok:true,data:aydaAdminCreateGroup_(user,JSON.parse(Utilities.newBlob(Utilities.base64DecodeWebSafe(String(p.payload||''))).getDataAsString('UTF-8')))};
    else if(action==='updateGroup')out={ok:true,data:aydaAdminSetGroup_(user,JSON.parse(Utilities.newBlob(Utilities.base64DecodeWebSafe(String(p.payload||''))).getDataAsString('UTF-8')))};
    else if(action==='rotateKey')out={ok:true,data:aydaRotateKey_(user,p.target)};
    else if(action==='vaultExport')out={ok:true,data:{rows:aydaVaultRows_(user)}};
    else if(action==='studentRoster')out={ok:true,data:{students:aydaStudentRoster_(user)}};
    else if(action==='trackingSummary')out={ok:true,data:aydaTrackingSummary_(user)};
    else if(action==='setPassword')out={ok:true,data:aydaSetPassword_(user,JSON.parse(Utilities.newBlob(Utilities.base64DecodeWebSafe(String(p.payload||''))).getDataAsString('UTF-8')))};
    else if(action==='save'){
      const input=JSON.parse(Utilities.newBlob(Utilities.base64DecodeWebSafe(String(p.payload||''))).getDataAsString('UTF-8'));
      out={ok:true,data:input.type==='private'?aydaPrivateSave_(user,input):aydaSave_(user,input)};
    }else throw Error('Bilinmeyen işlem.');
    }
  }catch(err){out={ok:false,error:String(err.message||err)};}
  return ContentService.createTextOutput(cb+'('+JSON.stringify(out).replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029')+');').setMimeType(ContentService.MimeType.JAVASCRIPT);
}