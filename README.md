# AYDA Akademik Takip — Google Sheets + Apps Script

## Kurulum
1. Mevcut **AYDA – Akademik Takip Veritabanı** Google Sheet'inde **Uzantılar > Apps Komut Dosyası** açın.
2. `apps-script/Code.gs` içeriğini Apps Script'teki `Kod.gs` dosyasına yapıştırın.
3. Sol tarafta **+ > HTML** ile adı **Index** olan dosya açın; `apps-script/Index.html` içeriğini yapıştırın.
4. Kaydedin. Fonksiyon listesinden `kurulumAYDA` seçip **Çalıştır**'a basın ve Google izinlerini onaylayın.
5. **Yürütme günlüğü** içinde oluşturulan admin ve öğretmen PIN'lerini bir kez not edin. Bunları kimseyle toplu paylaşmayın. Bu dosyada veya GitHub'da saklamayın.
6. **Dağıt > Yeni dağıtım > Web uygulaması**: **Şu kişi olarak yürüt: Ben**; **Erişimi olanlar: Herkes**. Bu seçeneğin anlamı: bağlantı herkese açık olsa da veri işlemleri uygulama içindeki PIN ve rol kontrolüyle korunur. Bu bir başlangıç güvenlik modelidir; daha güçlü kimlik doğrulama ve hız sınırlaması olmadan hassas öğrenci verilerini yüklemeyin.
7. Oluşan `/exec` URL'sini `github/config.js` dosyasında `window.AYDA_APPS_SCRIPT_URL` alanına yazın.
8. GitHub Pages için yalnızca `github/` klasöründeki **index.html ve config.js** dosyalarını deponun köküne yükleyin. Apps Script kodu GitHub'dan değil Apps Script üzerinden çalışır.
9. Önce yönetici olarak giriş yapıp eksik ders programlarını, mevcut tamamlanan üniteleri ve özel ders öğrencilerini ekleyin.

## Önemli
- GitHub Pages yalnızca **giriş bağlantısını** gösterir. Gerçek uygulama Google Apps Script üzerinde çalışır. Bu, tarayıcıdan doğrudan Apps Script'e yapılan çapraz-kaynak isteklerinde oluşabilecek sorunları önler.
- Google Sheet'i öğretmenlerle **paylaşmayın**. Öğretmenler uygulamadan kendi PIN'leriyle giriş yapar.
- Ders süresi: grup **40 dk**, özel **50 dk**. 90 dakikalık bir grup oturumu varsayılan **2 ders saati + 10 dk ara** olarak tanımlandı; gerekirse yönetici düzeltir.
- Başlangıç verileri **10 grup**, **5 isimlendirilmiş öğretmen** ve bilinen P-Ç-C programlarıdır. CNC programlarının bazı saatleri, atanamayan öğretmenler ve mevcut üniteler boş bırakılmıştır.
- Ders raporu her program/tarih için tek kayıttır. Hatalı kaydın düzeltilmesi şu an yönetici tarafından Sheet'te yapılır; bu ilk sürümün bir sınırlamasıdır.
- Bu sürüm **başlangıç üretim adayıdır**, kurulumdan önce canlı çalıştığı doğrulanmış değildir. Gerçek öğrenci kişisel verilerini eklemeden önce PIN yenileme, giriş deneme sınırlaması, güvenli kurtarma, kayıt düzeltme akışı, denetim ve yedekleme testleri tamamlanmalıdır.
- Google Apps Script CacheService oturumları en fazla 6 saat saklar, erken sona erebilir.
- Ücretsiz Google kotaları, Google'ın hizmet koşulları ve değişebilen limitlerine tabidir.
