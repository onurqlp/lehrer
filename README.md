# AYDA Akademik Takip — Şifresiz Yönetici Panosu

## Kurulum
1. ZIP içindeki `index.html`, `yonetici.html`, `assets/` ve `CNAME` dosyalarını GitHub `onurqlp/lehrer` deposuna yükleyin.
2. `apps-script/Code.gs` dosyasının içeriğini **AYDA Ogretmen Sistemi** Apps Script projesinde `Kod.gs` ile değiştirin. Kaydedin ve **Dağıt > Dağıtımları yönet > Yeni sürüm > Dağıt** yapın. Çalıştıran: **Ben**, Erişim: **Herkes**.
3. `https://lehrer.aydadil.com/yonetici.html` adresini açın. Anahtar istemez.

## Mimari
- Anahtarsız sayfa **publicDashboard** adlı salt-okunur JSONP API çağrısı yapar.
- API öğretmen girişlerini ve yönetici girişini değiştirmez; diğer bütün işlemlerde mevcut doğrulama korunur.
- Public yanıt: grupların isim/seviyesi/öğretmeni/öğrenci toplamı, ünite ilerlemesi, haftalık ders günleri, ders saat toplamları, konu başlıkları. **Öğrenci isimleri, özel ders öğrenci isimleri, ders notları ve giriş anahtarları dönmez.**
- Herkese açık: URL'yi bilmeyenler de keşfedebilir. URL'yi gizli tutmak erişim kontrolü değildir.
- 24 ünite ve iki sınav hazırlığı dersi ile ileriye yönelik yaklaşık tarih hesaplanır. Resmî sınav tarihi değildir.
- Herkese açık pano tüm ziyaretçilerden okunabilir; yalnızca yetkili personelin erişmesi gerekiyorsa parola/Google oturumu eklenmelidir.

## Sınırlamalar
- Telefon tarayıcılarında Google Apps Script JSONP isteği engellenebilir; bağlantı ve Apps Script erişimi doğrulanmalıdır.
- Backend canlı Google Sheets ortamında test edilmedi. Dağıtımdan önce Apps Script kodunun bir kopyasını saklayın.
