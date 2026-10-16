"use strict";
/* AYDA: human-confirmed WhatsApp class announcements, no automatic sending/verification. */
(()=>{
 const daily=document.getElementById('daily'),formMessage=document.getElementById('formMessage');
 if(!daily||!formMessage)return;
 const el=(tag,cls,value)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(value!==undefined)n.textContent=String(value);return n;};
 const teacher=()=>typeof data!=='undefined'&&data?.user?.role==='teacher';
 const formattedDate=s=>/^\d{4}-\d\d-\d\d$/.test(String(s||''))?s.slice(8)+'.'+s.slice(5,7)+'.'+s.slice(0,4):String(s||'');
 const formatText=item=>'AYDA DİL AKADEMİSİ\n'+item.group+' · '+formattedDate(item.date)+'\n\n'+
  'Ders sonu ödev duyurusu:\n'+item.text.trim()+'\n\nİyi çalışmalar.';
 const isHomework=item=>item&&/^DO-[A-Za-z0-9-]{8,80}$/.test(String(item.id||''))&&item.groupId&&item.text;
 let opened=new Set(),current=null,pending=[],loadId=0;
 const card=el('section','ayda-share-followup');card.id='aydaShareFollowup';card.hidden=true;
 const status=el('div','ayda-share-status','3 · WhatsApp sınıf duyurusu');
 const title=el('h3','','Son adım: Sınıf grubuna yaz');
 const intro=el('p','ayda-share-help','Ödevin kaydedildi. Üstteki yeşil WhatsApp düğmesine bas, sınıf grubunu seçip mesajı gönder. Sonra buradan “Gruba gönderdim” diyerek tamamla.');
 const preview=el('div','ayda-share-preview'),confirm=el('button','ayda-share-confirm','✓ Gruba gönderdim'),note=el('p','ayda-share-hint');
 confirm.type='button';confirm.disabled=true;note.setAttribute('role','status');
 card.append(status,title,intro,preview,confirm,note);
 formMessage.insertAdjacentElement('afterend',card);
 const backlog=el('details','ayda-share-backlog');backlog.id='aydaShareBacklog';backlog.hidden=true;
 const summary=el('summary','','WhatsApp duyurusu bekleyen dersler');
 const list=el('div','ayda-share-pending-list');backlog.append(summary,list);
 daily.insertAdjacentElement('afterend',backlog);
 const notice=el('button','ayda-share-pending-notice');notice.type='button';notice.hidden=true;
 notice.addEventListener('click',()=>{backlog.open=true;backlog.scrollIntoView({behavior:'smooth',block:'center'});});
 daily.insertAdjacentElement('beforebegin',notice);
 function currentGroups(){return new Map((data?.groups||[]).map(g=>[g.id,g]));}
 function fromApi(row){return {...row,group:row.group||currentGroups().get(row.groupId)?.name||row.groupId};}
 function drawCard(item,scroll=false){
  current=isHomework(item)?item:null;
  card.hidden=!current||!teacher();
  if(!current)return;
  status.textContent='3 · WhatsApp sınıf duyurusu · Paylaşım bekliyor';
  preview.replaceChildren();
  preview.append(el('strong','',current.group+' · '+formattedDate(current.date)),el('p','',current.text));
  confirm.disabled=!opened.has(current.id);
  note.textContent=opened.has(current.id)?
   'WhatsApp’ta grup mesajını gönderdikten sonra “Gruba gönderdim”e basın.':'Ödev henüz paylaşıldı olarak işaretlenmedi.';
  if(scroll)card.scrollIntoView({behavior:'smooth',block:'center'});
 }
 function share(item){
  const text=formatText(item);
  window.open('https://wa.me/?text='+encodeURIComponent(text),'_blank','noopener,noreferrer');
  opened.add(item.id);
  if(current?.id===item.id){
   confirm.disabled=false;
   note.textContent='Sınıf grubunu seçip mesajı gönderin; sonra “Gruba gönderdim”i onaylayın.';
  }
  paintPending();
 }
 async function acknowledge(item,button,resultText){
  if(!teacher()||!isHomework(item))return;
  if(!opened.has(item.id)){resultText.textContent='Önce “Gruba yaz” düğmesiyle WhatsApp mesajını açın.';return;}
  button.disabled=true;resultText.textContent='Onay kaydediliyor…';
  try{
   const payload=utf8Base64Url(JSON.stringify({id:item.id}));
   const result=await jsonp('confirmHomeworkShare',{payload});
   if(!result?.saved||result.shareStatus!=='Paylaşıldı')throw Error('Sunucu onay vermedi.');
   pending=pending.filter(x=>x.id!==item.id);
   if(current?.id===item.id){
    current=null;card.hidden=true;document.getElementById('sendHomeworkToGroup').hidden=true;
    formMessage.replaceChildren(el('div','message success','Ders kaydı ve WhatsApp sınıf duyurusu tamamlandı. ✓'));
   }
   opened.delete(item.id);paintPending();
   resultText.textContent='Grup paylaşımını yaptığınız bilgisi kaydedildi. ✓';
   window.dispatchEvent(new Event('ayda:homework-shared'));
  }catch(err){resultText.textContent='Onay kaydedilemedi. WhatsApp mesajını yeniden göndermeyin; bağlantıyı kontrol edip yalnızca onayı tekrar deneyin. '+err.message;}
  finally{button.disabled=false;}
 }
 confirm.addEventListener('click',()=>{if(current)acknowledge(current,confirm,note);});
 function paintPending(){
  backlog.hidden=!teacher()||!pending.length;
  notice.hidden=!teacher()||!pending.length;
  notice.replaceChildren();
  if(!pending.length){list.replaceChildren();backlog.open=false;return;}
  notice.append(el('strong','','WhatsApp’a duyurulmayı bekleyen '+pending.length+' ders var'),el('span','','Tamamlamak için dokun →'));
  summary.textContent='Bekleyen grup duyuruları · '+pending.length;
  list.replaceChildren();
  for(const task of pending.slice(0,25)){
   const row=el('div','ayda-share-pending-item'),head=el('div','ayda-share-pending-head');
   head.append(el('strong','',task.group+' · '+formattedDate(task.date)),el('p','',task.text));
   const controls=el('div','ayda-share-pending-controls'),send=el('button','ayda-share-open','WhatsApp’ta gruba yaz →');
   send.type='button';send.addEventListener('click',()=>{current=task;drawCard(task,false);share(task);});
   const done=el('button','ayda-share-confirm','✓ Gruba gönderdim'),message=el('small','ayda-share-hint');
   done.type='button';done.disabled=!opened.has(task.id);
   done.addEventListener('click',()=>acknowledge(task,done,message));
   controls.append(send,done);row.append(head,controls,message);list.append(row);
  }
 }
 async function refresh(){
  if(!teacher())return;
  const request=++loadId;
  try{
   const result=await jsonp('lessonHomework');
   if(request!==loadId||!teacher())return;
   pending=(result.items||[]).filter(r=>r.shareStatus==='Bekliyor').map(fromApi);
   // A just-saved record can appear in the UI before the refetch finishes.
   if(current&&!pending.some(t=>t.id===current.id))pending.unshift(current);
   pending.sort((a,b)=>b.date.localeCompare(a.date));
   paintPending();
  }catch{
   if(request!==loadId)return;
   notice.hidden=false;
   notice.replaceChildren(el('span','', 'Grup duyurusu kontrolü için güncel Apps Script sürümü gerekiyor.'));
  }
 }
 window.addEventListener('ayda:homework-saved',e=>{
  if(!teacher())return;
  const item={...e.detail,group:e.detail?.groupName};
  if(!isHomework(item))return;
  pending=[item,...pending.filter(t=>t.id!==item.id)];
  drawCard(item,true);paintPending();
 });
 window.addEventListener('ayda:homework-share-opened',e=>{
  if(!current||current.id!==e.detail?.id)return;
  opened.add(current.id);confirm.disabled=false;
  note.textContent='WhatsApp’ta sınıf grubunu seçip gönderdikten sonra “Gruba gönderdim”e basın.';
  paintPending();
 });
 window.addEventListener('ayda:login',refresh);
 window.addEventListener('ayda:saved',refresh);
 window.addEventListener('ayda:logout',()=>{
  loadId++;current=null;pending=[];opened.clear();card.hidden=true;backlog.hidden=true;notice.hidden=true;backlog.open=false;list.replaceChildren();
 });
})();