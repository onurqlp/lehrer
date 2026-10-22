import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import { webcrypto } from 'node:crypto';

const require = createRequire(import.meta.url);
const { createSpreadsheetShim } = require('../api/gas-compat.cjs');

function makeApi() {
  const state = {
    properties: { AYDA_ADMIN_HASH: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08' },
    sheets: {
      AYARLAR: [['Ayar', 'Değer'], ['Sistem', 'Beta']],
      OGRETMENLER: [['ID', 'Öğretmen', 'E-posta', 'Durum'], ['H001', 'Test Eğitmeni', 'test@example.invalid', 'Aktif']],
      GRUPLAR: [['ID', 'Grup', 'Seviye', 'Öğretmen ID', 'Başlangıç', 'Planlanan Bitiş', 'Öğrenci', 'Son Tamamlanan Ünite', 'Toplam Ünite', 'Durum', 'WhatsApp'], ['G001', 'Beta A1', 'A1', 'H001', '2026-10-21', '', 2, 1, 24, 'Aktif', '']],
      HAFTALIK_PROGRAM: [['Grup ID', 'Gün', 'Başlangıç', 'Bitiş', 'Durum'], ['G001', 'Pazartesi', '10:00', '12:00', 'Aktif']],
      DERS_KAYITLARI: [['Kayıt ID', 'Tarih', 'Grup ID', 'Öğretmen ID', 'Planlanan Başlangıç', 'Planlanan Bitiş', 'Gerçekleşen Ders Saati', 'Durum', 'İşlenen Ünite', 'Tamamlanan Ünite', 'İşlenen Konu', 'Öğretmen Notu', 'Kayıt Zamanı']],
      OZEL_DERSLER: [['Paket ID', 'Öğrenci', 'Öğretmen ID', 'Satın Alınan Ders', 'Kullanılan Ders', 'Kalan Ders', 'Durum']],
      OZEL_DERS_KAYITLARI: [['Kayıt ID', 'Paket ID', 'Tarih', 'Öğretmen ID', 'Ders Sayısı', 'İşlenen Konu', 'Durum', 'Kayıt Zamanı']],
      KULLANICILAR: [['Kullanıcı ID', 'Kullanıcı Adı', 'Öğretmen ID', 'Rol', 'Durum'], ['U001', 'Test Eğitmeni', 'H001', 'Öğretmen', 'Aktif']],
      DEGISIKLIK_GECMISI: [['Tarih', 'Kullanıcı', 'İşlem', 'Tablo', 'Kayıt ID', 'Açıklama']],
      OGRENCILER: [['OGRENCI_ID', 'AD_SOYAD', 'GRUP_ID', 'GRUP_ADI', 'SEVIYE', 'CRM_GRUP_ADI', 'CRM_DURUMU', 'CRM_BASLANGIC', 'KAYNAK', 'AKTARIM_TARIHI'], ['S001', 'Beta Öğrencisi', 'G001', 'Beta A1', 'A1', 'Beta A1', 'Aktif', '', 'Excel', '',], ['S002', 'Deneme Öğrencisi', 'G001', 'Beta A1', 'A1', 'Beta A1', 'Aktif', '', 'Excel', '']],
      YOKLAMA: [['YOKLAMA_ID', 'DERS_KAYIT_ID', 'TARIH', 'GRUP_ID', 'OGRENCI_ID', 'KATILIM', 'MAZERETLI', 'OGRETMEN_ID', 'KAYIT_ZAMANI']],
      ODEV_TAKIBI: [['ODEV_KAYIT_ID', 'DERS_KAYIT_ID', 'TARIH', 'GRUP_ID', 'OGRENCI_ID', 'ODEV_DURUMU', 'OGRETMEN_ID', 'KAYIT_ZAMANI']],
      OGRETMEN_REHBERI: [['KISI_ID', 'AD_SOYAD', 'TELEFON', 'KURUM_NOTU', 'OGRETMEN_ID', 'ESLESME', 'DURUM']],
      OGRENCI_ILETISIM: [['OGRENCI_ID', 'TELEFON']],
      OGRETMEN_GERI_BILDIRIM: [['GERI_BILDIRIM_ID', 'KAYIT_ZAMANI', 'OGRETMEN_ID', 'OGRETMEN_ADI', 'KATEGORI', 'MESAJ', 'DURUM', 'INCELEME_ZAMANI', 'YONETICI_YANITI']],
      ODEV_GOREVLERI: [['GOREV_ID', 'GRUP_ID', 'OGRETMEN_ID', 'BASLIK', 'ACIKLAMA', 'VERILIS_TARIHI', 'TESLIM_TARIHI', 'DURUM', 'OLUSTURMA_ZAMANI', 'GUNCELLEME_ZAMANI']],
      ODEV_GOREV_GECMISI: [['ISLEM_ID', 'GOREV_ID', 'ESKI_TESLIM_TARIHI', 'YENI_TESLIM_TARIHI', 'ISLEM_TURU', 'OGRETMEN_ID', 'ACIKLAMA', 'ZAMAN']],
      DERS_ODEVLERI: [['ODEV_ID', 'DERS_KAYIT_ID', 'TARIH', 'GRUP_ID', 'OGRETMEN_ID', 'VERILEN_ODEV', 'KAYIT_ZAMANI', 'PAYLASIM_DURUMU', 'PAYLASIM_ZAMANI', 'PAYLASAN_OGRETMEN_ID']]
    }
  };
  const globals = createSpreadsheetShim(state);
  const code = readFileSync(new URL('../apps-script/Code.gs', import.meta.url), 'utf8');
  const context = vm.createContext({ ...globals, crypto: webcrypto, Date, console });
  vm.runInContext(code, context, { filename: 'Code.gs' });
  return (action, key = 'test', extra = {}) => {
    context.SpreadsheetApp = { ...globals.SpreadsheetApp, openById: () => globals.SpreadsheetApp.openById('beta') };
    return context.doGet({ parameter: { action, key, callback: 'ayda_cb_beta', ...extra } });
  };
}

test('beta API keeps the Apps Script JSONP contract on the synthetic Excel-shaped store', () => {
  const api = makeApi();
  const ping = api('ping');
  assert.match(ping.text, /^ayda_cb_beta\(\{"ok":true/);
  const response = api('overview');
  const body = JSON.parse(response.text.slice('ayda_cb_beta('.length, -2));
  assert.equal(body.ok, true);
  assert.equal(body.data.user.role, 'admin');
  assert.equal(body.data.groups[0].name, 'Beta A1');
  assert.equal(body.data.teachers[0].name, 'Test Eğitmeni');
});

test('Vercel API bundles the original Apps Script source as executable text', () => {
  const bundled = require('../api/code-source.cjs');
  assert.equal(Buffer.from(bundled, 'base64').toString('utf8'), readFileSync(new URL('../apps-script/Code.gs', import.meta.url), 'utf8'));
});

test('beta backup actions create only an optional Neon snapshot', () => {
  const api = makeApi();
  const setup = JSON.parse(api('backupSetup').text.slice('ayda_cb_beta('.length, -2));
  assert.equal(setup.ok, true);
  assert.equal(setup.data.provider, 'Neon beta');
  assert.equal(setup.data.verified, true);
  assert.equal(setup.data.manual, true);
  assert.equal(setup.data.daily, false);
  const status = JSON.parse(api('backupStatus').text.slice('ayda_cb_beta('.length, -2));
  assert.equal(status.data.provider, 'Neon beta');
  assert.equal(status.data.exists, true);
  assert.equal(status.data.installed, false);
});

test('beta teacher-key creation stores its private archive in the beta database', () => {
  const api = makeApi();
  const created = JSON.parse(api('rotateKey', 'test', { target: 'U001' }).text.slice('ayda_cb_beta('.length, -2));
  assert.equal(created.ok, true);
  assert.equal(created.data.target, 'U001');
  assert.ok(created.data.key.length > 30);
  const archived = JSON.parse(api('vaultExport').text.slice('ayda_cb_beta('.length, -2));
  assert.equal(archived.ok, true);
  assert.ok(archived.data.rows.some(row => row.accountId === 'U001' && row.key === created.data.key));
});

test('beta API and pages point to same-origin Vercel; production Apps Script URL stays out of the public client config', () => {
  const config = readFileSync(new URL('../assets/config.js', import.meta.url), 'utf8');
  assert.match(config, /AYDA_API_URL\s*=\s*['"]\/api['"]/);
  assert.doesNotMatch(config, /script\.google\.com\/macros\/s\//);
});

test('beta browser code has no Google endpoint fallback', () => {
  for (const path of ['assets/app.js','assets/manager.js','assets/owner.js','assets/viewer.js','assets/ayda-grup-arsivi.js']) {
    const code = readFileSync(new URL('../'+path, import.meta.url), 'utf8');
    assert.doesNotMatch(code, /https:\/\/script\.google\.com/);
  }
  for (const path of ['index.html','yonetici.html','grup-arsivi.html']) {
    const page = readFileSync(new URL('../'+path, import.meta.url), 'utf8');
    assert.doesNotMatch(page, /script\.google\.com|googleusercontent\.com/);
  }
});
