/**
 * MessageService - 消息广播服务
 * 
 * 负责智能体消息、广播、思考的广播处理
 */

class MessageService {
    constructor(broadcastFn) {
        // 广播函数，由调用者提供
        this.broadcastFn = broadcastFn;
    }

    /**
     * 设置广播函数
     */
    setBroadcastFn(fn) {
        this.broadcastFn = fn;
    }

    /**
     * 广播消息
     */
    broadcast(message) {
        if (this.broadcastFn) {
            this.broadcastFn(message);
        }
    }

    /**
     * 发送说话消息
     */
    sendSpeak(agentId, agentName, content, targetAgentId = null) {
        this.broadcast({
            type: 'AGENT_SPEAK',
            agentId,
            name: agentName,
            content,
            targetAgentId
        });
    }

    /**
     * 发送思考消息（不广播到世界之窗，只显示在小吉头顶）
     */
    sendThought(agentId, agentName, content) {
        this.broadcast({
            type: 'AGENT_THOUGHT',
            agentId,
            agentName,
            content
        });
    }

    /**
     * 发送移动消息
     */
    sendMove(agentId, position) {
        this.broadcast({
            type: 'AGENT_MOVED',
            agentId,
            position
        });
    }

    /**
     * 发送状态变化消息
     */
    sendStateChange(agentId, state) {
        this.broadcast({
            type: 'AGENT_STATE_CHANGE',
            agentId,
            state
        });
    }

    /**
     * 发送进入世界消息
     */
    sendAgentEnter(agentId, agentName, position, tags = []) {
        this.broadcast({
            type: 'AGENT_ENTER',
            agentId,
            name: agentName,
            position,
            tags
        });
    }

    /**
     * 发送离开世界消息
     */
    sendAgentLeave(agentId) {
        this.broadcast({
            type: 'AGENT_LEAVE',
            agentId
        });
    }
}

module.exports = MessageService;
