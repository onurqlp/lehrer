# AYDA Akademik Takip — Final V4 (Hesap ve Müfredat Yönetimi)

## Kurulum (mevcut çalışan sistem üzerine)
1. **ÖNCE yedek:** Google Sheets'in bir kopyasını ve Apps Script'teki mevcut `Kod.gs` içeriğini kaydedin.
2. GitHub deposunun köküne ZIP içindeki **`index.html`**, **`assets/`**, **`CNAME`**, **`README.md`** dosyalarını yükleyip mevcut dosyaların üzerine yazın. `CNAME` içeriği `lehrer.aydadil.com` olarak kalır.
3. **AYDA Ogretmen Sistemi** Apps Script projesinde `Kod.gs` içeriğini `apps-script/Code.gs` ile değiştirin. **Dağıt → Dağıtımları yönet → kalem → Yeni sürüm → Dağıt**. `assets/config.js` içinde kendi `/exec` adresiniz zaten bulunmaktadır.
4. Sayfayı sert yenileyin (`Ctrl+Shift+R`). Yönetici hesabına girin. Varsa eskiden oluşturulmuş giriş anahtarları çalışmaya devam eder.

## Yönetici ekranı
- Seviye, aşama ve grup adına göre filtrelenebilen 24 üniteli interaktif akademik takip ekranı.
- Grup bazında öğretmen, öğrenci sayısı, son rapor, 24. ünite tahmini ve **iki ek sınav hazırlığı dersi** tahmini.
- Öğretmen ekleme, kullanıcı/anahtar üretme, grup açma ve haftalık ders günleri belirleme.
- Aylık grup/özel ders sayıları ve gerçekleşen ders saatleri, Excel uyumlu CSV.
- **Öğretmen Hesapları ve Anahtar Arşivi:** mevcut hesap listesi ve anahtarın özel arşivde bulunup bulunmadığı. "Hesap ve anahtarları Excel'e indir" ile yalnızca arşivdeki *güncel* anahtarların dökümü.
- Öğretmen veya yönetici anahtarını panelden yenileme.

## Anahtar arşivi hakkında önemli bilgi
- Yeni eklenen öğretmenlerin ve yenilenen anahtarların **açık değerleri**, ana Google Sheets veritabanından **ayrı** oluşturulan `AYDA - GIZLI HESAP VE GIRIS ANAHTARLARI` adlı Drive tablosuna kaydedilir. Script özelliklerinde yalnızca SHA-256 özeti saklanır.
- Bu dosyanın sahibi Apps Script'in çalıştığı Google hesabıdır. **Bu dosyayı öğretmenlerle paylaşmayın.** Yönetici CSV'si de gizlidir.
- Daha önce oluşturulan anahtarların açık değerleri SHA-256 özetinden geri alınamaz. Excel'de bu hesapların anahtar alanı boş kalır; panelden yenilenerek arşive eklenebilir.
- Anahtar yenilendiğinde önceki anahtar anında geçersiz olur. Öğretmene yeni anahtarın güvenli yoldan iletilmesi gerekir.
- Mevcut anahtarları sadece listelemek için arşiv oluşturulmaz; yeni öğretmen ya da yeni anahtar üretildiğinde arşiv otomatik oluşur.

## Ders/müfredat modeli
- Her kurda **24 ünite** ve sonrasında sınav hazırlığı için **iki ek ders günü** vardır.
- Bitiş tarihi her *planlı ders gününde 1 ünite* varsayımıyla hesaplanan tahmindir; tatil/erteleme, özel ders ve resmî sınav takvimi değildir.
- Öğretmen günlük çizelgesinde grup/özel, tarih, 1–4 ders saati, durum, son tamamlanan ünite ve zorunlu kısa açıklama girer.
- İptal/ertelenen dersler aylık gerçekleşen saate sayılmaz.

## Dikkat
- Mevcut GitHub Pages / Apps Script entegrasyonu JSONP kullanıyor. Anahtar URL parametresinde iletilir; dolayısıyla anahtar gizliliği için bu mimari hassastır. Özellikle yönetici CSV'sini ve arşivi paylaşmayın.
- Tek bir anahtarın paylaşılması o hesaba erişim sağlar; sızdığı düşünülen anahtarı derhal yenileyin.
- Apps Script ve Google Sheets servislerine bağlı canlı okuma/yazma işlemleri bu paketin oluşturulduğu ortamda test edilemedi. İlk kullanımdan önce yedek alın.
- Yeni öğretmen/grup oluşturma birden fazla tabloya yazabilir; işlem yarım kalırsa ilgili tabloları kontrol edin.
