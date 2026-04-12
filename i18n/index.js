/**
 * I18n - 国际化主模块
 *
 * 支持多语言智能体通信和消息翻译
 *
 * @module i18n
 */

const logger = require('../server/utils/logger');

class I18n {
    constructor() {
        this.defaultLocale = 'zh-CN';
        this.currentLocale = 'zh-CN';
        this.translations = new Map();
        this.fallbackCache = new Map();
    }

    /**
     * 加载翻译资源
     */
    load(resources) {
        for (const [locale, data] of Object.entries(resources)) {
            this.translations.set(locale, data);
        }
        logger.info(`[I18n] Loaded translations for ${this.translations.size} locales`);
    }

    /**
     * 翻译
     * @param {string} key - 如 'agent.messages.greeting'
     * @param {object} params - 替换参数
     * @param {string} locale - 语言，默认为当前语言
     */
    t(key, params = {}, locale = null) {
        const targetLocale = locale || this.currentLocale;
        const value = this._getValue(key, targetLocale) ||
                      this._getValue(key, this.defaultLocale) ||
                      key;

        return this._interpolate(value, params);
    }

    /**
     * 获取翻译值
     */
    _getValue(key, locale) {
        const data = this.translations.get(locale);
        if (!data) return null;

        const keys = key.split('.');
        let value = data;

        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            } else {
                return null;
            }
        }

        return typeof value === 'string' ? value : null;
    }

    /**
     * 插值替换
     */
    _interpolate(template, params) {
        return template.replace(/\{(\w+)\}/g, (match, key) => {
            return params[key] !== undefined ? params[key] : match;
        });
    }

    /**
     * 设置当前语言
     */
    setLocale(locale) {
        if (this.translations.has(locale)) {
            this.currentLocale = locale;
            logger.debug(`[I18n] Locale set to ${locale}`);
        }
    }

    /**
     * 获取当前语言
     */
    getLocale() {
        return this.currentLocale;
    }

    /**
     * 获取所有支持的语言
     */
    getSupportedLocales() {
        return Array.from(this.translations.keys());
    }

    /**
     * 检测语言
     */
    detectLocale(acceptLanguage) {
        if (!acceptLanguage) return this.defaultLocale;

        const locales = Array.from(this.translations.keys());

        // 解析 Accept-Language 头
        const preferences = acceptLanguage
            .split(',')
            .map(part => {
                const [lang, q = 'q=1'] = part.trim().split(';');
                const quality = parseFloat(q.replace('q=', '')) || 1;
                return { lang: lang.trim(), quality };
            })
            .sort((a, b) => b.quality - a.quality);

        for (const pref of preferences) {
            const lang = pref.lang.toLowerCase();

            // 精确匹配
            if (locales.includes(lang)) return lang;

            // 前缀匹配 (e.g., 'zh' matches 'zh-CN')
            const match = locales.find(l => l.toLowerCase().startsWith(lang + '-'));
            if (match) return match;
        }

        return this.defaultLocale;
    }

    /**
     * 获取语言对应的 LLM
     */
    getModelForLocale(locale) {
        const models = {
            'zh-CN': 'minimax',
            'zh-TW': 'minimax',
            'en-US': 'openai',
            'ja-JP': 'openai',
            'ko-KR': 'openai'
        };
        return models[locale] || 'minimax';
    }

    /**
     * 获取语言名称
     */
    getLocaleName(locale) {
        const names = {
            'zh-CN': '简体中文',
            'zh-TW': '繁體中文',
            'en-US': 'English',
            'ja-JP': '日本語',
            'ko-KR': '한국어'
        };
        return names[locale] || locale;
    }
}

// 全局实例
const i18n = new I18n();

module.exports = { I18n, i18n };
