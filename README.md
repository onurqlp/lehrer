# AYDA Akademik Takip — Tam Çizelge Sürümü

## Ne yapar?
- Öğretmen: tek ekranda günlük grup veya özel ders kaydı, ders süresi, ünite ve isteğe bağlı konu/not.
- Yönetici: tüm gruplar ve son konular, aylık öğretmen bazlı işlenen ders sayısı ve saat toplamı, CSV indirme.
- Veritabanı: mevcut Google Sheets `GRUPLAR`, `KULLANICILAR`, `HAFTALIK_PROGRAM`, `DERS_KAYITLARI` korunur. Özel ders kaydı için `AYDA_OZEL_DERS_CIZELGESI` ilk kayıt sırasında otomatik açılır.

## Yükleme (2 işlem)
1. ZIP içindeki `index.html`, `assets/`, `CNAME`, `README.md` dosyalarını GitHub `onurqlp/lehrer` deposunun köküne yükleyin (eski dosyaların üzerine).
2. `apps-script/Code.gs` içeriğini **AYDA Ogretmen Sistemi** projesindeki `Kod.gs` ile tamamen değiştirin; kaydedin; **Dağıt > Dağıtımları yönet > Düzenle > Yeni sürüm > Dağıt**. Eski dağıtım URL'sini koruyun.

## Önemli
- Yönetici girişi mevcut yönetici anahtarıyla, öğretmenler kendi anahtarlarıyla devam eder.
- Saatler **ders süresidir**, ödeme miktarı değildir; ücret hesaplaması kurumun saatlik ücretlerine göre ayrıca yapılır.
- `İptal` ve `Ertelendi` kayıtları ders saati toplamına katılmaz.
- Grup için aynı gün ikinci rapor kabul edilmez; özel derste aynı öğrenci/öğretmen/gün tekrarı engellenir.
- Güvenlik: GitHub Pages + Apps Script JSONP API, giriş anahtarlarını URL içinde taşır; bu yaklaşımın üretim ortamında erişim kayıtları ve URL geçmişi açısından riskleri vardır. Anahtarları GitHub'a koymayın, paylaşılan anahtarları yenileyin. Para bordrosu kesinleştirmeden önce Sheets ile karşılaştırın.
- Canlı Google hesabına erişim olmadan uçtan uca test yapılamaz; JavaScript sözdizimi ve dosya paketi yerel olarak doğrulanmıştır.
