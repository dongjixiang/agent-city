/**
 * Translation Middleware - 翻译中间件
 *
 * 用于消息的自动翻译
 *
 * @module i18n/translation-middleware
 */

const { i18n } = require('./index');
const logger = require('../server/utils/logger');

/**
 * 消息翻译中间件
 *
 * 用于：
 * 1. 智能体消息的语言检测
 * 2. 消息的自动翻译
 * 3. 跨语言消息路由
 */
class TranslationMiddleware {
    constructor() {
        this.cache = new Map(); // `${from}->${to}` -> translation
        this.cacheTtl = 3600000; // 1小时
    }

    /**
     * 翻译消息
     * @param {string} content - 消息内容
     * @param {string} fromLocale - 源语言
     * @param {string} toLocale - 目标语言
     */
    async translate(content, fromLocale, toLocale) {
        if (fromLocale === toLocale) return content;

        const cacheKey = `${content}:${fromLocale}->${toLocale}`;

        // 检查缓存
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheTtl) {
                return cached.translation;
            }
            this.cache.delete(cacheKey);
        }

        try {
            // TODO: 调用外部翻译 API
            // 目前实现为直接返回（实际需要调用 OpenAI/MiniMax 翻译）
            const translated = await this._translateWithLLM(content, fromLocale, toLocale);

            // 缓存结果
            this.cache.set(cacheKey, {
                translation: translated,
                timestamp: Date.now()
            });

            return translated;
        } catch (err) {
            logger.error('[TranslationMiddleware] Translation failed', {
                error: err.message,
                from: fromLocale,
                to: toLocale
            });
            return content;
        }
    }

    /**
     * 使用 LLM 翻译
     */
    async _translateWithLLM(content, from, to) {
        // 占位实现 - 实际需要调用翻译 API
        logger.debug(`[TranslationMiddleware] Would translate ${content.substring(0, 20)}... from ${from} to ${to}`);
        return content;
    }

    /**
     * 批量翻译消息数组
     */
    async translateBatch(messages, fromLocale, toLocale) {
        const results = await Promise.all(
            messages.map(msg => this.translate(msg, fromLocale, toLocale))
        );
        return results;
    }

    /**
     * 处理传入消息（检测语言并翻译）
     */
    async handleIncomingMessage(message, targetLocale = null) {
        const locale = targetLocale || i18n.getLocale();

        // 如果消息语言与目标语言不同，则翻译
        if (message.locale && message.locale !== locale) {
            message.content = await this.translate(message.content, message.locale, locale);
            message.originalLocale = message.locale;
            message.locale = locale;
        }

        return message;
    }

    /**
     * 处理传出消息（翻译到接收者语言）
     */
    async handleOutgoingMessage(message, targetLocale) {
        const sourceLocale = i18n.getLocale();

        if (targetLocale && targetLocale !== sourceLocale) {
            message.content = await this.translate(message.content, sourceLocale, targetLocale);
            message.locale = targetLocale;
        }

        return message;
    }

    /**
     * 检测文本语言
     * 简单实现：检查中文字符范围
     */
    detectLanguage(text) {
        // 中文字符
        if (/[\u4e00-\u9fff]/.test(text)) {
            return 'zh-CN';
        }
        // 日语字符
        if (/[\u3040-\u309f\u30a0-\u30ff]/.test(text)) {
            return 'ja-JP';
        }
        // 韩语字符
        if (/[\uac00-\ud7af]/.test(text)) {
            return 'ko-KR';
        }
        // 默认英语
        return 'en-US';
    }

    /**
     * 清理过期缓存
     */
    cleanupCache() {
        const now = Date.now();
        for (const [key, value] of this.cache) {
            if (now - value.timestamp > this.cacheTtl) {
                this.cache.delete(key);
            }
        }
    }
}

const translationMiddleware = new TranslationMiddleware();

// 定期清理缓存
setInterval(() => {
    translationMiddleware.cleanupCache();
}, 60000);

module.exports = { TranslationMiddleware, translationMiddleware };
