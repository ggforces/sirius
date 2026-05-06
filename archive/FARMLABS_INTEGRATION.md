# 🌟 FarmLabs API Entegrasyonu

## 📋 Genel Bakış

Sirius artık FarmLabs API ile entegre! Kullanıcılar FarmLabs hesaplarından drop verilerini otomatik olarak senkronize edebilir ve kazanç grafiklerini görebilir.

---

## ✨ Özellikler

### 1. **API Key Yönetimi**
- FarmLabs API key kaydetme
- API key test etme
- Güvenli saklama (veritabanında)

### 2. **Drop Senkronizasyonu**
- Son 90 günlük drop'ları otomatik çekme
- Günlük kazançlara dönüştürme
- Veritabanına kaydetme (UPSERT)

### 3. **Haftalık Kazanç Hesaplama**
- **Çarşamba bazlı hafta başlangıcı** (Steam drop reset günü)
- Son 8 haftalık grafik
- Bu hafta, bu ay, toplam istatistikler

### 4. **Gerçek Zamanlı Güncelleme**
- "Son güncelleme" zamanı gerçek veri zamanını gösterir
- Manuel senkronizasyon butonu
- Otomatik grafik yenileme

---

## 🚀 Kullanım

### Adım 1: FarmLabs API Key Alma

1. [FarmLabs Dashboard](https://dashboard.farmlabs.dev/settings/api) adresine gidin
2. "Create API Key" butonuna tıklayın
3. API key'i kopyalayın (örn: `flabs_xxxxxxxxxxxxxxxxxxxxxxxx`)

### Adım 2: API Key'i Sirius'a Ekleme

1. Sirius Dashboard'da **Ayarlar** sayfasına gidin
2. "FarmLabs Entegrasyonu" bölümünü bulun
3. API key'inizi yapıştırın
4. **"Test Et"** butonuna basarak key'in geçerliliğini kontrol edin
5. **"Kaydet"** butonuna basın

### Adım 3: Drop'ları Senkronize Etme

1. Ayarlar sayfasında **"Drop'ları Senkronize Et"** butonuna basın
2. Sistem son 90 günlük drop'larınızı çekecek
3. Veriler günlük kazançlara dönüştürülecek
4. Dashboard'daki grafik otomatik güncellenecek

---

## 📊 Haftalık Kazanç Sistemi

### Çarşamba Bazlı Hafta

Steam'in haftalık drop sistemi **her çarşamba** resetlenir. Bu yüzden kazanç hesaplamaları da çarşamba bazlıdır.

**Örnek:**
- Bugün: 6 Mayıs 2026 (Çarşamba)
- Bu haftanın başlangıcı: 6 Mayıs 2026 (Çarşamba)
- Geçen haftanın başlangıcı: 29 Nisan 2026 (Çarşamba)

### Hesaplama Mantığı

```javascript
function getWednesdayWeekStart(date) {
    const d = new Date(date);
    const daysToWednesday = (d.getDay() + 4) % 7;
    const ws = new Date(d);
    ws.setDate(d.getDate() - daysToWednesday);
    ws.setHours(0, 0, 0, 0);
    return ws;
}
```

**Açıklama:**
- Pazar = 0, Pazartesi = 1, ..., Çarşamba = 3
- `(d.getDay() + 4) % 7` formülü ile çarşambaya olan gün farkını buluyoruz
- Örnek: Cuma (5) → (5 + 4) % 7 = 2 gün geriye git → Çarşamba

---

## 🗄️ Veritabanı Yapısı

### `farmlabs_settings` Tablosu

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

### `earnings` Tablosu (Mevcut)

```sql
CREATE TABLE earnings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    date DATE NOT NULL,
    amount REAL DEFAULT 0.00,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, date)
)
```

---

## 🔌 API Endpoints

### **POST** `/api/farmlabs/api-key/test`
API key'i test eder.

**Request:**
```json
{
  "apiKey": "flabs_xxxxxxxxxxxxxxxxxxxxxxxx"
}
```

**Response:**
```json
{
  "success": true,
  "message": "API key geçerli",
  "data": {
    "valid": true,
    "status": 200
  }
}
```

---

### **POST** `/api/farmlabs/api-key`
API key'i kaydeder.

**Request:**
```json
{
  "apiKey": "flabs_xxxxxxxxxxxxxxxxxxxxxxxx"
}
```

**Response:**
```json
{
  "success": true,
  "message": "API key başarıyla kaydedildi."
}
```

---

### **GET** `/api/farmlabs/api-key`
Kullanıcının API key'ini getirir (maskelenmiş).

**Response:**
```json
{
  "success": true,
  "data": {
    "hasApiKey": true,
    "apiKey": "flabs_********************abc1",
    "updatedAt": "2026-05-06T09:30:00.000Z"
  }
}
```

---

### **POST** `/api/farmlabs/sync`
FarmLabs'dan drop'ları senkronize eder.

**Response:**
```json
{
  "success": true,
  "message": "Drop'lar başarıyla senkronize edildi.",
  "data": {
    "totalDrops": 523,
    "daysProcessed": 87,
    "recordsInserted": 87
  }
}
```

---

### **GET** `/api/farmlabs/stats`
FarmLabs istatistiklerini getirir (son 30 gün).

**Response:**
```json
{
  "success": true,
  "data": {
    "total_drops": 523,
    "total_earned_usd": 87.45,
    "most_dropped_item": {
      "item_id": 789,
      "item_name": "Revolution Case",
      "count": 342
    }
  }
}
```

---

### **GET** `/api/farmlabs/bot-groups`
Bot gruplarını listeler.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Main Farm Group",
      "bots_count": 50
    }
  ]
}
```

---

### **GET** `/api/farmlabs/bots`
Botları listeler.

**Query Parameters:**
- `botGroupId` (optional): Belirli bir grubun botlarını filtreler

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
      "steam_username": "my_bot",
      "status": "online"
    }
  ]
}
```

---

## 🔒 Güvenlik

### API Key Saklama
- API key'ler veritabanında **plain text** olarak saklanıyor
- **ÖNERİ:** Production'da şifreleme ekleyin (AES-256)

### Örnek Şifreleme (Gelecek İyileştirme):
```javascript
const crypto = require('crypto');

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY; // 32 byte
const IV_LENGTH = 16;

function encrypt(text) {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text) {
    const parts = text.split(':');
    const iv = Buffer.from(parts.shift(), 'hex');
    const encrypted = Buffer.from(parts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
}
```

---

## 🧪 Test Etme

### Manuel Test

1. **API Key Test:**
```bash
curl -X POST http://localhost:5050/api/farmlabs/api-key/test \
  -H "Content-Type: application/json" \
  -H "Cookie: token=YOUR_JWT_TOKEN" \
  -d '{"apiKey":"flabs_your_key_here"}'
```

2. **Drop Senkronizasyonu:**
```bash
curl -X POST http://localhost:5050/api/farmlabs/sync \
  -H "Cookie: token=YOUR_JWT_TOKEN"
```

3. **İstatistikler:**
```bash
curl http://localhost:5050/api/farmlabs/stats \
  -H "Cookie: token=YOUR_JWT_TOKEN"
```

---

## 📝 Gelecek İyileştirmeler

### 1. **Otomatik Senkronizasyon**
- Cron job ile günlük otomatik senkronizasyon
- Kullanıcı ayarlarında senkronizasyon sıklığı seçimi

### 2. **Drop Detayları**
- Her drop'un detaylı bilgisi (item, bot, tarih)
- Drop geçmişi sayfası
- Filtreleme ve arama

### 3. **Bildirimler**
- Yeni drop geldiğinde bildirim
- Haftalık kazanç özeti bildirimi

### 4. **İstatistikler**
- En çok drop veren bot
- En değerli drop
- Aylık/yıllık karşılaştırma

### 5. **Şifreleme**
- API key'lerin şifreli saklanması
- Environment variable ile encryption key

---

## 🐛 Bilinen Sorunlar

1. **API Rate Limiting:** FarmLabs API'nin rate limit'i bilinmiyor, çok fazla istek atılırsa hata alınabilir
2. **Pagination:** Çok fazla drop varsa (>10000) pagination yavaş olabilir
3. **Timezone:** Tüm tarihler UTC olarak saklanıyor, kullanıcı timezone'u dikkate alınmıyor

---

## 📚 Kaynaklar

- [FarmLabs API Dokümantasyonu](https://dashboard.farmlabs.dev/api/docs)
- [FarmLabs Dashboard](https://dashboard.farmlabs.dev)
- [Steam Weekly Drops](https://steamcommunity.com/discussions/forum/1/1735465524711324558/)

---

**Tarih:** 6 Mayıs 2026  
**Versiyon:** 1.0.0  
**Durum:** ✅ Aktif
