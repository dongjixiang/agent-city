/**
 * FacilityObject - 设施对象
 *
 * 对应 DESIGN.md Section 3.1 WorldObject > FacilityObject
 * 设施：喷泉等公共设施
 */

import * as THREE from 'three';
import { WorldObject } from '../../core/world-object.js';

class FacilityObject extends WorldObject {
    constructor(id, config = {}) {
        config.type = 'facility';
        super(id, config);

        this.facilityType = config.facilityType || 'generic';

        // 可进行的交互
        this.interactions = config.interactions || ['look', '使用'];
    }

    /**
     * 与设施交互
     */
    interact(action = '使用') {
        if (!this.interactions.includes(action)) {
            return { success: false, message: `${this.name} 不能执行: ${action}` };
        }
        return this.onInteract(action);
    }

    onInteract(action) {
        return { success: true, message: `使用了 ${this.name}` };
    }
}

// ============ 喷泉 ============

class Fountain extends FacilityObject {
    constructor(config = {}) {
        super(config.id || 'fountain', {
            name: '中央喷泉',
            x: config.x ?? 0,
            z: config.z ?? 0,
            interactionRadius: config.interactionRadius ?? 5,
            interactions: ['look', '使用', '靠近'],
            ...config
        });

        this.facilityType = 'fountain';
        this.baseRadius = 3;
        this.waterAnimationTime = 0;
    }

    createMesh() {
        this.group = new THREE.Group();
        this.group.name = this.name;

        const baseMat = new THREE.MeshStandardMaterial({ color: 0x607d8b, roughness: 0.8 });
        const waterMat = new THREE.MeshStandardMaterial({
            color: 0x42a5f5,
            transparent: true,
            opacity: 0.7,
            roughness: 0.1,
            metalness: 0.3
        });

        // 底座
        const base = new THREE.Mesh(
            new THREE.CylinderGeometry(this.baseRadius, this.baseRadius + 0.5, 0.5, 16),
            baseMat
        );
        base.position.y = 0.25;
        base.receiveShadow = true;
        this.group.add(base);

        // 水池
        const pool = new THREE.Mesh(
            new THREE.CylinderGeometry(this.baseRadius - 0.3, this.baseRadius - 0.5, 0.3, 16),
            waterMat
        );
        pool.position.y = 0.65;
        this.group.add(pool);

        // 中央柱子
        const pillar = new THREE.Mesh(
            new THREE.CylinderGeometry(0.3, 0.4, 2, 12),
            baseMat
        );
        pillar.position.y = 1.8;
        pillar.castShadow = true;
        this.group.add(pillar);

        // 水盘
        const bowl = new THREE.Mesh(
            new THREE.CylinderGeometry(1.2, 1.0, 0.25, 12),
            baseMat
        );
        bowl.position.y = 2.55;
        this.group.add(bowl);

        // 顶部球
        const top = new THREE.Mesh(
            new THREE.SphereGeometry(0.35, 12, 12),
            baseMat
        );
        top.position.y = 3.2;
        this.group.add(top);

        // 水面
        this.waterMesh = new THREE.Mesh(
            new THREE.CircleGeometry(1.1, 16),
            waterMat
        );
        this.waterMesh.rotation.x = -Math.PI / 2;
        this.waterMesh.position.y = 0.7;
        this.group.add(this.waterMesh);

        this._applyPosition();
        this.group.userData = { type: 'facility', subtype: 'fountain', objectId: this.id, worldObject: this };

        return this.group;
    }

    onInteract(action) {
        switch (action) {
            case '使用':
            case '靠近':
                return { success: true, message: '清凉的水花溅在身上，真舒服！', reward: { mood: 10 } };
            default:
                return { success: true, message: '中央喷泉，水花四溅' };
        }
    }

    /**
     * 水面动画（由外部动画循环调用）
     */
    update(deltaTime) {
        this.waterAnimationTime += deltaTime;

        if (this.waterMesh) {
            const pos = this.waterMesh.geometry.attributes.position;
            for (let i = 0; i < pos.count; i++) {
                const x = pos.getX(i);
                const z = pos.getZ(i);
                const y = Math.sin(x * 0.5 + this.waterAnimationTime * 2) * 0.03 +
                         Math.sin(z * 0.5 + this.waterAnimationTime * 1.5) * 0.03;
                pos.setZ(i, y);
            }
            pos.needsUpdate = true;
        }
    }
}

export { FacilityObject, Fountain };
