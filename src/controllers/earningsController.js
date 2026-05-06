const db = require('../config/database');

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
 * Hafta etiketini formatlar (örn: "15 Oca")
 */
function formatWeekLabel(date) {
    const months = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
    return `${date.getDate()} ${months[date.getMonth()]}`;
}

// Get earnings statistics
const getEarningsStats = (req, res) => {
    try {
        const userId = req.user.id;

        // Son 6 ay (27 hafta) için kazançları çek (çarşamba bazlı)
        const now = new Date();
        const currentWeekStart = getWednesdayWeekStart(now);
        const sixMonthsAgo = new Date(currentWeekStart);
        sixMonthsAgo.setDate(currentWeekStart.getDate() - 26 * 7);

        // Tüm kazançları çek
        const allEarnings = db.prepare(`
            SELECT date, amount, drop_count
            FROM earnings
            WHERE user_id = ? AND date >= ?
            ORDER BY date ASC
        `).all(userId, sixMonthsAgo.toISOString().split('T')[0]);

        // Haftalık gruplama (çarşamba bazlı)
        const weeklyEarnings = new Map();
        const weeklyCount = new Map();
        
        for (const earning of allEarnings) {
            const earningDate = new Date(earning.date + 'T00:00:00');
            const weekStart = getWednesdayWeekStart(earningDate);
            const weekKey = weekStart.getTime();
            
            const amount = parseFloat(earning.amount || 0);
            const dropCount = parseInt(earning.drop_count || 0);
            
            weeklyEarnings.set(weekKey, (weeklyEarnings.get(weekKey) || 0) + amount);
            weeklyCount.set(weekKey, (weeklyCount.get(weekKey) || 0) + dropCount);
        }

        // Son 27 haftayı oluştur
        const weeks = [];
        const monthBoundaries = [];
        let lastMonth = null;
        
        for (let i = 0; i < 27; i++) {
            const ws = new Date(sixMonthsAgo);
            ws.setDate(sixMonthsAgo.getDate() + i * 7);
            const key = ws.getTime();
            const m = ws.getMonth();
            
            // Ay değişimlerini işaretle
            if (lastMonth !== null && m !== lastMonth) {
                monthBoundaries.push(i);
            }
            lastMonth = m;
            
            const earnings = weeklyEarnings.get(key) || 0;
            const count = weeklyCount.get(key) || 0;
            
            weeks.push({
                week: formatWeekLabel(ws),
                amount: earnings.toFixed(2),
                count: count
            });
        }

        // Bu haftanın kazancı (son hafta)
        const thisWeek = weeks[26].amount;

        // Bu ayın kazancı (bu haftadan önceki 4 hafta)
        const thisMonth = weeks.slice(22, 26).reduce((sum, w) => sum + parseFloat(w.amount), 0).toFixed(2);

        // Son 3 ayın kazancı (son 12 hafta)
        const last3Months = weeks.slice(15, 27).reduce((sum, w) => sum + parseFloat(w.amount), 0).toFixed(2);

        // Toplam kazanç
        const total = db.prepare(`
            SELECT COALESCE(SUM(amount), 0) as amount
            FROM earnings
            WHERE user_id = ?
        `).get(userId);

        // Son güncelleme zamanı
        const lastUpdate = db.prepare(`
            SELECT updated_at
            FROM earnings
            WHERE user_id = ?
            ORDER BY updated_at DESC
            LIMIT 1
        `).get(userId);

        res.json({
            success: true,
            data: {
                weekly: weeks,
                monthBoundaries: monthBoundaries,
                thisWeek: parseFloat(thisWeek).toFixed(2),
                thisMonth: thisMonth,
                last3Months: last3Months,
                total: parseFloat(total.amount || 0).toFixed(2),
                lastUpdate: lastUpdate ? lastUpdate.updated_at : null
            }
        });

    } catch (error) {
        console.error('Get earnings stats error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Sunucu hatası.' 
        });
    }
};

// Sync earnings (upsert)
const syncEarnings = (req, res) => {
    try {
        const userId = req.user.id;
        const { date, amount } = req.body;

        // Validate
        if (!date || amount === undefined) {
            return res.status(400).json({ 
                success: false, 
                message: 'Tarih ve miktar gereklidir.' 
            });
        }

        // Upsert earnings
        db.prepare(`
            INSERT INTO earnings (user_id, date, amount, created_at, updated_at)
            VALUES (?, ?, ?, datetime('now'), datetime('now'))
            ON CONFLICT(user_id, date) 
            DO UPDATE SET 
                amount = excluded.amount,
                updated_at = datetime('now')
        `).run(userId, date, amount);

        res.json({
            success: true,
            message: 'Kazanç kaydedildi.'
        });

    } catch (error) {
        console.error('Sync earnings error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Sunucu hatası.' 
        });
    }
};

// Get daily earnings (for detailed view)
const getDailyEarnings = (req, res) => {
    try {
        const userId = req.user.id;
        const { startDate, endDate } = req.query;

        let query = `
            SELECT date, amount, updated_at
            FROM earnings
            WHERE user_id = ?
        `;
        const params = [userId];

        if (startDate) {
            query += ` AND date >= ?`;
            params.push(startDate);
        }

        if (endDate) {
            query += ` AND date <= ?`;
            params.push(endDate);
        }

        query += ` ORDER BY date DESC LIMIT 100`;

        const earnings = db.prepare(query).all(...params);

        res.json({
            success: true,
            data: earnings.map(e => ({
                date: e.date,
                amount: parseFloat(e.amount).toFixed(2),
                updatedAt: e.updated_at
            }))
        });

    } catch (error) {
        console.error('Get daily earnings error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Sunucu hatası.' 
        });
    }
};

module.exports = {
    getEarningsStats,
    syncEarnings,
    getDailyEarnings
};
