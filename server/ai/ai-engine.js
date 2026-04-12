/**
 * AIEngine - AI 引擎
 * 
 * 负责 AI 决策循环和 LLM 调用
 */

const logger = require('../utils/logger');
const config = require('../utils/config-loader');
const { skillRegistry } = require('./skill-registry');
const { llmManager } = require('./llm-manager');
const PerceptionSystem = require('./perception/perception-system');
const NeedsSystem = require('./motivation/needs-system');
const EmotionSystem = require('./emotions/emotion-system');

// Store 依赖
let agentStore = null;
let messageService = null;

// AI 子系统
let perceptionSystem = null;
let needsSystem = null;
let emotionSystem = null;

/**
 * 设置依赖
 */
function setStores(stores) {
    agentStore = stores.agentStore;
    messageService = stores.messageService;

    // 初始化子系统
    perceptionSystem = new PerceptionSystem();
    needsSystem = new NeedsSystem();
    emotionSystem = new EmotionSystem();
}

class AIEngine {
    constructor() {
        this.decisionInterval = null;
        this.isRunning = false;
        this.activeDecisions = new Map(); // agentId -> { startTime, promise }
    }

    /**
     * 启动 AI 引擎
     */
    start() {
        if (this.isRunning) return;

        this.isRunning = true;

        // 从配置获取决策间隔
        const interval = config.getValue('agents.default.decision.interval', 5000);

        this.decisionInterval = setInterval(() => {
            this.decisionLoop();
        }, interval);

        logger.info(`[AIEngine] Started with interval: ${interval}ms`);
    }

    /**
     * 停止 AI 引擎
     */
    stop() {
        if (this.decisionInterval) {
            clearInterval(this.decisionInterval);
            this.decisionInterval = null;
        }
        this.isRunning = false;
        logger.info('[AIEngine] Stopped');
    }

    /**
     * 决策循环
     */
    async decisionLoop() {
        if (!agentStore) return;

        try {
            const onlineAgents = await agentStore.getOnlineAgents();

            for (const agent of onlineAgents) {
                // 跳过已经有决策在进行的
                if (this.activeDecisions.has(agent.agentId)) {
                    continue;
                }

                // 检查是否需要决策
                if (await this.shouldDecide(agent)) {
                    this.makeDecision(agent.agentId, { force: false }).catch(err => {
                        logger.error(`[AIEngine] Decision failed for ${agent.agentId}`, { error: err.message });
                    });
                }
            }
        } catch (err) {
            logger.error('[AIEngine] Decision loop error', { error: err.message });
        }
    }

    /**
     * 检查是否需要决策
     */
    async shouldDecide(agent) {
        // 检查状态
        if (agent.state !== 'idle') {
            return false;
        }

        // 检查能量
        if (agent.energy < 20) {
            return true;
        }

        // 检查时间（决策冷却）
        const lastDecision = agent.lastDecision || 0;
        const cooldown = config.getValue('agents.default.decision.interval', 5000);
        if (Date.now() - lastDecision < cooldown) {
            return false;
        }

        return true;
    }

    /**
     * 做出决策
     */
    async makeDecision(agentId, options = {}) {
        const { force = false, context = {} } = options;

        // 标记为正在决策
        const decisionPromise = this._makeDecisionInternal(agentId, options);
        this.activeDecisions.set(agentId, { startTime: Date.now(), promise: decisionPromise });

        try {
            return await decisionPromise;
        } finally {
            this.activeDecisions.delete(agentId);
        }
    }

    /**
     * 内部决策方法
     */
    async _makeDecisionInternal(agentId, options) {
        const agent = await agentStore.get(agentId);
        if (!agent) {
            throw new Error('Agent not found');
        }

        logger.debug(`[AIEngine] Making decision for ${agentId}`, { state: agent.state });

        // 构建上下文
        const decisionContext = await this.buildContext(agent, context);

        // 调用 LLM
        const decision = await this.callLLM(agent, decisionContext);

        // 解析决策
        const skillName = decision.skill || decision.action;
        const params = decision.params || {};

        if (!skillName) {
            logger.warn(`[AIEngine] No skill selected for ${agentId}`);
            return null;
        }

        // 执行技能
        try {
            const result = await skillRegistry.execute(skillName, agent, params, decisionContext);

            // 更新最后决策时间
            await agentStore.update(agentId, { lastDecision: Date.now() });

            return {
                skill: skillName,
                params,
                result,
                reasoning: decision.reasoning
            };
        } catch (err) {
            logger.error(`[AIEngine] Skill execution failed for ${agentId}`, {
                skill: skillName,
                error: err.message
            });

            // 如果执行失败，使用默认技能
            if (!options.fallback) {
                return await this.executeDefaultSkill(agent);
            }

            throw err;
        }
    }

    /**
     * 构建决策上下文
     */
    async buildContext(agent, extraContext = {}) {
        // 获取附近智能体
        let nearbyAgents = [];
        if (agent.position) {
            nearbyAgents = await agentStore.getNearbyAgents(
                agent.position.x,
                agent.position.z,
                config.getValue('agents.default.perception.visualRange', 30)
            );
        }

        // 获取可用技能
        const availableSkills = skillRegistry.getExecutableSkills(agent, {
            nearbyAgents,
            ...extraContext
        });

        // 获取最近记忆
        const memories = await agentStore.getMemories(agent.agentId, 10);

        // 更新需求
        const lastUpdate = agent.lastNeedsUpdate || agent.lastSeen || Date.now();
        const deltaMs = Date.now() - lastUpdate;
        const updatedNeeds = needsSystem.updateNeeds(agent, deltaMs);

        // 获取情绪描述
        const emotionReport = emotionSystem.generateEmotionReport(agent.emotion);

        // 获取需求描述
        const needsDescription = needsSystem.generateNeedsDescription(updatedNeeds);

        // 获取最紧急的需求
        const urgentNeed = needsSystem.getMostUrgentNeed(updatedNeeds);

        return {
            nearbyAgents: nearbyAgents.slice(0, 5),
            availableSkills,
            recentMemories: memories,
            weather: extraContext.weather || 'sunny',
            time: extraContext.time || 'day',
            needs: updatedNeeds,
            needsDescription,
            emotionReport,
            urgentNeed,
            perceptionSystem,
            needsSystem,
            emotionSystem,
            ...extraContext
        };
    }

    /**
     * 调用 LLM
     */
    async callLLM(agent, context) {
        // 获取 Prompt 模板
        const promptTemplate = config.getValue('llm.prompts.decision', '');

        // 替换变量
        const prompt = this.buildPrompt(promptTemplate, agent, context);

        // 获取 LLM 配置
        const llmConfig = this.getLLMConfig(agent);

        // 获取语言设置
        const locale = agent.settings?.locale || 'zh-CN';

        try {
            // 调用 LLM API
            const response = await llmManager.chatWithLocale(
                locale,
                [{ role: 'user', content: prompt }],
                llmConfig
            );

            // 解析响应
            return this.parseLLMResponse(response.content);
        } catch (err) {
            logger.error(`[AIEngine] LLM call failed for ${agent.agentId}`, { error: err.message });

            // 检查是否有紧急需求，使用需求系统建议
            if (context.urgentNeed) {
                const suggestion = needsSystem.suggestAction(context.needs, agent);
                if (suggestion) {
                    return suggestion;
                }
            }

            // 返回默认决策
            return {
                skill: 'rest',
                params: { duration: 5 },
                reasoning: 'LLM unavailable, using default'
            };
        }
    }

    /**
     * 构建 Prompt
     */
    buildPrompt(template, agent, context) {
        const nearbyAgentsStr = context.nearbyAgents
            .map(a => `- ${a.name} (${a.type}) 在 ${Math.round(a.distance)} 米外`)
            .join('\n') || '周围没有其他智能体';

        const skillsStr = context.availableSkills
            .map(s => `- ${s.name}: ${s.description}`)
            .join('\n') || '无可用技能';

        const memoriesStr = context.recentMemories
            .map(m => `- ${m.content}`)
            .join('\n') || '没有记忆';

        // 需求和情绪
        const needsStr = context.needsDescription || '';
        const emotionStr = context.emotionReport || '';

        return template
            .replace('{worldName}', '智体城')
            .replace('{agentName}', agent.name)
            .replace('{energy}', agent.energy || 80)
            .replace('{emotion}', agent.mood || 'neutral')
            .replace('{social}', agent.socialNeed || 50)
            .replace('{achievement}', agent.achievementNeed || 40)
            .replace('{positionX}', agent.position?.x || 0)
            .replace('{positionZ}', agent.position?.z || 0)
            .replace('{nearbyAgents}', nearbyAgentsStr)
            .replace('{skills}', skillsStr)
            .replace('{recentMemories}', memoriesStr)
            .replace('{weather}', context.weather)
            .replace('{time}', context.time)
            .replace('{personality}', JSON.stringify(agent.traits || {}))
            .replace('{needs}', needsStr)
            .replace('{emotion}', emotionStr);
    }

    /**
     * 获取 LLM 配置
     */
    getLLMConfig(agent) {
        const locale = agent.settings?.locale || 'zh-CN';
        const model = config.get(`i18n.localeModels.${locale}`, 'minimax');

        return {
            provider: model,
            model: config.get(`llm.${model}.model`, 'MiniMax-M2'),
            temperature: config.get(`llm.${model}.temperature`, 0.7),
            maxTokens: config.get(`llm.${model}.maxTokens`, 500),
            timeout: config.get(`llm.${model}.timeout`, 60000)
        };
    }

    /**
     * 解析 LLM 响应
     */
    parseLLMResponse(response) {
        // 尝试解析 JSON
        if (typeof response === 'string') {
            try {
                return JSON.parse(response);
            } catch {
                // 如果不是 JSON，尝试提取 JSON
                const jsonMatch = response.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    try {
                        return JSON.parse(jsonMatch[0]);
                    } catch {
                        // 继续
                    }
                }

                // 如果不是 JSON，返回默认决策
                return {
                    skill: 'rest',
                    params: {},
                    reasoning: response
                };
            }
        }

        return response;
    }

    /**
     * 执行默认技能
     */
    async executeDefaultSkill(agent) {
        const defaultSkill = config.getValue('agents.default.decision.defaultSkill', 'rest');

        try {
            const result = await skillRegistry.execute(defaultSkill, agent, {}, {});

            return {
                skill: defaultSkill,
                params: {},
                result,
                reasoning: 'Default fallback skill'
            };
        } catch (err) {
            logger.error(`[AIEngine] Default skill failed`, { error: err.message });
            return null;
        }
    }

    /**
     * 强制决策（用于外部触发）
     */
    async forceDecision(agentId) {
        return await this.makeDecision(agentId, { force: true });
    }

    /**
     * 获取活动决策数
     */
    getActiveDecisionCount() {
        return this.activeDecisions.size;
    }
}

// 导出单例
const aiEngine = new AIEngine();

module.exports = {
    aiEngine,
    AIEngine,
    setStores
};
