# DEĞİŞİKLİK KAYDI V5 - FarmLabs API Bilgilendirme Sistemi

## 📋 FarmLabs API Bilgilendirme ve Güvenlik Uyarıları

### Tarih: 2026-05-06

---

## ✨ YENİ ÖZELLİKLER

### 1. **FarmLabs API Bilgilendirme Kutuları**

Ayarlar sayfasına 3 adet bilgilendirme kutusu eklendi:

#### **Mavi Kutu - API Key Nasıl Alınır?**
- FarmLabs Dashboard linkine yönlendirme
- API key alma süreci hakkında bilgilendirme
- Dış bağlantı ikonu ile görsel destek

#### **Sarı Kutu - Gerekli API İzinleri**
- Kullanılan endpoint'lerin detaylı listesi
- Her endpoint için açıklama
- Endpoint kodları (GET /v1/drops, GET /v1/drops/stats)
- Gereksiz endpoint'ler hakkında not

#### **Yeşil Kutu - Güvenlik ve Gizlilik**
- AES-256 şifreleme bilgisi
- "SİZ DAHİL HİÇ KİMSE" vurgusu ile gizlilik garantisi
- Güvenlik özellikleri listesi

### 2. **API Key Güvenlik Uyarısı**
- Input alanının altında sarı uyarı mesajı
- "⚠️ Kaydettikten sonra bir daha görüntüleyemezsiniz!" uyarısı
- Görsel olarak dikkat çekici tasarım

### 3. **Endpoint Detayları**
- Her endpoint için ayrı kart tasarımı
- Endpoint başlığı (örn: "Drops - List Drops")
- Endpoint kodu (örn: `GET /v1/drops`)
- Endpoint açıklaması (ne için kullanıldığı)
- Onay ikonu ile görsel destek

---

## 🔧 TEKNİK DEĞİŞİKLİKLER

### Frontend Dosyaları

#### `views/pages/settings.html`
**Eklenen Bölümler:**

1. **API Key Bilgilendirme Kutusu**
```html
<div class="settings-info-box info-box-primary">
    <div class="info-box-icon">
        <i class="ph-bold ph-info"></i>
    </div>
    <div class="info-box-content">
        <h4 class="info-box-title">{{t:settings.farmlabs.infoBox.title}}</h4>
        <p class="info-box-text">{{t:settings.farmlabs.infoBox.description}}</p>
        <a href="https://dashboard.farmlabs.dev/user-api-keys" target="_blank" rel="noopener" class="info-box-link">
            <i class="ph-bold ph-arrow-square-out"></i>
            {{t:settings.farmlabs.infoBox.linkText}}
        </a>
    </div>
</div>
```

2. **Gerekli İzinler Kutusu**
```html
<div class="settings-info-box info-box-warning">
    <div class="info-box-icon">
        <i class="ph-bold ph-warning"></i>
    </div>
    <div class="info-box-content">
        <h4 class="info-box-title">{{t:settings.farmlabs.permissions.title}}</h4>
        <p class="info-box-text">{{t:settings.farmlabs.permissions.description}}</p>
        <div class="permissions-endpoints">
            <div class="endpoint-item">
                <div class="endpoint-header">
                    <i class="ph-bold ph-check-circle"></i>
                    <strong>Drops - List Drops</strong>
                </div>
                <code class="endpoint-code">GET /v1/drops</code>
                <p class="endpoint-desc">{{t:settings.farmlabs.permissions.listDrops}}</p>
            </div>
            <div class="endpoint-item">
                <div class="endpoint-header">
                    <i class="ph-bold ph-check-circle"></i>
                    <strong>Drops - View Drop Stats</strong>
                </div>
                <code class="endpoint-code">GET /v1/drops/stats</code>
                <p class="endpoint-desc">{{t:settings.farmlabs.permissions.viewStats}}</p>
            </div>
        </div>
        <p class="permissions-note">
            <i class="ph-bold ph-info"></i>
            {{t:settings.farmlabs.permissions.note}}
        </p>
    </div>
</div>
```

3. **Güvenlik Bilgisi Kutusu**
```html
<div class="settings-info-box info-box-success">
    <div class="info-box-icon">
        <i class="ph-bold ph-shield-check"></i>
    </div>
    <div class="info-box-content">
        <h4 class="info-box-title">{{t:settings.farmlabs.security.title}}</h4>
        <p class="info-box-text">{{t:settings.farmlabs.security.description}}</p>
        <ul class="security-features-list">
            <li>
                <i class="ph-bold ph-lock"></i>
                {{t:settings.farmlabs.security.encryption}}
            </li>
            <li>
                <i class="ph-bold ph-eye-slash"></i>
                {{t:settings.farmlabs.security.noDisplay}}
            </li>
            <li>
                <i class="ph-bold ph-shield"></i>
                {{t:settings.farmlabs.security.secure}}
            </li>
        </ul>
    </div>
</div>
```

4. **API Key Uyarısı**
```html
<small class="form-hint-settings form-hint-warning" id="apiKeyStatus">
    <i class="ph-bold ph-warning-circle"></i>
    {{t:settings.farmlabs.apiKeyStatusNotSaved}}
</small>
```

#### `public/css/dashboard.css`
**Eklenen CSS Sınıfları:**

1. **Bilgilendirme Kutuları**
```css
.settings-info-box { /* Genel kutu stili */ }
.info-box-primary { /* Mavi kutu */ }
.info-box-warning { /* Sarı kutu */ }
.info-box-success { /* Yeşil kutu */ }
.info-box-icon { /* İkon container */ }
.info-box-content { /* İçerik container */ }
.info-box-title { /* Başlık */ }
.info-box-text { /* Metin */ }
.info-box-link { /* Dış bağlantı */ }
```

2. **Endpoint Gösterimi**
```css
.permissions-endpoints { /* Endpoint listesi container */ }
.endpoint-item { /* Tek endpoint kartı */ }
.endpoint-header { /* Endpoint başlığı */ }
.endpoint-code { /* Endpoint kodu (GET /v1/drops) */ }
.endpoint-desc { /* Endpoint açıklaması */ }
.permissions-note { /* Alt not */ }
```

3. **Güvenlik Listesi**
```css
.security-features-list { /* Güvenlik özellikleri listesi */ }
.security-features-list li { /* Liste öğesi */ }
```

4. **Uyarı Mesajı**
```css
.form-hint-warning { /* Sarı uyarı mesajı */ }
```

### Çeviri Dosyaları

#### `lang/tr.json`
**Eklenen Çeviri Anahtarları:**

```json
{
  "settings": {
    "farmlabs": {
      "infoBox": {
        "title": "FarmLabs API Key Nasıl Alınır?",
        "description": "FarmLabs API key'inizi kullanarak drop verilerinizi otomatik olarak senkronize edebilirsiniz.",
        "linkText": "FarmLabs Dashboard'a Git"
      },
      "permissions": {
        "title": "Gerekli API İzinleri",
        "description": "API key oluştururken aşağıdaki endpoint'leri seçmeniz gerekmektedir:",
        "listDrops": "Drop verilerinizi listelemek ve çekmek için gereklidir",
        "viewStats": "Drop istatistiklerinizi görüntülemek için gereklidir",
        "note": "Not: Sadece bu 2 endpoint'i seçmeniz yeterlidir. \"View Drop\" endpoint'ine gerek yoktur."
      },
      "security": {
        "title": "Güvenlik ve Gizlilik",
        "description": "API key'iniz güvenli bir şekilde saklanır:",
        "encryption": "AES-256 şifreleme ile korunur",
        "noDisplay": "Kaydedildikten sonra SİZ DAHİL HİÇ KİMSE tarafından görüntülenemez",
        "secure": "Sadece sizin hesabınızdan erişilebilir"
      },
      "apiKeyStatusNotSaved": "⚠️ API key kaydedilmemiş - Kaydettikten sonra bir daha görüntüleyemezsiniz!"
    }
  }
}
```

#### `lang/en.json`
**Eklenen Çeviri Anahtarları:**

```json
{
  "settings": {
    "farmlabs": {
      "infoBox": {
        "title": "How to Get FarmLabs API Key?",
        "description": "You can automatically synchronize your drop data using your FarmLabs API key.",
        "linkText": "Go to FarmLabs Dashboard"
      },
      "permissions": {
        "title": "Required API Permissions",
        "description": "You need to select the following endpoints when creating your API key:",
        "listDrops": "Required to list and fetch your drop data",
        "viewStats": "Required to view your drop statistics",
        "note": "Note: You only need to select these 2 endpoints. \"View Drop\" endpoint is not required."
      },
      "security": {
        "title": "Security and Privacy",
        "description": "Your API key is stored securely:",
        "encryption": "Protected with AES-256 encryption",
        "noDisplay": "Cannot be viewed by ANYONE (including you) after saving",
        "secure": "Only accessible from your account"
      },
      "apiKeyStatusNotSaved": "⚠️ API key not saved - You won't be able to view it again after saving!"
    }
  }
}
```

---

## 🎨 UI/UX ÖZELLİKLERİ

### 1. **Renk Kodlaması**
- **Mavi (Primary):** Bilgilendirme ve yönlendirme
- **Sarı (Warning):** Dikkat gerektiren bilgiler ve izinler
- **Yeşil (Success):** Güvenlik ve başarı mesajları

### 2. **İkonlar**
- **Bilgi İkonu (ph-info):** Genel bilgilendirme
- **Uyarı İkonu (ph-warning):** Dikkat gerektiren konular
- **Kalkan İkonu (ph-shield-check):** Güvenlik özellikleri
- **Onay İkonu (ph-check-circle):** Endpoint onayları
- **Kilit İkonu (ph-lock):** Şifreleme
- **Göz Kapalı İkonu (ph-eye-slash):** Gizlilik
- **Dış Bağlantı İkonu (ph-arrow-square-out):** Harici linkler

### 3. **Tipografi**
- **Başlıklar:** 1.1rem, bold, açık renk
- **Açıklamalar:** 0.9rem, normal, gri renk
- **Endpoint Kodları:** Monospace font, sarı renk
- **Listeler:** 0.9rem, ikonlu, hizalı

### 4. **Animasyonlar**
- Hover efektleri (link'ler için)
- Smooth geçişler
- İkon renk değişimleri

---

## 📊 KULLANILAN ENDPOINT'LER

### Analiz Sonuçları

**Dosyalar İncelendi:**
- `src/services/farmlabsService.js`
- `src/controllers/farmlabsController.js`

**Kullanılan Endpoint'ler:**
1. `GET /v1/drops` - Drop listesini çekmek için
2. `GET /v1/drops/stats` - Drop istatistiklerini almak için

**Kullanılmayan Endpoint'ler:**
- ~~`GET /v1/bot-groups`~~ - Kullanılmıyor
- ~~`GET /v1/bots`~~ - Kullanılmıyor

**Sonuç:** Kullanıcıdan sadece "Drops" kategorisindeki 2 endpoint için izin istenmesi yeterlidir.

---

## 🔐 GÜVENLİK VE GİZLİLİK VURGULARI

### 1. **Şifreleme Bilgisi**
- AES-256-CBC algoritması kullanıldığı belirtildi
- Endüstri standardı güvenlik vurgulandı

### 2. **Gizlilik Garantisi**
- "SİZ DAHİL HİÇ KİMSE" ifadesi ile güçlü vurgu
- Kaydedildikten sonra görüntülenemez uyarısı
- Kullanıcı güveninin artırılması

### 3. **Erişim Kontrolü**
- Sadece kullanıcının kendi hesabından erişilebilir
- Yetkilendirme sistemi vurgulandı

### 4. **Görsel Uyarılar**
- Sarı renk ile dikkat çekme
- Uyarı ikonu kullanımı
- Input altında belirgin uyarı mesajı

---

## 📱 RESPONSIVE TASARIM

### Desktop (>768px)
- Yan yana bilgilendirme kutuları
- Geniş endpoint kartları
- Tam genişlik listeler

### Tablet & Mobile (<768px)
- Dikey sıralı bilgilendirme kutuları
- Merkezi hizalı içerik
- Küçük font boyutları
- Dikey sıralı endpoint kartları
- Merkezi hizalı ikonlar

---

## 🚀 KULLANICI DENEYİMİ İYİLEŞTİRMELERİ

### 1. **Bilgilendirme**
- Kullanıcı API key'i nereden alacağını biliyor
- Hangi izinleri vermesi gerektiğini görüyor
- Güvenlik konusunda bilgilendiriliyor

### 2. **Şeffaflık**
- Hangi endpoint'lerin kullanıldığı açıkça belirtildi
- Her endpoint'in amacı açıklandı
- Gereksiz izinler istenmediği vurgulandı

### 3. **Güven**
- Güvenlik önlemleri detaylı açıklandı
- Gizlilik garantisi verildi
- Profesyonel görünüm

### 4. **Yönlendirme**
- Direkt FarmLabs Dashboard linkı
- Açık ve net talimatlar
- Adım adım bilgilendirme

---

## 📊 İSTATİSTİKLER

- **Güncellenen dosya sayısı:** 4
- **Yeni CSS satırı:** ~150
- **Yeni çeviri anahtarı:** 12 (TR + EN)
- **Bilgilendirme kutusu:** 3
- **Endpoint detayı:** 2
- **Güvenlik özelliği:** 3

---

## ✅ TEST KONTROL LİSTESİ

- [x] Bilgilendirme kutuları görüntüleniyor
- [x] Endpoint detayları doğru gösteriliyor
- [x] Güvenlik listesi çalışıyor
- [x] API key uyarısı görünüyor
- [x] Dış bağlantı açılıyor (yeni sekmede)
- [x] Responsive tasarım çalışıyor
- [x] Çeviriler doğru
- [x] İkonlar doğru gösteriliyor
- [x] Renk kodlaması doğru
- [x] Hover efektleri çalışıyor

---

## 🐛 BİLİNEN SORUNLAR

Şu anda bilinen sorun yok.

---

## 🔮 GELECEK GELİŞTİRMELER

- [ ] API key test sonucu gösterimi
- [ ] Son senkronizasyon zamanı gösterimi
- [ ] API kullanım istatistikleri
- [ ] Hata durumunda detaylı bilgilendirme
- [ ] API key yenileme hatırlatıcısı

---

## 👥 KATKILAR

- Kiro AI Asistanı - Tam uygulama

---

**Değişiklik Kaydı V5 Sonu**
