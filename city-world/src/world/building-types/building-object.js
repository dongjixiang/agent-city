/**
 * BuildingObject - 建筑对象基类
 *
 * 对应 DESIGN.md Section 3.1 WorldObject > BuildingObject
 * 8 大建筑：任务中心、声誉塔、交易中心、档案馆、消息站、数据中心、创意工坊、技能学院
 */

import * as THREE from 'three';
import { WorldObject } from '../../core/world-object.js';

/**
 * 建筑基类
 * 每个建筑提供独特的服务（service），智能体可使用
 */
class BuildingObject extends WorldObject {
    constructor(id, config = {}) {
        config.type = 'building';
        super(id, config);

        this.buildingType = config.buildingType || 'generic';

        // 建筑提供的功能
        this.abilities = config.abilities || [];

        // 提供的服务
        this.services = config.services || [];

        // 进入触发回调
        this._onEnterCallbacks = [];
        this._onLeaveCallbacks = [];
    }

    /**
     * 进入建筑（被智能体调用）
     */
    onEnter(agent) {
        return { message: `欢迎来到${this.name}！` };
    }

    /**
     * 离开建筑
     */
    onLeave(agent) {
        // 空实现
    }

    /**
     * 使用服务
     * @param {string} serviceName
     * @param {Object} params
     * @returns {Object} { success, message, data }
     */
    useService(serviceName, params = {}) {
        return { success: false, message: `${this.name} 没有该服务: ${serviceName}` };
    }

    /**
     * 获取建筑信息
     */
    getInfo() {
        return {
            id: this.id,
            name: this.name,
            type: this.buildingType,
            abilities: this.abilities,
            services: this.services,
            position: { ...this.position }
        };
    }
}

// ============ 任务中心 ============

class TaskCenter extends BuildingObject {
    constructor(config = {}) {
        super('task_center', {
            name: '任务中心',
            x: config.x ?? -25,
            z: config.z ?? -25,
            abilities: ['accept_task', 'submit_task', 'view_tasks'],
            services: ['task_list', 'accept_task', 'submit_task', 'daily_bonus'],
            ...config
        });

        this.buildingType = 'task';
    }

    createMesh() {
        this.group = new THREE.Group();
        this.group.name = this.name;

        const baseMat = new THREE.MeshStandardMaterial({ color: 0x3498db, metalness: 0.3, roughness: 0.7 });
        const accentMat = new THREE.MeshStandardMaterial({ color: 0x2980b9, metalness: 0.4, roughness: 0.6 });

        // 主体 - 圆柱形大厅
        const main = new THREE.Mesh(new THREE.CylinderGeometry(8, 8, 15, 16), baseMat);
        main.position.y = 7.5;
        main.castShadow = true;
        main.receiveShadow = true;
        this.group.add(main);

        // 圆顶
        const roof = new THREE.Mesh(
            new THREE.SphereGeometry(8, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2),
            accentMat
        );
        roof.position.y = 15;
        roof.castShadow = true;
        this.group.add(roof);

        // 入口
        this.addEntrance(0, -8, 0);

        // 标识牌
        this.addSign('任务中心', 0x3498db);

        this._applyPosition();
        this.group.userData = { type: 'building', subtype: 'task_center', objectId: this.id, worldObject: this };

        return this.group;
    }

    addEntrance(x, y, z) {
        const door = new THREE.Mesh(
            new THREE.BoxGeometry(3, 5, 1),
            new THREE.MeshStandardMaterial({ color: 0x5d4e37, roughness: 0.9 })
        );
        door.position.set(x, y + 2.5, z);
        door.castShadow = true;
        this.group.add(door);
    }

    addSign(text, color) {
        const sign = new THREE.Mesh(
            new THREE.BoxGeometry(4, 1.5, 0.3),
            new THREE.MeshStandardMaterial({ color, metalness: 0.3, roughness: 0.7 })
        );
        sign.position.set(0, 17, 0);
        this.group.add(sign);
    }

    onEnter(agent) {
        return {
            message: `欢迎来到任务中心！你可以在这里接取任务和提交任务。`,
            services: this.services
        };
    }

    useService(serviceName, params = {}) {
        switch (serviceName) {
            case 'task_list':
                return { success: true, message: '获取任务列表', data: [] };
            case 'daily_bonus':
                return { success: true, message: '每日奖励已领取！' };
            default:
                return super.useService(serviceName, params);
        }
    }
}

// ============ 声誉塔 ============

class ReputationTower extends BuildingObject {
    constructor(config = {}) {
        super('reputation_tower', {
            name: '声誉塔',
            x: config.x ?? 25,
            z: config.z ?? -25,
            abilities: ['view_rank', 'claim_badge', 'donate_reputation'],
            services: ['leaderboard', 'badges', 'claim_badge', 'reputation_history', 'donate_reputation'],
            ...config
        });

        this.buildingType = 'reputation';
    }

    createMesh() {
        this.group = new THREE.Group();
        this.group.name = this.name;

        const towerMat = new THREE.MeshStandardMaterial({ color: 0xf1c40f, metalness: 0.6, roughness: 0.4 });
        const darkMat = new THREE.MeshStandardMaterial({ color: 0xf39c12, metalness: 0.7, roughness: 0.3 });
        const baseMat = new THREE.MeshStandardMaterial({ color: 0x7f8c8d, roughness: 0.9 });

        // 塔身
        const tower = new THREE.Mesh(new THREE.BoxGeometry(6, 25, 6), towerMat);
        tower.position.y = 12.5;
        tower.castShadow = true;
        tower.receiveShadow = true;
        this.group.add(tower);

        // 顶部金字塔
        const top = new THREE.Mesh(new THREE.ConeGeometry(5, 8, 4), darkMat);
        top.position.y = 29;
        top.rotation.y = Math.PI / 4;
        top.castShadow = true;
        this.group.add(top);

        // 基座
        const base = new THREE.Mesh(new THREE.BoxGeometry(10, 2, 10), baseMat);
        base.position.y = 1;
        base.receiveShadow = true;
        this.group.add(base);

        // 标识
        this.addSign('声誉塔', 0xf1c40f, 30);

        this._applyPosition();
        this.group.userData = { type: 'building', subtype: 'reputation_tower', objectId: this.id, worldObject: this };

        return this.group;
    }

    addSign(text, color, y = 17) {
        const sign = new THREE.Mesh(
            new THREE.BoxGeometry(4, 1.5, 0.3),
            new THREE.MeshStandardMaterial({ color, metalness: 0.3, roughness: 0.7 })
        );
        sign.position.set(0, y, 0);
        this.group.add(sign);
    }

    onEnter(agent) {
        return {
            message: `欢迎来到声誉塔！这里可以查看排行榜和领取徽章。`,
            services: this.services
        };
    }

    useService(serviceName, params = {}) {
        switch (serviceName) {
            case 'leaderboard':
                return { success: true, message: '排行榜数据', data: [] };
            case 'badges':
                return { success: true, message: '徽章列表', data: [] };
            default:
                return super.useService(serviceName, params);
        }
    }
}

// ============ 交易中心 ============

class TradingCenter extends BuildingObject {
    constructor(config = {}) {
        super('trading_center', {
            name: '交易中心',
            x: config.x ?? -25,
            z: config.z ?? 25,
            abilities: ['list_item', 'buy_item', 'sell_item', 'exchange_coins'],
            services: ['marketplace', 'buy_item', 'sell_item', 'cancel_listing', 'exchange_coins'],
            ...config
        });

        this.buildingType = 'trading';
    }

    createMesh() {
        this.group = new THREE.Group();
        this.group.name = this.name;

        const mainMat = new THREE.MeshStandardMaterial({ color: 0x27ae60, metalness: 0.2, roughness: 0.8 });
        const roofMat = new THREE.MeshStandardMaterial({ color: 0x1e8449, metalness: 0.3, roughness: 0.7 });

        // 主体
        const main = new THREE.Mesh(new THREE.BoxGeometry(15, 10, 12), mainMat);
        main.position.y = 5;
        main.castShadow = true;
        main.receiveShadow = true;
        this.group.add(main);

        // 三角形屋顶
        const roof = new THREE.Mesh(new THREE.ConeGeometry(10, 6, 4), roofMat);
        roof.position.y = 13;
        roof.rotation.y = Math.PI / 4;
        roof.castShadow = true;
        this.group.add(roof);

        // 柱子
        this.addColumns(4);

        // 标识
        this.addSign('交易中心', 0x27ae60);

        this._applyPosition();
        this.group.userData = { type: 'building', subtype: 'trading_center', objectId: this.id, worldObject: this };

        return this.group;
    }

    addColumns(count) {
        const columnMat = new THREE.MeshStandardMaterial({ color: 0x95a5a6, roughness: 0.7 });
        const colGeo = new THREE.CylinderGeometry(0.5, 0.5, 10, 8);
        for (let i = 0; i < count; i++) {
            const col = new THREE.Mesh(colGeo, columnMat);
            col.position.set(-5 + i * 3.5, 5, 5);
            col.castShadow = true;
            this.group.add(col);
        }
    }

    addSign(text, color) {
        const sign = new THREE.Mesh(
            new THREE.BoxGeometry(4, 1.5, 0.3),
            new THREE.MeshStandardMaterial({ color, metalness: 0.3, roughness: 0.7 })
        );
        sign.position.set(0, 12, 6);
        this.group.add(sign);
    }

    onEnter(agent) {
        return {
            message: `欢迎来到交易中心！这里可以买卖物品和兑换货币。`,
            services: this.services
        };
    }
}

// ============ 档案馆 ============

class Archive extends BuildingObject {
    constructor(config = {}) {
        super('archive', {
            name: '档案馆',
            x: config.x ?? 25,
            z: config.z ?? 25,
            abilities: ['store_memory', 'retrieve_memory', 'search_knowledge'],
            services: ['store_memory', 'retrieve_memory', 'search_knowledge', 'record_story', 'share_story'],
            ...config
        });

        this.buildingType = 'archive';
    }

    createMesh() {
        this.group = new THREE.Group();
        this.group.name = this.name;

        const wallMat = new THREE.MeshStandardMaterial({ color: 0x8b4513, metalness: 0.1, roughness: 0.9 });
        const roofMat = new THREE.MeshStandardMaterial({ color: 0x5d4037, metalness: 0.2, roughness: 0.8 });

        // 主体
        const main = new THREE.Mesh(new THREE.BoxGeometry(12, 12, 12), wallMat);
        main.position.y = 6;
        main.castShadow = true;
        main.receiveShadow = true;
        this.group.add(main);

        // 平顶
        const roof = new THREE.Mesh(new THREE.BoxGeometry(14, 2, 14), roofMat);
        roof.position.y = 13;
        roof.castShadow = true;
        this.group.add(roof);

        // 门廊
        const porch = new THREE.Mesh(
            new THREE.BoxGeometry(4, 6, 2),
            new THREE.MeshStandardMaterial({ color: 0x6d4c41, roughness: 0.9 })
        );
        porch.position.set(0, 3, 7);
        porch.castShadow = true;
        this.group.add(porch);

        this.addSign('档案馆', 0x8b4513);

        this._applyPosition();
        this.group.userData = { type: 'building', subtype: 'archive', objectId: this.id, worldObject: this };

        return this.group;
    }

    addSign(text, color) {
        const sign = new THREE.Mesh(
            new THREE.BoxGeometry(4, 1.5, 0.3),
            new THREE.MeshStandardMaterial({ color, metalness: 0.3, roughness: 0.7 })
        );
        sign.position.set(0, 15, 6);
        this.group.add(sign);
    }

    onEnter(agent) {
        return {
            message: `欢迎来到档案馆！这里可以存储和检索记忆、知识。`,
            services: this.services
        };
    }
}

// ============ 消息站 ============

class MessageStation extends BuildingObject {
    constructor(config = {}) {
        super('message_station', {
            name: '消息站',
            x: config.x ?? 0,
            z: config.z ?? -35,
            abilities: ['send_mail', 'create_announcement', 'create_group'],
            services: ['inbox', 'send_mail', 'create_announcement', 'create_group', 'join_group'],
            ...config
        });

        this.buildingType = 'communication';
    }

    createMesh() {
        this.group = new THREE.Group();
        this.group.name = this.name;

        const mat = new THREE.MeshStandardMaterial({ color: 0x9b59b6, metalness: 0.3, roughness: 0.7 });

        // 塔楼
        const tower = new THREE.Mesh(new THREE.CylinderGeometry(5, 6, 18, 8), mat);
        tower.position.y = 9;
        tower.castShadow = true;
        tower.receiveShadow = true;
        this.group.add(tower);

        // 顶部球
        const top = new THREE.Mesh(
            new THREE.SphereGeometry(3, 16, 16),
            new THREE.MeshStandardMaterial({ color: 0x8e44ad, metalness: 0.5, roughness: 0.5 })
        );
        top.position.y = 19;
        top.castShadow = true;
        this.group.add(top);

        // 基座
        const base = new THREE.Mesh(
            new THREE.CylinderGeometry(7, 8, 3, 8),
            new THREE.MeshStandardMaterial({ color: 0x7d3c98, roughness: 0.8 })
        );
        base.position.y = 1.5;
        base.receiveShadow = true;
        this.group.add(base);

        this.addSign('消息站', 0x9b59b6, 23);

        this._applyPosition();
        this.group.userData = { type: 'building', subtype: 'message_station', objectId: this.id, worldObject: this };

        return this.group;
    }

    addSign(text, color, y = 22) {
        const sign = new THREE.Mesh(
            new THREE.BoxGeometry(4, 1.5, 0.3),
            new THREE.MeshStandardMaterial({ color, metalness: 0.3, roughness: 0.7 })
        );
        sign.position.set(0, y, 5);
        this.group.add(sign);
    }

    onEnter(agent) {
        return {
            message: `欢迎来到消息站！这里可以发送私信和公告。`,
            services: this.services
        };
    }
}

// ============ 数据中心 ============

class DataCenter extends BuildingObject {
    constructor(config = {}) {
        super('data_center', {
            name: '数据中心',
            x: config.x ?? -35,
            z: config.z ?? 0,
            abilities: ['view_stats', 'analytics', 'trend_report'],
            services: ['personal_stats', 'world_stats', 'trend_report', 'compare', 'achievements'],
            ...config
        });

        this.buildingType = 'data';
    }

    createMesh() {
        this.group = new THREE.Group();
        this.group.name = this.name;

        const mat = new THREE.MeshStandardMaterial({ color: 0x34495e, metalness: 0.5, roughness: 0.5 });
        const rackMat = new THREE.MeshStandardMaterial({ color: 0x2c3e50, metalness: 0.7, roughness: 0.3 });

        // 主体
        const main = new THREE.Mesh(new THREE.BoxGeometry(14, 8, 10), mat);
        main.position.y = 4;
        main.castShadow = true;
        main.receiveShadow = true;
        this.group.add(main);

        // 服务器机架
        for (let i = 0; i < 3; i++) {
            const rack = new THREE.Mesh(new THREE.BoxGeometry(2, 4, 1), rackMat);
            rack.position.set(-4 + i * 4, 6, 5.5);
            rack.castShadow = true;
            this.group.add(rack);

            const lightMat = new THREE.MeshStandardMaterial({
                color: i % 2 === 0 ? 0x2ecc71 : 0xe74c3c,
                emissive: i % 2 === 0 ? new THREE.Color(0x2ecc71) : new THREE.Color(0xe74c3c),
                emissiveIntensity: 0.5
            });
            const light = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), lightMat);
            light.position.set(-4 + i * 4, 7.5, 6);
            this.group.add(light);
        }

        this.addSign('数据中心', 0x34495e);

        this._applyPosition();
        this.group.userData = { type: 'building', subtype: 'data_center', objectId: this.id, worldObject: this };

        return this.group;
    }

    addSign(text, color) {
        const sign = new THREE.Mesh(
            new THREE.BoxGeometry(4, 1.5, 0.3),
            new THREE.MeshStandardMaterial({ color, metalness: 0.3, roughness: 0.7 })
        );
        sign.position.set(0, 10, 5);
        this.group.add(sign);
    }

    onEnter(agent) {
        return {
            message: `欢迎来到数据中心！这里有丰富的统计数据和分析报告。`,
            services: this.services
        };
    }
}

// ============ 创意工坊 ============

class CreativeWorkshop extends BuildingObject {
    constructor(config = {}) {
        super('creative_workshop', {
            name: '创意工坊',
            x: config.x ?? 35,
            z: config.z ?? 0,
            abilities: ['craft_item', 'enhance_item', 'learn_recipe'],
            services: ['recipes', 'craft', 'enhance', 'disassemble'],
            ...config
        });

        this.buildingType = 'creation';
    }

    createMesh() {
        this.group = new THREE.Group();
        this.group.name = this.name;

        const wallMat = new THREE.MeshStandardMaterial({ color: 0xe67e22, metalness: 0.3, roughness: 0.7 });
        const roofMat = new THREE.MeshStandardMaterial({ color: 0xd35400, metalness: 0.4, roughness: 0.6 });

        // 主体
        const main = new THREE.Mesh(new THREE.BoxGeometry(12, 9, 15), wallMat);
        main.position.y = 4.5;
        main.castShadow = true;
        main.receiveShadow = true;
        this.group.add(main);

        // 锯齿形屋顶
        for (let i = 0; i < 3; i++) {
            const roof = new THREE.Mesh(new THREE.BoxGeometry(14, 3, 5), roofMat);
            roof.position.set(0, 10.5 + i * 2, -5 + i * 5);
            roof.rotation.z = -0.2;
            roof.castShadow = true;
            this.group.add(roof);
        }

        // 烟囱
        const chimney = new THREE.Mesh(
            new THREE.CylinderGeometry(1, 1.5, 6, 8),
            new THREE.MeshStandardMaterial({ color: 0x7f8c8d, roughness: 0.9 })
        );
        chimney.position.set(4, 16, -3);
        chimney.castShadow = true;
        this.group.add(chimney);

        this.addSign('创意工坊', 0xe67e22);

        this._applyPosition();
        this.group.userData = { type: 'building', subtype: 'creative_workshop', objectId: this.id, worldObject: this };

        return this.group;
    }

    addSign(text, color) {
        const sign = new THREE.Mesh(
            new THREE.BoxGeometry(4, 1.5, 0.3),
            new THREE.MeshStandardMaterial({ color, metalness: 0.3, roughness: 0.7 })
        );
        sign.position.set(0, 11, 7.5);
        this.group.add(sign);
    }

    onEnter(agent) {
        return {
            message: `欢迎来到创意工坊！这里可以制作物品、合成材料。`,
            services: this.services
        };
    }
}

// ============ 技能学院 ============

class SkillAcademy extends BuildingObject {
    constructor(config = {}) {
        super('skill_academy', {
            name: '技能学院',
            x: config.x ?? 0,
            z: config.z ?? 35,
            abilities: ['learn_skill', 'upgrade_skill', 'practice_skill'],
            services: ['available_skills', 'learn_skill', 'upgrade_skill', 'practice'],
            ...config
        });

        this.buildingType = 'skill';
    }

    createMesh() {
        this.group = new THREE.Group();
        this.group.name = this.name;

        const wallMat = new THREE.MeshStandardMaterial({ color: 0x2980b9, metalness: 0.2, roughness: 0.8 });
        const pillarMat = new THREE.MeshStandardMaterial({ color: 0xecf0f1, roughness: 0.5 });

        // 主楼
        const main = new THREE.Mesh(new THREE.BoxGeometry(10, 14, 8), wallMat);
        main.position.y = 7;
        main.castShadow = true;
        main.receiveShadow = true;
        this.group.add(main);

        // 柱子
        const colGeo = new THREE.CylinderGeometry(0.5, 0.5, 6, 8);
        for (let i = 0; i < 4; i++) {
            const col = new THREE.Mesh(colGeo, pillarMat);
            col.position.set(-3 + i * 2, 3, 5);
            col.castShadow = true;
            this.group.add(col);
        }

        // 门廊屋顶
        const porchRoof = new THREE.Mesh(
            new THREE.BoxGeometry(10, 1, 3),
            new THREE.MeshStandardMaterial({ color: 0x1f4788, metalness: 0.3, roughness: 0.7 })
        );
        porchRoof.position.set(0, 6.5, 6);
        porchRoof.castShadow = true;
        this.group.add(porchRoof);

        this.addSign('技能学院', 0x2980b9);

        this._applyPosition();
        this.group.userData = { type: 'building', subtype: 'skill_academy', objectId: this.id, worldObject: this };

        return this.group;
    }

    addSign(text, color) {
        const sign = new THREE.Mesh(
            new THREE.BoxGeometry(4, 1.5, 0.3),
            new THREE.MeshStandardMaterial({ color, metalness: 0.3, roughness: 0.7 })
        );
        sign.position.set(0, 16, 4);
        this.group.add(sign);
    }

    onEnter(agent) {
        return {
            message: `欢迎来到技能学院！这里可以学习各种技能。`,
            services: this.services
        };
    }
}

export {
    BuildingObject,
    TaskCenter,
    ReputationTower,
    TradingCenter,
    Archive,
    MessageStation,
    DataCenter,
    CreativeWorkshop,
    SkillAcademy
};
