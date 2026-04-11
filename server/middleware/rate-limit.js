/**
 * RateLimit - 限流中间件
 * 
 * 基于内存的限流实现
 */

const logger = require('../utils/logger');
const { RateLimiter } = require('../utils/time');

// 默认配置
const DEFAULT_WINDOW_MS = 60000; // 1分钟
const DEFAULT_MAX_REQUESTS = 100;

/**
 * 创建限流器
 */
function createRateLimiter(options = {}) {
    const {
        windowMs = DEFAULT_WINDOW_MS,
        maxRequests = DEFAULT_MAX_REQUESTS,
        keyGenerator = (req) => req.ip || req.socket.remoteAddress,
        handler = null // 自定义处理函数
    } = options;

    const limiter = new RateLimiter(maxRequests, windowMs);

    return async (req, res, next) => {
        const key = keyGenerator(req);

        if (!limiter.canPass(key)) {
            logger.warn(`[RateLimit] 限流触发: ${key}`);

            if (handler) {
                await handler(req, res, key);
            } else {
                res.writeHead(429, {
                    'Content-Type': 'application/json',
                    'Retry-After': Math.ceil(windowMs / 1000)
                });
                res.end(JSON.stringify({
                    error: 'Too Many Requests',
                    message: 'Rate limit exceeded',
                    retryAfter: Math.ceil(windowMs / 1000)
                }));
            }
            return;
        }

        next();
    };
}

/**
 * WebSocket 限流器
 */
class WSRateLimiter {
    constructor(options = {}) {
        this.windowMs = options.windowMs || DEFAULT_WINDOW_MS;
        this.maxRequests = options.maxRequests || 100;
        this.connections = new Map(); // key -> { count, resetTime }
        this.cleanupInterval = null;
    }

    /**
     * 检查是否可以连接
     */
    canConnect(key) {
        const now = Date.now();
        let data = this.connections.get(key);

        if (!data || now > data.resetTime) {
            // 重置
            data = {
                count: 1,
                resetTime: now + this.windowMs
            };
            this.connections.set(key, data);
            return true;
        }

        if (data.count >= this.maxRequests) {
            return false;
        }

        data.count++;
        return true;
    }

    /**
     * 断开连接
     */
    disconnect(key) {
        this.connections.delete(key);
    }

    /**
     * 清理过期数据
     */
    cleanup() {
        const now = Date.now();
        for (const [key, data] of this.connections) {
            if (now > data.resetTime) {
                this.connections.delete(key);
            }
        }
    }

    /**
     * 启动定期清理
     */
    startCleanup(intervalMs = 60000) {
        this.cleanupInterval = setInterval(() => this.cleanup(), intervalMs);
    }

    /**
     * 停止
     */
    stop() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
    }

    /**
     * 获取状态
     */
    getStatus() {
        return {
            activeKeys: this.connections.size,
            maxRequests: this.maxRequests,
            windowMs: this.windowMs
        };
    }
}

/**
 * 创建 IP 限流器
 */
function createIPRateLimiter(options = {}) {
    return createRateLimiter({
        ...options,
        keyGenerator: (req) => {
            return req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
                   req.ip ||
                   req.socket.remoteAddress;
        }
    });
}

/**
 * 创建 Agent 限流器
 */
function createAgentRateLimiter(options = {}) {
    return createRateLimiter({
        ...options,
        keyGenerator: (req) => req.params.agentId || req.auth?.agentId || 'anonymous'
    });
}

module.exports = {
    createRateLimiter,
    createIPRateLimiter,
    createAgentRateLimiter,
    WSRateLimiter
};
