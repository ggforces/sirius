# Bugfix Requirements Document

## Introduction

"Hesap Ekle" modalında scroll bar problemi bulunmaktadır. Modal içeriği (Steam hesap bilgileri girme formu) popup'a tam olarak sığmamakta ve gereksiz scroll bar görünmektedir. Bu durum kullanıcı deneyimini olumsuz etkilemekte ve modal'ın görsel bütünlüğünü bozmaktadır.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN "Hesap Ekle" modalı açıldığında THEN modal içeriği popup'a tam sığmaz ve scroll bar görünür

1.2 WHEN modal içeriğinde 4 form alanı (Kullanıcı Adı, Şifre, Shared Secret, Identity Secret) bulunduğunda THEN modal yüksekliği yetersiz kalır ve dikey scroll gerekir

1.3 WHEN modal-body için max-height: calc(95vh - 140px) ve overflow-y: auto tanımlandığında THEN gereksiz scroll bar oluşur

### Expected Behavior (Correct)

2.1 WHEN "Hesap Ekle" modalı açıldığında THEN modal içeriği popup'a tam sığmalı ve scroll bar görünmemeli

2.2 WHEN modal içeriğinde 4 form alanı bulunduğunda THEN modal yüksekliği tüm içeriği gösterecek şekilde otomatik ayarlanmalı

2.3 WHEN modal boyutları ayarlandığında THEN içerik alanı scroll olmadan tüm form elemanlarını gösterebilmeli

### Unchanged Behavior (Regression Prevention)

3.1 WHEN modal responsive tasarımda mobil cihazlarda açıldığında THEN mevcut responsive davranış korunmalı

3.2 WHEN modal animasyonları çalıştığında THEN modalSlideIn animasyonu ve diğer geçiş efektleri değişmemeli

3.3 WHEN modal kapatma işlemleri yapıldığında THEN modal-close butonu ve overlay tıklama davranışları korunmalı

3.4 WHEN diğer modaller (Delete Modal, Bulk Check Modal) açıldığında THEN bu modallerin mevcut davranışları etkilenmemeli