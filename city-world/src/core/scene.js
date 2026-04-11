/**
 * SceneManager - 场景管理器
 * 
 * 负责 Three.js 场景的创建和管理
 */

import * as THREE from 'three';

class SceneManager {
    constructor() {
        this.scene = null;
        this.initialized = false;
    }

    /**
     * 初始化场景
     */
    init() {
        if (this.initialized) {
            console.warn('[Scene] Already initialized');
            return this.scene;
        }

        // 创建场景
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1a1a2e);

        // 雾效果（增加深度感）
        this.scene.fog = new THREE.Fog(0x1a1a2e, 50, 150);

        // 设置全局事件分发
        this.scene.userData.eventBus = null;

        this.initialized = true;
        console.log('[Scene] Initialized');

        return this.scene;
    }

    /**
     * 获取场景
     */
    getScene() {
        if (!this.initialized) {
            this.init();
        }
        return this.scene;
    }

    /**
     * 添加对象到场景
     */
    add(object) {
        if (!this.scene) {
            console.error('[Scene] Scene not initialized');
            return;
        }
        this.scene.add(object);
    }

    /**
     * 从场景移除对象
     */
    remove(object) {
        if (!this.scene) return;
        this.scene.remove(object);
    }

    /**
     * 设置背景颜色
     */
    setBackground(color) {
        if (!this.scene) return;
        this.scene.background = new THREE.Color(color);
    }

    /**
     * 设置雾效果
     */
    setFog(color, near = 50, far = 150) {
        if (!this.scene) return;
        this.scene.fog = new THREE.Fog(color, near, far);
    }

    /**
     * 清除场景中的所有对象
     */
    clear() {
        if (!this.scene) return;

        // 遍历所有对象并移除
        while (this.scene.children.length > 0) {
            const obj = this.scene.children[0];
            this.scene.remove(obj);

            // 释放几何体和材质
            if (obj.geometry) {
                obj.geometry.dispose();
            }
            if (obj.material) {
                if (Array.isArray(obj.material)) {
                    obj.material.forEach(m => m.dispose());
                } else {
                    obj.material.dispose();
                }
            }
        }
    }

    /**
     * 获取场景中的对象列表
     */
    getObjects() {
        return this.scene ? this.scene.children : [];
    }

    /**
     * 按类型查找对象
     */
    findByType(type) {
        const result = [];
        if (!this.scene) return result;

        this.scene.traverse((obj) => {
            if (obj.userData?.type === type) {
                result.push(obj);
            }
        });

        return result;
    }

    /**
     * 按名称查找对象
     */
    findByName(name) {
        if (!this.scene) return null;
        return this.scene.getObjectByName(name);
    }

    /**
     * 获取所有智能体
     */
    getAgents() {
        return this.findByType('agent');
    }

    /**
     * 获取所有建筑
     */
    getBuildings() {
        return this.findByType('building');
    }

    /**
     * 获取所有装饰物
     */
    getDecorations() {
        return this.findByType('decoration');
    }
}

// 导出单例
const sceneManager = new SceneManager();

export default sceneManager;
export { SceneManager };
