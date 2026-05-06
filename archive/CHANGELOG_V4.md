# DEĞİŞİKLİK KAYDI V4 - Steam Hesapları Yönetimi

## 🎮 Steam Hesapları Sayfası Uygulaması

### Tarih: 2026-05-06

---

## ✨ YENİ ÖZELLİKLER

### 1. **Steam Hesapları Database Tablosu**
- **Tablo:** `steam_accounts`
- **Alanlar:**
  - `id` - Otomatik artan birincil anahtar
  - `user_id` - Kullanıcı ID'si (foreign key)
  - `username` - Steam kullanıcı adı
  - `password` - Steam şifresi (AES-256 şifrelenmiş)
  - `shared_secret` - Steam Guard shared secret (AES-256 şifrelenmiş)
  - `identity_secret` - Steam Guard identity secret (AES-256 şifrelenmiş)
  - `created_at` - Oluşturulma tarihi

### 2. **Şifreleme Sistemi**
- **Dosya:** `src/utils/encryption.js`
- **Algoritma:** AES-256-CBC
- **Özellikler:**
  - `encrypt()` - Metni şifreler
  - `decrypt()` - Şifrelenmiş metni çözer
  - Her şifreleme için rastgele IV (Initialization Vector) kullanır
  - Şifreleme anahtarı `.env` dosyasında saklanır
  - 32-byte hex formatında güvenli anahtar

### 3. **Backend API Endpoints**
- **Dosya:** `src/routes/accountsRoutes.js`
- **Controller:** `src/controllers/accountsController.js`
- **Endpoints:**
  - `GET /api/accounts` - Tüm hesapları listele
  - `POST /api/accounts` - Yeni hesap ekle
  - `PUT /api/accounts/:id` - Hesap güncelle
  - `DELETE /api/accounts/:id` - Hesap sil
- **Güvenlik:** Tüm endpoint'ler authentication gerektirir

### 4. **Frontend Arayüzü**
- **HTML:** `views/pages/accounts.html`
- **JavaScript:** `public/js/pages/accounts.js`
- **CSS:** `public/css/dashboard.css` (accounts bölümü)

#### **Özellikler:**
- ✅ Hesapları tablo formatında listeleme
- ✅ Şifre/secret alanlarını gizli gösterme (••••••)
- ✅ Göz ikonu ile şifreleri gösterme/gizleme
- ✅ Hesap ekleme modal'ı
- ✅ Hesap düzenleme modal'ı
- ✅ Hesap silme onay modal'ı
- ✅ Boş durum (empty state) gösterimi
- ✅ Yükleme animasyonları
- ✅ Responsive tasarım

### 5. **Çok Dilli Destek**
- **Türkçe:** `lang/tr.json`
- **İngilizce:** `lang/en.json`
- **Çevrilen Alanlar:**
  - Sayfa başlığı
  - Tablo başlıkları
  - Form etiketleri
  - Buton metinleri
  - Hata/başarı mesajları
  - Modal başlıkları

---

## 🔧 TEKNİK DEĞİŞİKLİKLER

### Database Güncellemeleri

#### `src/config/database.js`
- `steam_accounts` tablosu eklendi
- Index oluşturuldu: `idx_steam_accounts_user_id`
- Foreign key constraint: `user_id` → `users(id)` ON DELETE CASCADE

### Backend Dosyaları

#### `src/utils/encryption.js` (YENİ)
```javascript
- encrypt(text) // Metni şifreler
- decrypt(encryptedText) // Şifreyi çözer
- checkEncryptionKey() // Anahtar kontrolü
```

#### `src/controllers/accountsController.js` (YENİ)
```javascript
- getAccounts() // Hesapları getir ve şifrelerini çöz
- addAccount() // Yeni hesap ekle (şifrele)
- updateAccount() // Hesap güncelle (şifrele)
- deleteAccount() // Hesap sil
```

#### `src/routes/accountsRoutes.js` (YENİ)
- Express router yapılandırması
- Authentication middleware entegrasyonu
- CRUD endpoint'leri

#### `server.js`
- `accountsRoutes` import edildi
- `/api/accounts` route'u eklendi

### Frontend Dosyaları

#### `views/pages/accounts.html` (YENİ)
- Hesaplar tablosu
- Hesap ekleme/düzenleme modal'ı
- Silme onay modal'ı
- Boş durum gösterimi
- Çeviri placeholder'ları (`{{t:key}}`)

#### `public/js/pages/accounts.js` (YENİ)
```javascript
- loadAccounts() // API'den hesapları yükle
- renderAccounts() // Tabloyu render et
- openAddModal() // Ekleme modal'ını aç
- openEditModal() // Düzenleme modal'ını aç
- openDeleteModal() // Silme modal'ını aç
- handleFormSubmit() // Form gönderimi
- handleDelete() // Hesap silme
- setupPasswordToggles() // Şifre göster/gizle
```

#### `public/css/dashboard.css`
- `.accounts-table-container` - Tablo container
- `.accounts-table` - Tablo stilleri
- `.secret-cell` - Gizli alan stilleri
- `.btn-icon-small` - Küçük buton stilleri
- `.modal` - Modal stilleri
- `.empty-state` - Boş durum stilleri
- `.input-with-icon` - İkonlu input stilleri

### Çeviri Dosyaları

#### `lang/tr.json`
```json
{
  "accounts": {
    "title": "Steam Hesapları",
    "addAccount": "Hesap Ekle",
    "editAccount": "Hesap Düzenle",
    "noAccounts": "Henüz Steam hesabı eklenmemiş",
    "table": { ... },
    "form": { ... },
    "deleteConfirm": { ... }
  }
}
```

#### `lang/en.json`
```json
{
  "accounts": {
    "title": "Steam Accounts",
    "addAccount": "Add Account",
    "editAccount": "Edit Account",
    "noAccounts": "No Steam accounts added yet",
    "table": { ... },
    "form": { ... },
    "deleteConfirm": { ... }
  }
}
```

### Environment Variables

#### `.env` ve `.env.example`
```env
# Encryption Key for Steam Accounts
ENCRYPTION_KEY=822a72894a680d7503afe1979ee3c0822176f24e4b30ba21b8b1ac9288e80f18
```

**Not:** Production'da mutlaka değiştirilmeli!

---

## 🔐 GÜVENLİK ÖZELLİKLERİ

### 1. **Şifreleme**
- AES-256-CBC algoritması
- Her şifreleme için benzersiz IV
- Şifreleme anahtarı environment variable'da
- Database'de sadece şifrelenmiş veri

### 2. **Authentication**
- Tüm API endpoint'leri korumalı
- JWT token doğrulama
- Session kontrolü
- User ID bazlı yetkilendirme

### 3. **Veri İzolasyonu**
- Her kullanıcı sadece kendi hesaplarını görebilir
- Foreign key constraint ile veri bütünlüğü
- CASCADE delete ile ilişkili verilerin temizlenmesi

### 4. **Input Validation**
- Tüm alanlar zorunlu
- XSS koruması (escapeHtml)
- SQL injection koruması (prepared statements)

---

## 🎨 UI/UX ÖZELLİKLERİ

### 1. **Tablo Görünümü**
- Temiz ve modern tasarım
- Hover efektleri
- Responsive yapı
- Mobil uyumlu (horizontal scroll)

### 2. **Şifre Gizleme**
- Varsayılan olarak gizli (••••••)
- Göz ikonu ile göster/gizle
- Her alan için ayrı toggle
- Güvenli görüntüleme

### 3. **Modal'lar**
- Smooth animasyonlar
- Overlay ile arka plan karartma
- Backdrop blur efekti
- ESC tuşu ile kapatma
- Overlay tıklama ile kapatma

### 4. **Boş Durum**
- Açıklayıcı ikon
- Yönlendirici mesaj
- Hızlı erişim butonu
- Kullanıcı dostu tasarım

### 5. **Yükleme Durumları**
- Spinner animasyonları
- Buton disable durumları
- Loading indicator'ları
- Kullanıcı geri bildirimi

---

## 📊 DATABASE ŞEMASI

```sql
CREATE TABLE steam_accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    username TEXT NOT NULL,
    password TEXT NOT NULL,           -- Şifrelenmiş
    shared_secret TEXT NOT NULL,      -- Şifrelenmiş
    identity_secret TEXT NOT NULL,    -- Şifrelenmiş
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_steam_accounts_user_id ON steam_accounts(user_id);
```

---

## 🔄 API ENDPOINT'LERİ

### GET /api/accounts
**Açıklama:** Kullanıcının tüm Steam hesaplarını getirir  
**Authentication:** Gerekli  
**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "username": "user123",
      "password": "decrypted_password",
      "shared_secret": "decrypted_shared_secret",
      "identity_secret": "decrypted_identity_secret",
      "created_at": "2026-05-06 10:30:00"
    }
  ]
}
```

### POST /api/accounts
**Açıklama:** Yeni Steam hesabı ekler  
**Authentication:** Gerekli  
**Request Body:**
```json
{
  "username": "user123",
  "password": "password123",
  "shared_secret": "ABC123XYZ",
  "identity_secret": "DEF456UVW"
}
```
**Response:**
```json
{
  "success": true,
  "message": "Steam hesabı başarıyla eklendi.",
  "data": {
    "id": 1,
    "username": "user123"
  }
}
```

### PUT /api/accounts/:id
**Açıklama:** Steam hesabını günceller  
**Authentication:** Gerekli  
**Request Body:** (POST ile aynı)  
**Response:**
```json
{
  "success": true,
  "message": "Steam hesabı başarıyla güncellendi."
}
```

### DELETE /api/accounts/:id
**Açıklama:** Steam hesabını siler  
**Authentication:** Gerekli  
**Response:**
```json
{
  "success": true,
  "message": "Steam hesabı başarıyla silindi."
}
```

---

## 📱 RESPONSIVE TASARIM

### Desktop (>768px)
- Tam genişlik tablo
- Yan yana modal butonları
- Geniş modal penceresi

### Tablet (768px)
- Horizontal scroll tablo
- Yan yana modal butonları
- Orta genişlik modal

### Mobile (<768px)
- Horizontal scroll tablo
- Dikey modal butonları
- Tam genişlik modal
- Küçük padding'ler

---

## 🚀 KULLANIM

### Hesap Ekleme
1. "Hesap Ekle" butonuna tıkla
2. Formu doldur (tüm alanlar zorunlu)
3. "Kaydet" butonuna tıkla
4. Başarı mesajı görüntülenir

### Hesap Düzenleme
1. Hesap satırındaki kalem ikonuna tıkla
2. Formu güncelle
3. "Kaydet" butonuna tıkla
4. Başarı mesajı görüntülenir

### Hesap Silme
1. Hesap satırındaki çöp kutusu ikonuna tıkla
2. Onay modal'ında "Sil" butonuna tıkla
3. Başarı mesajı görüntülenir

### Şifre Görüntüleme
1. İlgili alandaki göz ikonuna tıkla
2. Şifre görünür hale gelir
3. Tekrar tıklayarak gizle

---

## 📊 İSTATİSTİKLER

- **Yeni dosya sayısı:** 5
- **Güncellenen dosya sayısı:** 7
- **Toplam kod satırı:** ~1200
- **API endpoint sayısı:** 4
- **Çeviri anahtarı sayısı:** ~25
- **CSS satırı:** ~400

---

## ✅ TEST KONTROL LİSTESİ

- [x] Database tablosu oluşturuldu
- [x] Şifreleme sistemi çalışıyor
- [x] API endpoint'leri çalışıyor
- [x] Authentication kontrolü yapılıyor
- [x] Hesap ekleme çalışıyor
- [x] Hesap düzenleme çalışıyor
- [x] Hesap silme çalışıyor
- [x] Şifre göster/gizle çalışıyor
- [x] Modal'lar açılıp kapanıyor
- [x] Boş durum gösteriliyor
- [x] Yükleme animasyonları çalışıyor
- [x] Responsive tasarım çalışıyor
- [x] Çeviriler doğru görüntüleniyor
- [x] Hata mesajları gösteriliyor
- [x] Başarı mesajları gösteriliyor

---

## 🐛 BİLİNEN SORUNLAR

Şu anda bilinen sorun yok.

---

## 🔮 GELECEK GELİŞTİRMELER

- [ ] Toplu hesap ekleme (CSV import)
- [ ] Hesap durumu takibi (aktif/pasif/hata)
- [ ] Son giriş zamanı gösterimi
- [ ] Hesap etiketleme sistemi
- [ ] Hesap notları ekleme
- [ ] Hesap arama ve filtreleme
- [ ] Hesap sıralama (tarih, isim, vb.)
- [ ] Hesap export (CSV/JSON)
- [ ] Hesap istatistikleri
- [ ] Hesap yedekleme

---

## 👥 KATKILAR

- Kiro AI Asistanı - Tam uygulama

---

**Değişiklik Kaydı V4 Sonu**
