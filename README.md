# AYDA Akademik Takip

**Öğretmen / girişli yönetici paneli:** https://lehrer.aydadil.com/  
**Şifresiz salt okunur yönetici akademik özet panosu:** https://lehrer.aydadil.com/yonetici.html


## Yeni takip merkezi (15 Ekim 2026)
- `yonetici.html` parola istemez: herkese açık, salt okunur akademik özet sunar; bireysel öğrenci bilgileri anonim uçta sunulmaz.
- Şifresiz yönetici menüsü: Genel bakış, Gruplar (ilerleme ve tahmin), Öğretmenler (aylık ders ve CSV).
- Öğretmen ana sayfasında **Öğrencilerim · Takip Merkezi** bulunur. Yeni `trackingSummary` yalnızca öğretmenin yetkili olduğu aktif grupları döndürür.
- Risk: üst üste 2 mazeretsiz devamsızlık, son 5 yoklamada 3 mazeretsiz devamsızlık veya son 5 ödevde 3 eksik => öncelikli. 1 mazeretsiz devamsızlık ya da son 5'te 2 eksik ödev => takip edilmeli. Kayıt yoksa risk hesaplanmış gibi gösterilmez.
- **Google tarafında zorunlu işlem:** `apps-script/Code.gs` dosyasının tamamını mevcut **AYDA Akademik Takip CRM** Apps Script projesinin `Kod.gs` dosyasına yapıştır, kaydet; mevcut **Web uygulaması** dağıtımını düzenleyip **Yeni sürüm** olarak yayımla. Erişim: **Herkes**, çalıştıran: **Ben**. Mevcut dağıtım ID'sini değiştirmeyin.
- Yönetici anahtarı mevcut değilse ilk anahtar kurulmalıdır; daha önce varsa otomatik silinmez. Yönetici anahtarını kimseyle paylaşmayın.
- `publicDashboard` uç noktası anonim özet verisi döndürür (öğrenci adı, yoklama ve ödev yok); şifresiz yönetici sayfası bu uç noktayı kullanır.

## Bileşenler
- `index.html` + `assets/app.js`: öğretmen ve yönetici girişi, ders raporları, grup yönetimi, kolay parola belirleme.
- `assets/viewer.js` + `assets/viewer.css`: etkin şifresiz akademik özet panosu. `assets/manager.js` ve `assets/manager.css` henüz kullanılmayan ayrıntılı prototiptir.
- `assets/teacher-tracking.js` + `assets/teacher-tracking.css`: öğretmenin kendi öğrenci durumları.
- `assets/attendance-preview.js`: girişten sonra Apps Script `studentRoster` çağrısı, yoklama, mazeret, isteğe bağlı ödev kontrolü; tek rapor kaydı.
- `assets/viewer.js`: şifresiz akademik pano, **yalnızca** `publicDashboard` salt-okunur çağrısı.
- `assets/config.js`: Apps Script dağıtım URL'si.
- `apps-script/Code.gs`: **tam Apps Script kaynak kodu**; Google Apps Script projesindeki `Kod.gs` ile aynı tutulmalı.

## Google Apps Script yayımlama
1. AYDA Google Sheets → **Uzantılar → Apps Script** bölümünü açın.
2. Mevcut `Kod.gs` kodunu yedekleyin; GitHub'daki `apps-script/Code.gs` içeriğinin tamamını yapıştırın, **Ctrl+S** ile kaydedin.
3. Üstteki fonksiyon menüsünden **`aydaHealthCheck`** seçin → **Çalıştır**. Google izinlerini onaylayın. Yürütme kaydında `ok:true` görünmeli. Bu kontrol gerçek öğrenci bilgilerini günlüklemez.
4. **Dağıt → Dağıtımları yönet → Mevcut web uygulaması → Düzenle (kalem) → Sürüm: Yeni sürüm → Dağıt.**
5. Web uygulaması **Çalıştıran: Ben**, **Erişimi olanlar: Herkes** olmalı. `aydadil.com` kullanıcılarıyla sınırlı erişim, şifresiz GitHub panosunu engeller.
6. Yeni dağıtımın `/exec` URL'si değişirse `assets/config.js` dosyasını güncelleyin.

## Dağıtım testi
Şu bağlantı biçimini gizli pencerede açın:

```
https://script.google.com/macros/s/DAĞITIM_KİMLİĞİ/exec?action=ping&callback=ayda_cb_test123
```

Beklenen yanıt:
```js
ayda_cb_test123({"ok":true,"data":{"status":"ok","version":"2026-10-15.2"}});
```

Google giriş / Drive hata sayfası görünüyorsa **GitHub değil Apps Script dağıtım erişimi** sorunludur. Workspace yöneticisi "Herkes" erişimini kısıtlamış olabilir.

## Veriler ve erişim
- `OGRENCILER`: aktif gruplarla eşleşmiş öğrenciler.
- `YOKLAMA`: ders raporuna bağlı geldi / gelmedi / mazeretli.
- `ODEV_TAKIBI`: kontrol varsa yaptı / yapmadı / kontrol edilmedi.
- Öğrenci listesi ve kişisel devamsızlık raporları yalnızca doğrulanmış girişli panelde gösterilir.
- Şifresiz `publicDashboard` **öğrenci adları, bireysel yoklama, ödev, öğretmen özel notları, giriş anahtarları veya serbest metin konu bilgileri** döndürmez.
- Yeni parolalar Script Properties içinde özet değer (hash) olarak saklanır. Eski giriş anahtarları, parola değiştirilene kadar çalışır.
- **Yazma istekleri ağ hatasında otomatik tekrar edilmez:** dersin iki kez kaydedilmesini önler.

## Durum
GitHub kaynak dosyaları güncel. Google Apps Script'e kodun kopyalanması, Google yetkilendirmesi ve yeni sürüm dağıtımı kullanıcı hesabında ayrıca yapılmalıdır. Kodun örnek verilerle yerel işlev testleri yapıldı; canlı dağıtım henüz doğrulanmadı.
