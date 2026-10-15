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
  const token=String(key||'').trim();if(!token||token.length>150)throw Error('Giriş anahtarı eksik veya geçersiz.');
  const hash=aydaHash_(token),props=PropertiesService.getScriptProperties();
  if(props.getProperty('AYDA_ADMIN_HASH')===hash)return {role:'admin',id:'ADMIN',name:'Yönetici'};
  const u=aydaRead_('KULLANICILAR').find(x=>x['Rol']==='Öğretmen'&&x['Durum']==='Aktif'&&props.getProperty('AYDA_GIRIS_'+x['Kullanıcı ID'])===hash);
  if(!u)throw Error('Giriş anahtarı geçersiz veya hesap pasif.');
  return {role:'teacher',id:u['Öğretmen ID'],name:u['Kullanıcı Adı']};
}
function aydaGroups_(user){return aydaRead_('GRUPLAR').filter(g=>user.role==='admin'||(g['Öğretmen ID']===user.id&&g['Durum']==='Aktif')).map(g=>({id:g['ID'],name:g['Grup'],level:g['Seviye'],teacherId:g['Öğretmen ID'],start:aydaDate_(g['Başlangıç']),end:aydaDate_(g['Planlanan Bitiş']),students:g['Öğrenci'],completed:Number(g['Son Tamamlanan Ünite'])||0,total:Number(g['Toplam Ünite'])||0,status:g['Durum']}));}
function aydaSchedule_(groups){const ids=new Set(groups.map(g=>g.id)),map=Object.fromEntries(groups.map(g=>[g.id,g]));return aydaRead_('HAFTALIK_PROGRAM').filter(p=>ids.has(p['Grup ID'])&&(p['Durum']==='Aktif'||p['Durum']==='Eksik saat')).map(p=>({groupId:p['Grup ID'],group:map[p['Grup ID']].name,day:p['Gün'],start:p['Başlangıç'],end:p['Bitiş']||'Belirtilmemiş',status:p['Durum']}));}
function aydaHistory_(user,groups){const ids=new Set(groups.map(g=>g.id));return aydaRead_('DERS_KAYITLARI').filter(r=>ids.has(r['Grup ID'])&&(user.role==='admin'||r['Öğretmen ID']===user.id)).map(r=>({id:r['Kayıt ID'],date:aydaDate_(r['Tarih']),groupId:r['Grup ID'],teacherId:r['Öğretmen ID'],plannedStart:r['Planlanan Başlangıç'],plannedEnd:r['Planlanan Bitiş'],actual:r['Gerçekleşen Ders Saati'],status:r['Durum'],unit:r['İşlenen Ünite'],completed:r['Tamamlanan Ünite'],topic:r['İşlenen Konu'],note:r['Öğretmen Notu']})).sort((a,b)=>b.date.localeCompare(a.date)).slice(0,500);}
function aydaOverview_(user){const groups=aydaGroups_(user),schedule=aydaSchedule_(groups),history=aydaHistory_(user,groups),today=aydaToday_(),day=aydaWeekday_(today);return {user,groups,schedule,history,today,todayLessons:schedule.filter(p=>{const g=groups.find(x=>x.id===p.groupId);return p.day===day&&g&&(!g.start||g.start<=today)&&(!g.end||g.end>=today);}),teachers:user.role==='admin'?aydaRead_('OGRETMENLER').map(x=>({id:x['Öğretmen ID']||x['ID']||'',name:x['Öğretmen']||x['Ad Soyad']||x['Ad']||'',status:x['Durum']||''})):[]};}
function aydaSave_(user,p){
  if(!p||typeof p!=='object')throw Error('Rapor bilgileri eksik.');
  const groupId=String(p.groupId||'').trim(),date=String(p.date||'').trim(),topic=String(p.topic||'').trim(),note=String(p.note||'').trim(),unit=Number(p.unit),completed=Number(p.completed),actual=String(p.actual||'').trim(),status=String(p.status||'İşlendi');
  if(!aydaValidateDate_(date)||date>aydaToday_())throw Error('Geçerli bir geçmiş veya bugünkü tarih girin.');
  if(!Number.isInteger(unit)||unit<1||unit>100||!Number.isInteger(completed)||completed<0||completed>unit)throw Error('Ünite değerlerini kontrol edin.');
  if(!topic||topic.length>300||note.length>2000)throw Error('Konu veya not uzunluğu geçersiz.');
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
    s.appendRow(h.map(k=>Object.prototype.hasOwnProperty.call(record,k)?record[k]:''));
    if(status==='İşlendi'){
      const gs=aydaSheet_('GRUPLAR'),gv=gs.getDataRange().getDisplayValues(),gh=gv[0],idc=gh.indexOf('ID'),uc=gh.indexOf('Son Tamamlanan Ünite');
      if(idc>=0&&uc>=0){const ix=gv.findIndex((r,i)=>i>0&&r[idc]===groupId);if(ix>0){const cell=gs.getRange(ix+1,uc+1);if(completed>(Number(cell.getValue())||0))cell.setValue(completed);}}
    }
    return {saved:true,id:record['Kayıt ID']};
  }finally{lock.releaseLock();}
}
function aydaAdminKeyOlustur(){
  const props=PropertiesService.getScriptProperties();
  if(props.getProperty('AYDA_ADMIN_HASH')){Logger.log('Yönetici anahtarı zaten var.');return;}
  const key=[Utilities.getUuid(),Utilities.getUuid(),Utilities.getUuid()].join('-');
  props.setProperty('AYDA_ADMIN_HASH',aydaHash_(key));
  const file=SpreadsheetApp.create('AYDA - GIZLI YONETICI ANAHTARI');
  file.getSheets()[0].getRange(1,1,2,2).setValues([['Rol','Giriş Anahtarı'],['Yönetici',key]]);
  Logger.log('Yönetici anahtarı oluşturuldu. Google Drive: AYDA - GIZLI YONETICI ANAHTARI');
}
function doGet(e){
  const p=e&&e.parameter||{},cb=String(p.callback||'');
  if(!/^ayda_cb_[A-Za-z0-9_]{1,64}$/.test(cb))return ContentService.createTextOutput('Invalid callback').setMimeType(ContentService.MimeType.TEXT);
  let out;
  try{
    const user=aydaAuth_(p.key),action=String(p.action||'overview');
    if(action==='overview')out={ok:true,data:aydaOverview_(user)};
    else if(action==='save'){
      const input=JSON.parse(Utilities.newBlob(Utilities.base64DecodeWebSafe(String(p.payload||''))).getDataAsString('UTF-8'));
      out={ok:true,data:aydaSave_(user,input)};
    }else throw Error('Bilinmeyen işlem.');
  }catch(err){out={ok:false,error:String(err.message||err)};}
  return ContentService.createTextOutput(cb+'('+JSON.stringify(out).replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029')+');').setMimeType(ContentService.MimeType.JAVASCRIPT);
}
