import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const read=name=>fs.readFileSync(new URL('../'+name,import.meta.url),'utf8');
const backend=read('apps-script/Code.gs'),app=read('assets/app.js'),index=read('index.html'),owner=read('assets/owner.js');

class FakeSheet{
 constructor(headers,records=[]){this.rows=[headers,...records];}
 getLastRow(){return this.rows.length;}
 getLastColumn(){return this.rows[0].length;}
 getDataRange(){return {getDisplayValues:()=>this.rows.map(row=>row.map(value=>String(value??'')))};}
 getRange(r,c,count=1,cols=1){
  return {
   getDisplayValues:()=>this.rows.slice(r-1,r-1+count).map(row=>row.slice(c-1,c-1+cols).map(v=>String(v??''))),
   getDisplayValue:()=>String(this.rows[r-1]?.[c-1]??''),
   setValue:value=>{this.rows[r-1][c-1]=value;}
  };
 }
 appendRow(row){this.rows.push([...row]);}
 deleteRow(r){this.rows.splice(r-1,1);}
}
function fixture(sheets){
 const ctx={Map,Set,Date,Math,String,Number,Array,Object,JSON,Error,RegExp};
 vm.createContext(ctx);vm.runInContext(backend,ctx,{timeout:3000});
 ctx.aydaSheet_=name=>{if(!sheets[name])throw Error('Missing sheet '+name);return sheets[name];};
 ctx.SpreadsheetApp={flush:()=>{}};
 ctx.LockService={getScriptLock:()=>({waitLock:()=>{},releaseLock:()=>{}})};
 ctx.Logger={log:()=>{}};
 return ctx;
}

test('new term starts 21 October without erasing the saved group unit',()=>{
 assert.match(backend,/const AYDA_TRACKING_START = '2026-10-21';/);
 assert.match(backend,/todayLessons:schedule\.filter/);
 assert.match(backend,/return p\.day===day&&g&&g\.status==='Aktif'&&today>=AYDA_TRACKING_START/);
 assert.match(app,/Math\.max\(0,Number\(g\.completed\)\|\|0\)\+1/);
 assert.match(backend,/completed:Number\(g\['Son Tamamlanan Ünite'\]\)\|\|0/);
 assert.doesNotMatch(backend,/getSheetByName\('GRUPLAR'\)\.clear/);
});

test('admin removal deactivates student without deleting attendance, homework or student identity',()=>{
 const pupils=new FakeSheet(['OGRENCI_ID','AD_SOYAD','GRUP_ID','DURUM'],[
  ['O001','Öğrenci A','G001','Aktif'],['O002','Öğrenci B','G001','Aktif']
 ]);
 const groups=new FakeSheet(['ID','Öğrenci'],[['G001',2]]);
 const attendance=new FakeSheet(['OGRENCI_ID','KATILIM'],[['O001','Geldi']]);
 const homework=new FakeSheet(['OGRENCI_ID','ODEV_DURUMU'],[['O001','Yaptı']]);
 const ctx=fixture({OGRENCILER:pupils,GRUPLAR:groups,YOKLAMA:attendance,ODEV_TAKIBI:homework});
 const result=ctx.aydaAdminStudentRemove_({role:'admin'},{id:'O001'});
 assert.equal(result.removed,true);
 assert.equal(result.preservedHistory,true);
 assert.equal(pupils.rows.length,3);
 assert.equal(pupils.rows[1][0],'O001');
 assert.equal(pupils.rows[1][3],'Pasif');
 assert.equal(groups.rows[1][1],1,'group count equals still-active pupils');
 assert.equal(attendance.rows[1][0],'O001');
 assert.equal(homework.rows[1][0],'O001');
 assert.equal(ctx.aydaAdminStudentRemove_({role:'admin'},{id:'O001'}).unchanged,true);
 assert.throws(()=>ctx.aydaAdminStudentRemove_({role:'teacher'},{id:'O002'}),/Yalnızca yönetici/);
});

test('teacher roster and admin active list never return deactivated students',()=>{
 assert.match(backend,/r\.DURUM!=='Pasif'&&r\.DURUM!=='Silindi'/);
 assert.match(backend,/r\['DURUM'\]!=='Pasif'&&r\['DURUM'\]!=='Silindi'/);
 assert.match(backend,/function aydaAdminStudentRemove_/);
 assert.match(backend,/else if\(action==='removeStudent'\)/);
 assert.match(app,/if\(capability\.studentRemoval!=='soft-delete-v1'\)/);
 assert.match(app,/if\(result\?\.removed!==true\|\|result\.id!==id\)/);
});

test('split duplicate teacher IDs only when admin explicitly selects account and groups',()=>{
 const users=new FakeSheet(['Kullanıcı ID','Kullanıcı Adı','Öğretmen ID','Rol','Durum'],[
  ['U001','Hocam A','H001','Öğretmen','Aktif'],
  ['U002','Hocam B','H001','Öğretmen','Aktif'],
  ['U003','Hocam C','H001','Öğretmen','Aktif']
 ]);
 const teachers=new FakeSheet(['Öğretmen ID','Öğretmen','Durum'],[['H001','Ortak Kimlik','Aktif']]);
 const groups=new FakeSheet(['ID','Öğretmen ID','Durum'],[['G001','H001','Aktif'],['G002','H001','Aktif']]);
 const ctx=fixture({KULLANICILAR:users,OGRETMENLER:teachers,GRUPLAR:groups});
 assert.throws(()=>ctx.aydaAdminSeparateTeacherAccount_({role:'teacher'},{accountId:'U002',groupIds:['G002']}),/Yalnızca yönetici/);
 const result=ctx.aydaAdminSeparateTeacherAccount_({role:'admin'},{accountId:'U002',groupIds:['G002']});
 assert.equal(result.saved,true);assert.equal(result.teacherId,'H002');assert.equal(result.transferredGroups,1);
 assert.equal(users.rows[1][2],'H001');assert.equal(users.rows[2][2],'H002');assert.equal(users.rows[3][2],'H001');
 assert.equal(groups.rows[1][1],'H001');assert.equal(groups.rows[2][1],'H002');
 assert.equal(teachers.rows[2][0],'H002');
 assert.throws(()=>ctx.aydaAdminSeparateTeacherAccount_({role:'admin'},{accountId:'U002',groupIds:[]}),/paylaşılmıyor/);
});

test('teacher student-tracking cards removed but required attendance control kept',()=>{
 assert.doesNotMatch(index,/id="teacherTracking"/);
 assert.doesNotMatch(index,/src="assets\/teacher-tracking\.js/);
 assert.match(index,/id="attendanceStudentList"/);
 assert.match(index,/id="adminStudentRemove"/);
 assert.match(index,/id="aydaSeparateTeacherForm"/);
 assert.match(backend,/function aydaTrackingPrepare_/);
 assert.match(backend,/function aydaSaveAttendance_/);
});

test('per-group reports open safely in another tab and reload current data',()=>{
 assert.match(app,/archiveLink\.target='_blank';archiveLink\.rel='noopener noreferrer'/);
 assert.match(owner,/archiveLink\.target='_blank';archiveLink\.rel='noopener noreferrer'/);
 assert.match(read('assets/ayda-archive-entry.js'),/a\.target='_blank';a\.rel='noopener noreferrer'/);
 assert.match(read('assets/ayda-grup-arsivi.js'),/const preferred=state\.id\|\|new URLSearchParams\(location\.search\)\.get\('group'\)/);
 assert.match(read('assets/ayda-grup-arsivi.js'),/periodStart:'2026-10-21'/);
});

test('Google API must be redeployed before new admin controls can send writes',()=>{
 assert.match(backend,/studentRemoval:'soft-delete-v1'/);
 assert.match(app,/const capability=await jsonp\('ping'\)/);
 assert.match(app,/function aydaSharedTeacherOptions\(/);
 assert.match(app,/if\(!r\.saved\|\|r\.accountId!==accountId\|\|r\.transferredGroups!==groupIds\.length\)/);
 for(const file of ['assets/app.js','assets/owner.js','assets/ayda-teacher-focus.js','assets/ayda-experience.js'])
  assert.doesNotThrow(()=>new Function(read(file)),file);
});

test('teacher archive skips detailed student tracking; manager keeps full archive data',()=>{
 const archive=read('assets/ayda-grup-arsivi.js');
 assert.match(archive,/over\.user\.role==='teacher'\?\['lessonHomework','homeworkTasks','reminders'\]/);
 assert.match(archive,/studentTab\.hidden=over\.user\.role==='teacher'/);
 assert.match(backend,/if\(!aydaIsMonitor_\(user\)\)throw Error\('Ayrıntılı öğrenci takibi yönetici hesabına özeldir/);
 assert.match(backend,/if\(user\.role!=='admin'\)throw Error\('Öğrenci gözlemi yalnızca yönetici/);
 assert.match(backend,/function aydaStudentRoster_\(user\)/);
});

test('removeStudent can safely create a missing DURUM column without deleting rows',()=>{
 const pupils=new FakeSheet(['OGRENCI_ID','AD_SOYAD','GRUP_ID'],[['O003','Öğrenci C','G003']]);
 const groups=new FakeSheet(['ID','Öğrenci'],[['G003',1]]);
 const ctx=fixture({OGRENCILER:pupils,GRUPLAR:groups});
 const out=ctx.aydaAdminStudentRemove_({role:'admin'},{id:'O003'});
 assert.equal(out.removed,true);
 assert.equal(pupils.rows[0][3],'DURUM');
 assert.equal(pupils.rows[1][3],'Pasif');
 assert.equal(pupils.rows[1][0],'O003');
 assert.equal(groups.rows[1][1],0);
});
