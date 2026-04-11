/**
 * MiniMaxProvider - MiniMax LLM 提供者
 */

const LLMProvider = require('./llm-provider');
const logger = require('../../utils/logger');
const { generateRandomString } = require('../../utils/crypto');

class MiniMaxProvider extends LLMProvider {
    constructor(config) {
        super('minimax', config);
        this.apiUrl = config.apiUrl || 'https://api.minimax.chat/v1';
        this.model = config.model || 'MiniMax-M2';
        this.groupId = config.groupId || process.env.MINIMAX_GROUP_ID;
        this.apiKey = config.apiKey || process.env.MINIMAX_API_KEY;
    }

    /**
     * 发送聊天请求
     */
    async chat(messages, options = {}) {
        if (!this.apiKey || !this.groupId) {
            logger.warn('[MiniMax] API key or group ID not configured');
            return this.getMockResponse(messages);
        }

        const url = `${this.apiUrl}/text/chatcompletion_v2`;

        const requestBody = {
            model: this.model,
            messages: this.formatMessages(messages),
            temperature: options.temperature ?? this.config.temperature ?? 0.7,
            max_tokens: options.maxTokens ?? this.config.maxTokens ?? 500,
            stream: false
        };

        try {
            const response = await this.fetchWithTimeout(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify(requestBody)
            }, this.config.timeout || 60000);

            const data = await response.json();

            if (data.choices && data.choices[0]) {
                return {
                    content: data.choices[0].message.content,
                    usage: data.usage,
                    model: this.model
                };
            }

            throw new Error(data.error?.message || 'Unknown error');
        } catch (err) {
            logger.error('[MiniMax] Chat error', { error: err.message });
            throw err;
        }
    }

    /**
     * 发送补全请求
     */
    async complete(prompt, options = {}) {
        // MiniMax 使用 chat API，补全转 chat
        return this.chat([
            { role: 'user', content: prompt }
        ], options);
    }

    /**
     * 格式化消息
     */
    formatMessages(messages) {
        if (typeof messages === 'string') {
            return [{ role: 'user', content: messages }];
        }

        return messages.map(msg => ({
            role: msg.role || 'user',
            content: msg.content
        }));
    }

    /**
     * 获取模拟响应（用于测试）
     */
    getMockResponse(messages) {
        const lastMessage = messages[messages.length - 1]?.content || '';

        logger.debug('[MiniMax] Using mock response');

        return {
            content: JSON.stringify({
                skill: 'rest',
                params: { duration: 5 },
                reasoning: 'Mock response - MiniMax not configured'
            }),
            usage: { prompt_tokens: 100, completion_tokens: 50 },
            model: this.model
        };
    }

    /**
     * fetch 带超时
     */
    async fetchWithTimeout(url, options, timeoutMs) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), timeoutMs);

        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });
            return response;
        } finally {
            clearTimeout(timeout);
        }
    }
}

module.exports = MiniMaxProvider;
