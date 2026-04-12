/**
 * WorldObject - 世界对象基类
 *
 * 所有可存在于 3D 世界中的对象的基类
 *
 * @module core/world-object
 */

import * as THREE from 'three';

class WorldObject {
    constructor(id, type = 'object') {
        this.id = id;
        this.type = type;
        this.position = { x: 0, y: 0, z: 0 };
        this.rotation = { x: 0, y: 0, z: 0 };
        this.scale = { x: 1, y: 1, z: 1 };
        this.mesh = null;
        this.isVisible = true;
        this.isInteractive = false;
        this.data = {};
    }

    /**
     * 创建网格
     */
    createMesh() {
        return null;
    }

    /**
     * 获取网格
     */
    getMesh() {
        if (!this.mesh) {
            this.mesh = this.createMesh();
        }
        return this.mesh;
    }

    /**
     * 设置位置
     */
    setPosition(x, y, z) {
        this.position.x = x;
        this.position.y = y;
        this.position.z = z;
        if (this.mesh) {
            this.mesh.position.set(x, y, z);
        }
    }

    /**
     * 设置旋转
     */
    setRotation(x, y, z) {
        this.rotation.x = x;
        this.rotation.y = y;
        this.rotation.z = z;
        if (this.mesh) {
            this.mesh.rotation.set(x, y, z);
        }
    }

    /**
     * 设置缩放
     */
    setScale(x, y, z) {
        this.scale.x = x;
        this.scale.y = y;
        this.scale.z = z;
        if (this.mesh) {
            this.mesh.scale.set(x, y, z);
        }
    }

    /**
     * 显示
     */
    show() {
        this.isVisible = true;
        if (this.mesh) this.mesh.visible = true;
    }

    /**
     * 隐藏
     */
    hide() {
        this.isVisible = false;
        if (this.mesh) this.mesh.visible = false;
    }

    /**
     * 每帧更新
     */
    update(deltaTime) {
        // 子类实现
    }

    /**
     * 获取边界半径（用于空间索引）
     */
    getBoundingRadius() {
        return 1;
    }

    /**
     * 点击/交互处理
     */
    onInteract(agent, action) {
        return { success: true, message: `与 ${this.type} 交互` };
    }

    /**
     * 销毁
     */
    dispose() {
        if (this.mesh) {
            if (this.mesh.geometry) this.mesh.geometry.dispose();
            if (this.mesh.material) {
                if (Array.isArray(this.mesh.material)) {
                    this.mesh.material.forEach(m => m.dispose());
                } else {
                    this.mesh.material.dispose();
                }
            }
        }
        this.mesh = null;
    }
}

export { WorldObject };
