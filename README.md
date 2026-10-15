# AYDA Akademik Takip — Akademik Planlama Sürümü

## Kurulum
1. GitHub deposunda `index.html`, `assets/`, `CNAME`, `README.md` dosyalarını güncelleyin.
2. Apps Script projesinde `Kod.gs` dosyasının içeriğini `apps-script/Code.gs` ile değiştirin. Dağıtımları yönet > Yeni sürüm > Dağıt.
3. `assets/config.js` içinde mevcut `/exec` adresini koruyun.

## Yönetici
- Öğretmen oluşturma, otomatik aktif kullanıcı kaydı ve bir kez gösterilen anahtar
- Grup oluşturma: seviye, öğretmen, başlangıç, öğrenci sayısı, haftalık günler ve saatler
- Tamamlanan ünite ve öğrenci sayısı güncelleme
- Aylık öğretmen çizelgesi ve CSV
- 24 ünite + 2 sınav hazırlığı dersi için tarih tahmini

## Hesaplama
- Her programlı ders günü 1 ünite sayılır; tamamlanan ünite Sheets'ten alınır.
- Kalan ünite kadar planlı ders günü, ardından 2 sınav hazırlığı dersi hesaplanır.
- Bu tahmin **resmî sınav tarihi değildir**. Tatil/iptal/erteleme ve raporlanmamış dersler tahmini değiştirebilir.
- Gerçek derslerin saatleri aylık ücret çizelgesinde ayrı hesaplanır.

## Önemli
- JSONP ile anahtar URL parametresinde taşınır; tarayıcı geçmişi ve ağ günlükleri bakımından bu mimari hassastır. Canlı kullanımda erişim anahtarlarını gizli tutun, sızanları yenileyin.
- Yeni yönetici işlemleri canlı Google Sheets üzerinde test edilmedi. Yüklemeden önce mevcut Apps Script ve Sheets yedeğini alın.
- Yeni grup kaydı iki ayrı sekmeye yazılır; olası kısmi başarısızlıkta manuel kontrol gerekir.
