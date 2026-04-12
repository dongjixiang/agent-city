/**
 * Building - 建筑基类
 *
 * 所有建筑功能系统的基类
 *
 * @module systems/buildings/building
 */

import { WorldObject } from '../../core/world-object.js';
import { eventBus, Events } from '../../core/event-bus.js';

class Building extends WorldObject {
    constructor(id, name, position, config = {}) {
        super(id, 'building');

        this.name = name;
        this.position = position;
        this.setPosition(position.x, 0, position.z);

        // 建筑配置
        this.services = config.services || [];
        this.requirements = config.requirements || {};
        this.minReputation = this.requirements.minReputation || 0;

        // 使用状态
        this.activeUsers = new Map(); // agentId -> { enterTime, service }
    }

    /**
     * 检查智能体是否能进入
     */
    canEnter(agent) {
        if (agent.reputation < this.minReputation) {
            return {
                allowed: false,
                reason: `声誉需要达到 ${this.minReputation}`
            };
        }
        return { allowed: true };
    }

    /**
     * 智能体进入
     */
    enter(agent, service = null) {
        const check = this.canEnter(agent);
        if (!check.allowed) {
            return check;
        }

        this.activeUsers.set(agent.id, {
            enterTime: Date.now(),
            service: service
        });

        eventBus.emit(Events.BUILDING_ENTER, {
            agentId: agent.id,
            buildingId: this.id,
            buildingName: this.name,
            service
        });

        return {
            allowed: true,
            message: `欢迎来到 ${this.name}！`
        };
    }

    /**
     * 智能体离开
     */
    leave(agent) {
        const user = this.activeUsers.get(agent.id);
        if (!user) {
            return { success: false, message: '你不在这个建筑里' };
        }

        const duration = Date.now() - user.enterTime;
        this.activeUsers.delete(agent.id);

        eventBus.emit(Events.BUILDING_LEAVE, {
            agentId: agent.id,
            buildingId: this.id,
            buildingName: this.name,
            duration
        });

        return {
            success: true,
            message: `感谢访问 ${this.name}！`,
            duration
        };
    }

    /**
     * 使用服务
     */
    useService(agent, serviceName) {
        if (!this.services.includes(serviceName)) {
            return { success: false, message: `${this.name} 没有 ${serviceName} 服务` };
        }

        if (!this.activeUsers.has(agent.id)) {
            return { success: false, message: '请先进入建筑' };
        }

        // 调用具体服务实现
        const method = `service_${serviceName}`;
        if (typeof this[method] === 'function') {
            return this[method](agent);
        }

        return { success: true, message: `使用了 ${serviceName} 服务` };
    }

    /**
     * 获取当前状态
     */
    getStatus() {
        return {
            id: this.id,
            name: this.name,
            position: this.position,
            activeUsers: this.activeUsers.size,
            services: this.services
        };
    }

    /**
     * 每帧更新
     */
    update(deltaTime) {
        // 可用于动画或计时逻辑
    }

    /**
     * 创建 3D 模型（子类实现）
     */
    createMesh() {
        return null;
    }
}

export { Building };
