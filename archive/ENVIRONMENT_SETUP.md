# 🌍 Environment Setup Guide

**Tarih:** 2026-05-06  
**Production Domain:** https://sonsuz.dev

---

## 📋 Environment Dosyaları

### 1. `.env` (Production - Sunucu)
```env
NODE_ENV=production
CORS_ORIGIN=https://sonsuz.dev
```

**Kullanım:** Linux sunucuda production deployment için

### 2. `.env.development` (Development - Local)
```env
NODE_ENV=development
CORS_ORIGIN=http://localhost:5050
```

**Kullanım:** Local development için (opsiyonel)

### 3. `.env.example` (Template)
```env
NODE_ENV=production
CORS_ORIGIN=http://localhost:5050
```

**Kullanım:** Yeni ortam kurulumu için template

---

## 🔧 Nasıl Kullanılır?

### Development (Local)
```bash
# Opsiyonel: .env.development kullan
cp .env.development .env

# Veya: .env'i manuel düzenle
nano .env
# CORS_ORIGIN=http://localhost:5050
# NODE_ENV=development

npm run dev
```

### Production (Sunucu)
```bash
# .env zaten production için hazır
# CORS_ORIGIN=https://sonsuz.dev
# NODE_ENV=production

docker-compose up -d --build
```

---

## 🌐 CORS Origin Ayarları

### Neden Ayrı Ayrı?
- ✅ **Güvenlik:** Sadece belirlediğin domain'den istek kabul eder
- ✅ **Esneklik:** Her ortamda farklı ayar yapabilirsin
- ✅ **Best Practice:** Industry standard yaklaşım

### Ayarlar:
| Ortam | CORS_ORIGIN | Açıklama |
|-------|-------------|----------|
| **Development** | `http://localhost:5050` | Local geliştirme |
| **Production** | `https://sonsuz.dev` | Canlı sunucu |

---

## ⚠️ ÖNEMLİ NOTLAR

### 1. .env Dosyası Git'e Commit Edilmez
`.gitignore` dosyasında zaten var:
```gitignore
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
```

### 2. Her Ortamda Kendi .env Dosyası
- **Local:** `.env` (development ayarları)
- **Sunucu:** `.env` (production ayarları)
- Git'e commit edilmediği için her ortamda farklı olabilir

### 3. Secret'lar Farklı Olmalı
- **Development:** Basit secret'lar kullanabilirsin
- **Production:** Güvenli, kriptografik secret'lar kullan

---

## 🚀 Deployment Workflow

### 1. Local'de Geliştir
```bash
# .env (development)
CORS_ORIGIN=http://localhost:5050
NODE_ENV=development

npm run dev
```

### 2. Git'e Push Et
```bash
git add .
git commit -m "Feature: XYZ"
git push origin main
```

### 3. Sunucuda Pull Et
```bash
cd sirius-app
git pull origin main
```

### 4. Sunucuda .env Kontrol Et
```bash
cat .env
# CORS_ORIGIN=https://sonsuz.dev olmalı
# NODE_ENV=production olmalı
```

### 5. Docker Restart
```bash
docker-compose restart
```

---

## 🔐 Secret Management

### Development Secret'ları
```bash
# Basit, hatırlanabilir
JWT_SECRET=sirius-steam-automation-dev-secret-key-2026
ENCRYPTION_KEY=dev-encryption-key-change-in-production-32byte-hex
```

### Production Secret'ları
```bash
# Kriptografik olarak güvenli
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 📞 Troubleshooting

### CORS Hatası Alıyorum
```bash
# .env dosyasını kontrol et
cat .env | grep CORS_ORIGIN

# Doğru domain'i kullandığından emin ol
# Development: http://localhost:5050
# Production: https://sonsuz.dev

# Docker'ı restart et
docker-compose restart
```

### Environment Variables Değişmiyor
```bash
# Docker container'ı yeniden build et
docker-compose down
docker-compose up -d --build
```

### Local'de Production Ayarları Çalışmıyor
```bash
# .env dosyasını development için düzenle
nano .env
# CORS_ORIGIN=http://localhost:5050
# NODE_ENV=development
```

---

**Son Güncelleme:** 2026-05-06  
**Production Domain:** https://sonsuz.dev  
**Durum:** ✅ Hazır
