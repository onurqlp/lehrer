"use strict";
/* Per-student observations are optional and permission checked server-side. */
(()=>{
 const el=(tag,cls,text)=>{const x=document.createElement(tag);if(cls)x.className=cls;if(text!==undefined)x.textContent=String(text);return x;};
 const encode=s=>{const bytes=new TextEncoder().encode(s);let bin='';for(const b of bytes)bin+=String.fromCharCode(b);return btoa(bin).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');};
 window.AYDA_NOTES={
  mount(container,student,api){
   if(!container||!student?.id||typeof api!=='function')return;
   const details=el('details','ayda-student-note'),summary=el('summary','','📝 Öğrenci gözlemleri · İsteğe bağlı');
   const content=el('div'),history=el('div','ayda-note-history'),textarea=el('textarea');
   textarea.placeholder='Örn. Kelime tekrarı gerekli. Konuşma pratiği arttı.';textarea.maxLength=700;textarea.setAttribute('aria-label','Öğrenci gözlem notu');
   const controls=el('div','ayda-note-actions'),save=el('button','ayda-inline-btn','Notu kaydet'),state=el('span','ayda-note-state');
   save.type='button';controls.append(save,state);content.append(history,textarea,controls);details.append(summary,content);container.append(details);
   let loaded=false,busy=false;
   async function load(){
    if(busy)return;busy=true;state.textContent='Notlar yükleniyor…';
    try{const data=await api('studentNotes',{studentId:student.id});history.replaceChildren();
     for(const note of data.notes||[]){const box=el('p','',note.text);box.append(el('small','',note.created+' · '+note.teacherId));history.append(box);}
     if(!history.children.length)history.append(el('p','','Henüz gözlem notu yok.'));loaded=true;state.textContent='';
    }catch(err){state.textContent='Notlar yüklenemedi: '+err.message;}
    finally{busy=false;}
   }
   details.addEventListener('toggle',()=>{if(details.open&&!loaded)load();});
   save.addEventListener('click',async()=>{
    const text=textarea.value.trim();if(text.length<3){state.textContent='En az 3 karakter yazın.';return;}
    if(busy)return;busy=true;save.disabled=true;state.textContent='Kaydediliyor…';
    try{const result=await api('saveStudentNote',{payload:encode(JSON.stringify({studentId:student.id,note:text}))});
     if(!result.saved)throw Error('Sunucudan kayıt onayı alınamadı.');
     textarea.value='';loaded=false;state.textContent='Not kaydedildi.';busy=false;await load();
    }catch(err){state.textContent='Kayıt doğrulanamadı; tekrar kaydetmeden önce kontrol edin. '+err.message;}
    finally{busy=false;save.disabled=false;}
   });
  }
 };
})();