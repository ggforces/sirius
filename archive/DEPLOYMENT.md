# 🚀 SIRIUS STEAM AUTOMATION - DEPLOYMENT GUIDE

**Tarih:** 2026-05-06  
**Versiyon:** Production Ready  
**Deployment Yöntemi:** Docker + Cloudflare Tunnel

---

## 📋 İÇİNDEKİLER

1. [Gereksinimler](#gereksinimler)
2. [Hızlı Başlangıç](#hızlı-başlangıç)
3. [Docker ile Deployment](#docker-ile-deployment)
4. [Cloudflare Tunnel Kurulumu](#cloudflare-tunnel-kurulumu)
5. [Environment Variables](#environment-variables)
6. [Database Yönetimi](#database-yönetimi)
7. [Güvenlik Kontrolleri](#güvenlik-kontrolleri)
8. [Monitoring ve Logs](#monitoring-ve-logs)
9. [Troubleshooting](#troubleshooting)

---

## 🔧 GEREKSINIMLER

### Sunucu Gereksinimleri
- **OS:** Linux (Ubuntu 20.04+ önerilir)
- **RAM:** Minimum 512MB, Önerilen 1GB+
- **Disk:** Minimum 1GB boş alan
- **CPU:** 1 core yeterli

### Yazılım Gereksinimleri
- **Docker:** 20.10+
- **Docker Compose:** 2.0+
- **Cloudflared:** Latest version

---

## ⚡ HIZLI BAŞLANGIÇ

### 1. Projeyi Sunucuya Yükle

```bash
# Git ile clone (önerilir)
git clone <your-repo-url> sirius-app
cd sirius-app

# Veya: ZIP ile yükle ve extract et
unzip sirius-app.zip
cd sirius-app
```

### 2. Environment Variables Ayarla

```bash
# .env dosyasını düzenle
nano .env
```

**Önemli:** Aşağıdaki değerleri mutlaka değiştir:
- `JWT_SECRET` - Güvenli bir secret key
- `ENCRYPTION_KEY` - 32-byte hex encryption key
- `CORS_ORIGIN` - Production domain'in (örn: https://yourdomain.com)

### 3. Docker ile Başlat

```bash
# Build ve start
docker-compose up -d

# Logları kontrol et
docker-compose logs -f
```

### 4. Sağlık Kontrolü

```bash
# Container durumunu kontrol et
docker-compose ps

# Health check
curl http://localhost:5050/api/health
```

**Beklenen Yanıt:**
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2026-05-06T..."
}
```

---

## 🐳 DOCKER İLE DEPLOYMENT

### Build ve Start

```bash
# Production build
docker-compose up -d --build

# Logları izle
docker-compose logs -f sirius-app
```

### Container Yönetimi

```bash
# Durdur
docker-compose stop

# Başlat
docker-compose start

# Yeniden başlat
docker-compose restart

# Kaldır (veriler korunur)
docker-compose down

# Tamamen kaldır (veriler dahil)
docker-compose down -v
```

### Güncelleme

```bash
# Yeni kodu çek
git pull origin main

# Rebuild ve restart
docker-compose up -d --build

# Eski image'leri temizle
docker image prune -f
```

---

## 🌐 CLOUDFLARE TUNNEL KURULUMU

Cloudflare Tunnel, sunucunuzu güvenli bir şekilde internete açar:
- ✅ Otomatik HTTPS
- ✅ DDoS koruması
- ✅ IP gizleme
- ✅ Firewall gereksiz

### 1. Cloudflared Kurulumu

```bash
# Ubuntu/Debian
wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb

# Verify installation
cloudflared --version
```

### 2. Cloudflare'e Login

```bash
cloudflared tunnel login
```

Bu komut bir browser açacak. Cloudflare hesabınıza login olun ve domain'inizi seçin.

### 3. Tunnel Oluştur

```bash
# Tunnel oluştur
cloudflared tunnel create sirius-tunnel

# Tunnel ID'yi not al (output'ta gösterilecek)
```

### 4. Tunnel Yapılandırması

```bash
# Config dosyası oluştur
nano ~/.cloudflared/config.yml
```

**config.yml içeriği:**
```yaml
tunnel: <TUNNEL_ID>
credentials-file: /home/<USER>/.cloudflared/<TUNNEL_ID>.json

ingress:
  - hostname: yourdomain.com
    service: http://localhost:5050
  - hostname: www.yourdomain.com
    service: http://localhost:5050
  - service: http_status:404
```

**Önemli:** 
- `<TUNNEL_ID>` yerine gerçek tunnel ID'nizi yazın
- `<USER>` yerine Linux kullanıcı adınızı yazın
- `yourdomain.com` yerine kendi domain'inizi yazın

### 5. DNS Kayıtları Oluştur

```bash
# DNS kaydı ekle
cloudflared tunnel route dns sirius-tunnel yourdomain.com
cloudflared tunnel route dns sirius-tunnel www.yourdomain.com
```

### 6. Tunnel'ı Başlat

```bash
# Test (foreground)
cloudflared tunnel run sirius-tunnel

# Production (background - systemd service)
sudo cloudflared service install
sudo systemctl start cloudflared
sudo systemctl enable cloudflared

# Status kontrol
sudo systemctl status cloudflared
```

### 7. CORS Origin Güncelle

Tunnel çalıştıktan sonra `.env` dosyasını güncelle:

```bash
nano .env
```

```env
CORS_ORIGIN=https://yourdomain.com
```

Docker'ı yeniden başlat:
```bash
docker-compose restart
```

---

## 🔐 ENVIRONMENT VARIABLES

### Gerekli Değişkenler

| Değişken | Açıklama | Örnek |
|----------|----------|-------|
| `NODE_ENV` | Ortam (production/development) | `production` |
| `PORT` | Uygulama portu | `5050` |
| `JWT_SECRET` | JWT token için secret key | `64-byte hex string` |
| `JWT_EXPIRES_IN` | JWT token süresi | `7d` |
| `ENCRYPTION_KEY` | Şifreleme anahtarı | `32-byte hex string` |
| `CORS_ORIGIN` | İzin verilen origin | `https://yourdomain.com` |
| `DB_PATH` | Database dosya yolu | `./database.sqlite` |
| `RATE_LIMIT_WINDOW_MS` | Rate limit penceresi | `900000` (15 dk) |
| `RATE_LIMIT_MAX_REQUESTS` | Maksimum istek sayısı | `100` |

### Secret Key Oluşturma

```bash
# JWT_SECRET oluştur (64 byte)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# ENCRYPTION_KEY oluştur (32 byte)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 💾 DATABASE YÖNETİMİ

### Backup

```bash
# Manuel backup
docker-compose exec sirius-app cp /app/data/database.sqlite /app/data/backup-$(date +%Y%m%d-%H%M%S).sqlite

# Backup'ı host'a kopyala
docker cp sirius-steam-automation:/app/data/backup-*.sqlite ./backups/
```

### Otomatik Backup (Cron)

```bash
# Crontab düzenle
crontab -e

# Her gün saat 03:00'te backup al
0 3 * * * docker-compose -f /path/to/sirius-app/docker-compose.yml exec -T sirius-app cp /app/data/database.sqlite /app/data/backup-$(date +\%Y\%m\%d).sqlite
```

### Restore

```bash
# Container'ı durdur
docker-compose stop

# Backup'tan restore et
cp ./backups/backup-20260506.sqlite ./data/database.sqlite

# Container'ı başlat
docker-compose start
```

---

## 🔒 GÜVENLİK KONTROLLERİ

### Deployment Öncesi Checklist

- [ ] ✅ JWT_SECRET değiştirildi (güvenli, 64-byte)
- [ ] ✅ ENCRYPTION_KEY değiştirildi (güvenli, 32-byte)
- [ ] ✅ NODE_ENV=production ayarlandı
- [ ] ✅ CORS_ORIGIN production domain'e ayarlandı
- [ ] ✅ Database temizlendi (test verileri silindi)
- [ ] ✅ .env dosyası git'te yok (.gitignore'da)
- [ ] ✅ Rate limiting aktif (100 req/15min)
- [ ] ✅ Helmet security headers aktif
- [ ] ✅ HTTPS aktif (Cloudflare Tunnel ile)
- [ ] ✅ Firewall kuralları ayarlandı (opsiyonel)

### Güvenlik Testleri

```bash
# Health check
curl https://yourdomain.com/api/health

# CORS test
curl -H "Origin: https://evil.com" https://yourdomain.com/api/health

# Rate limit test
for i in {1..110}; do curl https://yourdomain.com/api/health; done
```

---

## 📊 MONITORING VE LOGS

### Docker Logs

```bash
# Tüm logları göster
docker-compose logs

# Son 100 satır
docker-compose logs --tail=100

# Canlı takip
docker-compose logs -f

# Sadece hata logları
docker-compose logs | grep ERROR
```

### Container Stats

```bash
# Kaynak kullanımı
docker stats sirius-steam-automation

# Detaylı bilgi
docker inspect sirius-steam-automation
```

### Health Check

```bash
# Manuel health check
docker-compose exec sirius-app wget -q -O- http://localhost:5050/api/health

# Otomatik health check durumu
docker inspect --format='{{.State.Health.Status}}' sirius-steam-automation
```

---

## 🔧 TROUBLESHOOTING

### Container Başlamıyor

```bash
# Logları kontrol et
docker-compose logs sirius-app

# Port kullanımda mı?
sudo lsof -i :5050

# Yeniden build
docker-compose down
docker-compose up -d --build
```

### Database Hatası

```bash
# Database dosyası var mı?
ls -la ./data/database.sqlite

# İzinleri kontrol et
sudo chown -R 1000:1000 ./data

# Yeni database oluştur
rm ./data/database.sqlite
docker-compose restart
```

### Cloudflare Tunnel Çalışmıyor

```bash
# Tunnel durumu
sudo systemctl status cloudflared

# Logları kontrol et
sudo journalctl -u cloudflared -f

# Yeniden başlat
sudo systemctl restart cloudflared

# Config dosyasını kontrol et
cat ~/.cloudflared/config.yml
```

### CORS Hatası

```bash
# .env dosyasını kontrol et
cat .env | grep CORS_ORIGIN

# CORS_ORIGIN'i güncelle
nano .env
# CORS_ORIGIN=https://yourdomain.com

# Restart
docker-compose restart
```

### Rate Limit Çok Sıkı

```bash
# .env dosyasını düzenle
nano .env

# Değerleri artır
RATE_LIMIT_MAX_REQUESTS=200

# Restart
docker-compose restart
```

---

## 📞 DESTEK VE KAYNAKLAR

### Faydalı Komutlar

```bash
# Tüm container'ları listele
docker ps -a

# Disk kullanımı
docker system df

# Temizlik (kullanılmayan image'ler)
docker system prune -a

# Network kontrol
docker network ls
docker network inspect sirius-network
```

### Loglar ve Debug

```bash
# Application logs
docker-compose logs -f sirius-app

# System logs
sudo journalctl -xe

# Cloudflare logs
sudo journalctl -u cloudflared -f
```

### Performans İyileştirme

```bash
# Node.js memory limit (docker-compose.yml'de)
environment:
  - NODE_OPTIONS=--max-old-space-size=512

# Database optimize
docker-compose exec sirius-app node -e "const db = require('./src/config/database'); db.pragma('optimize');"
```

---

## 🎉 DEPLOYMENT TAMAMLANDI!

Artık uygulamanız production'da çalışıyor! 🚀

**Erişim:**
- **Local:** http://localhost:5050
- **Public:** https://yourdomain.com

**İlk Kullanıcı Oluşturma:**
1. https://yourdomain.com adresine git
2. "Kayıt Ol" butonuna tıkla
3. Email ve şifre ile kayıt ol
4. Giriş yap ve kullanmaya başla!

---

**Son Güncelleme:** 2026-05-06  
**Durum:** ✅ Production Ready  
**Deployment Yöntemi:** Docker + Cloudflare Tunnel
