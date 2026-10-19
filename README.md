## V4.4 — Kayıt bütünlüğü ve yedekleme (19.10.2026)

- **Mevcut veri korunur:** Hiçbir mevcut satır silinmez; kontroller salt-okunurdur. Başlangıç tarihi 19 Ekim 2026 olarak kalır.
- **Ders kaydı onayı:** Ders, yoklama ve verilen ödev alt tabloları yazılıp `SpreadsheetApp.flush()` tamamlandıktan sonra kayıt kimliği ve yoklama ilişki kimlikleri yeniden okunarak doğrulanır.
- **Çok adımlı grup oluşturma:** Bir program satırında hata oluşursa oluşturma esnasındaki grup ve program satırları geri alınır. Geri alma da başarısızsa sessiz başarı yerine yönetici uyarısı oluşur.
- **Ders ilerlemesi:** Ders kaydı başarıyla tutulmuşsa sonradan yaşanan grup özet güncellemesi hatası, dersi yanlışlıkla başarısız göstermez; uyarı olarak döner.
- **Veri bütünlüğü:** Yalnızca yöneticiye açık `integrityStatus`, tablo varlığı, mükerrer ders kimlikleri, boşa düşen yoklama ve ödev bağlantıları, eksik yoklamalar gibi durumları sayısal olarak kontrol eder; kişisel öğrenci verisi döndürmez.
- **Tam Drive yedeği:** `backupSetup` önce ayrı bir Drive dosyasında bütün çalışma kitabının kopyasını oluşturur, **tüm sekmelerin satır sayılarını** doğrular, sonra günlük tetikleyici kurar. Sağlam son yedeği otomatik silmez. `backupStatus` son yedek ve hata durumunu gösterir.
- **Testler:** `.github/workflows/data-integrity.yml`, canlı öğrenci verilerine erişmeden Node.js ile ders/yoklama, mükerrer kayıt engeli, hata sonrası geri alma, aylık süre/erteleme hesaplamalarını çalıştırır.
- **Yayın ayrımı:** GitHub Pages frontend otomatik yayımlanır. Google Apps Script kodu **Google'da ayrıca yeni web uygulaması sürümü olarak dağıtılmadan** `backupSetup` / `integrityStatus` çalışmaz; böyle bir durumda yönetici ekranı başarı iddia etmez. Sonrasında yönetici panelindeki **Günlük yedeklemeyi kur** işlemi bir kez çalıştırılmalıdır.
- **Sınır:** Tek Google hesabı, kota, kullanıcı kaynaklı silme, aynı anda Sheets üzerinde el ile yapılan düzenleme veya Google hizmeti arızaları nedeniyle sıfır veri kaybı mutlak garanti edilemez; bağımsız yedekler bu riski azaltır.

## V4.3 — Sade kontrol ve doğru kayıtlar (19.10.2026)

- **Başlangıç:** Yeni sistemin eksik kayıt kontrolleri 19 Ekim 2026'dan başlar; geriye dönük eksik taraması genişletilmez. Mevcut Google tablolarına veri müdahalesi yapılmaz.
- **Öğretmen:** Ders raporu, yoklama, aylık plan, geçmiş, grup ve öğrenci ekranları korunur. Eksik kayıtlar öğretmen ana ekranında kısa ve işlem yapılabilir şekilde görünür.
- **Yönetici:** Öncelikli 6 gösterge, en fazla 3 doğrudan eksik kayıt önizlemesi ve aylık plan/gerçekleşen ders özeti; detaylar ayrı bölümlerdedir.
- **Kayıt doğrulama:** Eksik yoklama için tek bir öğrenci satırının varlığı yeterli sayılmaz. Tam öğrenci listesi kontrol edilir; kısmi kayıt varsa yalnızca eksik öğrenciler tamamlanır.
- **Ders süresi:** 00:30 ile 06:00 arasında 30 dakikalık adımlar desteklenir; 90 dakika artık 2 saate yuvarlanmaz.
- **Ders durumu:** İptal ile ertelenen ayrı sayılır. Ertelenen grup dersi kalan plan içinde tutulur. Dersin yapılmadığı tarihte İptal/Ertelendi durumunu raporlamak gerekir; tatiller kendiliğinden anlaşılmaz.
- **Önemli dağıtım bağımlılığı:** `apps-script/Code.gs` V4.3 kaynak güncellemesi GitHub'a eklenir; **Google Apps Script'in mevcut üretim dağıtımına ayrıca yayınlanmalıdır**. GitHub Pages yayını Google servis kodunu otomatik dağıtmaz. Bu yapılana kadar 30 dakikalık süre ile kayıt girişinde erken ve açık uyarı gösterilir. Diğer normal ders kayıtları eski API ile geriye uyumludur.
- Bu sürümde yeni Google Sheet sekmesi veya otomatik veri silme/yedekleme işlemi yoktur.

# AYDA Akademik Takip

**Öğretmen / girişli yönetici paneli:** https://lehrer.aydadil.com/  
**Girişli tam yönetici takip merkezi:** https://lehrer.aydadil.com/yonetici.html


## WhatsApp sınıf ödevi paylaşımını tamamlama — sürüm 2026-10-16.7

**Öğretmen için 3 aşama:** (1) İşlenen grup dersinde tüm öğrencilerin yoklamasını işaretle. (2) Zorunlu **Verilen ödev** alanını doldur. Ödev gerçekten verilmediyse **Bu derste ödev verilmedi** düğmesi bunu hazır metin olarak yazar. (3) Dersi kaydedince **Ödevi WhatsApp grubuna yaz →** ile hazır metin WhatsApp paylaşma ekranına açılır. Öğretmen sınıf grubunu seçip mesajı gönderir ve siteye dönüp **Gruba gönderdim** düğmesine basar.

- **Tek seferlik metin:** Ödev yeniden yazılmaz. Grup adı, ders tarihi ve ödev metni WhatsApp taslağına otomatik eklenir. Ödev verilmediyse *Bu derste ödev verilmedi.* mesajı da gruba bildirilir.
- **Dış uygulama sınırı:** WhatsApp'ın normal paylaşım bağlantısı belirli WhatsApp grubuna sessizce mesaj gönderemez. Öğretmenin grubu seçmesi ve mesajı göndermesi gerekir. Sistem WhatsApp gönderimini doğrulayamaz. **Paylaşıldı**, öğretmenin manuel onay beyanıdır; okunma veya teslim belgesi değildir.
- **Kalıcı eksik takip:** DERS_ODEVLERI'nde yeni PAYLASIM_DURUMU, PAYLASIM_ZAMANI, PAYLASAN_OGRETMEN_ID sütunları var. Yeni ders ödevleri önce Bekliyor; yalnız yetkili öğretmen confirmHomeworkShare ile Paylaşıldı yapar. Sonraki girişte **Bekleyen grup duyuruları** listesi korunur. Çift onay ikinci kayıt üretmez.
- **Yöneticide:** yonetici.html sayfasında Ders Kayıtları veya Gruplar detayındaki verilen ödevlerde paylaşım durumu görülür. Ana ekran metinlerle doldurulmaz.
- **Yetki:** Öğretmen yalnızca kendisine aktif atanmış grubun paylaşımını onaylar. GitHub'da öğrenci iletişim bilgisi yok, anonim pano ödev metni içermez.
- **Yeni kod:** apps-script/Code.gs v2026-10-16.7; kayıt homeworkId döndürür, lessonHomework paylaşım durumlarını listeler, confirmHomeworkShare onay yazar. Frontend eski sürüme yanlışlıkla rapor kaydetmemek için ping kontrolü yapar. **Canlı Apps Script mevcut dağıtımını yeni sürümle yeniden yayımlamak gerekir.**
- **Veri yedeği:** WhatsApp Paylaşım Takibi Öncesi isimli yedek alındı. Mevcut ders satırlarına dokunulmadı. Eski ödevlerin boş paylaşım alanları Eski kayıt sayılır; sahte eksik duyuru oluşturulmaz.

## Ders sonu en kısa akış — 16 Ekim 2026 (Apps Script v2026-10-16.6)

- **1. Yoklama:** İşlenen grup dersi seçilince yoklama otomatik açılır. **Hepsi geldi** veya öğrenci bazında Geldi/Gelmedi işaretlenir. *Tek bir öğrenci bile işaretlenmediyse; öğrenci listesi eksik, yüklenememiş veya sunucu bağlantısı eskiyse ders raporu gönderilemez.* İptal/ertelenmiş dersler yoklama gerektirmez. Mevcut raporlara sonradan yoklama tamamlama özelliği korunur.
- **2. Verilen ödev (zorunlu):** Yeni bir zorunlu form eklenmedi. Mevcut "Kısa bilgi" alanı, işlenen grup derslerinde **"Verilen ödev"** başlığıyla kullanılır. Öğretmen ödevi tek sefer yazar; metin hem mevcut ders notunda hem de ayrı **DERS_ODEVLERI** sekmesinde ders kayıt ID'siyle tutulur. Verilen ödev boşsa kaydetme reddedilir. Gerçekten ödev verilmediyse bunun açıklaması yazılabilir. Öğrenci bazında ödev **kontrolü** ayrı ve isteğe bağlı kalır. Önceki raporlar değiştirilmez.
- **3. Kaydet ve gruba paylaş:** Başarılı işlenen grup dersinden sonra **"Ödevi gruba yaz →"** tek tuşu çıkar. WhatsApp paylaşma ekranında sınıf ödevi, grup adı ve tarih hazır bulunur; öğretmen **sınıf grubunu seçip mesajı manuel gönderir**. WhatsApp mevcut linklerle belirli bir grubu otomatik önceden seçmeye izin vermediği için otomatik gönderim iddia edilmez. İsteğe bağlı, ayrı teslim tarihli ödev görevleri için de aynı paylaşım düğmesi vardır.
- **Ders süresi:** Yeni grup ve özel ders raporlarında **yalnızca 1–6 tam saat** (`01:00`–`06:00`). Yarım saat seçenekleri kaldırıldı. Geçmiş derslerin eski süreleri veya kayıtları otomatik değiştirilmedi. Rapor süresi düzeltirken de yalnız tam saat seçilebilir.
- **Yönetici tek tık hatırlatma:** 12 saatlik eksik ders/yoklama kartındaki **"WhatsApp üzerinden hatırlat"** artık Mesaj Merkezi'ne götürmez; özel `OGRETMEN_REHBERI` sekmesinde tek bir aktif öğretmen kimliği ve geçerli telefon varsa ilgili hocanın WhatsApp taslağını doğrudan açar. Mesaj ilgili grup/tarih/eksik işlemle dolu olur. Telefon yok, Gizem gibi kimlik belirsiz veya eşleşme çoğulsa **yanlış kişiye gönderilmez**; uyarı görünür.
- **Yönetici inceleme:** `yonetici.html` **Ders Kayıtları → Rapor → Verilen sınıf ödevini gör** veya **Gruplar → Program, son rapor ve tahmini tarihler → Verilen ödevler** altında görevleri açabilir. Ana ekran ödev metinleriyle doldurulmaz. Ayrı teslim tarihli ödev görevleri ise **Yoklama & Ödev** bölümünde listelenir.
- **Özel/gizli veriler:** `DERS_ODEVLERI` yetkili personel API'si `lessonHomework` üzerinden okunabilir. Anonim `publicDashboard` hiçbir öğrenci adı veya ödev içeriği paylaşmaz; iletişim rehberi GitHub'a taşınmaz.
- **Veritabanı öncesi yedek:** `AYDA Akademik Takip | YEDEK 2026-10-16 · Zorunlu Yoklama Öncesi` alındı; asıl sayfaya boş **DERS_ODEVLERI** sekmesi eklendi. Var olan veri satırlarına dokunulmadı.
- **Yayımlama:** GitHub'daki `apps-script/Code.gs` yeni sürüm olarak Google Apps Script'teki mevcut web uygulamasına ayrıca dağıtılmalıdır. `aydaHealthCheck` çalıştırıldığında sürüm `2026-10-16.6` görünmelidir. Canlı kullanımdan önce tek deneme grup dersini kontrol edin. GitHub tek başına Apps Script güncellemez.

## Yönetici öncelikli ekran + teslim tarihli ödevler (16.10.2026)

- **Günlük yönetim önceliği:** `index.html` yöneticide önce akademik genel bakış, öğrenci takibi ve ders/muhasebeyi gösterir. Eski öğretmen tipindeki ders kaydı, gruplar ve çizelge araçları **aşağıda** korunur; veri/işlev silinmez.
- **Ayarlar menüsü:** Eski üst seviye altı menü dört ana bölüme indi: **Genel Bakış, Öğrenci Takibi, Ders ve Muhasebe, ⚙ Ayarlar**. Ayarlar altında **Grup İşlemleri, Öğretmenler ve Anahtarlar, Düzenle** alt menüleri vardır. `index.html#ayarlar` adresi doğru yönetici bölümünü açar. `yonetici.html` üzerinden üstteki **⚙ Ayarlar** bağlantısıyla gidilebilir.
- **Öğretmen fikri/şikâyeti:** Var olan isteğe bağlı `Sistemle ilgili fikrim / sorun bildirimim` bölümü öğretmen menüsünden de erişilebilir. Yönetici `Mesaj Merkezi`nde öğretmen, tarih, kategori ve içerikle görür, inceleme durumunu seçer, yanıtlar. **Genel Bakış** ekranında yeni mesaj sayısını da görür.
- **İki ayrı ödev kavramı:** (a) `ODEV_TAKIBI` öğrencilerin ders bazında ödevi yapıp yapmadığı bilgisidir ve sonradan işlenebilir. (b) `ODEV_GOREVLERI` öğretmenin gruba verdiği **ödev görevi + açıklama + teslim tarihi** kaydıdır. Bu yeni ödev görevi **isteğe bağlıdır**; yoklamanın parçası veya yeni zorunlu öğretmen formu değildir.
- **Ek süre:** Öğretmen açık bir ödev görevine **+3 veya +7 gün** ek süre verir; API güvenlik sınırı 1–30 gün/işlem, yeni tarih bugünden en fazla 90 gün ileride olabilir. Tamamlandı ve Yeniden aç durumları vardır. `ODEV_GOREV_GECMISI` eski/yeni tarih, yetkili öğretmen ve işlem zamanını kaydeder. Öğretmen devrinde mevcut yetkili grup öğretmeni görevi yönetebilir.
- **Yönetim gözetimi:** `yonetici.html` Genel Bakış'ta aktif/gecikmiş ödev görevleri, Yoklama & Ödev ekranında ödev görevleri/teslim tarihleri ve verilen toplam ek süreyi görür; ödev tarihini yönetici yanlışlıkla değiştiremez.
- **Öğrenciye iletişim:** Ödev duyurusunu öğretmen kopyalayıp ilgili sınıf kanalında kendisi paylaşabilir. Sistemin henüz öğrenci oturumu veya WhatsApp gönderme altyapısı **yoktur**; görevler otomatik olarak öğrencilere iletilmiş sayılmaz.
- **Veritabanı:** 16 Ekim 2026'da mevcut Google Sheet'e yalnızca `ODEV_GOREVLERI` ve `ODEV_GOREV_GECMISI` sekmeleri (başlık satırı, boş veri) eklendi. Önce **Ödev Planlaması Öncesi** adlı tam yedek kopyası alındı. Mevcut ders/yoklama/ödev/öğrenci kayıtları değişmedi.
- **API:** `apps-script/Code.gs` 2026-10-16.5 sürümünde `homeworkTasks`, `saveHomeworkTask`, `updateHomeworkTask` eylemleri vardır. Yeni ödev oluşturma/uzatma öğretmen yetkisi, yöneticiye salt okunur görev listesi verir. Mevcut Apps Script'e bu sürüm aktarılıp **mevcut dağıtım yeni sürüm olarak güncellenmeden** canlı yazma özelliği çalışmaz.

## Öğretmen günlük iş merkezi ve WhatsApp iletişim (16 Ekim 2026)

**Öğretmen öncelikli akış:** Girişte aylık planlanan/işlenen/kalan grup dersleri ve özel ders kayıtları görünür. Ardından bugünkü işler, ders raporu ve **Sonradan tamamla** gelir. Öğrencilerim · Takip Merkezi daha aşağıya alınmıştır. Akademik öğrenci görüşü isteğe bağlıdır.

- `assets/teacher-daily.js` + `assets/ayda-operations.css`: Aylık ders sayısı, planlanan çizelgeye göre kalan ders, eski dersler için eksik yoklama, isteğe bağlı ödev kontrolü, öğretmenden yönetime fikir/sorun gönderme. Sunucu henüz yayımlanmadıysa aylık sayılar mevcut giriş verilerinden hesaplanır.
- `assets/owner-messaging.js`: Sadece yönetici oturumunda kayıtlı öğretmen/öğrenci kişi listesi, eksik ders/yoklama ve devam/ödev mesajları. Sistem mesajı **hazırlar**; yönetici düzenleyip WhatsApp uygulamasında kendisi gönderir. Belirsiz Gizem eşleşmelerinde yanlış alıcı otomatik seçilmez.
- Öğretmen geri bildirimleri: Öğretmen Fikir/Sorun/İyileştirme/Diğer kategorilerinden birini seçip önerisini gönderir; yönetici Mesaj Merkezi içinde görür, durumunu değiştirir, yanıt verebilir. Öğretmen kendi mesajını ve yanıtını görebilir.
- **Sonradan tamamlama:** Var olan ders raporuna yoklama veya var olan yoklamaya ödev kontrolü eklenebilir; ikinci rapor üretilmez. Tekrarlı yoklama/ödev kaydı reddedilir. Kontrol edilmedi ödev başarısızlığı sayılmaz. Ödev her derste zorunlu değildir.
- `apps-script/Code.gs`: Girişli işlemler teacherMonthly, makeupList, saveHomework, saveFeedback, teacherFeedback, feedbackInbox, feedbackReply, contactDirectory, updateContact. Kişi telefonları sadece yöneticiye açıklanır; publicDashboard iletişim veya öğrenci isimleri taşımaz.
- Google Sheets: OGRETMEN_REHBERI (18), OGRENCI_ILETISIM (106), OGRETMEN_GERI_BILDIRIM. Telefonlar GitHub deposuna kopyalanmadı; yönetici düzeltme işlemiyle eksik numaralar eklenebilir.
- Listedeki kişilerle eşleşmeyen Aylin ve Onur öğretmen hesapları pasifleştirildi; U001 yönetici hesabı korundu. Furkan H001; Onur'un yinelenen öğretmen kimliği H006 olarak ayrıldı. A1 Eylül G006 grubunun atanmış öğretmeni pasif kaldı, yeniden atama gerekir. İki Gizem birbirinden emin olunmadığı için eski Gizem grubu otomatik devredilmedi.
- Rehbere ekleme otomatik giriş hesabı oluşturmaz; yeni öğretmenler için ana panelde hesap açılmalı ve parola tanımlanmalıdır.

**Yayına alma:** GitHub güncellemeleri Apps Script'i otomatik değiştirmez. Mevcut Kod.gs yedeğini aldıktan sonra güncel apps-script/Code.gs sürümünü Apps Script projesine koyup **mevcut web uygulamasında yeni sürüm** dağıtılmalıdır. Aksi takdirde yeni API işlemleri çalışmaz. Sonrasında önce test hesabıyla kayıt yapılmalıdır.

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
- **On bölüm:** Genel Bakış; Öğrenciler; Yoklama & Ödev; Gruplar; Ders Kayıtları; Öğretmenler & Saat; Ders Programı; Uyarılar; Mesaj Merkezi; Hesaplar.
- Ayrıntılar: Aktif/tüm gruplar, seviye, öğretmen, öğrenci sayısı, müfredat ilerlemesi, planlanan ve tahmini tarihler, haftalık gün/saat, grup ve özel dersler, işlenen konu, öğretmen notu, rapor durumu ve süreleri, öğretmen aylık toplamları/CSV, öğrenci bazında yoklama/ödev istatistikleri, son beş bireysel kayıt, risk uyarıları, öğretmen hesap ve anahtar arşiv durumu.
- Akademik verileri mevcut yönetici anahtarıyla `overview`, `trackingSummary` ve `reminders` üzerinden yetkili olarak getirir. Takip durumu ve isteğe bağlı gözlem notları yönetici hesabıyla değiştirilebilir. Giriş oturumu `index.html` ile aynı sekmede korunur. Veriler menülerde dinamik gösterilir; mobil ve masaüstü için farklı yoğunluklar vardır.
- **AYDA UI v1.0 tema geçişinde Apps Script kodu değiştirilmedi.** Yeni akademik işlevlerin canlı çalışması için, bu projede daha önce hazırlanan güncel `apps-script/Code.gs` sürümünün yine de ayrıca dağıtılması gerekir.
- Risk sınıflandırması güncellendi: üst üste üç mazeretsiz devamsızlık veya son dört kontrol edilmiş ödevin üçü eksik = öncelikli. Daha hafif durumlar = takip edilmeli; kayıt olmayan öğrenciler riskli sayılmaz.

## Bileşenler
- `index.html` + `assets/app.js`: öğretmen ve yönetici girişi, ders raporları, grup yönetimi, kolay parola belirleme.
- `yonetici.html`: on sekmeli kurs sahibi kontrol paneli; okuma ağırlıklı analiz, isteğe bağlı takip durumu ve not işlemleri.
- `assets/owner.js` + `assets/owner.css` + `assets/manager.css`: kurs sahibi için yönetim verilerinin filtrelenebilir ve mobil uyumlu görünümü, takip durumu güncelleme ve öğrenci gözlem notu.
- `assets/manager.js`, `assets/manager-compact.js`, `assets/viewer.js`: önceki prototipler; `yonetici.html` bunları yüklemez.
- `assets/teacher-tracking.js` + `assets/teacher-tracking.css`: öğretmenin kendi öğrenci durumları.
- `assets/attendance-preview.js`: girişten sonra Apps Script `studentRoster` çağrısı, boş başlayan yoklama, toplu geldi, mazeret, isteğe bağlı ödev; aynı tarihte önceden kaydedilmiş rapora eksik yoklama tamamlanabilir.
- `assets/ayda-workflow.js` / `.css`: grup WhatsApp hızlı bağlantıları, 12 saatlik eksik kayıt listeleri, taslak koruma. Yardım bağlantısı artık sabit bir balon değil, header'dadır.
- `assets/student-notes.js`: girişli kişilerin öğrenciler için isteğe bağlı akademik gözlem notu eklemesi.
- `assets/teacher-resources.js`: öğretmenin aktif grup seviyesine göre kaynakları; sadece girişli öğretmen bölümünde listeler.
- `assets/owner-homework.js`: yöneticinin ödev görevi ve teslim tarihi gözetimi.
- `assets/admin-menu.js`: yönetici odaklı dört ana sekme ve üç alt Ayarlar menüsü.
- `assets/teacher-daily.js`: ödev görevi oluşturma, teslim süresi uzatma ve öğretmen fikri gönderme.
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

<!-- V4.5: panel geçişi ve performans düzenlemesi hazırlık dalı. -->
