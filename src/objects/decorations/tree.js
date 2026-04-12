/**
 * DecorationObject - 装饰物基类
 *
 * 对应 DESIGN.md Section 3.1 WorldObject > DecorationObject
 * 装饰物：树木、路灯、长椅、花卉、灌木等
 */

import * as THREE from 'three';
import { WorldObject } from '../../core/world-object.js';

class DecorationObject extends WorldObject {
    constructor(id, config = {}) {
        config.type = 'decoration';
        super(id, config);

        this.decorationType = config.decorationType || 'generic';

        // 可进行的交互类型
        this.interactions = config.interactions || ['look'];
    }

    _init(config) {
        // 子类在 createMesh() 中创建具体网格
    }

    /**
     * 与装饰物交互
     * @param {string} action - 动作名称
     * @returns {Object} { success, message, reward }
     */
    interact(action = 'look') {
        if (!this.interactions.includes(action)) {
            return { success: false, message: `${this.name} 不能执行动作: ${action}` };
        }
        return this.onInteract(action);
    }

    /**
     * 处理具体交互逻辑（子类覆盖）
     */
    onInteract(action) {
        return { success: true, message: `查看了 ${this.name}` };
    }
}

// ============ 花草 ============

class Flower extends DecorationObject {
    constructor(config = {}) {
        super(config.id || `flower_${Date.now()}`, {
            name: config.name || '花朵',
            x: config.x || 0,
            z: config.z || 0,
            interactions: ['look', '闻', '浇水', '采摘'],
            ...config
        });

        this.decorationType = 'flower';
        this.color = config.color || Flower.randomColor();
        this.state = 'normal'; // normal, watered, picked, withered
    }

    static randomColor() {
        const colors = [0xff6b6b, 0xffeb3b, 0xff9800, 0xe91e63, 0x9c27b0, 0xff6347];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    createMesh() {
        this.group = new THREE.Group();
        this.group.name = this.name;

        // 茎
        const stemGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.5, 6);
        const stemMat = new THREE.MeshStandardMaterial({ color: 0x228b22 });
        const stem = new THREE.Mesh(stemGeo, stemMat);
        stem.position.y = 0.25;
        this.group.add(stem);

        // 花瓣
        const petalCount = 5;
        const petalGeo = new THREE.SphereGeometry(0.15, 8, 8);
        const petalMat = new THREE.MeshStandardMaterial({ color: this.color, roughness: 0.8 });
        for (let i = 0; i < petalCount; i++) {
            const petal = new THREE.Mesh(petalGeo, petalMat);
            const angle = (i / petalCount) * Math.PI * 2;
            petal.position.set(Math.cos(angle) * 0.12, 0.55, Math.sin(angle) * 0.12);
            petal.scale.y = 0.5;
            this.group.add(petal);
        }

        // 花心
        const centerGeo = new THREE.SphereGeometry(0.08, 8, 8);
        const centerMat = new THREE.MeshStandardMaterial({ color: 0xffff00, roughness: 0.9 });
        const center = new THREE.Mesh(centerGeo, centerMat);
        center.position.y = 0.55;
        this.group.add(center);

        this._applyPosition();
        this.group.userData = { type: 'decoration', subtype: 'flower', objectId: this.id, worldObject: this };

        return this.group;
    }

    onInteract(action) {
        switch (action) {
            case '闻':
                this.state = 'smelled';
                return { success: true, message: '花朵散发出淡淡的清香！', reward: { mood: 5 } };
            case '浇水':
                this.state = 'watered';
                return { success: true, message: '花瓣上挂着晶莹的水珠', reward: { achievement: 1 } };
            case '采摘':
                if (this.state === 'withered') return { success: false, message: '这朵花已经枯萎了' };
                this.state = 'picked';
                return { success: true, message: '小心翼翼地摘下了这朵花', reward: { item: 'flower' } };
            default:
                return { success: true, message: `一朵漂亮的 ${this.name}` };
        }
    }
}

// ============ 树木 ============

class Tree extends DecorationObject {
    constructor(config = {}) {
        super(config.id || `tree_${Date.now()}`, {
            name: config.name || '树木',
            x: config.x || 0,
            z: config.z || 0,
            interactions: ['look', '靠近', '倚靠', '摇晃'],
            ...config
        });

        this.decorationType = 'tree';
        this.trunkHeight = config.trunkHeight ?? (2 + Math.random() * 2);
        this.leafColor = config.leafColor || 0x228b22;
        this.variety = config.variety || '针叶树';
    }

    createMesh() {
        this.group = new THREE.Group();
        this.group.name = this.name;

        // 树干
        const trunkGeo = new THREE.CylinderGeometry(0.2, 0.3, this.trunkHeight, 8);
        const trunkMat = new THREE.MeshStandardMaterial({ color: 0x8b4513, roughness: 0.9 });
        const trunk = new THREE.Mesh(trunkGeo, trunkMat);
        trunk.position.y = this.trunkHeight / 2;
        trunk.castShadow = true;
        this.group.add(trunk);

        // 树冠
        const leafGeo = new THREE.SphereGeometry(1.5, 8, 8);
        const leafMat = new THREE.MeshStandardMaterial({ color: this.leafColor, roughness: 0.8 });
        const positions = [
            [0, this.trunkHeight + 1, 0],
            [0.8, this.trunkHeight + 0.3, 0.5],
            [-0.6, this.trunkHeight + 0.5, -0.4]
        ];
        for (const [x, y, z] of positions) {
            const leaf = new THREE.Mesh(leafGeo, leafMat);
            leaf.position.set(x, y, z);
            leaf.scale.set(1, 0.8, 1);
            leaf.castShadow = true;
            this.group.add(leaf);
        }

        this._applyPosition();
        this.group.userData = { type: 'decoration', subtype: 'tree', objectId: this.id, worldObject: this };

        return this.group;
    }

    onInteract(action) {
        switch (action) {
            case '靠近':
                this.state = 'touched';
                return { success: true, message: `走到了一棵高大的 ${this.variety} 下，感受到阵阵清凉` };
            case '倚靠':
                return { success: true, message: '靠在树干上休息片刻...', reward: { energy: 5 } };
            case '摇晃':
                if (Math.random() < 0.3) {
                    return { success: true, message: '树叶沙沙作响，好像有什么东西掉下来了！' };
                }
                return { success: true, message: '树叶沙沙作响...' };
            default:
                return { success: true, message: `一棵茂盛的 ${this.variety}` };
        }
    }
}

// ============ 路灯 ============

class Lamp extends DecorationObject {
    constructor(config = {}) {
        super(config.id || `lamp_${Date.now()}`, {
            name: config.name || '路灯',
            x: config.x || 0,
            z: config.z || 0,
            interactions: ['look', '开关'],
            ...config
        });

        this.decorationType = 'lamp';
        this._on = false;
    }

    createMesh() {
        this.group = new THREE.Group();
        this.group.name = this.name;

        // 灯柱
        const poleGeo = new THREE.CylinderGeometry(0.1, 0.15, 3, 8);
        const poleMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.7, metalness: 0.8 });
        const pole = new THREE.Mesh(poleGeo, poleMat);
        pole.position.y = 1.5;
        pole.castShadow = true;
        this.group.add(pole);

        // 基座
        const baseGeo = new THREE.CylinderGeometry(0.3, 0.4, 0.3, 8);
        const base = new THREE.Mesh(baseGeo, poleMat);
        base.position.y = 0.15;
        this.group.add(base);

        // 灯罩
        const lampGeo = new THREE.SphereGeometry(0.3, 16, 16);
        const lampMat = new THREE.MeshStandardMaterial({
            color: 0x666666,
            roughness: 0.3
        });
        this.lampMesh = new THREE.Mesh(lampGeo, lampMat);
        this.lampMesh.position.y = 3.2;
        this.lampMesh.name = 'lamp';
        this.group.add(this.lampMesh);

        // 点光源
        this.pointLight = null;

        this._applyPosition();
        this.group.userData = { type: 'decoration', subtype: 'lamp', objectId: this.id, worldObject: this };

        return this.group;
    }

    toggle() {
        this._on = !this._on;
        if (this.lampMesh) {
            if (this._on) {
                this.lampMesh.material.color.setHex(0xffffaa);
                this.lampMesh.material.emissive = new THREE.Color(0xffffaa);
                this.lampMesh.material.emissiveIntensity = 0.8;
                this.pointLight = new THREE.PointLight(0xffffaa, 0.5, 10);
                this.pointLight.position.y = 3.2;
                this.group.add(this.pointLight);
            } else {
                this.lampMesh.material.color.setHex(0x666666);
                this.lampMesh.material.emissive = new THREE.Color(0x000000);
                this.lampMesh.material.emissiveIntensity = 0;
                if (this.pointLight) {
                    this.group.remove(this.pointLight);
                    this.pointLight = null;
                }
            }
        }
        return this._on;
    }

    onInteract(action) {
        if (action === '开关') {
            const newState = this.toggle();
            return { success: true, message: newState ? '路灯亮了起来' : '路灯熄灭了' };
        }
        return { success: true, message: this._on ? '路灯散发着温暖的光芒' : '路灯关闭着' };
    }
}

// ============ 长椅 ============

class Bench extends DecorationObject {
    constructor(config = {}) {
        super(config.id || `bench_${Date.now()}`, {
            name: config.name || '长椅',
            x: config.x || 0,
            z: config.z || 0,
            interactions: ['look', '坐下', '躺下'],
            ...config
        });

        this.decorationType = 'bench';
        this.material = config.material || '木质';
        this.allowLying = config.allowLying ?? false;
    }

    createMesh() {
        this.group = new THREE.Group();
        this.group.name = this.name;

        const color = this.material === '石质' ? 0x888888 : 0x8b4513;

        // 座面
        const seatGeo = new THREE.BoxGeometry(2, 0.15, 0.6);
        const seatMat = new THREE.MeshStandardMaterial({ color, roughness: 0.8 });
        const seat = new THREE.Mesh(seatGeo, seatMat);
        seat.position.y = 0.5;
        seat.castShadow = true;
        seat.receiveShadow = true;
        this.group.add(seat);

        // 靠背
        const backGeo = new THREE.BoxGeometry(2, 0.6, 0.1);
        const back = new THREE.Mesh(backGeo, seatMat);
        back.position.set(0, 0.85, -0.25);
        back.rotation.x = 0.1;
        back.castShadow = true;
        this.group.add(back);

        // 腿
        const legGeo = new THREE.BoxGeometry(0.1, 0.5, 0.5);
        const legMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.7, metalness: 0.5 });
        const leg1 = new THREE.Mesh(legGeo, legMat);
        leg1.position.set(-0.85, 0.25, 0);
        leg1.castShadow = true;
        this.group.add(leg1);
        const leg2 = new THREE.Mesh(legGeo, legMat);
        leg2.position.set(0.85, 0.25, 0);
        leg2.castShadow = true;
        this.group.add(leg2);

        this._applyPosition();
        this.group.userData = { type: 'decoration', subtype: 'bench', objectId: this.id, worldObject: this };

        return this.group;
    }

    onInteract(action) {
        switch (action) {
            case '坐下':
                return { success: true, message: '在长椅上坐下休息', reward: { energy: 3 } };
            case '躺下':
                if (!this.allowLying) return { success: false, message: '这个长椅不适合躺下' };
                return { success: true, message: '躺在长椅上，抬头看着天空...', reward: { energy: 5, fun: 3 } };
            default:
                return { success: true, message: `一张 ${this.material} 长椅` };
        }
    }
}

// ============ 灌木 ============

class Bush extends DecorationObject {
    constructor(config = {}) {
        super(config.id || `bush_${Date.now()}`, {
            name: config.name || '灌木',
            x: config.x || 0,
            z: config.z || 0,
            interactions: ['look'],
            ...config
        });

        this.decorationType = 'bush';
        this.color = config.color || 0x228b22;
    }

    createMesh() {
        this.group = new THREE.Group();
        this.group.name = this.name;

        const bushGeo = new THREE.SphereGeometry(0.8, 8, 8);
        const bushMat = new THREE.MeshStandardMaterial({ color: this.color, roughness: 0.9 });

        const positions = [[0, 0.6, 0], [0.5, 0.4, 0.2], [-0.4, 0.5, -0.1]];
        for (const [x, y, z] of positions) {
            const bush = new THREE.Mesh(bushGeo, bushMat);
            bush.position.set(x, y, z);
            bush.scale.set(1, 0.8, 1);
            bush.castShadow = true;
            this.group.add(bush);
        }

        this._applyPosition();
        this.group.userData = { type: 'decoration', subtype: 'bush', objectId: this.id, worldObject: this };

        return this.group;
    }
}

// ============ 岩石 ============

class Rock extends DecorationObject {
    constructor(config = {}) {
        super(config.id || `rock_${Date.now()}`, {
            name: config.name || '岩石',
            x: config.x || 0,
            z: config.z || 0,
            interactions: ['look'],
            ...config
        });

        this.decorationType = 'rock';
        this.color = config.color || 0x888888;
    }

    createMesh() {
        this.group = new THREE.Group();
        this.group.name = this.name;

        const rockGeo = new THREE.DodecahedronGeometry(0.6, 0);
        const rockMat = new THREE.MeshStandardMaterial({
            color: this.color,
            roughness: 0.9,
            metalness: 0.1,
            flatShading: true
        });
        const rock = new THREE.Mesh(rockGeo, rockMat);
        rock.position.y = 0.4;
        rock.rotation.set(Math.random() * 0.5, Math.random() * Math.PI, Math.random() * 0.5);
        rock.scale.set(1, 0.7, 1.2);
        rock.castShadow = true;
        this.group.add(rock);

        this._applyPosition();
        this.group.userData = { type: 'decoration', subtype: 'rock', objectId: this.id, worldObject: this };

        return this.group;
    }
}

export { DecorationObject, Flower, Tree, Lamp, Bench, Bush, Rock };
