"use strict";
(()=>{
 const $=id=>document.getElementById(id);
 const root=$('teacherTracking');if(!root)return;
 const node=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=String(text);return e;};
 let info=null,request=0;
 const labels={danger:'Öncelikli',watch:'Takip edilmeli',regular:'Düzenli',untracked:'Kayıt yok'};
 const fmt=s=>/^\d{4}-\d\d-\d\d$/.test(String(s||''))?s.slice(8)+'.'+s.slice(5,7)+'.'+s.slice(0,4):'—';
 function risk(s){return labels[s.riskLevel]?s.riskLevel:'untracked';}
 function counts(){
  const students=info?.students||[],target=$('teacherTrackingKpis');
  target.replaceChildren();
  for(const [label,value,css] of [['Toplam öğrencim',students.length,''],['Öncelikli',students.filter(s=>risk(s)==='danger').length,'urgent'],['Takip edilmeli',students.filter(s=>risk(s)==='watch').length,''],['Yoklama kaydı yok',students.filter(s=>!s.present&&!s.absent).length,'']]){
   const card=node('div','teacher-track-kpi '+css);card.append(node('span','',label),node('strong','',value));target.append(card);
  }
 }
 function record(item,homework){
  if(!item)return 'Henüz kayıt yok';
  return (homework?item.status:(item.status==='Gelmedi'&&item.excused?'Mazeretli':item.status))+' · '+fmt(item.date);
 }
 function card(s){
  const c=node('article','teacher-track-card'),top=node('div','teacher-track-top'),badge=node('span','teacher-track-tag '+risk(s),labels[risk(s)]);
  top.append(node('strong','',s.name),badge);c.append(top);
  const group=(typeof data!=='undefined'&&data?.groups||[]).find(g=>g.id===s.groupId);
  c.append(node('div','teacher-track-meta',group?.name||s.groupId));
  const stats=node('div','teacher-track-stats');
  for(const [label,val] of [['Katılım',s.attendanceRate===null||s.attendanceRate===undefined?'—':s.attendanceRate+'%'],['Gelmedi',s.absent||0],['Ödev eksik',s.homeworkMissing||0]]){
   const col=node('div','teacher-track-stat');col.append(node('small','',label),node('b','',val));stats.append(col);
  }
  c.append(stats,node('div','teacher-track-last','Son yoklama: '+record(s.lastAttendance,false)),node('div','teacher-track-last','Son ödev: '+record(s.lastHomework,true)));
  const details=node('details'),summary=node('summary','','Son 5 kaydı gör');details.append(summary);
  const list=node('ol','teacher-track-records');
  for(const x of s.recentAttendance||[])list.append(node('li','',record(x,false)));
  if(!list.children.length)list.append(node('li','','Yoklama henüz girilmedi'));
  details.append(node('small','','Yoklama'),list);
  const hw=node('ol','teacher-track-records');for(const x of s.recentHomework||[])hw.append(node('li','',record(x,true)));
  if(!hw.children.length)hw.append(node('li','','Ödev henüz kontrol edilmedi'));
  details.append(node('small','','Ödev'),hw);c.append(details);
  window.AYDA_NOTES?.mount(c,s,(action,params)=>jsonp(action,params));
  // Internal material links live in one collapsed teacher resource panel, not on every student card.
  return c;
 }
 function fillGroups(){
  const select=$('teacherTrackingGroup'),previous=select.value;
  select.replaceChildren(new Option('Tüm gruplarım',''));
  for(const g of (typeof data!=='undefined'&&data?.groups||[]).filter(g=>g.status==='Aktif'))select.add(new Option(g.name,g.id));
  select.value=previous;
 }
 function render(){
  if(!info)return;
  counts();fillGroups();
  const q=$('teacherTrackingSearch').value.toLocaleLowerCase('tr').trim(),g=$('teacherTrackingGroup').value,r=$('teacherTrackingRisk').value;
  const students=(info.students||[]).filter(s=>(!g||s.groupId===g)&&(!r||risk(s)===r)&&(!q||s.name.toLocaleLowerCase('tr').includes(q)));
  const list=$('teacherTrackingStudents');list.replaceChildren();for(const s of students)list.append(card(s));
  if(!students.length)list.append(node('div','teacher-track-empty','Bu filtreye uygun öğrenci bulunamadı.'));
 }
 async function load(){
  if(typeof data==='undefined'||!data||data.user?.role!=='teacher'){root.classList.add('hidden');return;}
  root.classList.remove('hidden');const id=++request;
  $('teacherTrackingStatus').textContent='Öğrenci takibi yükleniyor…';$('teacherTrackingRefresh').disabled=true;
  try{
   const result=await jsonp('trackingSummary');
   if(id!==request)return;
   if(result.scope!=='own')throw Error('Güncel Apps Script sürümü gerekli. Kod.gs dosyasını güncelleyip yeni sürüm dağıtın.');
   info=result;$('teacherTrackingStatus').textContent='';render();
  }catch(e){if(id===request){info=null;$('teacherTrackingKpis').replaceChildren();$('teacherTrackingStudents').replaceChildren(node('div','teacher-track-empty','Öğrenci takibi yüklenemedi.'));$('teacherTrackingStatus').textContent=e.message;}}
  finally{if(id===request)$('teacherTrackingRefresh').disabled=false;}
 }
 $('teacherTrackingRefresh').addEventListener('click',load);
 $('teacherTrackingSearch').addEventListener('input',render);
 for(const id of ['teacherTrackingGroup','teacherTrackingRisk'])$(id).addEventListener('change',render);
 window.addEventListener('ayda:login',load);
 window.addEventListener('ayda:saved',load);
 window.addEventListener('ayda:logout',()=>{request++;info=null;root.classList.add('hidden');});
 if(typeof data!=='undefined'&&data?.user?.role==='teacher')load();
})();
