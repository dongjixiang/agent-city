/**
 * MovableObjects - 可移动物体系统
 *
 * 管理可以被智能体推动/捡起的物体（石头、树枝、道具等）
 *
 * @module systems/interaction/movable-objects
 */

import { eventBus, Events } from '../../core/event-bus.js';

class MovableObject {
    constructor(id, type, position, mass = 1) {
        this.id = id;
        this.type = type;
        this.position = { ...position };
        this.velocity = { x: 0, z: 0 };
        this.mass = mass;
        this.isHeld = false;
        this.ownerId = null;
        this.friction = 0.95;
    }

    /**
     * 被推动
     */
    push(fromX, fromZ, force) {
        const dx = this.position.x - fromX;
        const dz = this.position.z - fromZ;
        const dist = Math.sqrt(dx * dx + dz * dz);

        if (dist > 0) {
            const strength = force / (this.mass * dist);
            this.velocity.x += (dx / dist) * strength;
            this.velocity.z += (dz / dist) * strength;
        }
    }

    /**
     * 被拾取
     */
    pickup(agentId) {
        this.isHeld = true;
        this.ownerId = agentId;
        this.velocity = { x: 0, z: 0 };
        return { success: true, message: `拾取了 ${this.type}` };
    }

    /**
     * 放下
     */
    drop(agentPosition) {
        this.isHeld = false;
        this.ownerId = null;
        this.position = { x: agentPosition.x, z: agentPosition.z };
    }

    /**
     * 每帧更新
     */
    update(deltaTime) {
        if (this.isHeld) return;

        // 应用速度
        this.position.x += this.velocity.x * deltaTime;
        this.position.z += this.velocity.z * deltaTime;

        // 摩擦力
        this.velocity.x *= this.friction;
        this.velocity.z *= this.friction;

        // 停止微动
        if (Math.abs(this.velocity.x) < 0.01) this.velocity.x = 0;
        if (Math.abs(this.velocity.z) < 0.01) this.velocity.z = 0;
    }
}

class MovableObjects {
    constructor() {
        /** @type {Map<string, MovableObject>} */
        this.objects = new Map();
    }

    /**
     * 注册物体
     */
    register(id, type, position, mass) {
        const obj = new MovableObject(id, type, position, mass);
        this.objects.set(id, obj);
        return obj;
    }

    /**
     * 移除物体
     */
    unregister(id) {
        this.objects.delete(id);
    }

    /**
     * 推动物体
     */
    push(objectId, fromAgentId, force) {
        const obj = this.objects.get(objectId);
        if (!obj) return { success: false, message: '物体不存在' };
        if (obj.isHeld) return { success: false, message: '物体被持有' };

        obj.push(fromAgentId.x, fromAgentId.z, force);
        return { success: true, message: `推动了 ${obj.type}` };
    }

    /**
     * 拾取物体
     */
    pickup(objectId, agentId) {
        const obj = this.objects.get(objectId);
        if (!obj) return { success: false, message: '物体不存在' };
        return obj.pickup(agentId);
    }

    /**
     * 放下物体
     */
    drop(objectId, agentPosition) {
        const obj = this.objects.get(objectId);
        if (!obj) return { success: false, message: '物体不存在' };
        obj.drop(agentPosition);
        return { success: true, message: `放下了 ${obj.type}` };
    }

    /**
     * 更新所有物体
     */
    update(deltaTime) {
        for (const obj of this.objects.values()) {
            obj.update(deltaTime);
        }
    }

    /**
     * 获取范围内的可拾取物体
     */
    getNearby(agentId, position, range) {
        const nearby = [];
        for (const obj of this.objects.values()) {
            if (obj.ownerId) continue;
            const dx = obj.position.x - position.x;
            const dz = obj.position.z - position.z;
            const dist = Math.sqrt(dx * dx + dz * dz);
            if (dist <= range) {
                nearby.push({ id: obj.id, type: obj.type, distance: dist });
            }
        }
        return nearby.sort((a, b) => a.distance - b.distance);
    }
}

export { MovableObjects, MovableObject };
