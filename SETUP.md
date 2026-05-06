# Kurulum

## Sunucuda Yapılacaklar

### 1. Docker Kur
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
```

### 2. Projeyi Başlat
```bash
git clone <repo-url> sirius-app
cd sirius-app
docker-compose up -d --build
docker-compose logs -f
```

### 3. Cloudflare Tunnel Kur
```bash
# Cloudflared kur
wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb

# Login
cloudflared tunnel login

# Tunnel oluştur
cloudflared tunnel create sirius-tunnel
# Tunnel ID'yi not al

# Config oluştur
nano ~/.cloudflared/config.yml
```

**config.yml:**
```yaml
tunnel: <TUNNEL_ID>
credentials-file: /home/<USER>/.cloudflared/<TUNNEL_ID>.json

ingress:
  - hostname: sonsuz.dev
    service: http://localhost:5050
  - service: http_status:404
```

```bash
# DNS ekle
cloudflared tunnel route dns sirius-tunnel sonsuz.dev

# Service başlat
sudo cloudflared service install
sudo systemctl start cloudflared
sudo systemctl enable cloudflared
```

### 4. Test
```bash
curl https://sonsuz.dev/api/health
```

## Yapılacaklar

- [ ] Sunucuya deploy et
- [ ] Cloudflare Tunnel kur
- [ ] Test et
- [ ] İlk kullanıcıyı oluştur

## Güvenlik Skoru: 8.5/10

**Neden 8.5?**

**Yapılanlar (+8.5):**
- ✅ FarmLabs API key şifreleme (AES-256-CBC)
- ✅ Steam hesap şifreleme (AES-256-CBC)
- ✅ JWT secret güvenli (64-byte)
- ✅ Encryption key güvenli (32-byte)
- ✅ Rate limiting (100 req/15min)
- ✅ Input validation
- ✅ Session cleanup
- ✅ Helmet security headers
- ✅ CORS yapılandırması

**Eksikler (-1.5):**
- ❌ Email verification yok
- ❌ 2FA yok
- ❌ Audit logging yok
- ❌ Rate limiting daha sıkı olabilir
- ❌ Session store Redis değil (SQLite)

**Tek kullanıcı için 8.5 yeterli. Production multi-user için 9+ olmalı.**
