# AYDA — Sade Yönetici + Salt Okunur Takip Ekranı

Bu paket önceki V4 dosyalarını korur. **Apps Script Code.gs değiştirmeyin**; bu sürüm yalnızca GitHub statik arayüz dosyalarını değiştirir.

## Kurulum

GitHub `onurqlp/lehrer` deposuna bu ZIP içindeki `index.html`, `yonetici.html`, `assets/` ve `CNAME` dosyalarını yükleyin. `apps-script/Code.gs` önceki çalışır durumdaki sürümün yedek kopyasıdır; yeniden dağıtım gerekmez.

- `https://lehrer.aydadil.com/` — öğretmen / yönetici işlem ekranı; yönetici menüleri Genel Bakış, Ders ve Muhasebe, Grup İşlemleri, Öğretmenler ve Anahtarlar, Düzenle.
- `https://lehrer.aydadil.com/yonetici.html` — **salt okunur**, 24 ünite durumları, son konu, tahmini bitişler, öğretmen aylık saatleri; kayıt oluşturma / düzenleme / silme YOK. Yönetici anahtarı zorunlu.

Başka siteye gömme örneği:

```html
<iframe src="https://lehrer.aydadil.com/yonetici.html" title="AYDA Yönetici Takibi" loading="lazy" style="width:100%;min-height:950px;border:0;border-radius:16px"></iframe>
```

**Önemli:** iframe içinde yönetici anahtarı ayrıca istenebilir; tarayıcıların üçüncü taraf çerez/oturum kısıtları bunu etkileyebilir. Anahtarı `?key=` şeklinde URL'ye koymayın. Her girişte mevcut Apps Script API'si üzerinden canlı yetki denetimi yapılır.

**Telefon hata notu:** API Google Apps Script'e JSONP üzerinden bağlı; mobil ağ / Google yönlendirmesi / tarayıcı engeli nedeniyle bağlantı hatası tamamen ortadan kalkacağını garanti etmiyoruz. 45 saniyelik zaman aşımı ve tekrar yenileme eklendi. Gerçek teşhis için telefondaki tarayıcı ve erişim koşulları kontrol edilmeli.

**Güvenlik:** Bu ayrı sayfa sadece admin anahtarıyla çalışır. Herhangi bir herkese açık veya anonim veri akışı açılmaz. İframe sadece görsel sunum sağlar, ek yetkilendirme değildir.

**Teknik test:** JS sözdizimi ve ZIP dosya bütünlüğü kontrol edilmiştir, canlı backend mobil cihazda test edilmemiştir.
