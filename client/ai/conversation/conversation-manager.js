/**
 * ConversationManager - 对话管理器
 * 
 * 智能体之间的对话是 LLM-to-LLM 的：
 * Agent A 想和 Agent B 说话
 * → Agent A 的 LLM 生成消息
 * → 消息通过服务器转发给 Agent B
 * → Agent B 的 LLM 接收到消息，决定如何回应
 * → Agent B 的回应发送回 Agent A
 */
class ConversationManager {
    constructor(agent) {
        this.agent = agent;
        this.activeConversations = new Map();
        this.conversationHistory = [];
    }

    /**
     * 收到新消息
     */
    async receiveMessage(fromAgentId, message) {
        let conversation = this.activeConversations.get(fromAgentId);
        if (!conversation) {
            conversation = {
                participant: fromAgentId,
                messages: [],
                startedAt: Date.now()
            };
            this.activeConversations.set(fromAgentId, conversation);
        }
        
        conversation.messages.push({
            from: fromAgentId,
            content: message,
            timestamp: Date.now()
        });
        
        await this.notifyLLM(fromAgentId, message);
    }

    /**
     * 通知 LLM 处理新消息
     */
    async notifyLLM(fromAgentId, message) {
        const otherAgent = world.getAgent(fromAgentId);
        if (!otherAgent) return;

        const context = {
            conversation: this.activeConversations.get(fromAgentId),
            otherAgent: {
                id: otherAgent.id,
                name: otherAgent.name,
                personality: otherAgent.personality?.describe?.() || '友好'
            }
        };

        const prompt = `
你是 ${this.agent.name}，正在和 ${otherAgent.name} 交谈。

## 对话历史
${context.conversation.messages.map(m => 
    `${m.from === this.agent.id ? '你' : otherAgent.name}: ${m.content}`
).join('\n')}

## 对方刚说
${otherAgent.name}: ${message}

## 你想说

请用中文回复，50字以内。
直接回复你想说的话，不要 JSON。
`.trim();

        const response = await llm.complete(prompt, { temperature: 0.8 });
        await this.sendMessage(fromAgentId, response.trim());
    }

    /**
     * 发送消息
     */
    async sendMessage(toAgentId, message) {
        await messageService.sendPrivate(this.agent.id, toAgentId, message);
        
        let conversation = this.activeConversations.get(toAgentId);
        if (!conversation) {
            conversation = {
                participant: toAgentId,
                messages: [],
                startedAt: Date.now()
            };
            this.activeConversations.set(toAgentId, conversation);
        }
        
        conversation.messages.push({
            from: this.agent.id,
            content: message,
            timestamp: Date.now()
        });
    }

    /**
     * 主动发起对话
     */
    async startConversation(targetAgentId, initialMessage) {
        const target = world.getAgent(targetAgentId);
        if (!target) return;

        const dist = Math.hypot(
            this.agent.position.x - target.position.x,
            this.agent.position.z - target.position.z
        );

        if (dist > 20) {
            const moveSkill = skillRegistry.get('move_to');
            if (moveSkill) {
                await moveSkill.execute(this.agent, {
                    target: targetAgentId,
                    reason: `想和 ${target.name} 交谈`
                });
            }
        }

        await this.sendMessage(targetAgentId, initialMessage);
    }
}

export { ConversationManager };
