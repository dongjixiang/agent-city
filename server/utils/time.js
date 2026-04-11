/**
 * Time - 时间工具
 */

/**
 * 获取当前时间戳（毫秒）
 */
function now() {
    return Date.now();
}

/**
 * 获取当前时间戳（秒）
 */
function nowSeconds() {
    return Math.floor(Date.now() / 1000);
}

/**
 * 格式化日期
 */
function formatDate(date = new Date(), format = 'YYYY-MM-DD HH:mm:ss') {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    const second = String(date.getSeconds()).padStart(2, '0');
    
    return format
        .replace('YYYY', year)
        .replace('MM', month)
        .replace('DD', day)
        .replace('HH', hour)
        .replace('mm', minute)
        .replace('ss', second);
}

/**
 * 格式化相对时间
 */
function formatRelative(timestamp) {
    const diff = Date.now() - timestamp;
    
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}天前`;
    if (hours > 0) return `${hours}小时前`;
    if (minutes > 0) return `${minutes}分钟前`;
    return '刚刚';
}

/**
 * 解析时间字符串
 */
function parseTime(timeStr) {
    const match = timeStr.match(/^(\d+)([smhd])$/);
    if (!match) return null;
    
    const value = parseInt(match[1]);
    const unit = match[2];
    
    const multipliers = {
        s: 1000,
        m: 60 * 1000,
        h: 60 * 60 * 1000,
        d: 24 * 60 * 60 * 1000
    };
    
    return value * (multipliers[unit] || 1000);
}

/**
 * 获取一天的开始时间
 */
function startOfDay(date = new Date()) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
}

/**
 * 获取一天的结束时间
 */
function endOfDay(date = new Date()) {
    const d = new Date(date);
    d.setHours(23, 59, 59, 999);
    return d.getTime();
}

/**
 * 获取本周开始
 */
function startOfWeek(date = new Date()) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
}

/**
 * 获取本月开始
 */
function startOfMonth(date = new Date()) {
    const d = new Date(date);
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
}

/**
 * 判断是否同一天
 */
function isSameDay(timestamp1, timestamp2) {
    const d1 = new Date(timestamp1);
    const d2 = new Date(timestamp2);
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
}

/**
 * 获取游戏内时间（日夜系统）
 */
function getGameTime(gameHour = 0) {
    // 游戏时间转换 (1现实秒 = 1游戏分钟)
    const now = Date.now();
    const gameStart = 6 * 60; // 6:00 起床
    const minutesSinceStart = Math.floor(now / 1000) % (24 * 60);
    const gameMinutes = (gameStart + minutesSinceStart) % (24 * 60);
    
    return {
        hour: Math.floor(gameMinutes / 60),
        minute: gameMinutes % 60,
        phase: getDayPhase(Math.floor(gameMinutes / 60))
    };
}

/**
 * 获取日夜阶段
 */
function getDayPhase(hour) {
    if (hour >= 6 && hour < 8) return 'dawn';      // 黎明
    if (hour >= 8 && hour < 12) return 'morning'; // 上午
    if (hour >= 12 && hour < 14) return 'noon';    // 中午
    if (hour >= 14 && hour < 18) return 'afternoon'; // 下午
    if (hour >= 18 && hour < 21) return 'evening'; // 傍晚
    return 'night'; // 夜晚
}

/**
 * 等待指定时间
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 限流器
 */
class RateLimiter {
    constructor(maxRequests, windowMs) {
        this.maxRequests = maxRequests;
        this.windowMs = windowMs;
        this.requests = new Map();
    }
    
    canPass(key) {
        const now = Date.now();
        const timestamps = this.requests.get(key) || [];
        
        // 清理过期的
        const valid = timestamps.filter(t => now - t < this.windowMs);
        
        if (valid.length >= this.maxRequests) {
            return false;
        }
        
        valid.push(now);
        this.requests.set(key, valid);
        return true;
    }
    
    reset(key) {
        this.requests.delete(key);
    }
    
    resetAll() {
        this.requests.clear();
    }
}

module.exports = {
    now,
    nowSeconds,
    formatDate,
    formatRelative,
    parseTime,
    startOfDay,
    endOfDay,
    startOfWeek,
    startOfMonth,
    isSameDay,
    getGameTime,
    getDayPhase,
    sleep,
    RateLimiter
};
