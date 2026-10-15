# AYDA Akademik Takip — GitHub Pages + Google Sheets

Bu paket `lehrer.aydadil.com` için hazırlanmıştır. Google Sheets veritabanı değiştirilmez.

## Kurulum

1. `onurqlp/lehrer` GitHub deposuna `index.html`, `assets/`, `CNAME`, `README.md` yükleyin (eski `github/` yönlendirme sayfası kullanılmaz).
2. `AYDA Ogretmen Sistemi` Apps Script projesinde eski `Kod.gs` içeriğini `apps-script/Code.gs` içeriğiyle değiştirin. Aynı adlı eski fonksiyonların bulunduğu diğer `.gs` dosyalarını kaldırın. `AnahtarKurulum.gs` dosyasını dağıtımdan önce kaldırın (anahtar hash'leri Script Properties'te kalır).
3. Apps Script: **Dağıt > Dağıtımları yönet > Yeni sürüm**, **Şu kullanıcı olarak çalıştır: Ben**, **Erişim: Herkes**. Apps Script'in verdiği `/exec` adresi `assets/config.js` içindeki `AYDA_API_URL` ile aynı olmalı. Farklıysa config'i değiştirin.
4. Öğretmenler için daha önce oluşturulan `AYDA_GIRIS_U002` ... `AYDA_GIRIS_U006` Script Properties değerleri aynı projede kalmalıdır. `KULLANICILAR` durumları `Aktif` olmalıdır.
5. Yönetici erişimi için Apps Script düzenleyicisinde `aydaAdminKeyOlustur` fonksiyonunu **bir kez** çalıştırın. Drive'da oluşan `AYDA - GIZLI YONETICI ANAHTARI` tablosundaki anahtarla giriş yapın.
6. `https://lehrer.aydadil.com/?key=OGRETMEN_ANAHTARI` öğretmene özel bağlantıdır. Alternatif olarak anahtarı giriş ekranına yapıştırabilirler.

## İşlevler

- Öğretmen bazında gruplar, haftalık ders programı, bugünkü dersler, müfredat ilerlemesi
- Ders raporu oluşturma; aynı grup ve gün için mükerrer kayıt engeli
- Ders rapor geçmişi; yönetici için tüm gruplar ve raporlar
- Mevcut `GRUPLAR`, `HAFTALIK_PROGRAM`, `KULLANICILAR`, `DERS_KAYITLARI` tabloları

## Teknik notlar

- GitHub Pages statik olduğu ve Apps Script'in tarayıcı CORS kısıtlamaları bulunduğu için API JSONP kullanır. Bu, rapor kaydetme işlemini GET üzerinden yapar; kurumsal üretim ortamında POST tabanlı bir API/proxy tercih edilir. Kullanıcı giriş anahtarı sunucu tarafında her istekte doğrulanır. Tokenlar URL'de ve tarayıcı oturum belleğinde bulunabilir.
- GitHub deposunda gizli giriş anahtarları yoktur. `assets/config.js` içindeki Apps Script URL'si gizli anahtar değildir.
- GitHub Pages yayın klasörü `/(root)` olarak ayarlanmış olmalıdır.
- Apps Script web uygulaması için `Herkes` erişimi gereklidir; aksi halde tarayıcıdan API istekleri giriş sayfasına yönlenir.
