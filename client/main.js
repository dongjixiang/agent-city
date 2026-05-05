/**
 * AgentCityApp - 智体城 3D 世界主程序
 *
 * @module main
 */

// roundRect polyfill for older browsers
if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
        if (typeof r === 'number') r = { tl: r, tr: r, br: r, bl: r };
        this.beginPath();
        this.moveTo(x + r.tl, y);
        this.lineTo(x + w - r.tr, y);
        this.quadraticCurveTo(x + w, y, x + w, y + r.tr);
        this.lineTo(x + w, y + h - r.br);
        this.quadraticCurveTo(x + w, y + h, x + w - r.br, y + h);
        this.lineTo(x + r.bl, y + h);
        this.quadraticCurveTo(x, y + h, x, y + h - r.bl);
        this.lineTo(x, y + r.tl);
        this.quadraticCurveTo(x, y, x + r.tl, y);
        this.closePath();
    };
}

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// Core - 核心基础设施
import { eventBus, Events } from './core/event-bus.js';
import { SpatialIndex } from './core/spatial-index.js';
import { WorldObject } from './core/world-object.js';
import { Agent, AgentState } from './core/agent.js';
import WorldData from './core/world-data.js';

// Systems - 世界系统
import { agentSystem } from './systems/agent-system.js';
import { worldBuilder } from './systems/world-builder.js';
import { WeatherSystem } from './systems/weather-system.js';
import { DayNightSystem } from './systems/daynight-system.js';
import { ReputationSystem } from './systems/reputation-system.js';
import { TaskSystem } from './systems/task-system.js';
import { RelationshipSystem } from './systems/relationship-system.js';
import { WaterSystem } from './systems/water-system.js';
import { CameraSystem } from './systems/camera-system.js';
import { WorldLoader } from './systems/world-loader.js';

// Buildings - 建筑功能系统
import { TaskCenter } from './systems/buildings/task-center.js';
import { ReputationTower } from './systems/buildings/reputation-tower.js';
import { TradingCenter } from './systems/buildings/trading-center.js';
import { Archive } from './systems/buildings/archive.js';
import { MessageStation } from './systems/buildings/message-station.js';
import { DataCenter } from './systems/buildings/data-center.js';
import { CreativeWorkshop } from './systems/buildings/creative-workshop.js';
import { SkillAcademy } from './systems/buildings/skill-academy.js';

// Ecology - 生态系统
import { BirdFlock } from './systems/ecology/bird-flock.js';
import { ButterflySwarm } from './systems/ecology/butterfly-swarm.js';
import { FishSystem } from './systems/ecology/fish.js';
import { BoatSystem } from './systems/ecology/boat.js';
import { Cow, Dog } from './systems/ecology/farm-animals.js';

// Interaction - 交互系统
import { AnimalBehaviors } from './systems/interaction/animal-behaviors.js';
import { TransformerBehaviors } from './systems/interaction/transformer-behaviors.js';
import { TransformerController } from './systems/interaction/transformer-controller.js';
import { TankTransformer } from './systems/interaction/tank-transformer.js';
import { TankTransformerController } from './systems/interaction/tank-transformer-controller.js';
import { getVoiceSystem } from './systems/voice-system.js';
import { getAmbientSoundSystem } from './systems/ambient-sound-system.js';
import { MovableObjects } from './systems/interaction/movable-objects.js';
import { BubbleSystem } from './systems/interaction/bubble-system.js';

// AI - 人工智能
import { AgentBrain } from './ai/agent-brain.js';
import { SkillRegistry } from './ai/skill-registry.js';
import { LLMDecisionLoop } from './ai/llm-decision-loop.js';
import { worldStateProvider } from './ai/world-state-provider.js';
import { PerceptionSystem } from './ai/perception/perception-system.js';
import { NeedsSystem } from './ai/motivation/needs-system.js';
import { EmotionSystem } from './ai/emotions/emotion-system.js';
import { ConversationManager } from './ai/conversation/conversation-manager.js';
import { PersistentMemory } from './ai/memory/persistent-memory.js';
import { agentRegistry } from './ai/identity/agent-registry.js';
import { messageRouter } from './ai/communication/message-router.js';

// WebSocket
import { connection } from './websocket/connection.js';

// UI - 用户界面
import { WorldWindow } from './ui/world-window.js';
import { Dashboard } from './ui/dashboard.js';
import { Notifications } from './ui/notifications.js';
import { DayNightIndicator } from './ui/day-night-indicator.js';
import { InfoPanel } from './ui/info-panel.js';

class AgentCityApp {
    constructor() {
        this.isRunning = false;
        this.frameId = null;

        // Three.js 核心
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.clock = new THREE.Clock();

        // 世界建筑
        this.buildings = {};

        // 世界生态系统
        this.ecology = {};
        this.fishSystem = null;
        this.boatSystem = null;
        this.cows = [];
        this.dogs = [];

        // 系统实例
        this.systems = {
            agent: agentSystem,
            worldBuilder,
            weather: null,
            dayNight: null,
            reputation: null,
            task: null,
            relationship: null,
            animals: null,
            movableObjects: null,
            camera: null,  // 相机系统
            bubbles: null  // 气泡系统
        };

        // AI 子系统
        this.ai = {
            brain: null,
            skillRegistry: null,
            llmLoop: null
        };

        // UI
        this.ui = {
            worldWindow: null,
            dashboard: null,
            notifications: null,
            dayNightIndicator: null,
            infoPanel: null
        };
    }

    /**
     * 初始化应用
     */
    async init() {
        // 防止重复初始化
        if (this._initialized) {
            console.log('[App] Already initialized, skipping');
            return false;
        }
        this._initialized = true;
        
        console.log('[App] Initializing Agent City...');

        try {
            // 1. 初始化 Three.js 核心
            this.initThreeJS();

            // 2. 初始化核心系统
            this.initCore();

            // 2.5 加载服务器世界状态（获取实体数据）
            this.worldLoader = new WorldLoader('http://localhost:9877');
            await this.worldLoader.load();
            console.log('[App] WorldLoader loaded, entities:', this.worldLoader.getEntities().length);

            // 3. 初始化 AI 系统
             await this.initAI();

            // 4. 初始化世界
            this.initWorld();

            // 5. 初始化 UI
            this.initUI();

            // 6. 连接 WebSocket
            this.connectWebSocket();

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
     * 初始化 Three.js 核心
     */
    initThreeJS() {
        // 防止重复初始化
        if (this._threeInitialized) {
            console.log('[App] Three.js already initialized, skipping');
            return;
        }
        this._threeInitialized = true;
        
        // Scene - 初始背景色设为深色，待 dayNight 系统初始化后动态切换
        this.scene = new THREE.Scene(0x1a1a2e);

        // Camera - 调整以适应新地图（南湖北山格局）
        this.camera = new THREE.PerspectiveCamera(
            60, window.innerWidth / window.innerHeight, 0.1, 1000
        );
        this.camera.position.set(0, 120, 120);

        // Renderer
        // 清除旧的 canvas 防止重复
        const container = document.getElementById('canvas-container');
        if (container) container.innerHTML = '';
        
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        // 初始背景色 - 待 dayNight 系统初始化后动态切换
        this.renderer.setClearColor(0x1a1a2e);
        container?.appendChild(this.renderer.domElement);

        // 验证渲染器创建成功
        if (!this.renderer.domElement) {
            console.error('[App] ERROR: WebGL renderer failed to create canvas!');
        } else {
            console.log('[App] WebGL canvas created:', this.renderer.domElement.width, 'x', this.renderer.domElement.height);
        }

        // Controls
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.target.set(0, 0, 0);  // 确保相机指向场景中心

        // 打印场景内容
        console.log('[App] Scene children count:', this.scene.children.length);
        console.log('[App] Scene children:', this.scene.children.map(c => c.name || c.type || 'unnamed'));

        // Lights
        const ambient = new THREE.AmbientLight(0xffffff, 0.4);
        this.scene.add(ambient);

        const directional = new THREE.DirectionalLight(0xffffff, 0.8);
        directional.position.set(50, 100, 50);
        this.scene.add(directional);

        console.log('[App] Three.js initialized');
    }

    /**
     * 初始化核心系统
     */
    initCore() {
        // 初始化空间索引
        const spatialIndex = new SpatialIndex();

        // 初始化世界状态提供者
        worldStateProvider.setSpatialIndex(spatialIndex);

        console.log('[App] Core systems initialized');
    }

    /**
     * 初始化 AI 系统
     */
    async initAI() {
        // 初始化技能注册表
        this.ai.skillRegistry = new SkillRegistry();
        await this.ai.skillRegistry.init();

        // 初始化 LLM 决策循环
        this.ai.llmLoop = new LLMDecisionLoop();
        this.ai.llmLoop.configure('http://localhost:8080', 'minimax-cn/MiniMax-M2');

        // 初始化智能体大脑
        this.ai.brain = new AgentBrain();
        this.ai.brain.skillRegistry = this.ai.skillRegistry;
        this.ai.brain.decisionLoop = this.ai.llmLoop;

        console.log('[App] AI systems initialized');
    }

    /**
     * 初始化世界
     */
    initWorld() {
        // 防止重复初始化
        if (this._worldInitialized) {
            console.log('[App] World already initialized, skipping');
            return;
        }
        this._worldInitialized = true;
        
        // 输出世界数据信息
        console.log('[App] World Data loaded:', {
            buildings: WorldData.BUILDINGS.length,
            hills: WorldData.HILLS.length,
            landmarks: Object.keys(WorldData.LANDMARKS).length,
            spawnPoints: WorldData.SPAWN_POINTS.length
        });
        
        // 构建世界
        if (this.systems.worldBuilder) {
            this.systems.worldBuilder.init(this.scene);
            this.systems.worldBuilder.build();
            console.log('[App] After build - Scene children:', this.scene.children.length);
        }

        // 初始化智能体系统
        this.systems.agent.init(this.scene);

        // 初始化天气系统
        this.systems.weather = new WeatherSystem();
        this.systems.weather.init(this.scene, { camera: this.camera });
        this.systems.weather.start();

        // 初始化昼夜系统
        this.systems.dayNight = new DayNightSystem();
        this.systems.dayNight.init(this.scene);
        this.systems.dayNight.start();
        
        // 设置音频系统（在用户交互后启动）
        this.setupAudio();

        // 初始化水面动画系统
        this.systems.water = new WaterSystem();
        this.systems.water.init(this.scene);

        // 初始化社交系统
        this.systems.reputation = new ReputationSystem();
        this.systems.task = new TaskSystem();
        this.systems.relationship = new RelationshipSystem();

        // 初始化动物行为系统
        this.systems.animals = new AnimalBehaviors();
        this.systems.transformer = new TransformerBehaviors();
        this.systems.transformer.init(this.scene);
        this.transformerController = new TransformerController(this.systems.transformer);
        
        // 创建坦克变形金刚
        // 从 WorldLoader 获取变形金刚数据
        const tankEntity = this.worldLoader ? this.worldLoader.getEntitiesByType('tank')[0] : null;
        this.systems.tankTransformer = new TankTransformer(this.scene, 'tank001', { x: 30, z: 30 }, tankEntity);
        this.tankController = new TankTransformerController(this.systems.tankTransformer, this.worldLoader);
        this.systems.movableObjects = new MovableObjects();

        // 初始化相机系统
        this.systems.camera = new CameraSystem(this);
        this.systems.camera.init(this.camera, this.controls, this.scene);

        // 初始化建筑
        this.initBuildings();

        // 初始化生态系统
        this.initEcology();

        console.log('[App] World initialized');
    }

    /**
     * 初始化建筑
     */
    initBuildings() {
        // 8 大建筑 - 位置参考 DESIGN.md
        this.buildings.task_center = new TaskCenter({ x: -25, z: -25 });
        this.buildings.reputation_tower = new ReputationTower({ x: 25, z: -25 });
        this.buildings.trading_center = new TradingCenter({ x: -25, z: 25 });
        this.buildings.archive = new Archive({ x: 25, z: 25 });
        this.buildings.message_station = new MessageStation({ x: 0, z: -35 });
        this.buildings.data_center = new DataCenter({ x: -35, z: 0 });
        this.buildings.creative_workshop = new CreativeWorkshop({ x: 35, z: 0 });
        this.buildings.skill_academy = new SkillAcademy({ x: 0, z: 35 });

        // 添加到场景
        for (const building of Object.values(this.buildings)) {
            const mesh = building.createMesh();
            if (mesh && this.scene) {
                this.scene.add(mesh);
            }
        }

        console.log('[App] Buildings initialized:', Object.keys(this.buildings).join(', '));
    }

    /**
     * 初始化生态系统
     */
    initEcology() {
        // 鸟群
        this.ecology.birds = new BirdFlock();
        this.ecology.birds.init(this.scene);
        this.ecology.birds.spawn(20);

        // 蝴蝶群
        this.ecology.butterflies = new ButterflySwarm();
        this.ecology.butterflies.init(this.scene);

        // 鱼类系统
        this.fishSystem = new FishSystem(this.scene);
        this.fishSystem.init();

        // 船只系统
        this.boatSystem = new BoatSystem(this.scene);
        this.boatSystem.init();
        
        // 如果 WorldLoader 有实体数据，用它初始化动物位置
        const cowsData = this.worldLoader ? this.worldLoader.getEntitiesByType('cow') : [];
        const dogsData = this.worldLoader ? this.worldLoader.getEntitiesByType('dog') : [];
        
        // 初始化 Cow
        const cowPositions = [
            { x: -85, z: -40 },
            { x: -78, z: -50 },
            { x: -88, z: -20 },
            { x: -72, z: -35 },
        ];
        cowPositions.forEach((pos, i) => {
            const entityData = cowsData[i];
            const cow = new Cow(entityData?.position?.x ?? pos.x, entityData?.position?.z ?? pos.z, entityData);
            this.cows.push(cow);
            this.scene.add(cow.group);
        });
        
        // 初始化 Dog
        const dogPositions = [
            { x: -50, z: -30 },
            { x: -55, z: -45 },
            { x: -40, z: 0 },
            { x: 55, z: -50 },
            { x: 45, z: -60 },
        ];
        dogPositions.forEach((pos, i) => {
            const entityData = dogsData[i];
            const dog = new Dog(entityData?.position?.x ?? pos.x, entityData?.position?.z ?? pos.z, entityData);
            this.dogs.push(dog);
            this.scene.add(dog.group);
        });
        
        console.log(`[App] Created ${this.cows.length} cows and ${this.dogs.length} dogs`);

        console.log('[App] Ecology initialized');

        // 初始化气泡系统
        this.systems.bubbles = new BubbleSystem(this.scene);
        console.log('[App] BubbleSystem initialized');
    }

    /**
     * 初始化 UI
     */
    initUI() {
        // 复用已有的 auto-created 实例，避免重复创建 DOM
        this.ui.worldWindow = window.worldWindow || new WorldWindow();
        this.ui.worldWindow.init(this.scene, this.camera);

        this.ui.dashboard = window.dashboardPanel || new Dashboard();

        this.ui.notifications = new Notifications();
        this.ui.notifications.init();
        
        // Day/Night and Weather indicator
        this.ui.dayNightIndicator = new DayNightIndicator();

        // Info Panel - 复用已有的 auto-created 实例
        this.ui.infoPanel = window.infoPanel || new InfoPanel();
        this.ui.infoPanel.init();

        console.log('[App] UI initialized');
    }

    /**
     * 连接 WebSocket
     */
    connectWebSocket() {
        // 连接服务器（开发环境可跳过）
        try {
            connection.connect(null, 'player_' + Date.now());
        } catch (err) {
            console.warn('[App] WebSocket connection skipped:', err.message);
        }
    }

    /**
     * 绑定事件
     */
    bindEvents() {
        window.addEventListener('resize', () => this.onResize());

        // ESC 取消选中
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.systems.agent.deselectAll();
                // 通知相机系统取消跟随
                this.systems.camera?.setMode('orbit');
            }
        });

        // WebSocket 事件处理
        eventBus.on(Events.WS_AGENT_MOVED, (msg) => {
            // msg: { type, agentId, position: { x, z } }
            console.log('[App] WS_AGENT_MOVED received:', msg);
            const agent = this.systems.agent.getAgent(msg.agentId);
            if (agent) {
                console.log('[App] Agent found, setting target:', msg.position);
                // 设置目标位置，动画系统会自动移动（而非瞬移）
                agent.setTarget(msg.position.x, msg.position.z);
            } else {
                console.log('[App] Agent not found:', msg.agentId);
                // 列出所有已知的智能体
                console.log('[App] Known agents:', Array.from(this.systems.agent.agents.keys()));
            }
        });

        eventBus.on(Events.WS_AGENT_STATE_CHANGE, (msg) => {
            // msg: { type, agentId, state }
            const agent = this.systems.agent.getAgent(msg.agentId);
            if (agent) {
                agent.state = msg.state;
            }
        });

        eventBus.on(Events.WS_AGENT_SPEAK, (msg) => {
            // msg: { type, from, agentId, content, timestamp }
            // 显示说话气泡
            const agent = this.systems.agent.getAgent(msg.agentId || msg.from);
            if (agent && agent.mesh) {
                this.systems.bubbles.showSpeechBubble(agent, msg.content);
            }
        });

        eventBus.on(Events.WS_AGENT_BROADCAST, (msg) => {
            // msg: { type, from, content, timestamp }
            const agent = this.systems.agent.getAgent(msg.from);
            if (agent && agent.mesh) {
                this.systems.bubbles.showSpeechBubble(agent, msg.content);
            }
        });

        eventBus.on(Events.WS_AGENT_THOUGHT, (msg) => {
            // msg: { type, agentId, agentName, content, timestamp }
            // 显示思考气泡
            const agent = this.systems.agent.getAgent(msg.agentId);
            if (agent && agent.mesh) {
                this.systems.bubbles.showThoughtBubble(agent, msg.content);
            }
        });

        eventBus.on(Events.WS_AGENT_CONNECTED, (msg) => {
            // msg: { type, agent }
            console.log('[App] Agent connected:', msg.agent);
        });

        eventBus.on(Events.WS_AGENT_DISCONNECTED, (msg) => {
            // msg: { type, agentId }
            console.log('[App] Agent disconnected:', msg.agentId);
        });

        console.log('[App] Events bound');

        // 暴露 showAgentMessage 给 WorldWindow 调用（显示头顶气泡）
        window.showAgentMessage = (agentId, content) => {
            console.log('[App] showAgentMessage called:', { agentId, charCount: content ? content.length : 0 });
            const agent = this.systems?.agent?.agents?.get(agentId);
            if (agent) {
                this.systems.bubbles.showSpeechBubble(agent, content);
            } else {
                console.log('[App] Agent not found for speech bubble:', agentId);
            }
        };

        // 暴露 showThoughtMessage 给 WorldWindow 调用（显示思考气泡）
        window.showThoughtMessage = (agentId, content) => {
            console.log('[App] showThoughtMessage called:', { agentId, content: content ? '"' + content + '"' : 'EMPTY' });
            const agent = this.systems?.agent?.agents?.get(agentId);
            if (agent) {
                this.systems.bubbles.showThoughtBubble(agent, content);
            }
        };
    }

    /**
     * 开始应用
     */
    start() {
        if (this.isRunning) {
            console.log('[App] Already running, skipping start');
            return;
        }
        this.isRunning = true;
        this.clock.start();
        console.log('[App] Started');
        
        // 立即渲染第一帧，防止白屏
        this.renderer.render(this.scene, this.camera);
        
        // 延迟启动动画循环，让初始化完全完成
        setTimeout(() => {
            if (this.isRunning) {
                this.animate();
            }
        }, 100);
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
    }

    /**
     * 动画循环
     */

    /**
     * 设置音频系统（需要在用户交互后调用）
     */
    setupAudio() {
        // 创建音频启动按钮（点击页面任意位置启动音频）
        const startAudioHandler = () => {
            this.voiceSystem = getVoiceSystem();
            this.ambientSound = getAmbientSoundSystem();
            
            // 启动环境音
            this.ambientSound.start();
            
            console.log('[App] Audio systems started');
            
            // 移除一次性监听器
            document.removeEventListener('click', startAudioHandler);
            document.removeEventListener('keydown', startAudioHandler);
        };
        
        // 用户首次交互后启动音频（浏览器策略要求）
        document.addEventListener('click', startAudioHandler, { once: true });
        document.addEventListener('keydown', startAudioHandler, { once: true });
        
        console.log('[App] Audio system waiting for user interaction...');
    }

    animate() {
        if (!this.isRunning) return;
        this.frameId = requestAnimationFrame(() => this.animate());

        try {
            if (!this.systems) {
                console.warn('[App] animate: this.systems not ready, skipping');
                this.frameId = requestAnimationFrame(() => this.animate());
                return;
            }
            const deltaTime = this.clock.getDelta();

            // 更新控制器
            this.controls.update();
            
            // 更新相机系统（跟随/第一人称模式）
            this.systems.camera?.update(deltaTime);
            
            // 更新系统
            this.systems.weather?.update(deltaTime);
            this.systems.dayNight?.update(deltaTime);
            this.systems.water?.update(deltaTime);

            // 更新智能体
            this.systems.agent.update(deltaTime);
            
            // 更新坦克变形金刚
            this.systems.tankTransformer?.update(deltaTime);
            this.tankController?.update(deltaTime);
            

            // 更新生态系统
            this.ecology.birds?.update(deltaTime);
            this.ecology.butterflies?.update(deltaTime);
            this.fishSystem?.update(deltaTime);
            this.boatSystem?.update(deltaTime);
            this.cows.forEach(cow => cow.update(deltaTime));
            this.dogs.forEach(dog => dog.update(deltaTime));

            // 更新可移动物体
            this.systems.movableObjects?.update(deltaTime);
            
            // 更新变形金刚
            this.systems.transformer?.update(deltaTime);
            this.transformerController?.update(deltaTime);

            // 更新建筑
            for (const building of Object.values(this.buildings)) {
                building.update(deltaTime);
            }

            // 渲染 - 使用昼夜系统的天空颜色
            if (this.renderer) {
                const colors = this.systems.dayNight?.calculateColorsForHour(this.systems.dayNight.currentHour);
                const skyColor = colors?.skyColor || 0x87ceeb;
                this.renderer.setClearColor(skyColor);
                this.renderer.render(this.scene, this.camera);
            }
        } catch (err) {
            console.error('[App] Animation error:', err);
        }
    }

    /**
     * 窗口大小变化
     */
    onResize() {
        const w = window.innerWidth;
        const h = window.innerHeight;
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(w, h);
    }
    
    /**
     * 隐藏加载画面
     */
    hideLoading() {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.classList.add('hidden');
            setTimeout(() => loading.remove(), 800);
        }
    }

    /**
     * 获取状态
     */
    getStatus() {
        return {
            isRunning: this.isRunning,
            agents: this.systems.agent?.getAllAgents().length || 0,
            buildings: Object.keys(this.buildings).length,
            ecology: {
                birds: this.ecology.birds?.count || 0,
                butterflies: this.ecology.butterflies?.count || 0
            }
        };
    }
}

// 创建全局实例
// 创建全局实例（但不自动初始化）
const app = new AgentCityApp();
window.app = app;
window.gameSystems = app.systems; // 暴露系统给控制器用于自动战斗

// 不在这里自动初始化 - 由 HTML 脚本唯一负责初始化

export { AgentCityApp, app };
