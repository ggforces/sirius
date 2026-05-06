# Sirius - Profesyonel Proje Yapısı

## 📁 Klasör Yapısı

```
Sirius/
├── views/                          # View template dosyaları
│   ├── layout.html                 # Ana layout (sidebar, topbar, footer)
│   └── pages/                      # Sayfa içerikleri
│       ├── dashboard.html          # Dashboard sayfası
│       ├── accounts.html           # Hesaplar sayfası
│       ├── automation.html         # Otomasyon sayfası
│       ├── reports.html            # Raporlar sayfası
│       └── settings.html           # Ayarlar sayfası
│
├── src/                            # Backend kaynak kodları
│   ├── config/                     # Konfigürasyon dosyaları
│   │   └── database.js             # SQLite veritabanı yapılandırması
│   │
│   ├── controllers/                # İş mantığı kontrolcüleri
│   │   ├── authController.js       # Kimlik doğrulama
│   │   ├── earningsController.js   # Kazanç yönetimi
│   │   └── farmlabsController.js   # FarmLabs API entegrasyonu
│   │
│   ├── middleware/                 # Express middleware'leri
│   │   └── authMiddleware.js       # JWT doğrulama
│   │
│   ├── routes/                     # API ve view route'ları
│   │   ├── authRoutes.js           # Auth API endpoints
│   │   ├── earningsRoutes.js       # Earnings API endpoints
│   │   ├── farmlabsRoutes.js       # FarmLabs API endpoints
│   │   └── viewRoutes.js           # Frontend sayfa route'ları
│   │
│   ├── services/                   # Servis katmanı
│   │   └── farmlabsService.js      # FarmLabs API servisi
│   │
│   └── utils/                      # Yardımcı fonksiyonlar
│       └── viewRenderer.js         # Template rendering sistemi
│
├── public/                         # Statik dosyalar
│   ├── css/                        # Stil dosyaları
│   │   ├── style.css               # Genel stiller
│   │   └── dashboard.css           # Dashboard stiller
│   │
│   ├── js/                         # JavaScript dosyaları
│   │   ├── common.js               # Ortak fonksiyonlar (auth, notification, vb.)
│   │   ├── main.js                 # Ana sayfa JS
│   │   └── pages/                  # Sayfa-specific JS dosyaları
│   │       ├── dashboard.js        # Dashboard sayfası
│   │       ├── accounts.js         # Hesaplar sayfası
│   │       ├── automation.js       # Otomasyon sayfası
│   │       ├── reports.js          # Raporlar sayfası
│   │       └── settings.js         # Ayarlar sayfası
│   │
│   ├── index.html                  # Ana sayfa (login/register)
│   └── dashboard.html              # Eski dashboard (artık kullanılmıyor)
│
├── server.js                       # Express server
├── package.json                    # NPM bağımlılıkları
├── .env                            # Ortam değişkenleri
├── .env.example                    # Örnek ortam değişkenleri
├── .gitignore                      # Git ignore kuralları
├── database.sqlite                 # SQLite veritabanı
├── README.md                       # Proje dokümantasyonu
└── PROJECT_STRUCTURE.md            # Bu dosya
```

## 🏗️ Mimari Yapı

### 1. **View Layer (Template System)**
- `views/layout.html`: Tüm sayfalar için ortak layout
- `views/pages/*.html`: Her sayfa için ayrı içerik dosyası
- `src/utils/viewRenderer.js`: Template rendering motoru
- Placeholder sistemi: `{{VARIABLE_NAME}}`

### 2. **Backend Layer**
- **Controllers**: İş mantığı ve API endpoint'leri
- **Services**: Dış API entegrasyonları ve karmaşık işlemler
- **Middleware**: Kimlik doğrulama, rate limiting, vb.
- **Routes**: API ve view route tanımlamaları

### 3. **Frontend Layer**
- **common.js**: Tüm sayfalarda kullanılan ortak fonksiyonlar
  - Authentication check
  - User data loading
  - Notification system
  - Logout functionality
  
- **pages/*.js**: Her sayfa için özel JavaScript
  - Dashboard: Kazanç grafikleri, istatistikler
  - Settings: Şifre değiştirme, API key yönetimi
  - Diğer sayfalar: İlgili sayfa fonksiyonları

## 🔄 Sayfa Akışı

1. Kullanıcı `/panel/dashboard` adresine gider
2. `server.js` → `viewRoutes.js` → `/dashboard` route'u
3. `viewRenderer.render('dashboard')` çağrılır
4. `layout.html` + `pages/dashboard.html` birleştirilir
5. Placeholder'lar değiştirilir ({{PAGE_TITLE}}, {{CONTENT}}, vb.)
6. HTML kullanıcıya gönderilir
7. `common.js` yüklenir (auth, user data)
8. `pages/dashboard.js` yüklenir (sayfa-specific)

## 📝 Yeni Sayfa Ekleme

### 1. View Dosyası Oluştur
```bash
views/pages/yeni-sayfa.html
```

### 2. JavaScript Dosyası Oluştur
```bash
public/js/pages/yeni-sayfa.js
```

### 3. Route Ekle
```javascript
// src/routes/viewRoutes.js
router.get('/yeni-sayfa', (req, res) => {
    const html = viewRenderer.render('yeni-sayfa', {
        EXTRA_SCRIPTS: '<script src="/js/pages/yeni-sayfa.js"></script>'
    });
    res.send(html);
});
```

### 4. Sidebar'a Ekle
```html
<!-- views/layout.html -->
<a href="/panel/yeni-sayfa" class="nav-item {{ACTIVE_YENI_SAYFA}}">
    <span class="nav-icon">🆕</span>
    <span class="nav-label">Yeni Sayfa</span>
</a>
```

## 🎯 Avantajlar

### ✅ Modüler Yapı
- Her sayfa ayrı dosyada
- Kolay bakım ve geliştirme
- Kod tekrarı yok

### ✅ Performans
- Sadece gerekli JS yüklenir
- Her sayfa için optimize edilmiş kod
- Daha hızlı sayfa yükleme

### ✅ Ölçeklenebilirlik
- Yeni sayfa eklemek kolay
- Bağımsız geliştirme
- Takım çalışmasına uygun

### ✅ Bakım Kolaylığı
- Kod organizasyonu net
- Hata ayıklama kolay
- Dokümantasyon açık

## 🔧 Geliştirme Notları

### Template Placeholder'ları
- `{{PAGE_TITLE}}`: Sayfa başlığı
- `{{CONTENT}}`: Sayfa içeriği
- `{{EXTRA_HEAD}}`: Ek head içeriği (CSS, meta, vb.)
- `{{EXTRA_SCRIPTS}}`: Ek script'ler
- `{{ACTIVE_*}}`: Aktif menü öğesi

### Ortak Fonksiyonlar (common.js)
- `checkAuth()`: Kullanıcı kimlik kontrolü
- `loadUserData()`: Kullanıcı verilerini yükle
- `showNotification(message, type)`: Bildirim göster
- `updateStatValue(id, value)`: İstatistik değeri güncelle

### API Endpoints
- `/api/auth/*`: Kimlik doğrulama
- `/api/earnings/*`: Kazanç yönetimi
- `/api/farmlabs/*`: FarmLabs entegrasyonu

## 📊 Veritabanı Tabloları

- `users`: Kullanıcı bilgileri
- `earnings`: Günlük kazanç kayıtları
- `farmlabs_settings`: FarmLabs API ayarları

## 🚀 Çalıştırma

```bash
# Bağımlılıkları yükle
npm install

# Geliştirme modunda çalıştır
npm run dev

# Production modunda çalıştır
npm start
```

## 🔐 Güvenlik

- JWT tabanlı kimlik doğrulama
- Rate limiting (300 req/15min)
- Helmet.js güvenlik başlıkları
- CORS koruması
- SQL injection koruması (prepared statements)

## 📦 Bağımlılıklar

- **express**: Web framework
- **better-sqlite3**: SQLite veritabanı
- **jsonwebtoken**: JWT auth
- **bcryptjs**: Şifre hashleme
- **helmet**: Güvenlik
- **express-rate-limit**: Rate limiting
- **dotenv**: Ortam değişkenleri
- **axios**: HTTP client (FarmLabs API)

---

**Son Güncelleme**: 06.05.2026
**Versiyon**: 2.0.0 (Profesyonel Yapı)
