/**
 * AnimalBehaviors - 动物行为系统
 *
 * 管理可交互动物的行为（兔子、小猫、小狗等）
 *
 * @module systems/interaction/animal-behaviors
 */

import { eventBus, Events } from '../../core/event-bus.js';

const AnimalType = {
    RABBIT: 'rabbit',
    CAT: 'cat',
    DOG: 'dog',
    BIRD: 'bird',
    BUTTERFLY: 'butterfly'
};

const AnimalBehavior = {
    SHY: 'shy',       // 兔子、小猫 - 看到智能体会逃跑
    CURIOUS: 'curious', // 蝴蝶、小狗 - 会被吸引
    FRIENDLY: 'friendly' // 小狗 - 会跟随
};

class Animal {
    constructor(id, type, position) {
        this.id = id;
        this.type = type;
        this.position = { ...position };
        this.targetPosition = null;
        this.state = 'idle'; // idle, fleeing, following, hiding
        this.stateTimer = 0;
        this.mesh = null;
    }

    update(deltaTime, agentPosition) {
        this.stateTimer += deltaTime;

        const behavior = this._getBehavior();

        switch (this.state) {
            case 'idle':
                if (this._shouldReact(agentPosition, behavior)) {
                    if (behavior === AnimalBehavior.SHY) {
                        this.state = 'fleeing';
                    } else if (behavior === AnimalBehavior.FRIENDLY || behavior === AnimalBehavior.CURIOUS) {
                        this.state = 'following';
                    }
                    this.stateTimer = 0;
                }
                break;

            case 'fleeing':
                // 跑向安全位置
                if (this.targetPosition) {
                    this._moveToward(this.targetPosition, deltaTime * 8);
                }
                if (this.stateTimer > 5) {
                    this.state = 'hiding';
                    this.stateTimer = 0;
                }
                break;

            case 'following':
                this._moveToward(agentPosition, deltaTime * 3);
                if (this.stateTimer > 10 || this._distanceTo(agentPosition) < 1) {
                    this.state = 'idle';
                    this.stateTimer = 0;
                }
                break;

            case 'hiding':
                if (this.stateTimer > 3) {
                    this.state = 'idle';
                }
                break;
        }
    }

    _getBehavior() {
        switch (this.type) {
            case AnimalType.RABBIT:
            case AnimalType.CAT:
                return AnimalBehavior.SHY;
            case AnimalType.DOG:
                return AnimalBehavior.FRIENDLY;
            case AnimalType.BUTTERFLY:
                return AnimalBehavior.CURIOUS;
            default:
                return AnimalBehavior.SHY;
        }
    }

    _shouldReact(agentPosition, behavior) {
        const dist = this._distanceTo(agentPosition);
        if (behavior === AnimalBehavior.SHY && dist < 5) return true;
        if (behavior === AnimalBehavior.CURIOUS && dist < 8) return true;
        return false;
    }

    _distanceTo(pos) {
        const dx = pos.x - this.position.x;
        const dz = pos.z - this.position.z;
        return Math.sqrt(dx * dx + dz * dz);
    }

    _moveToward(target, speed) {
        const dx = target.x - this.position.x;
        const dz = target.z - this.position.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist > 0.1) {
            this.position.x += (dx / dist) * speed;
            this.position.z += (dz / dist) * speed;
        }
    }
}

class AnimalBehaviors {
    constructor() {
        this.animals = new Map();
    }

    /**
     * 添加动物
     */
    addAnimal(id, type, position) {
        const animal = new Animal(id, type, position);
        this.animals.set(id, animal);
        return animal;
    }

    /**
     * 移除动物
     */
    removeAnimal(id) {
        this.animals.delete(id);
    }

    /**
     * 更新所有动物
     */
    update(deltaTime, agentPosition) {
        for (const animal of this.animals.values()) {
            animal.update(deltaTime, agentPosition);
        }
    }

    /**
     * 与动物交互
     */
    interact(agentId, animalId, action) {
        const animal = this.animals.get(animalId);
        if (!animal) return { success: false, message: '动物不存在' };

        switch (action) {
            case 'feed':
                animal.state = 'following';
                animal.stateTimer = 0;
                return { success: true, message: `给 ${animal.type} 喂食` };

            case 'pet':
                if (animal.type === AnimalType.CAT || animal.type === AnimalType.DOG) {
                    animal.state = 'following';
                    animal.stateTimer = 0;
                    return { success: true, message: `抚摸 ${animal.type}` };
                }
                return { success: false, message: '这种动物不喜欢被摸' };

            case 'chase':
                if (animal.type === AnimalType.RABBIT || animal.type === AnimalType.CAT) {
                    animal.state = 'fleeing';
                    animal.stateTimer = 0;
                    return { success: true, message: `${animal.type} 逃跑中` };
                }
                return { success: false, message: '无法追逐这种动物' };

            default:
                return { success: true, message: `观察 ${animal.type}` };
        }
    }
}

export { AnimalBehaviors, AnimalType, AnimalBehavior };
