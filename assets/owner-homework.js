"use strict";
/* Manager sees assignment timeliness and extensions; teacher alone creates/changes assignments. */
(()=>{
 const preview=document.getElementById('ownerHomeworkPreview'),list=document.getElementById('ownerHomeworkTasks');
 if(!preview||!list)return;
 const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=String(text);return n;};
 const bridge=()=>window.AYDA_OWNER_BRIDGE;
 const formatDate=x=>String(x||'').replace(/^(\d{4})-(\d{2})-(\d{2})$/,'$3.$2.$1');
 let generation=0,tasks=null;
 function openAttendance(){bridge()?.openTab('attendance');}
 function paint(){
  if(!bridge()?.ready())return;
  preview.replaceChildren();list.replaceChildren();
  if(!tasks){
   list.append(el('p','ayda-auto-subtle','Ödev görevleri henüz yüklenemedi. Apps Script sürümünü kontrol edin.'));
   return;
  }
  const all=tasks.tasks||[],active=all.filter(t=>t.status==='Aktif'),
   overdue=active.filter(t=>t.overdue),week=active.filter(t=>t.dueDate>=tasks.today&&t.dueDate<=addDays(tasks.today,7));
  const summary=el('button','ayda-owner-homework-link');summary.type='button';
  summary.append(el('strong','','Ödev takvimi · '+active.length+' aktif görev'),
   el('span','',overdue.length+' teslimi geçmiş · '+week.length+' önümüzdeki 7 gün içinde teslim'),
   el('span','','Ödevleri incele →'));
  summary.addEventListener('click',openAttendance);preview.append(summary);
  const notice=el('p','ayda-auto-subtle','Ödev görevleri, günlük ödev yaptı/yapmadı notlarından ayrıdır. Ek süreyi ilgili öğretmen tanımlar. Öğrencilere otomatik bildirim gönderilmez.');
  list.append(notice);
  if(!all.length){list.append(el('p','ayda-auto-done','Henüz teslim tarihli bir ödev görevi kaydedilmemiş.'));return;}
  const teachers=new Map((bridge()?.overview()?.teachers||[]).map(x=>[x.id,x.name]));
  const ordered=all.slice().sort((a,b)=>(a.status==='Aktif'?0:1)-(b.status==='Aktif'?0:1)||Number(b.overdue)-Number(a.overdue)||a.dueDate.localeCompare(b.dueDate));
  for(const task of ordered.slice(0,70)){
   const card=el('article','ayda-task-card'+(task.overdue?' is-overdue':''));
   const header=el('div','ayda-task-card-header');
   header.append(el('strong','',task.title),el('span','ayda-task-pill'+(task.overdue?' overdue':''),task.overdue?'Teslim tarihi geçti':task.status));
   card.append(header,el('small','',task.group+' · '+(teachers.get(task.teacherId)||task.teacherId)+' · Teslim: '+formatDate(task.dueDate)));
   if(task.description)card.append(el('p','',task.description));
   const submissions=task.submissions||[];
   card.append(el('small','ayda-task-submission-count','Dosya teslimi: '+submissions.length));
   for(const submission of submissions){
    try{const url=new URL(submission.fileUrl);if(url.hostname!=='drive.google.com')continue;const line=el('p','ayda-task-submission-row');line.append(el('span','',(submission.studentName||submission.studentId||'Öğrenci')+' · '+(submission.fileName||'Dosya')));const link=el('a','ayda-task-submission-link','Dosyayı aç');link.href=url.href;link.target='_blank';link.rel='noopener noreferrer';line.append(link);card.append(line);}catch(_){}
   }
   if(task.extensionCount)card.append(el('small','ayda-task-extended','Ek süre: '+task.extensionCount+' kez, toplam '+task.extraDays+' gün'));
   list.append(card);
  }
  if(ordered.length>70)list.append(el('p','ayda-auto-subtle','Sonuçların ilk 70 tanesi gösteriliyor.'));
 }
 function addDays(date,days){const d=new Date(date+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+days);return d.toISOString().slice(0,10);}
 async function load(){
  if(!bridge()?.ready())return;
  const my=++generation;
  try{const result=await bridge().api('homeworkTasks');if(generation!==my)return;tasks=result;paint();}
  catch(e){if(generation!==my)return;tasks=null;paint();}
 }
 window.addEventListener('ayda:owner-ready',load);
 window.addEventListener('ayda:owner-logout',()=>{generation++;tasks=null;preview.replaceChildren();list.replaceChildren();});
 if(bridge()?.ready())load();
})();