'use strict';
const $=id=>document.getElementById(id);let authKey='',data=null,requestNo=0;
const $el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=String(text);return n;};
const clear=id=>$(id).replaceChildren();
function message(id,text,kind='error'){const n=$el('div','message '+kind,text);$(id).replaceChildren(n);}
function jsonp(action,params={}){
 return new Promise((resolve,reject)=>{
  const api=String(window.AYDA_API_URL||'').trim();if(!/^https:\/\/script\.google\.com\//.test(api)){reject(Error('API adresi ayarlanmamış.'));return;}
  const cb='ayda_cb_'+Date.now()+'_'+(++requestNo),url=new URL(api),script=document.createElement('script');let settled=false;
  const finish=(err,result)=>{if(settled)return;settled=true;delete window[cb];script.remove();clearTimeout(timer);err?reject(err):resolve(result);};
  const timer=setTimeout(()=>finish(Error('Sunucu yanıt vermedi. Apps Script dağıtım erişimini kontrol edin.')),25000);
  window[cb]=r=>{if(!r||!r.ok)finish(Error((r&&r.error)||'Bilinmeyen hata.'));else finish(null,r.data);};
  url.searchParams.set('callback',cb);url.searchParams.set('action',action);url.searchParams.set('key',authKey);
  for(const [k,v] of Object.entries(params))url.searchParams.set(k,v);
  script.onerror=()=>finish(Error('API bağlantısı kurulamadı. Apps Script erişimini kontrol edin.'));
  script.src=url.toString();document.head.append(script);
 });
}
function utf8Base64Url(s){const bytes=new TextEncoder().encode(s);let binary='';for(const b of bytes)binary+=String.fromCharCode(b);return btoa(binary).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');}
async function login(key){authKey=String(key||'').trim();$('loginBtn').disabled=true;clear('loginMessage');try{const result=await jsonp('overview');data=result;sessionStorage.setItem('aydaKey',authKey);$('login').classList.add('hidden');$('app').classList.remove('hidden');$('logout').classList.remove('hidden');render();}catch(e){authKey='';message('loginMessage',e.message);}finally{$('loginBtn').disabled=false;}}
function rowcard(title,subtitle,tag){const n=$el('div','card rowcard'),left=$el('div');left.append($el('strong','',title),$el('div','muted',subtitle));n.append(left,$el('span','tag',tag));return n;}
function render(){const u=data.user,admin=u.role==='admin',groups=data.groups,schedule=data.schedule,history=data.history;$('roleChip').textContent=admin?'Yönetici Paneli':'Öğretmen Paneli';$('welcome').textContent='Merhaba, '+u.name;$('dateLine').textContent='Bugün: '+data.today;$('groupTitle').textContent=admin?'Tüm Gruplar':'Gruplarım';$('groupCount').textContent=groups.length;$('todayCount').textContent=data.todayLessons.length;$('reportCount').textContent=history.length;$('studentCount').textContent=groups.reduce((n,g)=>n+(Number(g.students)||0),0);$('lessonDate').value=data.today;$('lessonDate').max=data.today;
 clear('todayLessons');if(!data.todayLessons.length)$('todayLessons').append($el('div','card empty','Bugün planlanan ders bulunmuyor.'));for(const p of data.todayLessons)$('todayLessons').append(rowcard(p.group,p.day,p.start+' – '+p.end));
 clear('groups');for(const g of groups){const card=$el('div','card');card.append($el('span','tag',g.level),$el('h3','',g.name),$el('div','muted','Öğrenci: '+g.students+' · Öğretmen ID: '+g.teacherId),$el('div','muted','Tamamlanan ünite: '+g.completed+' / '+g.total));const progress=$el('div','progress'),fill=$el('div');fill.style.width=(g.total?Math.min(100,100*g.completed/g.total):0)+'%';progress.append(fill);card.append(progress);$('groups').append(card);}if(!groups.length)$('groups').append($el('div','card empty','Aktif grup bulunamadı.'));
 clear('schedule');for(const p of schedule)$('schedule').append(rowcard(p.day+' · '+p.group,p.status,p.start+' – '+p.end));if(!schedule.length)$('schedule').append($el('div','card empty','Haftalık program bulunamadı.'));
 clear('groupId');$('groupId').append(new Option('Grup seçin',''));clear('historyFilter');$('historyFilter').append(new Option('Tüm gruplar',''));for(const g of groups){$('groupId').append(new Option(g.name,g.id));$('historyFilter').append(new Option(g.name,g.id));}renderHistory();}
function renderHistory(){clear('history');const filter=$('historyFilter').value;const list=data.history.filter(x=>!filter||x.groupId===filter);for(const r of list){const g=data.groups.find(x=>x.id===r.groupId),card=$el('div','card historyitem'),line=$el('div','topline');line.append($el('strong','',(g?g.name:r.groupId)+' · '+r.date),$el('span','tag',r.status));card.append(line,$el('div','muted','Ünite: '+r.unit+' · Tamamlanan: '+r.completed+' · '+r.teacherId),$el('p','',r.topic));if(r.note)card.append($el('div','muted',r.note));$('history').append(card);}if(!list.length)$('history').append($el('div','card empty','Henüz rapor bulunmuyor.'));}
$('historyFilter').addEventListener('change',renderHistory);
$('loginForm').addEventListener('submit',e=>{e.preventDefault();login($('key').value);});
$('logout').addEventListener('click',()=>{sessionStorage.removeItem('aydaKey');authKey='';data=null;$('app').classList.add('hidden');$('login').classList.remove('hidden');$('logout').classList.add('hidden');$('key').value='';$('roleChip').textContent='Öğretmen ve Yönetici';history.replaceState(null,'',location.pathname);});
$('reportForm').addEventListener('submit',async e=>{e.preventDefault();const b=$('saveBtn');b.disabled=true;b.textContent='Kaydediliyor...';clear('formMessage');try{const payload={groupId:$('groupId').value,date:$('lessonDate').value,unit:Number($('unit').value),completed:Number($('completed').value),actual:$('actual').value,status:$('status').value,topic:$('topic').value,note:$('note').value};await jsonp('save',{payload:utf8Base64Url(JSON.stringify(payload))});message('formMessage','Ders raporu kaydedildi.','success');$('topic').value='';$('note').value='';$('actual').value='';data=await jsonp('overview');render();}catch(err){message('formMessage',err.message);}finally{b.disabled=false;b.textContent='Raporu Kaydet';}});
const qs=new URLSearchParams(location.search),fromLink=qs.get('key')||'';if(fromLink){history.replaceState(null,'',location.pathname);login(fromLink);}else{const previous=sessionStorage.getItem('aydaKey');if(previous)login(previous);}
