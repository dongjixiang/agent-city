/**
 * @fileoverview 鸟群系统
 * 
 * 职责：
 * - 创建和管理鸟类智能体
 * - 鸟的飞行路径规划
 * - 鸟的动画（飞行、降落、休息）
 * 
 * 使用方式：
 *   import { initBirds, updateBirds } from './systems/birds.js';
 *   initBirds(scene);
 *   // 在动画循环中调用 updateBirds(time)
 * 
 * 导出：
 * - window.updateBirds
 * - window.lastBirdTime
 * 
 * @module systems/birds
 */

import * as THREE from 'three';

// 配置
const MAX_BIRDS = 12;

// 状态
let birds = [];
let landingSpots = [];
let lastBirdTime = null;

/**
 * 创建单只鸟
 * @returns {THREE.Group}
 */
export function createBird() {
    const group = new THREE.Group();

    // 身体
    const bodyGeo = new THREE.ConeGeometry(0.08, 0.2, 5);
    const bodyMat = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.rotation.x = Math.PI / 2;
    group.add(body);

    // 头
    const headGeo = new THREE.SphereGeometry(0.06, 6, 6);
    const headMat = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.z = 0.12;
    group.add(head);

    // 喙
    const beakGeo = new THREE.ConeGeometry(0.02, 0.06, 4);
    const beakMat = new THREE.MeshBasicMaterial({ color: 0xFFA500 });
    const beak = new THREE.Mesh(beakGeo, beakMat);
    beak.rotation.x = -Math.PI / 2;
    beak.position.z = 0.2;
    group.add(beak);

    // 翅膀
    const wingGeo = new THREE.PlaneGeometry(0.2, 0.1);
    const wingMat = new THREE.MeshLambertMaterial({ color: 0x6B5344, side: THREE.DoubleSide });

    const leftWing = new THREE.Mesh(wingGeo, wingMat);
    leftWing.position.set(-0.1, 0.02, 0);
    leftWing.rotation.y = Math.PI / 8;
    leftWing.name = 'leftWing';
    group.add(leftWing);

    const rightWing = new THREE.Mesh(wingGeo, wingMat);
    rightWing.position.set(0.1, 0.02, 0);
    rightWing.rotation.y = -Math.PI / 8;
    rightWing.name = 'rightWing';
    group.add(rightWing);

    // 尾巴
    const tailGeo = new THREE.ConeGeometry(0.04, 0.1, 4);
    const tail = new THREE.Mesh(tailGeo, bodyMat);
    tail.rotation.x = -Math.PI / 2;
    tail.position.z = -0.15;
    group.add(tail);

    // 随机位置
    const angle = Math.random() * Math.PI * 2;
    const radius = 15 + Math.random() * 30;
    group.position.set(
        Math.cos(angle) * radius,
        12 + Math.random() * 8,
        Math.sin(angle) * radius
    );

    group.scale.set(0.8, 0.8, 0.8);

    // 状态数据
    group.userData = {
        state: 'flying',
        targetPos: null,
        angle: angle,
        radius: radius,
        height: group.position.y,
        speed: 0.3 + Math.random() * 0.4,
        wingPhase: Math.random() * Math.PI * 2,
        stateTimer: 0,
        flyDirection: 1,
        verticalOffset: 0
    };

    return group;
}

/**
 * 初始化鸟群
 * @param {THREE.Scene} scene
 * @param {number} count - 鸟的数量，默认 12
 */
export function initBirds(scene, count = MAX_BIRDS) {
    // 建筑位置（用于降落）
    const buildingPositions = [
        { x: -25, y: 6, z: -25 },
        { x: 25, y: 7.5, z: -25 },
        { x: -25, y: 4, z: 25 },
        { x: 25, y: 5, z: 25 },
        { x: 0, y: 3, z: -35 },
        { x: -35, y: 7, z: 0 },
        { x: 35, y: 5, z: 0 },
        { x: 0, y: 2.5, z: 35 },
    ];

    // 添加树顶
    for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        const r = 42;
        buildingPositions.push({
            x: Math.cos(a) * r,
            y: 3 + Math.random() * 2,
            z: Math.sin(a) * r
        });
    }

    landingSpots = buildingPositions;

    // 创建鸟
    for (let i = 0; i < count; i++) {
        const bird = createBird();
        birds.push(bird);
        scene.add(bird);
    }

    console.log(`[Birds] ${count} birds flying`);
}

/**
 * 更新所有鸟的状态
 * @param {number} time - 当前时间
 */
export function updateBirds(time) {
    // 计算时间差
    if (!lastBirdTime) lastBirdTime = time;
    const deltaTime = Math.min((time - lastBirdTime) / 1000, 0.1);
    lastBirdTime = time;

    for (const bird of birds) {
        const ud = bird.userData;

        // 状态机
        switch (ud.state) {
            case 'flying':
                updateFlyingBird(bird, deltaTime);
                break;
            case 'landing':
                updateLandingBird(bird, deltaTime);
                break;
            case 'resting':
                updateRestingBird(bird, deltaTime);
                break;
            case 'takingOff':
                updateTakingOffBird(bird, deltaTime);
                break;
        }

        // 更新翅膀动画
        ud.wingPhase += deltaTime * 10;
        const wingAngle = Math.sin(ud.wingPhase) * 0.3;
        const leftWing = bird.getObjectByName('leftWing');
        const rightWing = bird.getObjectByName('rightWing');
        if (leftWing) leftWing.rotation.z = wingAngle;
        if (rightWing) rightWing.rotation.z = -wingAngle;

        // 更新计时器
        ud.stateTimer += deltaTime;
    }
}

/**
 * 更新飞行中的鸟
 */
function updateFlyingBird(bird, deltaTime) {
    const ud = bird.userData;

    // 圆周飞行
    ud.angle += ud.speed * deltaTime;
    bird.position.x = Math.cos(ud.angle) * ud.radius;
    bird.position.z = Math.sin(ud.angle) * ud.radius;
    bird.position.y = ud.height + Math.sin(Date.now() * 0.001 + ud.verticalOffset) * 0.5;

    // 面向飞行方向
    bird.rotation.y = ud.angle + Math.PI / 2;

    // 偶尔切换高度
    if (Math.random() < 0.001) {
        ud.height = 12 + Math.random() * 8;
    }

    // 随机决定是否降落
    if (ud.stateTimer > 10 && Math.random() < 0.002) {
        // 选择一个降落点
        const spot = landingSpots[Math.floor(Math.random() * landingSpots.length)];
        ud.targetPos = { x: spot.x, y: spot.y + 0.5, z: spot.z };
        ud.state = 'landing';
        ud.stateTimer = 0;
    }
}

/**
 * 更新降落中的鸟
 */
function updateLandingBird(bird, deltaTime) {
    const ud = bird.userData;
    const target = ud.targetPos;

    // 移向目标
    const dx = target.x - bird.position.x;
    const dy = target.y - bird.position.y;
    const dz = target.z - bird.position.z;
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

    if (dist < 0.3) {
        // 降落后休息
        ud.state = 'resting';
        ud.stateTimer = 0;
        bird.position.copy(target);
    } else {
        // 移动
        const speed = 5 * deltaTime;
        bird.position.x += (dx / dist) * speed;
        bird.position.y += (dy / dist) * speed;
        bird.position.z += (dz / dist) * speed;
        bird.rotation.y = Math.atan2(dx, dz);
    }

    // 超时则恢复飞行
    if (ud.stateTimer > 5) {
        ud.state = 'takingOff';
        ud.stateTimer = 0;
        ud.height = 12 + Math.random() * 8;
    }
}

/**
 * 更新休息中的鸟
 */
function updateRestingBird(bird, deltaTime) {
    const ud = bird.userData;

    // 休息时轻微摇晃
    bird.rotation.z = Math.sin(Date.now() * 0.002) * 0.05;

    // 休息超时则起飞
    if (ud.stateTimer > 3 + Math.random() * 5) {
        ud.state = 'takingOff';
        ud.stateTimer = 0;
    }
}

/**
 * 更新起飞的鸟
 */
function updateTakingOffBird(bird, deltaTime) {
    const ud = bird.userData;

    // 向上飞
    if (bird.position.y < ud.height) {
        bird.position.y += 3 * deltaTime;
    } else {
        // 恢复飞行
        ud.state = 'flying';
        ud.stateTimer = 0;
        ud.angle = Math.atan2(bird.position.z, bird.position.x);
        ud.radius = Math.sqrt(bird.position.x * bird.position.x + bird.position.z * bird.position.z);
    }
}

/**
 * 获取所有鸟
 */
export function getBirds() {
    return birds;
}

/**
 * 获取降落点
 */
export function getLandingSpots() {
    return landingSpots;
}

// 挂载到 window
window.updateBirds = updateBirds;
window.lastBirdTime = null;

export default { initBirds, updateBirds, getBirds, createBird };
