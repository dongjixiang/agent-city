/**
 * EcologySystem - 生态系统
 * 
 * 管理动物行为和生态
 * 对应 DESIGN.md Section 7.12.1 动物行为系统
 */

import * as THREE from 'three';
import { eventBus } from '../core/event-bus.js';

class Animal {
    constructor(id, config) {
        this.id = id;
        this.species = config.species || 'bird';
        this.position = { x: config.x || 0, z: config.z || 0 };
        this.target = null;
        this.state = 'idle';
        this.homePosition = { ...this.position };
        
        // 性格参数
        this.temperament = config.temperament || 'curious'; // shy, curious, friendly
        this.alertRange = config.alertRange || 10;
        this.fleeRange = config.fleeRange || 5;
        this.speed = config.speed || 2;
        this.canFly = config.canFly || false;
        
        // 亲密度
        this.familiarity = new Map();
        
        this.mesh = null;
    }

    /**
     * 创建网格
     */
    create() {
        const group = new THREE.Group();
        group.name = `${this.species}_${this.id}`;

        const colors = {
            bird: 0x3498db,
            butterfly: 0xf1c40f,
            rabbit: 0x95a5a6,
            cat: 0xff6633,
            dog: 0x8b4513
        };

        const color = colors[this.species] || 0x888888;

        switch (this.species) {
            case 'bird':
                this.createBird(group, color);
                break;
            case 'butterfly':
                this.createButterfly(group, color);
                break;
            case 'rabbit':
                this.createRabbit(group, color);
                break;
            default:
                this.createGeneric(group, color);
        }

        group.position.set(this.position.x, 0, this.position.z);
        this.mesh = group;
        return group;
    }

    createBird(group, color) {
        // 身体
        const bodyGeo = new THREE.SphereGeometry(0.3, 8, 8);
        const bodyMat = new THREE.MeshStandardMaterial({ color });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = 1;
        body.scale.y = 0.8;
        group.add(body);

        // 头
        const headGeo = new THREE.SphereGeometry(0.2, 8, 8);
        const head = new THREE.Mesh(headGeo, bodyMat);
        head.position.set(0.2, 1.2, 0);
        group.add(head);

        // 翅膀
        const wingGeo = new THREE.BoxGeometry(0.6, 0.1, 0.3);
        const wingMat = new THREE.MeshStandardMaterial({ color, side: THREE.DoubleSide });
        const wing1 = new THREE.Mesh(wingGeo, wingMat);
        wing1.position.set(0, 1, 0.2);
        wing1.name = 'wing_left';
        group.add(wing1);

        const wing2 = new THREE.Mesh(wingGeo, wingMat);
        wing2.position.set(0, 1, -0.2);
        wing2.name = 'wing_right';
        group.add(wing2);
    }

    createButterfly(group, color) {
        const wingGeo = new THREE.CircleGeometry(0.3, 8);
        const wingMat = new THREE.MeshStandardMaterial({ 
            color, 
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.8
        });

        const wing1 = new THREE.Mesh(wingGeo, wingMat);
        wing1.position.set(0.2, 0.8, 0);
        wing1.rotation.y = 0.3;
        wing1.name = 'wing_right';
        group.add(wing1);

        const wing2 = new THREE.Mesh(wingGeo, wingMat);
        wing2.position.set(-0.2, 0.8, 0);
        wing2.rotation.y = -0.3;
        wing2.name = 'wing_left';
        group.add(wing2);
    }

    createRabbit(group, color) {
        const bodyGeo = new THREE.SphereGeometry(0.4, 8, 8);
        const bodyMat = new THREE.MeshStandardMaterial({ color });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = 0.4;
        body.scale.set(1, 0.8, 1.2);
        group.add(body);

        // 耳朵
        const earGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.5, 6);
        const ear1 = new THREE.Mesh(earGeo, bodyMat);
        ear1.position.set(0.15, 0.9, 0);
        ear1.rotation.z = 0.2;
        group.add(ear1);

        const ear2 = new THREE.Mesh(earGeo, bodyMat);
        ear2.position.set(-0.15, 0.9, 0);
        ear2.rotation.z = -0.2;
        group.add(ear2);
    }

    createGeneric(group, color) {
        const bodyGeo = new THREE.SphereGeometry(0.3, 8, 8);
        const bodyMat = new THREE.MeshStandardMaterial({ color });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = 0.5;
        group.add(body);
    }

    /**
     * 更新
     */
    update(deltaTime, agents) {
        // 有目标时移动
        if (this.target) {
            const dx = this.target.x - this.position.x;
            const dz = this.target.z - this.position.z;
            const dist = Math.sqrt(dx * dx + dz * dz);

            if (dist > 0.5) {
                this.position.x += (dx / dist) * this.speed * deltaTime;
                this.position.z += (dz / dist) * this.speed * deltaTime;
                this.state = this.canFly && this.species === 'bird' ? 'flying' : 'moving';
            } else {
                this.target = null;
                this.state = 'idle';
            }
        } else if (this.state === 'idle') {
            // 随机游荡
            if (Math.random() < 0.01) {
                const angle = Math.random() * Math.PI * 2;
                const dist = 5 + Math.random() * 10;
                this.target = {
                    x: this.homePosition.x + Math.cos(angle) * dist,
                    z: this.homePosition.z + Math.sin(angle) * dist
                };
            }
        }

        // 更新网格位置
        if (this.mesh) {
            this.mesh.position.x = this.position.x;
            this.mesh.position.z = this.position.z;

            // 面向移动方向
            if (this.target) {
                const dx = this.target.x - this.position.x;
                const dz = this.target.z - this.position.z;
                this.mesh.rotation.y = Math.atan2(dx, dz);
            }
        }

        // 响应附近智能体
        for (const agent of agents) {
            const dist = Math.hypot(
                agent.position.x - this.position.x,
                agent.position.z - this.position.z
            );
            if (dist < this.alertRange) {
                this.reactToAgent(agent, dist);
                break;
            }
        }
    }

    /**
     * 对智能体做出反应
     */
    reactToAgent(agent, dist) {
        const fame = this.familiarity.get(agent.id) || 0;

        switch (this.temperament) {
            case 'shy':
                if (dist < this.fleeRange) {
                    this.state = 'fleeing';
                    this.fleeFrom(agent.position);
                } else if (dist < this.alertRange) {
                    this.state = 'alert';
                }
                break;

            case 'curious':
                if (dist < this.fleeRange && fame < 0.3) {
                    this.state = 'fleeing';
                    this.fleeFrom(agent.position);
                } else if (dist < this.alertRange) {
                    this.state = 'approaching';
                    this.moveToward(agent.position);
                }
                break;

            case 'friendly':
                if (fame > 0.5) {
                    this.state = 'friendly';
                    this.moveToward(agent.position);
                }
                break;
        }
    }

    fleeFrom(position) {
        const dx = this.position.x - position.x;
        const dz = this.position.z - position.z;
        const len = Math.hypot(dx, dz);
        if (len > 0) {
            this.target = {
                x: this.position.x + (dx / len) * 10,
                z: this.position.z + (dz / len) * 10
            };
        }
    }

    moveToward(position) {
        const dx = position.x - this.position.x;
        const dz = position.z - this.position.z;
        const len = Math.hypot(dx, dz);
        if (len > 2) {
            this.target = {
                x: this.position.x + (dx / len) * 3,
                z: this.position.z + (dz / len) * 3
            };
        }
    }

    /**
     * 交互
     */
    interact(agent, action) {
        const fame = this.familiarity.get(agent.id) || 0;

        switch (action) {
            case '喂食':
                this.familiarity.set(agent.id, Math.min(1, fame + 0.3));
                this.state = 'eating';
                this.moveToward(agent.position);
                return { success: true, message: `${this.getName()} 开心地吃着你喂的食物` };

            case '抚摸':
                if (this.temperament === 'shy' && fame < 0.3) {
                    return { success: false, message: `${this.getName()} 太害羞了，不敢让你摸` };
                }
                this.familiarity.set(agent.id, Math.min(1, fame + 0.2));
                return { success: true, message: `${this.getName()} 舒服地眯起了眼睛` };

            case '打招呼':
                this.familiarity.set(agent.id, Math.min(1, fame + 0.1));
                if (this.temperament === 'friendly' || fame > 0.5) {
                    this.state = 'friendly';
                    this.moveToward(agent.position);
                    return { success: true, message: `${this.getName()} 欢快地跑过来迎接你！` };
                }
                return { success: true, message: `${this.getName()} 好奇地看着你` };

            default:
                return { success: true, message: `${this.getName()} 在这里${this.getStateDesc()}` };
        }
    }

    getName() {
        const names = {
            bird: '小鸟',
            butterfly: '蝴蝶',
            rabbit: '小兔子',
            cat: '小猫',
            dog: '小狗'
        };
        return names[this.species] || this.species;
    }

    getStateDesc() {
        const descs = {
            idle: '悠闲地待着',
            alert: '警惕地张望',
            fleeing: '飞快地跑走',
            eating: '津津有味地吃东西',
            moving: '走来走去',
            flying: '飞翔中',
            friendly: '友好地靠近',
            approaching: '好奇地走过来'
        };
        return descs[this.state] || '一动不动';
    }
}

class EcologySystem {
    constructor() {
        this.scene = null;
        this.group = null;
        this.animals = new Map();
        this.isRunning = false;
    }

    init(scene) {
        this.scene = scene;
        this.group = new THREE.Group();
        this.group.name = 'ecology';
        this.scene.add(this.group);
        this.createAnimals();
        return this;
    }

    createAnimals() {
        // 创建各种动物
        const configs = [
            { id: 'bird_1', species: 'bird', x: 20, z: 15, temperament: 'shy', alertRange: 15, fleeRange: 8, canFly: true },
            { id: 'bird_2', species: 'bird', x: -25, z: 10, temperament: 'shy', alertRange: 15, fleeRange: 8, canFly: true },
            { id: 'bird_3', species: 'bird', x: 10, z: -30, temperament: 'curious', alertRange: 12, fleeRange: 6, canFly: true },
            { id: 'butterfly_1', species: 'butterfly', x: 5, z: 20, temperament: 'curious', alertRange: 5, fleeRange: 3 },
            { id: 'butterfly_2', species: 'butterfly', x: -15, z: -10, temperament: 'curious', alertRange: 5, fleeRange: 3 },
            { id: 'butterfly_3', species: 'butterfly', x: 30, z: 25, temperament: 'curious', alertRange: 5, fleeRange: 3 },
            { id: 'rabbit_1', species: 'rabbit', x: -30, z: 30, temperament: 'shy', alertRange: 10, fleeRange: 5 },
            { id: 'rabbit_2', species: 'rabbit', x: 35, z: -20, temperament: 'shy', alertRange: 10, fleeRange: 5 }
        ];

        for (const config of configs) {
            this.createAnimal(config);
        }

        console.log(`[Ecology] Created ${this.animals.size} animals`);
    }

    createAnimal(config) {
        const animal = new Animal(config.id, config);
        const mesh = animal.create();
        this.group.add(mesh);
        this.animals.set(config.id, animal);
        return animal;
    }

    /**
     * 更新所有动物
     */
    update(deltaTime, agents) {
        if (!this.isRunning) return;

        for (const animal of this.animals.values()) {
            animal.update(deltaTime, agents);
        }
    }

    /**
     * 获取动物
     */
    getAnimal(id) {
        return this.animals.get(id);
    }

    /**
     * 获取所有动物
     */
    getAllAnimals() {
        return Array.from(this.animals.values());
    }

    /**
     * 开始
     */
    start() {
        this.isRunning = true;
    }

    /**
     * 暂停
     */
    pause() {
        this.isRunning = false;
    }

    /**
     * 销毁
     */
    dispose() {
        for (const animal of this.animals.values()) {
            if (animal.mesh) {
                this.group.remove(animal.mesh);
            }
        }
        this.animals.clear();
        if (this.group && this.scene) {
            this.scene.remove(this.group);
        }
    }
}

const ecologySystem = new EcologySystem();

export { EcologySystem, ecologySystem, Animal };
