/**
 * MovementService - 移动服务
 * 
 * 负责智能体的位置更新和移动验证
 */

const WorldData = require('../data/world-data');

class MovementService {
    constructor(agentStore, eventDispatcher) {
        this.agentStore = agentStore;
        this.eventDispatcher = eventDispatcher;
    }

    /**
     * 设置依赖
     */
    setDependencies(agentStore, eventDispatcher) {
        this.agentStore = agentStore;
        this.eventDispatcher = eventDispatcher;
    }

    /**
     * 更新智能体位置
     */
    async updatePosition(agentId, position, broadcastFn) {
        if (!this.agentStore) return false;

        const { x, z } = position;

        // 验证位置是否有效
        if (!WorldData.isValidWalkPosition(x, z)) {
            console.log(`[MovementService] 无效位置: (${x}, ${z})`);
            return false;
        }

        await this.agentStore.updatePosition(agentId, { x, z });
        await this.agentStore.updateState(agentId, 'idle');

        // 更新事件分发器的智能体数据
        if (this.eventDispatcher) {
            this.eventDispatcher.updateAgentData(agentId, {
                position: { x, z },
                state: 'idle'
            });
        }

        // 广播移动消息
        if (broadcastFn) {
            broadcastFn({ type: 'AGENT_MOVED', agentId, position: { x, z } });
        }

        return true;
    }

    /**
     * 更新智能体状态
     */
    async updateState(agentId, state, broadcastFn) {
        if (!this.agentStore) return false;

        await this.agentStore.updateState(agentId, state);

        if (this.eventDispatcher) {
            this.eventDispatcher.updateAgentData(agentId, { state });
        }

        if (broadcastFn) {
            broadcastFn({ type: 'AGENT_STATE_CHANGE', agentId, state });
        }

        return true;
    }

    /**
     * 处理 goTo / move_to 指令
     */
    async handleGoTo(agentId, params, broadcastFn) {
        if (!params || (params.x === undefined && !params.target)) {
            return { success: false, error: 'Invalid params' };
        }

        let x, z;
        if (params.target) {
            // 支持 goTo({ target: "x,z" }) 格式
            const parts = params.target.split(',').map(v => parseFloat(v.trim()));
            x = parts[0];
            z = parts[1];
        } else {
            x = params.x;
            z = params.z;
        }

        if (x === undefined || z === undefined) {
            return { success: false, error: 'Invalid coordinates' };
        }

        const success = await this.updatePosition(agentId, { x, z }, broadcastFn);
        return { success };
    }
}

module.exports = MovementService;
