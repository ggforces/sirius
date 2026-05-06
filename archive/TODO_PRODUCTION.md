# PRODUCTION'A GEÇİŞ ÖNCESİ YAPILACAKLAR

## 🔴 KRİTİK - MUTLAKA YAPILMALI

### 1. JWT Secret Değiştirme

**Mevcut Durum (Development):**
```env
JWT_SECRET=sirius-steam-automation-secret-key-2026-change-in-production
```

**Production İçin:**
```bash
# Terminal'de çalıştır:
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Bu komut size güvenli bir secret üretecek. Örnek:
```env
JWT_SECRET=a8f5f167f44f4964e6c998dee827110c03e0245d4b5f5f5f5f5f5f5f5f5f5f5f5f5f5f5f5f5f5f5f5f5f5f5f5f5f5f5f5f5f5f5f5f5f5f
```

**Adımlar:**
1. Yukarıdaki komutu çalıştır
2. Üretilen secret'ı `.env` dosyasına kopyala
3. Sunucuyu yeniden başlat
4. **ÖNEMLİ:** Tüm kullanıcılar yeniden login olmak zorunda kalacak

---

### 2. CORS Origin Ayarlama

**Mevcut Durum (Development):**
```javascript
origin: process.env.NODE_ENV === 'production' 
    ? 'your-production-domain.com'  // ❌ Placeholder
    : 'http://localhost:5050'
```

**Production İçin:**
1. `.env` dosyasına ekle:
```env
CORS_ORIGIN=https://yourdomain.com
```

2. `server.js` dosyasını güncelle:
```javascript
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5050',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
```

---

### 3. Encryption Key Değiştirme

**Mevcut Durum (Development):**
```env
ENCRYPTION_KEY=822a72894a680d7503afe1979ee3c0822176f24e4b30ba21b8b1ac9288e80f18
```

**Production İçin:**
```bash
# Terminal'de çalıştır:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**UYARI:** Encryption key değiştirilirse mevcut şifrelenmiş veriler okunamaz hale gelir!

**Adımlar:**
1. Yeni key oluştur
2. Mevcut verileri yeni key ile yeniden şifrele (migration script gerekli)
3. Veya: Production'da ilk kurulumda yeni key kullan

---

### 4. NODE_ENV Ayarlama

**Production İçin:**
```env
NODE_ENV=production
```

Bu ayar:
- Error mesajlarını gizler
- Cookie secure flag'ini aktif eder
- CORS ayarlarını production'a çevirir

---

### 5. Rate Limiting Ayarları

**Mevcut Durum (Development):**
```env
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100  # Zaten düzeltildi
```

**Production İçin:**
- Değerleri izle ve gerekirse ayarla
- DDoS saldırılarına karşı daha sıkı limitler düşün

---

### 6. Database Yedekleme

**Production İçin:**
- Otomatik database backup sistemi kur
- Günlük/haftalık backup'lar
- Backup'ları güvenli bir yerde sakla (şifrelenmiş)

---

### 7. HTTPS Sertifikası

**Production İçin:**
- SSL/TLS sertifikası al (Let's Encrypt ücretsiz)
- Nginx veya Apache ile HTTPS yapılandır
- HTTP'den HTTPS'e yönlendirme ekle

---

### 8. Logging ve Monitoring

**Production İçin:**
- Winston veya Bunyan gibi logging library ekle
- Error tracking (Sentry, Rollbar)
- Performance monitoring (New Relic, DataDog)
- Uptime monitoring (UptimeRobot, Pingdom)

---

### 9. Environment Variables Güvenliği

**Production İçin:**
- `.env` dosyasını asla git'e commit etme
- Production sunucuda environment variables'ı sistem seviyesinde ayarla
- Docker kullanıyorsan secrets management kullan

---

### 10. Database Güvenliği

**Production İçin:**
- Database'i public internet'e açma
- Firewall kuralları ekle
- Database user'ına minimum gerekli izinleri ver
- Regular security updates

---

## 🟡 ORTA ÖNCELİK - ÖNERİLİR

### 11. Session Store

**Mevcut:** SQLite database  
**Production İçin:** Redis veya Memcached kullan (daha hızlı)

---

### 12. Static File Serving

**Production İçin:**
- Nginx ile static file'ları serve et
- CDN kullan (Cloudflare, AWS CloudFront)
- Gzip compression aktif et

---

### 13. Process Manager

**Production İçin:**
- PM2 kullan (otomatik restart, clustering)
```bash
npm install -g pm2
pm2 start server.js -i max
pm2 startup
pm2 save
```

---

### 14. Security Headers

**Mevcut:** Helmet kullanılıyor ✅  
**Production İçin:** Helmet ayarlarını gözden geçir ve sıkılaştır

---

### 15. API Documentation

**Production İçin:**
- Swagger/OpenAPI documentation ekle
- API versioning düşün

---

## 🟢 DÜŞÜK ÖNCELİK - İYİLEŞTİRME

### 16. Email Verification

**Production İçin:**
- Kullanıcı kaydında email doğrulama ekle
- Password reset için email gönderimi

---

### 17. 2FA (Two-Factor Authentication)

**Production İçin:**
- TOTP (Google Authenticator) desteği
- SMS verification (opsiyonel)

---

### 18. Audit Logging

**Production İçin:**
- Tüm önemli işlemleri logla
- User activity tracking
- Security event logging

---

### 19. Penetration Testing

**Production İçin:**
- Professional security audit
- Automated security scanning (OWASP ZAP, Burp Suite)

---

### 20. Compliance

**Production İçin:**
- GDPR compliance (EU kullanıcıları için)
- Privacy policy ve terms of service
- Cookie consent banner

---

## 📋 DEPLOYMENT CHECKLIST

Production'a deploy etmeden önce kontrol et:

- [ ] JWT_SECRET değiştirildi
- [ ] ENCRYPTION_KEY değiştirildi (veya migration yapıldı)
- [ ] CORS_ORIGIN ayarlandı
- [ ] NODE_ENV=production
- [ ] HTTPS sertifikası kuruldu
- [ ] Database backup sistemi kuruldu
- [ ] Logging sistemi aktif
- [ ] Error tracking aktif
- [ ] Firewall kuralları ayarlandı
- [ ] Rate limiting test edildi
- [ ] Security headers kontrol edildi
- [ ] .env dosyası git'te yok
- [ ] PM2 veya benzeri process manager kuruldu
- [ ] Monitoring sistemi aktif
- [ ] Load testing yapıldı
- [ ] Security audit tamamlandı

---

## 🔗 FAYDALI LİNKLER

- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [Let's Encrypt](https://letsencrypt.org/)
- [PM2 Documentation](https://pm2.keymetrics.io/)

---

**Son Güncelleme:** 2026-05-06  
**Durum:** Development → Production Geçiş Planı
