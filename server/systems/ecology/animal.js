/**
 * Animal - 动物基类
 */

const logger = require('../../utils/logger');
const config = require('../../utils/config-loader');

class Animal {
    constructor(id, type, position, animalConfig) {
        this.id = id;
        this.type = type;
        this.position = position;
        this.velocity = { x: 0, z: 0 };
        this.target = null;
        this.state = 'idle'; // idle, moving, fleeing, eating, sleeping
        this.temperament = animalConfig.temperament || 'shy';
        this.alertRange = animalConfig.alertRange || 10;
        this.fleeRange = animalConfig.fleeRange || 5;
        this.speed = animalConfig.speed || 1;
        this.canFly = animalConfig.canFly || false;
        this.canHide = animalConfig.canHide || false;
        this.mood = 100;
        this.moodDecay = animalConfig.moodDecay || 0.05;
        this.lastUpdate = Date.now();
        this.personality = this.generatePersonality();
    }

    generatePersonality() {
        const personalities = ['shy', 'curious', 'friendly'];
        return personalities[Math.floor(Math.random() * personalities.length)];
    }

    /**
     * 更新状态
     */
    update(deltaTime) {
        const now = Date.now();
        const dt = (now - this.lastUpdate) / 1000;
        this.lastUpdate = now;

        // 情绪衰减
        this.mood = Math.max(0, this.mood - this.moodDecay * dt);

        // 状态更新
        switch (this.state) {
            case 'moving':
                this.moveTowardTarget(dt);
                break;
            case 'fleeing':
                this.flee(dt);
                break;
        }

        return this;
    }

    /**
     * 移动到目标
     */
    moveTowardTarget(dt) {
        if (!this.target) {
            this.state = 'idle';
            return;
        }

        const dx = this.target.x - this.position.x;
        const dz = this.target.z - this.position.z;
        const dist = Math.sqrt(dx * dx + dz * dz);

        if (dist < 0.5) {
            this.state = 'idle';
            this.target = null;
            return;
        }

        const speed = this.speed * dt;
        this.position.x += (dx / dist) * speed;
        this.position.z += (dz / dist) * speed;
    }

    /**
     * 逃跑
     */
    flee(dt) {
        if (!this.target) {
            this.state = 'idle';
            return;
        }

        // 向相反方向逃跑
        const dx = this.position.x - this.target.x;
        const dz = this.position.z - this.target.z;
        const dist = Math.sqrt(dx * dx + dz * dz);

        if (dist > this.fleeRange * 2) {
            this.state = 'idle';
            this.target = null;
            return;
        }

        const speed = this.speed * 1.5 * dt;
        this.position.x += (dx / dist) * speed;
        this.position.z += (dz / dist) * speed;
    }

    /**
     * 对刺激做出反应
     */
    reactToStimulus(stimulus) {
        const distance = this.calculateDistance(stimulus.position);

        if (distance <= this.alertRange) {
            switch (this.temperament) {
                case 'shy':
                    if (distance <= this.fleeRange || stimulus.type === 'loud') {
                        this.state = 'fleeing';
                        this.target = stimulus;
                    } else {
                        this.state = 'moving';
                        this.target = stimulus;
                    }
                    break;

                case 'curious':
                    if (Math.random() > 0.5) {
                        this.state = 'moving';
                        this.target = stimulus;
                    }
                    break;

                case 'friendly':
                    this.state = 'moving';
                    this.target = stimulus;
                    break;
            }
        }
    }

    /**
     * 计算距离
     */
    calculateDistance(pos) {
        if (!pos) return Infinity;
        const dx = this.position.x - pos.x;
        const dz = this.position.z - pos.z;
        return Math.sqrt(dx * dx + dz * dz);
    }

    /**
     * 交互
     */
    interact(action) {
        const results = {
            look: `看到一只 ${this.type}`,
            feed: this.feed(),
            pet: this.pet(),
            chase: this.chase()
        };

        return results[action] || results.look;
    }

    feed() {
        this.mood = Math.min(100, this.mood + 30);
        return `喂养了 ${this.type}，它很开心`;
    }

    pet() {
        this.mood = Math.min(100, this.mood + 15);
        return `抚摸 ${this.type}，它发出舒服的声音`;
    }

    chase() {
        this.state = 'fleeing';
        this.target = { x: this.position.x + 10, z: this.position.z + 10 };
        return `${this.type} 受到惊吓逃跑了`;
    }

    /**
     * 获取状态
     */
    getState() {
        return {
            id: this.id,
            type: this.type,
            position: this.position,
            state: this.state,
            mood: this.mood,
            temperament: this.temperament,
            canFly: this.canFly
        };
    }
}

module.exports = Animal;
