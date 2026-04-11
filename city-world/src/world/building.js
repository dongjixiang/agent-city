/**
 * Building - 建筑类
 * 
 * 对应 DESIGN.md Section 3.1 WorldObject > BuildingObject
 */

import * as THREE from 'three';

class Building {
    constructor(id, config) {
        this.id = id;
        this.name = config.name || id;
        this.type = config.type || 'generic';
        this.position = config.position || { x: 0, z: 0 };
        this.size = config.size || { width: 10, height: 10, depth: 10 };
        this.color = config.color || 0x888888;
        this.function = config.function || null;
        this.meshes = [];
        this.group = null;
    }

    /**
     * 创建建筑网格
     */
    create() {
        this.group = new THREE.Group();
        this.group.name = this.name;
        this.group.userData = { type: 'building', buildingId: this.id };

        // 根据类型创建不同的外观
        switch (this.type) {
            case 'task':
                this.createTaskCenter();
                break;
            case 'reputation':
                this.createReputationTower();
                break;
            case 'trading':
                this.createTradingCenter();
                break;
            case 'archive':
                this.createArchive();
                break;
            case 'communication':
                this.createMessageStation();
                break;
            case 'data':
                this.createDataCenter();
                break;
            case 'creation':
                this.createCreativeWorkshop();
                break;
            case 'skill':
                this.createSkillAcademy();
                break;
            default:
                this.createGenericBuilding();
        }

        // 设置位置
        this.group.position.set(this.position.x, 0, this.position.z);

        return this.group;
    }

    /**
     * 任务中心 - 蓝色主题
     */
    createTaskCenter() {
        // 主体 - 圆柱形大厅
        const mainGeometry = new THREE.CylinderGeometry(8, 8, 15, 16);
        const mainMaterial = new THREE.MeshStandardMaterial({
            color: 0x3498db,
            metalness: 0.3,
            roughness: 0.7
        });
        const main = new THREE.Mesh(mainGeometry, mainMaterial);
        main.position.y = 7.5;
        main.castShadow = true;
        main.receiveShadow = true;
        this.group.add(main);

        // 屋顶 - 圆顶
        const roofGeometry = new THREE.SphereGeometry(8, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
        const roofMaterial = new THREE.MeshStandardMaterial({
            color: 0x2980b9,
            metalness: 0.4,
            roughness: 0.6
        });
        const roof = new THREE.Mesh(roofGeometry, roofMaterial);
        roof.position.y = 15;
        roof.castShadow = true;
        this.group.add(roof);

        // 入口
        this.addEntrance(0, -8, 0);

        // 标识牌
        this.addSign('任务中心', 0x3498db);
    }

    /**
     * 声誉塔 - 金色主题
     */
    createReputationTower() {
        // 塔身 - 高耸的方尖碑
        const towerGeometry = new THREE.BoxGeometry(6, 25, 6);
        const towerMaterial = new THREE.MeshStandardMaterial({
            color: 0xf1c40f,
            metalness: 0.6,
            roughness: 0.4
        });
        const tower = new THREE.Mesh(towerGeometry, towerMaterial);
        tower.position.y = 12.5;
        tower.castShadow = true;
        tower.receiveShadow = true;
        this.group.add(tower);

        // 顶部金字塔
        const topGeometry = new THREE.ConeGeometry(5, 8, 4);
        const topMaterial = new THREE.MeshStandardMaterial({
            color: 0xf39c12,
            metalness: 0.7,
            roughness: 0.3
        });
        const top = new THREE.Mesh(topGeometry, topMaterial);
        top.position.y = 29;
        top.rotation.y = Math.PI / 4;
        top.castShadow = true;
        this.group.add(top);

        // 基座
        const baseGeometry = new THREE.BoxGeometry(10, 2, 10);
        const baseMaterial = new THREE.MeshStandardMaterial({
            color: 0x7f8c8d,
            roughness: 0.9
        });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.y = 1;
        base.receiveShadow = true;
        this.group.add(base);

        // 标识
        this.addSign('声誉塔', 0xf1c40f);
    }

    /**
     * 交易中心 - 绿色主题
     */
    createTradingCenter() {
        // 市场大厅 - 宽敞的矩形建筑
        const mainGeometry = new THREE.BoxGeometry(15, 10, 12);
        const mainMaterial = new THREE.MeshStandardMaterial({
            color: 0x27ae60,
            metalness: 0.2,
            roughness: 0.8
        });
        const main = new THREE.Mesh(mainGeometry, mainMaterial);
        main.position.y = 5;
        main.castShadow = true;
        main.receiveShadow = true;
        this.group.add(main);

        // 屋顶 - 三角形
        const roofGeometry = new THREE.ConeGeometry(10, 6, 4);
        const roofMaterial = new THREE.MeshStandardMaterial({
            color: 0x1e8449,
            metalness: 0.3,
            roughness: 0.7
        });
        const roof = new THREE.Mesh(roofGeometry, roofMaterial);
        roof.position.y = 13;
        roof.rotation.y = Math.PI / 4;
        roof.castShadow = true;
        this.group.add(roof);

        // 柱子
        this.addColumns(4);

        // 标识
        this.addSign('交易中心', 0x27ae60);
    }

    /**
     * 档案馆 - 棕色/古朴主题
     */
    createArchive() {
        // 主体 - 厚重的石质建筑
        const mainGeometry = new THREE.BoxGeometry(12, 12, 12);
        const mainMaterial = new THREE.MeshStandardMaterial({
            color: 0x8b4513,
            metalness: 0.1,
            roughness: 0.9
        });
        const main = new THREE.Mesh(mainGeometry, mainMaterial);
        main.position.y = 6;
        main.castShadow = true;
        main.receiveShadow = true;
        this.group.add(main);

        // 屋顶 - 平顶古典
        const roofGeometry = new THREE.BoxGeometry(14, 2, 14);
        const roofMaterial = new THREE.MeshStandardMaterial({
            color: 0x5d4037,
            metalness: 0.2,
            roughness: 0.8
        });
        const roof = new THREE.Mesh(roofGeometry, roofMaterial);
        roof.position.y = 13;
        roof.castShadow = true;
        this.group.add(roof);

        // 入口门廊
        const porchGeometry = new THREE.BoxGeometry(4, 6, 2);
        const porchMaterial = new THREE.MeshStandardMaterial({
            color: 0x6d4c41,
            roughness: 0.9
        });
        const porch = new THREE.Mesh(porchGeometry, porchMaterial);
        porch.position.set(0, 3, 7);
        porch.castShadow = true;
        this.group.add(porch);

        // 标识
        this.addSign('档案馆', 0x8b4513);
    }

    /**
     * 消息站 - 紫色主题
     */
    createMessageStation() {
        // 塔楼
        const towerGeometry = new THREE.CylinderGeometry(5, 6, 18, 8);
        const towerMaterial = new THREE.MeshStandardMaterial({
            color: 0x9b59b6,
            metalness: 0.3,
            roughness: 0.7
        });
        const tower = new THREE.Mesh(towerGeometry, towerMaterial);
        tower.position.y = 9;
        tower.castShadow = true;
        tower.receiveShadow = true;
        this.group.add(tower);

        // 顶部装饰
        const topGeometry = new THREE.SphereGeometry(3, 16, 16);
        const topMaterial = new THREE.MeshStandardMaterial({
            color: 0x8e44ad,
            metalness: 0.5,
            roughness: 0.5
        });
        const top = new THREE.Mesh(topGeometry, topMaterial);
        top.position.y = 19;
        top.castShadow = true;
        this.group.add(top);

        // 基座
        const baseGeometry = new THREE.CylinderGeometry(7, 8, 3, 8);
        const baseMaterial = new THREE.MeshStandardMaterial({
            color: 0x7d3c98,
            roughness: 0.8
        });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.y = 1.5;
        base.receiveShadow = true;
        this.group.add(base);

        // 标识
        this.addSign('消息站', 0x9b59b6);
    }

    /**
     * 数据中心 - 科技蓝色
     */
    createDataCenter() {
        // 主体 - 现代建筑
        const mainGeometry = new THREE.BoxGeometry(14, 8, 10);
        const mainMaterial = new THREE.MeshStandardMaterial({
            color: 0x34495e,
            metalness: 0.5,
            roughness: 0.5
        });
        const main = new THREE.Mesh(mainGeometry, mainMaterial);
        main.position.y = 4;
        main.castShadow = true;
        main.receiveShadow = true;
        this.group.add(main);

        // 服务器机架装饰
        for (let i = 0; i < 3; i++) {
            const rackGeometry = new THREE.BoxGeometry(2, 4, 1);
            const rackMaterial = new THREE.MeshStandardMaterial({
                color: 0x2c3e50,
                metalness: 0.7,
                roughness: 0.3
            });
            const rack = new THREE.Mesh(rackGeometry, rackMaterial);
            rack.position.set(-4 + i * 4, 6, 5.5);
            rack.castShadow = true;
            this.group.add(rack);

            // 指示灯
            const lightGeometry = new THREE.SphereGeometry(0.2, 8, 8);
            const lightMaterial = new THREE.MeshStandardMaterial({
                color: i % 2 === 0 ? 0x2ecc71 : 0xe74c3c,
                emissive: i % 2 === 0 ? 0x2ecc71 : 0xe74c3c,
                emissiveIntensity: 0.5
            });
            const light = new THREE.Mesh(lightGeometry, lightMaterial);
            light.position.set(-4 + i * 4, 7.5, 6);
            this.group.add(light);
        }

        // 标识
        this.addSign('数据中心', 0x34495e);
    }

    /**
     * 创意工坊 - 橙色主题
     */
    createCreativeWorkshop() {
        // 厂房结构
        const mainGeometry = new THREE.BoxGeometry(12, 9, 15);
        const mainMaterial = new THREE.MeshStandardMaterial({
            color: 0xe67e22,
            metalness: 0.3,
            roughness: 0.7
        });
        const main = new THREE.Mesh(mainGeometry, mainMaterial);
        main.position.y = 4.5;
        main.castShadow = true;
        main.receiveShadow = true;
        this.group.add(main);

        // 锯齿形屋顶
        for (let i = 0; i < 3; i++) {
            const roofGeometry = new THREE.BoxGeometry(14, 3, 5);
            const roofMaterial = new THREE.MeshStandardMaterial({
                color: 0xd35400,
                metalness: 0.4,
                roughness: 0.6
            });
            const roof = new THREE.Mesh(roofGeometry, roofMaterial);
            roof.position.set(0, 10.5 + i * 2, -5 + i * 5);
            roof.rotation.z = -0.2;
            roof.castShadow = true;
            this.group.add(roof);
        }

        // 烟囱
        const chimneyGeometry = new THREE.CylinderGeometry(1, 1.5, 6, 8);
        const chimneyMaterial = new THREE.MeshStandardMaterial({
            color: 0x7f8c8d,
            roughness: 0.9
        });
        const chimney = new THREE.Mesh(chimneyGeometry, chimneyMaterial);
        chimney.position.set(4, 16, -3);
        chimney.castShadow = true;
        this.group.add(chimney);

        // 标识
        this.addSign('创意工坊', 0xe67e22);
    }

    /**
     * 技能学院 - 学术蓝色
     */
    createSkillAcademy() {
        // 主楼
        const mainGeometry = new THREE.BoxGeometry(10, 14, 8);
        const mainMaterial = new THREE.MeshStandardMaterial({
            color: 0x2980b9,
            metalness: 0.2,
            roughness: 0.8
        });
        const main = new THREE.Mesh(mainGeometry, mainMaterial);
        main.position.y = 7;
        main.castShadow = true;
        main.receiveShadow = true;
        this.group.add(main);

        // 门廊柱子
        const pillarGeometry = new THREE.CylinderGeometry(0.5, 0.5, 6, 8);
        const pillarMaterial = new THREE.MeshStandardMaterial({
            color: 0xecf0f1,
            roughness: 0.5
        });
        for (let i = 0; i < 4; i++) {
            const pillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
            pillar.position.set(-3 + i * 2, 3, 5);
            pillar.castShadow = true;
            this.group.add(pillar);
        }

        // 门廊屋顶
        const porchRoofGeometry = new THREE.BoxGeometry(10, 1, 3);
        const porchRoofMaterial = new THREE.MeshStandardMaterial({
            color: 0x1f4788,
            metalness: 0.3,
            roughness: 0.7
        });
        const porchRoof = new THREE.Mesh(porchRoofGeometry, porchRoofMaterial);
        porchRoof.position.set(0, 6.5, 6);
        porchRoof.castShadow = true;
        this.group.add(porchRoof);

        // 标识
        this.addSign('技能学院', 0x2980b9);
    }

    /**
     * 通用建筑
     */
    createGenericBuilding() {
        const geometry = new THREE.BoxGeometry(
            this.size.width,
            this.size.height,
            this.size.depth
        );
        const material = new THREE.MeshStandardMaterial({
            color: this.color,
            metalness: 0.2,
            roughness: 0.8
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.y = this.size.height / 2;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        this.group.add(mesh);
    }

    /**
     * 添加入口
     */
    addEntrance(x, y, z) {
        const doorGeometry = new THREE.BoxGeometry(3, 5, 1);
        const doorMaterial = new THREE.MeshStandardMaterial({
            color: 0x5d4e37,
            roughness: 0.9
        });
        const door = new THREE.Mesh(doorGeometry, doorMaterial);
        door.position.set(x, y + 2.5, z);
        door.castShadow = true;
        this.group.add(door);
    }

    /**
     * 添加柱子
     */
    addColumns(count) {
        const columnGeometry = new THREE.CylinderGeometry(0.5, 0.5, 10, 8);
        const columnMaterial = new THREE.MeshStandardMaterial({
            color: 0x95a5a6,
            roughness: 0.7
        });

        for (let i = 0; i < count; i++) {
            const column = new THREE.Mesh(columnGeometry, columnMaterial);
            column.position.set(-5 + i * 3.5, 5, 5);
            column.castShadow = true;
            this.group.add(column);
        }
    }

    /**
     * 添加标识牌
     */
    addSign(text, color) {
        const signGeometry = new THREE.BoxGeometry(4, 1.5, 0.3);
        const signMaterial = new THREE.MeshStandardMaterial({
            color: color,
            metalness: 0.3,
            roughness: 0.7
        });
        const sign = new THREE.Mesh(signGeometry, signMaterial);
        sign.position.set(0, this.size.height + 2, this.size.depth / 2 + 1);
        sign.castShadow = true;
        this.group.add(sign);

        // 标牌文字（用小立方体模拟）
        const textGeometry = new THREE.BoxGeometry(0.3, 0.3, 0.1);
        const textMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            emissive: 0xffffff,
            emissiveIntensity: 0.3
        });
        for (let i = 0; i < Math.min(text.length, 4); i++) {
            const char = new THREE.Mesh(textGeometry, textMaterial);
            char.position.set(-1.2 + i * 0.6, this.size.height + 2, this.size.depth / 2 + 1.2);
            this.group.add(char);
        }
    }

    /**
     * 获取建筑网格
     */
    getMesh() {
        return this.group;
    }

    /**
     * 获取位置
     */
    getPosition() {
        return this.position;
    }

    /**
     * 点击检测
     */
    onClick(callback) {
        if (this.group) {
            this.group.userData.onClick = callback;
        }
    }

    /**
     * 悬停检测
     */
    onHover(callback) {
        if (this.group) {
            this.group.userData.onHover = callback;
        }
    }
}

export default Building;
