# 🛡️ Sirius Steam Automation — Güvenlik Raporu

**Rapor Tarihi:** 2026-05-09  
**Hazırlayan:** Antigravity Security Analyzer  
**Proje Dizini:** `c:\Users\ggforces\Desktop\Sirius`  
**Proje Tipi:** Node.js / Express.js — Steam Otomasyon Servisi  
**Veritabanı:** SQLite (better-sqlite3)  
**Versiyon:** 1.0.0

---

## 📋 Yönetici Özeti

Proje genel olarak orta-iyi seviyede bir güvenlik yapısına sahiptir. Helmet, bcrypt, JWT, rate limiting, AES-256-CBC şifreleme ve session tabanlı doğrulama doğru biçimde kullanılmaktadır. Ancak **kritik düzeyde** 2, **yüksek düzeyde** 5, **orta düzeyde** 7 ve **düşük düzeyde** 5 güvenlik bulgusu tespit edilmiştir.

> [!NOTE]
> GitHub deposu **tamamen private (gizli)** olduğundan `.env` dosyasının gitignore'da bulunmaması bu rapor kapsamında geçerli bir risk sayılmamaktadır.

| Önem Derecesi | Adet |
|---|---|
| 🔴 Kritik | 2 |
| 🟠 Yüksek | 5 |
| 🟡 Orta | 7 |
| 🟢 Düşük | 5 |
| **Toplam** | **19** |

---

## 🔴 KRİTİK BULGULAR

---

### [K-1] Debug Endpoint `GET /api/auth/debug/users` Production'da da Ulaşılabilir

**Dosya:** `src/routes/authRoutes.js` — Satır 12  
**Dosya:** `src/controllers/authController.js` — Satır 226

```javascript
// authRoutes.js
router.get('/debug/users', authController.debugListUsers);
```

```javascript
// authController.js
const debugListUsers = (req, res) => {
    if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({ ... });
    }
    // ...tüm kullanıcıları listele
};
```

**Problem:**  
Bu endpoint **herhangi bir auth middleware'siz** tanımlanmıştır. NODE_ENV kontrolü uygulanmış olsa da:
1. NODE_ENV yanlışlıkla `development` kalırsa (mevcut `.env` dosyasında da `development` olarak ayarlı!) tüm kullanıcı e-posta listesi herkese açık hale gelir.
2. Route tamamen kaldırılmalı veya en azından `authenticateToken` + admin kontrolü uygulanmalıdır.

**Mevcut .env:**
```
NODE_ENV=development   # ← Üretim ortamında dahi bu değer kalabilir!
```

**Düzeltme:**
```javascript
// Route'u tamamen kaldırın ya da:
router.get('/debug/users', authenticateToken, requireAdminApi, authController.debugListUsers);
```

---

### [K-2] Token Login Yanıtında Plaintext Olarak Döndürülüyor

**Dosya:** `src/controllers/authController.js` — Satır 55-65, 149-159

```javascript
// register() ve login() — Her ikisinde de:
res.status(201).json({
    success: true,
    data: {
        user: { id: userId, email, balance: 0.00 },
        token   // ← JWT token plaintext olarak response body'de!
    }
});
```

**Problem:**  
JWT token hem `httpOnly` cookie olarak hem de JSON response body'sinde döndürülmektedir. Cookie'nin httpOnly olmasının temel amacı token'ı JavaScript'ten gizlemektir. Ancak token'ı aynı anda response body'de göndermek, herhangi bir XSS açığı bulunması halinde token'ın çalınmasına olanak tanır.

**Düzeltme:**
```javascript
// Token'ı response body'den kaldırın:
res.json({
    success: true,
    message: 'Giriş başarılı!',
    data: {
        user: { id: user.id, email: user.email, balance: user.balance }
        // token buraya eklenmemeli
    }
});
```

---

## 🟠 YÜKSEK SEVİYE BULGULAR

---

### [Y-1] `GET /api/debug/db` Endpoint'i Tüm DB Yapısını İfşa Ediyor

**Dosya:** `server.js` — Satır 230–278

```javascript
app.get('/api/debug/db', (req, res) => {
    if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({ ... });
    }
    // users, accounts, sessions, proxies, tasks listesi döner
});
```

**Problem:**  
- Auth middleware yoktur; **anonim istek gönderen herkes** bu endpoint'e erişebilir.
- NODE_ENV `development` iken session token'larını, kullanıcı e-postalarını, proxy host/port bilgilerini açığa çıkarır.

**Düzeltme:** Endpoint'i tamamen kaldırın veya `authenticateToken + requireAdminApi` ekleyin.

---

### [Y-2] Proxy Şifresi Katmanları Arasında Tutarsızlık

**Dosya:** `src/services/proxyService.js` — Satır 80–86

```javascript
function addProxy(userId, { username, password, ip, port }) {
    const result = db.prepare(`
        INSERT INTO proxies (user_id, username, password, ip, port)
        VALUES (?, ?, ?, ?, ?)
    `).run(userId, username, password, ip, port);
}
```

**Problem:**  
`proxiesController.js` içindeki `addProxy` fonksiyonu şifreyi şifreli olarak gönderiyor, **ancak** Webshare sync (`syncWebshareProxies`) akışında şifre `encrypt()` uygulandıktan sonra `proxyService.addProxy()` aracılığıyla zaten şifreli string aktarılmaktadır. Bununla birlikte, `proxyService.addProxy()` içindeki `password` parametresi **şifresiz string kabul edecek şekilde tasarlanmıştır** — bu tip uyumsuzluk ilerleyen sürümlerde double-encrypt veya plaintext kayıt riskine yol açar.

**Düzeltme:** `proxyService.addProxy()` içinde şifreleme yapılmalı, controller katmanında şifreleme kaldırılmalıdır — ya da fonksiyon imzası açıkça belgelenmeli.

---

### [Y-3] `authController.login()` İçinde Aşırı Detaylı Console.log'lar

**Dosya:** `src/controllers/authController.js` — Satır 82–109

```javascript
console.log('🔐 Login attempt:', { email, hasPassword: !!password, rememberMe });
console.log('👤 User lookup result:', user ? { id: user.id, email: user.email } : 'User not found');
console.log('❌ Login failed: User not found for email:', email);
console.log('🔑 Password verification result:', isValidPassword);
```

**Problem:**  
- Bu log'lar sunucu konsoluna ve potansiyel olarak log dosyalarına yazılır.
- Başarısız girişler için hangi e-postanın sistemde **mevcut olup olmadığı** log'a düşüyor. Bu bilgi bir saldırgan log erişimi kazanırsa kullanıcı enumeration'a yol açar.
- Üretim ortamında debug log'ları kaldırılmalıdır.

**Düzeltme:** `console.log` çağrılarını `logger.debug()` ile değiştirin, üretimde debug log seviyesini kapatın.

---

### [Y-4] Rate Limiter Kimlik Doğrulamasına Göre Belirlenmiş Ama Kolayca Atlatılabilir

**Dosya:** `server.js` — Satır 112–125

```javascript
const dynamicLimiter = (req, res, next) => {
    const token = req.cookies.token || 
                 (req.headers.authorization && req.headers.authorization.split(' ')[1]);
    if (token) {
        authenticatedLimiter(req, res, next);  // 1000 req/15dk
    } else {
        anonymousLimiter(req, res, next);       // 100 req/15dk
    }
};
```

**Problem:**  
Token **doğrulanmadan** sadece varlığına bakılarak authenticated limiter devreye giriyor. Saldırgan rastgele bir token değeri göndererek (geçersiz bile olsa) 1000 istek limitine geçebilir. Bu, rate limiting'in bypass edilmesidir.

**Düzeltme:**
```javascript
const dynamicLimiter = (req, res, next) => {
    const token = req.cookies.token || ...;
    if (token) {
        try {
            jwt.verify(token, process.env.JWT_SECRET);
            authenticatedLimiter(req, res, next);
        } catch {
            anonymousLimiter(req, res, next);
        }
    } else {
        anonymousLimiter(req, res, next);
    }
};
```

---

### [Y-5] Şifre Değiştiğinde Aktif Oturumlar İptal Edilmiyor

**Dosya:** `src/controllers/authController.js` — Satır 118–127

```javascript
const expiresIn = rememberMe ? '30d' : process.env.JWT_EXPIRES_IN;
```

**Problem:**  
Login sırasında eski tüm oturumlar silinmekte (`DELETE FROM sessions WHERE user_id = ?`) ve yeni bir oturum oluşturulmaktadır. Ancak kullanıcı **şifresini değiştirdiğinde** aktif oturumlar iptal edilmiyor.

```javascript
// authController.js changePassword() — satır 277+
// Şifre başarıyla değiştirildi... ama diğer cihazlardaki oturumlar silinmiyor!
db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashedPassword, userId);
// sessions tablosuna dokunulmuyor!
```

**Düzeltme:**
```javascript
// changePassword() sonuna ekleyin:
db.prepare('DELETE FROM sessions WHERE user_id = ?').run(userId);
res.clearCookie('token');
```

---

## 🟡 ORTA SEVİYE BULGULAR

---

### [O-1] CSP'de `'unsafe-inline'` Kullanımı

**Dosya:** `server.js` — Satır 56–61

```javascript
styleSrc: ["'self'", "'unsafe-inline'", ...],
scriptSrc: ["'self'", "'unsafe-inline'", ...],
```

**Problem:**  
`'unsafe-inline'` direktifi, inline `<script>` ve `<style>` bloklarına izin vererek XSS saldırılarına karşı CSP korumasını büyük ölçüde zayıflatır.

**Düzeltme:** Nonce tabanlı CSP veya hash tabanlı yaklaşım kullanın:
```javascript
scriptSrc: ["'self'", `'nonce-${nonce}'`],
```

---

### [O-2] IP Validation Regex'i Yanlış IP Adreslerine İzin Veriyor

**Dosya:** `src/controllers/proxiesController.js` — Satır 60–66

```javascript
const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
if (!ipRegex.test(ip)) { ... }
```

**Problem:**  
Bu regex `999.999.999.999` gibi geçersiz IP adreslerini kabul eder. Her oktet 0–255 arasında olmalıdır.

**Düzeltme:**
```javascript
function isValidIP(ip) {
    const parts = ip.split('.');
    if (parts.length !== 4) return false;
    return parts.every(p => {
        const n = parseInt(p, 10);
        return !isNaN(n) && n >= 0 && n <= 255 && String(n) === p;
    });
}
```

---

### [O-3] `adminController.getSystemLogs()` — limit Parametresi Sanitize Edilmiyor

**Dosya:** `src/controllers/adminController.js` — Satır 394

```javascript
const { level = 'all', limit = 100 } = req.query;
// ...
logs = logs.slice(-parseInt(limit));  // limit doğrulanmıyor
```

**Problem:**  
`limit` parametresine çok büyük bir sayı (`limit=999999999`) girilirse sunucuya aşırı yük bindirilebilir (büyük log dosyaları okunup hafızaya alınır).

**Düzeltme:**
```javascript
const rawLimit = parseInt(limit);
const safeLimit = (!isNaN(rawLimit) && rawLimit > 0 && rawLimit <= 1000) ? rawLimit : 100;
```

---

### [O-4] `adminController.updateUser()` — Dinamik SQL Sorgusu (Gözlemlenecek)

**Dosya:** `src/controllers/adminController.js` — Satır 163–193

```javascript
const updates = [];
const params = [];

if (role !== undefined) {
    updates.push('role = ?');
    params.push(role);
}
// ...
db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...params);
```

**Durum:** Parametre binding (`?`) kullanıldığından **bu yapı SQLi'ye karşı korumalıdır.** Ancak `updates` dizisinin içeriği tamamen uygulama mantığı tarafından kontrol edilmektedir. Gelecekte bu yapıya kullanıcı kontrolündeki input eklenirse risk oluşur. Yapı iyi ama gözlemlenmelidir.

---

### [O-5] `suspiciousIPs` Map'i Bellekte Tutuluyor — Memory Leak Riski

**Dosya:** `src/middleware/adminRateLimit.js` — Satır 54

```javascript
const suspiciousIPs = new Map();
```

**Problem:**  
Map bellekte process ömrü boyunca yaşar. Temizleme (satır 61–65) sadece yeni istek geldiğinde çalışır. Çok sayıda farklı IP saldırısında map sonsuza kadar büyüyebilir. Aynı sorun `taskExecutor.js` içindeki `executingTasks Set` için de geçerlidir.

**Düzeltme:** Periyodik temizleme için `setInterval` kullanın.

---

### [O-6] `encryption.js` — AES-256-CBC Kullanımı (GCM Önerilir)

**Dosya:** `src/utils/encryption.js` — Satır 6

```javascript
const ALGORITHM = 'aes-256-cbc';
```

**Problem:**  
AES-CBC modu authentication (kimlik doğrulama) içermez; yani şifreli verinin bütünlüğü doğrulanamaz. Padding oracle saldırılarına karşı daha savunmasızdır. Modern standart AES-256-GCM'dir (authenticated encryption).

**Düzeltme:**
```javascript
const ALGORITHM = 'aes-256-gcm';
// GCM: IV + authTag + ciphertext formatı
```

---

### [O-7] FarmLabs Controller — Hata Mesajları Servis İçi Detay Sızdırıyor

**Dosya:** `src/controllers/farmlabsController.js` — Satır 216–220

```javascript
} catch (error) {
    res.status(500).json({
        success: false,
        message: error.message  // ← İç hata mesajı doğrudan kullanıcıya iletiliyor
    });
}
```

**Problem:**  
`error.message` içinde FarmLabs API hata detayları, iç servis URL'leri veya stack trace bilgisi bulunabilir ve bunlar kullanıcıya doğrudan iletilir. Bu pattern `syncDrops`, `getStats`, `getBotGroups`, `getBots` fonksiyonlarının hepsinde mevcuttur.

**Düzeltme:**
```javascript
catch (error) {
    logger.error('Sync drops error', { error: error.message, userId });
    res.status(500).json({ success: false, message: 'İşlem sırasında hata oluştu.' });
}
```

---

## 🟢 DÜŞÜK SEVİYE BULGULAR

---

### [D-1] `create-admin.js` Script'i Proje Kökünde Bırakılmış

**Dosya:** `create-admin.js` (4.7 KB)

Admin kullanıcı oluşturan bu script proje kök dizininde bulunmaktadır. `.gitignore`'da listelenmiş olsa da yerel ortamda varlığı ve içeriği (muhtemelen default şifre içeriyordur) risk oluşturur.

---

### [D-2] `check-db.js` Script'i Proje Kökünde

**Dosya:** `check-db.js`

Veritabanı bağlantısını test eden bu script de kök dizinde bulunmaktadır. Yetkisiz erişimde DB yapısı hakkında bilgi verebilir.

---

### [D-3] `deploy.bat` Hassas Bilgi İçerebilir

**Dosya:** `deploy.bat`

Deploy scriptleri sunucu adresi veya kimlik bilgisi içerebilir. Repo private olsa da bu dosyanın içeriği kontrol edilmeli; varsa hassas değerler `.env` üzerinden okunmalıdır.

---

### [D-4] Cookie `sameSite: 'lax'` — Dil Cookie'si için

**Dosya:** `server.js` — Satır 297

```javascript
res.cookie('lang', lang, {
    sameSite: 'lax'   // Auth cookie 'strict', dil cookie 'lax'
});
```

Dil cookie'si için `lax` makul olmakla birlikte tutarsızlık dikkat gerektirir.

---

### [D-5] Veritabanı Dosyası Yolu Göreceli

**Dosya:** `src/config/database.js` — Satır 14  
**Dosya:** `.env` — Satır 13

```
DB_PATH=./data/database.sqlite
```

Göreceli yol kullanımı process başlangıç dizinine bağımlıdır. Docker veya farklı çalışma dizininde sorun yaratabilir.

---

## ✅ İYİ UYGULANAN GÜVENLİK ÖNLEMLERİ

| Özellik | Durum |
|---|---|
| Helmet.js HTTP güvenlik başlıkları | ✅ Aktif |
| bcrypt ile şifre hashleme (cost factor 12) | ✅ İyi |
| JWT + Session çift doğrulama | ✅ Güçlü |
| AES-256-CBC ile Steam hesap şifreleme | ✅ Uygulanmış |
| Express-validator ile input validasyonu | ✅ Auth route'larında |
| CORS konfigürasyonu | ✅ Origin kısıtlı |
| Rate limiting (çok katmanlı) | ✅ Kapsamlı |
| Admin panel 404 obfuscation | ✅ İyi yaklaşım |
| Sentry'de hassas alan filtreleme | ✅ Uygulanmış |
| Foreign key + CASCADE silme | ✅ Veritabanı |
| httpOnly + Secure cookie | ✅ Doğru |
| Session temizleme (expired) | ✅ Periyodik |
| Admin erişim loglama | ✅ Kapsamlı |
| SQLite WAL mode | ✅ Aktif |

---

## 🎯 Öncelikli Düzeltme Sırası

| Öncelik | Bulgu | İşlem |
|---|---|---|
| 1️⃣ | [K-1] Debug endpoint auth yok | Route'u kaldır veya korumaya al |
| 2️⃣ | [K-2] Token response body'de | Body'den token kaldır |
| 3️⃣ | [Y-1] `/api/debug/db` auth yok | Endpoint'i kaldır |
| 4️⃣ | [Y-5] Şifre değişiminde oturum iptal edilmiyor | `changePassword()` içine DELETE sessions ekle |
| 5️⃣ | [Y-4] Rate limiter bypass | Token doğrulama ekle |
| 6️⃣ | [O-6] AES-CBC → AES-GCM | Encryption algoritmasını güncelle |
| 7️⃣ | [O-1] CSP unsafe-inline | Nonce tabanlı CSP'ye geç |
| 8️⃣ | [Y-3] Login console.log'ları | Logger.debug'a taşı, prod'da kapat |
| 9️⃣ | [O-2] IP regex hatası | Geçerli IP range kontrolü |
| 🔟 | [O-3] Log limit sanitizasyonu | Max limit sınırı ekle |

---

## 📊 Genel Risk Değerlendirmesi

```
Güvenlik Skoru: 71 / 100

Kategori Skorları:
├── Kimlik Doğrulama:     75/100  (Token body leak, oturum iptal eksikliği)
├── Yetkilendirme:        80/100  (Admin middleware sağlam, debug route sorunu)
├── Veri Şifreleme:       70/100  (AES-CBC kullanımı, GCM önerilir)
├── Input Validasyonu:    65/100  (Auth iyi, diğer endpointler zayıf)
├── Loglama & Monitoring: 60/100  (Hassas debug loglar, token body log riski)
├── Rate Limiting:        80/100  (Kapsamlı ama bypass edilebilir)
├── Secret Yönetimi:      75/100  (Private repo, güçlü secret'lar kullanılmış)
└── Hata Yönetimi:        65/100  (İç hata mesajları sızıyor)
```

---

*Rapor otomatik kaynak kodu analizi ile hazırlanmıştır. Manuel penetrasyon testi ve dinamik analiz ek bulgular ortaya çıkarabilir.*
