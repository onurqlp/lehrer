"use strict";
/* One action per step: WhatsApp opens first; explicit teacher confirmation is persisted separately. */
(()=>{
 const $=id=>document.getElementById(id);
 const daily=$('daily'),action=$('sendHomeworkToGroup'),hint=$('aydaShareHint'),formMessage=$('formMessage');
 if(!daily||!action||!hint||!formMessage)return;
 const el=(tag,cls,value)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(value!==undefined)n.textContent=String(value);return n;};
 const teacher=()=>typeof data!=='undefined'&&data?.user?.role==='teacher';
 const dateOf=s=>/^\d{4}-\d\d-\d\d$/.test(String(s||''))?s.slice(8)+'.'+s.slice(5,7)+'.'+s.slice(0,4):String(s||'');
 const isHomework=item=>!!(item&&/^DO-[A-Za-z0-9-]{8,80}$/.test(String(item.id||''))&&item.groupId&&item.text);
 const titleOf=item=>item.group||item.groupName||(data?.groups||[]).find(g=>g.id===item.groupId)?.name||item.groupId;
 const messageOf=item=>'AYDA DİL AKADEMİSİ\n'+titleOf(item)+' · '+dateOf(item.date)+'\n\nDers sonu ödevi:\n'+String(item.text).trim()+'\n\nİyi çalışmalar.';
 let opened=new Set(),current=null,pending=[],loadId=0,busy=new Set();
 const backlog=el('details','ayda-share-backlog');backlog.id='aydaShareBacklog';backlog.hidden=true;
 const summary=el('summary','','WhatsApp paylaşımı bekleyenler');
 const list=el('div','ayda-share-pending-list');backlog.append(summary,list);
 daily.insertAdjacentElement('afterend',backlog);
 const notice=el('button','ayda-share-pending-notice');notice.type='button';notice.hidden=true;
 notice.addEventListener('click',()=>{backlog.open=true;backlog.scrollIntoView({behavior:'smooth',block:'nearest'});});
 daily.insertAdjacentElement('beforebegin',notice);
 function updateMain(){
  const visible=teacher()&&isHomework(current)&&$('lessonType')?.value==='group';
  action.hidden=!visible;
  if(!visible){hint.hidden=true;delete action.dataset.step;return;}
  const isOpened=opened.has(current.id);
  action.dataset.step=isOpened?'confirm':'open';
  action.textContent=isOpened?'✓ Gruba gönderdim':'WhatsApp’ta paylaş →';
  action.disabled=busy.has(current.id);
  hint.hidden=!isOpened;
  if(isOpened)hint.textContent='Mesajı WhatsApp grubunda gönderdikten sonra yukarıdaki “Gruba gönderdim”e basın.';
 }
 function remaining(){
  const hideCurrent=teacher()&&isHomework(current)&&$('lessonType')?.value==='group';
  return pending.filter(item=>!hideCurrent||item.id!==current.id);
 }
 function paintPending(){
  const tasks=teacher()?remaining():[];
  backlog.hidden=!tasks.length;notice.hidden=!tasks.length;
  notice.replaceChildren();list.replaceChildren();
  if(!tasks.length){backlog.open=false;return;}
  notice.append(el('strong','',tasks.length+' WhatsApp duyurusu bekliyor'),el('span','','Görüntüle →'));
  summary.textContent='Paylaşımı bekleyen dersler · '+tasks.length;
  for(const item of tasks.slice(0,25)){
   const row=el('div','ayda-share-pending-item');
   const head=el('div','ayda-share-pending-head');
   head.append(el('strong','',titleOf(item)+' · '+dateOf(item.date)),el('p','',item.text));
   const controls=el('div','ayda-share-pending-controls');
   const button=el('button',opened.has(item.id)?'ayda-share-confirm':'ayda-share-open',opened.has(item.id)?'✓ Gruba gönderdim':'WhatsApp’ta paylaş →');
   const result=el('small','ayda-share-hint',opened.has(item.id)?'Mesajı gönderdikten sonra onaylayın.':'');
   button.type='button';button.disabled=busy.has(item.id);
   button.addEventListener('click',()=>act(item,result));
   controls.append(button);row.append(head,controls,result);list.append(row);
  }
 }
 function openShare(item){
  // WhatsApp has no supported URL that silently selects and sends to a group.
  // The teacher selects the class group and taps Send in WhatsApp.
  window.open('https://wa.me/?text='+encodeURIComponent(messageOf(item)),'_blank','noopener,noreferrer');
  opened.add(item.id);
  updateMain();paintPending();
 }
 async function acknowledge(item,resultText){
  if(!teacher()||!isHomework(item)||busy.has(item.id))return;
  if(!opened.has(item.id)){resultText.textContent='Önce WhatsApp mesajını açın.';return;}
  busy.add(item.id);resultText.textContent='Onay kaydediliyor…';
  updateMain();paintPending();
  try{
   const payload=utf8Base64Url(JSON.stringify({id:item.id}));
   const result=await jsonp('confirmHomeworkShare',{payload});
   if(!result?.saved||result.shareStatus!=='Paylaşıldı')throw Error('Onay alınamadı.');
   pending=pending.filter(row=>row.id!==item.id);
   opened.delete(item.id);
   if(current?.id===item.id){
    current=null;hint.hidden=true;
    formMessage.replaceChildren(el('div','message success','Ders ve WhatsApp paylaşımı tamamlandı. ✓'));
   }
   window.dispatchEvent(new Event('ayda:homework-shared'));
  }catch(err){
   if(current?.id===item.id){hint.hidden=false;hint.textContent='Onay kaydedilemedi. Mesajı tekrar göndermeyin; sadece onayı yeniden deneyin. '+err.message;}
   else resultText.textContent='Onay kaydedilemedi; mesajı tekrar göndermeden yeniden deneyin. '+err.message;
  }finally{busy.delete(item.id);updateMain();paintPending();}
 }
 function act(item,resultText){
  if(!teacher()||!isHomework(item)||busy.has(item.id))return;
  if(opened.has(item.id))acknowledge(item,resultText);
  else openShare(item);
 }
 action.addEventListener('click',()=>{
  if(!current){hint.hidden=false;hint.textContent='Önce dersi kaydedin.';return;}
  act(current,hint);
 });
 async function refresh(){
  if(!teacher())return;
  const req=++loadId;
  try{
   const result=await jsonp('lessonHomework');
   if(req!==loadId||!teacher())return;
   pending=(result.items||[]).filter(r=>r.shareStatus==='Bekliyor'&&isHomework(r)).map(r=>({...r,group:titleOf(r)}));
   // A recent save might not yet be reflected in a fast refetch.
   if(isHomework(current)&&!pending.some(r=>r.id===current.id))pending.unshift(current);
   pending.sort((a,b)=>String(b.date).localeCompare(String(a.date)));
   paintPending();updateMain();
  }catch{
   if(req!==loadId)return;
   if(!pending.length){
    notice.hidden=false;
    notice.replaceChildren(el('span','','Bekleyen WhatsApp duyuruları yüklenemedi. Daha sonra yenileyin.'));
   }
  }
 }
 window.addEventListener('ayda:homework-saved',event=>{
  if(!teacher())return;
  const item={...event.detail,group:event.detail?.groupName};
  if(!isHomework(item))return;
  current=item;opened.delete(item.id);
  pending=[item,...pending.filter(r=>r.id!==item.id)];
  updateMain();paintPending();
 });
 window.addEventListener('ayda:lesson-type-changed',()=>{updateMain();paintPending();});
 window.addEventListener('ayda:login',()=>{current=null;opened.clear();busy.clear();updateMain();refresh();});
 window.addEventListener('ayda:saved',()=>{
  if($('lessonType')?.value==='private'){current=null;updateMain();}
  refresh();
 });
 window.addEventListener('ayda:logout',()=>{
  loadId++;current=null;pending=[];opened.clear();busy.clear();hint.hidden=true;action.hidden=true;
  backlog.hidden=true;notice.hidden=true;backlog.open=false;list.replaceChildren();
 });
})();
