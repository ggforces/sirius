'use strict';

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const SteamUser      = require('steam-user');
const SteamCommunity = require('steamcommunity');
const SteamTotp      = require('steam-totp');
const Database       = require('better-sqlite3');
const path           = require('path');
const { decrypt }    = require('../src/utils/encryption');

const TARGET   = process.argv[2] || 'sonsuztech97397';
const DB_PATH  = path.resolve(__dirname, '..', process.env.DB_PATH || 'data/database.sqlite');
const HELP_URL = 'https://help.steampowered.com/en/wizard/HelpWhyCantIMarket';

// ── Renk yardımcıları ─────────────────────────────────────────
const C = { reset:'\x1b[0m', bold:'\x1b[1m', red:'\x1b[31m', green:'\x1b[32m', yellow:'\x1b[33m', cyan:'\x1b[36m', gray:'\x1b[90m' };
const ok   = (s) => `${C.green}✅ ${s}${C.reset}`;
const er   = (s) => `${C.red}❌ ${s}${C.reset}`;
const info = (s) => `${C.cyan}ℹ️  ${s}${C.reset}`;
const dim  = (s) => `${C.gray}${s}${C.reset}`;
const hi   = (s) => `${C.bold}${C.yellow}${s}${C.reset}`;

function section(title) {
    console.log(`\n${C.bold}${C.cyan}── ${title} ${'─'.repeat(Math.max(0, 48 - title.length))}${C.reset}`);
}

// ── İnsan gecikme ─────────────────────────────────────────────
function humanDelay(min = 4000, max = 9000) {
    const ms = Math.floor(Math.random() * (max - min + 1)) + min;
    console.log(info(`Bot tespitini önlemek için ${(ms / 1000).toFixed(1)}s bekleniyor…`));
    return new Promise(r => setTimeout(r, ms));
}

// ── community.request ile GET ─────────────────────────────────
function sessionGet(community, url) {
    return new Promise((resolve, reject) => {
        community.request.get({
            uri    : url,
            headers: {
                'User-Agent'     : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                'Accept'         : 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Referer'        : 'https://store.steampowered.com/',
            },
            followRedirect: true,
            timeout       : 20_000,
        }, (err, resp, body) => {
            if (err) return reject(err);
            resolve({ status: resp.statusCode, body: body || '' });
        });
    });
}

// ── Kalan süreyi TR formatında yaz ───────────────────────────
function formatRemaining(ms) {
    if (!ms || ms <= 0) return 'Süresi dolmuş';
    const d = Math.floor(ms / 86400000);
    const h = Math.floor((ms % 86400000) / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    return [d && `${d} gün`, h && `${h} saat`, m && `${m} dakika`].filter(Boolean).join(', ') || '< 1 dakika';
}

// ── Help sayfasını parse et ───────────────────────────────────
function parsePage(html) {
    // Tag'leri temizleyerek düz metin üret — ban tespiti için daha güvenilir
    const plainText = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

    // Pazar kısıtlaması var mı? (HTML tag içine sıkışmış olabilir, düz metinde ara)
    const banned = /unable to use the Steam Community Market/i.test(plainText);

    // Neden — çok satırlı kalıpları kapsıyoruz
    let reason = null;
    const reasonPatterns = [
        /The account must have[^.]{10,300}\./i,          // satın alma yaşı kısıtı
        /New accounts are limited[^.]{10,300}\./i,        // yeni hesap limiti
        /spend.*?\$[\d.]+ USD[^.]{0,200}\./i,            // $5 harcama şartı
        /Your account[^.]{10,200}\./i,                   // genel hesap kısıtı
    ];
    for (const pat of reasonPatterns) {
        const m = plainText.match(pat);
        if (m) { reason = m[0].replace(/\s+/g, ' ').trim(); break; }
    }

    // Kalan süre → "This restriction will expire in 5 days, 20 hours and 17 minutes."
    let expireIn = null, expireInMs = null, expireAt = null;
    const expMatch = plainText.match(/[Tt]his restriction will expire in\s+([^.]{5,120})\./);
    if (expMatch) {
        expireIn = expMatch[1].trim();
        const d = parseInt((expireIn.match(/(\d+)\s*day/)    || [])[1] || 0);
        const h = parseInt((expireIn.match(/(\d+)\s*hour/)   || [])[1] || 0);
        const m = parseInt((expireIn.match(/(\d+)\s*minute/) || [])[1] || 0);
        expireInMs = (d * 86400 + h * 3600 + m * 60) * 1000;
        expireAt   = new Date(Date.now() + expireInMs).toISOString();
    }

    // $5 harcama şartı gibi "koşula bağlı" kısıtlamalar — expire süresi olmaz
    const conditionRequired = /spend.*?\$[\d.]+ USD|add.*?\$[\d.]+ USD/i.test(plainText);

    return { banned, reason, expireIn, expireInMs, expireAt, conditionRequired };
}

// ── ANA FONKSİYON ─────────────────────────────────────────────
async function main() {
    console.log(`\n${C.bold}${'═'.repeat(52)}`);
    console.log(`  Market Ban Checker  –  ${TARGET}`);
    console.log(`${'═'.repeat(52)}${C.reset}\n`);

    // 1) Veritabanı
    section('Veritabanı');
    const db = new Database(DB_PATH, { readonly: true });
    const account = db.prepare(
        `SELECT username, password, shared_secret, refresh_token
         FROM steam_accounts WHERE LOWER(username) = LOWER(?) LIMIT 1`
    ).get(TARGET);
    db.close();

    if (!account) { console.log(er(`"${TARGET}" bulunamadı.`)); process.exit(1); }
    console.log(ok(`Hesap bulundu: ${account.username}`));

    const password     = decrypt(account.password);
    const sharedSecret = decrypt(account.shared_secret);

    // 2) Steam Login
    section('Steam Login');
    console.log(info('Giriş yapılıyor…'));

    const { client, community } = await new Promise((resolve, reject) => {
        const client    = new SteamUser({ enablePicsCache: false });
        const community = new SteamCommunity();
        let done = false;

        const done_ = (v) => { if (done) return; done = true; clearTimeout(t); resolve(v); };
        const fail_ = (m) => { if (done) return; done = true; clearTimeout(t); try { client.logOff(); } catch(_){} reject(new Error(m)); };

        const t = setTimeout(() => fail_('Login zaman aşımı'), 60_000);
        client.on('error', e => fail_(e?.message || String(e)));

        client.once('webSession', (_, cookies) => {
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

    // 3) İnsan gecikme
    section('Bekleme');
    await humanDelay(4000, 9000);

    // 4) Help sayfası
    section('Steam Help Sayfası');
    console.log(info(HELP_URL));
    console.log(dim('  community.request (mevcut oturum) kullanılıyor…'));

    const { status, body } = await sessionGet(community, HELP_URL);
    console.log(ok(`HTTP ${status}  —  ${body.length.toLocaleString()} karakter`));

    // DEBUG: Ham HTML'yi kaydet
    const fs = require('fs');
    fs.writeFileSync(`./debug_${TARGET}.html`, body, 'utf8');
    console.log(dim(`  Debug HTML → debug_${TARGET}.html`));

    const result = parsePage(body);

    // 5) Sonuç
    section('Sonuç');

    if (!result.banned) {
        console.log(ok('Market kısıtlaması yok. Hesap pazarı kullanabilir.'));
    } else {
        console.log(`  ${C.bold}${C.red}🚫 MARKET KISITLAMASI MEVCUT${C.reset}\n`);

        if (result.reason) {
            console.log(`  ${C.bold}Neden:${C.reset}`);
            console.log(`  └─ ${dim(result.reason)}\n`);
        }

        if (result.expireIn) {
            // Zamana bağlı kısıtlama — kalan süre var
            const remaining = formatRemaining(result.expireInMs);
            const expireDate = new Date(result.expireAt).toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' });
            console.log(`  ${C.bold}⏳ Kalan Süre:${C.reset}`);
            console.log(`  ├─ ${hi(remaining)}`);
            console.log(`  └─ Bitiş: ${hi(expireDate)}`);
        } else if (result.conditionRequired) {
            // Koşula bağlı kısıtlama — limited hesap, bitiş tarihi yok
            console.log(`  ${C.bold}💳 Bitiş Tarihi:${C.reset}`);
            console.log(`  └─ ${hi('LIMITED')} ${C.gray}(hesap $5.00 USD harcayana kadar)${C.reset}`);
        } else {
            // Kısıtlama var ama tip tanımlanamadı
            console.log(`  ${C.yellow}⚠️  Kısıtlama türü belirlenemedi — HTML dosyasını incele.${C.reset}`);
        }
    }

    console.log(`\n${C.bold}${'═'.repeat(52)}${C.reset}\n`);
    try { client.logOff(); } catch(_) {}
}

main().catch(e => {
    console.error(`\n${C.red}${C.bold}❌ ${e.message}${C.reset}\n`);
    process.exit(1);
});
