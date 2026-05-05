/**
 * OpenAIProvider - OpenAI LLM 提供者
 */

const LLMProvider = require('./llm-provider');
const logger = require('../../utils/logger');

class OpenAIProvider extends LLMProvider {
    constructor(config) {
        super('openai', config);
        this.apiUrl = config.apiUrl || 'https://api.openai.com/v1';
        this.model = config.model || 'gpt-4';
        this.apiKey = config.apiKey || process.env.OPENAI_API_KEY;
    }

    /**
     * 发送聊天请求
     */
    async chat(messages, options = {}) {
        if (!this.apiKey) {
            logger.warn('[OpenAI] API key not configured');
            return this.getMockResponse(messages);
        }

        const url = `${this.apiUrl}/chat/completions`;

        const requestBody = {
            model: this.model,
            messages: this.formatMessages(messages),
            temperature: options.temperature ?? this.config.temperature ?? 0.7,
            max_tokens: options.maxTokens ?? this.config.maxTokens ?? 500
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
            logger.error('[OpenAI] Chat error', { error: err.message });
            throw err;
        }
    }

    /**
     * 发送补全请求
     */
    async complete(prompt, options = {}) {
        if (!this.apiKey) {
            return this.getMockResponse([{ role: 'user', content: prompt }]);
        }

        const url = `${this.apiUrl}/completions`;

        const requestBody = {
            model: this.model,
            prompt,
            temperature: options.temperature ?? this.config.temperature ?? 0.7,
            max_tokens: options.maxTokens ?? this.config.maxTokens ?? 500
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
                    content: data.choices[0].text,
                    usage: data.usage,
                    model: this.model
                };
            }

            throw new Error(data.error?.message || 'Unknown error');
        } catch (err) {
            logger.error('[OpenAI] Complete error', { error: err.message });
            throw err;
        }
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
     * 获取模拟响应
     */
    getMockResponse(messages) {
        logger.debug('[OpenAI] Using mock response');

        return {
            content: JSON.stringify({
                skill: 'rest',
                params: { duration: 5 },
                reasoning: 'Mock response - OpenAI not configured'
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

module.exports = OpenAIProvider;
