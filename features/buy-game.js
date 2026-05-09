/**
 * buy-game.js
 * ══════════════════════════════════════════════════════════════
 *  Steam mağazasından bakiye kullanarak programatik oyun satın alır.
 *  Tarayıcı otomasyonu (Playwright) KULLANMAZ, doğrudan HTTP
 *  API istekleri atarak (community.request) checkout yapar.
 *
 *  Kullanım:
 *    node features/buy-game.js [kullanici_adi] [subid]
 *
 *  Örnek:
 *    node features/buy-game.js sonsuztech81682 124923  (Zup! X)
 * ══════════════════════════════════════════════════════════════
 */

'use strict';

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const SteamUser      = require('steam-user');
const SteamCommunity = require('steamcommunity');
const SteamTotp      = require('steam-totp');
const Database       = require('better-sqlite3');
const path           = require('path');
const { decrypt }    = require('../src/utils/encryption');

const TARGET = process.argv[2];
const SUB_ID = process.argv[3] || '124923'; // Zup! X default
const DB_PATH = path.resolve(__dirname, '..', process.env.DB_PATH || 'data/database.sqlite');

if (!TARGET) {
    console.error('Kullanım: node buy-game.js <hesap_adi> [sub_id]');
    process.exit(1);
}

// ── Renkler ve Yardımcılar ─────────────────────────────────────
const C = { reset:'\x1b[0m', bold:'\x1b[1m', red:'\x1b[31m', green:'\x1b[32m', yellow:'\x1b[33m', cyan:'\x1b[36m', gray:'\x1b[90m' };
const ok   = (s) => `${C.green}✅ ${s}${C.reset}`;
const er   = (s) => `${C.red}❌ ${s}${C.reset}`;
const info = (s) => `${C.cyan}ℹ️  ${s}${C.reset}`;
const dim  = (s) => `${C.gray}${s}${C.reset}`;

function section(title) {
    console.log(`\n${C.bold}${C.cyan}── ${title} ${'─'.repeat(Math.max(0, 48 - title.length))}${C.reset}`);
}

// ── İnsan Gecikmesi ───────────────────────────────────────────
function delay(ms) {
    return new Promise(r => setTimeout(r, ms));
}

// ── HTTP API Sarmalayıcıları ──────────────────────────────────
function getCheckoutPage(community) {
    return new Promise((resolve, reject) => {
        community.request.get({
            uri: 'https://store.steampowered.com/checkout/?purchasetype=updatecart',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9',
                'Referer': 'https://store.steampowered.com/cart/'
            }
        }, (err, resp, body) => {
            if (err) return reject(err);
            resolve({ status: resp.statusCode, body });
        });
    });
}

function addToCart(community, subid, sessionid) {
    return new Promise((resolve, reject) => {
        community.request.post({
            uri: 'https://store.steampowered.com/cart/',
            form: {
                action: 'add_to_cart',
                sessionid: sessionid,
                subid: subid
            },
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                'Origin': 'https://store.steampowered.com',
                'Referer': `https://store.steampowered.com/search/?term=${subid}`
            },
            followAllRedirects: true
        }, (err, resp, body) => {
            if (err) return reject(err);
            resolve({ status: resp.statusCode, body });
        });
    });
}

function apiPost(community, url, form) {
    return new Promise((resolve, reject) => {
        community.request.post({
            uri: url,
            form: form,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                'Origin': 'https://store.steampowered.com',
                'Referer': 'https://store.steampowered.com/checkout/',
                'X-Requested-With': 'XMLHttpRequest'
            },
            json: true
        }, (err, resp, body) => {
            if (err) return reject(err);
            resolve({ status: resp.statusCode, body });
        });
    });
}

// ── ANA FONKSİYON ─────────────────────────────────────────────
async function main() {
    console.log(`\n${C.bold}${'═'.repeat(52)}`);
    console.log(`  Steam Game Buyer  –  ${TARGET}`);
    console.log(`  Satın alınacak SubID: ${SUB_ID}`);
    console.log(`${'═'.repeat(52)}${C.reset}\n`);

    // 1. Veritabanı
    section('Veritabanı');
    const db = new Database(DB_PATH, { readonly: true });
    const account = db.prepare(
        `SELECT username, password, shared_secret, refresh_token
         FROM steam_accounts WHERE LOWER(username) = LOWER(?) LIMIT 1`
    ).get(TARGET);
    db.close();

    if (!account) { console.log(er(`"${TARGET}" bulunamadı.`)); process.exit(1); }
    console.log(ok(`Hesap: ${account.username}`));

    const password     = decrypt(account.password);
    const sharedSecret = decrypt(account.shared_secret);

    // 2. Steam Login
    section('Steam Login');
    console.log(info('Giriş yapılıyor…'));

    let sessionCookies = [];

    const { client, community } = await new Promise((resolve, reject) => {
        const client    = new SteamUser({ enablePicsCache: false });
        const community = new SteamCommunity();
        let done = false;

        const done_ = (v) => { if (done) return; done = true; clearTimeout(t); resolve(v); };
        const fail_ = (m) => { if (done) return; done = true; clearTimeout(t); try { client.logOff(); } catch(_){} reject(new Error(m)); };

        const t = setTimeout(() => fail_('Login zaman aşımı'), 60000);
        client.on('error', e => fail_(e?.message || String(e)));

        client.once('webSession', (_, cookies) => {
            sessionCookies = cookies;
            community.setCookies(cookies);
            console.log(ok(`Giriş başarılı  →  ${client.steamID.getSteamID64()}`));
            done_({ client, community });
        });

        const rt = account.refresh_token;
        if (rt && !rt.startsWith('[') && !rt.startsWith('{')) {
            console.log(dim('  Yöntem: refresh token'));
            client.logOn({ refreshToken: rt });
        } else {
            console.log(dim('  Yöntem: kullanıcı adı + şifre + TOTP'));
            client.logOn({ accountName: account.username, password, twoFactorCode: SteamTotp.generateAuthCode(sharedSecret) });
        }
    });

    const sessionIdMatch = sessionCookies.find(c => c.startsWith('sessionid='));
    const sessionId = sessionIdMatch ? sessionIdMatch.split('=')[1].split(';')[0] : null;

    if (!sessionId) {
        console.log(er('Cookies arasından sessionid bulunamadı!'));
        process.exit(1);
    }
    console.log(dim(`  Session ID: ${sessionId}`));

    await delay(2000);

    // 3. Sepete Ekle
    section('Sepete Ekleme');
    console.log(info(`SubID ${SUB_ID} sepete ekleniyor...`));
    await addToCart(community, SUB_ID, sessionId);
    console.log(ok('Sepet isteği gönderildi.'));
    
    await delay(3000);

    // 4. Checkout Sayfasından Gerekli Parametreleri Çek
    section('Ödeme (Checkout) Hazırlığı');
    console.log(info('Checkout sayfası yükleniyor...'));
    const { body: checkoutHtml } = await getCheckoutPage(community);

    // Parse g_gidShoppingCart
    const gidCartMatch = checkoutHtml.match(/g_gidShoppingCart\s*=\s*"([^"]+)"/);
    if (!gidCartMatch) {
        console.log(er('Checkout sayfasından Sepet ID (gidShoppingCart) bulunamadı.'));
        console.log(dim('Not: Oyun zaten kütüphanede olabilir veya sepet boş kaldı.'));
        process.exit(1);
    }
    const gidShoppingCart = gidCartMatch[1];
    console.log(ok(`Sepet ID: ${gidShoppingCart}`));

    // Parse Country & Billing info status
    const countryMatch = checkoutHtml.match(/g_strCountryCode\s*=\s*"([^"]+)"/);
    const country = countryMatch ? countryMatch[1] : 'US';
    
    const billingMatch = checkoutHtml.match(/g_bHasStoreBillingInfo\s*=\s*(true|false)/);
    const hasBilling = billingMatch && billingMatch[1] === 'true';

    console.log(dim(`  Ülke (Cüzdan): ${country}`));
    console.log(dim(`  Kayıtlı Fatura Adresi Var Mı?: ${hasBilling ? 'Evet' : 'Hayır'}`));

    await delay(2000);

    // 5. InitTransaction
    section('Ödeme İşlemini Başlat (InitTransaction)');
    console.log(info('Steam Wallet ile ödeme başlatılıyor...'));

    const initForm = {
        gidShoppingCart: gidShoppingCart,
        PaymentMethod: 'steamaccount',
        SaveBillingAddress: 1,
        bInfoSharedWithPublisher: 0,
        sessionid: sessionId
    };

    // Eğer kayıtlı adres yoksa, Steam'in kızmaması için dummy veriler ekle
    if (!hasBilling) {
        console.log(dim('  Eksik fatura bilgileri geçici verilerle dolduruluyor...'));
        initForm.FirstName = 'Sonsuz';
        initForm.LastName = 'Tech';
        initForm.Address = '123 Tech Street';
        initForm.City = 'Istanbul'; // veya New York
        initForm.Country = country;
        initForm.PostCode = '34000'; // US ise 10001
        if (country === 'US') {
            initForm.City = 'New York';
            initForm.State = 'NY';
            initForm.PostCode = '10001';
        }
        initForm.Phone = '+905551234567';
    }

    const { body: initResult } = await apiPost(community, 'https://store.steampowered.com/checkout/inittransaction/', initForm);

    if (initResult && initResult.success === 1) {
        const transid = initResult.transid;
        console.log(ok(`InitTransaction başarılı. İşlem ID: ${transid}`));

        await delay(2000);

        // 6. FinalizeTransaction
        section('Siparişi Tamamla (FinalizeTransaction)');
        console.log(info('Ödeme onaylanıyor...'));

        const finalizeForm = {
            transid: transid,
            sessionid: sessionId
        };

        const { body: finalizeResult } = await apiPost(community, 'https://store.steampowered.com/checkout/finalizetransaction/', finalizeForm);

        if (finalizeResult && finalizeResult.success === 1) {
            console.log(`\n  ${C.bold}${C.green}🎉 BAŞARILI! Oyun Steam Cüzdanı ile satın alındı.${C.reset}`);
            if (finalizeResult.purchaseresultdetail) {
                console.log(dim(`  Detay Kodu: ${finalizeResult.purchaseresultdetail}`));
            }
        } else {
            console.log(`\n  ${C.bold}${C.red}❌ Finalize işlemi başarısız!${C.reset}`);
            console.log(initResult);
        }

    } else {
        console.log(`\n  ${C.bold}${C.red}❌ InitTransaction (Ödeme Başlatma) Başarısız!${C.reset}`);
        console.log(dim('Hata Yanıtı:'));
        console.dir(initResult, { depth: null, colors: true });

        // Yetersiz bakiye mi?
        if (initResult && initResult.purchaseresultdetail === 33) {
            console.log(er('Hata: Cüzdan bakiyesi yetersiz! (purchaseresultdetail: 33)'));
        }
    }

    console.log(`\n${C.bold}${'═'.repeat(52)}${C.reset}\n`);
    try { client.logOff(); } catch(_) {}
}

main().catch(e => {
    console.error(`\n${C.red}${C.bold}❌ Beklenmeyen Hata: ${e.message}${C.reset}\n`);
    process.exit(1);
});
