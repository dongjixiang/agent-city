/**
 * AgentLifecycle - 智能体生命周期管理
 *
 * 管理智能体的上线、下线、快照保存与恢复
 *
 * @module ai/agent-lifecycle
 */

import { eventBus, Events } from '../core/event-bus.js';

/**
 * 生命周期状态
 */
const LifecycleState = {
    CREATED: 'created',
    INITIALIZING: 'initializing',
    ONLINE: 'online',
    OFFLINE: 'offline',
    SUSPENDED: 'suspended'
};

class AgentLifecycle {
    constructor(agent) {
        this.agent = agent;
        this.state = LifecycleState.CREATED;
        this.snapshotInterval = null;
        this.lastSnapshot = null;
    }

    /**
     * 初始化智能体
     */
    async init() {
        this.state = LifecycleState.INITIALIZING;

        // 通知上线
        eventBus.emit(Events.AGENT_ADDED, { agent: this.agent });

        this.state = LifecycleState.ONLINE;
        this.startAutoSnapshot(60000); // 每60秒保存快照

        return this;
    }

    /**
     * 下线
     */
    goOffline() {
        this.state = LifecycleState.OFFLINE;
        this.stopAutoSnapshot();
        this.saveSnapshot();
        eventBus.emit(Events.AGENT_REMOVED, { agent: this.agent });
    }

    /**
     * 暂停
     */
    suspend() {
        if (this.state === LifecycleState.ONLINE) {
            this.state = LifecycleState.SUSPENDED;
            this.saveSnapshot();
        }
    }

    /**
     * 恢复
     */
    resume() {
        if (this.state === LifecycleState.SUSPENDED) {
            this.state = LifecycleState.ONLINE;
        }
    }

    /**
     * 保存快照
     */
    saveSnapshot() {
        this.lastSnapshot = {
            state: this.state,
            agentState: this.agent.toJSON ? this.agent.toJSON() : null,
            timestamp: Date.now()
        };
        return this.lastSnapshot;
    }

    /**
     * 恢复快照
     */
    restoreSnapshot(snapshot) {
        if (!snapshot) return false;
        // 恢复逻辑
        return true;
    }

    /**
     * 启动自动快照
     */
    startAutoSnapshot(intervalMs) {
        this.stopAutoSnapshot();
        this.snapshotInterval = setInterval(() => {
            if (this.state === LifecycleState.ONLINE) {
                this.saveSnapshot();
            }
        }, intervalMs);
    }

    /**
     * 停止自动快照
     */
    stopAutoSnapshot() {
        if (this.snapshotInterval) {
            clearInterval(this.snapshotInterval);
            this.snapshotInterval = null;
        }
    }

    /**
     * 销毁
     */
    dispose() {
        this.stopAutoSnapshot();
    }
}

export { AgentLifecycle, LifecycleState };
