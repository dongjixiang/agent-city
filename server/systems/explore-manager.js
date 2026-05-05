/**
 * ExploreManager - 探索行为管理器
 * 
 * 负责智能体的自动探索行为、路径规划和移动执行
 */

const WorldData = require('../data/world-data');

class ExploreManager {
    constructor(agentStore, wsHandler) {
        this.agentStore = agentStore;
        this.wsHandler = wsHandler;
        this.cooldowns = new Map(); // agentId -> { endTime }
        this.defaultCooldown = 30000; // 30秒
        this.stepDelay = 800; // 每步 800ms
    }

    /**
     * 设置冷却时间
     */
    setCooldown(agentId, durationMs = this.defaultCooldown) {
        this.cooldowns.set(agentId, { endTime: Date.now() + durationMs });
    }

    /**
     * 检查是否在冷却中
     */
    isInCooldown(agentId) {
        const data = this.cooldowns.get(agentId);
        return data && Date.now() < data.endTime;
    }

    /**
     * 获取剩余冷却时间（秒）
     */
    getRemainingCooldown(agentId) {
        const data = this.cooldowns.get(agentId);
        if (!data) return 0;
        return Math.ceil((data.endTime - Date.now()) / 1000);
    }

    /**
     * 触发默认探索
     * 智能体沿道路网络移动，不穿越建筑
     */
    async triggerDefaultExplore(agentId, agentData) {
        if (!this.agentStore) return;

        try {
            const agent = await this.agentStore.get(agentId);
            if (!agent || !agent.position) {
                console.log(`[ExploreManager] ${agentId} 未找到位置信息`);
                return null;
            }

            const current = agent.position;

            // 使用 WorldData 找安全的目标位置
            const target = WorldData.findSafeSpawnPosition();

            // 获取道路路径点序列
            const path = WorldData.getRoadPath(current.x, current.z, target.x, target.z);

            console.log(`[ExploreManager] ${agentId} 道路路径: ${JSON.stringify(path.map(p => `(${p.x.toFixed(1)}, ${p.z.toFixed(1)})`))}`);

            // 如果起点不在道路上，先snap过去
            if (path.length > 0 && path[0].type === 'snap-start') {
                const snapPos = path[0];
                await this.agentStore.updatePosition(agentId, { x: snapPos.x, z: snapPos.z });
                this._broadcastMove(agentId, snapPos);
            }

            // 更新状态为行走中
            await this.agentStore.updateState(agentId, 'walking');

            // 分步沿道路移动
            for (let i = 1; i < path.length; i++) {
                const step = path[i];

                // 延迟发送下一步
                await new Promise(resolve => setTimeout(resolve, this.stepDelay));

                // 更新位置
                await this.agentStore.updatePosition(agentId, { x: step.x, z: step.z });
                this._broadcastMove(agentId, step);
            }

            // 5秒后恢复空闲状态
            setTimeout(async () => {
                if (this.agentStore) {
                    await this.agentStore.updateState(agentId, 'idle');
                }
            }, 5000);

            // 开始冷却
            this.setCooldown(agentId);

            return path;
        } catch (e) {
            console.error(`[ExploreManager] 默认探索失败:`, e.message);
            return null;
        }
    }

    /**
     * 执行一次探索移动（用于 AI 决策）
     * 找到附近有效的随机位置并移动
     */
    async performExplore(agentId, agentData) {
        if (!this.agentStore || !agentData?.position) return null;

        const current = agentData.position;
        const angle = Math.random() * Math.PI * 2;
        const dist = 10 + Math.random() * 15;
        let newX = current.x + Math.cos(angle) * dist;
        let newZ = current.z + Math.sin(angle) * dist;

        // 验证新位置，如果无效则找附近有效位置
        if (!WorldData.isValidWalkPosition(newX, newZ)) {
            const snapped = WorldData.snapToRoad(current.x, current.z);
            newX = snapped.x + (Math.random() - 0.5) * 20;
            newZ = snapped.z + (Math.random() - 0.5) * 20;
        }

        // 再次验证
        if (!WorldData.isValidWalkPosition(newX, newZ)) {
            // 找最近的安全位置
            const safe = WorldData.findSafeSpawnPosition();
            newX = safe.x;
            newZ = safe.z;
        }

        await this.agentStore.updatePosition(agentId, { x: newX, z: newZ });
        await this.agentStore.updateState(agentId, 'idle');

        return { x: newX, z: newZ };
    }

    /**
     * 广播移动事件
     */
    _broadcastMove(agentId, position) {
        const message = { type: 'AGENT_MOVED', agentId, position };
        
        if (this.wsHandler) {
            this.wsHandler.broadcast(message);
        }
    }

    /**
     * 设置 WebSocket Handler
     */
    setWsHandler(handler) {
        this.wsHandler = handler;
    }

    /**
     * 清理智能体的冷却状态
     */
    clearCooldown(agentId) {
        this.cooldowns.delete(agentId);
    }

    /**
     * 清理所有冷却状态
     */
    dispose() {
        this.cooldowns.clear();
    }
}

module.exports = ExploreManager;
