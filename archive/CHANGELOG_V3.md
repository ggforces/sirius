# DEĞİŞİKLİK KAYDI V3 - Çok Dilli Destek (i18n)

## 🌍 Çok Dilli Sistem Uygulaması

### Tarih: 2026-05-06

---

## ✨ YENİ ÖZELLİKLER

### 1. **Uluslararasılaştırma (i18n) Sistemi**
- **`lang/` klasörü oluşturuldu** ve çeviri dosyaları eklendi:
  - `lang/tr.json` - Türkçe çeviriler
  - `lang/en.json` - İngilizce çeviriler
- **Tüm UI metinleri dışsallaştırıldı** - HTML/JS içinde hardcoded string yok
- **Dinamik dil değiştirme** - Kullanıcılar oturum kaybetmeden dil değiştirebilir

### 2. **i18n Middleware**
- **Dosya:** `src/middleware/i18n.js`
- **Özellikler:**
  - Cookie, query parametresi veya tarayıcı başlıklarından otomatik dil algılama
  - İç içe anahtar desteği ile çeviri fonksiyonu (örn: `dashboard.stats.thisWeek`)
  - Dinamik değerler için string interpolation desteği
  - Desteklenmeyen dil istenirse varsayılan dile (Türkçe) geri dönüş
  - Express middleware entegrasyonu

### 3. **Dil Değiştirici Arayüzü**
- **Konum:** Sidebar sol alt (kullanıcı bilgilerinin altında)
- **Tasarım:** Bayrak butonları (🇹🇷 Türkçe, 🇬🇧 English) + metin
- **İşlevsellik:**
  - Aktif dil için görsel durum göstergesi
  - Sayfa yenileme ile sorunsuz dil değiştirme
  - Dil tercihi cookie'de saklanır (1 yıl geçerlilik)
  - Çıkış butonu da sidebar'da (kırmızı tema)

### 4. **Güncellenmiş View Renderer**
- **Dosya:** `src/utils/viewRenderer.js`
- **Yeni Özellikler:**
  - `{{t:key.path}}` placeholder'larını değiştiren `applyTranslations()` metodu
  - Dile duyarlı sayfa başlığı oluşturma
  - Çeviriler ve dil kodu client-side JavaScript'e enjekte edilir
  - İç içe çeviri anahtarları desteği

---

## 🔧 TEKNİK DEĞİŞİKLİKLER

### Backend Güncellemeleri

#### `server.js`
- i18n middleware import'u eklendi
- i18n middleware route'lardan önce kaydedildi
- Dil değiştirme için `/api/language` POST endpoint'i eklendi
- Dil cookie yönetimi (httpOnly, production'da secure)

#### `src/routes/viewRoutes.js`
- Tüm route handler'lar çevirileri ve dili renderer'a iletecek şekilde güncellendi
- Hata mesajları artık çeviri anahtarlarını kullanıyor

#### `src/middleware/i18n.js` (YENİ)
- Çeviri yönetimi için `I18n` sınıfı
- Anahtar tabanlı çeviri araması için `t()` metodu
- Tüm çevirileri almak için `getAll()` metodu
- Express entegrasyonu için `middleware()` metodu
- Birden fazla kaynaktan otomatik dil algılama

### Frontend Güncellemeleri

#### `views/layout.html`
- Tüm hardcoded Türkçe metinler `{{t:key}}` placeholder'ları ile değiştirildi
- Sidebar footer'a dil değiştirici UI eklendi
- Sidebar footer'a çıkış butonu eklendi
- `<html>` etiketinde dinamik `lang` özelliği
- Çeviriler `window.APP_TRANSLATIONS`'a enjekte edildi
- Mevcut dil `window.APP_LANG`'e enjekte edildi

#### `views/pages/*.html`
- **dashboard.html** - Tüm istatistikler, grafik, hızlı işlemler ve aktivite metinleri çevrildi
- **accounts.html** - Başlık ve yakında gelecek mesajı çevrildi
- **automation.html** - Başlık ve yakında gelecek mesajı çevrildi
- **reports.html** - Başlık ve yakında gelecek mesajı çevrildi
- **settings.html** - Tüm profil, güvenlik ve FarmLabs entegrasyon metinleri çevrildi

#### `public/js/common.js`
- Dil değiştirici event listener'ları eklendi (sidebar butonları için)
- Aktif dil butonu vurgulama
- Hata yönetimi ile dil değiştirme API çağrısı
- Başarılı dil değişikliğinden sonra sayfa yenileme
- Sidebar çıkış butonu için event listener eklendi

#### `public/css/dashboard.css`
- `.sidebar-language-switcher` stilleri eklendi
- `.sidebar-lang-btn` stilleri (hover ve active durumları ile)
- `.sidebar-logout-btn` stilleri (kırmızı tema, danger color)
- Bayrak ve metin ikonu stilleri
- Topbar'daki eski dil değiştirici stilleri kaldırıldı

---

## 📋 ÇEVİRİ YAPISI

### Çeviri Anahtarları Hiyerarşisi

```
app
├── name (Uygulama başlığı)
├── logo (Logo metni)
└── lang (Dil kodu)

nav
├── dashboard
├── accounts
├── automation
├── reports
└── settings

topbar
└── logout

sidebar
└── loading

dashboard
├── title
├── stats
│   ├── thisWeek
│   ├── thisMonth
│   ├── last3Months
│   └── totalEarnings
├── chart
│   ├── title
│   ├── lastUpdate
│   ├── refreshBtn
│   └── infoNote
├── quickActions
│   ├── title
│   ├── addAccount
│   ├── checkAccounts
│   ├── loadBalance
│   └── viewReports
└── activity
    ├── title
    ├── welcome
    ├── accountCreated
    └── justNow

accounts
├── title
└── comingSoon

automation
├── title
└── comingSoon

reports
├── title
└── comingSoon

settings
├── title
├── profile
│   ├── title
│   ├── email
│   ├── createdAt
│   ├── lastLogin
│   └── loading
├── security
│   ├── title
│   ├── currentPassword
│   ├── currentPasswordPlaceholder
│   ├── newPassword
│   ├── newPasswordPlaceholder
│   ├── newPasswordHint
│   ├── confirmPassword
│   ├── confirmPasswordPlaceholder
│   └── changePasswordBtn
└── farmlabs
    ├── title
    ├── infoText
    ├── dashboardLink
    ├── infoText2
    ├── apiKeyLabel
    ├── apiKeyPlaceholder
    ├── apiKeyStatusNotSaved
    ├── apiKeyStatusSaved
    ├── testBtn
    ├── saveBtn
    └── syncBtn

common
├── loading
├── error
├── success
├── cancel
├── save
├── delete
├── edit
└── close
```

---

## 🎯 NASIL ÇALIŞIR

### 1. **Sunucu Tarafı Çeviri Akışı**
```
İstek → i18n Middleware → Dil Algıla → Çevirileri Yükle → 
req.translations'a Ekle → View Renderer → {{t:key}} Değiştir → HTML Gönder
```

### 2. **İstemci Tarafı Dil Değiştirme**
```
Kullanıcı Bayrak Butonuna Tıklar → POST /api/language → Cookie Ayarla → 
Sayfayı Yenile → Yeni Dil Uygulanır
```

### 3. **Dil Algılama Önceliği**
1. Cookie (`lang` cookie)
2. Query parametresi (`?lang=en`)
3. Accept-Language başlığı
4. Varsayılan dil (Türkçe)

---

## 🌐 DESTEKLENEN DİLLER

| Dil      | Kod  | Bayrak | Durum |
|----------|------|--------|-------|
| Türkçe   | `tr` | 🇹🇷     | ✅ Tamamlandı |
| İngilizce| `en` | 🇬🇧     | ✅ Tamamlandı |

---

## 📝 YENİ DİL EKLEME

Yeni bir dil eklemek için:

1. **Çeviri dosyası oluştur:** `lang/{kod}.json`
2. **Yapıyı kopyala:** `lang/tr.json` veya `lang/en.json`'dan
3. **Tüm değerleri çevir** (anahtarları değiştirme)
4. **Desteklenen dilleri güncelle** `src/middleware/i18n.js` içinde:
   ```javascript
   this.supportedLangs = ['tr', 'en', 'de']; // Yeni kodu ekle
   ```
5. **Bayrak butonu ekle** `views/layout.html` içinde:
   ```html
   <button class="sidebar-lang-btn" data-lang="de" title="Deutsch">
       <span class="flag-icon">🇩🇪</span>
       <span class="lang-label">Deutsch</span>
   </button>
   ```

---

## 🔒 GÜVENLİK HUSUSLARI

- Dil cookie'si XSS saldırılarını önlemek için `httpOnly`
- Cookie production'da `secure` (sadece HTTPS)
- CSRF'yi önlemek için cookie `sameSite: 'lax'`
- Dil kodu doğrulama (sadece desteklenen diller kabul edilir)
- Kullanıcı girdisi doğrudan çevirilerde kullanılmaz

---

## 🎨 UI/UX İYİLEŞTİRMELERİ

- **Sorunsuz geçiş:** Dil değişiklikleri yenileme ile anında uygulanır
- **Görsel geri bildirim:** Aktif dil butonu vurgulanır
- **Kalıcı tercih:** Dil seçimi 1 yıl boyunca saklanır
- **Veri kaybı yok:** Dil değişimi sırasında oturum ve kullanıcı verisi korunur
- **Responsive tasarım:** Dil değiştirici mobil ekranlara uyum sağlar
- **Sidebar konumu:** Dil değiştirici ve çıkış butonu sol altta, kolay erişim

---

## 📊 İSTATİSTİKLER

- **Toplam çeviri anahtarı:** ~80
- **Desteklenen dil sayısı:** 2 (Türkçe, İngilizce)
- **Değiştirilen dosya:** 15
- **Oluşturulan yeni dosya:** 4
- **Eklenen kod satırı:** ~500

---

## 🚀 GELECEK GELİŞTİRMELER

- [ ] Daha fazla dil ekle (Almanca, Fransızca, İspanyolca, vb.)
- [ ] Dile özel tarih/saat formatlama uygula
- [ ] Dile özel sayı formatlama ekle (ondalık ayırıcılar)
- [ ] Çevirileri yönetmek için admin paneli oluştur
- [ ] Çeviri doğrulama testleri ekle
- [ ] Çeviri dosyaları için lazy loading uygula
- [ ] Arapça/İbranice için RTL (Sağdan Sola) desteği ekle

---

## ✅ TEST KONTROL LİSTESİ

- [x] Türkçe dil doğru görüntüleniyor
- [x] İngilizce dil doğru görüntüleniyor
- [x] Dil değiştirici butonları çalışıyor
- [x] Aktif dil butonu vurgulanıyor
- [x] Dil tercihi yeniden yüklemeden sonra korunuyor
- [x] Tüm sayfalar çevrildi (dashboard, accounts, automation, reports, settings)
- [x] Navigasyon menüsü çevrildi
- [x] Topbar öğeleri çevrildi
- [x] Hata mesajları çevrildi
- [x] Form etiketleri ve placeholder'lar çevrildi
- [x] HTML'de hardcoded string kalmadı
- [x] Dil değiştirici sidebar'a taşındı
- [x] Çıkış butonu sidebar'a taşındı

---

## 📖 GELİŞTİRİCİ NOTLARI

### HTML'de Çeviri Kullanımı
```html
<!-- Basit çeviri -->
<h1>{{t:dashboard.title}}</h1>

<!-- Attribute'lerde çeviri -->
<input placeholder="{{t:settings.security.currentPasswordPlaceholder}}">
```

### JavaScript'te Çeviri Kullanımı
```javascript
// Çevirilere erişim
const translations = window.APP_TRANSLATIONS;
const currentLang = window.APP_LANG;

// Belirli bir çeviriyi al
const title = translations.dashboard.title;

// Veya backend'den t() fonksiyonunu kullan
req.t('dashboard.title')
```

### Yeni Çeviri Anahtarı Ekleme
1. Anahtarı hem `lang/tr.json` hem de `lang/en.json`'a ekle
2. HTML'de `{{t:yeni.anahtar.yolu}}` kullan
3. JS'de `window.APP_TRANSLATIONS.yeni.anahtar.yolu` ile eriş

---

## 🐛 BİLİNEN SORUNLAR

Şu anda bilinen sorun yok.

---

## 👥 KATKILAR

- Kiro AI Asistanı - Tam uygulama

---

**Değişiklik Kaydı V3 Sonu**
