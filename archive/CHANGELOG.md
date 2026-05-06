# 📝 Changelog

## [1.1.0] - 2026-05-06

### ✨ Yeni Özellikler

#### 🔌 FarmLabs API Entegrasyonu
- **API Key Yönetimi**
  - FarmLabs API key kaydetme ve test etme
  - Güvenli veritabanı saklama
  - Maskelenmiş key gösterimi
  
- **Drop Senkronizasyonu**
  - Son 90 günlük drop'ları otomatik çekme
  - Pagination desteği (500 kayıt/sayfa)
  - Günlük kazançlara dönüştürme
  - UPSERT ile veritabanına kaydetme
  
- **Çarşamba Bazlı Haftalık Hesaplama**
  - Steam drop reset gününe göre hafta başlangıcı
  - Son 8 haftalık kazanç grafiği
  - Bu hafta, bu ay, toplam istatistikler
  
- **Bot Yönetimi**
  - Bot gruplarını listeleme
  - Botları listeleme ve filtreleme
  - FarmLabs istatistikleri

#### 📊 Kazanç Sistemi İyileştirmeleri
- **Gerçek Güncelleme Zamanı**
  - "Son güncelleme" artık gerçek veri zamanını gösterir
  - Veri yoksa "Henüz veri yok" mesajı
  - Yanıltıcı "şu anki zaman" sorunu çözüldü

- **Haftalık Grafik İyileştirmesi**
  - Çarşamba bazlı hafta hesaplama
  - Daha doğru haftalık gruplama
  - Türkçe tarih formatı (örn: "15 Oca")

#### 🎨 UI/UX İyileştirmeleri
- **Ayarlar Sayfası**
  - FarmLabs entegrasyon bölümü
  - API key test butonu
  - Drop senkronizasyon butonu
  - Bilgilendirme mesajları
  
- **Yeni Buton Stilleri**
  - Secondary button (gri)
  - Success button (yeşil)
  - Disabled state animasyonları

### 🗄️ Veritabanı Değişiklikleri

#### Yeni Tablo: `farmlabs_settings`
```sql
CREATE TABLE farmlabs_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL UNIQUE,
    api_key TEXT NOT NULL,
    last_sync DATETIME,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
)
```

#### Yeni Index
- `idx_farmlabs_settings_user_id` - FarmLabs ayarları için

### 🔌 Yeni API Endpoints

#### FarmLabs Routes (`/api/farmlabs`)
- `POST /api-key/test` - API key test
- `POST /api-key` - API key kaydet
- `GET /api-key` - API key getir
- `POST /sync` - Drop'ları senkronize et
- `GET /stats` - İstatistikler
- `GET /bot-groups` - Bot grupları
- `GET /bots` - Botlar

### 📁 Yeni Dosyalar

#### Backend
- `src/services/farmlabsService.js` - FarmLabs API servisi
- `src/controllers/farmlabsController.js` - FarmLabs controller
- `src/routes/farmlabsRoutes.js` - FarmLabs routes

#### Dokümantasyon
- `FARMLABS_INTEGRATION.md` - Detaylı entegrasyon dokümantasyonu
- `CHANGELOG.md` - Bu dosya

### 🔧 Değişiklikler

#### Backend
- `src/config/database.js`
  - `farmlabs_settings` tablosu eklendi
  - Yeni index eklendi
  
- `src/controllers/earningsController.js`
  - Çarşamba bazlı hafta hesaplama
  - `getWednesdayWeekStart()` fonksiyonu
  - `formatWeekLabel()` fonksiyonu
  - `lastUpdate` field'ı eklendi
  
- `server.js`
  - FarmLabs routes import edildi
  - `/api/farmlabs` endpoint'i eklendi

#### Frontend
- `public/dashboard.html`
  - FarmLabs entegrasyon bölümü eklendi
  - API key formu
  - Test ve senkronizasyon butonları
  
- `public/css/dashboard.css`
  - Settings info stilleri
  - Button variants (secondary, success)
  - Form actions layout
  - Responsive iyileştirmeler
  
- `public/js/dashboard.js`
  - `loadFarmlabsApiKey()` fonksiyonu
  - `testFarmlabsApiKey()` fonksiyonu
  - `saveFarmlabsApiKey()` fonksiyonu
  - `syncFarmlabsDrops()` fonksiyonu
  - `updateLastUpdateTime()` parametreli hale getirildi

#### Dokümantasyon
- `README.md` - FarmLabs özellikleri eklendi
- `chat1.md` - FarmLabs entegrasyonu bölümü eklendi

### 🐛 Düzeltmeler

- **Kazanç Grafiği**
  - "Son güncelleme" zamanı artık gerçek veri zamanını gösterir
  - Haftalık hesaplama çarşamba bazlı yapıldı
  - Boş veri durumunda "Henüz veri yok" mesajı

### 📚 Dokümantasyon

- FarmLabs API entegrasyonu için kapsamlı dokümantasyon
- API endpoint örnekleri
- Kullanım kılavuzu
- Güvenlik notları
- Gelecek iyileştirmeler listesi

---

## [1.0.0] - 2026-05-06

### ✨ İlk Sürüm

#### Temel Özellikler
- Landing page (yıldız/uzay temalı)
- Authentication sistemi (JWT + bcrypt)
- Dashboard (SF CLI tarzı)
- Kazanç sistemi (grafik + istatistikler)
- Ayarlar sayfası (profil + şifre değiştirme)
- Güvenlik (helmet, rate limiting, CORS)

#### Veritabanı
- `users` tablosu
- `sessions` tablosu
- `earnings` tablosu

#### API Endpoints
- `/api/auth/*` - Authentication
- `/api/earnings/*` - Kazanç yönetimi
- `/api/health` - Health check

---

**Notlar:**
- Semantic versioning kullanılıyor (MAJOR.MINOR.PATCH)
- Her önemli değişiklik için changelog güncelleniyor
- Breaking changes MAJOR versiyonda yapılıyor
