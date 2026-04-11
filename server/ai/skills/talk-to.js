/**
 * TalkToSkill - 交谈技能
 */

const Skill = require('../skill');
const logger = require('../../utils/logger');

// Store 依赖
let agentStore = null;
let messageService = null;

function setStores(stores) {
    agentStore = stores.agentStore;
    messageService = stores.messageService;
}

class TalkToSkill extends Skill {
    constructor() {
        super('talk_to', {
            description: '与其他智能体交谈',
            parameters: [
                { name: 'targetName', type: 'string', description: '目标名称' },
                { name: 'message', type: 'string', description: '消息内容' }
            ],
            requiredParams: ['targetName']
        });
    }

    canExecute(agent, context) {
        // 需要附近有智能体
        return context.nearbyAgents && context.nearbyAgents.length > 0;
    }

    async execute(agent, params, context) {
        const { targetName, message } = params;

        // 查找目标
        const target = context.nearbyAgents?.find(
            a => a.name.toLowerCase().includes(targetName.toLowerCase())
        );

        if (!target) {
            return {
                success: false,
                message: `找不到名为 ${targetName} 的智能体`
            };
        }

        // 发送消息
        const content = message || this.generateGreeting(agent, target);

        if (messageService) {
            await messageService.sendDirectMessage(agent.agentId, target.agentId, content);
        }

        // 更新状态
        await agentStore.updateState(agent.agentId, 'talking');

        // 保存记忆
        await agentStore.saveMemory(agent.agentId, `和 ${target.name} 交谈: ${content}`, 'conversation');

        // 恢复状态
        await agentStore.updateState(agent.agentId, 'idle');

        logger.debug(`[TalkTo] ${agent.name} talked to ${target.name}`);

        return {
            success: true,
            target: target.name,
            content,
            message: `对 ${target.name} 说: ${content}`
        };
    }

    generateGreeting(agent, target) {
        const greetings = [
            `你好，${target.name}！`,
            `嘿，${target.name}，最近怎么样？`,
            `你好呀，${target.name}！`
        ];

        return greetings[Math.floor(Math.random() * greetings.length)];
    }
}

module.exports = TalkToSkill;
module.exports.setStores = setStores;
