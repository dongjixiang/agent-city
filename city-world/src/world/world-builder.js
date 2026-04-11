/**
 * @fileoverview 世界构建器
 * 
 * 职责：
 * - 创建地形增强（草地、水体）
 * - 创建道路
 * - 创建装饰物（树、路灯、长椅、花卉、灌木）
 * - 创建喷泉
 * - 创建建筑（广场、任务中心、声誉塔、交易中心、档案馆、消息站、数据中心、创意工坊）
 * 
 * 使用方式：
 *   import { buildWorld } from './world/world-builder.js';
 *   buildWorld(scene);
 * 
 * @module world/world-builder
 */

import * as THREE from 'three';

// 地标配置
export const LANDMARKS = {
    FOUNTAIN: { x: 0, z: 0, name: '中央喷泉' },
    TASK_CENTER: { x: -25, z: -25, name: '任务中心' },
    REPUTATION_TOWER: { x: 25, z: -25, name: '声誉塔' },
    TRADING_CENTER: { x: -25, z: 25, name: '交易中心' },
    ARCHIVE: { x: 25, z: 25, name: '档案馆' },
    MESSAGE_STATION: { x: 0, z: -35, name: '消息站' },
    DATA_CENTER: { x: -35, z: 0, name: '数据中心' },
    CREATIVE_WORKSHOP: { x: 35, z: 0, name: '创意工坊' }
};

/**
 * 构建完整世界
 * @param {THREE.Scene} scene
 */
export function buildWorld(scene) {
    improveGround(scene);
    addLakes(scene);
    addRoads(scene);
    addTrees(scene);
    addStreetLights(scene);
    addFlowers(scene);
    addBenches(scene);
    addBushes(scene);
    addFountain(scene);
    addDetailedBuildings(scene);
    setupBuildingHover(scene);
    console.log('[WorldBuilder] World built successfully');
}

// ============ 地形增强 ============

/**
 * 增强地面
 */
function improveGround(scene) {
    const grassMat = new THREE.MeshLambertMaterial({ color: 0x4caf50 });
    const patches = [
        { x: 40, z: 40, w: 20, h: 20 },
        { x: -40, z: 40, w: 20, h: 20 },
        { x: 40, z: -40, w: 20, h: 20 },
        { x: -40, z: -40, w: 20, h: 20 }
    ];
    
    patches.forEach(p => {
        const geo = new THREE.PlaneGeometry(p.w, p.h);
        const mesh = new THREE.Mesh(geo, grassMat);
        mesh.rotation.x = -Math.PI / 2;
        mesh.position.set(p.x, 0.01, p.z);
        scene.add(mesh);
    });
}

// ============ 水体 ============

/**
 * 添加湖泊
 */
function addLakes(scene) {
    // 中心湖泊
    createLake(scene, 0, 0, 12);
    // 小水池
    createLake(scene, 40, 40, 5);
    createLake(scene, -40, 40, 4);
    createLake(scene, 40, -40, 4);
}

/**
 * 创建单个湖泊
 */
export function createLake(scene, x, z, size = 10) {
    const geo = new THREE.CircleGeometry(size, 32);
    const mat = new THREE.MeshStandardMaterial({
        color: 0x3388cc,
        transparent: true,
        opacity: 0.8
    });
    const lake = new THREE.Mesh(geo, mat);
    lake.rotation.x = -Math.PI / 2;
    lake.position.set(x, 0.05, z);
    scene.add(lake);
}

// ============ 道路 ============

/**
 * 添加道路
 */
function addRoads(scene) {
    const roadMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
    const roadWidth = 4;
    
    // 十字路口
    const roads = [
        { x: 0, z: 0, w: 120, h: roadWidth },  // 南北
        { x: 0, z: 0, w: roadWidth, h: 120 }   // 东西
    ];
    
    roads.forEach(r => {
        const geo = new THREE.PlaneGeometry(r.w, r.h);
        const mesh = new THREE.Mesh(geo, roadMat);
        mesh.rotation.x = -Math.PI / 2;
        mesh.position.set(r.x, 0.02, r.z);
        scene.add(mesh);
    });
}

// ============ 装饰物 ============

/**
 * 添加树
 */
function addTrees(scene) {
    const positions = [
        [15, 15], [-15, 15], [15, -15], [-15, -15],
        [50, 0], [-50, 0], [0, 50], [0, -50],
        [15, 50], [-15, 50], [15, -50], [-15, -50],
        [50, 15], [-50, 15], [50, -15], [-50, -15]
    ];
    
    positions.forEach(pos => {
        createTree(scene, pos[0], pos[1]);
    });
}

/**
 * 创建单棵树
 */
export function createTree(scene, x, z) {
    const trunkMat = new THREE.MeshLambertMaterial({ color: 0x6d4c41 });
    const leavesMat = new THREE.MeshLambertMaterial({ color: 0x388e3c });
    
    // 树干
    const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.3, 2.5, 8),
        trunkMat
    );
    trunk.position.set(x, 1.25, z);
    scene.add(trunk);
    
    // 树冠（3层）
    const bottom = new THREE.Mesh(new THREE.ConeGeometry(2, 2, 8), leavesMat);
    bottom.position.set(x, 3, z);
    scene.add(bottom);
    
    const middle = new THREE.Mesh(new THREE.ConeGeometry(1.5, 1.8, 8), leavesMat);
    middle.position.set(x, 4.2, z);
    scene.add(middle);
    
    const top = new THREE.Mesh(new THREE.ConeGeometry(1, 1.5, 8), leavesMat);
    top.position.set(x, 5.2, z);
    scene.add(top);
}

/**
 * 添加路灯
 */
function addStreetLights(scene) {
    const positions = [
        [10, 10], [-10, 10], [10, -10], [-10, -10],
        [30, 0], [-30, 0], [0, 30], [0, -30]
    ];
    
    positions.forEach(pos => {
        createLamp(scene, pos[0], pos[1]);
    });
}

/**
 * 创建路灯
 */
export function createLamp(scene, x, z) {
    const poleMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
    
    // 灯柱
    const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.1, 4, 8),
        poleMat
    );
    pole.position.set(x, 2, z);
    scene.add(pole);
    
    // 灯头
    const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.3, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xffffaa })
    );
    head.position.set(x, 4.2, z);
    scene.add(head);
}

/**
 * 添加花卉
 */
function addFlowers(scene) {
    const flowerPositions = [];
    for (let i = 0; i < 50; i++) {
        flowerPositions.push([
            (Math.random() - 0.5) * 80,
            (Math.random() - 0.5) * 80
        ]);
    }
    
    flowerPositions.forEach(pos => {
        createFlower(scene, pos[0], pos[1]);
    });
}

/**
 * 创建单朵花
 */
export function createFlower(scene, x, z) {
    const colors = [0xff6b6b, 0xffeb3b, 0xff9800, 0xe91e63, 0x9c27b0];
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    const flower = new THREE.Mesh(
        new THREE.SphereGeometry(0.15, 6, 6),
        new THREE.MeshLambertMaterial({ color })
    );
    flower.position.set(x, 0.15, z);
    scene.add(flower);
}

/**
 * 添加长椅
 */
function addBenches(scene) {
    const positions = [
        [8, 0], [-8, 0], [0, 8], [0, -8],
        [20, 20], [-20, 20], [20, -20], [-20, -20]
    ];
    
    positions.forEach(pos => {
        createBench(scene, pos[0], pos[1]);
    });
}

/**
 * 创建长椅
 */
export function createBench(scene, x, z) {
    const benchMat = new THREE.MeshLambertMaterial({ color: 0x8d6e63 });
    
    // 座板
    const seat = new THREE.Mesh(
        new THREE.BoxGeometry(2, 0.1, 0.5),
        benchMat
    );
    seat.position.set(x, 0.5, z);
    scene.add(seat);
    
    // 腿
    const leg1 = new THREE.Mesh(
        new THREE.BoxGeometry(0.1, 0.5, 0.4),
        benchMat
    );
    leg1.position.set(x - 0.8, 0.25, z);
    scene.add(leg1);
    
    const leg2 = new THREE.Mesh(
        new THREE.BoxGeometry(0.1, 0.5, 0.4),
        benchMat
    );
    leg2.position.set(x + 0.8, 0.25, z);
    scene.add(leg2);
}

/**
 * 添加灌木
 */
function addBushes(scene) {
    const positions = [
        [25, 25], [-25, 25], [25, -25], [-25, -25],
        [35, 35], [-35, 35], [35, -35], [-35, -35]
    ];
    
    positions.forEach(pos => {
        createBush(scene, pos[0], pos[1]);
    });
}

/**
 * 创建灌木
 */
export function createBush(scene, x, z) {
    const bushMat = new THREE.MeshLambertMaterial({ color: 0x2e7d32 });
    
    const bush = new THREE.Mesh(
        new THREE.SphereGeometry(1, 8, 8),
        bushMat
    );
    bush.position.set(x, 0.8, z);
    bush.scale.set(1, 0.7, 1);
    scene.add(bush);
}

// ============ 喷泉 ============

/**
 * 添加喷泉
 */
function addFountain(scene) {
    createFountain(scene, 0, 0);
}

/**
 * 创建喷泉
 */
export function createFountain(scene, x, z) {
    const baseMat = new THREE.MeshLambertMaterial({ color: 0x607d8b });
    const waterMat = new THREE.MeshStandardMaterial({
        color: 0x42a5f5,
        transparent: true,
        opacity: 0.7
    });
    
    // 底座
    const base = new THREE.Mesh(
        new THREE.CylinderGeometry(3, 3.5, 0.5, 16),
        baseMat
    );
    base.position.set(x, 0.25, z);
    scene.add(base);
    
    // 中柱
    const pillar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.3, 0.4, 2, 12),
        baseMat
    );
    pillar.position.set(x, 1.5, z);
    scene.add(pillar);
    
    // 水盘
    const bowl = new THREE.Mesh(
        new THREE.CylinderGeometry(1.5, 1.2, 0.3, 16),
        baseMat
    );
    bowl.position.set(x, 2.2, z);
    scene.add(bowl);
    
    // 水面
    const water = new THREE.Mesh(
        new THREE.CircleGeometry(1.3, 16),
        waterMat
    );
    water.rotation.x = -Math.PI / 2;
    water.position.set(x, 2.35, z);
    scene.add(water);
}

// ============ 建筑 ============

/**
 * 添加所有建筑
 */
function addDetailedBuildings(scene) {
    createSocialPlaza(scene, 0, 0);
    createTaskCenter(scene, LANDMARKS.TASK_CENTER.x, LANDMARKS.TASK_CENTER.z);
    createReputationTower(scene, LANDMARKS.REPUTATION_TOWER.x, LANDMARKS.REPUTATION_TOWER.z);
    createTradingCenter(scene, LANDMARKS.TRADING_CENTER.x, LANDMARKS.TRADING_CENTER.z);
    createArchive(scene, LANDMARKS.ARCHIVE.x, LANDMARKS.ARCHIVE.z);
    createMessageStation(scene, LANDMARKS.MESSAGE_STATION.x, LANDMARKS.MESSAGE_STATION.z);
    createDataCenter(scene, LANDMARKS.DATA_CENTER.x, LANDMARKS.DATA_CENTER.z);
    createCreativeWorkshop(scene, LANDMARKS.CREATIVE_WORKSHOP.x, LANDMARKS.CREATIVE_WORKSHOP.z);
}

/**
 * 创建社交广场
 */
export function createSocialPlaza(scene, x, z) {
    const group = new THREE.Group();
    
    const platformMat = new THREE.MeshLambertMaterial({ color: 0xec407a });
    const pinkMat = new THREE.MeshLambertMaterial({ color: 0xf48fb1 });
    const darkMat = new THREE.MeshLambertMaterial({ color: 0xad1457 });
    const seatMat = new THREE.MeshLambertMaterial({ color: 0xfce4ec });
    
    // 平台
    const platform = new THREE.Mesh(new THREE.BoxGeometry(14, 0.4, 14), platformMat);
    platform.position.y = 0.2;
    group.add(platform);
    
    // 舞台
    const stage = new THREE.Mesh(new THREE.BoxGeometry(6, 0.6, 3), pinkMat);
    stage.position.set(0, 0.5, -5);
    group.add(stage);
    
    // 柱子
    const pillarMat = new THREE.MeshLambertMaterial({ color: 0x880e4f });
    [[-5, -5], [5, -5], [-5, 5], [5, 5]].forEach(pos => {
        const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 3.5, 8), pillarMat);
        pillar.position.set(pos[0], 2.2, pos[1]);
        group.add(pillar);
    });
    
    // 屋顶
    const roof = new THREE.Mesh(new THREE.BoxGeometry(12, 0.25, 12), darkMat);
    roof.position.y = 4;
    group.add(roof);
    
    // 座椅
    for (let i = 0; i < 3; i++) {
        const seat = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.3, 0.8), seatMat);
        seat.position.set(-3 + i * 3, 0.35, 4);
        group.add(seat);
    }
    
    // 爱心
    const heart = new THREE.Mesh(
        new THREE.SphereGeometry(0.8, 12, 12),
        new THREE.MeshLambertMaterial({ color: 0xe91e63 })
    );
    heart.scale.set(1, 1.1, 0.4);
    heart.position.set(0, 1.3, -5);
    group.add(heart);
    
    group.position.set(x, 0, z);
    scene.add(group);
}

/**
 * 创建任务中心
 */
export function createTaskCenter(scene, x, z) {
    const group = new THREE.Group();
    
    const baseMat = new THREE.MeshLambertMaterial({ color: 0x3f51b5 });
    const accentMat = new THREE.MeshLambertMaterial({ color: 0x7986cb });
    
    // 底座
    const base = new THREE.Mesh(new THREE.BoxGeometry(10, 1, 10), baseMat);
    base.position.y = 0.5;
    group.add(base);
    
    // 主体
    const body = new THREE.Mesh(new THREE.BoxGeometry(8, 4, 8), accentMat);
    body.position.y = 3;
    group.add(body);
    
    // 屋顶
    const roof = new THREE.Mesh(new THREE.BoxGeometry(9, 0.5, 9), baseMat);
    roof.position.y = 5.25;
    group.add(roof);
    
    // 图标
    const icon = new THREE.Mesh(
        new THREE.BoxGeometry(2, 2, 0.5),
        new THREE.MeshLambertMaterial({ color: 0xffeb3b })
    );
    icon.position.set(0, 3, 4.25);
    group.add(icon);
    
    group.position.set(x, 0, z);
    scene.add(group);
}

/**
 * 创建声誉塔
 */
export function createReputationTower(scene, x, z) {
    const group = new THREE.Group();
    
    const towerMat = new THREE.MeshLambertMaterial({ color: 0xffd700 });
    const darkMat = new THREE.MeshLambertMaterial({ color: 0xffa000 });
    
    // 塔基
    const base = new THREE.Mesh(new THREE.CylinderGeometry(4, 5, 2, 8), towerMat);
    base.position.y = 1;
    group.add(base);
    
    // 塔身
    const tower = new THREE.Mesh(new THREE.CylinderGeometry(2, 3, 8, 8), darkMat);
    tower.position.y = 6;
    group.add(tower);
    
    // 塔尖
    const top = new THREE.Mesh(new THREE.ConeGeometry(1.5, 3, 8), towerMat);
    top.position.y = 11.5;
    group.add(top);
    
    group.position.set(x, 0, z);
    scene.add(group);
}

/**
 * 创建交易中心
 */
export function createTradingCenter(scene, x, z) {
    const group = new THREE.Group();
    
    const wallMat = new THREE.MeshLambertMaterial({ color: 0x4caf50 });
    const roofMat = new THREE.MeshLambertMaterial({ color: 0x2e7d32 });
    
    // 底座
    const base = new THREE.Mesh(new THREE.BoxGeometry(12, 0.5, 12), roofMat);
    base.position.y = 0.25;
    group.add(base);
    
    // 墙体
    const wall = new THREE.Mesh(new THREE.BoxGeometry(10, 3, 10), wallMat);
    wall.position.y = 2;
    group.add(wall);
    
    // 屋顶（金字塔形）
    const roof = new THREE.Mesh(new THREE.ConeGeometry(7.5, 3, 4), roofMat);
    roof.rotation.y = Math.PI / 4;
    roof.position.y = 4.5;
    group.add(roof);
    
    group.position.set(x, 0, z);
    scene.add(group);
}

/**
 * 创建档案馆
 */
export function createArchive(scene, x, z) {
    const group = new THREE.Group();
    
    const wallMat = new THREE.MeshLambertMaterial({ color: 0x795548 });
    const roofMat = new THREE.MeshLambertMaterial({ color: 0x5d4037 });
    
    // 底座
    const base = new THREE.Mesh(new THREE.BoxGeometry(10, 0.5, 8), roofMat);
    base.position.y = 0.25;
    group.add(base);
    
    // 主体
    const body = new THREE.Mesh(new THREE.BoxGeometry(8, 5, 6), wallMat);
    body.position.y = 3;
    group.add(body);
    
    // 屋顶
    const roof = new THREE.Mesh(new THREE.BoxGeometry(9, 0.5, 7), roofMat);
    roof.position.y = 5.75;
    group.add(roof);
    
    // 书柜图标
    const shelf = new THREE.Mesh(
        new THREE.BoxGeometry(3, 2, 0.3),
        new THREE.MeshLambertMaterial({ color: 0x8d6e63 })
    );
    shelf.position.set(0, 3, 3.15);
    group.add(shelf);
    
    group.position.set(x, 0, z);
    scene.add(group);
}

/**
 * 创建消息站
 */
export function createMessageStation(scene, x, z) {
    const group = new THREE.Group();
    
    const mat = new THREE.MeshLambertMaterial({ color: 0x00bcd4 });
    
    // 底座
    const base = new THREE.Mesh(new THREE.CylinderGeometry(3, 3.5, 0.5, 16), mat);
    base.position.y = 0.25;
    group.add(base);
    
    // 柱体
    const pillar = new THREE.Mesh(new THREE.CylinderGeometry(1, 1.5, 4, 12), mat);
    pillar.position.y = 2.5;
    group.add(pillar);
    
    // 顶部（消息气泡造型）
    const bubble = new THREE.Mesh(
        new THREE.SphereGeometry(1.5, 16, 16),
        new THREE.MeshLambertMaterial({ color: 0x03a9f4 })
    );
    bubble.position.y = 5;
    group.add(bubble);
    
    group.position.set(x, 0, z);
    scene.add(group);
}

/**
 * 创建数据中心
 */
export function createDataCenter(scene, x, z) {
    const group = new THREE.Group();
    
    const mat = new THREE.MeshLambertMaterial({ color: 0x673ab7 });
    const accentMat = new THREE.MeshLambertMaterial({ color: 0x9575cd });
    
    // 主体（服务器机房造型）
    const body = new THREE.Mesh(new THREE.BoxGeometry(8, 6, 6), mat);
    body.position.y = 3;
    group.add(body);
    
    // 服务器图标
    for (let i = 0; i < 3; i++) {
        const server = new THREE.Mesh(
            new THREE.BoxGeometry(2, 0.3, 1.5),
            accentMat
        );
        server.position.set(0, 1 + i * 0.5, 3.1);
        group.add(server);
    }
    
    // 天线
    const antenna = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.1, 2, 8),
        accentMat
    );
    antenna.position.set(2, 7, 0);
    group.add(antenna);
    
    const antennaHead = new THREE.Mesh(
        new THREE.SphereGeometry(0.3, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xff5722 })
    );
    antennaHead.position.set(2, 8, 0);
    group.add(antennaHead);
    
    group.position.set(x, 0, z);
    scene.add(group);
}

/**
 * 创建创意工坊
 */
export function createCreativeWorkshop(scene, x, z) {
    const group = new THREE.Group();
    
    const wallMat = new THREE.MeshLambertMaterial({ color: 0xff9800 });
    const roofMat = new THREE.MeshLambertMaterial({ color: 0xf57c00 });
    
    // 底座
    const base = new THREE.Mesh(new THREE.BoxGeometry(10, 0.5, 10), roofMat);
    base.position.y = 0.25;
    group.add(base);
    
    // 墙体
    const wall = new THREE.Mesh(new THREE.BoxGeometry(8, 4, 8), wallMat);
    wall.position.y = 2.5;
    group.add(wall);
    
    // 屋顶
    const roof = new THREE.Mesh(new THREE.ConeGeometry(6, 2, 4), roofMat);
    roof.rotation.y = Math.PI / 4;
    roof.position.y = 5.5;
    group.add(roof);
    
    // 画架图标
    const easel = new THREE.Mesh(
        new THREE.BoxGeometry(2, 2.5, 0.2),
        new THREE.MeshLambertMaterial({ color: 0x795548 })
    );
    easel.position.set(0, 3, 4.1);
    group.add(easel);
    
    // 画布
    const canvas = new THREE.Mesh(
        new THREE.BoxGeometry(1.5, 2, 0.05),
        new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    canvas.position.set(0, 3, 4.25);
    group.add(canvas);
    
    group.position.set(x, 0, z);
    scene.add(group);
}

// ============ 建筑悬停提示 ============

let raycaster = null;
let mouse = null;

/**
 * 设置建筑悬停检测
 */
function setupBuildingHover(scene) {
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();
    
    // 事件监听需要在外部设置，这里只记录需要的功能
    console.log('[WorldBuilder] Building hover system ready');
}

/**
 * 获取建筑悬停信息
 */
export function getBuildingHover(scene, camera, mouseX, mouseY) {
    if (!raycaster || !scene) return null;
    
    mouse.x = mouseX;
    mouse.y = mouseY;
    
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);
    
    if (intersects.length > 0) {
        // 返回第一个相交的建筑
        for (const hit of intersects) {
            // 简单检测是否为建筑的一部分
            if (hit.object.geometry && hit.distance < 100) {
                return {
                    distance: hit.distance,
                    point: hit.point
                };
            }
        }
    }
    return null;
}

export default {
    LANDMARKS,
    buildWorld,
    createLake,
    createTree,
    createLamp,
    createFlower,
    createBench,
    createBush,
    createFountain,
    createSocialPlaza,
    createTaskCenter,
    createReputationTower,
    createTradingCenter,
    createArchive,
    createMessageStation,
    createDataCenter,
    createCreativeWorkshop,
    getBuildingHover
};
