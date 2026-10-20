# AYDA Lehrer — Kapsamlı bakım ve doğrulama raporu
**Tarih:** 20.10.2026  
**Kaynak:** `onurqlp/lehrer`, `main`  
**Çalışma kapsamı:** Öğretmen, yönetici, öğrenci formları, Apps Script yönlendirme katmanı ve Google Sheets veri bütünlüğü.

## Test yöntemi
- Canlı Google Sheets **salt okunur** olarak incelendi; hiçbir gerçek öğrenci, öğretmen veya ders kaydı yazılmadı, silinmedi ya da test için değiştirilmedi.
- Frontend ve Apps Script kaynakları üzerinden sözdizimi, API yönlendirme eşleşmesi, ilgili HTML/CSS/JS bağımlılıkları kontrol edildi.
- Google kayıt fonksiyonlarının doğrulama ve idempotency senaryoları **bellekteki sahte tablolar** ile çalıştırıldı.
- Yanıt gecikmesi, geri dönüş yolu ve tekrar kayıt isteği senaryoları sahte API istemcisiyle çalıştırıldı.
- Gerçek kullanıcı parolaları alınmadığı ve canlı web alan adı bu oturumdaki ağ araçlarından erişilemediği için **canlı tarayıcıda yetkili oturumla son kullanıcı testi doğrulanmış değildir.** Bu rapor bunu gizlemez.

## Test sonucu
| Alan | Kontrol | Sonuç |
|---|---|---|
| Kod sözdizimi | 22 ana JS dosyası ve Code.gs | Başarılı |
| Bağımlılıklar | 16 CSS dosyası ve ana sayfa JS bağlantıları | Mevcut |
| API yönlendirme | Ön yüzden kullanılan 32 ayrı Google eylemi | Backend içinde karşılığı var |
| Özel ders kaydı | Geçerli, tekrar, yarım saat, yetkisiz, geçmiş/gelecek tarih vb. 7 sahte veri senaryosu | 7/7 başarılı |
| Yoklama ve ödev | Tam liste, duplicate, yanlış öğrenci, mazeretli ve ödev durumları | 8/8 başarılı |
| Grup raporu | Saat, tarih, yetki, ünite, not, eksik yoklama | 6/6 başarılı |
| Öğretmen öğrenci ekleme | Geçerli, mevcut, yetkisiz, başka grup, uygunsuz ad | 6/6 başarılı |
| API taşınması | Okuma fallback, okuma timeout, yazma timeout ve bağlantı hatası | 4/4 başarılı |
| Regression smoke | `tests/smoke.js`, 11 kontrol tanımı | Eklendi; checkout ortamında `node tests/smoke.js` ile çalıştırılabilir |

## Canlı veri tutarlılığı (salt okunur)
- Öğrenciler: **117**; öğrenci ID tekrarı yok.
- Grup dersleri: **16**; ders ID tekrarı yok.
- Özel ders çizelgesi: **1**; ID tekrarı yok.
- Yoklama: **190** satır; öğrenci kaydı olmayan bağlantı bulunmadı.
- Ödev kontrolü: **144** satır.
- Ders ödevleri: **10** satır; olmayan ders ID'sine bağlı kayıt bulunmadı.
- Öğrencilerin tüm grup ID'leri mevcut grup listesinde.

## Bu bakımda giderilenler
1. Yönetici öğrencileri listesi, yanlışlıkla yazma işlemi olarak sınıflandırılırken artık **salt okunur** işleniyor.
2. Öğrenci listesi, yoklama ve öğretmen aylık hesaplarında daha gerçekçi okuma bekleme süresi kullanılıyor.
3. Veriler zaman aşımına uğradığında bütün API adresleri denenmiş gibi yanlış bilgi verilmiyor.
4. Ders süresi doğrulaması yalnızca **1–6 tam saati** kabul ediyor; gereksiz eski Apps Script sürüm kontrolü ve ping isteği kaldırıldı.
5. Ödev görevleri, öğretmen öğrenci takibi ve iletişim rehberinde eski sürüm dağıtma uyarıları kaldırıldı; gerçek bağlantı/yanıt hataları gösteriliyor.
6. Tarayıcı önbelleği sorunlarını azaltmak için ilgili script sürüm parametreleri güncellendi.
7. Gelecekteki değişiklikler için salt okunur smoke test dosyası repoya eklendi.

## Bilinen yapısal risk ve müdahale kararı
- **H001 öğretmen ID'si 5 aktif kullanıcı hesabı tarafından ortak kullanılıyor.** Bu, hesap ve akademik grup sahipliğini birbirinden ayırmak için planlı veri göçü gerektirebilir. Kayıp riski nedeniyle bu bakımda otomatik değiştirilmedi.
- Canlı parolayla giriş, gerçek rapor kaydetme, WhatsApp mesajını gerçekten gönderme ve mobil tarayıcı uçtan uca işlemleri ağ/oturum erişimi olmadan tamamlanmış olarak gösterilemez.
- Google Apps Script `Code.gs` bu bakımda **değiştirilmedi**. Google tablosunda **hiçbir veri değişikliği yapılmadı**. Bu değişiklikler için Apps Script yeniden dağıtımı **gerekmiyor**.

## Tekrar çalıştırma
```bash
node tests/smoke.js
```
Bu komut yalnızca proje kaynaklarını okur; hiçbir Google bağlantısı kurmaz veya kayıt üretmez.
