/**
 * LLMManager - LLM 管理器
 * 
 * 管理多个 LLM Provider，支持动态切换
 */

const logger = require('../../utils/logger');
const config = require('../../utils/config-loader');

// Providers
const MiniMaxProvider = require('./providers/minimax');
const OpenAIProvider = require('./providers/openai');

class LLMManager {
    constructor() {
        this.providers = new Map();
        this.defaultProvider = 'minimax';
        this.initialized = false;
    }

    /**
     * 初始化
     */
    initialize() {
        if (this.initialized) return;

        // 加载配置
        const llmConfig = config.get('llm', {});
        const localeModels = llmConfig.localeModels || {};

        // 创建 MiniMax Provider
        if (llmConfig.minimax) {
            this.providers.set('minimax', new MiniMaxProvider(llmConfig.minimax));
        }

        // 创建 OpenAI Provider
        if (llmConfig.openai) {
            this.providers.set('openai', new OpenAIProvider(llmConfig.openai));
        }

        // 默认 Provider
        this.defaultProvider = llmConfig.defaultProvider || 'minimax';

        logger.info(`[LLMManager] Initialized with providers: ${Array.from(this.providers.keys()).join(', ')}`);

        this.initialized = true;
    }

    /**
     * 获取 Provider
     */
    getProvider(name = null) {
        if (!this.initialized) {
            this.initialize();
        }

        const providerName = name || this.defaultProvider;
        const provider = this.providers.get(providerName);

        if (!provider) {
            logger.warn(`[LLMManager] Provider ${providerName} not found, using default`);
            return this.providers.get(this.defaultProvider);
        }

        return provider;
    }

    /**
     * 根据语言获取 Provider
     */
    getProviderForLocale(locale) {
        if (!this.initialized) {
            this.initialize();
        }

        const localeModels = config.get('llm.localeModels', {});
        const modelName = localeModels[locale] || this.defaultProvider;

        return this.getProvider(modelName);
    }

    /**
     * 聊天
     */
    async chat(messages, options = {}) {
        const provider = options.provider
            ? this.getProvider(options.provider)
            : this.getProvider(this.defaultProvider);

        return provider.chat(messages, options);
    }

    /**
     * 补全
     */
    async complete(prompt, options = {}) {
        const provider = options.provider
            ? this.getProvider(options.provider)
            : this.getProvider(this.defaultProvider);

        return provider.complete(prompt, options);
    }

    /**
     * 带语言选择的聊天
     */
    async chatWithLocale(locale, messages, options = {}) {
        const provider = this.getProviderForLocale(locale);
        return provider.chat(messages, options);
    }

    /**
     * 获取所有 Provider 名称
     */
    getProviderNames() {
        return Array.from(this.providers.keys());
    }

    /**
     * 检查 Provider 是否可用
     */
    isProviderAvailable(name) {
        return this.providers.has(name);
    }
}

// 单例
const llmManager = new LLMManager();

module.exports = {
    llmManager,
    LLMManager
};
