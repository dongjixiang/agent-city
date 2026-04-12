/**
 * WorldObject - 世界对象基类
 * 
 * 所有世界对象的抽象基类
 * 对应 DESIGN.md Section 3.1 WorldObject 基类
 * 
 * 设计原则：
 * 1. 所有世界对象都有唯一 ID
 * 2. 所有世界对象都有位置
 * 3. 所有世界对象都可以添加到场景
 * 4. 所有世界对象都可以被选中/交互
 */

import * as THREE from 'three';
import { eventBus, Events } from './event-bus.js';

class WorldObject {
    /**
     * @param {string} id - 唯一标识符
     * @param {Object} config - 配置对象
     */
    constructor(id, config = {}) {
        // 基础属性
        this.id = id;
        this.name = config.name || id;
        this.type = 'worldObject'; // 子类覆盖：terrain, decoration, building, facility
        
        // 位置 (xz平面，y由子类决定)
        this.position = {
            x: config.x || 0,
            z: config.z || 0
        };
        
        // 旋转 (仅 y 轴旋转)
        this.rotation = config.rotation || 0; // 弧度
        
        // 缩放
        this.scale = config.scale || 1;
        
        // 可见性
        this.visible = config.visible !== false;
        
        // 交互半径 (用于点击检测)
        this.interactionRadius = config.interactionRadius || 2;
        
        // 选中状态
        this.isSelected = false;
        this.isHovered = false;
        
        // Three.js 对象
        this.mesh = null;
        this.group = null;
        
        // 初始化
        this._init(config);
    }

    /**
     * 初始化钩子 - 子类实现
     * @param {Object} config
     */
    _init(config) {
        // 子类覆盖
    }

    /**
     * 创建 Three.js 对象 - 子类必须实现
     * @returns {THREE.Group}
     */
    createMesh() {
        this.group = new THREE.Group();
        this.group.name = this.name;
        this.group.userData = {
            type: this.type,
            objectId: this.id,
            worldObject: this
        };
        return this.group;
    }

    /**
     * 添加到场景
     * @param {THREE.Scene} scene
     */
    addTo(scene) {
        if (!this.group) {
            this.createMesh();
        }
        if (this.group && scene) {
            scene.add(this.group);
            this._positionMesh();
        }
        return this;
    }

    /**
     * 从场景移除
     * @param {THREE.Scene} scene
     */
    removeFrom(scene) {
        if (this.group && scene) {
            scene.remove(this.group);
        }
        return this;
    }

    /**
     * 设置位置
     * @param {number} x
     * @param {number} z
     */
    setPosition(x, z) {
        this.position.x = x;
        this.position.z = z;
        this._positionMesh();
        return this;
    }

    /**
     * 内部方法：更新 mesh 位置
     */
    _positionMesh() {
        if (this.group) {
            this.group.position.set(this.position.x, 0, this.position.z);
            this.group.rotation.y = this.rotation;
            this.group.scale.setScalar(this.scale);
        }
    }

    /**
     * 设置旋转
     * @param {number} y - Y轴旋转（弧度）
     */
    setRotation(y) {
        this.rotation = y;
        if (this.group) {
            this.group.rotation.y = y;
        }
        return this;
    }

    /**
     * 设置缩放
     * @param {number} s
     */
    setScale(s) {
        this.scale = s;
        if (this.group) {
            this.group.scale.setScalar(s);
        }
        return this;
    }

    /**
     * 显示/隐藏
     * @param {boolean} visible
     */
    setVisible(visible) {
        this.visible = visible;
        if (this.group) {
            this.group.visible = visible;
        }
        return this;
    }

    /**
     * 获取边界
     * @returns {Object} { minX, maxX, minZ, maxZ }
     */
    getBounds() {
        if (!this.group) return null;
        const box = new THREE.Box3().setFromObject(this.group);
        return {
            minX: box.min.x,
            maxX: box.max.x,
            minZ: box.min.z,
            maxZ: box.max.z
        };
    }

    /**
     * 获取中心点
     * @returns {Object} { x, z }
     */
    getCenter() {
        return { x: this.position.x, z: this.position.z };
    }

    /**
     * 计算到另一个对象的距离
     * @param {WorldObject|Object} other - 其他对象或 {x, z}
     * @returns {number}
     */
    distanceTo(other) {
        const dx = this.position.x - (other.x || other.position?.x || 0);
        const dz = this.position.z - (other.z || other.position?.z || 0);
        return Math.sqrt(dx * dx + dz * dz);
    }

    /**
     * 是否在交互范围内
     * @param {Object} point - {x, z}
     * @returns {boolean}
     */
    isInRange(point) {
        return this.distanceTo(point) <= this.interactionRadius;
    }

    /**
     * 选中
     */
    select() {
        this.isSelected = true;
        this._updateHighlight();
        eventBus.emit(Events.WORLD_OBJECT_SELECTED, { object: this });
    }

    /**
     * 取消选中
     */
    deselect() {
        this.isSelected = false;
        this._updateHighlight();
        eventBus.emit(Events.WORLD_OBJECT_DESELECTED, { object: this });
    }

    /**
     * 悬停进入
     */
    onHoverEnter() {
        this.isHovered = true;
        this._updateHighlight();
    }

    /**
     * 悬停离开
     */
    onHoverLeave() {
        this.isHovered = false;
        this._updateHighlight();
    }

    /**
     * 更新高亮状态 - 子类覆盖
     */
    _updateHighlight() {
        // 子类覆盖实现高亮效果
    }

    /**
     * 点击处理 - 子类可覆盖
     * @param {Object} event - 原始点击事件
     */
    onClick(event) {
        eventBus.emit(Events.WORLD_OBJECT_CLICKED, { object: this, event });
    }

    /**
     * 获取描述信息
     * @returns {string}
     */
    getDescription() {
        return `${this.name} (${this.type})`;
    }

    /**
     * 销毁对象
     */
    dispose() {
        if (this.group) {
            // 递归销毁所有几何体和材质
            this.group.traverse((child) => {
                if (child.geometry) {
                    child.geometry.dispose();
                }
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(m => m.dispose());
                    } else {
                        child.material.dispose();
                    }
                }
            });
        }
        this.group = null;
        this.mesh = null;
    }

    /**
     * 序列化
     * @returns {Object}
     */
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            type: this.type,
            position: { ...this.position },
            rotation: this.rotation,
            scale: this.scale,
            visible: this.visible
        };
    }

    /**
     * 从 JSON 恢复
     * @param {Object} json
     * @returns {WorldObject}
     */
    static fromJSON(json) {
        return new WorldObject(json.id, json);
    }
}

// 导出
export { WorldObject };
export default WorldObject;
