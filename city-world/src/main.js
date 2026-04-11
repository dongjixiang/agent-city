/**
 * AgentCityApp - 智体城 3D 世界主应用
 * 
 * ES Modules 架构的入口点
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// Core
import { eventBus, Events } from './core/event-bus.js';

// Managers
import { SceneManager } from './core/scene.js';
import { CameraManager } from './core/camera.js';
import { RendererManager } from './core/renderer.js';
import { ClockManager } from './core/clock.js';
import { LightingManager } from './core/lighting.js';

// World
import { worldState } from './world/world-state.js';
import { TerrainManager } from './world/terrain.js';
import { BuildingsManager } from './world/buildings-manager.js';
import { decorationsManager } from './world/decorations-manager.js';
import { landmarksManager } from './world/landmarks.js';

// Agents
import { AgentManager } from './agents/manager.js';
import { HeadDisplay } from './agents/head-display.js';

// Systems
import { WeatherSystem } from './systems/weather.js';
import { DayNightSystem } from './systems/daynight-system.js';
import { EcologySystem } from './systems/ecology-system.js';

// UI
import { worldStatePanel } from './ui/world-state-panel.js';
import { Dashboard } from './ui/dashboard.js';
import { WorldWindow } from './ui/world-window.js';

// Network
import { sync } from './network/sync.js';

// Utils
import { SpatialGrid } from './utils/spatial-grid.js';

class AgentCityApp {
    constructor() {
        this.isRunning = false;
        this.frameId = null;
        
        // Managers
        this.sceneManager = null;
        this.cameraManager = null;
        this.rendererManager = null;
        this.clockManager = null;
        this.lightingManager = null;
        this.terrainManager = null;
        this.buildingsManager = null;
        this.agentManager = null;
        this.weatherSystem = null;
        this.dayNightSystem = null;
        this.ecologySystem = null;
        this.headDisplay = null;
        this.worldWindow = null;
        this.dashboard = null;
        this.spatialGrid = null;

        // Bind methods
        this.animate = this.animate.bind(this);
        this.onResize = this.onResize.bind(this);
    }

    /**
     * 初始化应用
     */
    async init() {
        console.log('[App] Initializing Agent City 3D World...');

        try {
            // 1. 初始化核心（场景、相机、渲染器、时钟、灯光）
            this.initCore();

            // 2. 初始化世界（地形、建筑、装饰物、地标）
            this.initWorld();

            // 3. 初始化智能体系统
            this.initAgents();

            // 4. 初始化子系统（天气、昼夜、生态）
            this.initSystems();

            // 5. 初始化 UI
            this.initUI();

            // 6. 初始化网络
            this.initNetwork();

            // 7. 绑定事件
            this.bindEvents();

            // 8. 隐藏加载画面
            this.hideLoading();

            console.log('[App] Initialization complete!');
            return true;
        } catch (err) {
            console.error('[App] Initialization failed:', err);
            return false;
        }
    }

    /**
     * 初始化核心系统
     */
    initCore() {
        // Scene Manager
        this.sceneManager = new SceneManager();
        this.sceneManager.init();
        const scene = this.sceneManager.getScene();

        // Camera Manager
        this.cameraManager = new CameraManager();
        this.cameraManager.init(this.sceneManager.getRenderer().domElement);
        this.cameraManager.setPosition(0, 50, 50);

        // Renderer Manager
        this.rendererManager = new RendererManager();
        this.rendererManager.init();
        this.rendererManager.addToDOM(document.getElementById('canvas-container'));

        // Clock Manager
        this.clockManager = new ClockManager();

        // Lighting Manager
        this.lightingManager = new LightingManager();
        this.lightingManager.init(scene);

        console.log('[App] Core systems initialized');
    }

    /**
     * 初始化世界
     */
    initWorld() {
        const scene = this.sceneManager.getScene();

        // Terrain
        this.terrainManager = new TerrainManager();
        this.terrainManager.init(scene);
        this.terrainManager.createGround();
        this.terrainManager.createGrid();
        this.terrainManager.createWater();

        // Buildings
        this.buildingsManager = new BuildingsManager();
        this.buildingsManager.init(scene);

        // Decorations
        decorationsManager.init(scene);
        decorationsManager.createAll();

        // Landmarks
        landmarksManager.init(scene);
        landmarksManager.createAll();

        // Spatial Grid
        this.spatialGrid = new SpatialGrid(10);

        console.log('[App] World initialized');
    }

    /**
     * 初始化智能体系统
     */
    initAgents() {
        const scene = this.sceneManager.getScene();

        // Head Display
        this.headDisplay = new HeadDisplay(scene);

        // Agent Manager
        this.agentManager = new AgentManager();
        this.agentManager.init(scene);

        // 注册事件处理
        eventBus.on(Events.AGENT_ADDED, ({ agent }) => {
            this.headDisplay.createForAgent(agent);
            worldState.addAgent(agent);
        });

        eventBus.on(Events.AGENT_REMOVED, ({ agentId }) => {
            this.headDisplay.removeForAgent(agentId);
        });

        console.log('[App] Agent systems initialized');
    }

    /**
     * 初始化子系统
     */
    initSystems() {
        const scene = this.sceneManager.getScene();

        // Weather System
        this.weatherSystem = new WeatherSystem();
        this.weatherSystem.init(scene);
        this.weatherSystem.start();

        // Day Night System
        this.dayNightSystem = new DayNightSystem();
        this.dayNightSystem.init(scene, this.lightingManager);
        this.dayNightSystem.start();

        // Ecology System
        this.ecologySystem = new EcologySystem();
        this.ecologySystem.init(scene);
        this.ecologySystem.start();

        console.log('[App] Subsystems initialized');
    }

    /**
     * 初始化 UI
     */
    initUI() {
        // World State Panel
        worldStatePanel.init();

        // Dashboard
        this.dashboard = new Dashboard();
        this.dashboard.init();

        // World Window
        this.worldWindow = new WorldWindow();
        this.worldWindow.init();

        console.log('[App] UI initialized');
    }

    /**
     * 初始化网络
     */
    async initNetwork() {
        try {
            await sync.connect();
        } catch (err) {
            console.warn('[App] Network connection failed, running in offline mode:', err.message);
        }
    }

    /**
     * 绑定事件
     */
    bindEvents() {
        // Resize
        window.addEventListener('resize', this.onResize);

        // Keyboard
        window.addEventListener('keydown', (e) => this.onKeyDown(e));

        // Mouse click (raycasting)
        this.sceneManager.getRenderer().domElement.addEventListener('click', (e) => this.onClick(e));

        console.log('[App] Events bound');
    }

    /**
     * 开始应用
     */
    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.clockManager.start();
        this.animate();
        console.log('[App] Started');
    }

    /**
     * 停止应用
     */
    stop() {
        this.isRunning = false;
        if (this.frameId) {
            cancelAnimationFrame(this.frameId);
            this.frameId = null;
        }
        console.log('[App] Stopped');
    }

    /**
     * 动画循环
     */
    animate() {
        if (!this.isRunning) return;

        this.frameId = requestAnimationFrame(this.animate);

        // 获取 deltaTime
        const deltaTime = this.clockManager.getDelta();

        // 更新游戏时间
        worldState.tick(deltaTime);

        // 更新相机
        this.cameraManager.update(deltaTime);

        // 更新子系统
        this.dayNightSystem.update(deltaTime);
        this.weatherSystem.update(deltaTime);
        this.ecologySystem.update(deltaTime, this.agentManager.getAllAgents());

        // 更新智能体
        this.agentManager.update(deltaTime);

        // 更新头顶显示位置
        this.headDisplay.updateAllPositions();

        // 更新天气粒子
        this.weatherSystem.updateParticles(deltaTime);

        // 渲染
        this.rendererManager.render(this.sceneManager.getScene(), this.cameraManager.getCamera());

        // 更新 FPS
        this.clockManager.updateFPS();
    }

    /**
     * 窗口大小变化
     */
    onResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;

        this.cameraManager.setSize(width, height);
        this.rendererManager.setSize(width, height);
    }

    /**
     * 键盘事件
     */
    onKeyDown(e) {
        switch (e.key) {
            case 'Escape':
                this.agentManager.deselectAll();
                break;
            case '1':
                this.cameraManager.setMode('orbit');
                break;
            case '2':
                this.cameraManager.setMode('follow');
                break;
            case '3':
                this.cameraManager.setMode('firstPerson');
                break;
            case ' ':
                // 暂停/继续
                if (this.isRunning) {
                    this.stop();
                } else {
                    this.start();
                }
                break;
        }
    }

    /**
     * 鼠标点击
     */
    onClick(e) {
        // 简单的点击检测逻辑
        // 实际实现需要 raycasting
    }

    /**
     * 隐藏加载画面
     */
    hideLoading() {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.classList.add('hidden');
            setTimeout(() => {
                loading.style.display = 'none';
            }, 800);
        }
    }

    /**
     * 销毁应用
     */
    dispose() {
        this.stop();

        window.removeEventListener('resize', this.onResize);

        this.rendererManager.dispose();
        this.sceneManager.dispose();
        this.buildingsManager.dispose();
        decorationsManager.dispose();
        landmarksManager.dispose();
        this.agentManager.dispose();
        this.weatherSystem.dispose();
        this.dayNightSystem.dispose();
        this.ecologySystem.dispose();
        this.headDisplay.dispose();
        worldStatePanel.dispose();
        this.dashboard.dispose();
        sync.disconnect();

        eventBus.clear();

        console.log('[App] Disposed');
    }

    /**
     * 获取状态
     */
    getStatus() {
        return {
            isRunning: this.isRunning,
            fps: this.clockManager?.getFPS() || 0,
            worldState: worldState.getSummary(),
            network: sync.getStatus()
        };
    }
}

// 创建全局应用实例
window.AgentCityApp = AgentCityApp;

// 导出
export { AgentCityApp };
