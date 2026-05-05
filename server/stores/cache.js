/**
 * Cache - 缓存层
 * 
 * 内存缓存，支持 TTL
 */

const logger = require('../utils/logger');

class Cache {
    constructor(options = {}) {
        this.ttl = options.ttl || 60000; // 默认 1 分钟
        this.maxSize = options.maxSize || 10000;
        this.cache = new Map(); // key -> { value, expiresAt }
        this.stats = {
            hits: 0,
            misses: 0,
            sets: 0,
            deletes: 0
        };

        // 清理 interval
        this.cleanupInterval = null;
        if (options.autoCleanup !== false) {
            this.startCleanup(options.cleanupInterval || 60000);
        }
    }

    /**
     * 设置
     */
    set(key, value, ttl = null) {
        const actualTTL = ttl || this.ttl;
        const expiresAt = Date.now() + actualTTL;

        // 如果缓存满了，删除最老的
        if (this.cache.size >= this.maxSize) {
            this.evictOldest();
        }

        this.cache.set(key, { value, expiresAt });
        this.stats.sets++;

        return true;
    }

    /**
     * 获取
     */
    get(key) {
        const item = this.cache.get(key);

        if (!item) {
            this.stats.misses++;
            return null;
        }

        // 检查过期
        if (Date.now() > item.expiresAt) {
            this.cache.delete(key);
            this.stats.misses++;
            return null;
        }

        this.stats.hits++;
        return item.value;
    }

    /**
     * 删除
     */
    delete(key) {
        const deleted = this.cache.delete(key);
        if (deleted) {
            this.stats.deletes++;
        }
        return deleted;
    }

    /**
     * 检查存在
     */
    has(key) {
        const item = this.cache.get(key);
        if (!item) return false;

        if (Date.now() > item.expiresAt) {
            this.cache.delete(key);
            return false;
        }

        return true;
    }

    /**
     * 清除
     */
    clear() {
        this.cache.clear();
    }

    /**
     * 获取大小
     */
    size() {
        return this.cache.size;
    }

    /**
     * 获取统计
     */
    getStats() {
        const total = this.stats.hits + this.stats.misses;
        return {
            ...this.stats,
            size: this.cache.size,
            hitRate: total > 0 ? (this.stats.hits / total * 100).toFixed(2) + '%' : '0%'
        };
    }

    /**
     * 删除最老的
     */
    evictOldest() {
        let oldest = null;
        let oldestKey = null;

        for (const [key, item] of this.cache) {
            if (!oldest || item.expiresAt < oldest.expiresAt) {
                oldest = item;
                oldestKey = key;
            }
        }

        if (oldestKey) {
            this.cache.delete(oldestKey);
        }
    }

    /**
     * 清理过期
     */
    cleanup() {
        const now = Date.now();
        let cleaned = 0;

        for (const [key, item] of this.cache) {
            if (now > item.expiresAt) {
                this.cache.delete(key);
                cleaned++;
            }
        }

        if (cleaned > 0) {
            logger.debug(`[Cache] Cleaned up ${cleaned} expired items`);
        }

        return cleaned;
    }

    /**
     * 启动自动清理
     */
    startCleanup(intervalMs = 60000) {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }

        this.cleanupInterval = setInterval(() => {
            this.cleanup();
        }, intervalMs);
    }

    /**
     * 停止自动清理
     */
    stopCleanup() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
    }

    /**
     * 批量获取
     */
    getMany(keys) {
        const result = {};
        for (const key of keys) {
            result[key] = this.get(key);
        }
        return result;
    }

    /**
     * 批量设置
     */
    setMany(items, ttl = null) {
        for (const [key, value] of Object.entries(items)) {
            this.set(key, value, ttl);
        }
    }

    /**
     * 获取或设置
     */
    getOrSet(key, factory, ttl = null) {
        const cached = this.get(key);
        if (cached !== null) {
            return Promise.resolve(cached);
        }

        return Promise.resolve(factory()).then(value => {
            this.set(key, value, ttl);
            return value;
        });
    }
}

/**
 * 多级缓存
 */
class MultiLevelCache {
    constructor() {
        this.caches = [];
    }

    addLevel(cache, weight = 1) {
        this.caches.push({ cache, weight });
    }

    async get(key) {
        for (const { cache } of this.caches) {
            const value = cache.get(key);
            if (value !== null) {
                // 往上层同步
                await this.syncUp(key, value);
                return value;
            }
        }
        return null;
    }

    async set(key, value, ttl = null) {
        // 从最底层开始设置
        for (let i = this.caches.length - 1; i >= 0; i--) {
            this.caches[i].cache.set(key, value, ttl);
        }
    }

    async syncUp(key, value) {
        // 从下层往上层同步
        for (let i = 0; i < this.caches.length - 1; i++) {
            this.caches[i].cache.set(key, value);
        }
    }
}

// 全局缓存实例
const globalCache = new Cache({
    ttl: 60000,
    maxSize: 10000
});

module.exports = {
    Cache,
    MultiLevelCache,
    globalCache
};
