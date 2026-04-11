/**
 * LLMProvider - LLM 提供者基类
 */

const logger = require('../../utils/logger');

class LLMProvider {
    constructor(name, config) {
        this.name = name;
        this.config = config;
    }

    /**
     * 发送聊天请求
     */
    async chat(messages, options = {}) {
        throw new Error('chat() must be implemented by subclass');
    }

    /**
     * 发送补全请求
     */
    async complete(prompt, options = {}) {
        throw new Error('complete() must be implemented by subclass');
    }

    /**
     * 解析响应
     */
    parseResponse(response) {
        throw new Error('parseResponse() must be implemented by subclass');
    }
}

module.exports = LLMProvider;
