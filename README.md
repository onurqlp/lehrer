# AYDA Akademik Takip

**Öğretmen / girişli yönetici paneli:** https://lehrer.aydadil.com/  
**Girişli tam yönetici takip merkezi:** https://lehrer.aydadil.com/yonetici.html


## Kurs sahibi takip merkezi (15 Ekim 2026)
- `yonetici.html` artık **ayrı ve sadece görüntüleme** amaçlı bir yönetici rapor panelidir. Düzenleme, öğretmen oluşturma, grup değiştirme, parola değiştirme, kayıt ekleme/silme, ders kaydetme işlemleri bulunmaz.
- **Dokuz bölüm:** Genel Bakış; Öğrenciler; Yoklama & Ödev; Gruplar; Ders Kayıtları; Öğretmenler & Saat; Ders Programı; Uyarılar; Hesaplar.
- Ayrıntılar: Aktif/tüm gruplar, seviye, öğretmen, öğrenci sayısı, müfredat ilerlemesi, planlanan ve tahmini tarihler, haftalık gün/saat, grup ve özel dersler, işlenen konu, öğretmen notu, rapor durumu ve süreleri, öğretmen aylık toplamları/CSV, öğrenci bazında yoklama/ödev istatistikleri, son beş bireysel kayıt, risk uyarıları, öğretmen hesap ve anahtar arşiv durumu.
- Ana yönetim panelindeki `overview` + `trackingSummary` uç noktalarını mevcut yönetici anahtarıyla **salt okunur** çağırır. Giriş oturumu `index.html` ile aynı sekmede korunur. Veriler menülerde dinamik gösterilir; mobil ve masaüstü için farklı yoğunluklar vardır.
- **Bu arayüz güncellemesinde Google Apps Script kodu değiştirilmedi; yeni sürüm dağıtmaya gerek yoktur.** Öğretmen sayfasındaki günlük kayıt ve yönetici düzenleme işlemleri `index.html` üzerinden çalışmaya devam eder.
- Risk sınıflandırması: son beşte üç mazeretsiz devamsızlık veya üst üste iki mazeretsiz devamsızlık ya da beş kontrol edilen ödevden üç eksik = öncelikli. Daha hafif uyarılar = takip edilmeli. Kayıt olmayan öğrenci riskli sayılmaz.

## Bileşenler
- `index.html` + `assets/app.js`: öğretmen ve yönetici girişi, ders raporları, grup yönetimi, kolay parola belirleme.
- `yonetici.html`: salt okunur kurs sahibi paneli; dokuz sekmeli analiz.
- `assets/owner.js` + `assets/owner.css` + `assets/manager.css`: kurs sahibi için tüm yönetim verilerinin salt okunur, filtrelenebilir ve mobil uyumlu görünümü.
- `assets/manager.js`, `assets/manager-compact.js`, `assets/viewer.js`: önceki prototipler; `yonetici.html` bunları yüklemez.
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
- **Yeni parola kuralı (16 Ekim 2026):** Yönetici ve tüm öğretmenler için minimum 3 karakterdir; harf, rakam, sembol, boşluk ve bunların kombinasyonları serbesttir. Giriş API'sindeki teknik sınır nedeniyle en fazla 150 karakter kabul edilir. Eski parolalar kullanıcı kendisi değiştirene kadar geçerlidir. Bu kuralın çalışması için güncel `apps-script/Code.gs` yeniden mevcut web uygulamasına **Yeni sürüm** olarak dağıtılmalıdır.
- **Yazma istekleri ağ hatasında otomatik tekrar edilmez:** dersin iki kez kaydedilmesini önler.

## Durum
Kurs sahibi takip merkezi artık yalnızca okumaya yetkilidir ve mevcut Apps Script sürümüyle çalışır. Yeni UI GitHub'da güncellendi, canlı Google verileriyle son tarayıcı kontrolü yapılmalıdır.
