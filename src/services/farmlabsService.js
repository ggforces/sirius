/**
 * FarmLabs API Service
 * FarmLabs API ile iletişim kurar ve drop verilerini senkronize eder
 */

const FARMLABS_API_BASE = 'https://dashboard.farmlabs.dev/api/v1';

/**
 * Haftanın başlangıcını çarşamba olarak hesaplar
 * Steam haftalık drop sistemi çarşamba günü resetlenir
 */
function getWednesdayWeekStart(date) {
    const d = new Date(date);
    // Çarşamba = 3, Pazar = 0
    // (d.getDay() + 4) % 7 ile çarşambaya olan gün farkını buluyoruz
    const daysToWednesday = (d.getDay() + 4) % 7;
    const ws = new Date(d);
    ws.setDate(d.getDate() - daysToWednesday);
    ws.setHours(0, 0, 0, 0);
    return ws;
}

/**
 * FarmLabs API'den tüm drop'ları çeker (pagination ile)
 */
async function fetchAllDrops(apiKey, options = {}) {
    const { startDate, endDate, type, perPage = 500 } = options;
    
    let allDrops = [];
    let page = 1;
    let hasMore = true;
    
    while (hasMore) {
        const params = new URLSearchParams({
            per_page: perPage,
            page: page
        });
        
        if (startDate) params.append('start_date', startDate);
        if (endDate) params.append('end_date', endDate);
        if (type) params.append('type', type);
        
        const response = await fetch(`${FARMLABS_API_BASE}/drops?${params}`, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Accept': 'application/json'
            }
        });
        
        if (!response.ok) {
            const error = await response.text();
            throw new Error(`FarmLabs API Error (${response.status}): ${error}`);
        }
        
        const data = await response.json();
        allDrops = allDrops.concat(data.data);
        
        hasMore = page < data.last_page;
        page++;
    }
    
    return allDrops;
}

/**
 * FarmLabs API'den drop istatistiklerini çeker
 */
async function fetchDropStats(apiKey, options = {}) {
    const { startDate, endDate } = options;
    
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    
    const response = await fetch(`${FARMLABS_API_BASE}/drops/stats?${params}`, {
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Accept': 'application/json'
        }
    });
    
    if (!response.ok) {
        const error = await response.text();
        throw new Error(`FarmLabs API Error (${response.status}): ${error}`);
    }
    
    return await response.json();
}

/**
 * Drop'ları haftalık kazançlara dönüştürür (çarşamba bazlı)
 */
function processDropsToWeeklyEarnings(drops) {
    const weeklyEarnings = new Map();
    const weeklyCount = new Map();
    
    for (const drop of drops) {
        const dropDate = new Date(drop.dropped_at);
        const weekStart = getWednesdayWeekStart(dropDate);
        const weekKey = weekStart.getTime();
        
        const price = parseFloat(drop.price_when_dropped) || 0;
        
        weeklyEarnings.set(weekKey, (weeklyEarnings.get(weekKey) || 0) + price);
        weeklyCount.set(weekKey, (weeklyCount.get(weekKey) || 0) + 1);
    }
    
    return { weeklyEarnings, weeklyCount };
}

/**
 * Haftalık kazançları günlük kazançlara dönüştürür (veritabanı için)
 * Her haftanın kazancını 7 güne eşit olarak böler
 */
function convertWeeklyToDaily(weeklyEarnings) {
    const dailyEarnings = [];
    
    for (const [weekKey, totalAmount] of weeklyEarnings.entries()) {
        const weekStart = new Date(weekKey);
        const dailyAmount = totalAmount / 7; // Haftayı 7 güne böl
        
        // Her gün için kayıt oluştur
        for (let i = 0; i < 7; i++) {
            const date = new Date(weekStart);
            date.setDate(weekStart.getDate() + i);
            
            dailyEarnings.push({
                date: date.toISOString().split('T')[0], // YYYY-MM-DD
                amount: dailyAmount
            });
        }
    }
    
    return dailyEarnings;
}

/**
 * Drop'ları günlük kazançlara dönüştürür (her drop'un kendi gününe)
 * Daha doğru bir yöntem - her drop'u düştüğü güne kaydeder
 */
function convertDropsToDaily(drops) {
    const dailyEarnings = new Map();
    const dailyCounts = new Map();
    
    for (const drop of drops) {
        const dropDate = new Date(drop.dropped_at);
        const dateKey = dropDate.toISOString().split('T')[0]; // YYYY-MM-DD
        
        const price = parseFloat(drop.price_when_dropped) || 0;
        dailyEarnings.set(dateKey, (dailyEarnings.get(dateKey) || 0) + price);
        dailyCounts.set(dateKey, (dailyCounts.get(dateKey) || 0) + 1);
    }
    
    // Map'i array'e çevir
    return Array.from(dailyEarnings.entries()).map(([date, amount]) => ({
        date,
        amount,
        dropCount: dailyCounts.get(date) || 0
    }));
}

/**
 * FarmLabs API key'i test eder
 */
async function testApiKey(apiKey) {
    try {
        const response = await fetch(`${FARMLABS_API_BASE}/drops?per_page=1`, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Accept': 'application/json'
            }
        });
        
        return {
            valid: response.ok,
            status: response.status,
            message: response.ok ? 'API key geçerli' : 'API key geçersiz'
        };
    } catch (error) {
        return {
            valid: false,
            status: 0,
            message: error.message
        };
    }
}

/**
 * Bot gruplarını listeler
 */
async function fetchBotGroups(apiKey) {
    const response = await fetch(`${FARMLABS_API_BASE}/bot-groups`, {
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Accept': 'application/json'
        }
    });
    
    if (!response.ok) {
        const error = await response.text();
        throw new Error(`FarmLabs API Error (${response.status}): ${error}`);
    }
    
    return await response.json();
}

/**
 * Botları listeler
 */
async function fetchBots(apiKey, options = {}) {
    const { botGroupId, perPage = 100, page = 1 } = options;
    
    const params = new URLSearchParams({
        per_page: perPage,
        page: page
    });
    
    if (botGroupId) params.append('bot_group_id', botGroupId);
    
    const response = await fetch(`${FARMLABS_API_BASE}/bots?${params}`, {
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Accept': 'application/json'
        }
    });
    
    if (!response.ok) {
        const error = await response.text();
        throw new Error(`FarmLabs API Error (${response.status}): ${error}`);
    }
    
    return await response.json();
}

module.exports = {
    fetchAllDrops,
    fetchDropStats,
    processDropsToWeeklyEarnings,
    convertWeeklyToDaily,
    convertDropsToDaily,
    testApiKey,
    fetchBotGroups,
    fetchBots,
    getWednesdayWeekStart
};
