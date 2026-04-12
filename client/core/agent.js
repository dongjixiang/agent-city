/**
 * Agent - 智能体基类
 *
 * 继承 WorldObject，所有智能体的基类
 *
 * @module core/agent
 */

import * as THREE from 'three';
import { WorldObject } from './world-object.js';
import { eventBus, Events } from './event-bus.js';

// 智能体状态
const AgentState = {
    IDLE: 'idle',
    MOVING: 'moving',
    SPEAKING: 'speaking',
    THINKING: 'thinking',
    RESTING: 'resting',
    WORKING: 'working',
    SOCIAL: 'social',
    FLEEING: 'fleeing'
};

// 智能体类型
const AgentType = {
    LOBSTER: 'lobster',
    HUMAN: 'human'
};

class Agent extends WorldObject {
    constructor(id, data = {}) {
        super(id, 'agent');

        // 身份
        this.name = data.name || `Agent_${id}`;
        this.agentType = data.agentType || AgentType.LOBSTER;

        // 状态
        this.state = AgentState.IDLE;
        this.emotion = 'neutral';
        this.visionRange = data.visionRange || 15;

        // 需求
        this.needs = {
            energy: data.needs?.energy ?? 80,
            social: data.needs?.social ?? 50,
            fun: data.needs?.fun ?? 50,
            achievement: data.needs?.achievement ?? 30
        };

        // 声誉
        this.reputation = data.reputation ?? 50;

        // 位置
        this.setPosition(
            data.position?.x ?? 0,
            data.position?.y ?? 0,
            data.position?.z ?? 0
        );

        // 移动目标
        this.targetPosition = null;
        this.speed = data.speed || 3;

        // 网格
        this.mesh = null;
        this.headMesh = null;

        // 技能
        this.skills = new Set(['move-to', 'talk-to', 'rest', 'explore', 'interact-world', 'visit_building', 'accept_task', 'complete_task']);
    }

    /**
     * 创建 3D 模型
     */
    createMesh() {
        const group = new THREE.Group();

        const bodyColor = this.agentType === AgentType.LOBSTER ? 0xe74c3c : 0x3498db;

        // 身体
        const bodyGeo = new THREE.SphereGeometry(0.4, 8, 8);
        const bodyMat = new THREE.MeshLambertMaterial({ color: bodyColor });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = 0.5;
        body.name = 'body';
        group.add(body);

        // 眼睛
        const eyeGeo = new THREE.SphereGeometry(0.08, 6, 6);
        const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const pupilGeo = new THREE.SphereGeometry(0.04, 6, 6);
        const pupilMat = new THREE.MeshBasicMaterial({ color: 0x000000 });

        for (const side of [-0.15, 0.15]) {
            const eye = new THREE.Mesh(eyeGeo, eyeMat);
            eye.position.set(side, 0.65, 0.3);
            group.add(eye);

            const pupil = new THREE.Mesh(pupilGeo, pupilMat);
            pupil.position.set(side, 0.65, 0.36);
            group.add(pupil);
        }

        // 腿部（龙虾）
        if (this.agentType === AgentType.LOBSTER) {
            const legGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.3, 4);
            const legMat = new THREE.MeshLambertMaterial({ color: 0xc0392b });
            for (let i = 0; i < 4; i++) {
                const leg = new THREE.Mesh(legGeo, legMat);
                const angle = (i / 4) * Math.PI + Math.PI / 4;
                leg.position.set(Math.cos(angle) * 0.3, 0.15, Math.sin(angle) * 0.3);
                leg.rotation.z = Math.PI / 4;
                leg.rotation.y = -angle;
                group.add(leg);
            }
        }

        this.mesh = group;
        return group;
    }

    /**
     * 设置移动目标
     */
    setTarget(x, z) {
        this.targetPosition = { x, z };
        this.state = AgentState.MOVING;
    }

    /**
     * 每帧更新
     */
    update(deltaTime) {
        // 移动逻辑
        if (this.state === AgentState.MOVING && this.targetPosition) {
            const dx = this.targetPosition.x - this.position.x;
            const dz = this.targetPosition.z - this.position.z;
            const dist = Math.sqrt(dx * dx + dz * dz);

            if (dist < 0.1) {
                this.targetPosition = null;
                this.state = AgentState.IDLE;
            } else {
                const speed = this.speed * deltaTime;
                this.position.x += (dx / dist) * Math.min(speed, dist);
                this.position.z += (dz / dist) * Math.min(speed, dist);

                // 面向移动方向
                this.rotation.y = Math.atan2(dx, dz);
            }

            if (this.mesh) {
                this.mesh.position.set(this.position.x, this.position.y, this.position.z);
                this.mesh.rotation.y = this.rotation.y;
            }
        }
    }

    /**
     * 获取边界半径
     */
    getBoundingRadius() {
        return 0.5;
    }

    /**
     * 上线
     */
    goOnline() {
        eventBus.emit(Events.AGENT_ADDED, { agent: this });
    }

    /**
     * 下线
     */
    goOffline() {
        eventBus.emit(Events.AGENT_REMOVED, { agentId: this.id });
    }

    /**
     * 转为 JSON
     */
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            type: this.agentType,
            state: this.state,
            emotion: this.emotion,
            position: { ...this.position },
            needs: { ...this.needs },
            reputation: this.reputation
        };
    }
}

export { Agent, AgentState, AgentType };
