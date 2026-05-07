# Rate Limiting Rehberi

## 🎯 Genel Bakış

Sistemimiz **katmanlı rate limiting** stratejisi kullanarak hem kullanıcı deneyimini korur hem de güvenliği sağlar.

## 📊 Rate Limit Seviyeleri

### 1. **Anonim Kullanıcılar** (Giriş Yapmamış)
- **Limit:** 15 dakikada 100 istek
- **Amaç:** Spam ve DDoS saldırılarını önlemek
- **Mesaj:** "Çok fazla istek gönderildi. Lütfen giriş yapın veya daha sonra tekrar deneyin."

### 2. **Kimlik Doğrulamalı Kullanıcılar** (Giriş Yapmış)
- **Limit:** 15 dakikada 1000 istek
- **Amaç:** Normal kullanımda hiç sorun yaşatmamak, sadece aşırı kullanımı engellemek
- **Mesaj:** "Çok fazla istek gönderildi. Lütfen bir süre bekleyin."
- **Not:** F5 ile sayfa yenileme, hesap görüntüleme gibi işlemler bu limite dahil

### 3. **Auth Endpoint'leri** (Login/Register)
- **Limit:** 15 dakikada 5 istek
- **Amaç:** Brute force saldırılarını önlemek
- **Mesaj:** "Çok fazla giriş denemesi. Lütfen 15 dakika sonra tekrar deneyin."
- **Endpoint'ler:**
  - `/api/auth/login`
  - `/api/auth/register`

### 4. **Kritik İşlemler**
- **Limit:** 15 dakikada 10 istek
- **Amaç:** Hassas işlemlerde ekstra güvenlik
- **Mesaj:** "Çok fazla işlem denemesi. Lütfen 15 dakika sonra tekrar deneyin."
- **Endpoint'ler:**
  - `/api/auth/change-password`

### 5. **Yazma İşlemleri** (POST/PUT/DELETE)
- **Limit:** 1 dakikada 30 istek
- **Amaç:** Veritabanı spam'ini önlemek
- **Mesaj:** "Çok fazla yazma işlemi. Lütfen bir dakika bekleyin."
- **Endpoint'ler:**
  - `/api/accounts` (POST/PUT/DELETE)
  - `/api/tasks` (POST/PUT/DELETE)
  - `/api/proxies` (POST/PUT/DELETE)

## 🔧 Yapılandırma

Rate limit değerleri `.env` dosyasından yapılandırılabilir:

```env
# Anonim kullanıcılar
RATE_LIMIT_ANONYMOUS_WINDOW_MS=900000  # 15 dakika
RATE_LIMIT_ANONYMOUS_MAX=100           # 100 istek

# Kimlik doğrulamalı kullanıcılar
RATE_LIMIT_AUTHENTICATED_WINDOW_MS=900000  # 15 dakika
RATE_LIMIT_AUTHENTICATED_MAX=1000          # 1000 istek

# Auth endpoint'leri
RATE_LIMIT_AUTH_WINDOW_MS=900000  # 15 dakika
RATE_LIMIT_AUTH_MAX=5             # 5 istek

# Kritik işlemler
RATE_LIMIT_CRITICAL_WINDOW_MS=900000  # 15 dakika
RATE_LIMIT_CRITICAL_MAX=10            # 10 istek

# Yazma işlemleri
RATE_LIMIT_WRITE_WINDOW_MS=60000  # 1 dakika
RATE_LIMIT_WRITE_MAX=30           # 30 istek
```

## 🛡️ Güvenlik Özellikleri

### 1. **Dinamik Limit Seçimi**
Sistem, kullanıcının token'ına bakarak otomatik olarak doğru limiti uygular:
- Token varsa → Authenticated limiter (1000 istek)
- Token yoksa → Anonymous limiter (100 istek)

### 2. **Endpoint Bazlı Koruma**
Her endpoint'in hassasiyetine göre farklı limitler:
- Okuma işlemleri (GET) → Daha yüksek limit
- Yazma işlemleri (POST/PUT/DELETE) → Daha düşük limit
- Kritik işlemler → En düşük limit

### 3. **429 Hatası Yönetimi**
Frontend'de 429 hatası geldiğinde:
- ❌ Kullanıcı logout edilmez
- ✅ Bildirim gösterilir
- ✅ Kullanıcı oturumu korunur

## 📈 Performans İpuçları

### Kullanıcılar İçin:
1. **Giriş yapın:** Login olduktan sonra 10x daha fazla istek hakkınız olur
2. **Sayfayı gereksiz yenilemeyin:** Her yenileme birden fazla API çağrısı yapar
3. **Toplu işlemler kullanın:** Tek tek istek yerine bulk işlemleri tercih edin

### Geliştiriciler İçin:
1. **Caching kullanın:** Aynı veriyi tekrar tekrar çekmeyin
2. **Debouncing/Throttling:** Kullanıcı input'larında rate limiting uygulayın
3. **Batch requests:** Mümkünse istekleri gruplayın

## 🚨 Saldırı Senaryoları ve Korunma

### Senaryo 1: Brute Force Login
- **Saldırı:** Şifre deneme saldırısı
- **Koruma:** Auth limiter (15 dakikada 5 deneme)
- **Sonuç:** Saldırgan 5 denemeden sonra 15 dakika beklemek zorunda

### Senaryo 2: DDoS (Anonim)
- **Saldırı:** Giriş yapmadan sürekli istek gönderme
- **Koruma:** Anonymous limiter (15 dakikada 100 istek)
- **Sonuç:** IP başına 100 istekten sonra bloke

### Senaryo 3: Account Takeover (Çalıntı Token)
- **Saldırı:** Çalınan token ile spam
- **Koruma:** Authenticated limiter (15 dakikada 1000 istek) + Write limiter (1 dakikada 30 yazma)
- **Sonuç:** Saldırgan bile sınırlı hasar verebilir

### Senaryo 4: Database Spam
- **Saldırı:** Sürekli hesap ekleme/silme
- **Koruma:** Write limiter (1 dakikada 30 istek)
- **Sonuç:** Veritabanı korunur

## 🔍 Monitoring ve Logging

Rate limit aşımları otomatik olarak loglanır:
- HTTP 429 status code
- `X-RateLimit-Limit` header (maksimum istek sayısı)
- `X-RateLimit-Remaining` header (kalan istek sayısı)
- `X-RateLimit-Reset` header (reset zamanı)

## 📝 Notlar

1. **Production'da artırın:** Development'ta test için düşük limitler kullanılabilir, production'da artırın
2. **IP bazlı:** Rate limiting IP adresine göre yapılır
3. **Redis kullanımı:** Yüksek trafikte Redis kullanarak rate limiting'i scale edebilirsiniz
4. **CDN kullanımı:** Static dosyalar için CDN kullanarak API yükünü azaltın

## 🎓 Best Practices

✅ **Yapılması Gerekenler:**
- Login olan kullanıcılara daha yüksek limit verin
- Kritik endpoint'leri ekstra koruyun
- 429 hatalarını düzgün handle edin
- Rate limit bilgilerini header'larda gönderin

❌ **Yapılmaması Gerekenler:**
- Tüm endpoint'lere aynı limiti uygulamayın
- 429 hatası geldiğinde kullanıcıyı logout etmeyin
- Rate limit'i tamamen kaldırmayın
- Çok düşük limitler koymayın (kullanıcı deneyimini bozar)

## 🔄 Gelecek İyileştirmeler

1. **Redis entegrasyonu:** Distributed rate limiting için
2. **User-based limiting:** IP yerine user ID bazlı
3. **Adaptive limiting:** Trafik yoğunluğuna göre dinamik limitler
4. **Whitelist/Blacklist:** Belirli IP'leri bypass veya bloke etme
5. **Rate limit dashboard:** Admin panelinde rate limit istatistikleri

---

**Son Güncelleme:** 2026-05-07
**Versiyon:** 1.0.0
