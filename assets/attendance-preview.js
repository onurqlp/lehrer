"use strict";
/* Frontend prototype only. No student CSV, attendance, or homework is transmitted or saved.
   Google Apps Script must provide a secure roster endpoint and save handling before activation. */
(()=>{
 const byId=id=>document.getElementById(id);
 const node=(tag,cls,text)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=String(text);return el;};
 const attendanceBox=byId('attendancePreview');
 if(!attendanceBox)return;
 let roster=new Map(),rows=new Map(),demo=false,homeworkEnabled=false,activeGroup='';
 const examples=[{id:'sample-1',name:'Örnek Öğrenci 1'},{id:'sample-2',name:'Örnek Öğrenci 2'},{id:'sample-3',name:'Örnek Öğrenci 3'},{id:'sample-4',name:'Örnek Öğrenci 4'}];
 const normalize=s=>String(s||'').trim().toLocaleLowerCase('tr-TR').replace(/\s+/g,' ').replace(/[‐‑–—]/g,'-');
 const statusAvailable=()=>byId('lessonType').value==='group'&&byId('status').value==='İşlendi';
 const make=(tag,cls,text)=>node(tag,cls,text);
 const stateFor=id=>{if(!rows.has(id))rows.set(id,{present:true,excused:false,homework:'unchecked'});return rows.get(id);};
 function pickGroup(){const gs=(typeof data!=='undefined'&&data&&Array.isArray(data.groups))?data.groups:[];return gs.find(g=>String(g.id)===byId('groupId').value);}
 function button(label,selected,cls,onClick){const b=make('button','attendance-option '+cls+(selected?' selected':''),label);b.type='button';b.setAttribute('aria-pressed',String(selected));b.addEventListener('click',onClick);return b;}
 function chooser(label,items){const box=make('div','attendance-cell');box.append(make('div','attendance-label',label));const options=make('div','attendance-options');for(const [name,selected,cls,handler] of items)options.append(button(name,selected,cls,handler));box.append(options);return box;}
 function renderRoster(){
  const group=pickGroup(),groupId=group?String(group.id):'';
  if(groupId!==activeGroup){activeGroup=groupId;rows.clear();demo=false;}
  const list=byId('attendanceStudentList'),empty=byId('attendanceEmpty'),counter=byId('attendanceCounts'),demoBtn=byId('attendanceDemoButton');
  list.replaceChildren();
  const valid=statusAvailable()&&!!group;
  byId('attendanceInputs').hidden=!valid;
  if(!valid){empty.textContent=byId('lessonType').value==='private'?'Öğrenci yoklaması grup dersleri için tasarlandı.':!group?'Önce bir grup seçin.':'İptal veya ertelenen derslerde yoklama alınmaz.';empty.hidden=false;counter.textContent='';demoBtn.hidden=true;return;}
  const actual=roster.get(groupId)||[],students=actual.length?actual:(demo?examples:[]);
  demoBtn.hidden=actual.length>0;
  demoBtn.textContent=demo?'Örnek listeyi kapat':'4 örnek öğrenciyle ekranı dene';
  empty.hidden=students.length>0;
  empty.textContent='Bu grubun öğrenci listesi henüz bağlı değil. Yönetici CSV yükleyerek geçici önizleme yapabilir. Kalıcı kayıt için Apps Script bağlantısı gerekli.';
  byId('attendanceGroupName').textContent=group.name+' · '+(actual.length?actual.length+' öğrenci (CSV önizleme)':'öğrenci listesi bekleniyor');
  byId('attendanceHomeworkPanel').hidden=!homeworkEnabled;
  for(const student of students){
   const s=stateFor(student.id),row=make('div','attendance-student');
   const identity=make('div','attendance-identity');identity.append(make('strong','',student.name));
   if(!s.present&&s.excused)identity.append(make('span','attendance-excused','Mazeretli'));
   row.append(identity);
   const controls=make('div','attendance-student-controls');
   controls.append(chooser('Yoklama',[
    ['Geldi',s.present,'came',()=>{s.present=true;s.excused=false;renderRoster();}],
    ['Gelmedi',!s.present,'missed',()=>{s.present=false;s.homework='unchecked';renderRoster();}]
   ]));
   if(!s.present){
    const excuse=make('label','attendance-excuse'),check=make('input');
    check.type='checkbox';check.checked=s.excused;check.addEventListener('change',()=>{s.excused=check.checked;renderRoster();});
    excuse.append(check,document.createTextNode('Mazeretli (isteğe bağlı)'));controls.append(excuse);
   }
   if(homeworkEnabled){
    controls.append(chooser('Bugünkü ödev',[
     ['Yaptı',s.homework==='done','did',()=>{s.homework='done';renderRoster();}],
     ['Yapmadı',s.homework==='missing','missing',()=>{s.homework='missing';renderRoster();}],
     ['Kontrol edilmedi',s.homework==='unchecked','unchecked',()=>{s.homework='unchecked';renderRoster();}]
    ]));
   }
   row.append(controls);list.append(row);
  }
  if(students.length){
   const present=students.filter(x=>stateFor(x.id).present).length;
   const absent=students.length-present;
   const excused=students.filter(x=>!stateFor(x.id).present&&stateFor(x.id).excused).length;
   const missing=homeworkEnabled?students.filter(x=>stateFor(x.id).homework==='missing').length:0;
   counter.textContent=present+' geldi · '+absent+' gelmedi'+(excused?' ('+excused+' mazeretli)':'')+(homeworkEnabled?' · '+missing+' ödev eksik':'');
  }else counter.textContent='';
 }
 byId('attendanceDemoButton').addEventListener('click',()=>{demo=!demo;rows.clear();renderRoster();});
 byId('attendanceHomeworkToggle').addEventListener('change',e=>{homeworkEnabled=e.target.checked;renderRoster();});
 for(const id of ['groupId','lessonType','status','lessonDate'])byId(id).addEventListener('change',renderRoster);
 new MutationObserver(renderRoster).observe(byId('groupId'),{childList:true});
 function csvRows(text){
  const lines=[];let record=[],cell='',quoted=false;
  text=String(text).replace(/^\uFEFF/,'');
  const firstLine=text.split(/\r?\n/,1)[0],delimiter=(firstLine.match(/;/g)||[]).length>(firstLine.match(/,/g)||[]).length?';':',';
  for(let i=0;i<text.length;i++){
   const c=text[i];
   if(c==='"'){if(quoted&&text[i+1]==='"'){cell+='"';i++;}else quoted=!quoted;}
   else if(c===delimiter&&!quoted){record.push(cell);cell='';}
   else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&text[i+1]==='\n')i++;record.push(cell);if(record.some(x=>String(x).trim()))lines.push(record);record=[];cell='';}
   else cell+=c;
  }
  if(quoted)throw Error('CSV içinde kapanmamış tırnak var.');
  record.push(cell);if(record.some(x=>String(x).trim()))lines.push(record);
  return lines;
 }
 const csvInput=byId('studentCsvPreview'),csvMessage=byId('studentCsvMessage'),csvResults=byId('studentCsvResults');
 if(csvInput){
  csvInput.addEventListener('change',async()=>{
   csvResults.replaceChildren();roster=new Map();rows.clear();demo=false;
   const file=csvInput.files&&csvInput.files[0];
   if(!file){csvMessage.textContent='Dosya seçilmedi.';renderRoster();return;}
   if(file.size>2*1024*1024){csvMessage.textContent='Dosya 2 MB sınırını geçiyor.';renderRoster();return;}
   try{
    const records=csvRows(await file.text()),headers=(records.shift()||[]).map(normalize);
    const nameIndex=headers.findIndex(h=>['ad soyad','adı soyadı','isim soyisim'].includes(h));
    const groupIndex=headers.indexOf('grup');
    const mailIndex=headers.indexOf('e-posta'),phoneIndex=headers.indexOf('telefon');
    if(nameIndex<0||groupIndex<0)throw Error('CSV dosyasında Ad Soyad ve Grup sütunları bulunmalı.');
    const groups=(typeof data!=='undefined'&&data&&Array.isArray(data.groups))?data.groups:[];
    if(!groups.length)throw Error('Önce yönetici hesabıyla giriş yapıp grup bilgilerini yükleyin.');
    const lookup=new Map(groups.map(g=>[normalize(g.name),String(g.id)]));
    const seen=new Set(),unmatched=new Map();let duplicates=0,matched=0,ignored=0;
    for(let i=0;i<records.length;i++){
     const r=records[i],name=String(r[nameIndex]||'').trim(),group=String(r[groupIndex]||'').trim();
     if(!name||!group||group==='—'||group==='-'){ignored++;continue;}
     const id=lookup.get(normalize(group));
     if(!id){unmatched.set(group,(unmatched.get(group)||0)+1);continue;}
     const email=mailIndex>=0?normalize(r[mailIndex]):'',phone=phoneIndex>=0?String(r[phoneIndex]||'').replace(/\D/g,''):'';
     const key=id+'|'+(email?'e:'+email:phone?'p:'+phone:'n:'+normalize(name));
     if(seen.has(key)){duplicates++;continue;}seen.add(key);
     if(!roster.has(id))roster.set(id,[]);
     roster.get(id).push({id:'csv-'+i,name});matched++;
    }
    csvMessage.textContent=matched+' öğrenci, '+roster.size+' mevcut grupla eşleşti. '+duplicates+' tekrar kayıt, '+ignored+' grubu olmayan kayıt atlandı. CSV yalnızca bu sekmede önizleniyor, kaydedilmiyor.';
    const table=make('div','attendance-csv-list');
    for(const g of groups.filter(g=>roster.has(String(g.id)))){
     const item=make('div','attendance-csv-result');
     item.append(make('strong','',g.name),make('span','',String(roster.get(String(g.id)).length)+' öğrenci'));table.append(item);
    }
    if(!roster.size)table.append(make('p','attendance-help','Mevcut gruplarla birebir eşleşen grup adı bulunamadı. Grup isimlerini karşılaştırın.'));
    csvResults.append(table);
    if(unmatched.size){
     const details=make('details','attendance-unmatched'),summary=make('summary','',unmatched.size+' CSV grubu eşleşmedi (eski gruplar dahil)');
     const list=make('ul');
     for(const [name,count] of [...unmatched].slice(0,20)){const li=make('li','',name+' · '+count+' kişi');list.append(li);}
     if(unmatched.size>20)list.append(make('li','','Diğer '+(unmatched.size-20)+' grup gösterilmiyor.'));
     details.append(summary,list);csvResults.append(details);
    }
   }catch(error){roster=new Map();csvMessage.textContent='CSV okunamadı: '+error.message;}
   renderRoster();
  });
 }
 renderRoster();
})();
