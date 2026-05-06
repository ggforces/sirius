# GÜVENLİK TARAMASI RAPORU
## Sirius Steam Automation Projesi

**Tarih:** 2026-05-06  
**Tarama Kapsamı:** Tüm backend ve frontend dosyaları  
**Durum:** ✅ Detaylı analiz tamamlandı

---

## 📋 ÖZET

**Toplam Bulgu:** 8  
- 🔴 **Kritik:** 2  
- 🟡 **Orta:** 4  
- 🟢 **Düşük:** 2  

---

## 🔴 KRİTİK GÜVENLİK AÇIKLARI

### 1. **FarmLabs API Key Düz Metin Olarak Saklanıyor**

**Dosya:** `src/controllers/farmlabsController.js`, `src/config/database.js`  
**Satır:** 36-44 (farmlabsController.js)

**Açıklama:**  
FarmLabs API key'leri database'de düz metin (plaintext) olarak saklanıyor. Steam hesap şifreleri AES-256 ile şifrelenirken, FarmLabs API key'leri şifrelenmeden saklanıyor.

**Kod:**
```javascript
// farmlabsController.js - saveApiKey fonksiyonu
db.prepare(`
    INSERT INTO farmlabs_settings (user_id, api_key, updated_at)
    VALUES (?, ?, datetime('now'))
    ON CONFLICT(user_id) 
    DO UPDATE SET 
        api_key = excluded.api_key,  // ❌ Düz metin olarak kaydediliyor
        updated_at = datetime('now')
`).run(userId, apiKey);
```

**Risk:**  
- Database'e erişim sağlayan herkes API key'leri görebilir
- Database backup'ları güvensiz hale gelir
- SQL injection durumunda API key'ler açığa çıkar

**Çözüm:**  
```javascript
const { encrypt } = require('../utils/encryption');

// API key'i şifrele
const encryptedApiKey = encrypt(apiKey);

db.prepare(`
    INSERT INTO farmlabs_settings (user_id, api_key, updated_at)
    VALUES (?, ?, datetime('now'))
    ON CONFLICT(user_id) 
    DO UPDATE SET 
        api_key = excluded.api_key,
        updated_at = datetime('now')
`).run(userId, encryptedApiKey);
```

**Öncelik:** 🔴 YÜKSEK - Hemen düzeltilmeli

---

### 2. **JWT Secret Production'da Zayıf**

**Dosya:** `.env`  
**Satır:** 6

**Açıklama:**  
JWT secret key production ortamında değiştirilmesi gerektiği belirtilmiş ancak varsayılan değer çok tahmin edilebilir.

**Kod:**
```env
JWT_SECRET=sirius-steam-automation-secret-key-2026-change-in-production
```

**Risk:**  
- Tahmin edilebilir secret ile JWT token'lar forge edilebilir
- Kullanıcı hesapları ele geçirilebilir
- Session hijacking riski

**Çözüm:**  
```javascript
// Güvenli random secret oluşturma
const crypto = require('crypto');
const jwtSecret = crypto.randomBytes(64).toString('hex');
console.log('JWT_SECRET=' + jwtSecret);
```

Production için:
```env
JWT_SECRET=a8f5f167f44f4964e6c998dee827110c03e0245d4b5f5f5f5f5f5f5f5f5f5f5f5f5f5f5f5f5f5f5f5f5f5f5f5f5f5f5f5f5f5f5f5f5f5f
```

**Öncelik:** 🔴 YÜKSEK - Production'a geçmeden önce mutlaka değiştirilmeli

---

## 🟡 ORTA SEVİYE GÜVENLİK AÇIKLARI

### 3. **CORS Ayarları Gevşek**

**Dosya:** `server.js`  
**Satır:** 38-43

**Açıklama:**  
CORS ayarları development ortamında localhost'a izin veriyor ancak production domain'i hardcoded.

**Kod:**
```javascript
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? 'your-production-domain.com'  // ❌ Placeholder değer
        : 'http://localhost:5050',
    credentials: true
}));
```

**Risk:**  
- Production'da yanlış domain kullanılabilir
- CSRF saldırılarına açık olabilir

**Çözüm:**  
```javascript
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5050',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
```

`.env` dosyasına ekle:
```env
CORS_ORIGIN=https://yourdomain.com
```

**Öncelik:** 🟡 ORTA - Production'a geçmeden önce düzeltilmeli

---

### 4. **Rate Limiting Çok Yüksek**

**Dosya:** `server.js`  
**Satır:** 46-54

**Açıklama:**  
API rate limiting 15 dakikada 300 istek, bu çok yüksek bir değer.

**Kod:**
```javascript
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 300,  // ❌ Çok yüksek
    // ...
});
```

**Risk:**  
- DDoS saldırılarına karşı yetersiz koruma
- Brute force saldırıları için çok fazla deneme hakkı

**Çözüm:**  
```javascript
// Genel API için
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 dakika
    max: 100, // 100 istek (300'den düşürüldü)
    message: { 
        success: false, 
        message: 'Çok fazla istek gönderildi. Lütfen daha sonra tekrar deneyin.' 
    }
});

// Auth için daha sıkı
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5, // ✅ Bu iyi
    skipSuccessfulRequests: true // Başarılı istekleri sayma
});
```

**Öncelik:** 🟡 ORTA - Production'da düşürülmeli

---

### 5. **Session Temizleme Sadece Interval'de**

**Dosya:** `src/controllers/authController.js`  
**Satır:** 165-176

**Açıklama:**  
Expired session'lar sadece saatte bir temizleniyor. Login/logout sırasında temizlenmiyor.

**Kod:**
```javascript
// Run cleanup every hour
setInterval(cleanExpiredSessions, 60 * 60 * 1000);
```

**Risk:**  
- Database'de gereksiz session kayıtları birikir
- Memory leak riski
- Performance düşüşü

**Çözüm:**  
```javascript
// Login sırasında temizle
const login = async (req, res) => {
    try {
        // ... mevcut kod ...
        
        // Expired session'ları temizle
        cleanExpiredSessions();
        
        // ... devam ...
    }
};

// Logout sırasında da temizle
const logout = (req, res) => {
    try {
        // ... mevcut kod ...
        
        // Expired session'ları temizle
        cleanExpiredSessions();
        
        // ... devam ...
    }
};
```

**Öncelik:** 🟡 ORTA - Performance için önerilir

---

### 6. **Input Validation Eksik**

**Dosya:** `src/controllers/accountsController.js`  
**Satır:** 48-54

**Açıklama:**  
Steam hesap bilgileri için sadece boş kontrol var, format validasyonu yok.

**Kod:**
```javascript
// Validasyon
if (!username || !password || !shared_secret || !identity_secret) {
    return res.status(400).json({
        success: false,
        message: 'Tüm alanlar zorunludur.'
    });
}
// ❌ Format kontrolü yok
```

**Risk:**  
- Geçersiz veri database'e kaydedilebilir
- XSS saldırıları için potansiyel
- Database bozulması

**Çözüm:**  
```javascript
// Validation helper
function validateSteamAccount(data) {
    const { username, password, shared_secret, identity_secret } = data;
    
    // Boş kontrol
    if (!username || !password || !shared_secret || !identity_secret) {
        return { valid: false, message: 'Tüm alanlar zorunludur.' };
    }
    
    // Username format (3-32 karakter, alfanumerik)
    if (!/^[a-zA-Z0-9_]{3,32}$/.test(username)) {
        return { valid: false, message: 'Geçersiz kullanıcı adı formatı.' };
    }
    
    // Shared secret format (base64, 28 karakter)
    if (!/^[A-Za-z0-9+/]{28}$/.test(shared_secret)) {
        return { valid: false, message: 'Geçersiz shared secret formatı.' };
    }
    
    // Identity secret format (base64, 28 karakter)
    if (!/^[A-Za-z0-9+/]{28}$/.test(identity_secret)) {
        return { valid: false, message: 'Geçersiz identity secret formatı.' };
    }
    
    return { valid: true };
}

// Kullanım
const validation = validateSteamAccount({ username, password, shared_secret, identity_secret });
if (!validation.valid) {
    return res.status(400).json({
        success: false,
        message: validation.message
    });
}
```

**Öncelik:** 🟡 ORTA - Veri bütünlüğü için önerilir

---

## 🟢 DÜŞÜK SEVİYE GÜVENLİK AÇIKLARI

### 7. **Error Messages Çok Detaylı (Development)**

**Dosya:** `server.js`  
**Satır:** 145-152

**Açıklama:**  
Development modunda hata mesajları çok detaylı, production'da gizleniyor ama daha iyi olabilir.

**Kod:**
```javascript
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        success: false,
        message: process.env.NODE_ENV === 'production' 
            ? 'Sunucu hatası.'  // ✅ İyi
            : err.message       // ⚠️ Development'da detaylı
    });
});
```

**Risk:**  
- Development ortamında hassas bilgi sızıntısı
- Stack trace'ler saldırganlar için bilgi kaynağı

**Çözüm:**  
```javascript
app.use((err, req, res, next) => {
    // Log hatayı (sadece server-side)
    console.error('Error:', {
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
        url: req.url,
        method: req.method
    });
    
    // Client'a minimal bilgi gönder
    res.status(err.status || 500).json({
        success: false,
        message: process.env.NODE_ENV === 'production' 
            ? 'Sunucu hatası.' 
            : 'Bir hata oluştu.',  // Daha az detay
        ...(process.env.NODE_ENV === 'development' && { error: err.message })
    });
});
```

**Öncelik:** 🟢 DÜŞÜK - İyileştirme önerisi

---

### 8. **Cookie Secure Flag Sadece Production'da**

**Dosya:** `src/controllers/authController.js`  
**Satır:** 35-40, 103-108

**Açıklama:**  
Cookie'lerin `secure` flag'i sadece production'da aktif.

**Kod:**
```javascript
res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',  // ⚠️ Development'da false
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000
});
```

**Risk:**  
- Development ortamında HTTP üzerinden cookie gönderilebilir
- Man-in-the-middle saldırıları (sadece development)

**Çözüm:**  
Development ortamında HTTPS kullan veya en azından uyarı ekle:

```javascript
const isProduction = process.env.NODE_ENV === 'production';

if (!isProduction) {
    console.warn('⚠️  WARNING: Cookies are not secure in development mode!');
}

res.cookie('token', token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000
});
```

**Öncelik:** 🟢 DÜŞÜK - Development ortamı için kabul edilebilir

---

## ✅ İYİ GÜVENLİK UYGULAMALARI

Projede tespit edilen **güvenli** uygulamalar:

### 1. **Şifreleme Sistemi (Steam Accounts)**
- ✅ AES-256-CBC algoritması kullanılıyor
- ✅ Her şifreleme için random IV
- ✅ Şifreleme anahtarı environment variable'da
- ✅ Database'de sadece şifrelenmiş veri

### 2. **Password Hashing**
- ✅ bcrypt kullanılıyor (12 rounds)
- ✅ Salt otomatik ekleniyor
- ✅ Timing attack'lere karşı korumalı

### 3. **Authentication**
- ✅ JWT token kullanılıyor
- ✅ Session database'de saklanıyor
- ✅ Token expiration kontrolü
- ✅ httpOnly cookie kullanılıyor
- ✅ sameSite: 'strict' flag'i

### 4. **SQL Injection Koruması**
- ✅ Prepared statements kullanılıyor
- ✅ Parameterized queries
- ✅ better-sqlite3 library güvenli

### 5. **Rate Limiting**
- ✅ Express-rate-limit kullanılıyor
- ✅ Auth endpoint'leri için daha sıkı limit (5/15dk)
- ✅ API endpoint'leri için genel limit

### 6. **Security Headers**
- ✅ Helmet middleware kullanılıyor
- ✅ CSP (Content Security Policy) tanımlı
- ✅ XSS koruması aktif

### 7. **Authorization**
- ✅ Her endpoint'te user ID kontrolü
- ✅ Kullanıcılar sadece kendi verilerine erişebilir
- ✅ Foreign key constraints

### 8. **Session Management**
- ✅ Session expiration kontrolü
- ✅ Logout'ta session siliniyor
- ✅ Otomatik session temizleme

---

## 🔧 ÖNCELİKLİ DÜZELTMELER

### Hemen Yapılması Gerekenler (1-2 gün):

1. **FarmLabs API Key Şifreleme** 🔴
   - `farmlabsController.js` dosyasını güncelle
   - Encryption/decryption ekle
   - Mevcut API key'leri migrate et

2. **JWT Secret Değiştirme** 🔴
   - Production için güçlü secret oluştur
   - `.env.example` dosyasını güncelle
   - Deployment dokümantasyonuna ekle

### Kısa Vadede Yapılması Gerekenler (1 hafta):

3. **CORS Ayarları** 🟡
   - Environment variable ekle
   - Production domain'i yapılandır

4. **Rate Limiting Düşürme** 🟡
   - API limit'i 300'den 100'e düşür
   - Test et

5. **Input Validation** 🟡
   - Steam account validation ekle
   - Email format kontrolü güçlendir

### Uzun Vadede Yapılması Gerekenler (1 ay):

6. **Session Temizleme İyileştirme** 🟡
7. **Error Handling İyileştirme** 🟢
8. **Development HTTPS** 🟢

---

## 📊 GÜVENLİK SKORU

**Genel Güvenlik Skoru:** 7.5/10

**Kategori Skorları:**
- Authentication & Authorization: 9/10 ✅
- Data Encryption: 7/10 ⚠️ (FarmLabs API key sorunu)
- Input Validation: 6/10 ⚠️
- Rate Limiting: 7/10 ⚠️
- Error Handling: 8/10 ✅
- Security Headers: 9/10 ✅
- Session Management: 8/10 ✅

---

## 📝 SONUÇ

Proje genel olarak **iyi güvenlik uygulamalarına** sahip. Kritik güvenlik açıkları tespit edildi ancak bunlar **kolayca düzeltilebilir**. 

**En önemli sorun:** FarmLabs API key'lerinin düz metin olarak saklanması. Bu, Steam hesap şifrelerinin şifrelendiği bir sistemde tutarsızlık oluşturuyor.

**Öneri:** Kritik düzeltmeleri (1-2) hemen yapın, orta seviye düzeltmeleri (3-6) production'a geçmeden önce tamamlayın.

---

**Rapor Tarihi:** 2026-05-06  
**Hazırlayan:** Kiro AI Security Audit  
**Versiyon:** 1.0
