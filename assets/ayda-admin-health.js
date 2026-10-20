/* AYDA shared admin system health — read-only */
(()=>{'use strict';
const root=document.getElementById('aydaAdminHealthIssues');if(!root)return;
const make=(tag,text)=>{const x=document.createElement(tag);if(text!==undefined)x.textContent=String(text);return x;};
const names=/(?:^|\s)(?:ödendi|ödenmedi|taksit(?:ler)?|borç|bakiye|ödeme|peşin|hesap|öğrenci|toplamı|danışmanlık|abisi|oğlu|kızı|eltden|elt|cncler|multimanustan|imam|ark|ağustos|agustos|ank|elazığ|yeni|hanım|bey|müsdavdan|yaseminden)(?=\s|$)/iu;
function issueName(s){const p=String(s||'').trim().split(/\s+/).filter(Boolean);return p.length<2||/[0-9?!@]/.test(s)||names.test(s)||p.length>4;}
function add(title,detail,href,label){const c=make('div');c.className='ayda-shared-health-item';const a=make('strong',title),b=make('small',detail),link=make('a',label||'Düzelt →');link.href=href;c.append(a,b,link);root.append(c);}
const link=(fix,groupId,studentId)=>{const q=new URL('./index.html',location.href);q.searchParams.set('aydaFix',fix);if(groupId)q.searchParams.set('groupId',groupId);if(studentId)q.searchParams.set('studentId',studentId);q.hash=fix==='student'?'grup-islemleri':'duzenle';return q.href;};
async function update(){
 if(typeof data==='undefined'||data?.user?.role!=='admin')return;
 root.replaceChildren();const groups=data.groups||[],active=new Set(groups.filter(g=>g.status==='Aktif').map(g=>g.id));
 const schedule=data.schedule||[],teachers=data.teachers||[];
 for(const g of groups.filter(g=>active.has(g.id))){
  if(!g.teacherId||!teachers.some(t=>t.id===g.teacherId&&t.status==='Aktif'))add(g.name+' · Öğretmen','Öğretmen ataması kontrol edilmeli.',link('teacher',g.id));
  const rows=schedule.filter(r=>r.groupId===g.id);
  if(!rows.length||rows.some(r=>r.status!=='Aktif'||!r.end))add(g.name+' · Haftalık program','Ders günü veya bitiş saati eksik.',link('schedule',g.id));
 }
 try{const res=await jsonp('trackingSummary');const flagged=(res?.students||[]).filter(s=>active.has(s.groupId)&&issueName(s.name));for(const s of flagged)add('Öğrenci adı · '+s.name,'Ad-soyad alanını kontrol edin.',link('student',s.groupId,s.id),'Adı düzenle →');}
 catch(e){add('Öğrenci kontrolü yüklenemedi',e.message,'./yonetici.html#health','Kontrol ekranına git →');}
 if(!root.children.length)root.append(make('p','Kontrol edilen bilgilerde sorun bulunmadı.'));
}
window.addEventListener('ayda:login',update);
window.addEventListener('ayda:logout',()=>root.replaceChildren(make('p','Yönetici girişi gerekli.')));
if(typeof data!=='undefined'&&data?.user?.role==='admin')update();
})();