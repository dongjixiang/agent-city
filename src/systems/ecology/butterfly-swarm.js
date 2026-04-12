/**
 * ButterflySwarm - 蝴蝶群系统
 *
 * 使用粒子系统模拟蝴蝶飞舞
 *
 * @module systems/ecology/butterfly-swarm
 */

import * as THREE from 'three';

class Butterfly {
    constructor(id, position) {
        this.id = id;
        this.position = { ...position };
        this.angle = Math.random() * Math.PI * 2;
        this.radius = Math.random() * 3 + 1;
        this.speed = 0.3 + Math.random() * 0.3;
        this.phase = Math.random() * Math.PI * 2;
        this.verticalSpeed = 0.5 + Math.random() * 0.5;
        this.wingPhase = Math.random() * Math.PI * 2;
        this.mesh = null;
        this.targetHeight = 1 + Math.random() * 2;
    }

    update(deltaTime, time) {
        // 圆形飞舞
        this.angle += this.speed * deltaTime * 0.5;
        this.position.x = Math.cos(this.angle) * this.radius;
        this.position.z = Math.sin(this.angle) * this.radius;

        // 上下浮动
        this.position.y = this.targetHeight + Math.sin(time * this.verticalSpeed + this.phase) * 0.5;

        // 翅膀振动
        this.wingPhase += deltaTime * 15;

        // 更新 mesh
        if (this.mesh) {
            this.mesh.position.set(this.position.x, this.position.y, this.position.z);
            this.mesh.rotation.y = this.angle;
        }
    }

    createMesh() {
        const group = new THREE.Group();

        // 身体
        const bodyGeo = new THREE.SphereGeometry(0.03, 4, 4);
        const bodyMat = new THREE.MeshLambertMaterial({ color: 0x4a4a6a });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        group.add(body);

        // 翅膀（使用平面）
        const wingGeo = new THREE.PlaneGeometry(0.08, 0.06);

        const colors = [0xff69b4, 0xffa500, 0x87ceeb, 0xdda0dd, 0x98fb98];
        const wingColor = colors[Math.floor(Math.random() * colors.length)];
        const wingMat = new THREE.MeshBasicMaterial({
            color: wingColor,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.8
        });

        const leftWing = new THREE.Mesh(wingGeo, wingMat);
        leftWing.position.set(-0.04, 0, 0);
        leftWing.name = 'leftWing';
        group.add(leftWing);

        const rightWing = new THREE.Mesh(wingGeo, wingMat);
        rightWing.position.set(0.04, 0, 0);
        rightWing.name = 'rightWing';
        group.add(rightWing);

        group.scale.set(0.8, 0.8, 0.8);
        this.mesh = group;
        return group;
    }
}

class ButterflySwarm {
    constructor() {
        this.butterflies = [];
        this.group = null;
        this.scene = null;
        this.maxCount = 15;
    }

    /**
     * 初始化
     */
    init(scene) {
        this.scene = scene;
        this.group = new THREE.Group();
        scene.add(this.group);

        // 创建蝴蝶群
        for (let i = 0; i < this.maxCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = 5 + Math.random() * 20;
            const pos = {
                x: Math.cos(angle) * radius,
                y: 1 + Math.random() * 3,
                z: Math.sin(angle) * radius
            };
            this.addButterfly(pos);
        }

        console.log(`[ButterflySwarm] ${this.maxCount} butterflies spawned`);
    }

    /**
     * 添加蝴蝶
     */
    addButterfly(position) {
        const id = `butterfly_${this.butterflies.length}`;
        const butterfly = new Butterfly(id, position);
        const mesh = butterfly.createMesh();
        mesh.position.set(position.x, position.y, position.z);
        this.group.add(mesh);
        this.butterflies.push(butterfly);
    }

    /**
     * 更新
     */
    update(deltaTime) {
        const time = performance.now() / 1000;
        for (const b of this.butterflies) {
            b.update(deltaTime, time);

            // 翅膀振动
            if (b.mesh) {
                const wingAngle = Math.sin(b.wingPhase) * 0.5;
                const leftWing = b.mesh.getObjectByName('leftWing');
                const rightWing = b.mesh.getObjectByName('rightWing');
                if (leftWing) leftWing.rotation.z = wingAngle;
                if (rightWing) rightWing.rotation.z = -wingAngle;
            }
        }
    }

    /**
     * 销毁
     */
    dispose() {
        if (this.group && this.scene) {
            this.scene.remove(this.group);
        }
        this.butterflies = [];
    }
}

export { ButterflySwarm };
