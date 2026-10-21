// Canlı Drive veya Google Sheets'e bağlanmayan işlem simülasyonları.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync(new URL('../apps-script/Code.gs', import.meta.url),'utf8');
const ctx={ Map, Set, Date, Math, Number, String, Object, Array, JSON, RegExp, Error };
vm.createContext(ctx);
vm.runInContext(source,ctx,{timeout:3000});

class FakeSheet{
  constructor(headers){this.rows=[headers];this.failWrites=false;}
  getLastRow(){return this.rows.length;}
  getLastColumn(){return this.rows[0].length;}
  getDataRange(){return {getDisplayValues:()=>this.rows.map(r=>r.map(v=>String(v??'')))};}
  getRange(r,c,n=1,m=1){
    return {
      getDisplayValues:()=>this.rows.slice(r-1,r-1+n).map(row=>row.slice(c-1,c-1+m).map(v=>String(v??''))),
      getValue:()=>this.rows[r-1]?.[c-1],
      setValue:value=>{if(this.failWrites)throw Error('Injected cell-write failure');this.rows[r-1][c-1]=value;},
      setValues:values=>{
        if(this.failWrites)throw Error('Injected table-write failure');
        values.forEach((v,i)=>{while(this.rows.length<r+i)this.rows.push(Array(this.getLastColumn()).fill(''));v.forEach((x,j)=>this.rows[r-1+i][c-1+j]=x);});
      }
    };
  }
  appendRow(r){if(this.failWrites)throw Error('Injected append failure');this.rows.push([...r]);}
  deleteRows(r,count){this.rows.splice(r-1,count);}
}
let id=0;
function base(sheets){
  ctx.aydaSheet_ = name=>{if(!sheets[name])throw Error('No table: '+name);return sheets[name];};
  ctx.aydaAppendNamed_ = (name,obj)=>{
    const s=ctx.aydaSheet_(name);s.appendRow(s.rows[0].map(k=>Object.hasOwn(obj,k)?obj[k]:''));
  };
  ctx.aydaNextId_ = ()=> 'G-TEST';
  ctx.aydaToday_ = ()=> '2026-10-21';
  ctx.aydaValidateDate_ = d=> /^\d{4}-\d{2}-\d{2}$/.test(d);
  ctx.aydaDate_ = d=>d;
  ctx.aydaWeekday_ = ()=> 'Pazartesi';
  ctx.LockService = {getScriptLock:()=>({waitLock:()=>{},releaseLock:()=>{}})};
  ctx.SpreadsheetApp = {flush:()=>{}};
  ctx.Utilities = {getUuid:()=>String(++id)};
  ctx.Logger = {log:()=>{}};
}
test('programın ikinci gününde hata olursa grup ve program satırları geri alınır',()=>{
  const groups=new FakeSheet(['ID','Grup','Seviye','Öğretmen ID','Başlangıç','Planlanan Bitiş','Öğrenci','Son Tamamlanan Ünite','Toplam Ünite','Durum','WhatsApp']);
  const plan=new FakeSheet(['Grup ID','Gün','Başlangıç','Bitiş','Durum']);
  base({GRUPLAR:groups,HAFTALIK_PROGRAM:plan});
  ctx.aydaTeachers_=()=>[{id:'T1',status:'Aktif'}];
  const original=ctx.aydaAppendNamed_;
  ctx.aydaAppendNamed_=(name,obj)=>{
    if(name==='HAFTALIK_PROGRAM'&&obj['Gün']==='Çarşamba')throw Error('Injected second-schedule failure');
    original(name,obj);
  };
  const input={name:'A2 Akşam',level:'A2',teacherId:'T1',start:'2026-10-21',students:12,total:24,completed:0,days:['Pazartesi','Çarşamba'],time:'20:00',end:'21:30'};
  assert.throws(()=>ctx.aydaAdminCreateGroup_({role:'admin'},input),/geri alındı/);
  assert.equal(groups.getLastRow(),1);
  assert.equal(plan.getLastRow(),1);
});

test('ders ve yoklama beraber yazılır; tekrar çağrı mükerrer kaydı engeller',()=>{
  const reportHeaders=['Kayıt ID','Tarih','Grup ID','Öğretmen ID','Planlanan Başlangıç','Planlanan Bitiş','Gerçekleşen Ders Saati','Durum','İşlenen Ünite','Tamamlanan Ünite','İşlenen Konu','Öğretmen Notu','Kayıt Zamanı'];
  const attendanceHeaders=['YOKLAMA_ID','DERS_KAYIT_ID','TARIH','GRUP_ID','OGRENCI_ID','KATILIM','MAZERETLI','OGRETMEN_ID','KAYIT_ZAMANI'];
  const homeworkHeaders=['ODEV_ID','DERS_KAYIT_ID','TARIH','GRUP_ID','OGRETMEN_ID','VERILEN_ODEV','KAYIT_ZAMANI','PAYLASIM_DURUMU','PAYLASIM_ZAMANI','PAYLASAN_OGRETMEN_ID'];
  const reports=new FakeSheet(reportHeaders),attendance=new FakeSheet(attendanceHeaders),homework=new FakeSheet(homeworkHeaders);
  const group=new FakeSheet(['ID','Son Tamamlanan Ünite']);group.appendRow(['g',0]);
  const sheets={DERS_KAYITLARI:reports,YOKLAMA:attendance,DERS_ODEVLERI:homework,GRUPLAR:group};
  base(sheets);
  ctx.aydaGroups_=()=>[{id:'g',teacherId:'T1',status:'Aktif'}];
  ctx.aydaSchedule_=()=>[{day:'Pazartesi',start:'20:00',end:'21:30'}];
  ctx.aydaTrackingPrepare_=()=>[{studentId:'s1',status:'Geldi',excused:false,hw:'Kontrol edilmedi'}];
  ctx.aydaTrackingHeaders_=(name)=>({sheet:sheets[name],header:sheets[name].rows[0]});
  ctx.aydaTrackingRows_=(entries,date,groupId,teacherId,lessonId,enabled,attHead)=>({
    attendance:entries.map(e=>attHead.map(k=>({
      YOKLAMA_ID:'YK-1',DERS_KAYIT_ID:lessonId,TARIH:date,GRUP_ID:groupId,OGRENCI_ID:e.studentId,KATILIM:e.status,MAZERETLI:'Hayır',OGRETMEN_ID:teacherId,KAYIT_ZAMANI:new Date()
    }[k]??''))),
    homework:[]
  });
  const input={groupId:'g',date:'2026-10-21',topic:'',note:'Bugün A2 çalışıldı',unit:1,completed:1,actual:'02:00',status:'İşlendi',attendance:[{studentId:'s1',status:'Geldi'}],homeworkEnabled:false,homeworkText:'Menschen A2 çalışması'};
  const user={role:'teacher',id:'T1'};
  const first=ctx.aydaSave_(user,input);
  assert.equal(first.saved,true);
  assert.equal(reports.getLastRow(),2);
  assert.equal(attendance.getLastRow(),2);
  assert.equal(homework.getLastRow(),2);
  assert.equal(first.trackingSaved,true);
  assert.throws(()=>ctx.aydaSave_(user,input),/zaten var/);
  assert.equal(reports.getLastRow(),2);

  reports.deleteRows(2,1);attendance.deleteRows(2,1);homework.deleteRows(2,1);
  attendance.failWrites=true;
  assert.throws(()=>ctx.aydaSave_(user,input),/Kayıt tamamlanamadı/);
  assert.equal(reports.getLastRow(),1,'Ders kaydı hata sonrası kalmamalı');
  assert.equal(attendance.getLastRow(),1);
  assert.equal(homework.getLastRow(),1);
});
