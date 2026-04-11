/**
 * @fileoverview 智体城3D世界 - 主入口
 * 
 * 职责：
 * - 初始化场景、相机、灯光
 * - 协调各子系统启动
 * - 管理全局状态
 * 
 * 依赖初始化顺序：
 * 1. scene (core)
 * 2. lighting (core)
 * 3. ground (core)
 * 4. buildings (world)
 * 5. agents (agents)
 * 6. systems (weather, birds, day-night, audio)
 * 7. ui (panels)
 * 
 * @module main
 */

import * as THREE from 'three';

// 全局状态
const state = {
    scene: null,
    camera: null,
    renderer: null,
    clock: null,
    isInitialized: false
};

/**
 * 主初始化函数
 * @param {HTMLCanvasElement} canvas - 渲染用的 canvas
 */
export function init(canvas) {
    if (state.isInitialized) {
        console.warn('[Main] Already initialized');
        return;
    }

    console.log('[Main] Initializing Agent City 3D World...');

    // 1. 初始化场景
    initScene(canvas);

    // 2. 初始化相机
    initCamera();

    // 3. 初始化灯光
    initLighting();

    // 4. 初始化地面
    initGround();

    // 5. 初始化建筑
    initBuildings();

    // 6. 初始化智能体系统
    initAgents();

    // 7. 初始化子系统
    initSystems();

    // 8. 初始化UI
    initUI();

    // 9. 启动动画循环
    startAnimationLoop();

    state.isInitialized = true;
    console.log('[Main] Initialization complete');
}

/**
 * 初始化 Three.js 场景
 */
function initScene(canvas) {
    state.scene = new THREE.Scene();
    state.scene.background = new THREE.Color(0x1a1a2e);
    window.scene = state.scene; // 共享给其他模块

    state.clock = new THREE.Clock();
}

/**
 * 初始化相机
 */
function initCamera() {
    const aspect = window.innerWidth / window.innerHeight;
    state.camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 1000);
    state.camera.position.set(0, 50, 50);
    state.camera.lookAt(0, 0, 0);
}

/**
 * 初始化灯光
 */
function initLighting() {
    // 环境光
    const ambient = new THREE.AmbientLight(0x404040, 0.5);
    state.scene.add(ambient);

    // 平行光（太阳）
    const sun = new THREE.DirectionalLight(0xffffff, 1);
    sun.position.set(50, 100, 50);
    state.scene.add(sun);
}

/**
 * 初始化地面
 */
function initGround() {
    // TODO: 从 ground.js 导入
}

/**
 * 初始化建筑
 */
function initBuildings() {
    // TODO: 从 buildings.js 导入
}

/**
 * 初始化智能体系统
 */
function initAgents() {
    // TODO: 从 agents/manager.js 导入
}

/**
 * 初始化子系统
 */
function initSystems() {
    // TODO: 从 systems/*.js 导入
}

/**
 * 初始化UI组件
 */
function initUI() {
    // TODO: 从 ui/*.js 导入
}

/**
 * 启动动画循环
 */
function startAnimationLoop() {
    // TODO: 实现动画循环
}

/**
 * 获取全局状态
 */
export function getState() {
    return state;
}

export default { init, getState };
