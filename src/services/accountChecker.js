const SteamUser = require('steam-user');
const SteamCommunity = require('steamcommunity');
const SteamTotp = require('steam-totp');
const Request = require('request');
const db = require('../config/database');
const { decrypt } = require('../utils/encryption');

const PRIME_APP_ID = 624820;
const FREE_PAYMENT_METHODS = new Set([0, 128]);

function parseTradeUnlockDate(descriptions) {
    for (const desc of descriptions || []) {
        if (desc.value && desc.value.includes('trade-protected')) {
            const match = desc.value.match(/until (.+? GMT)/);
            if (match) {
                const parsed = new Date(match[1]);
                if (!isNaN(parsed)) return parsed;
            }
        }
    }
    return null;
}

function fetchContext16(community, steamID) {
    return new Promise((res) => {
        community.httpRequest({
            uri: `https://steamcommunity.com/inventory/${steamID}/730/16`,
            qs: { l: 'english', count: 1000 },
            json: true
        }, (err, response, body) => {
            if (err || !body?.assets || !body?.descriptions) return res([]);
            const descMap = {};
            for (const d of body.descriptions) descMap[d.classid + '_' + d.instanceid] = d;
            res(body.assets.map(asset => {
                const desc = descMap[asset.classid + '_' + asset.instanceid] || {};
                return {
                    assetid: asset.assetid ?? null,
                    market_hash_name: desc.market_hash_name || null,
                    tradable: desc.tradable ? 1 : 0,
                    trade_unlock_at: parseTradeUnlockDate(desc.owner_descriptions)
                };
            }));
        }, 'steamcommunity');
    });
}

async function checkAccount(account, proxy = null) {
    // Decrypt account data
    const decryptedAccount = {
        ...account,
        password: decrypt(account.password),
        shared_secret: decrypt(account.shared_secret),
        identity_secret: decrypt(account.identity_secret)
    };

    if (!decryptedAccount.shared_secret || !decryptedAccount.identity_secret) {
        throw new Error('shared_secret/identity_secret eksik');
    }

    return new Promise((resolve, reject) => {
        // Configure proxy if provided
        const clientOptions = { enablePicsCache: true };
        
        if (proxy) {
            // Decrypt proxy password if it exists
            const proxyUsername = proxy.username;
            const proxyPassword = proxy.password ? decrypt(proxy.password) : null;
            
            // Build proxy URL with proper authentication
            let proxyUrl;
            if (proxyUsername && proxyPassword) {
                // Encode username and password to handle special characters
                const encodedUsername = encodeURIComponent(proxyUsername);
                const encodedPassword = encodeURIComponent(proxyPassword);
                proxyUrl = `http://${encodedUsername}:${encodedPassword}@${proxy.ip}:${proxy.port}`;
            } else {
                // No authentication required
                proxyUrl = `http://${proxy.ip}:${proxy.port}`;
            }
            
            clientOptions.httpProxy = proxyUrl;
        }
        
        const client = new SteamUser(clientOptions);
        const community = new SteamCommunity();
        
        // Configure community proxy if provided
        if (proxy) {
            // Decrypt proxy password if it exists
            const proxyUsername = proxy.username;
            const proxyPassword = proxy.password ? decrypt(proxy.password) : null;
            
            let proxyUrl;
            if (proxyUsername && proxyPassword) {
                const encodedUsername = encodeURIComponent(proxyUsername);
                const encodedPassword = encodeURIComponent(proxyPassword);
                proxyUrl = `http://${encodedUsername}:${encodedPassword}@${proxy.ip}:${proxy.port}`;
            } else {
                proxyUrl = `http://${proxy.ip}:${proxy.port}`;
            }
            
            community.request = Request.defaults({ proxy: proxyUrl });
        }

        let accountFlags = 0;
        let limitedValue = null;
        const timeout = setTimeout(() => { 
            client.logOff(); 
            reject(new Error('Login timeout')); 
        }, 60000);

        client.on('error', (err) => {
            clearTimeout(timeout);
            reject(new Error(err?.message || err?.eresult?.toString() || String(err) || 'Bilinmeyen Steam hatası'));
        });

        client.once('loggedOn', (details) => {
            accountFlags = details.account_flags;
            client.on('refreshToken', (token) => {
                db.prepare('UPDATE steam_accounts SET refresh_token = ? WHERE id = ?').run(token, account.id);
            });
            client.setPersona(SteamUser.EPersonaState.Offline);
        });

        client.once('wallet', (hasWallet, currency, balance) => {
            const isLimited = !!(accountFlags & 4096);
            limitedValue = !isLimited ? 0 : (hasWallet && balance > 0) ? 2 : 1;
            const walletBalance = hasWallet ? balance : 0;
            const walletCurrency = hasWallet ? (currency === 1 ? 'USD' : String(currency)) : 'USD';
            
            db.prepare('UPDATE steam_accounts SET limited = ?, wallet_balance = ?, wallet_currency = ? WHERE id = ?')
              .run(limitedValue, walletBalance, walletCurrency, account.id);
        });

        client.once('webSession', async (sessionId, cookies) => {
            community.setCookies(cookies);
            const steamID64 = client.steamID.getSteamID64();

            const tradeLinkPromise = new Promise(res => {
                // Try to get trade URL from Steam Community
                community.getTradeURL((err, url) => {
                    if (!err && url) {
                        return res(url);
                    }
                    
                    // Fallback: Try to fetch from trade offer preferences page
                    community.httpRequest({
                        uri: 'https://steamcommunity.com/profiles/' + steamID64 + '/tradeoffers/privacy',
                        method: 'GET'
                    }, (err2, response, body) => {
                        if (err2 || !body) {
                            return res(null);
                        }
                        
                        // Extract trade URL from page HTML
                        const match = body.match(/https:\/\/steamcommunity\.com\/tradeoffer\/new\/\?partner=\d+&token=[a-zA-Z0-9_-]+/);
                        res(match ? match[0] : null);
                    });
                });
            });

            const ownershipPromise = new Promise(res => {
                const t = setTimeout(() => res({ isPrime: false, firstPurchaseAt: null }), 30000);
                client.once('ownershipCached', () => {
                    clearTimeout(t);
                    const isPrime = (client.getOwnedApps() || []).includes(PRIME_APP_ID);
                    const oneYearAgo = Date.now() - 365 * 24 * 60 * 60 * 1000;
                    const paidLicenses = (client.licenses || []).filter(l =>
                        !FREE_PAYMENT_METHODS.has(l.payment_method) && l.package_id !== 0
                    );
                    const recent = paidLicenses.filter(l => l.time_created * 1000 >= oneYearAgo);
                    const firstPurchaseAt = recent.length > 0
                        ? new Date(Math.min(...recent.map(l => l.time_created * 1000))).toISOString()
                        : null;
                    res({ isPrime, firstPurchaseAt });
                });
            });

            const tfaPromise = new Promise(res => {
                const accessToken = client._getLoginSession?.()?.accessToken;
                if (!accessToken) return res(null);
                community.httpRequest({
                    uri: 'https://api.steampowered.com/ITwoFactorService/QueryStatus/v1/',
                    method: 'POST',
                    form: { steamid: steamID64, access_token: accessToken },
                    json: true
                }, (err, r, body) => {
                    const t = body?.response?.time_created;
                    res(t ? new Date(t * 1000).toISOString() : null);
                }, 'steamcommunity');
            });

            const ctx2Promise = new Promise((res, rej) =>
                community.getUserInventoryContents(client.steamID, 730, 2, true, (err, inv) => err ? res([]) : res(inv))
            );

            try {
                const [{ isPrime, firstPurchaseAt }, tradeLink, tfaEnabledAt, ctx2, ctx16] = await Promise.all([
                    ownershipPromise, tradeLinkPromise, tfaPromise, ctx2Promise,
                    fetchContext16(community, steamID64)
                ]);

                // Guard ban: ctx16'daki en erken trade_unlock_at
                const unlockDates = ctx16.map(i => i.trade_unlock_at).filter(Boolean);
                const guardBanUntil = unlockDates.length > 0
                    ? new Date(Math.min(...unlockDates.map(d => d.getTime()))).toISOString()
                    : null;

                // Update account info
                db.prepare(`
                    UPDATE steam_accounts SET 
                        is_prime = ?, 
                        first_purchase_at = ?, 
                        steamid = ?,
                        trade_link = ?, 
                        tfa_enabled_at = ?, 
                        last_checked_at = datetime('now') 
                    WHERE id = ?
                `).run(
                    isPrime ? 1 : 0, 
                    firstPurchaseAt, 
                    steamID64, 
                    tradeLink, 
                    tfaEnabledAt, 
                    account.id
                );

                // Save inventory
                db.prepare('DELETE FROM inventories WHERE account_id = ?').run(account.id);
                
                const insertInventory = db.prepare(`
                    INSERT INTO inventories (account_id, assetid, market_hash_name, tradable, trade_unlock_at, context) 
                    VALUES (?, ?, ?, ?, ?, ?)
                `);

                for (const item of ctx2) {
                    insertInventory.run(
                        account.id, 
                        item.assetid ?? null, 
                        item.market_hash_name ?? null, 
                        1, 
                        null, 
                        2
                    );
                }

                for (const item of ctx16) {
                    insertInventory.run(
                        account.id, 
                        item.assetid ?? null, 
                        item.market_hash_name ?? null, 
                        0, 
                        item.trade_unlock_at ? item.trade_unlock_at.toISOString() : null, 
                        16
                    );
                }

                clearTimeout(timeout);
                client.once('disconnected', () => {
                    resolve({
                        isPrime, 
                        firstPurchaseAt, 
                        limited: limitedValue,
                        ctx2: ctx2.length, 
                        ctx16: ctx16.length,
                        guardBanUntil,
                        tfaEnabledAt,
                        walletBalance: db.prepare('SELECT wallet_balance FROM steam_accounts WHERE id = ?').get(account.id)?.wallet_balance ?? 0,
                        walletCurrency: db.prepare('SELECT wallet_currency FROM steam_accounts WHERE id = ?').get(account.id)?.wallet_currency ?? 'USD',
                        steamid: steamID64,
                        tradeLink
                    });
                });
                client.logOff();
            } catch (err) {
                clearTimeout(timeout);
                client.logOff();
                setTimeout(() => reject(err), 500);
            }
        });

        const refreshToken = decryptedAccount.refresh_token;
        if (refreshToken && !refreshToken.startsWith('[') && !refreshToken.startsWith('{')) {
            client.logOn({ refreshToken });
        } else {
            client.logOn({
                accountName: decryptedAccount.username,
                password: decryptedAccount.password,
                twoFactorCode: SteamTotp.generateAuthCode(decryptedAccount.shared_secret)
            });
        }
    });
}

module.exports = {
    checkAccount
};