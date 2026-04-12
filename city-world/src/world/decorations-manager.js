/**
 * DecorationsManager - 装饰物管理器
 * 
 * 管理世界中的装饰物（花草树木路灯等）
 * 对应 DESIGN.md Section 7.12.2 装饰物系统
 */

import * as THREE from 'three';
import { eventBus, Events } from '../../core/event-bus.js';

class DecorationsManager {
    constructor() {
        this.scene = null;
        this.group = null;
        this.decorations = new Map();  // id -> decoration data + mesh
        this.types = ['flower', 'tree', 'lamp', 'bench', 'bush', 'rock', 'fountain'];
    }

    /**
     * 初始化
     */
    init(scene) {
        this.scene = scene;
        this.group = new THREE.Group();
        this.group.name = 'decorations';
        this.scene.add(this.group);
        return this;
    }

    /**
     * 创建所有装饰物
     */
    createAll() {
        this.createFlowers(30);
        this.createTrees(20);
        this.createLamps(15);
        this.createBenches(10);
        this.createBushes(15);
        this.createRocks(12);
        this.createFountains(3);
        
        console.log(`[Decorations] Created ${this.decorations.size} decorations`);
        return this;
    }

    /**
     * 创建花朵
     */
    createFlowers(count) {
        const colors = [0xff69b4, 0xff6347, 0xffd700, 0x9370db, 0x00ced1];
        
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = 10 + Math.random() * 40;
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;

            const flower = this.createDecoration({
                id: `flower_${i}`,
                name: `flower_${i}`,
                type: 'flower',
                decorationType: 'flower',
                position: { x, z },
                color: colors[Math.floor(Math.random() * colors.length)]
            });
            this.decorations.set(flower.id, flower);
        }
    }

    /**
     * 创建树木
     */
    createTrees(count) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = 15 + Math.random() * 35;
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;

            const tree = this.createDecoration({
                id: `tree_${i}`,
                name: `tree_${i}`,
                type: 'tree',
                decorationType: 'tree',
                position: { x, z }
            });
            this.decorations.set(tree.id, tree);
        }
    }

    /**
     * 创建路灯
     */
    createLamps(count) {
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            const radius = 20;
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;

            const lamp = this.createDecoration({
                id: `lamp_${i}`,
                name: `lamp_${i}`,
                type: 'lamp',
                decorationType: 'lamp',
                position: { x, z },
                state: 'on'
            });
            this.decorations.set(lamp.id, lamp);
        }
    }

    /**
     * 创建长椅
     */
    createBenches(count) {
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            const radius = 15 + Math.random() * 10;
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;

            const bench = this.createDecoration({
                id: `bench_${i}`,
                name: `bench_${i}`,
                type: 'bench',
                decorationType: 'bench',
                position: { x, z }
            });
            this.decorations.set(bench.id, bench);
        }
    }

    /**
     * 创建灌木
     */
    createBushes(count) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = 10 + Math.random() * 40;
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;

            const bush = this.createDecoration({
                id: `bush_${i}`,
                name: `bush_${i}`,
                type: 'bush',
                decorationType: 'bush',
                position: { x, z }
            });
            this.decorations.set(bush.id, bush);
        }
    }

    /**
     * 创建岩石
     */
    createRocks(count) {
        for (let i = 0; i < count; i++) {
            const x = -50 + Math.random() * 100;
            const z = -50 + Math.random() * 100;

            const rock = this.createDecoration({
                id: `rock_${i}`,
                name: `rock_${i}`,
                type: 'rock',
                decorationType: 'rock',
                position: { x, z }
            });
            this.decorations.set(rock.id, rock);
        }
    }

    /**
     * 创建喷泉
     */
    createFountains(count) {
        const positions = [
            { x: 0, z: 0 },
            { x: -40, z: -40 },
            { x: 40, z: 40 }
        ];

        for (let i = 0; i < count && i < positions.length; i++) {
            const fountain = this.createDecoration({
                id: `fountain_${i}`,
                name: `fountain_${i}`,
                type: 'fountain',
                decorationType: 'fountain',
                position: positions[i]
            });
            this.decorations.set(fountain.id, fountain);
        }
    }

    /**
     * 创建单个装饰物
     */
    createDecoration(config) {
        const mesh = this.createMesh(config);
        this.group.add(mesh);

        return {
            id: config.id,
            name: config.name,
            type: config.type,
            decorationType: config.decorationType,
            position: config.position,
            color: config.color,
            state: config.state || 'normal',
            mesh
        };
    }

    /**
     * 创建装饰物网格
     */
    createMesh(config) {
        const group = new THREE.Group();
        group.position.set(config.position.x, 0, config.position.z);
        group.userData = {
            type: 'decoration',
            decorationId: config.id,
            decorationType: config.decorationType
        };

        switch (config.decorationType) {
            case 'flower':
                return this.createFlowerMesh(group, config.color);
            case 'tree':
                return this.createTreeMesh(group);
            case 'lamp':
                return this.createLampMesh(group, config.state === 'on');
            case 'bench':
                return this.createBenchMesh(group);
            case 'bush':
                return this.createBushMesh(group);
            case 'rock':
                return this.createRockMesh(group);
            case 'fountain':
                return this.createFountainMesh(group);
            default:
                return group;
        }
    }

    createFlowerMesh(group, color) {
        // 茎
        const stemGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.4, 6);
        const stemMat = new THREE.MeshStandardMaterial({ color: 0x228b22 });
        const stem = new THREE.Mesh(stemGeo, stemMat);
        stem.position.y = 0.2;
        group.add(stem);

        // 花瓣
        const petalGeo = new THREE.SphereGeometry(0.12, 8, 8);
        const petalMat = new THREE.MeshStandardMaterial({ color: color || 0xff69b4 });
        for (let i = 0; i < 5; i++) {
            const petal = new THREE.Mesh(petalGeo, petalMat);
            const angle = (i / 5) * Math.PI * 2;
            petal.position.set(Math.cos(angle) * 0.1, 0.45, Math.sin(angle) * 0.1);
            petal.scale.y = 0.5;
            group.add(petal);
        }

        // 花心
        const centerGeo = new THREE.SphereGeometry(0.06, 8, 8);
        const centerMat = new THREE.MeshStandardMaterial({ color: 0xffff00 });
        const center = new THREE.Mesh(centerGeo, centerMat);
        center.position.y = 0.45;
        group.add(center);

        return group;
    }

    createTreeMesh(group) {
        const trunkHeight = 1.5 + Math.random();
        
        // 树干
        const trunkGeo = new THREE.CylinderGeometry(0.15, 0.2, trunkHeight, 8);
        const trunkMat = new THREE.MeshStandardMaterial({ color: 0x8b4513, roughness: 0.9 });
        const trunk = new THREE.Mesh(trunkGeo, trunkMat);
        trunk.position.y = trunkHeight / 2;
        trunk.castShadow = true;
        group.add(trunk);

        // 树冠
        const leafGeo = new THREE.SphereGeometry(1.2, 8, 8);
        const leafMat = new THREE.MeshStandardMaterial({ color: 0x228b22, roughness: 0.8 });
        const leaf = new THREE.Mesh(leafGeo, leafMat);
        leaf.position.y = trunkHeight + 0.8;
        leaf.scale.y = 0.8;
        leaf.castShadow = true;
        group.add(leaf);

        return group;
    }

    createLampMesh(group, isOn) {
        // 灯柱
        const poleGeo = new THREE.CylinderGeometry(0.08, 0.1, 3, 8);
        const poleMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8 });
        const pole = new THREE.Mesh(poleGeo, poleMat);
        pole.position.y = 1.5;
        group.add(pole);

        // 灯座
        const baseGeo = new THREE.CylinderGeometry(0.25, 0.3, 0.2, 8);
        const base = new THREE.Mesh(baseGeo, poleMat);
        base.position.y = 0.1;
        group.add(base);

        // 灯罩
        const lampGeo = new THREE.SphereGeometry(0.25, 16, 16);
        const lampMat = new THREE.MeshStandardMaterial({
            color: isOn ? 0xffffaa : 0x666666,
            emissive: isOn ? 0xffffaa : 0x000000,
            emissiveIntensity: isOn ? 0.8 : 0
        });
        const lamp = new THREE.Mesh(lampGeo, lampMat);
        lamp.position.y = 3.2;
        group.add(lamp);

        if (isOn) {
            const light = new THREE.PointLight(0xffffaa, 0.5, 8);
            light.position.y = 3.2;
            group.add(light);
        }

        return group;
    }

    createBenchMesh(group) {
        const woodMat = new THREE.MeshStandardMaterial({ color: 0x8b4513, roughness: 0.8 });

        // 座面
        const seatGeo = new THREE.BoxGeometry(1.5, 0.1, 0.5);
        const seat = new THREE.Mesh(seatGeo, woodMat);
        seat.position.y = 0.5;
        seat.castShadow = true;
        group.add(seat);

        // 靠背
        const backGeo = new THREE.BoxGeometry(1.5, 0.4, 0.08);
        const back = new THREE.Mesh(backGeo, woodMat);
        back.position.set(0, 0.75, -0.2);
        back.rotation.x = 0.1;
        group.add(back);

        // 腿
        const legGeo = new THREE.BoxGeometry(0.08, 0.5, 0.4);
        const metalMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.5 });
        
        const leg1 = new THREE.Mesh(legGeo, metalMat);
        leg1.position.set(-0.65, 0.25, 0);
        group.add(leg1);

        const leg2 = new THREE.Mesh(legGeo, metalMat);
        leg2.position.set(0.65, 0.25, 0);
        group.add(leg2);

        return group;
    }

    createBushMesh(group) {
        const bushGeo = new THREE.SphereGeometry(0.6, 8, 8);
        const bushMat = new THREE.MeshStandardMaterial({ color: 0x228b22, roughness: 0.9 });

        // 多个球体组合
        const positions = [[0, 0.5, 0], [0.4, 0.35, 0.2], [-0.3, 0.4, -0.1]];
        for (const pos of positions) {
            const bush = new THREE.Mesh(bushGeo, bushMat);
            bush.position.set(...pos);
            bush.scale.set(1, 0.8, 1);
            bush.castShadow = true;
            group.add(bush);
        }

        return group;
    }

    createRockMesh(group) {
        const rockGeo = new THREE.DodecahedronGeometry(0.5, 0);
        const rockMat = new THREE.MeshStandardMaterial({
            color: 0x888888,
            roughness: 0.9,
            flatShading: true
        });
        const rock = new THREE.Mesh(rockGeo, rockMat);
        rock.position.y = 0.3;
        rock.rotation.set(Math.random(), Math.random(), Math.random());
        rock.scale.set(1, 0.7, 1.2);
        rock.castShadow = true;
        group.add(rock);

        return group;
    }

    createFountainMesh(group) {
        // 基座
        const baseGeo = new THREE.CylinderGeometry(2.5, 3, 1, 16);
        const baseMat = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.8 });
        const base = new THREE.Mesh(baseGeo, baseMat);
        base.position.y = 0.5;
        base.receiveShadow = true;
        group.add(base);

        // 水池
        const poolGeo = new THREE.CylinderGeometry(2, 2, 0.4, 16);
        const poolMat = new THREE.MeshStandardMaterial({
            color: 0x4488aa,
            transparent: true,
            opacity: 0.7
        });
        const pool = new THREE.Mesh(poolGeo, poolMat);
        pool.position.y = 0.7;
        group.add(pool);

        // 中央柱子
        const pillarGeo = new THREE.CylinderGeometry(0.25, 0.35, 3.5, 8);
        const pillarMat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, roughness: 0.7 });
        const pillar = new THREE.Mesh(pillarGeo, pillarMat);
        pillar.position.y = 2.25;
        pillar.castShadow = true;
        group.add(pillar);

        // 顶部装饰
        const topGeo = new THREE.SphereGeometry(0.4, 16, 16);
        const topMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.5 });
        const top = new THREE.Mesh(topGeo, topMat);
        top.position.y = 4.2;
        group.add(top);

        return group;
    }

    /**
     * 获取装饰物
     */
    getDecoration(id) {
        return this.decorations.get(id);
    }

    /**
     * 获取所有装饰物
     */
    getAllDecorations() {
        return Array.from(this.decorations.values());
    }

    /**
     * 获取范围内的装饰物
     */
    getInRadius(position, radius) {
        const results = [];
        for (const deco of this.decorations.values()) {
            const dx = deco.position.x - position.x;
            const dz = deco.position.z - position.z;
            const dist = Math.sqrt(dx * dx + dz * dz);
            if (dist <= radius) {
                results.push({ ...deco, distance: dist });
            }
        }
        return results.sort((a, b) => a.distance - b.distance);
    }

    /**
     * 开关灯
     */
    toggleLamp(id) {
        const deco = this.decorations.get(id);
        if (!deco || deco.type !== 'lamp') return;

        deco.state = deco.state === 'on' ? 'off' : 'on';
        
        // 更新灯的状态
        deco.mesh.traverse(child => {
            if (child.isMesh && child.geometry.type === 'SphereGeometry') {
                child.material.color.setHex(deco.state === 'on' ? 0xffffaa : 0x666666);
                child.material.emissive.setHex(deco.state === 'on' ? 0xffffaa : 0x000000);
                child.material.emissiveIntensity = deco.state === 'on' ? 0.8 : 0;
            }
        });

        // 更新点光源
        if (deco.state === 'on') {
            const light = new THREE.PointLight(0xffffaa, 0.5, 8);
            light.position.y = 3.2;
            deco.mesh.add(light);
        } else {
            deco.mesh.children = deco.mesh.children.filter(c => !(c.isLight));
        }

        return deco.state;
    }

    /**
     * 与装饰物交互
     */
    interact(agent, decorationId, action) {
        const deco = this.decorations.get(decorationId);
        if (!deco) {
            return { success: false, message: '找不到该装饰物' };
        }

        // 检查距离
        const dx = deco.position.x - agent.position.x;
        const dz = deco.position.z - agent.position.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        const maxDist = this.getInteractionRadius(deco.type);

        if (dist > maxDist) {
            return { success: false, message: '太远了，无法交互' };
        }

        // 根据类型处理交互
        switch (deco.type) {
            case 'flower':
                return this.interactFlower(agent, deco, action);
            case 'tree':
                return this.interactTree(agent, deco, action);
            case 'lamp':
                return this.interactLamp(agent, deco, action);
            case 'bench':
                return this.interactBench(agent, deco, action);
            default:
                return { success: true, message: `${deco.name} 在这里${deco.state}` };
        }
    }

    getInteractionRadius(type) {
        const radii = {
            flower: 2,
            tree: 3,
            lamp: 2,
            bench: 2,
            bush: 2,
            rock: 2,
            fountain: 4
        };
        return radii[type] || 2;
    }

    interactFlower(agent, deco, action) {
        switch (action) {
            case '闻':
                return { success: true, message: `${agent.name} 闻了闻花香，感觉心情好了！` };
            case '浇水':
                return { success: true, message: `${agent.name} 给花浇了水，花朵更加鲜艳了！` };
            case '采摘':
                return { success: true, message: `${agent.name} 采摘了一朵花，装扮自己！`, reward: 'flower' };
            default:
                return { success: true, message: '这是一朵美丽的花' };
        }
    }

    interactTree(agent, deco, action) {
        switch (action) {
            case '靠近':
                return { success: true, message: `${agent.name} 靠近了大树，感受它的生命力` };
            case '倚靠':
                return { success: true, message: `${agent.name} 倚靠在大树上休息片刻` };
            case '摇晃':
                return { success: true, message: `${agent.name} 摇晃了大树，树叶沙沙作响` };
            default:
                return { success: true, message: '这是一棵大树' };
        }
    }

    interactLamp(agent, deco, action) {
        if (action === '开关') {
            const newState = this.toggleLamp(deco.id);
            return { success: true, message: `路灯被切换到${newState}状态` };
        }
        return { success: true, message: `路灯现在是${deco.state}` };
    }

    interactBench(agent, deco, action) {
        switch (action) {
            case '坐下':
                return { success: true, message: `${agent.name} 坐在长椅上休息` };
            case '躺下':
                return { success: true, message: `${agent.name} 躺在长椅上小憩` };
            default:
                return { success: true, message: '这是一条长椅' };
        }
    }

    /**
     * 获取组
     */
    getGroup() {
        return this.group;
    }

    /**
     * 销毁
     */
    dispose() {
        for (const deco of this.decorations.values()) {
            this.group.remove(deco.mesh);
            deco.mesh.traverse(child => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) child.material.dispose();
            });
        }
        this.decorations.clear();
        if (this.group && this.scene) {
            this.scene.remove(this.group);
        }
    }
}

const decorationsManager = new DecorationsManager();

export { DecorationsManager, decorationsManager };
