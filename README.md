# Sirius - Steam Otomasyon

Steam hesap yönetimi ve FarmLabs entegrasyonu.

## Özellikler

- JWT authentication
- Steam hesap yönetimi (şifrelenmiş)
- FarmLabs API entegrasyonu (şifrelenmiş)
- Kazanç takibi ve grafikler
- Çoklu dil (TR/EN)
- Rate limiting
- Docker desteği

## Kurulum

### Development
```bash
npm install
npm run dev
```

### Production
```bash
docker-compose up -d --build
```

Detaylı kurulum: `SETUP.md`

## Teknolojiler

- Node.js 20
- Express.js
- SQLite
- Docker
- Cloudflare Tunnel

## API Endpoints

### Auth
- `POST /api/auth/register` - Kayıt
- `POST /api/auth/login` - Giriş
- `POST /api/auth/logout` - Çıkış
- `GET /api/auth/me` - Kullanıcı bilgisi

### FarmLabs
- `POST /api/farmlabs/api-key` - API key kaydet
- `GET /api/farmlabs/api-key` - API key getir
- `POST /api/farmlabs/sync` - Drop'ları senkronize et
- `GET /api/farmlabs/stats` - İstatistikler

### Steam Accounts
- `GET /api/accounts` - Hesapları listele
- `POST /api/accounts` - Hesap ekle
- `PUT /api/accounts/:id` - Hesap güncelle
- `DELETE /api/accounts/:id` - Hesap sil

### Earnings
- `GET /api/earnings` - Kazançları getir
- `GET /api/earnings/weekly` - Haftalık kazançlar

## Environment Variables

```env
NODE_ENV=production
PORT=5050
JWT_SECRET=<64-byte-hex>
ENCRYPTION_KEY=<32-byte-hex>
CORS_ORIGIN=https://sonsuz.dev
DB_PATH=./database.sqlite
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## Güvenlik

- Güvenlik Skoru: 8.5/10
- AES-256-CBC şifreleme
- bcrypt password hashing
- JWT authentication
- Rate limiting
- Input validation
- Helmet security headers

## Lisans

Özel proje.
