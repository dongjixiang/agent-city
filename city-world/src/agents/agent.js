/**
 * Agent - 智能体类
 *
 * 对应 DESIGN.md Section 4 智能体系统
 * 继承 WorldObject，所有智能体的基类
 *
 * 设计原则：
 * - 每个 Agent 有唯一 ID、名字、标签
 * - 智能体有位置、朝向、速度
 * - 智能体有自己的决策循环（由 AI 驱动）
 * - 智能体有情绪、需求、记忆
 */

import * as THREE from 'three';
import { WorldObject } from '../../core/world-object.js';
import { eventBus, Events } from '../../core/event-bus.js';

// 智能体状态
const AgentState = {
    IDLE: 'idle',           // 静止
    MOVING: 'moving',       // 移动中
    SPEAKING: 'speaking',   // 说话中
    THINKING: 'thinking',   // 思考中
    RESTING: 'resting',    // 休息中
    WORKING: 'working',     // 工作中
    SOCIAL: 'social',       // 社交中
    FLEEING: 'fleeing'      // 逃跑中
};

// 智能体类型
const AgentType = {
    LOBSTER: 'lobster',     // 龙虾（默认）
    HUMAN: 'human'          // 人形
};

class Agent extends WorldObject {
    /**
     * @param {string} id - 唯一标识符
     * @param {Object} config - 配置
     */
    constructor(id, config = {}) {
        super(id, {
            type: 'agent',
            name: config.name || `Agent_${id}`,
            x: config.x ?? 0,
            z: config.z ?? 0,
            interactionRadius: config.interactionRadius ?? 3,
            ...config
        });

        // 标签（用于分类）
        this.tags = config.tags || [];

        // 智能体类型
        this.agentType = config.agentType || AgentType.LOBSTER;

        // 状态
        this.state = AgentState.IDLE;

        // 移动
        this.speed = config.speed ?? 5;
        this.targetX = config.x ?? 0;
        this.targetZ = config.z ?? 0;
        this.rotation = 0; // 朝向（弧度）

        // 视野范围
        this.visionRange = config.visionRange ?? 15;

        // 生命周期
        this.isOnline = true;
        this.lastActiveTime = Date.now();

        // 情绪
        this.emotion = config.emotion || 'neutral';

        // 需求（0-100）
        this.needs = {
            energy: 80,      // 体力
            social: 60,     // 社交
            fun: 50,        // 娱乐
            achievement: 40  // 成就
        };

        // 拥有的技能
        this.skills = new Set(config.skills || ['move-to', 'look']);

        // 当前正在使用的技能
        this.currentSkill = null;

        // 社交关系
        this.relationships = new Map(); // agentId -> { familiarity, trust }

        // 声誉
        this.reputation = config.reputation ?? 50;

        // 世界引用
        this._world = null;

        // Three.js 网格
        this._mesh = null;
        this._nameSprite = null;
        this._speechBubble = null;
        this._thoughtBubble = null;

        // AI 决策
        this._aiEnabled = config.aiEnabled ?? false;
        this._aiCooldown = 0;
        this._aiCooldownTime = config.aiCooldownTime ?? 2; // 秒
    }

    // ============ 基础方法 ============

    _init(config) {
        // 创建网格由子类或工厂调用
    }

    /**
     * 设置所属世界（由 WorldBuilder 注入）
     */
    setWorld(world) {
        this._world = world;
    }

    getWorld() {
        return this._world;
    }

    // ============ 移动 ============

    /**
     * 设置目标位置
     */
    setTarget(x, z) {
        this.targetX = x;
        this.targetZ = z;
        if (this.state === AgentState.IDLE) {
            this.state = AgentState.MOVING;
        }
    }

    /**
     * 更新位置（每帧调用）
     * @param {number} deltaTime - 秒
     */
    update(deltaTime) {
        const dx = this.targetX - this.position.x;
        const dz = this.targetZ - this.position.z;
        const dist = Math.sqrt(dx * dx + dz * dz);

        if (dist > 0.1) {
            // 移动
            const moveSpeed = this.speed * deltaTime;
            const ratio = Math.min(moveSpeed / dist, 1);
            this.position.x += dx * ratio;
            this.position.z += dz * ratio;

            // 面向移动方向
            this.rotation = Math.atan2(dx, dz);

            this.state = AgentState.MOVING;
            this._positionMesh();
        } else if (this.state === AgentState.MOVING) {
            this.state = AgentState.IDLE;
        }

        // AI 冷却
        if (this._aiEnabled && this._aiCooldown > 0) {
            this._aiCooldown -= deltaTime;
        }

        // 需求自然衰减
        this._decayNeeds(deltaTime);

        // 发送移动事件
        if (this.state === AgentState.MOVING) {
            eventBus.emit(Events.AGENT_MOVED, { agentId: this.id, position: { ...this.position } });
        }
    }

    /**
     * 需求衰减
     */
    _decayNeeds(deltaTime) {
        const rate = deltaTime * 0.5; // 每秒衰减速率
        this.needs.energy = Math.max(0, this.needs.energy - rate * 0.3);
        this.needs.social = Math.max(0, this.needs.social - rate * 0.2);
        this.needs.fun = Math.max(0, this.needs.fun - rate * 0.1);
        this.needs.achievement = Math.max(0, this.needs.achievement - rate * 0.05);

        // 体力低时自动休息
        if (this.needs.energy < 10 && this.state !== AgentState.RESTING) {
            this.rest();
        }
    }

    // ============ 交互 ============

    /**
     * 与其他智能体交互
     */
    interactWith(otherAgent, action = '打招呼') {
        if (otherAgent.id === this.id) {
            return { success: false, message: '不能和自己交互' };
        }

        const rel = this.getRelationship(otherAgent.id);
        const newRel = { ...rel };

        switch (action) {
            case '打招呼':
                newRel.familiarity = Math.min(100, (rel.familiarity || 0) + 5);
                return { success: true, message: `${this.name} 向 ${otherAgent.name} 打了个招呼` };

            case '交谈':
                newRel.familiarity = Math.min(100, (rel.familiarity || 0) + 10);
                newRel.trust = Math.min(100, (rel.trust || 0) + 5);
                this.needs.social = Math.min(100, this.needs.social + 15);
                return { success: true, message: `${this.name} 和 ${otherAgent.name} 愉快地交谈` };

            case '帮助':
                newRel.familiarity = Math.min(100, (rel.familiarity || 0) + 15);
                newRel.trust = Math.min(100, (rel.trust || 0) + 10);
                this.needs.achievement = Math.min(100, this.needs.achievement + 10);
                return { success: true, message: `${this.name} 帮助了 ${otherAgent.name}` };

            case '攻击':
                newRel.familiarity = Math.max(0, (rel.familiarity || 0) - 20);
                newRel.trust = Math.max(0, (rel.trust || 0) - 30);
                return { success: true, message: `${this.name} 攻击了 ${otherAgent.name}！` };

            default:
                return { success: false, message: `无法执行动作: ${action}` };
        }
    }

    /**
     * 获取与其他智能体的关系
     */
    getRelationship(agentId) {
        if (!this.relationships.has(agentId)) {
            this.relationships.set(agentId, { familiarity: 0, trust: 0 });
        }
        return this.relationships.get(agentId);
    }

    // ============ 技能 ============

    /**
     * 学习技能
     */
    learnSkill(skillName) {
        this.skills.add(skillName);
        return { success: true, message: `${this.name} 学会了技能: ${skillName}` };
    }

    /**
     * 是否有某技能
     */
    hasSkill(skillName) {
        return this.skills.has(skillName);
    }

    // ============ 行为 ============

    /**
     * 说话
     */
    speak(message, duration = 3) {
        this.state = AgentState.SPEAKING;
        eventBus.emit(Events.AGENT_SPEAK, { agentId: this.id, message, duration });

        // duration 秒后恢复
        setTimeout(() => {
            if (this.state === AgentState.SPEAKING) {
                this.state = AgentState.IDLE;
            }
        }, duration * 1000);
    }

    /**
     * 思考（显示思考气泡）
     */
    think(message) {
        this.state = AgentState.THINKING;
        eventBus.emit(Events.AGENT_THINK, { agentId: this.id, message });
    }

    /**
     * 休息
     */
    rest() {
        this.state = AgentState.RESTING;
        this.speak('(正在休息...)', 5);
        setTimeout(() => {
            this.needs.energy = Math.min(100, this.needs.energy + 30);
            if (this.state === AgentState.RESTING) {
                this.state = AgentState.IDLE;
            }
        }, 5000);
    }

    /**
     * 移动到位置
     */
    moveTo(x, z) {
        this.setTarget(x, z);
    }

    /**
     * 移动到其他智能体附近
     */
    moveToAgent(targetAgent, distance = 2) {
        const dx = targetAgent.position.x - this.position.x;
        const dz = targetAgent.position.z - this.position.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist > 0) {
            const ratio = (dist - distance) / dist;
            this.setTarget(this.position.x + dx * ratio, this.position.z + dz * ratio);
        }
    }

    // ============ 视野 ============

    /**
     * 获取视野范围内的对象
     * @param {SpatialIndex} spatialIndex
     * @returns {Array}
     */
    getVisibleObjects(spatialIndex) {
        return spatialIndex.queryRadius(
            this.position.x, 0, this.position.z,
            this.visionRange
        );
    }

    /**
     * 获取视野范围内的其他智能体
     * @param {SpatialIndex} spatialIndex
     * @returns {Array}
     */
    getVisibleAgents(spatialIndex) {
        const nearby = this.getVisibleObjects(spatialIndex);
        return nearby.filter(entry => entry.object.type === 'agent' && entry.object.id !== this.id);
    }

    // ============ 事件 ============

    /**
     * 进入某建筑
     */
    enterBuilding(building) {
        const result = building.onEnter(this);
        this.state = AgentState.WORKING;
        eventBus.emit(Events.BUILDING_ENTER, { agent: this, building, result });
        return result;
    }

    /**
     * 离开建筑
     */
    leaveBuilding(building) {
        building.onLeave(this);
        this.state = AgentState.IDLE;
        eventBus.emit(Events.BUILDING_LEAVE, { agent: this, building });
    }

    // ============ AI ============

    /**
     * 启用/禁用 AI
     */
    setAI(enabled) {
        this._aiEnabled = enabled;
    }

    /**
     * 执行 AI 决策（由 AI 系统调用）
     * 返回是否进行了决策
     */
    tickAI() {
        if (!this._aiEnabled || this._aiCooldown > 0) return false;

        // 触发 AI 决策
        this._aiCooldown = this._aiCooldownTime;
        return true;
    }

    // ============ 生命周期 ============

    /**
     * 下线
     */
    goOffline() {
        this.isOnline = false;
        eventBus.emit(Events.AGENT_REMOVED, { agent: this });
    }

    /**
     * 上线
     */
    goOnline() {
        this.isOnline = true;
        this.lastActiveTime = Date.now();
        eventBus.emit(Events.AGENT_ADDED, { agent: this });
    }

    // ============ 序列化 ============

    /**
     * 获取快照
     */
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            tags: [...this.tags],
            agentType: this.agentType,
            state: this.state,
            position: { ...this.position },
            target: { x: this.targetX, z: this.targetZ },
            speed: this.speed,
            visionRange: this.visionRange,
            emotion: this.emotion,
            needs: { ...this.needs },
            skills: [...this.skills],
            reputation: this.reputation,
            isOnline: this.isOnline
        };
    }

    static fromJSON(json) {
        return new Agent(json.id, {
            ...json,
            x: json.position?.x ?? 0,
            z: json.position?.z ?? 0
        });
    }
}

export { Agent, AgentState, AgentType };
