# AYDA — 21 Ekim başlangıç ve öğrenci yönetimi (Google kurulumu)

**Bu sürüm Google tarafına ayrıca dağıtılmalıdır.** GitHub Pages yayını Google Apps Script'i otomatik güncellemez.

1. Projenizin mevcut **Apps Script** düzenleyicisini açın. Farklı bir Google projesi veya yeni bir e-tablo oluşturmayın.
2. Bu repo/branch üzerinde `apps-script/Code.gs` dosyasının **tamamını** mevcut `Code.gs` dosyasına yapıştırın.
3. Kaydedin, **Dağıt > Dağıtımları yönet > Düzenle > Sürüm: Yeni sürüm > Dağıt** adımlarını uygulayın. Mevcut `/exec` bağlantısını koruyun; yeni web uygulaması URL'sine geçmeyin.
4. Aşağıdaki URL'yi tarayıcıda açın (öğretmen/yönetici anahtarı gerekmez):

`https://script.google.com/macros/s/AKfycbx90kn3tMg5ne_xz9csdvbfT8VsewEn6EHO9Kl05ukSa2FpVBf33TwIjrZ6idjzi3zq/exec?action=ping&callback=ayda_cb_go6check`

Yanıtın `ok:true`, `trackingStart:"2026-10-21"`, `studentRemoval:"soft-delete-v1"` alanlarını içermesi yeterlidir. `version:"2026-10-21.9"` sürüm numarası telefon istemcileriyle uyum için **değiştirilmemiştir**. `performance:"GO2-request-read-memo-v1"` aynen korunmuştur.

## Neler değişir?

- Yeni kayıt dönemi **21.10.2026**. Önceki ders verileri **silinmez**; rapor/eksik kayıt başlangıcı bu tarihe alınır.
- Aktif grupların bugünden sonraki programları takip edilir; **GRUPLAR > Son Tamamlanan Ünite** alanı değiştirilmez.
- Öğrenci kaldırmada `OGRENCILER` tablosuna gerekirse `DURUM` başlığı eklenir. Seçili öğrenci satırında yalnızca durum **Pasif** yapılır; mevcut `OGRENCI_ID` ve önceki `YOKLAMA` / `ODEV_TAKIBI` satırları korunur. Grup öğrenci sayısı aktif listeyle güncellenir.
- Öğretmenin ayrıntılı `trackingSummary` ve öğrenci notu API erişimi durdurulur. Yoklama için gereken `studentRoster` açık kalır.
- Ortak öğretmen ID sorunu **kendiliğinden tahmini dağıtılmaz**. Admin > Öğretmenler > Ortak Öğretmen ID Hesaplarını Ayır aracından hesap ve **o hesaba devredilecek gruplar** tek tek seçilir. Eski ders/yoklama arşivleri değiştirilmez. Son kalan hesap mevcut ID'sini korur.

## Uyarılar

- Google dağıtımı bitmeden sitenin yeni **Öğrenciyi kaldır** ve **Ortak ID ayır** düğmeleri önce `ping` kontrolü yapar ve kayıt göndermez.
- Tekrar kayıt üretmemek için işlemde hata çıkarsa Google tablosunu kontrol edin; aynı işlem için üst üste kaydet tuşuna basmayın.
- Ortak ID onarımında başka bir hesaba ait grubu yanlışlıkla devretmemek yöneticinin sorumluluğundadır. Hangi grubun hangi öğretmende olduğu kesin değilse boş bırakın ve sonra **Sınıf Atamaları** bölümünden düzenleyin.
- Yeni Google e-tablosu, şema sıfırlama veya toplu veri silme **gerekmiyor**.
