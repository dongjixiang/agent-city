/**
 * Agent City 3D World - Main Entry
 * 
 * 智体城 3D 世界主入口
 * 
 * 模块化架构 (基于 DESIGN.md)
 */

// ============= Core Modules =============
import sceneManager from './core/scene.js';
import rendererManager from './core/renderer.js';
import cameraManager from './core/camera.js';
import clockManager from './core/clock.js';
import lightingManager from './core/lighting.js';

// ============= World Modules =============
import terrainManager from './world/terrain.js';

// ============= Systems (待创建) =============
// import weatherSystem from './systems/weather.js';
// import dayNightSystem from './systems/day-night.js';
// import birdsSystem from './systems/birds.js';

// ============= Agents (待创建) =============
// import agentManager from './agents/manager.js';

// ============= UI (待创建) =============
// import worldWindow from './ui/world-window.js';
// import dashboard from './ui/dashboard.js';

// ============= Network (待创建) =============
// import networkManager from './network/websocket.js';

// ============= Event Bus =============
class EventBus {
    constructor() {
        this.listeners = new Map();
    }

    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }

    off(event, callback) {
        if (!this.listeners.has(event)) return;
        const callbacks = this.listeners.get(event);
        const index = callbacks.indexOf(callback);
        if (index > -1) callbacks.splice(index, 1);
    }

    emit(event, data) {
        if (!this.listeners.has(event)) return;
        this.listeners.get(event).forEach(callback => callback(data));
    }
}

const eventBus = new EventBus();

// ============= Main Application =============
class AgentCityApp {
    constructor() {
        this.initialized = false;
        this.running = false;
        this.canvas = null;
    }

    /**
     * 初始化应用
     */
    async init(canvasId = 'canvas') {
        if (this.initialized) {
            console.warn('[App] Already initialized');
            return;
        }

        console.log('[App] Initializing...');

        // 获取画布
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            console.error('[App] Canvas not found:', canvasId);
            return;
        }

        // 1. 初始化核心模块
        console.log('[App] Initializing core modules...');

        // 场景
        const scene = sceneManager.init();

        // 渲染器
        rendererManager.init(this.canvas);
        const renderer = rendererManager.getRenderer();

        // 相机
        cameraManager.init(this.canvas);
        const camera = cameraManager.getCamera();

        // 时钟
        clockManager.init();

        // 灯光
        lightingManager.init(scene);

        // 2. 初始化世界模块
        console.log('[App] Initializing world modules...');
        terrainManager.init(scene);

        // 3. 连接日夜系统和灯光
        clockManager.setOnPhaseChange((phase) => {
            lightingManager.setPhase(phase);
            eventBus.emit('phase:change', phase);
        });

        // 4. 窗口大小调整
        window.addEventListener('resize', () => this.onResize());

        this.initialized = true;
        console.log('[App] Initialization complete');

        return true;
    }

    /**
     * 启动渲染循环
     */
    start() {
        if (!this.initialized) {
            console.error('[App] Not initialized');
            return;
        }

        if (this.running) {
            console.warn('[App] Already running');
            return;
        }

        this.running = true;
        console.log('[App] Starting render loop...');

        this.animate();

        return true;
    }

    /**
     * 停止
     */
    stop() {
        this.running = false;
        console.log('[App] Stopped');
    }

    /**
     * 渲染循环
     */
    animate() {
        if (!this.running) return;

        requestAnimationFrame(() => this.animate());

        // 获取 deltaTime
        const delta = clockManager.getDelta();

        // 更新游戏时间
        clockManager.update(delta);

        // 更新相机控制器
        cameraManager.update();

        // 更新跟随模式
        cameraManager.updateFollow();

        // 触发帧更新事件
        eventBus.emit('frame:update', {
            delta,
            elapsed: clockManager.getElapsed(),
            time: clockManager.getFormattedTime()
        });

        // 渲染
        const scene = sceneManager.getScene();
        const camera = cameraManager.getCamera();
        if (scene && camera) {
            rendererManager.render(scene, camera);
        }
    }

    /**
     * 窗口大小变化
     */
    onResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;

        rendererManager.resize(width, height);

        const camera = cameraManager.getCamera();
        if (camera) {
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
        }
    }

    /**
     * 获取状态
     */
    getStatus() {
        return {
            initialized: this.initialized,
            running: this.running,
            time: clockManager?.getFormattedTime() || '--:--',
            phase: clockManager?.getCurrentPhase() || 'unknown',
            mode: cameraManager?.getMode() || 'unknown',
            entities: {
                agents: sceneManager?.getAgents()?.length || 0,
                buildings: sceneManager?.getBuildings()?.length || 0,
                decorations: sceneManager?.getDecorations()?.length || 0
            }
        };
    }
}

// ============= Global Instance =============
const app = new AgentCityApp();

// 暴露到全局
window.AgentCityApp = app;
window.eventBus = eventBus;

// 暴露管理器到全局（便于调试）
window.sceneManager = sceneManager;
window.rendererManager = rendererManager;
window.cameraManager = cameraManager;
window.clockManager = clockManager;
window.lightingManager = lightingManager;
window.terrainManager = terrainManager;

// ============= 初始化 =============
// 当 DOM 加载完成后初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => app.init());
} else {
    app.init();
}

export {
    app,
    eventBus,
    sceneManager,
    rendererManager,
    cameraManager,
    clockManager,
    lightingManager,
    terrainManager
};
