/**
 * GLM5 Provider - GLM5 大模型
 *
 * 使用 http://open.deepthink.cn/v1/chat/completions
 *
 * @module ai/providers/glm5
 */

const logger = require('../utils/logger');

class GLM5Provider {
    constructor() {
        this.name = 'glm5';
        this.endpoint = 'http://open.deepthink.cn/v1/chat/completions';
        this.model = 'nvidia/z-ai/glm5';
        this.timeout = 60000;
    }

    /**
     * 发送聊天请求
     */
    async chat(messages, options = {}) {
        const {
            temperature = 0.7,
            max_tokens = 2048,
            top_p = 0.9,
            stream = false
        } = options;

        const startTime = Date.now();
        const requestId = `glm5_${Date.now()}`;

        const body = {
            model: this.model,
            messages,
            temperature,
            max_tokens,
            top_p,
            stream
        };

        logger.debug(`[GLM5] Sending request`, { requestId, messageCount: messages.length });

        try {
            const response = await this._makeRequest(body, requestId);

            const duration = Date.now() - startTime;
            logger.debug(`[GLM5] Response received`, {
                requestId,
                duration: `${duration}ms`,
                tokens: response.usage?.total_tokens || 0
            });

            return {
                success: true,
                provider: this.name,
                model: response.model || this.model,
                content: response.choices?.[0]?.message?.content || '',
                reasoning: response.choices?.[0]?.message?.thinking || null,
                usage: response.usage || {},
                duration
            };
        } catch (err) {
            logger.error(`[GLM5] Request failed`, {
                requestId,
                error: err.message
            });

            return {
                success: false,
                provider: this.name,
                error: err.message
            };
        }
    }

    /**
     * 发送流式请求
     */
    async *chatStream(messages, options = {}) {
        const { temperature = 0.7, max_tokens = 2048 } = options;

        const body = {
            model: this.model,
            messages,
            temperature,
            max_tokens,
            stream: true
        };

        logger.debug(`[GLM5] Starting stream request`);

        try {
            const response = await this._makeRequest(body);

            if (!response.body) {
                throw new Error('No response body for streaming');
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();

                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop();

                for (const line of lines) {
                    if (line.trim() && line.startsWith('data:')) {
                        const data = line.slice(5).trim();
                        if (data === '[DONE]') {
                            yield { done: true };
                            return;
                        }

                        try {
                            const parsed = JSON.parse(data);
                            const content = parsed.choices?.[0]?.delta?.content || '';
                            if (content) {
                                yield { content, done: false };
                            }
                        } catch {
                            // Skip invalid JSON
                        }
                    }
                }
            }
        } catch (err) {
            logger.error(`[GLM5] Stream error:`, { error: err.message });
            yield { error: err.message, done: true };
        }
    }

    /**
     * 发送 HTTP 请求
     */
    async _makeRequest(body, requestId = null) {
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.GLM5_API_KEY || process.env.API_KEY || 'dummy'}`
        };

        if (requestId) {
            headers['X-Request-ID'] = requestId;
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        try {
            const response = await fetch(this.endpoint, {
                method: 'POST',
                headers,
                body: JSON.stringify(body),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            return response;
        } catch (err) {
            clearTimeout(timeoutId);
            throw err;
        }
    }

    /**
     * 测试连接
     */
    async test() {
        try {
            const result = await this.chat([
                { role: 'user', content: 'Hello, reply with just "OK".' }
            ], { max_tokens: 10 });

            return {
                success: result.success,
                provider: this.name,
                message: result.success ? 'Connection successful' : result.error
            };
        } catch (err) {
            return {
                success: false,
                provider: this.name,
                message: err.message
            };
        }
    }
}

module.exports = { GLM5Provider };
