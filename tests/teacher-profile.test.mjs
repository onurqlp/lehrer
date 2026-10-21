import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const src=fs.readFileSync(new URL('../apps-script/Code.gs',import.meta.url),'utf8');
const context={Map,Set,Date,Math,JSON,Number,String,Object,Array,RegExp,Error};
vm.createContext(context);
vm.runInContext(src,context,{timeout:3000});

class Sheet{
 constructor(head,rows){this.rows=[head,...rows.map(r=>r.slice())];}
 getLastRow(){return this.rows.length;}
 getLastColumn(){return this.rows[0].length;}
 getDataRange(){return {getDisplayValues:()=>this.rows.map(row=>row.map(String))};}
 getRange(r,c,n=1,m=1){
  const sheet=this;
  return {
   getDisplayValues:()=>sheet.rows.slice(r-1,r-1+n).map(row=>row.slice(c-1,c-1+m).map(String)),
   getDisplayValue:()=>String(sheet.rows[r-1]?.[c-1]??''),
   setValues:values=>values.forEach((row,i)=>row.forEach((value,j)=>{sheet.rows[r-1+i][c-1+j]=value;}))
  };
 }
 appendRow(row){this.rows.push(row.slice());}
}
const users=new Sheet(['Kullanıcı ID','Kullanıcı Adı','Öğretmen ID','Rol','Durum'],[['U-1','Eski Hoca','H101','Öğretmen','Aktif']]);
const teachers=new Sheet(['Öğretmen ID','Öğretmen','Durum'],[['H101','Eski Hoca','Aktif']]);
const contacts=new Sheet(['KISI_ID','OGRETMEN_ID','AD_SOYAD','TELEFON','DURUM','ESLESME'],[['C-77','H101','Eski Hoca','+905331112233','Aktif','Hesap eşleşti']]);
const all={KULLANICILAR:users,OGRETMENLER:teachers,OGRETMEN_REHBERI:contacts};
const props=new Map([['AYDA_OGRETMEN_TURU_H101','kurs']]);
context.aydaSheet_=name=>{if(!all[name])throw Error('Unknown sheet: '+name);return all[name];};
context.PropertiesService={getScriptProperties:()=>({
 getProperty:k=>props.get(k)??null,
 setProperty:(k,v)=>props.set(k,v),
 deleteProperty:k=>props.delete(k)
})};
context.LockService={getScriptLock:()=>({waitLock:()=>{},releaseLock:()=>{}})};
context.SpreadsheetApp={flush:()=>{}};

test('mevcut öğretmen kimliği değiştirilmeden ad/tür/telefon güncellenir',()=>{
 const result=context.aydaAdminUpdateTeacher_({role:'admin'},{
  teacherId:'H101',name:'Yeni Öğretmen',teacherType:'konusma',phone:'0532 123 45 67'
 });
 assert.equal(result.saved,true);
 assert.equal(result.teacherId,'H101');
 assert.equal(result.phone,'905321234567');
 assert.deepEqual(users.rows[1],['U-1','Yeni Öğretmen','H101','Öğretmen','Aktif']);
 assert.deepEqual(teachers.rows[1],['H101','Yeni Öğretmen','Aktif']);
 assert.equal(contacts.rows.length,2,'Mevcut rehber satırı çoğaltılmaz');
 assert.deepEqual(contacts.rows[1],['C-77','H101','Yeni Öğretmen','+905321234567','Aktif','Hesap eşleşti']);
 assert.equal(props.get('AYDA_OGRETMEN_TURU_H101'),'konusma');
});

test('izleme hesabı veya geçersiz telefon öğretmeni düzenleyemez',()=>{
 const p={teacherId:'H101',name:'Başka İsim',teacherType:'kurs',phone:'05551234567'};
 assert.throws(()=>context.aydaAdminUpdateTeacher_({role:'viewer'},p),/yönetici/i);
 assert.throws(()=>context.aydaAdminUpdateTeacher_({role:'admin'},{...p,phone:'yok'}),/geçersiz/i);
 assert.equal(users.rows[1][1],'Yeni Öğretmen');
});
