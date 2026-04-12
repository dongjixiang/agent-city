/**
 * TerrainObject - 地形对象
 *
 * 对应 DESIGN.md Section 3.1 WorldObject > TerrainObject
 * 地形对象：地面、水域、道路等
 */

import * as THREE from 'three';
import { WorldObject } from '../../core/world-object.js';

class TerrainObject extends WorldObject {
    constructor(id, config = {}) {
        config.type = 'terrain';
        super(id, config);

        // 高度（y轴）
        this.height = config.height ?? 0;

        // 材质
        this.material = config.material || null;
    }

    _init(config) {
        // 地形对象的额外初始化
    }
}

// ============ 地面 ============

class Ground extends TerrainObject {
    constructor(config = {}) {
        super('ground', {
            name: '地面',
            x: 0,
            z: 0,
            interactionRadius: 0,
            ...config
        });

        this.groundSize = config.groundSize || 100;
        this.color = config.color || 0x2a2a4a;
    }

    createMesh() {
        this.group = new THREE.Group();
        this.group.name = 'ground';

        const geometry = new THREE.PlaneGeometry(this.groundSize, this.groundSize, 32, 32);
        const material = new THREE.MeshStandardMaterial({
            color: this.color,
            roughness: 0.8,
            metalness: 0.2
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.rotation.x = -Math.PI / 2;
        mesh.receiveShadow = true;
        mesh.userData = { type: 'terrain', objectId: this.id, worldObject: this };

        this.group.add(mesh);
        this.material = material;

        return this.group;
    }

    setColor(hexColor) {
        if (this.material) {
            this.material.color.setHex(hexColor);
        }
        this.color = hexColor;
    }
}

// ============ 水域 / 湖泊 ============

class Lake extends TerrainObject {
    constructor(config = {}) {
        super(config.id || `lake_${Date.now()}`, {
            name: config.name || '湖泊',
            x: config.x || 0,
            z: config.z || 0,
            interactionRadius: config.radius || 10,
            ...config
        });

        this.radius = config.radius || 10;
        this.waterLevel = config.waterLevel ?? 0.05;
        this.color = config.color || 0x3388cc;
    }

    createMesh() {
        this.group = new THREE.Group();
        this.group.name = this.name;

        const geometry = new THREE.CircleGeometry(this.radius, 32);
        const material = new THREE.MeshStandardMaterial({
            color: this.color,
            transparent: true,
            opacity: 0.8,
            roughness: 0.1,
            metalness: 0.3
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.rotation.x = -Math.PI / 2;
        mesh.position.y = this.waterLevel;
        mesh.userData = { type: 'terrain', subtype: 'lake', objectId: this.id, worldObject: this };

        this.group.add(mesh);
        this.material = material;
        this.mesh = mesh;

        return this.group;
    }

    /**
     * 波浪动画（由外部调用）
     */
    animate(time) {
        if (!this.mesh) return;
        const pos = this.mesh.geometry.attributes.position;
        for (let i = 0; i < pos.count; i++) {
            const x = pos.getX(i);
            const z = pos.getZ(i);
            const y = Math.sin(x * 0.1 + time) * 0.05 + Math.sin(z * 0.1 + time * 0.8) * 0.05;
            pos.setZ(i, y);
        }
        pos.needsUpdate = true;
    }
}

// ============ 道路 ============

class Road extends TerrainObject {
    constructor(config = {}) {
        super(config.id || `road_${Date.now()}`, {
            name: config.name || '道路',
            x: config.x || 0,
            z: config.z || 0,
            interactionRadius: 0,
            ...config
        });

        this.width = config.width || 4;
        this.length = config.length || 100;
        this.color = config.color || 0x333333;
    }

    createMesh() {
        this.group = new THREE.Group();
        this.group.name = this.name;

        const geometry = new THREE.PlaneGeometry(this.length, this.width);
        const material = new THREE.MeshLambertMaterial({ color: this.color });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.rotation.x = -Math.PI / 2;
        mesh.position.y = 0.02;
        mesh.receiveShadow = true;
        mesh.userData = { type: 'terrain', subtype: 'road', objectId: this.id, worldObject: this };

        this.group.add(mesh);
        this.material = material;
        this.mesh = mesh;

        return this.group;
    }
}

export { TerrainObject, Ground, Lake, Road };
