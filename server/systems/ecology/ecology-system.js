/**
 * EcologySystem - 生态系统管理器
 */

const logger = require('../../utils/logger');
const config = require('../../utils/config-loader');
const Animal = require('./animal');
const BirdFlock = require('./bird-flock');

class EcologySystem {
    constructor() {
        this.animals = new Map(); // id -> Animal
        this.flocks = new Map(); // id -> BirdFlock
        this.decorations = new Map(); // id -> Decoration
        this.spawnPoints = [];
        this.lastUpdate = Date.now();
        this.spawnInterval = 30000; // 30秒检查一次生成
        this.lastSpawnCheck = Date.now();
    }

    /**
     * 初始化
     */
    initialize() {
        // 加载配置
        const animalsConfig = config.getValue('world.animals', {});
        const decorationsConfig = config.getValue('world.decorations', {});

        logger.info('[EcologySystem] Initialized', {
            animalTypes: Object.keys(animalsConfig).length,
            decorationTypes: Object.keys(decorationsConfig).length
        });
    }

    /**
     * 添加动物
     */
    addAnimal(type, position, options = {}) {
        const animalsConfig = config.get(`world.animals.${type}`, {
            alertRange: 10,
            fleeRange: 5,
            speed: 1,
            temperament: 'shy'
        });

        const id = `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const animal = new Animal(id, type, position, {
            ...animalsConfig,
            ...options
        });

        this.animals.set(id, animal);

        // 如果是鸟，创建鸟群
        if (type === 'bird') {
            this.addToOrCreateFlock(animal);
        }

        return animal;
    }

    /**
     * 添加到或创建鸟群
     */
    addToOrCreateFlock(bird) {
        // 找最近的鸟群
        let nearestFlock = null;
        let nearestDist = Infinity;

        for (const flock of this.flocks.values()) {
            const d = this.distance(bird.position, flock.position);
            if (d < nearestDist && flock.birds.length < flock.maxBirds) {
                nearestDist = d;
                nearestFlock = flock;
            }
        }

        if (nearestFlock && nearestDist < 50) {
            nearestFlock.addBird({
                id: bird.id,
                position: bird.position
            });
            bird.flockId = nearestFlock.id;
        } else {
            // 创建新鸟群
            const flock = new BirdFlock({
                position: bird.position
            });
            flock.addBird({
                id: bird.id,
                position: bird.position
            });
            this.flocks.set(flock.id, flock);
            bird.flockId = flock.id;
        }
    }

    /**
     * 移除动物
     */
    removeAnimal(id) {
        const animal = this.animals.get(id);
        if (!animal) return false;

        // 如果是鸟，从鸟群移除
        if (animal.type === 'bird' && animal.flockId) {
            const flock = this.flocks.get(animal.flockId);
            if (flock) {
                flock.removeBird(id);
                if (flock.birds.length === 0) {
                    this.flocks.delete(animal.flockId);
                }
            }
        }

        return this.animals.delete(id);
    }

    /**
     * 更新生态系统
     */
    update(deltaTime) {
        const now = Date.now();

        // 更新所有动物
        for (const animal of this.animals.values()) {
            animal.update(deltaTime);

            // 如果是鸟，更新鸟群
            if (animal.type === 'bird' && animal.flockId) {
                const flock = this.flocks.get(animal.flockId);
                if (flock) {
                    flock.update(deltaTime);
                }
            }
        }

        // 检查是否需要生成新动物
        if (now - this.lastSpawnCheck > this.spawnInterval) {
            this.checkSpawn();
            this.lastSpawnCheck = now;
        }

        return this.getState();
    }

    /**
     * 检查生成
     */
    checkSpawn() {
        const maxAnimals = 50;
        const currentCount = this.animals.size;

        if (currentCount >= maxAnimals) return;

        // 随机生成
        if (Math.random() > 0.7) {
            const types = ['bird', 'butterfly', 'rabbit', 'cat'];
            const type = types[Math.floor(Math.random() * types.length)];
            const position = this.getRandomPosition();

            this.addAnimal(type, position);
            logger.debug(`[EcologySystem] Spawned ${type} at`, position);
        }
    }

    /**
     * 获取随机位置
     */
    getRandomPosition() {
        return {
            x: (Math.random() - 0.5) * 100,
            z: (Math.random() - 0.5) * 100
        };
    }

    /**
     * 对刺激做出反应
     */
    reactToStimulus(stimulus) {
        for (const animal of this.animals.values()) {
            animal.reactToStimulus(stimulus);
        }
    }

    /**
     * 吸引鸟群到某点
     */
    attractFlockTo(point) {
        for (const flock of this.flocks.values()) {
            flock.flyTo(point);
        }
    }

    /**
     * 吓跑所有动物
     */
    scareAll(position, radius = 20) {
        for (const animal of this.animals.values()) {
            const dist = this.distance(animal.position, position);
            if (dist < radius) {
                animal.state = 'fleeing';
                animal.target = { x: position.x + 20, z: position.z + 20 };
            }
        }

        // 散开鸟群
        for (const flock of this.flocks.values()) {
            flock.scatter();
        }
    }

    /**
     * 添加装饰物
     */
    addDecoration(type, position, options = {}) {
        const id = `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const decoration = {
            id,
            type,
            position,
            state: 'normal',
            lastInteraction: null,
            ...options
        };

        this.decorations.set(id, decoration);
        return decoration;
    }

    /**
     * 与装饰物交互
     */
    interactWithDecoration(decorationId, action, agentId) {
        const decoration = this.decorations.get(decorationId);
        if (!decoration) return null;

        decoration.lastInteraction = Date.now();
        decoration.lastInteractedBy = agentId;

        const results = {
            flower: {
                smell: '花的香味令人愉悦',
                water: '花被浇了水，更加鲜艳了',
                pick: '采摘了一朵花'
            },
            tree: {
                lean: '靠在树上休息片刻',
                shake: '摇了摇树，什么也没发生',
                climb: '爬上了树'
            },
            lamp: {
                turn_on: '灯亮了',
                turn_off: '灯灭了'
            },
            bench: {
                sit: '坐在长椅上休息',
                lie: '躺在长椅上晒太阳'
            }
        };

        const actionResult = results[decoration.type]?.[action] || `${action} ${decoration.type}`;

        return {
            decoration: {
                id: decoration.id,
                type: decoration.type,
                state: decoration.state
            },
            result: actionResult
        };
    }

    /**
     * 计算距离
     */
    distance(p1, p2) {
        const dx = p1.x - p2.x;
        const dz = p1.z - p2.z;
        return Math.sqrt(dx * dx + dz * dz);
    }

    /**
     * 获取生态系统状态
     */
    getState() {
        return {
            animals: Array.from(this.animals.values()).map(a => a.getState()),
            flocks: Array.from(this.flocks.values()).map(f => f.getState()),
            decorations: Array.from(this.decorations.values()).map(d => ({
                id: d.id,
                type: d.type,
                position: d.position,
                state: d.state
            })),
            stats: {
                totalAnimals: this.animals.size,
                totalFlocks: this.flocks.size,
                totalDecorations: this.decorations.size
            }
        };
    }

    /**
     * 获取某范围内的所有实体
     */
    getEntitiesInRange(position, radius) {
        const entities = [];

        for (const animal of this.animals.values()) {
            const dist = this.distance(animal.position, position);
            if (dist <= radius) {
                entities.push({
                    ...animal.getState(),
                    distance: dist,
                    entityType: 'animal'
                });
            }
        }

        for (const decoration of this.decorations.values()) {
            const dist = this.distance(decoration.position, position);
            if (dist <= radius) {
                entities.push({
                    ...decoration,
                    distance: dist,
                    entityType: 'decoration'
                });
            }
        }

        // 按距离排序
        entities.sort((a, b) => a.distance - b.distance);

        return entities;
    }
}

module.exports = EcologySystem;
