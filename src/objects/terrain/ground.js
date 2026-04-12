/**
 * TerrainManager - 地形管理器
 * 
 * 负责地面、网格、水域等地形创建
 */

import * as THREE from 'three';

class TerrainManager {
    constructor() {
        this.terrain = null;
        this.gridHelper = null;
        this.water = null;
        this.initialized = false;
        this.scene = null;

        // 配置
        this.config = {
            groundSize: 100,
            groundColor: 0x2a2a4a,
            gridColor: 0x444466,
            gridColorCenter: 0x333355,
            gridDivisions: 20,
            waterLevel: -10,
            showGrid: true
        };
    }

    /**
     * 初始化地形
     */
    init(scene, config = {}) {
        if (this.initialized) {
            console.warn('[Terrain] Already initialized');
            return;
        }

        this.scene = scene;
        if (!scene) {
            console.error('[Terrain] Scene is required');
            return;
        }

        // 合并配置
        this.config = { ...this.config, ...config };

        // 创建地面
        this.createGround();

        // 创建网格
        if (this.config.showGrid) {
            this.createGrid();
        }

        // 创建水域（可选）
        // this.createWater();

        this.initialized = true;
        console.log('[Terrain] Initialized');
    }

    /**
     * 创建地面
     */
    createGround() {
        const { groundSize, groundColor } = this.config;

        // 地面几何体
        const groundGeometry = new THREE.PlaneGeometry(groundSize, groundSize, 32, 32);

        // 地面材质
        const groundMaterial = new THREE.MeshStandardMaterial({
            color: groundColor,
            roughness: 0.8,
            metalness: 0.2,
            flatShading: false
        });

        // 创建地面网格
        this.terrain = new THREE.Mesh(groundGeometry, groundMaterial);
        this.terrain.rotation.x = -Math.PI / 2;
        this.terrain.receiveShadow = true;
        this.terrain.name = 'ground';
        this.terrain.userData = { type: 'terrain' };

        this.scene.add(this.terrain);
    }

    /**
     * 创建网格辅助线
     */
    createGrid() {
        const { groundSize, gridColor, gridColorCenter, gridDivisions } = this.config;

        this.gridHelper = new THREE.GridHelper(
            groundSize,
            gridDivisions,
            gridColor,
            gridColorCenter
        );
        this.gridHelper.position.y = 0.01; // 略微抬高避免闪烁
        this.gridHelper.name = 'gridHelper';

        this.scene.add(this.gridHelper);
    }

    /**
     * 创建水域
     */
    createWater() {
        const { groundSize, waterLevel } = this.config;

        // 水面几何体
        const waterGeometry = new THREE.PlaneGeometry(groundSize * 0.5, groundSize * 0.5);

        // 水面材质
        const waterMaterial = new THREE.MeshStandardMaterial({
            color: 0x0066AA,
            transparent: true,
            opacity: 0.7,
            roughness: 0.1,
            metalness: 0.8
        });

        this.water = new THREE.Mesh(waterGeometry, waterMaterial);
        this.water.rotation.x = -Math.PI / 2;
        this.water.position.y = waterLevel;
        this.water.name = 'water';
        this.water.userData = { type: 'water' };

        this.scene.add(this.water);
    }

    /**
     * 获取地面
     */
    getGround() {
        return this.terrain;
    }

    /**
     * 获取网格
     */
    getGrid() {
        return this.gridHelper;
    }

    /**
     * 获取水域
     */
    getWater() {
        return this.water;
    }

    /**
     * 获取地形大小
     */
    getSize() {
        return this.config.groundSize;
    }

    /**
     * 获取边界
     */
    getBounds() {
        const halfSize = this.config.groundSize / 2;
        return {
            minX: -halfSize,
            maxX: halfSize,
            minZ: -halfSize,
            maxZ: halfSize,
            size: this.config.groundSize
        };
    }

    /**
     * 检查位置是否在边界内
     */
    isInBounds(x, z, margin = 0) {
        const bounds = this.getBounds();
        return (
            x >= bounds.minX + margin &&
            x <= bounds.maxX - margin &&
            z >= bounds.minZ + margin &&
            z <= bounds.maxZ - margin
        );
    }

    /**
     * 将位置限制在边界内
     */
    clampToBounds(x, z, margin = 1) {
        const bounds = this.getBounds();
        return {
            x: Math.max(bounds.minX + margin, Math.min(bounds.maxX - margin, x)),
            z: Math.max(bounds.minZ + margin, Math.min(bounds.maxZ - margin, z))
        };
    }

    /**
     * 设置地面颜色
     */
    setGroundColor(color) {
        if (this.terrain && this.terrain.material) {
            this.terrain.material.color.setHex(color);
        }
    }

    /**
     * 显示/隐藏网格
     */
    setGridVisible(visible) {
        if (this.gridHelper) {
            this.gridHelper.visible = visible;
        }
    }

    /**
     * 显示/隐藏水域
     */
    setWaterVisible(visible) {
        if (this.water) {
            this.water.visible = visible;
        }
    }

    /**
     * 更新水面动画
     */
    updateWater(time) {
        if (!this.water) return;

        // 简单的波浪效果
        const vertices = this.water.geometry.attributes.position;
        for (let i = 0; i < vertices.count; i++) {
            const x = vertices.getX(i);
            const z = vertices.getZ(i);
            const y = Math.sin(x * 0.1 + time) * 0.2 + Math.sin(z * 0.1 + time * 0.8) * 0.2;
            vertices.setZ(i, y);
        }
        vertices.needsUpdate = true;
    }

    /**
     * 销毁
     */
    dispose() {
        if (this.terrain) {
            this.scene?.remove(this.terrain);
            this.terrain.geometry?.dispose();
            this.terrain.material?.dispose();
            this.terrain = null;
        }

        if (this.gridHelper) {
            this.scene?.remove(this.gridHelper);
            this.gridHelper = null;
        }

        if (this.water) {
            this.scene?.remove(this.water);
            this.water.geometry?.dispose();
            this.water.material?.dispose();
            this.water = null;
        }

        this.initialized = false;
    }
}

// 导出单例
const terrainManager = new TerrainManager();

export default terrainManager;
export { TerrainManager };
