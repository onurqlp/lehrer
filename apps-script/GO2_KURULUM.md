# GO 2 — Google Apps Script performans kurulumu

**Dağıtım sorumlusu:** AYDA Google Apps Script proje sahibi.

## Neler değişti?

1. `aydaRead_` aynı **salt-okunur HTTP isteği içinde** okunan tabloyu ikinci kez Google'dan çağırmaz. Her istek için ayrı memo kullanılır; istek bitiminde temizlenir.
2. Okunan satırlar kopyalanarak döndürülür; bir raporun yaptığı yerel nesne değişikliği başka rapora taşınmaz.
3. Öğretmen parolası aranırken `PropertiesService` değerleri tek seferde toplanır. Yetki, rol ve hesap kontrolü devam eder.
4. Her `doGet` çağrısında çalışma kitabı nesnesi ve tablo memo bilgileri sıfırlanır.
5. Bütün **yazma aksiyonları** bu mekanizmanın dışındadır: ders, yoklama, ödev, öğrenci, grup, öğretmen, takip, mesaj ve şifre güncellemelerinde eski veri kullanılmaz.
6. Kalıcı `CacheService` eklenmedi. Formlar, ders kayıtları, geçmiş ve arşiv tablolarının hiçbir satırı silinmedi.

## Uygulama

1. Mevcut canlı Google Apps Script projesinin `Code.gs` dosyasını yedekleyin. Google tarafında manuel özel değişiklikler yapıldıysa GitHub sürümüyle karşılaştırın.
2. Bu dalın [GO2 Code.gs](./Code.gs) dosyasının **tamamını** kopyalayıp aynı mevcut `Code.gs` içeriğiyle değiştirin.
3. **Deploy → Manage deployments → mevcut çalışan dağıtım → Edit → Version: New version → Deploy.** Yeni dağıtım oluşturmayın; mevcut `/exec` bağlantısını koruyun.
4. Aynı `/exec` URL'sinde `?action=ping&callback=ayda_cb_go2check` parametrelerini kontrol edin. JSONP dönüşündeki `data.performance` alanı `GO2-request-read-memo-v1` olmalıdır. `version` değeri uyum için `2026-10-21.9` olarak tutuldu.
5. Önce öğretmen girişi ve yönetici girişiyle arayüzü açın, ardından kayıt **oluşturmadan** grup ve öğrenci listeleri ile mevcut yoklama uyarılarını karşılaştırın.
6. Gerçek kayıt doğrulaması için Google'daki mevcut kayıtlı bir dersin bilgilerini ve son değişikliklerin görüntülenmesini kontrol edin. Çift kayıt oluşturmayın.
7. **Apps Script → Executions** alanında aynı aksiyonun önce/sonra sürelerini benzer veri büyüklüğü ve ağ koşullarında karşılaştırın.

## Geri dönüş

Google App Script eski `Code.gs` yedeğinizi geri yükleyip **aynı dağıtımı** yeniden `New version` ile güncelleyin. GitHub `main` dalı ve canlı GitHub Pages yayını GO2 çalışması sırasında değiştirilmedi.

## Test

GitHub Actions `AYDA Data Integrity Tests` iş akışı `node --check` ve `node --test tests/*.test.mjs` ile mevcut veri regresyon testleri ve GO2 testlerini yürütür.

**Sınırlama:** Bu değişiklik farklı HTTP istekleri arasındaki Google gecikmesini tek başına ortadan kaldırmaz. Öğretmen veya yönetici giriş hızında garanti edilen saniye kazanımı henüz ölçülmedi.
