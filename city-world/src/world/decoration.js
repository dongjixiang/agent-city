/**
 * Decoration - 装饰物类
 * 
 * 对应 DESIGN.md Section 7.12 可交互世界系统
 */

import * as THREE from 'three';

class Decoration {
    constructor(id, config) {
        this.id = id;
        this.name = config.name || id;
        this.type = config.type || 'generic';
        this.decorationType = config.decorationType || 'generic'; // flower, tree, lamp, bench
        this.position = config.position || { x: 0, z: 0 };
        this.color = config.color || 0x888888;
        this.mesh = null;
        this.state = 'normal';
        this.interactions = config.interactions || ['look'];
        this.userData = {};
    }

    /**
     * 创建网格
     */
    create() {
        switch (this.decorationType) {
            case 'flower':
                this.mesh = this.createFlower();
                break;
            case 'tree':
                this.mesh = this.createTree();
                break;
            case 'lamp':
                this.mesh = this.createLamp();
                break;
            case 'bench':
                this.mesh = this.createBench();
                break;
            case 'bush':
                this.mesh = this.createBush();
                break;
            case 'rock':
                this.mesh = this.createRock();
                break;
            case 'fountain':
                this.mesh = this.createFountain();
                break;
            default:
                this.mesh = this.createGeneric();
        }

        if (this.mesh) {
            this.mesh.position.set(this.position.x, 0, this.position.z);
            this.mesh.userData = {
                type: 'decoration',
                decorationId: this.id,
                decorationType: this.decorationType
            };
        }

        return this.mesh;
    }

    /**
     * 创建花朵
     */
    createFlower() {
        const group = new THREE.Group();
        group.name = this.name;

        // 茎
        const stemGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.5, 6);
        const stemMaterial = new THREE.MeshStandardMaterial({ color: 0x228b22 });
        const stem = new THREE.Mesh(stemGeometry, stemMaterial);
        stem.position.y = 0.25;
        group.add(stem);

        // 花朵
        const petalCount = 5;
        const petalGeometry = new THREE.SphereGeometry(0.15, 8, 8);
        const petalMaterial = new THREE.MeshStandardMaterial({
            color: this.color,
            roughness: 0.8
        });

        for (let i = 0; i < petalCount; i++) {
            const petal = new THREE.Mesh(petalGeometry, petalMaterial);
            const angle = (i / petalCount) * Math.PI * 2;
            petal.position.set(
                Math.cos(angle) * 0.12,
                0.55,
                Math.sin(angle) * 0.12
            );
            petal.scale.y = 0.5;
            group.add(petal);
        }

        // 花心
        const centerGeometry = new THREE.SphereGeometry(0.08, 8, 8);
        const centerMaterial = new THREE.MeshStandardMaterial({
            color: 0xffff00,
            roughness: 0.9
        });
        const center = new THREE.Mesh(centerGeometry, centerMaterial);
        center.position.y = 0.55;
        group.add(center);

        return group;
    }

    /**
     * 创建树木
     */
    createTree() {
        const group = new THREE.Group();
        group.name = this.name;

        // 树干
        const trunkHeight = 2 + Math.random() * 2;
        const trunkGeometry = new THREE.CylinderGeometry(0.2, 0.3, trunkHeight, 8);
        const trunkMaterial = new THREE.MeshStandardMaterial({
            color: 0x8b4513,
            roughness: 0.9
        });
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.y = trunkHeight / 2;
        trunk.castShadow = true;
        group.add(trunk);

        // 树冠 - 根据类型不同
        const leafColors = [0x228b22, 0x2e8b57, 0x3cb371];
        const leafColor = this.color || leafColors[Math.floor(Math.random() * leafColors.length)];

        // 使用多个球体组合成树冠
        const leafGeometry = new THREE.SphereGeometry(1.5, 8, 8);
        const leafMaterial = new THREE.MeshStandardMaterial({
            color: leafColor,
            roughness: 0.8
        });

        const positions = [
            [0, trunkHeight + 1, 0],
            [0.8, trunkHeight + 0.3, 0.5],
            [-0.6, trunkHeight + 0.5, -0.4]
        ];

        for (const pos of positions) {
            const leaf = new THREE.Mesh(leafGeometry, leafMaterial);
            leaf.position.set(pos[0], pos[1], pos[2]);
            leaf.scale.set(1, 0.8, 1);
            leaf.castShadow = true;
            group.add(leaf);
        }

        return group;
    }

    /**
     * 创建路灯
     */
    createLamp() {
        const group = new THREE.Group();
        group.name = this.name;

        // 灯柱
        const poleGeometry = new THREE.CylinderGeometry(0.1, 0.15, 3, 8);
        const poleMaterial = new THREE.MeshStandardMaterial({
            color: 0x333333,
            roughness: 0.7,
            metalness: 0.8
        });
        const pole = new THREE.Mesh(poleGeometry, poleMaterial);
        pole.position.y = 1.5;
        pole.castShadow = true;
        group.add(pole);

        // 灯座
        const baseGeometry = new THREE.CylinderGeometry(0.3, 0.4, 0.3, 8);
        const base = new THREE.Mesh(baseGeometry, poleMaterial);
        base.position.y = 0.15;
        group.add(base);

        // 灯罩
        const lampGeometry = new THREE.SphereGeometry(0.3, 16, 16);
        const lampMaterial = new THREE.MeshStandardMaterial({
            color: this.state === 'on' ? 0xffffaa : 0x666666,
            emissive: this.state === 'on' ? 0xffffaa : 0x000000,
            emissiveIntensity: this.state === 'on' ? 0.8 : 0,
            roughness: 0.3
        });
        const lamp = new THREE.Mesh(lampGeometry, lampMaterial);
        lamp.position.y = 3.2;
        lamp.name = 'lamp';
        group.add(lamp);

        // 点光源
        if (this.state === 'on') {
            const light = new THREE.PointLight(0xffffaa, 0.5, 10);
            light.position.y = 3.2;
            group.add(light);
        }

        return group;
    }

    /**
     * 创建长椅
     */
    createBench() {
        const group = new THREE.Group();
        group.name = this.name;

        const benchColor = this.color || 0x8b4513;

        // 座面
        const seatGeometry = new THREE.BoxGeometry(2, 0.15, 0.6);
        const seatMaterial = new THREE.MeshStandardMaterial({
            color: benchColor,
            roughness: 0.8
        });
        const seat = new THREE.Mesh(seatGeometry, seatMaterial);
        seat.position.y = 0.5;
        seat.castShadow = true;
        seat.receiveShadow = true;
        group.add(seat);

        // 靠背
        const backGeometry = new THREE.BoxGeometry(2, 0.6, 0.1);
        const back = new THREE.Mesh(backGeometry, seatMaterial);
        back.position.set(0, 0.85, -0.25);
        back.rotation.x = 0.1;
        back.castShadow = true;
        group.add(back);

        // 腿
        const legGeometry = new THREE.BoxGeometry(0.1, 0.5, 0.5);
        const legMaterial = new THREE.MeshStandardMaterial({
            color: 0x333333,
            roughness: 0.7,
            metalness: 0.5
        });

        const leg1 = new THREE.Mesh(legGeometry, legMaterial);
        leg1.position.set(-0.85, 0.25, 0);
        leg1.castShadow = true;
        group.add(leg1);

        const leg2 = new THREE.Mesh(legGeometry, legMaterial);
        leg2.position.set(0.85, 0.25, 0);
        leg2.castShadow = true;
        group.add(leg2);

        return group;
    }

    /**
     * 创建灌木
     */
    createBush() {
        const group = new THREE.Group();
        group.name = this.name;

        const bushColor = this.color || 0x228b22;
        const bushGeometry = new THREE.SphereGeometry(0.8, 8, 8);
        const bushMaterial = new THREE.MeshStandardMaterial({
            color: bushColor,
            roughness: 0.9
        });

        // 多个球体组合
        const positions = [
            [0, 0.6, 0],
            [0.5, 0.4, 0.2],
            [-0.4, 0.5, -0.1]
        ];

        for (const pos of positions) {
            const bush = new THREE.Mesh(bushGeometry, bushMaterial);
            bush.position.set(pos[0], pos[1], pos[2]);
            bush.scale.set(1, 0.8, 1);
            bush.castShadow = true;
            group.add(bush);
        }

        return group;
    }

    /**
     * 创建岩石
     */
    createRock() {
        const group = new THREE.Group();
        group.name = this.name;

        const rockColor = this.color || 0x888888;
        const rockGeometry = new THREE.DodecahedronGeometry(0.6, 0);
        const rockMaterial = new THREE.MeshStandardMaterial({
            color: rockColor,
            roughness: 0.9,
            metalness: 0.1,
            flatShading: true
        });
        const rock = new THREE.Mesh(rockGeometry, rockMaterial);
        rock.position.y = 0.4;
        rock.rotation.set(
            Math.random() * 0.5,
            Math.random() * Math.PI,
            Math.random() * 0.5
        );
        rock.scale.set(1, 0.7, 1.2);
        rock.castShadow = true;
        group.add(rock);

        return group;
    }

    /**
     * 创建喷泉
     */
    createFountain() {
        const group = new THREE.Group();
        group.name = this.name;

        // 基座
        const baseGeometry = new THREE.CylinderGeometry(3, 3.5, 1, 16);
        const baseMaterial = new THREE.MeshStandardMaterial({
            color: 0x888888,
            roughness: 0.8
        });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.y = 0.5;
        base.receiveShadow = true;
        group.add(base);

        // 水池
        const poolGeometry = new THREE.CylinderGeometry(2.5, 2.5, 0.5, 16);
        const poolMaterial = new THREE.MeshStandardMaterial({
            color: 0x4488aa,
            transparent: true,
            opacity: 0.7,
            roughness: 0.1,
            metalness: 0.3
        });
        const pool = new THREE.Mesh(poolGeometry, poolMaterial);
        pool.position.y = 0.75;
        group.add(pool);

        // 中央柱子
        const pillarGeometry = new THREE.CylinderGeometry(0.3, 0.4, 4, 8);
        const pillarMaterial = new THREE.MeshStandardMaterial({
            color: 0xaaaaaa,
            roughness: 0.7,
            metalness: 0.3
        });
        const pillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
        pillar.position.y = 2.5;
        pillar.castShadow = true;
        group.add(pillar);

        // 顶部装饰
        const topGeometry = new THREE.SphereGeometry(0.5, 16, 16);
        const topMaterial = new THREE.MeshStandardMaterial({
            color: 0xcccccc,
            roughness: 0.5,
            metalness: 0.5
        });
        const top = new THREE.Mesh(topGeometry, topMaterial);
        top.position.y = 4.8;
        group.add(top);

        return group;
    }

    /**
     * 通用装饰物
     */
    createGeneric() {
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshStandardMaterial({
            color: this.color,
            roughness: 0.8
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.y = 0.5;
        mesh.castShadow = true;
        return mesh;
    }

    /**
     * 开关灯
     */
    toggleLamp() {
        if (this.decorationType !== 'lamp') return;

        this.state = this.state === 'on' ? 'off' : 'on';

        if (this.mesh) {
            this.mesh.traverse(child => {
                if (child.isMesh && child.name === 'lamp') {
                    if (child.material) {
                        child.material.color.setHex(this.state === 'on' ? 0xffffaa : 0x666666);
                        child.material.emissive = new THREE.Color(this.state === 'on' ? 0xffffaa : 0x000000);
                        child.material.emissiveIntensity = this.state === 'on' ? 0.8 : 0;
                    }
                }
            });
        }

        return this.state;
    }

    /**
     * 获取网格
     */
    getMesh() {
        return this.mesh;
    }

    /**
     * 获取位置
     */
    getPosition() {
        return this.position;
    }

    /**
     * 获取状态
     */
    getState() {
        return this.state;
    }
}

export default Decoration;
