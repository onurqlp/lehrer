/* AYDA Lehrer TEST: production Google Sheets write protection. */
(function(){
  'use strict';
  const readable = new Set([
    'ping','overview','studentRoster','trackingSummary','vaultExport',
    'adminStudents','reminders','studentNotes','teacherMonthly','makeupList',
    'teacherFeedback','feedbackInbox','contactDirectory','homeworkTasks',
    'lessonHomework','integrityStatus','backupStatus'
  ]);
  function isBlocked(node){
    if (!(node instanceof HTMLScriptElement) || !node.src) return false;
    try {
      const u = new URL(node.src, document.baseURI);
      return u.hostname === 'script.google.com' &&
        !readable.has(u.searchParams.get('action') || '');
    } catch (_) { return false; }
  }
  function blocked(node){
    const action = new URL(node.src,document.baseURI).searchParams.get('action') || 'unknown';
    console.warn('[AYDA TEST] Production write blocked:',action);
    document.dispatchEvent(new CustomEvent('ayda:test-write-blocked',{detail:{action}}));
    queueMicrotask(()=>{if(typeof node.onerror==='function')node.onerror(new Event('error'));});
    return node;
  }
  const originalAppend = Element.prototype.append;
  Element.prototype.append = function(...nodes){
    const allowed=[];
    for(const n of nodes){if(isBlocked(n))blocked(n);else allowed.push(n);}
    if(allowed.length)return originalAppend.apply(this,allowed);
  };
  const originalAppendChild=Node.prototype.appendChild;
  Node.prototype.appendChild=function(node){
    if(isBlocked(node))return blocked(node);
    return originalAppendChild.call(this,node);
  };
  const originalInsertBefore=Node.prototype.insertBefore;
  Node.prototype.insertBefore=function(node,ref){
    if(isBlocked(node))return blocked(node);
    return originalInsertBefore.call(this,node,ref);
  };
  document.addEventListener('DOMContentLoaded',()=>{
    const badge=document.createElement('div');
    badge.textContent='TEST ORTAMI · Canlı verilere kayıt kapalı';
    badge.setAttribute('role','status');
    badge.style.cssText='position:fixed;bottom:8px;right:8px;z-index:2147483647;background:#12374d;color:#fff;font:600 12px/1.4 system-ui,sans-serif;padding:8px 12px;border-radius:9px;box-shadow:0 3px 15px #0003;max-width:calc(100vw - 24px);pointer-events:none';
    document.body.appendChild(badge);
    document.addEventListener('ayda:test-write-blocked',()=>{
      badge.textContent='TEST · Kayıt engellendi, canlı Google verileri korunuyor';
    });
  },{once:true});
})();
