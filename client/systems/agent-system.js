/**
 * AgentSystem - 智能体系统
 *
 * 管理所有智能体的创建、更新、销毁
 *
 * @module systems/agent-system
 */

import { Agent, AgentState } from '../core/agent.js';
import { eventBus, Events } from '../core/event-bus.js';
import { SpatialIndex } from '../core/spatial-index.js';
import { worldStateProvider } from '../ai/world-state-provider.js';

class AgentSystem {
    constructor() {
        /** @type {Map<string, Agent>} */
        this.agents = new Map();
        this.spatialIndex = null;
        this.scene = null;
    }

    /**
     * 初始化
     */
    init(scene) {
        this.scene = scene;
        this.spatialIndex = new SpatialIndex();
        worldStateProvider.setSpatialIndex(this.spatialIndex);
        console.log('[AgentSystem] Initialized');
    }

    /**
     * 添加智能体
     */
    addAgent(agentData) {
        const agent = new Agent(agentData.id, agentData);
        this.agents.set(agent.id, agent);

        // 将 mesh 添加到场景
        const mesh = agent.getMesh();
        if (this.scene && mesh) {
            this.scene.add(mesh);
        } else if (mesh) {
            // scene 还没准备好，延迟添加
            const tryAdd = () => {
                if (this.scene) {
                    this.scene.add(mesh);
                    console.log('[AgentSystem] Delayed add mesh for', agent.name);
                }
            };
            setTimeout(tryAdd, 500);
        }

        // 注册到空间索引
        if (this.spatialIndex) {
            this.spatialIndex.insert(agent, agent.position, agent.id);
        }

        eventBus.emit(Events.AGENT_ADDED, { agent });
        return agent;
    }

    /**
     * 移除智能体
     */
    removeAgent(agentId) {
        const agent = this.agents.get(agentId);
        if (agent) {
            agent.goOffline();
            // 从场景中移除 mesh
            if (this.scene && agent.mesh && agent.mesh.parent) {
                this.scene.remove(agent.mesh);
            }
            this.agents.delete(agentId);
            if (this.spatialIndex) {
                this.spatialIndex.remove(agentId);
            }
            eventBus.emit(Events.AGENT_REMOVED, { agentId });
        }
    }

    /**
     * 获取智能体
     */
    getAgent(agentId) {
        return this.agents.get(agentId);
    }

    /**
     * 获取所有智能体
     */
    getAllAgents() {
        return Array.from(this.agents.values());
    }

    /**
     * 更新所有智能体
     */
    update(deltaTime) {
        for (const agent of this.agents.values()) {
            agent.update(deltaTime);

            // 更新空间索引
            if (this.spatialIndex) {
                this.spatialIndex.update(agent.id, agent.position);
            }
        }
    }

    /**
     * 选择智能体
     */
    selectAgent(agentId) {
        // 通知相机跟随
        eventBus.emit(Events.AGENT_SELECTED, { agentId });
    }

    /**
     * 取消选择
     */
    deselectAll() {
        eventBus.emit(Events.AGENT_DESELECTED, {});
    }

    /**
     * 销毁
     */
    dispose() {
        for (const agent of this.agents.values()) {
            agent.dispose();
        }
        this.agents.clear();
    }
}

// 全局单例
const agentSystem = new AgentSystem();

export { AgentSystem, agentSystem };
