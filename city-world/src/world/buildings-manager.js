/**
 * BuildingsManager - 建筑管理器
 * 
 * 管理所有 8 大建筑，对应 DESIGN.md Section 5.1
 */

import * as THREE from 'three';
import Building from './building.js';

class BuildingsManager {
    constructor() {
        this.buildings = new Map();
        this.group = null;
        this.scene = null;
    }

    /**
     * 初始化
     */
    init(scene) {
        this.scene = scene;
        this.group = new THREE.Group();
        this.group.name = 'buildings';
        this.scene.add(this.group);

        // 创建所有建筑
        this.createAllBuildings();

        console.log(`[Buildings] Initialized ${this.buildings.size} buildings`);
        return this;
    }

    /**
     * 创建所有 8 大建筑
     */
    createAllBuildings() {
        // 根据 DESIGN.md 5.1 定义的位置
        const buildingConfigs = [
            {
                id: 'task_center',
                name: '任务中心',
                type: 'task',
                position: { x: -25, z: -25 },
                size: { width: 16, height: 15, depth: 16 }
            },
            {
                id: 'reputation_tower',
                name: '声誉塔',
                type: 'reputation',
                position: { x: 25, z: -25 },
                size: { width: 10, height: 33, depth: 10 }
            },
            {
                id: 'trading_center',
                name: '交易中心',
                type: 'trading',
                position: { x: -25, z: 25 },
                size: { width: 20, height: 16, depth: 18 }
            },
            {
                id: 'archive',
                name: '档案馆',
                type: 'archive',
                position: { x: 25, z: 25 },
                size: { width: 16, height: 15, depth: 16 }
            },
            {
                id: 'message_station',
                name: '消息站',
                type: 'communication',
                position: { x: 0, z: -35 },
                size: { width: 12, height: 21, depth: 12 }
            },
            {
                id: 'data_center',
                name: '数据中心',
                type: 'data',
                position: { x: -35, z: 0 },
                size: { width: 18, height: 8, depth: 14 }
            },
            {
                id: 'creative_workshop',
                name: '创意工坊',
                type: 'creation',
                position: { x: 35, z: 0 },
                size: { width: 16, height: 18, depth: 20 }
            },
            {
                id: 'skill_academy',
                name: '技能学院',
                type: 'skill',
                position: { x: 0, z: 35 },
                size: { width: 14, height: 14, depth: 12 }
            }
        ];

        for (const config of buildingConfigs) {
            this.createBuilding(config);
        }
    }

    /**
     * 创建单个建筑
     */
    createBuilding(config) {
        const building = new Building(config.id, config);
        const mesh = building.create();
        this.group.add(mesh);
        this.buildings.set(config.id, building);

        return building;
    }

    /**
     * 获取建筑
     */
    getBuilding(id) {
        return this.buildings.get(id);
    }

    /**
     * 获取所有建筑
     */
    getAllBuildings() {
        return Array.from(this.buildings.values());
    }

    /**
     * 根据位置获取建筑
     */
    getBuildingAtPosition(x, z, radius = 5) {
        for (const building of this.buildings.values()) {
            const dx = building.position.x - x;
            const dz = building.position.z - z;
            const dist = Math.sqrt(dx * dx + dz * dz);
            if (dist < radius) {
                return building;
            }
        }
        return null;
    }

    /**
     * 获取建筑列表（简化信息）
     */
    getBuildingList() {
        return Array.from(this.buildings.values()).map(b => ({
            id: b.id,
            name: b.name,
            type: b.type,
            position: b.position,
            function: b.function
        }));
    }

    /**
     * 获取最近的建筑
     */
    getNearestBuilding(position, types = null) {
        let nearest = null;
        let minDist = Infinity;

        for (const building of this.buildings.values()) {
            if (types && !types.includes(building.type)) continue;

            const dx = building.position.x - position.x;
            const dz = building.position.z - position.z;
            const dist = Math.sqrt(dx * dx + dz * dz);

            if (dist < minDist) {
                minDist = dist;
                nearest = building;
            }
        }

        return { building: nearest, distance: minDist };
    }

    /**
     * 高亮建筑
     */
    highlightBuilding(id) {
        const building = this.buildings.get(id);
        if (!building || !building.group) return;

        building.group.traverse(child => {
            if (child.isMesh && child.material) {
                child.userData.originalEmissive = child.material.emissive?.getHex();
                child.material.emissive = new THREE.Color(0x4ecdc4);
                child.material.emissiveIntensity = 0.3;
            }
        });
    }

    /**
     * 取消高亮
     */
    unhighlightBuilding(id) {
        const building = this.buildings.get(id);
        if (!building || !building.group) return;

        building.group.traverse(child => {
            if (child.isMesh && child.material && child.userData.originalEmissive !== undefined) {
                child.material.emissive = new THREE.Color(child.userData.originalEmissive);
                if (child.userData.originalEmissive === 0) {
                    child.material.emissive = undefined;
                }
            }
        });
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
        for (const building of this.buildings.values()) {
            building.group.traverse(child => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(m => m.dispose());
                    } else {
                        child.material.dispose();
                    }
                }
            });
        }
        this.buildings.clear();
        if (this.group && this.scene) {
            this.scene.remove(this.group);
        }
    }
}

// 单例
const buildingsManager = new BuildingsManager();

export default buildingsManager;
export { BuildingsManager, Building };
