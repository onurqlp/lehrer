import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const file=path=>fs.readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('giriş ekranlarında özel bağlantı vaadi bulunmaz',()=>{
 const teacher=file('index.html'),manager=file('yonetici.html');
 assert.doesNotMatch(teacher,/Size özel bağlantı geldiyse anahtar otomatik okunur/);
 assert.doesNotMatch(manager,/Ortağa özel bağlantı ilk kez açıldığında cihaz tanınır/);
 assert.match(teacher,/id="loginForm"/);
 assert.match(manager,/id="ownerLoginForm"/);
});

test('URL query veya hash içindeki anahtarla giriş yapılmaz',()=>{
 const app=file('assets/app.js'),owner=file('assets/owner.js');
 assert.doesNotMatch(app,/fromLink|qs\.get\('key'\)/);
 assert.doesNotMatch(owner,/linkToken|#izleme=/);
 assert.match(app,/sessionStorage\.getItem\('aydaKey'\)/);
 assert.match(owner,/viewerSession\.read\(\)/);
});
