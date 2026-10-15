# AYDA Akademik Takip

**Öğretmen / girişli yönetici paneli:** https://lehrer.aydadil.com/  
**Girişli tam yönetici takip merkezi:** https://lehrer.aydadil.com/yonetici.html


## AYDA UI v1.0 — Kurum içi akademik tema (16 Ekim 2026)

- **Reklamsız operasyon paneli:** Öğretmen ve yönetici ekranlarında kurs satışı, kayıt çağrısı, fiyat, pop-up, sabit pazarlama WhatsApp balonu veya alakasız CTA bulunmaz. "Dersi kaydet", "Raporu doldur", "Yardım" gibi görev butonları bu yasağın dışında kalan işlevsel işlemlerdir.
- **Gerçek AYDA logosu:** `assets/ayda-logo.png` kurumun diğer AYDA depolarında kullanılan, 429 × 144 piksel şeffaf beyaz logonun aynısıdır. Her iki panelde koyu lacivert başlıkta kullanılır; sahte metin logosu kullanılmaz.
- **Ortak tema:** `assets/ayda-brand.css` dosyası AYDA'nın lacivert `#0b1b31`, altın `#e8c37b`, kırık beyaz `#fbf9f5`, açık kart ve kurumsal yazı hiyerarşisini mevcut işlevsel arayüze uygular. Mobilde 320–430 piksele uygun düzenlemeler, görünür klavye odağı, sınırlı hareket ve dokunma hedefleri içerir.
- **Tek, sade destek bağlantısı:** Üst menüdeki **Yardım**, `0537 243 51 23` numarasına hazır teknik destek WhatsApp metnini açar; mesajı otomatik göndermez.
- **Sadece öğretmenler için kaynak alanı:** `assets/teacher-resources.js`, giriş yapmış öğretmenin aktif ders seviyelerine göre A1/A2/B1 tekrar alanlarını seçer; dijital kütüphane, sınav materyalleri ve ders kayıt portalını tek, kapalı tutulabilen "Öğretmen kaynakları" bölümünde sunar. Kaynakları pazarlamaz; öğrenci kartlarına tekrarlayan butonlar eklemez. Kaynakların mevcut erişim sınırlamalarını kaldırmaz.
- **İç sistem sayfaları:** `index.html` ve `yonetici.html` `noindex,nofollow` kullanır. **Noindex güvenlik duvarı değildir**; API'deki öğrenci verilerine erişim hâlâ yetkilendirilmiş girişle korunur.
- **Yayın:** Tema ve arayüz dosyaları GitHub'a işlendi. Bu tasarım güncellemesi için yeni bir Apps Script sürümü gerekmez; ancak önceki akademik otomasyon özelliklerinin canlı kayda geçmesi için alttaki Apps Script dağıtımı hâlâ gereklidir.

## Yeni akademik takip iş akışı (16 Ekim 2026) — GitHub güncellendi, Apps Script dağıtımı bekliyor

Öğretmene ek zorunlu form yüklemeyen çalışma düzeni:

- **Öğretmen:** Ders ekranına hızlı giriş, WhatsApp grup daveti (yalnızca yönetici tanımlarsa), tüm öğrencileri "Hepsi geldi" ile işaretleme veya tek tek geldi/gelmedi seçimi, mazeretli işaretleme ve isteğe bağlı ödev kontrolü. Yoklama artık varsayılan olarak herkes geldi kabul edilmez; "İşaretlenmedi" ile başlar.
- **Yoklaması unutulan ders:** Daha önce kaydedilmiş ders raporuna sonradan **ayrı bir yoklama** eklenebilir; ikinci ders raporu oluşmaz. Aynı ders için mükerrer yoklama engellenir.
- **12 saatlik eksik kayıt tespiti:** Planlı dersin bitiminden 12 saat sonra eksik rapor veya mevcut rapora bağlı eksik yoklama, yetkili **öğretmenin ve yöneticinin** panelinde görünür. Sadece son 30 gün taranır; iptal/ertelendi kaydı mevcutsa eksik sayılmaz. Ders bitiş saati belirtilmemiş programlar taranmaz. Kayıt tamamlanınca yeniden hesaplamada uyarı kendiliğinden kaybolur.
- **Risk uyarısı:** **Üst üste 3 mazeretsiz devamsızlık** veya **son 4 kontrol edilen ödevin 3'ünün yapılmaması**. Mazeretli devamsızlık katılım istatistiğinde sayılır ancak disiplin uyarısını tetiklemez; "Kontrol edilmedi" ödev başarısızlığı sayılmaz. Risk hesabı salt okunur ve girişli kişiye özeldir.
- **Öğrenci akademik dosyası:** Sadece yetkili öğretmen/yönetici öğrencinin son yoklama ve ödevlerini görür. Gözlem notu **isteğe bağlıdır**; ilk kayıtla `OGRENCI_NOTLARI` sekmesi oluşur. Yönetici tarafından "Takipte / Çözüldü" işlemi yapılabilir; yeni yoklama/ödevle risk imzası değişirse önceki kapatma otomatik geçersiz olur.
- **Rapor düzeltme:** Grup dersi raporunun süre veya açıklaması öğretmen ya da yönetici tarafından düzeltilebilir. `RAPOR_DUZELTME_GECMISI` sekmesinde eski ve yeni değerler kaydedilir. Devamsızlık ve ünite ilerlemesi bu işlemde değiştirilmez.
- **Taslak koruma:** Ders formu taslağı aynı tarayıcı sekmesinin oturumunda saklanır, kayıttan/çıkıştan sonra silinir. Öğrencilerin şifreleri, giriş anahtarları veya yoklama listesi taslağa kaydedilmez.
- **Yönetici:** Haftalık akademik özet, 12 saatlik eksik kayıt kuyruğu, öğretmene WhatsApp üzerinden elle gönderilebilecek hazır metin (kopyala), öğrencinin istatistiklerini yazdır/PDF, isteğe bağlı takip durumunu güncelle.
- **Teknik destek:** Öğretmen ve yönetici panolarındaki Yardım bağlantısı **0537 243 51 23** numarasına önceden hazırlanmış WhatsApp mesajı açar. Otomatik mesaj göndermez.
- **Grup WhatsApp bağlantıları:** Yönetici ana panelde Grup Bilgilerini Düzenle bölümünde `WhatsApp` sütununu güncelleyebilir. Bağlantı girişli öğretmen tarafından görülür, şifresiz panoya aktarılmaz.

**Canlıya alma:** GitHub Pages değişiklikleri yayımlayabilir, ancak `apps-script/Code.gs` otomatik olarak Google Apps Script'e yüklenmez. Önce mevcut `Kod.gs` yedeğini alın; ardından GitHub'daki tam `apps-script/Code.gs` sürümünü kendi Apps Script projenizde yeni sürüm olarak yayımlayın. Bu adım yapılmadığında yeni API eylemleri çalışmaz; mevcut ders raporları korunur. Ders yoklama kaydını ilk kez kullanmadan önce deneme hesabında test edin.

**Bildirim kapsamı:** Bunlar girişli panelde gösterilen otomatik hesaplanmış uyarılardır. Öğretmene/öğrenciye kendiliğinden WhatsApp/SMS veya e-posta **gönderilmez**. Doğrudan otomatik WhatsApp için ayrıca onaylı mesajlaşma entegrasyonu gerekir. İptal/erteleme gibi özel durumlar raporda işaretlenmelidir; bilinmeyen resmî tatiller sistemce otomatik tahmin edilmez.

## Kurs sahibi takip merkezi (15 Ekim 2026)
- `yonetici.html` artık **ayrı, büyük ölçüde rapor/görüntüleme** amaçlı bir yönetici rapor panelidir. Düzenleme, öğretmen oluşturma, grup değiştirme, parola değiştirme, kayıt ekleme/silme, ders kaydetme işlemleri bulunmaz.
- **Dokuz bölüm:** Genel Bakış; Öğrenciler; Yoklama & Ödev; Gruplar; Ders Kayıtları; Öğretmenler & Saat; Ders Programı; Uyarılar; Hesaplar.
- Ayrıntılar: Aktif/tüm gruplar, seviye, öğretmen, öğrenci sayısı, müfredat ilerlemesi, planlanan ve tahmini tarihler, haftalık gün/saat, grup ve özel dersler, işlenen konu, öğretmen notu, rapor durumu ve süreleri, öğretmen aylık toplamları/CSV, öğrenci bazında yoklama/ödev istatistikleri, son beş bireysel kayıt, risk uyarıları, öğretmen hesap ve anahtar arşiv durumu.
- Akademik verileri mevcut yönetici anahtarıyla `overview`, `trackingSummary` ve `reminders` üzerinden yetkili olarak getirir. Takip durumu ve isteğe bağlı gözlem notları yönetici hesabıyla değiştirilebilir. Giriş oturumu `index.html` ile aynı sekmede korunur. Veriler menülerde dinamik gösterilir; mobil ve masaüstü için farklı yoğunluklar vardır.
- **AYDA UI v1.0 tema geçişinde Apps Script kodu değiştirilmedi.** Yeni akademik işlevlerin canlı çalışması için, bu projede daha önce hazırlanan güncel `apps-script/Code.gs` sürümünün yine de ayrıca dağıtılması gerekir.
- Risk sınıflandırması güncellendi: üst üste üç mazeretsiz devamsızlık veya son dört kontrol edilmiş ödevin üçü eksik = öncelikli. Daha hafif durumlar = takip edilmeli; kayıt olmayan öğrenciler riskli sayılmaz.

## Bileşenler
- `index.html` + `assets/app.js`: öğretmen ve yönetici girişi, ders raporları, grup yönetimi, kolay parola belirleme.
- `yonetici.html`: dokuz sekmeli kurs sahibi kontrol paneli; okuma ağırlıklı analiz, isteğe bağlı takip durumu ve not işlemleri.
- `assets/owner.js` + `assets/owner.css` + `assets/manager.css`: kurs sahibi için yönetim verilerinin filtrelenebilir ve mobil uyumlu görünümü, takip durumu güncelleme ve öğrenci gözlem notu.
- `assets/manager.js`, `assets/manager-compact.js`, `assets/viewer.js`: önceki prototipler; `yonetici.html` bunları yüklemez.
- `assets/teacher-tracking.js` + `assets/teacher-tracking.css`: öğretmenin kendi öğrenci durumları.
- `assets/attendance-preview.js`: girişten sonra Apps Script `studentRoster` çağrısı, boş başlayan yoklama, toplu geldi, mazeret, isteğe bağlı ödev; aynı tarihte önceden kaydedilmiş rapora eksik yoklama tamamlanabilir.
- `assets/ayda-workflow.js` / `.css`: grup WhatsApp hızlı bağlantıları, 12 saatlik eksik kayıt listeleri, taslak koruma. Yardım bağlantısı artık sabit bir balon değil, header'dadır.
- `assets/student-notes.js`: girişli kişilerin öğrenciler için isteğe bağlı akademik gözlem notu eklemesi.
- `assets/teacher-resources.js`: öğretmenin aktif grup seviyesine göre kaynakları; sadece girişli öğretmen bölümünde listeler.
- `assets/ayda-brand.css` + `assets/ayda-logo.png`: AYDA UI v1.0 ortak kurumsal tema ve gerçek logo.
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
ayda_cb_test123({"ok":true,"data":{"status":"ok","version":"2026-10-16.2"}});
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
GitHub'daki kaynak ve arayüz güncellendi. Canlı Apps Script sürümü bu GitHub işlemleriyle otomatik değiştirilmedi. Gerçek kullanıcıyla uçtan uca deneme, Apps Script yeni sürüm dağıtımından sonra yapılmalıdır.
