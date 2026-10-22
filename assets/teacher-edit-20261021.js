/* AYDA teacher profile management · independent from lesson/group records */
(()=>{'use strict';
 const $=id=>document.getElementById(id),form=$('aydaTeacherEditForm');if(!form)return;
 const pick=$('aydaTeacherEditPick'),name=$('aydaTeacherEditName'),phone=$('aydaTeacherEditPhone'),type=$('aydaTeacherEditType'),send=$('aydaTeacherEditSave'),result=$('aydaTeacherEditResult');
 const info=(text,success)=>{result.replaceChildren();const p=document.createElement('p');p.className='message '+(success?'success':'error');p.textContent=text;result.append(p);};
 const current=()=>typeof data!=='undefined'&&data?.user?.role==='admin'?data:null;
 function choose(){
  const t=current()?.teachers?.find(x=>x.id===pick.value);
  name.value=t?.name||'';phone.value=t?.phone?'+'+t.phone:'';type.value=t?.teacherType||'kurs';
  send.disabled=!t;
 }
 function refresh(){
  const d=current();if(!d)return;
  const id=pick.value;pick.replaceChildren(new Option('Öğretmen seçin',''));
  for(const t of d.teachers||[])if(t.status!=='Silindi')pick.add(new Option(t.name+' · '+t.id,t.id));
  if([...pick.options].some(o=>o.value===id))pick.value=id;
  choose();
 }
 pick.addEventListener('change',choose);
 form.addEventListener('submit',async e=>{
  e.preventDefault();const teacherId=pick.value;if(!teacherId)return info('Öğretmen seçin.',false);
  const payload={teacherId,name:name.value.trim(),phone:phone.value.trim(),teacherType:type.value};
  const digits=payload.phone.replace(/\D/g,'');
  if(!/^(?:90[1-9]\d{9}|0[1-9]\d{9}|[1-9]\d{9})$/.test(digits))return info('Telefon 05xxxxxxxxx biçiminde olmalıdır.',false);
  send.disabled=true;info('Öğretmen bilgileri doğrulanıyor…',true);
  try{
   const status=await jsonp('ping');
   if(String(status.version||'')!=='2026-10-21.9')throw Error('Beta API sürümü beklenenden farklı.');
   const saved=await jsonp('updateTeacher',{payload:utf8Base64Url(JSON.stringify(payload))});
   if(!saved?.saved||saved.teacherId!==teacherId)throw Error('Google kayıt onayı alınamadı. Tekrar işlem yapmadan önce güncel verileri kontrol edin.');
   data=await jsonp('overview');refresh();window.dispatchEvent(new Event('ayda:admin-data-updated'));
   info('Öğretmen bilgileri güncellendi. Öğretmen kimliği ve eski ders kayıtları korundu.',true);
  }catch(err){info(err.message||'Öğretmen güncellenemedi.',false);}
  finally{send.disabled=false;}
 });
 window.addEventListener('ayda:login',refresh);
 window.addEventListener('ayda:admin-data-updated',refresh);
 refresh();
})();