/**
 * Providers - LLM Provider 导出
 */

const LLMProvider = require('./llm-provider');
const MiniMaxProvider = require('./minimax');
const OpenAIProvider = require('./openai');

module.exports = {
    LLMProvider,
    MiniMaxProvider,
    OpenAIProvider
};
