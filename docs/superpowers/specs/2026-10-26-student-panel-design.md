# AYDA Öğrenci Paneli Demo Tasarımı

**Tarih:** 2026-10-26

## Amaç
Öğrencinin tek giriş ekranında haftalık ödev örneğini, sıradaki ders bilgisini ve iki AYDA portal kısayolunu görmesini sağlayan incelenebilir bir önizleme hazırlamak.

## Hedefler
- Telefon öncelikli, masaüstünde iki sütunlu öğrenci ana ekranı.
- Demo hesabı ile giriş/çıkış akışı.
- Sentetik, açıkça demo olarak etiketlenmiş ödev, grup programı ve öğrenci bilgisi.
- Öğrenme portalı ve ders tekrarları için çalışan harici bağlantılar.
- Gelecek konu yoksa belirtilmemesi; tahmini üniteyi kesinmiş gibi göstermemek.
- Mevcut öğretmen/yönetici sayfalarının, üretim Apps Script’inin ve Google verilerinin etkilenmemesi.

## Kapsam dışı
- Canlı öğrenci kimlik doğrulaması, Apps Script dağıtımı veya Sheet değişikliği.
- Gerçek öğrenci verisi, ödev dosyası teslimi, notlandırma, SSO veya otomatik WhatsApp mesajı.
- main, GitHub Pages canlı dağıtımı ve lehrer.aydadil.com üzerinde yayın.

## Yaklaşımlar
1. Mevcut öğretmen uygulamasına rol eklemek: Canlı API öğrenci oturumunu desteklemiyor; bu yaklaşım gerçek veri izolasyonu ve Apps Script yayını gerektirir, bu önizlemenin kapsamına uymaz.
2. Ayrı ve bağımsız statik demo rotası: ogrenci.html ve özel CSS/JS eklenir; yalnız sentetik içerik gösterir. Mevcut panelin oturum/veri davranışına karışmaz. **Seçilen yaklaşım:** Gereksinime ve güvenli preview sınırına en uygun olan budur.
3. Ayrı yeni servis kurmak: Daha gerçekçi API sağlayabilir ancak yeni altyapı/ücret ve üretim yapılandırması gerektirir; istenmiyor.

## Arayüz ve davranış
ogrenci.html AYDA ortak logo/tema dosyasını kullanır. assets/student-panel.css yalnız öğrenci rotasını stiller. assets/student-panel.js demo kimlik doğrulaması, oturum gösterimi, örnek verileri çizme ve çıkışı yönetir. Ekran 360–430 px mobilde tek sütun; geniş ekranda ödev/sonraki ders ile portal kartları iki sütunda görünür.

Demo oturumu yalnız tarayıcıda demo anahtarıyla tutulur; gerçek giriş güvenliği olarak sunulmaz. Sayfa içinde görünür DEMO etiketi ve veri açıklaması olur. Test hesabı sadece preview içindir.

## Kısıtlar ve uygulama kararları
- onurqlp/lehrer güncel main temel alınır; 16 Ekim ZIP’i referans olarak kalır.
- Öğretmen/yönetici ana sayfası, apps-script/Code.gs, API yapılandırması ve Google Sheets değişmez.
- Gerçek Apps Script öğrenci auth API’si sunmadığından öğrenci canlı veriyle eşleşmiş gibi gösterilmez.
- Sadece feature branch/PR üzerinde dosya eklenir. PR preview çıkmazsa yayın başarılı denmez.
- Demo program/ödev bilgileri örnektir; gerçek/grup verisi olduğu iddia edilmez.
- Saat dilimi Europe/Istanbul; gerçekçi takvim için sabit test fixture'ları kullanılır.
- Linkler https://ders.aydadil.com/ ve https://kurs.aydadil.com/ olarak açılır.

## Kabul kontrolleri
Doğru/yanlış kimlik bilgisi, giriş/çıkış, başka gruba ait veri bulunmadığı, ödev yok durumu, teslim tarihli ödev, iptal/pasif hesap mesajı, gelecek konu yokluğu, portal adresleri, mobil/masaüstü görünüm ve WhatsApp bağlantısı olmayan grup kontrol edilir. Test verisi her zaman sentetiktir.
