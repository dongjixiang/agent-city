/**
 * AI - AI 导出
 */

const { aiEngine, AIEngine, setStores: setAIStores } = require('./ai-engine');
const { skillRegistry, SkillRegistry } = require('./skill-registry');
const Skill = require('./skill');

// 基础技能
const MoveToSkill = require('./skills/move-to');
const RestSkill = require('./skills/rest');
const TalkToSkill = require('./skills/talk-to');
const ExploreSkill = require('./skills/explore');
const InteractSkill = require('./skills/interact');
const TaskSkill = require('./skills/task');

/**
 * 初始化 AI 系统
 */
function initializeAI() {
    // 注册基础技能
    skillRegistry
        .register(MoveToSkill, 'movement')
        .register(RestSkill, 'basic')
        .register(TalkToSkill, 'social')
        .register(ExploreSkill, 'exploration')
        .register(InteractSkill, 'interaction')
        .register(TaskSkill, 'task');

    logger.info('[AI] AI system initialized');

    return {
        aiEngine,
        skillRegistry
    };
}

module.exports = {
    aiEngine,
    AIEngine,
    skillRegistry,
    Skill,
    initializeAI
};
