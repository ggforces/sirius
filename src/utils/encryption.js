const crypto = require('crypto');
require('dotenv').config();

// Şifreleme anahtarı - .env dosyasından alınır
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
const ALGORITHM = 'aes-256-cbc';

// Şifreleme anahtarını Buffer'a çevir (32 byte)
const key = Buffer.from(ENCRYPTION_KEY.slice(0, 64), 'hex');

/**
 * Metni şifrele
 * @param {string} text - Şifrelenecek metin
 * @returns {string} - Şifrelenmiş metin (iv:encryptedData formatında)
 */
function encrypt(text) {
    if (!text) return null;
    
    try {
        // Random IV (Initialization Vector) oluştur
        const iv = crypto.randomBytes(16);
        
        // Cipher oluştur
        const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
        
        // Şifrele
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        
        // IV ve şifrelenmiş veriyi birleştir
        return iv.toString('hex') + ':' + encrypted;
    } catch (error) {
        console.error('Encryption error:', error);
        throw new Error('Şifreleme hatası');
    }
}

/**
 * Şifrelenmiş metni çöz
 * @param {string} encryptedText - Şifrelenmiş metin (iv:encryptedData formatında)
 * @returns {string} - Çözülmüş metin
 */
function decrypt(encryptedText) {
    if (!encryptedText) return null;
    
    try {
        // IV ve şifrelenmiş veriyi ayır
        const parts = encryptedText.split(':');
        if (parts.length !== 2) {
            throw new Error('Geçersiz şifrelenmiş veri formatı');
        }
        
        const iv = Buffer.from(parts[0], 'hex');
        const encrypted = parts[1];
        
        // Decipher oluştur
        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
        
        // Şifreyi çöz
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        
        return decrypted;
    } catch (error) {
        console.error('Decryption error:', error);
        throw new Error('Şifre çözme hatası');
    }
}

/**
 * Şifreleme anahtarını kontrol et ve gerekirse oluştur
 */
function checkEncryptionKey() {
    if (!process.env.ENCRYPTION_KEY) {
        console.warn('⚠️  ENCRYPTION_KEY bulunamadı! .env dosyasına ekleyin:');
        console.warn(`ENCRYPTION_KEY=${ENCRYPTION_KEY}`);
        return false;
    }
    return true;
}

module.exports = {
    encrypt,
    decrypt,
    checkEncryptionKey
};
