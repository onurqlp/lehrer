# AYDA Akademik Takip

**Öğretmen / girişli yönetici paneli:** https://lehrer.aydadil.com/  
**Girişli tam yönetici takip merkezi:** https://lehrer.aydadil.com/yonetici.html


## Yeni takip merkezi (15 Ekim 2026)
- `yonetici.html` yönetici anahtarıyla açılır; öğrenci takibi, yoklama, ödev, ders ve öğretmen özetleri gösterir. Kullanıcı `index.html` üzerinden yönetici olarak giriş yapıp aynı sekmede bu sayfaya geçerse mevcut oturum korunur.
- Kompakt yönetici sayfası `index.html` ile **aynı** `assets/app.js`, `assets/admin-menu.js` ve kayıt formlarını kullanır; grup açma/düzenleme, öğretmen ekleme, parola yönetimi, yoklama/ödev, ders ve muhasebe tamamen aynıdır. Yalnızca görünüm ve sıralama farklıdır.
- Kompakt sekmeler: Genel Bakış, Öğrenci Takibi, **Öğrenci 360 (tekil öğrenci listesi, son 5 yoklama/ödev, arama, grup/risk filtreleri)**, Ders ve Muhasebe, Grup İşlemleri, Öğretmenler ve Anahtarlar, Düzenle. Diğer ortak modüller "Diğer günlük işlemler ve kayıtlar" altında erişilir.
- Öğretmen ana sayfasında **Öğrencilerim · Takip Merkezi** bulunur. Yeni `trackingSummary` yalnızca öğretmenin yetkili olduğu aktif grupları döndürür.
- Risk: üst üste 2 mazeretsiz devamsızlık, son 5 yoklamada 3 mazeretsiz devamsızlık veya son 5 ödevde 3 eksik => öncelikli. 1 mazeretsiz devamsızlık ya da son 5'te 2 eksik ödev => takip edilmeli. Kayıt yoksa risk hesaplanmış gibi gösterilmez.
- **Sadece kompakt arayüz güncellemesi:** Yeni `yonetici.html` aynı mevcut `overview`, `trackingSummary` ve yönetim uçlarını kullandığından Google Apps Script dosyasında veya dağıtımında değişiklik gerekmez. Apps Script kodu ayrıca değişirse, mevcut web uygulamasının yeni sürümü yayımlanmalıdır. Dağıtım ID'sini değiştirmeyin.
- Yönetici anahtarı mevcut değilse ilk anahtar kurulmalıdır; daha önce varsa otomatik silinmez. Yönetici anahtarını kimseyle paylaşmayın.
- `publicDashboard` anonim özet verisi döndürür (öğrenci adı, yoklama ve ödev yok). Ayrıntılı yönetici sayfası ise giriş anahtarı gerektiren `overview` + `trackingSummary` yanıtlarını kullanır.

## Bileşenler
- `index.html` + `assets/app.js`: öğretmen ve yönetici girişi, ders raporları, grup yönetimi, kolay parola belirleme.
- `yonetici.html`: `index.html` ile aynı modülleri kullanan tam özellikli yönetici görünümü.
- `assets/manager-compact.js` + `assets/manager-compact.css`: mobil/masaüstü kompakt yerleşim, ek yönetici KPI'ları ve Öğrenci 360. Yönetici/öğretmen ana işlemlerinin ayrı kopyaları **yoktur**.
- `assets/manager.js` + `assets/manager.css` ve `assets/viewer.js` + `assets/viewer.css`: önceki prototip/sürüm dosyaları, artık sayfalara yüklenmez.
- `assets/teacher-tracking.js` + `assets/teacher-tracking.css`: öğretmenin kendi öğrenci durumları.
- `assets/attendance-preview.js`: girişten sonra Apps Script `studentRoster` çağrısı, yoklama, mazeret, isteğe bağlı ödev kontrolü; tek rapor kaydı.
- `assets/viewer.js`: şifresiz akademik pano, **yalnızca** `publicDashboard` salt-okunur çağrısı.
- `assets/config.js`: Apps Script dağıtım URL'si.
- `apps-script/Code.gs`: **tam Apps Script kaynak kodu**; Google Apps Script projesindeki `Kod.gs` ile aynı tutulmalı.

## Google Apps Script yayımlama
1. AYDA Google Sheets → **Uzantılar → Apps Script** bölümünü açın.
2. Mevcut `Kod.gs` kodunu yedekleyin; GitHub'daki `apps-script/Code.gs` içeriğinin tamamını yapıştırın, **Ctrl+S** ile kaydedin.
3. Üstteki fonksiyon menüsünden **`aydaHealthCheck`** seçin → **Çalıştır**. Google izinlerini onaylayın. Yürütme kaydında `ok:true` görünmeli. Bu kontrol gerçek öğrenci bilgilerini günlüklemez.
4. **Dağıt → Dağıtımları yönet → Mevcut web uygulaması → Düzenle (kalem) → Sürüm: Yeni sürüm → Dağıt.**
5. Web uygulaması **Çalıştıran: Ben**, **Erişimi olanlar: Herkes** olmalı. `aydadil.com` kullanıcılarıyla sınırlı erişim, şifresiz GitHub panosunu engeller.
6. Yeni dağıtımın `/exec` URL'si değişirse `assets/config.js` dosyasını güncelleyin.

## Dağıtım testi
Şu bağlantı biçimini gizli pencerede açın:

```
https://script.google.com/macros/s/DAĞITIM_KİMLİĞİ/exec?action=ping&callback=ayda_cb_test123
```

Beklenen yanıt:
```js
ayda_cb_test123({"ok":true,"data":{"status":"ok","version":"2026-10-15.4"}});
```

Google giriş / Drive hata sayfası görünüyorsa **GitHub değil Apps Script dağıtım erişimi** sorunludur. Workspace yöneticisi "Herkes" erişimini kısıtlamış olabilir.

## Veriler ve erişim
- `OGRENCILER`: aktif gruplarla eşleşmiş öğrenciler.
- `YOKLAMA`: ders raporuna bağlı geldi / gelmedi / mazeretli.
- `ODEV_TAKIBI`: kontrol varsa yaptı / yapmadı / kontrol edilmedi.
- Öğrenci listesi ve kişisel devamsızlık raporları yalnızca doğrulanmış girişli panelde gösterilir.
- Şifresiz `publicDashboard` **öğrenci adları, bireysel yoklama, ödev, öğretmen özel notları, giriş anahtarları veya serbest metin konu bilgileri** döndürmez.
- Yeni parolalar Script Properties içinde özet değer (hash) olarak saklanır. Eski giriş anahtarları, parola değiştirilene kadar çalışır.
- **Yazma istekleri ağ hatasında otomatik tekrar edilmez:** dersin iki kez kaydedilmesini önler.

## Durum
Kompakt yönetici arayüzü ve ana yönetim panelinin kaynak kodları ortak. Güncel UI değişikliği için Google Apps Script'e yeni kod kopyalanması gerekmez. Kullanıcı önceki turda canlı Google bağlantısının çalıştığını doğruladı; bu UI sürümünün tarayıcıdaki son görünümü ayrıca kontrol edilmelidir.
