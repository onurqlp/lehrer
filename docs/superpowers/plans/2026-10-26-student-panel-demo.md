# AYDA Öğrenci Paneli Demo Implementation Plan

> **For agentic workers:** Required sub-skill: use the executing-plans workflow. Steps use checkbox syntax for tracking.

**Goal:** Güncel lehrer deposuna, canlı sistemden izole, sentetik fixture kullanan çalışır öğrenci paneli preview rotası eklemek.

**Architecture:** Bağımsız ogrenci.html sayfası mevcut AYDA tema/logo dosyalarını kullanır; özel stylesheet ve JS dosyası yalnız bu sayfayı etkiler. Giriş, preview için sabit demo hesabıyla tarayıcı içinde çalışır ve gerçek öğrenci API’si olmadığı görünür biçimde açıklanır.

**Tech Stack:** Statik HTML, CSS, vanilla JavaScript; GitHub branch/PR; mevcut Vercel preview.

**Spec:** docs/superpowers/specs/2026-10-26-student-panel-design.md

## Global Constraints
- Sadece feat/student-panel-demo-20261026 branch’ine yaz; main/canlı domain/Apps Script dağıtımı değişmeyecek.
- Gerçek öğrenci adı, parolası, Sheet verisi veya ödev metni fixture’a girmeyecek.
- Demo statik kimlik doğrulaması canlı güvenlik olarak sunulmayacak; preview’da DEMO etiketi gösterilecek.
- Üretim Google Apps Script ve diğer portalların içeriği/şifresi değiştirilmeyecek.
- Çalışan preview doğrulanmadan “yayında” denmeyecek.

## Review Focus
- Yanlış parola oturumu açmamalı; test bu durumda giriş hatasını doğrular.
- Çıkış oturum ve panel görünümünü temizlemeli; test logout ardından giriş ekranını doğrular.
- Demo verisi canlı veya gerçek kişi olarak sunulmamalı; test görünür DEMO işaretini ve sentetik isim kullanımını doğrular.
- Ödev yok/teslim tarihli ödev görüntüsü anlaşılır olmalı; test fixture varyantlarıyla doğrular.
- Gelecek konu belirtilmemişse uydurulmamalı; test bu metinle kartı doğrular.
- Mobil ekran yatay taşmamalı; 360px ve 430px genişliklerde tarayıcı görünümü doğrulanır.
- Portal kartları doğru iki harici adrese gitmeli; href kontrolleriyle doğrulanır.
- Öğretmen sayfası/Apps Script’e değişiklik girmemeli; PR dosya listesini kontrol eder.

---

### Task 1: Student demo page and state

**Files:**
- Create: ogrenci.html
- Create: assets/student-panel.js

**Interfaces:**
- UI consumes a local demo account and fixture data; no network API calls.
- JS exports no global API; it binds login/logout and renders only the student page DOM.

- [ ] Create login and signed-in dashboard markup, visible demo banner, semantic error/status areas, AYDA logo, next lesson/homework sections, portal cards, conditional WhatsApp button, logout.
- [ ] Implement demo login, session restore, logout, fixture toggles for homework/no-homework and active/inactive accounts; show topic-unavailable copy and no invented plan.
- [ ] Verify static page references only existing shared logo/brand style plus the new dedicated stylesheet/script; no Apps Script URL or secrets.

### Task 2: Responsive visual system

**Files:**
- Create: assets/student-panel.css

**Interfaces:**
- Styles attach to .student-page/student-prefixed selectors only.
- Uses existing CSS variables where available, with local fallback colors.

- [ ] Implement navy/cream/gold AYDA look, responsive 360px mobile layout and two-column desktop grid, focus styles, large touch targets, skeleton/loading/error states.
- [ ] Verify 360px and 430px widths have no horizontal overflow and first view includes homework, next class, and both portal cards.

### Task 3: Branch preview and acceptance checks

**Files:**
- Modify: none beyond the three files above and design/plan docs.

**Interfaces:**
- Preview must be Vercel non-production deployment of feature branch/PR; production remains untouched.

- [ ] Run HTML/static JS checks and manually verify login success/failure, logout, homework date/no-homework states, inactive account, no next topic, correct URLs, conditional WhatsApp, and mobile/desktop layout.
- [ ] Open a PR targeting main and wait for Vercel Preview. If unavailable, report the concrete blocker and do not claim a preview URL.
- [ ] Verify PR file list and deployment target; report demo credentials, preview URL, test outcomes, live-vs-synthetic boundary, and production go-live prerequisites.
