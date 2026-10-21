"use strict";
/* Roster is fetched only after authenticated sign-in. Backend roster support is optional; never invent attendance when unavailable. */
(()=>{
 const byId=id=>document.getElementById(id);
 const node=(tag,cls,text)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=String(text);return el;};
 const attendanceBox=byId('attendancePreview');
 if(!attendanceBox)return;
 let roster=new Map(),rows=new Map(),demo=false,homeworkEnabled=false,activeGroup='',activeDate='',liveRoster=false,rosterLoading=false,rosterError='';
 // GO5: no teacher roster request until the lesson page is opened.
 let rosterRequest=0,rosterFlight=null,rosterFetchedThisLogin=false;
 const examples=[{id:'sample-1',name:'Örnek Öğrenci 1'},{id:'sample-2',name:'Örnek Öğrenci 2'},{id:'sample-3',name:'Örnek Öğrenci 3'},{id:'sample-4',name:'Örnek Öğrenci 4'}];
 const normalize=s=>String(s||'').trim().toLocaleLowerCase('tr-TR').replace(/\s+/g,' ').replace(/[‐‑–—]/g,'-');
 const statusAvailable=()=>byId('lessonType').value==='group'&&byId('status').value==='İşlendi';
 const make=(tag,cls,text)=>node(tag,cls,text);
 const stateFor=id=>{if(!rows.has(id))rows.set(id,{present:null,excused:false,homework:'unchecked'});return rows.get(id);};
 function pickGroup(){const gs=(typeof data!=='undefined'&&data&&Array.isArray(data.groups))?data.groups:[];return gs.find(g=>String(g.id)===byId('groupId').value);}
 function button(label,selected,cls,onClick){const b=make('button','attendance-option '+cls+(selected?' selected':''),label);b.type='button';b.setAttribute('aria-pressed',String(selected));b.addEventListener('click',onClick);return b;}
 function chooser(label,items){const box=make('div','attendance-cell');box.append(make('div','attendance-label',label));const options=make('div','attendance-options');for(const [name,selected,cls,handler] of items)options.append(button(name,selected,cls,handler));box.append(options);return box;}
 function renderRoster(){
  const group=pickGroup(),groupId=group?String(group.id):'';
  const selectedDate=byId('lessonDate').value;
  if(groupId!==activeGroup||selectedDate!==activeDate){activeGroup=groupId;activeDate=selectedDate;rows.clear();demo=false;if(byId('attendanceReviewed'))byId('attendanceReviewed').checked=false;}
  const list=byId('attendanceStudentList'),empty=byId('attendanceEmpty'),counter=byId('attendanceCounts'),demoBtn=byId('attendanceDemoButton');
  list.replaceChildren();
  const valid=statusAvailable()&&!!group;
  byId('attendanceInputs').hidden=!valid;
  const quickAdd=byId('attendanceQuickAdd');if(quickAdd)quickAdd.hidden=!valid||!liveRoster;
  const badge=attendanceBox.querySelector('.attendance-preview-tag');if(badge)badge.textContent=rosterLoading?'YÜKLENİYOR':liveRoster?'CANLI':'BEKLENİYOR';
  const saveButton=byId('saveBtn');if(saveButton&&!saveButton.disabled)saveButton.textContent=valid?'Yoklama + ödev + dersi kaydet':'Ders durumunu kaydet';
  if(!valid){const banner=attendanceBox.querySelector('.attendance-caution');if(banner)banner.textContent=rosterLoading?'Google öğrenci listesi yükleniyor…':liveRoster?'Canlı kayıt hazır. İşlenen bir grup dersini seçerek yoklama alın.':rosterError?'Öğrenci listesi alınamadı: '+rosterError:'Ders Kaydı ekranında öğrenci listesi otomatik yüklenir.';empty.textContent=byId('lessonType').value==='private'?'Öğrenci yoklaması grup dersleri için tasarlandı.':!group?'Önce bir grup seçin.':'İptal veya ertelenen derslerde yoklama alınmaz.';empty.hidden=false;counter.textContent='';demoBtn.hidden=true;return;}
  const actual=roster.get(groupId)||[],students=actual.length?actual:(demo?examples:[]);
  demoBtn.hidden=liveRoster||actual.length>0;
  if(allButton)allButton.hidden=!liveRoster||!actual.length;
  demoBtn.textContent=demo?'Örnek listeyi kapat':'4 örnek öğrenciyle ekranı dene';
  empty.hidden=students.length>0;
  empty.textContent=rosterLoading?'Google öğrenci listesi yükleniyor… Lütfen bekleyin.':liveRoster?'Bu grubun öğrenci listesi bulunamadı. Yönetici öğrencileri gruba bağlayana kadar işlenen ders raporu kaydedilemez.':('Öğrenci listesi henüz hazır değil. '+(rosterError?'Bağlantı hatası: '+rosterError+' · ':'' )+'Yoklama, canlı liste gelmeden kaydedilemez.');
  byId('attendanceGroupName').textContent=group.name+' · '+(actual.length?actual.length+' öğrenci'+(liveRoster?' (canlı yoklama)':' (CSV önizleme)'):'öğrenci listesi bekleniyor');
  const review=byId('attendanceReview');if(review)review.hidden=true; // İşaretli liste için ek onay tıklaması gerekmez.
  const caution=attendanceBox.querySelector('.attendance-caution');if(caution)caution.textContent=rosterLoading?'Öğrenci listesi yükleniyor. Lütfen işlem tamamlanana kadar bekleyin.':liveRoster?(actual.length?'Önce tüm öğrencilerin yoklamasını işaretleyin. Günlük verilen ödevi aşağıya yazın; rapor tek tuşla kaydedilir.':'Bu grupta öğrenci kaydı yok; yöneticiye bilgi verin.'):'Canlı öğrenci listesi alınamadı; yoklama kaydı başlatılmaz. '+(rosterError?'Sunucu mesajı: '+rosterError:'');
  const tag=attendanceBox.querySelector('.attendance-preview-tag');if(tag)tag.textContent=rosterLoading?'YÜKLENİYOR':liveRoster?'CANLI':'BEKLENİYOR';
  byId('attendanceHomeworkPanel').hidden=!homeworkEnabled;
  for(const student of students){
   const s=stateFor(student.id),row=make('div','attendance-student');
   const identity=make('div','attendance-identity');identity.append(make('strong','',student.name));
   if(s.present===false&&s.excused)identity.append(make('span','attendance-excused','Mazeretli'));
   row.append(identity);
   const controls=make('div','attendance-student-controls');
   controls.append(chooser('Yoklama',[
    ['Geldi',s.present===true,'came',()=>{s.present=true;s.excused=false;renderRoster();}],
    ['Gelmedi',s.present===false,'missed',()=>{s.present=false;s.homework='unchecked';renderRoster();}]
   ]));
   if(s.present===false){
    const excuse=make('label','attendance-excuse'),check=make('input');
    check.type='checkbox';check.checked=s.excused;check.addEventListener('change',()=>{s.excused=check.checked;renderRoster();});
    excuse.append(check,document.createTextNode('Mazeretli (isteğe bağlı)'));controls.append(excuse);
   }
   if(homeworkEnabled&&s.present===true){
    controls.append(chooser('Bugünkü ödev',[
     ['Yaptı',s.homework==='done','did',()=>{s.homework='done';renderRoster();}],
     ['Yapmadı',s.homework==='missing','missing',()=>{s.homework='missing';renderRoster();}],
     ['Kontrol edilmedi',s.homework==='unchecked','unchecked',()=>{s.homework='unchecked';renderRoster();}]
    ]));
   }else if(homeworkEnabled&&s.present===false){
    controls.append(make('div','attendance-label','Ödev: Gelmediği için kontrol edilmedi'));
   }
   row.append(controls);list.append(row);
  }
  if(students.length){
   const present=students.filter(x=>stateFor(x.id).present===true).length;
   const absent=students.filter(x=>stateFor(x.id).present===false).length;
   const pending=students.length-present-absent;
   const excused=students.filter(x=>stateFor(x.id).present===false&&stateFor(x.id).excused).length;
   const missing=homeworkEnabled?students.filter(x=>stateFor(x.id).homework==='missing').length:0;
   counter.textContent=present+' geldi · '+absent+' gelmedi'+(pending?' · '+pending+' işaretlenmedi':'')+(excused?' ('+excused+' mazeretli)':'')+(homeworkEnabled?' · '+missing+' ödev eksik':'');
  }else counter.textContent='';
 }
 const quickAddButton=byId('attendanceQuickSave'),quickAddName=byId('attendanceQuickName'),quickAddStatus=byId('attendanceQuickStatus');
 if(quickAddButton&&quickAddName&&quickAddStatus){
  quickAddButton.addEventListener('click',async()=>{
   const group=pickGroup(),name=quickAddName.value.trim().replace(/\s+/g,' ');
   if(!group||!statusAvailable()||!liveRoster||rosterLoading){quickAddStatus.textContent='Önce açık ders ve canlı öğrenci listesi seçin.';return;}
   if(name.length<2||name.length>120){quickAddStatus.textContent='Öğrenci adı 2–120 karakter olmalı.';quickAddName.focus();return;}
   if((roster.get(String(group.id))||[]).some(r=>normalize(r.name)===normalize(name))){
    quickAddStatus.textContent='Bu isim zaten sınıfta kayıtlı. Yoklamadaki ismi kontrol edin.';return;
   }
   quickAddButton.disabled=true;quickAddName.disabled=true;quickAddStatus.textContent='Google kaydı yapılıyor…';
   try{
    const input=JSON.stringify({groupId:String(group.id),name});
    const bytes=new TextEncoder().encode(input);let raw='';for(const byte of bytes)raw+=String.fromCharCode(byte);
    const payload=btoa(raw).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
    const result=await jsonp('teacherAddStudent',{payload});
    if(!result?.id||result.groupId!==String(group.id))throw Error('Google öğrenci kimliğini doğrulamadı.');
    await syncRoster(true);
    if(!(roster.get(String(group.id))||[]).some(s=>s.id===result.id))throw Error('Kayıt oluşturuldu ancak listede henüz görünmüyor. Listeyi yenileyin; tekrar eklemeyin.');
    quickAddName.value='';
    quickAddStatus.textContent=result.created?'Öğrenci eklendi. Şimdi yoklama ve ödev durumunu işaretleyebilirsiniz.':'Öğrenci zaten kayıtlıydı; liste yenilendi.';
    attendanceBox.open=true;
   }catch(e){quickAddStatus.textContent='Eklenemedi: '+(e?.message||String(e));}
   finally{quickAddButton.disabled=false;quickAddName.disabled=false;}
  });
  quickAddName.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();quickAddButton.click();}});
 }
 byId('attendanceDemoButton').addEventListener('click',()=>{demo=!demo;rows.clear();renderRoster();});
 const allButton=byId('attendanceMarkAll');
 if(allButton)allButton.addEventListener('click',()=>{const group=pickGroup();for(const person of (roster.get(String(group?.id||''))||[])){const st=stateFor(person.id);st.present=true;st.excused=false;}renderRoster();});
 byId('attendanceHomeworkToggle').addEventListener('change',e=>{homeworkEnabled=e.target.checked;renderRoster();});
 for(const id of ['groupId','lessonType','status','lessonDate'])byId(id).addEventListener('change',()=>{
  renderRoster();
  if(statusAvailable()&&pickGroup())attendanceBox.open=true;
 });
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
   csvResults.replaceChildren();
   if(liveRoster){csvMessage.textContent='Öğrenciler Google Sheets OGRENCILER sekmesinden otomatik yükleniyor. CSV karşılaştırması yoklama listesini değiştirmez.';csvInput.value='';renderRoster();return;}
   roster=new Map();rows.clear();demo=false;
   const file=csvInput.files&&csvInput.files[0];
   if(!file){csvMessage.textContent='Dosya seçilmedi.';renderRoster();return;}
   if(file.size>2*1024*1024){csvMessage.textContent='Dosya 2 MB sınırını geçiyor.';renderRoster();return;}
   const job=window.AYDA_ACTIVITY?.start('csvPreview','CSV dosyası okunuyor');
   csvInput.disabled=true;let csvOk=true;
   csvMessage.textContent='Dosya okunuyor ve gruplarla karşılaştırılıyor… Lütfen bekleyin.';
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
   }catch(error){csvOk=false;roster=new Map();csvMessage.textContent='CSV okunamadı: '+error.message;}
   finally{csvInput.disabled=false;window.AYDA_ACTIVITY?.finish(job,csvOk);}
   renderRoster();
  });
 }
 function syncRoster(preserveMarked=false){
  const signed=typeof data!=='undefined'&&data&&data.user;
  if(!signed)return Promise.resolve();
  if(rosterFlight)return rosterFlight;
  const generation=++rosterRequest;
  const task=(async()=>{
   const savedMarks=preserveMarked?new Map(rows):null;
   liveRoster=false;rosterLoading=true;rosterError='';roster=new Map();
   if(!preserveMarked)rows.clear();
   demo=false;
   const review=byId('attendanceReviewed');if(review)review.checked=false;
   renderRoster();
   try{
    const result=await jsonp('studentRoster');
    if(generation!==rosterRequest)return;
    if(!result||!Array.isArray(result.students))throw Error('Öğrenci listesi yanıtı geçersiz.');
    // Build an independent snapshot: a late response must never leak across logins.
    const nextRoster=new Map();
    for(const student of result.students){
     const id=String(student.groupId||''),studentId=String(student.id||''),name=String(student.name||'');
     if(!id||!studentId||!name)continue;
     if(!nextRoster.has(id))nextRoster.set(id,[]);
     nextRoster.get(id).push({id:studentId,name});
    }
    roster=nextRoster;
    liveRoster=true;rosterFetchedThisLogin=true;
    if(savedMarks)rows=savedMarks;
   }catch(err){
    if(generation!==rosterRequest)return;
    rosterError=String(err.message||err);
    rosterFetchedThisLogin=false;
   }finally{
    if(generation===rosterRequest){rosterLoading=false;renderRoster();}
   }
  })();
  rosterFlight=task;
  return task.finally(()=>{if(rosterFlight===task)rosterFlight=null;});
 }
 function loadTeacherRosterWhenNeeded(){
  if(typeof data==='undefined'||data?.user?.role!=='teacher')return;
  if(document.body.dataset.aydaTeacherView!=='daily')return;
  if(!rosterFetchedThisLogin&&!rosterLoading)void syncRoster();
 }
 window.AYDA_ATTENDANCE={
  collect(){
   if(rosterLoading&&statusAvailable())throw Error('Öğrenci listesi yükleniyor. Birkaç saniye bekleyin.');
   if(!statusAvailable())return null;
   if(!liveRoster)throw Error(rosterError?'Öğrenci listesi alınamadı: '+rosterError:'Yoklama için önce canlı öğrenci listesi yüklenmeli.');
   const group=pickGroup();if(!group)throw Error('Yoklama için grup seçin.');
   const students=roster.get(String(group.id))||[];
   if(!students.length)throw Error('Bu grupta öğrenci listesi bulunamadı. Yöneticiye bilgi verin.');
   const marked=students.filter(s=>stateFor(s.id).present!==null).length;
   if(!marked)throw Error('Önce yoklamayı alın. İşaretlenmeyen öğrenciler var.');
   if(marked!==students.length)throw Error('Yoklama tamamlanmadı: '+(students.length-marked)+' öğrenci henüz işaretlenmedi. İsterseniz “Hepsi geldi” seçeneğini kullanın.');
   return {homeworkEnabled,attendance:students.map(s=>{
    const r=stateFor(s.id);
    return {studentId:s.id,status:r.present===true?'Geldi':'Gelmedi',excused:r.present===false&&r.excused,homework:homeworkEnabled?r.homework==='done'?'Yaptı':r.homework==='missing'?'Yapmadı':'Kontrol edilmedi':'Kontrol edilmedi'};
   })};
  },
  resetAfterSave(){
   rows.clear();const review=byId('attendanceReviewed');if(review)review.checked=false;renderRoster();
  },
  isConnected(){return liveRoster;},
  refreshRoster(){return syncRoster(true);}
 };
 window.addEventListener('ayda:teacher-page-open',event=>{
  if(event.detail?.page==='daily')loadTeacherRosterWhenNeeded();
 });
 window.addEventListener('ayda:login',()=>{
  rosterFetchedThisLogin=false;
  // Admin remains eager: the same screen also manages roster and quick student entry.
  if(data?.user?.role==='admin')void syncRoster();
  else loadTeacherRosterWhenNeeded();
 });
 window.addEventListener('ayda:logout',()=>{
  rosterRequest++;rosterFlight=null;rosterFetchedThisLogin=false;
  roster=new Map();rows.clear();liveRoster=false;rosterLoading=false;rosterError='';demo=false;renderRoster();
 });
 renderRoster();
})();
