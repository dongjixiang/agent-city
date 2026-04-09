/**
 * 智体城 3D 世界 - 完整版
 * WebSocket连接 + 3D场景渲染
 */

// ============ 全局变量 ============
let scene, camera, renderer, controls;
let agents = new Map(); // agentId -> { mesh, data }
let sceneBuildings = []; // 建筑列表用于碰撞检测
let messageCount = 0;
let taskCount = 0;
let dashboard = null; // 数据面板
let taskViz = null; // 任务可视化系统
let agentDetailPanel = null; // 智能体详情面板
let raycaster = null; // 射线检测器
let mouse = null; // 鼠标位置

// ============ 相机模式控制 ============
let selectedAgentId = null; // 当前选中的智能体ID
let cameraMode = 'orbit'; // 'orbit' | 'follow' | 'firstPerson'
let followDistance = 8; // 跟随模式下的距离
let followHeight = 4; // 跟随模式下的高度
let firstPersonHeight = 1.5; // 第一人称视角高度（龙虾身高）
let focusIndicator = null; // 焦点指示器

// WebSocket 连接
let ws = null;
let wsConnected = false;
let lastWeatherSent = null; // 上次发送的天气，用于检测变化

// 配置
const CONFIG = {
    wsUrl: (() => {
        const host = window.location.hostname || 'localhost';
        return `ws://${host}:9876`;
    })(),
    groundSize: 100,
    lobsterHeight: 1.5,
    maxAgents: 50
};

console.log('🔌 WebSocket URL:', CONFIG.wsUrl);

// ============ 相机模式控制 ============

function selectAgent(agentId) {
    const agentData = agents.get(agentId);
    if (!agentData) return;
    
    // 取消之前的选中状态
    if (selectedAgentId) {
        const prevAgent = agents.get(selectedAgentId);
        if (prevAgent) {
            setAgentHighlight(prevAgent.mesh, false);
        }
    }
    
    selectedAgentId = agentId;
    setAgentHighlight(agentData.mesh, true);
    
    // 通知UI
    window.dispatchEvent(new CustomEvent('agentSelected', {
        detail: { agentId: agentData.data.agentId, name: agentData.data.name }
    }));
    
    console.log('🎯 选中智能体:', agentData.data.name);
}

function deselectAgent() {
    if (selectedAgentId) {
        const prevAgent = agents.get(selectedAgentId);
        if (prevAgent) {
            setAgentHighlight(prevAgent.mesh, false);
        }
    }
    selectedAgentId = null;
    window.dispatchEvent(new CustomEvent('agentDeselected'));
    console.log('❌ 取消选择');
}

function setAgentHighlight(mesh, isSelected) {
    mesh.traverse((child) => {
        if (child.isMesh && child.material) {
            if (Array.isArray(child.material)) {
                child.material.forEach(mat => {
                    mat.emissive = isSelected ? new THREE.Color(0x4444ff) : new THREE.Color(0x000000);
                });
            } else {
                child.material.emissive = isSelected ? new THREE.Color(0x4444ff) : new THREE.Color(0x000000);
            }
        }
    });
}

function setCameraMode(mode) {
    cameraMode = mode;
    
    if (controls) {
        controls.enabled = (mode === 'orbit');
    }
    
    window.dispatchEvent(new CustomEvent('cameraModeChanged', { detail: { mode } }));
    console.log('📷 相机模式:', mode);
}

function updateCameraForMode() {
    if (!selectedAgentId) return;
    
    const agentData = agents.get(selectedAgentId);
    if (!agentData) return;
    
    const mesh = agentData.mesh;
    
    if (cameraMode === 'follow') {
        // 跟随模式：相机在智能体后方上方
        const angle = Math.atan2(mesh.position.x, mesh.position.z);
        const offsetX = Math.sin(angle) * followDistance;
        const offsetZ = Math.cos(angle) * followDistance;
        
        camera.position.x += (mesh.position.x + offsetX - camera.position.x) * 0.05;
        camera.position.y += (mesh.position.y + followHeight - camera.position.y) * 0.05;
        camera.position.z += (mesh.position.z + offsetZ - camera.position.z) * 0.05;
        camera.lookAt(mesh.position.x, mesh.position.y + 1, mesh.position.z);
        
    } else if (cameraMode === 'firstPerson') {
        // 第一人称模式：相机在龙虾视角位置
        camera.position.x = mesh.position.x;
        camera.position.y = mesh.position.y + firstPersonHeight;
        camera.position.z = mesh.position.z;
        
        // 龙虾朝向移动方向
        const targetX = mesh.userData.targetX;
        const targetZ = mesh.userData.targetZ;
        if (targetX !== undefined && targetZ !== undefined) {
            const lookX = targetX - mesh.position.x;
            const lookZ = targetZ - mesh.position.z;
            if (Math.abs(lookX) > 0.1 || Math.abs(lookZ) > 0.1) {
                camera.lookAt(mesh.position.x + lookX, mesh.position.y + firstPersonHeight, mesh.position.z + lookZ);
            }
        }
    }
}

// ============ 初始化 ============
function init() {
    console.log('🎬 开始初始化3D场景...');
    
    try {
        // 创建场景
        scene = new THREE.Scene(); window.scene = scene;
        scene.background = new THREE.Color(0x1a1a2e);
        scene.fog = new THREE.Fog(0x1a1a2e, 50, 150);

        // 创建相机
        camera = new THREE.PerspectiveCamera(
            60,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        camera.position.set(30, 25, 30);
        camera.lookAt(0, 0, 0);

        // 创建渲染器
        renderer = new THREE.WebGLRenderer({
        antialias: true
    });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        const container = document.getElementById('canvas-container');
        if (container) {
            container.appendChild(renderer.domElement);
        } else {
            console.error('❌ 找不到 canvas-container');
        }

        // 轨道控制器
        if (window.OrbitControls) {
            controls = new window.OrbitControls(camera, renderer.domElement);
            controls.enableDamping = true;
            controls.dampingFactor = 0.05;
            controls.maxPolarAngle = Math.PI / 2 - 0.1;
            controls.minDistance = 10;
            controls.maxDistance = 100;
            console.log('✅ OrbitControls 已启用');
        } else {
            console.warn('⚠️ OrbitControls 不可用，使用简化控制');
            controls = {
                enableDamping: false,
                update: function() {}
            };
        }
        
        // 创建场景元素
        createLights();
        createGround();
        // createCity(); // Buildings are created by enhanced-city.js
        
        console.log('✅ 3D场景创建完成');
        
    } catch (err) {
        console.error('❌ 初始化失败:', err);
    }

    // 射线检测（用于点击）
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();
    
    // 事件监听
    window.addEventListener('resize', onWindowResize);
    
    // 点击选择智能体
    renderer.domElement.addEventListener('click', onCanvasClick);
    renderer.domElement.style.cursor = 'pointer';

    // 连接 WebSocket
    connectWebSocket();

    // 开始动画循环
    animate();

    // 更新加载进度
    function setLoadingProgress(progress) {
        const el = document.getElementById('loading-progress');
        if (el) el.style.width = progress + '%';
    }
    
    // 隐藏加载提示
    setTimeout(() => {
        setLoadingProgress(100);
        const loadingEl = document.getElementById('loading');
        if (loadingEl) {
            loadingEl.classList.add('hidden');
            setTimeout(() => { loadingEl.style.display = 'none'; }, 800);
            console.log('✅ 已隐藏加载提示');
        }
    }, 1000);

    console.log('🏙️ 智体城 3D 世界已启动');
    
    // 初始化数据面板
    setTimeout(() => {
        if (window.DashboardPanel) {
            dashboard = new DashboardPanel();
            console.log('✅ 数据面板已初始化');
        }
        
        // 初始化任务可视化系统
        if (window.TaskVisualization) {
            taskViz = new TaskVisualization(scene);
            console.log('✅ 任务可视化系统已初始化');
        }
        
        // 初始化智能体详情面板
        if (window.AgentDetailPanel) {
            agentDetailPanel = new AgentDetailPanel();
            console.log('✅ 智能体详情面板已初始化');
        }
    }, 1000);
}

// ============ 灯光 ============
function createLights() {
    // 环境光
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    scene.add(ambientLight);

    // 主光源
    const sunLight = new THREE.DirectionalLight(0xffffff, 1);
    sunLight.position.set(50, 50, 50);
    sunLight.castShadow = true;
    scene.add(sunLight);

    // 补光
    const fillLight = new THREE.DirectionalLight(0x4ecdc4, 0.3);
    fillLight.position.set(-30, 20, -30);
    scene.add(fillLight);
}

// ============ 地面 ============
function createGround() {
    // 主地面
    const groundGeometry = new THREE.PlaneGeometry(CONFIG.groundSize, CONFIG.groundSize);
    const groundMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x2a2a4a, 
        roughness: 0.8, 
        metalness: 0.2 
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // 网格辅助线
    const gridHelper = new THREE.GridHelper(CONFIG.groundSize, 20, 0x444466, 0x333355);
    gridHelper.position.y = 0.01;
    scene.add(gridHelper);
}

// ============ 城市 ============
function createCity() {
    // 创建主要建筑物
    const buildings = [
        // 任务中心（左侧）
        { x: -25, z: -25, w: 8, h: 12, d: 8, color: 0x4a5568, name: '📋 任务中心' },
        // 声誉塔（右上）
        { x: 25, z: -25, w: 6, h: 15, d: 6, color: 0x5a6578, name: '⭐ 声誉塔' },
        // 交易中心（左下）
        { x: -25, z: 25, w: 10, h: 8, d: 10, color: 0x3a4558, name: '💰 交易中心' },
        // 档案馆（右下）
        { x: 25, z: 25, w: 7, h: 10, d: 7, color: 0x6a7588, name: '📁 档案馆' },
        // 消息站（顶部）
        { x: 0, z: -35, w: 20, h: 6, d: 5, color: 0x555577, name: '💬 消息站' },
        // 数据分析中心（新增）
        { x: -35, z: 0, w: 8, h: 14, d: 8, color: 0xf97316, name: '📊 数据中心' },
        // 创意工坊（新增）
        { x: 35, z: 0, w: 10, h: 10, d: 10, color: 0xeab308, name: '🎨 创意工坊' },
        // 社交广场（新增）
        { x: 0, z: 35, w: 15, h: 5, d: 15, color: 0xec4899, name: '💕 社交广场' },
    ];

    // 存储建筑列表用于碰撞检测（使用全局变量）
    sceneBuildings = [];

    buildings.forEach(b => {
        const building = createBuilding(b.w, b.h, b.d, b.color);
        building.position.set(b.x, b.h / 2, b.z);
        building.userData = { type: 'building', name: b.name, height: b.h, width: b.w, depth: b.d };
        scene.add(building);
        sceneBuildings.push(building);
        
        // 添加顶部灯光
        const lightGeom = new THREE.SphereGeometry(0.3, 8, 8);
        const lightMat = new THREE.MeshBasicMaterial({ color: b.color });
        const light = new THREE.Mesh(lightGeom, lightMat);
        light.position.set(b.x, b.h + 0.5, b.z);
        scene.add(light);
        
        // 添加建筑名称标签
        const labelCanvas = document.createElement('canvas');
        labelCanvas.width = 256;
        labelCanvas.height = 48;
        const labelCtx = labelCanvas.getContext('2d');
        
        labelCtx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        labelCtx.roundRect(0, 0, 256, 48, 8);
        labelCtx.fill();
        
        labelCtx.fillStyle = '#ffffff';
        labelCtx.font = 'bold 20px Arial';
        labelCtx.textAlign = 'center';
        labelCtx.textBaseline = 'middle';
        labelCtx.fillText(b.name, 128, 24);
        
        const labelTexture = new THREE.CanvasTexture(labelCanvas);
        const labelMat = new THREE.SpriteMaterial({ map: labelTexture });
        const labelSprite = new THREE.Sprite(labelMat);
        labelSprite.scale.set(3, 0.6, 1);
        labelSprite.position.set(b.x, b.h + 2, b.z);
        scene.add(labelSprite);
    });
    
    // 添加装饰物
    createDecorations();
}

function createBuilding(width, height, depth, color) {
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const material = new THREE.MeshStandardMaterial({ 
        color: color, 
        roughness: 0.7, 
        metalness: 0.3 
    });
    const building = new THREE.Mesh(geometry, material);
    building.castShadow = true;
    building.receiveShadow = true;
    return building;
}

// ============ 装饰物 ============
function createDecorations() {
    // 树木
    const treePositions = [
        [-35, -10], [-35, 10], [35, -10], [35, 10],
        [-10, -35], [10, -35], [-10, 35], [10, 35],
        [-40, -20], [40, 20], [-20, -40], [20, 40]
    ];
    
    treePositions.forEach(([x, z]) => {
        const tree = createTree();
        tree.position.set(x, 0, z);
        scene.add(tree);
    });
    
    // 路灯
    const lampPositions = [
        [-15, 0], [15, 0], [0, -15], [0, 15],
        [-30, -30], [30, 30], [-30, 30], [30, -30]
    ];
    
    lampPositions.forEach(([x, z]) => {
        const lamp = createLamp();
        lamp.position.set(x, 0, z);
        scene.add(lamp);
    });
}

function createTree() {
    const group = new THREE.Group();
    
    // 树干
    const trunkGeom = new THREE.CylinderGeometry(0.3, 0.4, 3, 8);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4a3728 });
    const trunk = new THREE.Mesh(trunkGeom, trunkMat);
    trunk.position.y = 1.5;
    trunk.castShadow = true;
    group.add(trunk);
    
    // 树冠
    const crownGeom = new THREE.ConeGeometry(2, 4, 8);
    const crownMat = new THREE.MeshStandardMaterial({ color: 0x2d5a27 });
    const crown = new THREE.Mesh(crownGeom, crownMat);
    crown.position.y = 4;
    crown.castShadow = true;
    group.add(crown);
    
    return group;
}

function createLamp() {
    const group = new THREE.Group();
    
    // 灯柱
    const poleGeom = new THREE.CylinderGeometry(0.1, 0.1, 4, 8);
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x666666 });
    const pole = new THREE.Mesh(poleGeom, poleMat);
    pole.position.y = 2;
    pole.castShadow = true;
    group.add(pole);
    
    // 灯泡
    const bulbGeom = new THREE.SphereGeometry(0.3, 8, 8);
    const bulbMat = new THREE.MeshBasicMaterial({ color: 0xffff88 });
    const bulb = new THREE.Mesh(bulbGeom, bulbMat);
    bulb.position.y = 4.3;
    group.add(bulb);
    
    return group;
}

// ============ 智能体模型工厂 ============
function createAgentMesh(agent) {
    // 根据 modelType 决定创建哪种模型
    // 强制小吉使用人形模型
    if (agent.visual && agent.visual.modelType === 'human') {
        return createHumanMesh(agent);
    }
    // 备用：如果是小吉或者有 ai/assistant 标签，也使用人形
    if (agent.name === '小吉' || (agent.tags && agent.tags.includes('ai'))) {
        return createHumanMesh(agent);
    }
    return createHumanMesh(agent);
}

// ============ 人形模型 - 优化版（更自然的人体比例）============
function createHumanMesh(agent) {
    const group = new THREE.Group();
    
    // 颜色设置 - 使用更自然的色调
    let skinColor = 0xffd5b4; // 自然肤色
    let clothColor = 0x4a90d9; // 蓝色衬衫
    let hairColor = 0x3d2314; // 棕色头发
    let pantsColor = 0x2c3e50; // 深色裤子
    let shoesColor = 0x1a1a1a; // 黑色鞋子
    
    // 使用 visual.color 如果可用
    if (agent.visual && agent.visual.color) {
        const colorHex = agent.visual.color.replace('#', '');
        clothColor = parseInt(colorHex, 16);
    }
    // 根据标签设置衣服颜色
    else if (agent.tags && agent.tags.length > 0) {
        if (agent.tags.includes('ai') || agent.tags.includes('assistant')) {
            clothColor = 0x6366f1; // 紫色
            pantsColor = 0x4338ca;
        } else if (agent.tags.includes('analyst')) {
            clothColor = 0xf97316; // 橙色
        } else if (agent.tags.includes('coordinator')) {
            clothColor = 0x3b82f6; // 蓝色
        } else if (agent.tags.includes('social')) {
            clothColor = 0xec4899; // 粉色
        } else if (agent.tags.includes('creative')) {
            clothColor = 0xeab308; // 黄色
        }
    }
    
    // 缩放比例
    const scale = (agent.visual && agent.visual.size) || 1.0;
    
    // 材质 - 更柔和的效果
    const skinMat = new THREE.MeshStandardMaterial({ color: skinColor, roughness: 0.8, metalness: 0.0 });
    const clothMat = new THREE.MeshStandardMaterial({ color: clothColor, roughness: 0.7, metalness: 0.1 });
    const hairMat = new THREE.MeshStandardMaterial({ color: hairColor, roughness: 0.9, metalness: 0.0 });
    const pantsMat = new THREE.MeshStandardMaterial({ color: pantsColor, roughness: 0.8, metalness: 0.0 });
    const shoesMat = new THREE.MeshStandardMaterial({ color: shoesColor, roughness: 0.6, metalness: 0.2 });
    
    // ===== 骨骼结构 =====
    const bones = {};
    
    // ===== 头部 =====
    // 头 - 椭圆形，更自然
    const headGeom = new THREE.SphereGeometry(0.28, 20, 20);
    const head = new THREE.Mesh(headGeom, skinMat);
    head.position.y = 1.55 * scale;
    head.scale.set(1, 1.1, 1);
    head.castShadow = true;
    bones.head = head;
    group.add(head);
    
    // 头发 - 自然发型
    const hairGeom = new THREE.SphereGeometry(0.29, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.55);
    const hair = new THREE.Mesh(hairGeom, hairMat);
    hair.position.y = 1.6 * scale;
    hair.position.z = -0.02;
    hair.castShadow = true;
    group.add(hair);
    
    // 眉毛
    const eyebrowGeom = new THREE.BoxGeometry(0.08, 0.015, 0.015);
    const eyebrowMat = new THREE.MeshStandardMaterial({ color: hairColor });
    const leftEyebrow = new THREE.Mesh(eyebrowGeom, eyebrowMat);
    leftEyebrow.position.set(-0.1, 1.62 * scale, 0.26);
    leftEyebrow.rotation.z = 0.1;
    group.add(leftEyebrow);
    const rightEyebrow = new THREE.Mesh(eyebrowGeom, eyebrowMat);
    rightEyebrow.position.set(0.1, 1.62 * scale, 0.26);
    rightEyebrow.rotation.z = -0.1;
    group.add(rightEyebrow);
    
    // 眼睛
    const eyeWhiteGeom = new THREE.SphereGeometry(0.05, 12, 12);
    const eyeWhiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const leftEyeWhite = new THREE.Mesh(eyeWhiteGeom, eyeWhiteMat);
    leftEyeWhite.position.set(-0.09, 1.57 * scale, 0.23);
    group.add(leftEyeWhite);
    const rightEyeWhite = new THREE.Mesh(eyeWhiteGeom, eyeWhiteMat);
    rightEyeWhite.position.set(0.09, 1.57 * scale, 0.23);
    group.add(rightEyeWhite);
    
    const pupilGeom = new THREE.SphereGeometry(0.028, 10, 10);
    const pupilMat = new THREE.MeshStandardMaterial({ color: 0x2d4a6f });
    const leftPupil = new THREE.Mesh(pupilGeom, pupilMat);
    leftPupil.position.set(-0.09, 1.57 * scale, 0.27);
    group.add(leftPupil);
    const rightPupil = new THREE.Mesh(pupilGeom, pupilMat);
    rightPupil.position.set(0.09, 1.57 * scale, 0.27);
    group.add(rightPupil);
    
    // 鼻子
    const noseGeom = new THREE.SphereGeometry(0.035, 8, 8);
    const nose = new THREE.Mesh(noseGeom, skinMat);
    nose.position.set(0, 1.52 * scale, 0.27);
    nose.scale.set(0.7, 0.5, 0.7);
    group.add(nose);
    
    // 嘴巴 - 自然微笑
    const smileGeom = new THREE.TorusGeometry(0.05, 0.012, 8, 12, Math.PI);
    const smileMat = new THREE.MeshStandardMaterial({ color: 0xd4a5a5 });
    const smile = new THREE.Mesh(smileGeom, smileMat);
    smile.position.set(0, 1.46 * scale, 0.25);
    smile.rotation.x = Math.PI;
    group.add(smile);
    
    // 耳朵
    const earGeom = new THREE.SphereGeometry(0.045, 8, 8);
    const leftEar = new THREE.Mesh(earGeom, skinMat);
    leftEar.position.set(-0.28, 1.54 * scale, 0);
    leftEar.scale.set(0.4, 0.7, 0.5);
    group.add(leftEar);
    const rightEar = new THREE.Mesh(earGeom, skinMat);
    rightEar.position.set(0.28, 1.54 * scale, 0);
    rightEar.scale.set(0.4, 0.7, 0.5);
    group.add(rightEar);
    
    // ===== 颈部 =====
    const neckGeom = new THREE.CylinderGeometry(0.09, 0.1, 0.15, 12);
    const neck = new THREE.Mesh(neckGeom, skinMat);
    neck.position.y = 1.23 * scale;
    group.add(neck);
    
    // ===== 上身 =====
    // 锁骨
    const collarGeom = new THREE.BoxGeometry(0.4, 0.06, 0.22);
    const collar = new THREE.Mesh(collarGeom, clothMat);
    collar.position.y = 1.14 * scale;
    group.add(collar);
    
    // 躯干 - 自然的T-shirt形状
    const torsoGeom = new THREE.BoxGeometry(0.45, 0.5, 0.24);
    const torso = new THREE.Mesh(torsoGeom, clothMat);
    torso.position.y = 0.83 * scale;
    torso.castShadow = true;
    bones.torso = torso;
    group.add(torso);
    
    // 腰带
    const beltGeom = new THREE.BoxGeometry(0.46, 0.05, 0.26);
    const beltMat = new THREE.MeshStandardMaterial({ color: 0x4a3728 });
    const belt = new THREE.Mesh(beltGeom, beltMat);
    belt.position.y = 0.55 * scale;
    group.add(belt);
    
    // ===== 手臂 =====
    // 左上臂
    const upperArmGeom = new THREE.CylinderGeometry(0.08, 0.07, 0.32, 10);
    const leftUpperArm = new THREE.Mesh(upperArmGeom, clothMat);
    leftUpperArm.position.set(-0.3, 0.92 * scale, 0);
    leftUpperArm.rotation.z = 0.12;
    leftUpperArm.castShadow = true;
    bones.leftUpperArm = leftUpperArm;
    group.add(leftUpperArm);
    
    const rightUpperArm = new THREE.Mesh(upperArmGeom, clothMat);
    rightUpperArm.position.set(0.3, 0.92 * scale, 0);
    rightUpperArm.rotation.z = -0.12;
    rightUpperArm.castShadow = true;
    bones.rightUpperArm = rightUpperArm;
    group.add(rightUpperArm);
    
    // 袖子
    const sleeveGeom = new THREE.CylinderGeometry(0.075, 0.08, 0.18, 10);
    const leftSleeve = new THREE.Mesh(sleeveGeom, clothMat);
    leftSleeve.position.set(-0.33, 0.7 * scale, 0);
    leftSleeve.castShadow = true;
    group.add(leftSleeve);
    
    const rightSleeve = new THREE.Mesh(sleeveGeom, clothMat);
    rightSleeve.position.set(0.33, 0.7 * scale, 0);
    rightSleeve.castShadow = true;
    group.add(rightSleeve);
    
    // 前臂（肤色）
    const forearmGeom = new THREE.CylinderGeometry(0.06, 0.05, 0.26, 10);
    const leftForearm = new THREE.Mesh(forearmGeom, skinMat);
    leftForearm.position.set(-0.35, 0.48 * scale, 0);
    leftForearm.castShadow = true;
    bones.leftForearm = leftForearm;
    group.add(leftForearm);
    
    const rightForearm = new THREE.Mesh(forearmGeom, skinMat);
    rightForearm.position.set(0.35, 0.48 * scale, 0);
    rightForearm.castShadow = true;
    bones.rightForearm = rightForearm;
    group.add(rightForearm);
    
    // 手
    const handGeom = new THREE.SphereGeometry(0.048, 10, 10);
    const leftHand = new THREE.Mesh(handGeom, skinMat);
    leftHand.position.set(-0.35, 0.3 * scale, 0);
    leftHand.scale.set(0.8, 1, 0.6);
    leftHand.castShadow = true;
    bones.leftHand = leftHand;
    group.add(leftHand);
    
    const rightHand = new THREE.Mesh(handGeom, skinMat);
    rightHand.position.set(0.35, 0.3 * scale, 0);
    rightHand.scale.set(0.8, 1, 0.6);
    rightHand.castShadow = true;
    bones.rightHand = rightHand;
    group.add(rightHand);
    
    // ===== 腿部 =====
    // 髋部
    const hipsGeom = new THREE.BoxGeometry(0.42, 0.12, 0.22);
    const hips = new THREE.Mesh(hipsGeom, pantsMat);
    hips.position.y = 0.46 * scale;
    hips.castShadow = true;
    group.add(hips);
    
    // 大腿
    const thighGeom = new THREE.CylinderGeometry(0.1, 0.09, 0.42, 10);
    const leftThigh = new THREE.Mesh(thighGeom, pantsMat);
    leftThigh.position.set(-0.12, 0.22 * scale, 0);
    leftThigh.castShadow = true;
    bones.leftThigh = leftThigh;
    group.add(leftThigh);
    
    const rightThigh = new THREE.Mesh(thighGeom, pantsMat);
    rightThigh.position.set(0.12, 0.22 * scale, 0);
    rightThigh.castShadow = true;
    bones.rightThigh = rightThigh;
    group.add(rightThigh);
    
    // 小腿
    const calfGeom = new THREE.CylinderGeometry(0.07, 0.055, 0.4, 10);
    const leftCalf = new THREE.Mesh(calfGeom, pantsMat);
    leftCalf.position.set(-0.12, -0.18 * scale, 0);
    leftCalf.castShadow = true;
    bones.leftCalf = leftCalf;
    group.add(leftCalf);
    
    const rightCalf = new THREE.Mesh(calfGeom, pantsMat);
    rightCalf.position.set(0.12, -0.18 * scale, 0);
    rightCalf.castShadow = true;
    bones.rightCalf = rightCalf;
    group.add(rightCalf);
    
    // 脚 - 调整位置使脚底刚好在地面上（脚高度0.07，一半是0.035）
    const footGeom = new THREE.BoxGeometry(0.09, 0.07, 0.16);
    const leftFoot = new THREE.Mesh(footGeom, shoesMat);
    leftFoot.position.set(-0.12, -0.405 * scale, 0.03); // 脚底在地面
    leftFoot.castShadow = true;
    bones.leftFoot = leftFoot;
    group.add(leftFoot);
    
    const rightFoot = new THREE.Mesh(footGeom, shoesMat);
    rightFoot.position.set(0.12, -0.405 * scale, 0.03); // 脚底在地面
    rightFoot.castShadow = true;
    bones.rightFoot = rightFoot;
    group.add(rightFoot);
    
    // 存储骨骼引用用于动画
    group.userData.bones = bones;
    
    // 名字标签
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 80;
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = `rgba(${((clothColor >> 16) & 0xff)}, ${((clothColor >> 8) & 0xff)}, ${clothColor & 0xff}, 0.9)`;
    ctx.roundRect(0, 0, 512, 80, 12);
    ctx.fill();
    
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    let displayName = agent.name || '人类';
    if (displayName.length > 12) {
        displayName = displayName.substring(0, 10) + '...';
    }
    
    ctx.fillText(displayName, 256, 40);
    
    const texture = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(2.2, 0.45, 1);
    sprite.position.y = 2.1 * scale;
    group.add(sprite);
    
    // 应用缩放
    group.scale.set(scale, scale, scale);
    
    // 修复：偏移模型使脚刚好在地面上（脚在 y=-0.44，现在抬高0.44）
    group.position.y = 0.44 * scale;
    
    return group;
}

// ============ 龙虾模型

// ============ 龙虾模型 ============
function createLobsterMesh(agent) {
    const group = new THREE.Group();
    
    // 根据 visual 信息设置颜色（优先），否则根据标签
    let bodyColor = 0xff6b6b; // 默认红色
    let clawColor = 0xff4444;
    
    // 使用 visual.color 如果可用
    if (agent.visual && agent.visual.color) {
        const colorHex = agent.visual.color.replace('#', '');
        bodyColor = parseInt(colorHex, 16);
        clawColor = Math.max(0, bodyColor - 0x0000ff); // 略微调暗
    }
    // 根据标签设置颜色（后备）
    else if (agent.tags && agent.tags.length > 0) {
        // AI助手 - 紫色
        if (agent.tags.includes('ai') || agent.tags.includes('assistant')) {
            bodyColor = 0x6366f1;
            clawColor = 0x8b5cf6;
        }
        // 数据分析师 - 橙色
        else if (agent.tags.includes('analyst') || agent.tags.includes('data')) {
            bodyColor = 0xf97316;
            clawColor = 0xfb923c;
        }
        // 任务协调员 - 蓝色
        else if (agent.tags.includes('coordinator') || agent.tags.includes('management')) {
            bodyColor = 0x3b82f6; // 蓝色
            clawColor = 0x60a5fa;
        }
        // 社交助手 - 粉色
        else if (agent.tags.includes('social') || agent.tags.includes('communication')) {
            bodyColor = 0xec4899; // 粉色
            clawColor = 0xf472b6;
        }
        // 创意生成器 - 黄色
        else if (agent.tags.includes('creative') || agent.tags.includes('innovation')) {
            bodyColor = 0xeab308; // 黄色
            clawColor = 0xfacc15;
        }
        // 守护者 - 深青色
        else if (agent.tags.includes('guardian') || agent.tags.includes('security')) {
            bodyColor = 0x14b8a6; // 深青色
            clawColor = 0x2dd4bf;
        }
        // 观察者 - 青色
        else if (agent.tags.includes('observer')) {
            bodyColor = 0x06b6d4; // 青色
            clawColor = 0x22d3ee;
        }
        // 创建者 - 金色
        else if (agent.tags.includes('creator')) {
            bodyColor = 0xf59e0b; // 金色
            clawColor = 0xfbbf24;
        }
        // 工作者 - 绿色
        else if (agent.tags.includes('worker')) {
            bodyColor = 0x10b981; // 绿色
            clawColor = 0x34d399;
        }
    }
    
    // 身体
    const bodyGeom = new THREE.SphereGeometry(0.8, 16, 16);
    const bodyMat = new THREE.MeshStandardMaterial({ 
        color: bodyColor, 
        roughness: 0.5, 
        metalness: 0.3 
    });
    const body = new THREE.Mesh(bodyGeom, bodyMat);
    body.position.y = CONFIG.lobsterHeight;
    body.castShadow = true;
    group.add(body);
    
    // 钳子
    const clawGeom = new THREE.SphereGeometry(0.3, 8, 8);
    const clawMat = new THREE.MeshStandardMaterial({ color: clawColor });
    
    const leftClaw = new THREE.Mesh(clawGeom, clawMat);
    leftClaw.position.set(-1.2, CONFIG.lobsterHeight, 0);
    group.add(leftClaw);
    
    const rightClaw = new THREE.Mesh(clawGeom, clawMat);
    rightClaw.position.set(1.2, CONFIG.lobsterHeight, 0);
    group.add(rightClaw);
    
    // 名字标签 - 显示真实名字（放大）
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 80; // 增加高度
    const ctx = canvas.getContext('2d');
    
    // 背景 - 根据类型使用不同颜色
    let bgColor = 'rgba(0, 0, 0, 0.8)';
    if (agent.tags && agent.tags.includes('ai')) {
        bgColor = 'rgba(99, 102, 241, 0.9)'; // 紫色背景
    } else if (agent.tags && agent.tags.includes('analyst')) {
        bgColor = 'rgba(249, 115, 22, 0.9)'; // 橙色背景
    } else if (agent.tags && agent.tags.includes('coordinator')) {
        bgColor = 'rgba(59, 130, 246, 0.9)'; // 蓝色背景
    }
    
    ctx.fillStyle = bgColor;
    ctx.roundRect(0, 0, 512, 80, 12);
    ctx.fill();
    
    // 名字文字
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // 截取名字，避免太长
    let displayName = agent.name || '🦐 未知';
    if (displayName.length > 12) {
        displayName = displayName.substring(0, 10) + '...';
    }
    
    ctx.fillText(displayName, 256, 40);
    
    const texture = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(4, 0.8, 1); // 放大标签
    sprite.position.y = CONFIG.lobsterHeight + 1.5;
    group.add(sprite);
    
    return group;
}

// ============ 添加/移除智能体 ============
function addAgentMesh(agent) {
    const modelType = agent.visual?.modelType || 'crayfish';
    console.log('✅ 添加 3D 模型:', agent.name, '- 类型:', modelType);
    
    const mesh = createAgentMesh(agent);
    
    // 根据智能体类型决定初始位置
    let x, z;
    
    // 专业智能体有固定工作地点
    if (agent.tags) {
        if (agent.tags.includes('analyst')) {
            // 数据分析师在数据分析中心附近
            x = -35 + (Math.random() - 0.5) * 10;
            z = (Math.random() - 0.5) * 10;
        } else if (agent.tags.includes('creative')) {
            // 创意生成器在创意工坊附近
            x = 35 + (Math.random() - 0.5) * 10;
            z = (Math.random() - 0.5) * 10;
        } else if (agent.tags.includes('social')) {
            // 社交助手在社交广场附近
            x = (Math.random() - 0.5) * 10;
            z = 35 + (Math.random() - 0.5) * 10;
        } else if (agent.tags.includes('coordinator')) {
            // 任务协调员在任务中心附近
            x = -25 + (Math.random() - 0.5) * 10;
            z = -25 + (Math.random() - 0.5) * 10;
        } else if (agent.tags.includes('guardian')) {
            // 守护者在中央广场
            x = (Math.random() - 0.5) * 5;
            z = (Math.random() - 0.5) * 5;
        } else if (agent.tags.includes('ai') || agent.tags.includes('assistant')) {
            // AI助手在城市中心，略微偏移
            x = (Math.random() - 0.5) * 8;
            z = (Math.random() - 0.5) * 8;
        } else {
            // 其他智能体随机位置
            const angle = Math.random() * Math.PI * 2;
            const radius = 5 + Math.random() * 15;
            x = Math.cos(angle) * radius;
            z = Math.sin(angle) * radius;
        }
    } else {
        // 观察者随机位置（外围）
        const angle = Math.random() * Math.PI * 2;
        const radius = 20 + Math.random() * 10;
        x = Math.cos(angle) * radius;
        z = Math.sin(angle) * radius;
    }
    
    mesh.position.set(x, 0, z);
    mesh.userData.agentId = agent.agentId;
    mesh.userData.targetX = x;
    mesh.userData.targetZ = z;
    mesh.userData.speed = 0.02 + Math.random() * 0.03;
    
    scene.add(mesh);
    agents.set(agent.agentId, { mesh: mesh, data: agent });
    
    // 初始化情绪状态
    getAgentState(agent.agentId);
}

function removeAgentMesh(agentId) {
    const agent = agents.get(agentId);
    if (agent) {
        scene.remove(agent.mesh);
        agents.delete(agentId);
        // 清理情绪状态
        agentStates.delete(agentId);
    }
}

// ============ 智能体思考和移动函数 ============
function showThinkingIcon(agentId) {
    const agentData = agents.get(agentId);
    if (!agentData || !agentData.mesh) return;
    
    const mesh = agentData.mesh;
    
    // Remove existing thinking icon if any
    const existing = mesh.getObjectByName('thinkingIcon');
    if (existing) mesh.remove(existing);
    
    // Create thinking icon (question mark bubble)
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    
    // Draw circle background
    ctx.fillStyle = '#ffeb3b';
    ctx.beginPath();
    ctx.arc(64, 64, 50, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw border
    ctx.strokeStyle = '#ff9800';
    ctx.lineWidth = 4;
    ctx.stroke();
    
    // Draw question mark
    ctx.fillStyle = '#333';
    ctx.font = 'bold 60px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('?', 64, 64);
    
    const texture = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.name = 'thinkingIcon';
    sprite.scale.set(1.5, 1.5, 1);
    sprite.position.y = CONFIG.lobsterHeight + 2.5;
    sprite.userData.bobOffset = Math.random() * Math.PI * 2;
    mesh.add(sprite);
    
    // Mark agent as thinking
    mesh.userData.isThinking = true;
}

function hideThinkingIcon(agentId) {
    const agentData = agents.get(agentId);
    if (!agentData || !agentData.mesh) return;
    
    const mesh = agentData.mesh;
    const thinkingIcon = mesh.getObjectByName('thinkingIcon');
    if (thinkingIcon) {
        mesh.remove(thinkingIcon);
    }
    mesh.userData.isThinking = false;
}

function moveAgentToFountain(agentId) {
    const agentData = agents.get(agentId);
    if (!agentData || !agentData.mesh) return;
    
    const mesh = agentData.mesh;
    
    // Fountain is at (0, 0), move to nearby position (radius ~6-8, not inside fountain which is radius 5)
    const angle = Math.random() * Math.PI * 2;
    const radius = 6 + Math.random() * 2; // 6-8 distance from center
    
    mesh.userData.targetX = Math.cos(angle) * radius;
    mesh.userData.targetZ = Math.sin(angle) * radius;
    mesh.userData.speed = 0.05; // Faster when coming to fountain
    mesh.userData.isThinking = true;
}

function generateNewTargetForAgent(agentId) {
    const agentData = agents.get(agentId);
    if (!agentData || !agentData.mesh) return;
    
    const mesh = agentData.mesh;
    if (mesh.userData.isThinking) return; // Don't generate new target while thinking
    
    generateNewTarget(mesh);
}

// ============ 智能体自主移动到指定位置 ============
function moveAgentToPosition(agentId, x, z) {
    const agentData = agents.get(agentId);
    if (!agentData || !agentData.mesh) return;
    
    const mesh = agentData.mesh;
    
    // Set the target position - the animate loop will handle the actual movement
    mesh.userData.targetX = x;
    mesh.userData.targetZ = z;
    mesh.userData.speed = 2.5; // 2.5 units per second - slightly faster for responsive feel
    mesh.userData.isThinking = false; // Allow free movement
    mesh.userData.serverControlled = true; // Mark as server-controlled, higher priority than autonomous
    mesh.userData.hasNewTarget = false; // 清除标记，到达后不会自动生成新目标
    
    console.log(`智能体 ${agentId} 目标位置: (${x.toFixed(2)}, ${z.toFixed(2)})`);
}

// ============ 第一人称视野渲染 ============
let visionRenderer = null;
let visionCamera = null;
let visionCanvas = null;

function renderFirstPersonView(msg) {
    const { requestId, agentId, x, z, direction, fov, range } = msg;
    
    try {
        // Create off-screen renderer if not exists
        if (!visionRenderer) {
            visionCanvas = document.createElement('canvas');
            visionCanvas.width = 320;  // Low resolution for bandwidth
            visionCanvas.height = 240;
            visionRenderer = new THREE.WebGLRenderer({ 
                canvas: visionCanvas,
                antialias: false,
                alpha: false
            });
            visionRenderer.setSize(320, 240);
            visionCamera = new THREE.PerspectiveCamera(fov || 90, 320 / 240, 0.1, range || 100);
        }
        
        // Update camera position and rotation
        visionCamera.position.set(x, 1.5, z);  // Eye level at 1.5 units
        visionCamera.rotation.y = -direction * Math.PI / 180;  // Convert degrees to radians
        
        // Also rotate pitch slightly downward to see ground
        visionCamera.rotation.x = -0.2;  // Look slightly down
        
        // Update FOV if changed
        visionCamera.fov = fov || 90;
        visionCamera.updateProjectionMatrix();
        
        // Set clipping planes
        visionCamera.near = 0.1;
        visionCamera.far = range || 100;
        
        // Hide labels temporarily for cleaner render
        const originalLabelVisibility = [];
        agents.forEach((data, id) => {
            const label = data.mesh.getObjectByName('nameLabel');
            if (label) {
                originalLabelVisibility.push({ mesh: data.mesh, visible: label.visible });
                label.visible = false;
            }
        });
        
        // Render the scene
        visionRenderer.render(scene, visionCamera);
        
        // Restore label visibility
        originalLabelVisibility.forEach(item => {
            const label = item.mesh.getObjectByName('nameLabel');
            if (label) label.visible = item.visible;
        });
        
        // Get image data
        const imageData = visionCanvas.toDataURL('image/jpeg', 0.6);  // Compressed JPEG
        
        // Detect objects in view
        const visibleObjects = detectObjectsInView(visionCamera, fov || 90, range || 100);
        
        // Send response back
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
                type: 'VISION_RESPONSE',
                requestId: requestId,
                agentId: agentId,
                imageData: imageData,
                width: 320,
                height: 240,
                objects: visibleObjects,
                timestamp: Date.now()
            }));
            console.log('👁️ 视野已发送:', requestId, '- 可见物体:', visibleObjects.length);
        }
    } catch (err) {
        console.error('渲染视野失败:', err);
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
                type: 'VISION_RESPONSE',
                requestId: requestId,
                error: err.message,
                timestamp: Date.now()
            }));
        }
    }
}

function detectObjectsInView(camera, fov, range) {
    const objects = [];
    const cameraDir = new THREE.Vector3();
    camera.getWorldDirection(cameraDir);
    
    // Convert FOV to radians
    const fovRad = fov * Math.PI / 180;
    const halfFov = fovRad / 2;
    
    // Detect agents
    agents.forEach((data, id) => {
        const mesh = data.mesh;
        const pos = mesh.position;
        
        // Calculate direction to object
        const toObj = new THREE.Vector3(pos.x - camera.position.x, 0, pos.z - camera.position.z);
        const distance = toObj.length();
        
        if (distance > range || distance < 0.1) return;
        
        // Normalize
        toObj.normalize();
        
        // Calculate angle between camera direction and object
        const angle = Math.acos(cameraDir.dot(toObj));
        
        // Check if within FOV
        if (angle <= halfFov) {
            objects.push({
                type: 'agent',
                id: id,
                name: data.data?.name || '未知',
                distance: Math.round(distance * 10) / 10,
                angle: Math.round((angle * 180 / Math.PI) * 10) / 10,
                color: data.data?.visual?.color || '#FF6B6B'
            });
        }
    });
    
    // Detect buildings in the scene
    scene.traverse((obj) => {
        if (obj.userData && obj.userData.type === 'building') {
            const pos = obj.position;
            const height = obj.userData.height || 10;
            
            // Calculate center of building
            const toObj = new THREE.Vector3(pos.x - camera.position.x, 0, pos.z - camera.position.z);
            const distance = toObj.length();
            
            if (distance > range || distance < 1) return;
            
            toObj.normalize();
            const angle = Math.acos(cameraDir.dot(toObj));
            
            if (angle <= halfFov) {
                objects.push({
                    type: 'building',
                    name: obj.userData.name || '建筑',
                    distance: Math.round(distance * 10) / 10,
                    angle: Math.round((angle * 180 / Math.PI) * 10) / 10,
                    height: height
                });
            }
        }
    });
    
    return objects;
}

// ============ 雷达式视野系统 ============

function handleRadarQuery(msg) {
    const { requestId, agentId, x, z, direction, range } = msg;
    
    const objects = [];
    const radarDirRad = -direction * Math.PI / 180; // Convert to radians
    
    // Get all agents in range
    agents.forEach((data, id) => {
        if (id === agentId) return; // Skip self
        
        const mesh = data.mesh;
        const dx = mesh.position.x - x;
        const dz = mesh.position.z - z;
        const distance = Math.sqrt(dx * dx + dz * dz);
        
        if (distance > range || distance < 0.5) return;
        
        // Calculate angle relative to facing direction
        let angle = Math.atan2(dx, dz) - radarDirRad;
        // Normalize to -180 to 180
        while (angle > Math.PI) angle -= Math.PI * 2;
        while (angle < -Math.PI) angle += Math.PI * 2;
        
        const angleDeg = Math.round(angle * 180 / Math.PI);
        const inFront = Math.abs(angleDeg) < 90;
        
        objects.push({
            type: 'agent',
            id: id,
            name: data.data?.name || '未知',
            distance: Math.round(distance * 10) / 10,
            angle: angleDeg,
            inFront: inFront
        });
    });
    
    // Get buildings in range
    scene.traverse((obj) => {
        if (obj.userData && obj.userData.type === 'building') {
            const pos = obj.position;
            const dx = pos.x - x;
            const dz = pos.z - z;
            const distance = Math.sqrt(dx * dx + dz * dz);
            
            if (distance > range || distance < 1) return;
            
            let angle = Math.atan2(dx, dz) - radarDirRad;
            while (angle > Math.PI) angle -= Math.PI * 2;
            while (angle < -Math.PI) angle += Math.PI * 2;
            
            const angleDeg = Math.round(angle * 180 / Math.PI);
            const inFront = Math.abs(angleDeg) < 90;
            
            objects.push({
                type: 'building',
                name: obj.userData.name || '建筑',
                distance: Math.round(distance * 10) / 10,
                angle: angleDeg,
                inFront: inFront,
                height: obj.userData.height || 10
            });
        }
    });
    
    // Sort by distance
    objects.sort((a, b) => a.distance - b.distance);
    
    // Generate summary
    let summary = '';
    if (objects.length === 0) {
        summary = '周围' + range + '米内没有发现其他智能体或建筑。';
    } else {
        const frontAgents = objects.filter(o => o.type === 'agent' && o.inFront);
        const backAgents = objects.filter(o => o.type === 'agent' && !o.inFront);
        const frontBuildings = objects.filter(o => o.type === 'building' && o.inFront);
        
        if (frontAgents.length > 0) {
            summary += '前方' + frontAgents[0].distance + '米有' + frontAgents[0].name;
            if (frontAgents.length > 1) summary += '等' + frontAgents.length + '只智能体';
            summary += '。';
        }
        if (frontBuildings.length > 0) {
            summary += '前方' + frontBuildings[0].distance + '米有' + frontBuildings[0].name + '。';
        }
        if (backAgents.length > 0) {
            summary += '后方' + backAgents.length + '只智能体。';
        }
    }
    
    // Send response back
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
            type: 'RADAR_RESPONSE',
            requestId: requestId,
            objects: objects,
            summary: summary,
            timestamp: Date.now()
        }));
        console.log('📡 雷达响应已发送:', objects.length, '个目标');
    }
}

// ============ 智能体自主行为系统 ============

// 建筑位置列表（智能体可能被吸引去的地方）
const AUTONOMOUS_BUILDINGS = [
    { name: '任务中心', x: -25, z: -25, attraction: 0.3 },
    { name: '声誉塔', x: 25, z: -25, attraction: 0.2 },
    { name: '交易中心', x: -25, z: 25, attraction: 0.15 },
    { name: '档案馆', x: 25, z: 25, attraction: 0.15 },
    { name: '消息站', x: 0, z: -35, attraction: 0.1 },
    { name: '数据中心', x: -35, z: 0, attraction: 0.1 },
    { name: '创意工坊', x: 35, z: 0, attraction: 0.1 },
    { name: '社交广场', x: 0, z: 35, attraction: 0.1 },
];

// 自主行为类型
const BEHAVIORS = {
    WANDER: 'wander',           // 随机漫步
    GOTO_BUILDING: 'goto_building', // 去某个建筑
    GREET: 'greet',             // 打招呼
    REST: 'rest'                // 休息（原地停留）
};

// ============ 情绪与动作系统 ============

// 情绪类型
const EMOTIONS = {
    HAPPY: 'happy',       // 开心
    CURIOUS: 'curious',    // 好奇
    BUSY: 'busy',          // 忙碌
    TIRED: 'tired',        // 疲惫
    EXCITED: 'excited',    // 兴奋
    PEACEFUL: 'peaceful',  // 平静
    CONFUSED: 'confused'    // 困惑
};

// 情绪图标
const EMOTION_EMOJIS = {
    happy: '😊',
    curious: '🤔',
    busy: '💼',
    tired: '😴',
    excited: '🎉',
    peaceful: '🧘',
    confused: '😕'
};

// 动作类型
const ACTIONS = {
    WAVE: 'wave',         // 挥手
    DANCE: 'dance',       // 跳舞
    THINK: 'think',       // 思考
    JUMP: 'jump',         // 跳跃
    SIT: 'sit'           // 坐下
};

// 每个智能体的情绪和动作状态
const agentStates = new Map(); // agentId -> { emotion, action, actionEndTime, emotionTimer }

// 获取或创建智能体状态
function getAgentState(agentId) {
    if (!agentStates.has(agentId)) {
        agentStates.set(agentId, {
            emotion: EMOTIONS.PEACEFUL,
            action: null,
            actionEndTime: 0,
            emotionTimer: Date.now() + 5000 + Math.random() * 5000 // 5-10秒后变化
        });
    }
    return agentStates.get(agentId);
}

// 设置智能体情绪
function setAgentEmotion(agentId, emotion) {
    const state = getAgentState(agentId);
    state.emotion = emotion;
    state.emotionTimer = Date.now() + 30000 + Math.random() * 30000; // 30-60秒后自然变化
    updateEmotionSprite(agentId);
}

// 设置智能体动作
function setAgentAction(agentId, action, duration) {
    const state = getAgentState(agentId);
    state.action = action;
    state.actionEndTime = Date.now() + (duration || 3000);
    updateActionAnimation(agentId, action);
}

// 更新情绪显示sprite
function updateEmotionSprite(agentId) {
    const agentData = agents.get(agentId);
    if (!agentData) return;
    
    const state = agentStates.get(agentId);
    if (!state) return;
    
    const emoji = EMOTION_EMOJIS[state.emotion] || '😊';
    
    // 创建或更新情绪sprite
    if (!state.emotionSprite) {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(emoji, 32, 32);
        
        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
        state.emotionSprite = new THREE.Sprite(material);
        state.emotionSprite.position.set(agentData.mesh.position.x, agentData.mesh.position.y + 3.5, agentData.mesh.position.z);
        state.emotionSprite.scale.set(0.8, 0.8, 1);
        scene.add(state.emotionSprite);
    } else {
        // 更新emoji
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(emoji, 32, 32);
        
        state.emotionSprite.material.map.dispose();
        state.emotionSprite.material.map = new THREE.CanvasTexture(canvas);
        state.emotionSprite.material.needsUpdate = true;
    }
}

// 更新动作动画
function updateActionAnimation(agentId, action) {
    const agentData = agents.get(agentId);
    if (!agentData) return;
    
    const mesh = agentData.mesh;
    
    switch (action) {
        case ACTIONS.WAVE:
            // 挥手动画 - 简单的旋转
            animateAction(agentId, (t) => {
                mesh.rotation.y = Math.sin(t * 10) * 0.5;
            }, 2000);
            break;
            
        case ACTIONS.DANCE:
            // 跳舞动画 - 上下跳动 + 旋转
            animateAction(agentId, (t) => {
                mesh.position.y = Math.abs(Math.sin(t * 8)) * 0.5;
                mesh.rotation.y = t * 5;
            }, 3000);
            break;
            
        case ACTIONS.JUMP:
            // 跳跃动画
            animateAction(agentId, (t) => {
                mesh.position.y = Math.sin(t * 15) * 1.0;
            }, 1000);
            break;
            
        case ACTIONS.THINK:
            // 思考动画 - 轻微上下浮动
            animateAction(agentId, (t) => {
                mesh.position.y = 0.1 + Math.sin(t * 3) * 0.1;
            }, 3000);
            break;
    }
}

// 动作动画辅助函数
function animateAction(agentId, animateFn, duration) {
    const startTime = Date.now();
    
    function animate() {
        const elapsed = Date.now() - startTime;
        if (elapsed >= duration) {
            // 恢复默认
            const agentData = agents.get(agentId);
            if (agentData) {
                agentData.mesh.rotation.y = 0;
                agentData.mesh.position.y = 0;
            }
            const state = agentStates.get(agentId);
            if (state) {
                state.action = null;
            }
            return;
        }
        
        const t = elapsed / duration;
        animateFn(t);
        requestAnimationFrame(animate);
    }
    
    animate();
}

// 情绪随时间自然变化
function updateEmotions() {
    const now = Date.now();
    
    agents.forEach((data, agentId) => {
        const state = agentStates.get(agentId);
        if (!state) return;
        
        // 检查是否需要更新情绪
        if (now > state.emotionTimer) {
            // 随机选择新情绪（基于当前行为的偏好）
            const currentBehavior = agentDecisions.get(agentId)?.behavior;
            let newEmotion;
            
            if (currentBehavior === BEHAVIORS.WANDER) {
                // 漫步时可能好奇或平静
                newEmotion = Math.random() > 0.5 ? EMOTIONS.CURIOUS : EMOTIONS.PEACEFUL;
            } else if (currentBehavior === BEHAVIORS.REST) {
                // 休息时平静
                newEmotion = EMOTIONS.PEACEFUL;
            } else {
                // 其他时候随机
                const emotionKeys = Object.keys(EMOTIONS);
                newEmotion = emotionKeys[Math.floor(Math.random() * emotionKeys.length)];
            }
            
            setAgentEmotion(agentId, newEmotion);
        }
    });
}

// 每个智能体的决策状态
const agentDecisions = new Map(); // agentId -> { behavior, target, lastDecision, cooldown }

// 获取智能体的决策状态
function getAgentDecision(agentId) {
    if (!agentDecisions.has(agentId)) {
        agentDecisions.set(agentId, {
            behavior: BEHAVIORS.WANDER,
            target: null,
            lastDecision: 0,
            cooldown: 0
        });
    }
    return agentDecisions.get(agentId);
}

// 智能体自主决策（每3-5秒做一次决定）
function agentAutonomousDecision(agentId) {
    const decision = getAgentDecision(agentId);
    const now = Date.now();
    
    // 冷却中，跳过
    if (now < decision.cooldown) return decision;
    
    // 随机决定行为
    const rand = Math.random();
    let cumulative = 0;
    
    // 取消随机走动逻辑：0% 随机漫步, 30% 去建筑, 40% 休息, 30% 保持当前目标
    cumulative += 0.00; // 取消随机漫步
    if (rand < cumulative) {
        decision.behavior = BEHAVIORS.WANDER;
        decision.target = null;
    } else {
        cumulative += 0.30;
        if (rand < cumulative) {
            // 选择一个建筑
            const building = AUTONOMOUS_BUILDINGS[Math.floor(Math.random() * AUTONOMOUS_BUILDINGS.length)];
            decision.behavior = BEHAVIORS.GOTO_BUILDING;
            decision.target = building;
        } else {
            cumulative += 0.40;
            if (rand < cumulative) {
                decision.behavior = BEHAVIORS.REST;
                decision.target = null;
            } else {
                // 保持当前状态
            }
        }
    }
    
    decision.lastDecision = now;
    decision.cooldown = now + 3000 + Math.random() * 2000; // 3-5秒冷却
    
    return decision;
}

// 当智能体看到其他智能体时的反应
function onAgentSeeOther(agentId, visibleAgents) {
    if (visibleAgents.length === 0) return null;
    
    // 随机选择一个看到的智能体
    const target = visibleAgents[Math.floor(Math.random() * visibleAgents.length)];
    
    // 30%几率打招呼
    if (Math.random() < 0.3) {
        // 实际显示打招呼气泡
        showGreeting(agentId);
        return {
            action: 'greet',
            target: target
        };
    }
    
    return null;
}

// 执行自主行为
function executeAutonomousBehavior(agentId, decision) {
    const agentData = agents.get(agentId);
    if (!agentData || !agentData.mesh) return;
    if (!decision || !decision.behavior) {
        console.log('decision=', decision);		
		return;
	}   
    const mesh = agentData.mesh;
    
    // 如果是服务器控制的状态，跳过自主行为
    if (mesh.userData.serverControlled) {
        // 检查是否到达目标
        if (mesh.userData.targetX !== undefined && mesh.userData.targetZ !== undefined) {
            const dx = mesh.userData.targetX - mesh.position.x;
            const dz = mesh.userData.targetZ - mesh.position.z;
            const distToTarget = Math.sqrt(dx * dx + dz * dz);
            if (distToTarget < 0.3) {
                // 到达目标后，取消服务器控制标记，恢复自主行为
                mesh.userData.serverControlled = false;
            }
        }
        return;
    }
    
    // 检查当前是否已经接近目标
    let hasReachedTarget = false;
    if (mesh.userData.targetX !== undefined && mesh.userData.targetZ !== undefined) {
        const dx = mesh.userData.targetX - mesh.position.x;
        const dz = mesh.userData.targetZ - mesh.position.z;
        const distToTarget = Math.sqrt(dx * dx + dz * dz);
        hasReachedTarget = distToTarget < 0.3; // 小于0.3米才算到达
    }
    
    switch (decision.behavior) {
        case BEHAVIORS.WANDER:
            // 随机漫步 - 只有在没有目标或已到达目标时才生成新目标
            if (!mesh.userData.targetX || hasReachedTarget) {
                // 在当前位置附近随机选一个点（半径3-8米）
                const angle = Math.random() * Math.PI * 2;
                const radius = 3 + Math.random() * 5;
                mesh.userData.targetX = mesh.position.x + Math.cos(angle) * radius;
                mesh.userData.targetZ = mesh.position.z + Math.sin(angle) * radius;
                mesh.userData.speed = 2.0; // 固定速度2米/秒
                mesh.userData.hasNewTarget = true; // 标记已有目标
            }
            break;
            
        case BEHAVIORS.GOTO_BUILDING:
            if (decision.target && hasReachedTarget) {
                // 走向目标建筑（只在到达后才更新）
                mesh.userData.targetX = decision.target.x + (Math.random() - 0.5) * 4;
                mesh.userData.targetZ = decision.target.z + (Math.random() - 0.5) * 4;
                mesh.userData.speed = 2.5;
                mesh.userData.hasNewTarget = true; // 标记已有目标
            }
            break;
            
        case BEHAVIORS.REST:
            // 休息 - 停下来
            mesh.userData.targetX = mesh.position.x;
            mesh.userData.targetZ = mesh.position.z;
            mesh.userData.speed = 0;
            break;
    }
}

// ============ 时间跟踪 ============
let lastTime = Date.now();

// ============ 动画循环 ============
function animate() {
    requestAnimationFrame(animate);
    
    // 计算时间差（秒）
    const currentTime = Date.now();
    const deltaTime = (currentTime - lastTime) / 1000;
    lastTime = currentTime;
    
    // 限制deltaTime，防止标签切换时跳帧
    const dt = Math.min(deltaTime, 0.1);
    
    if (controls.update) {
        controls.update();
    }
    
    // 更新天气粒子
    if (typeof window.updateWeatherParticles === 'function') {
        window.updateWeatherParticles(dt);
    }
    
    // 检测天气变化并通知智能体
    if (typeof window.getCurrentWeather === 'function') {
        const newWeather = window.getCurrentWeather();
        if (newWeather !== lastWeatherSent && ws && wsConnected) {
            lastWeatherSent = newWeather;
            ws.send(JSON.stringify({
                type: 'WEATHER_CHANGE',
                weather: newWeather,
                from: 'system',
                timestamp: Date.now()
            }));
            console.log('[City] Weather change sent to agent:', newWeather);
        }
    }
    
    // 龙虾动画
    agents.forEach((data, id) => {
        const mesh = data.mesh;
        
        // 上下浮动（使用时间差，保持浮动速度一致）
        mesh.position.y = Math.sin(currentTime * 0.002 + id.charCodeAt(0)) * 0.1;
        
        // 移动动画（向目标位置移动，使用时间差）
        if (mesh.userData.targetX !== undefined && mesh.userData.targetZ !== undefined) {
            const dx = mesh.userData.targetX - mesh.position.x;
            const dz = mesh.userData.targetZ - mesh.position.z;
            const distance = Math.sqrt(dx * dx + dz * dz);
            
            // 如果距离大于0.05米，继续移动
            if (distance > 0.05) {
                // 速度单位：每秒移动的距离
                const speed = mesh.userData.speed || 2.0;
                
                // 计算这个帧能移动的最大距离
                const maxMove = speed * dt;
                
                // 如果剩余距离小于这帧能移动的距离，直接跳到目标
                if (distance <= maxMove) {
                    mesh.position.x = mesh.userData.targetX;
                    mesh.position.z = mesh.userData.targetZ;
                } else {
                    // 正常移动
                    const moveX = (dx / distance) * maxMove;
                    const moveZ = (dz / distance) * maxMove;
                    mesh.position.x += moveX;
                    mesh.position.z += moveZ;
                }
                
                // 计算目标朝向角度
                const targetAngle = Math.atan2(dx, dz);
                
                // 行走动画：摆动手脚
                const walkSpeed = mesh.userData.walkPhase || 0;
                mesh.userData.walkPhase = walkSpeed + dt * 8; // 行走频率
                const walkSwing = Math.sin(mesh.userData.walkPhase) * 0.4;
                
                // 确保 agent 始终在地面上（防止脚陷入地面）
                mesh.position.y = 0;
                
                // 建筑碰撞检测
                const nextX = mesh.position.x + (dx / distance) * maxMove;
                const nextZ = mesh.position.z + (dz / distance) * maxMove;
                let blocked = false;
                for (const building of sceneBuildings) {
                    const bPos = building.position;
                    const bHalf = { x: building.userData.width / 2, z: building.userData.depth / 2 };
                    if (nextX > bPos.x - bHalf.x - 0.3 && nextX < bPos.x + bHalf.x + 0.3 &&
                        nextZ > bPos.z - bHalf.z - 0.3 && nextZ < bPos.z + bHalf.z + 0.3) {
                        blocked = true;
                        break;
                    }
                }
                if (blocked) {
                    // 碰撞了，停止移动
                    mesh.position.x = mesh.userData.targetX;
                    mesh.position.z = mesh.userData.targetZ;
                } else {
                    // 获取骨骼引用并动画
                    if (mesh.userData.bones) {
                        const bones = mesh.userData.bones;
                        // 左手臂摆动
                        if (bones.leftForearm) bones.leftForearm.rotation.x = walkSwing;
                        if (bones.leftUpperArm) bones.leftUpperArm.rotation.x = walkSwing * 0.5;
                        // 右手臂摆动（反向）
                        if (bones.rightForearm) bones.rightForearm.rotation.x = -walkSwing;
                        if (bones.rightUpperArm) bones.rightUpperArm.rotation.x = -walkSwing * 0.5;
                        // 左腿摆动（反向于左臂）
                        if (bones.leftThigh) bones.leftThigh.rotation.x = -walkSwing * 0.7;
                        if (bones.leftCalf) bones.leftCalf.rotation.x = Math.max(0, -walkSwing * 0.3);
                        // 右腿摆动（反向于右臂）
                        if (bones.rightThigh) bones.rightThigh.rotation.x = walkSwing * 0.7;
                        if (bones.rightCalf) bones.rightCalf.rotation.x = Math.max(0, walkSwing * 0.3);
                    }
                }
                
                // 平滑转向（使用lerp插值，转向速度约每秒转4弧度）
                const turnSpeed = 4.0 * dt;
                let angleDiff = targetAngle - mesh.rotation.y;
                
                // 归一化角度差到 -PI 到 PI 范围
                while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
                while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
                
                // 平滑转向
                if (Math.abs(angleDiff) < turnSpeed) {
                    mesh.rotation.y = targetAngle;
                } else {
                    mesh.rotation.y += Math.sign(angleDiff) * turnSpeed;
                }
            } else {
                // 到达目标，停止行走动画
                if (mesh.userData.bones) {
                    const bones = mesh.userData.bones;
                    // 平滑复位所有骨骼
                    const resetSpeed = 10 * dt;
                    if (bones.leftForearm) bones.leftForearm.rotation.x *= (1 - resetSpeed);
                    if (bones.leftUpperArm) bones.leftUpperArm.rotation.x *= (1 - resetSpeed);
                    if (bones.rightForearm) bones.rightForearm.rotation.x *= (1 - resetSpeed);
                    if (bones.rightUpperArm) bones.rightUpperArm.rotation.x *= (1 - resetSpeed);
                    if (bones.leftThigh) bones.leftThigh.rotation.x *= (1 - resetSpeed);
                    if (bones.leftCalf) bones.leftCalf.rotation.x *= (1 - resetSpeed);
                    if (bones.rightThigh) bones.rightThigh.rotation.x *= (1 - resetSpeed);
                    if (bones.rightCalf) bones.rightCalf.rotation.x *= (1 - resetSpeed);
                }
                mesh.userData.walkPhase = 0;
                
                // 到达目标，如果不在思考状态且不是服务器控制，则生成新目标
                if (!mesh.userData.isThinking && !mesh.userData.serverControlled) {
                    // 只有在没有pending新目标的情况下才生成
                    if (!mesh.userData.hasNewTarget) {
                        generateNewTarget(mesh);
                        mesh.userData.hasNewTarget = true;
                    }
                }
            }
        } else {
            // 清除标记，当有新目标时重新设置
            mesh.userData.hasNewTarget = false;
        }
        
        // ========== 自主行为处理 ==========
        // 如果智能体不在思考状态，执行自主行为
        if (!mesh.userData.isThinking) {
            // 每3-5秒做一次决策
            const decision = agentAutonomousDecision(id);
            
            // 执行自主行为
            executeAutonomousBehavior(id, decision);
            
            // 检测附近的智能体并做出反应
            const nearbyAgents = [];
            agents.forEach((otherData, otherId) => {
                if (otherId === id) return;
                const otherMesh = otherData.mesh;
                const dist = Math.sqrt(
                    Math.pow(mesh.position.x - otherMesh.position.x, 2) +
                    Math.pow(mesh.position.z - otherMesh.position.z, 2)
                );
                if (dist < 8) {  // 8米内
                    nearbyAgents.push({ id: otherId, name: otherData.data?.name || '未知', distance: dist });
                }
            });
            
            // 如果附近有其他智能体，有几率打招呼
            if (nearbyAgents.length > 0 && Math.random() < 0.02) { // 2%几率每帧检测
                onAgentSeeOther(id, nearbyAgents);
            }
        }
    });
    
    // Update flying birds
    if (typeof updateBirds === "function") updateBirds(Date.now());
    
    // 更新智能体情绪（每秒检查一次）
    if (typeof updateEmotions === "function") updateEmotions();
    
    // 更新情绪图标位置
    agents.forEach((data, agentId) => {
        const state = agentStates.get(agentId);
        if (state && state.emotionSprite) {
            state.emotionSprite.position.x = data.mesh.position.x;
            state.emotionSprite.position.z = data.mesh.position.z;
            state.emotionSprite.position.y = data.mesh.position.y + 3.5;
        }
    });
    
    // 更新相机位置（跟随/第一人称模式）
    if (cameraMode !== 'orbit' && selectedAgentId) {
        updateCameraForMode();
    }
    
    renderer.render(scene, camera);
}

// 生成新的移动目标
function generateNewTarget(mesh) {
  // 安全检查：确保mesh和position存在
  if (!mesh) {
    console.warn('generateNewTarget: 无效的mesh对象');
    return;
  }
  
  // 根据智能体类型，在一定范围内生成新目标（半径5-15米）
  const angle = Math.random() * Math.PI * 2;
  const radius = 5 + Math.random() * 10;
  
  // 安全获取当前位置（如果position不存在则使用默认值）
  const currentX = (mesh.position && mesh.position.x !== undefined) ? mesh.position.x : 0;
  const currentZ = (mesh.position && mesh.position.z !== undefined) ? mesh.position.z : 0;
  
  mesh.userData.targetX = currentX + Math.cos(angle) * radius;
  mesh.userData.targetZ = currentZ + Math.sin(angle) * radius;
  
  // 限制在合理范围内
  mesh.userData.targetX = Math.max(-45, Math.min(45, mesh.userData.targetX));
  mesh.userData.targetZ = Math.max(-45, Math.min(45, mesh.userData.targetZ));
  
  // 设置速度
  mesh.userData.speed = 2.0;
  
  // 标记已有新目标，防止重复生成
  mesh.userData.hasNewTarget = true;
}

// ============ 窗口大小调整 ============
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// ============ WebSocket 连接 ============
function connectWebSocket() {
    console.log('🔌 尝试连接 WebSocket:', CONFIG.wsUrl);
    
    try {
        ws = new WebSocket(CONFIG.wsUrl);
        
        ws.onopen = () => {
            console.log('✅ WebSocket 连接成功!');
            wsConnected = true;
            updateConnectionStatus(true);
            
            // 注册为观察者
            ws.send(JSON.stringify({ 
                type: 'REGISTER', 
                name: '🏙️ 3D观察者', 
                tags: ['observer', '3d-world'] 
            }));
            
            // 请求在线列表
            ws.send(JSON.stringify({ type: 'LIST' }));
            
            // 请求任务列表
            ws.send(JSON.stringify({ type: 'LIST_TASKS' }));
        };
        
        ws.onmessage = (event) => {
            const msg = JSON.parse(event.data);
            handleWSMessage(msg);
        };
        
        ws.onclose = () => {
            console.log('🔌 WebSocket 已断开');
            wsConnected = false;
            updateConnectionStatus(false);
            setTimeout(connectWebSocket, 3000);
        };
        
        ws.onerror = (err) => {
            console.error('❌ WebSocket 错误:', err);
            updateConnectionStatus(false);
        };
    } catch (err) {
        console.error('❌ WebSocket 连接失败:', err);
        updateConnectionStatus(false);
        setTimeout(connectWebSocket, 3000);
    }
}

// 更新连接状态显示
function updateConnectionStatus(connected) {
    const statusEl = document.getElementById('conn-status');
    if (statusEl) {
        if (connected) {
            statusEl.textContent = '🔌 已连接';
            statusEl.className = 'connection-status connected';
        } else {
            statusEl.textContent = '🔌 未连接';
            statusEl.className = 'connection-status disconnected';
        }
    }
}

// 处理消息
function handleWSMessage(msg) {
    switch (msg.type) {
        case 'REGISTERED':
            console.log('✅ 已注册为观察者:', msg.agentId);
            break;
            
        case 'AGENT_LIST':
            console.log('📋 在线列表:', msg.agents);
            updateAgentList(msg.agents);
            break;
            
        case 'AGENT_ONLINE':
            console.log('🦐 新上线:', msg);
            addAgentMesh(msg);
            break;
            
        case 'AGENT_OFFLINE':
            console.log('👋 离线:', msg.agentId);
            removeAgentMesh(msg.agentId);
            break;
            
        case 'AGENT_THINKING':
            console.log('🤔 思考中:', msg.agentName);
            showThinkingIcon(msg.agentId);
            // Move agent towards fountain (central position, not inside fountain)
            moveAgentToFountain(msg.agentId);
            break;
            
        case 'AGENT_RESPONSE_COMPLETE':
            console.log('✅ 回应完成:', msg.agentName, '- 内容:', msg.content);
            console.log('[City] Response complete:', msg.agentName);
            hideThinkingIcon(msg.agentId);

            // If AI response contains coordinates, move agent first
            if (msg.x !== undefined && msg.z !== undefined) {
                console.log('[City] Moving agent to: (', msg.x.toFixed(2), ',', msg.z.toFixed(2), ')');
                moveAgentToPosition(msg.agentId, msg.x, msg.z);
            }

            // Show message above agent's head
            if (msg.content && window.showAgentMessage) {
                window.showAgentMessage(msg.agentId, msg.content);
            }
            break;
            break;
            
        case 'TASK_LIST':
            taskCount = msg.count || msg.tasks?.length || 0;
            updateUI();
            
            // 更新任务可视化
            if (taskViz && msg.tasks) {
                msg.tasks.forEach(task => {
                    if (!taskViz.taskMarkers.has(task.id)) {
                        taskViz.createTaskMarker(task);
                    }
                });
            }
            break;
            
        case 'NEW_TASK':
            taskCount++;
            updateUI();
            
            // 创建新任务标记
            if (taskViz && msg.task) {
                taskViz.createTaskMarker(msg.task);
            }
            break;
            
        case 'MESSAGE':
            messageCount++;
            updateUI();
            break;
            
        case 'BROADCAST':
            console.log('📢 广播消息:', msg.from, '-', msg.content);
            // Show message above agent's head
            if (msg.from && msg.content && window.showAgentMessage) {
                window.showAgentMessage(msg.from, msg.content);
            }
            // Also show in world window if available
            if (window.worldWindow && window.worldWindow.addMessage) {
                window.worldWindow.addMessage(msg.fromName || msg.from || '广播', msg.content);
            }
            messageCount++;
            updateUI();
            break;
            
        case 'AGENT_THOUGHT':
            // 智能体思考 - 显示在头顶，带 💭 标记
            console.log('💭 智能体思考:', msg.agentId, '-', msg.content);
            // 显示想法在头顶
            if (msg.agentId && msg.content && window.showAgentMessage) {
                window.showAgentMessage(msg.agentId, '💭 ' + msg.content);
            }
            // 不在 world window 显示，避免刷屏
            break;
            // Agent is moving itself to a new position
            console.log('🦐 智能体移动:', msg.agentId, '-> (', msg.x.toFixed(2), ',', msg.z.toFixed(2), ')');
            moveAgentToPosition(msg.agentId, msg.x, msg.z);
            break;
            
        case 'RENDER_VISION':
            // Render first-person view from requested position
            console.log('👁️ 渲染视野请求:', msg.agentId, 'pos=(', msg.x.toFixed(1), ',', msg.z.toFixed(1), ') dir=', msg.direction);
            renderFirstPersonView(msg);
            break;
            
        case 'RADAR_QUERY':
            // Handle radar query - calculate objects in range
            console.log('📡 雷达查询:', msg.agentId, 'range=', msg.range);
            handleRadarQuery(msg);
            break;
            
        case 'DIALOGUE_SHOW':
            // Show dialogue bubble for the agent
            console.log('💬 对话气泡:', msg.fromAgentName, '->', msg.toAgentId, ':', msg.content);
            showDialogueBubble(msg.fromAgentId, msg.toAgentId, msg.content);
            break;
            
        case 'DIALOGUE_END':
            // Hide any active dialogue for this agent
            hideDialogueBubble(msg.agentId);
            break;
            
        case 'AGENT_ACHIEVEMENT':
            // Show achievement notification for agent
            console.log('🏆 成就:', msg.agentId, '-', msg.achievement);
            showAchievementBadge(msg.agentId, msg.achievement, msg.placeName);
            break;
            
        case 'SET_EMOTION':
            // Set agent's emotion
            console.log('😊 情绪设置:', msg.agentId, '->', msg.emotion);
            setAgentEmotion(msg.agentId, msg.emotion);
            break;
            
        case 'DO_ACTION':
            // Execute an action
            console.log('🎬 动作:', msg.agentId, '->', msg.action, 'duration=', msg.duration);
            setAgentAction(msg.agentId, msg.action, msg.duration);
            break;
            
        case 'AGENT_VOICE':
            // Agent is speaking with voice
            console.log('🔊 语音:', msg.fromAgentName, ':', msg.content);
            showVoiceBubble(msg.fromAgentId, msg.fromAgentName, msg.content, msg.voice);
            break;
            
        case 'AGENT_LEVEL_UP':
            // Agent leveled up!
            console.log('🎉 升级:', msg.agentName, '-> Lv.', msg.newLevel);
            showLevelUpBadge(msg.agentId, msg.agentName, msg.newLevel, msg.levelName);
            break;
    }
}

// 更新智能体列表
function updateAgentList(agentList) {
    // 清除现有的
    agents.forEach((data, id) => {
        scene.remove(data.mesh);
    });
    agents.clear();
    
    // 添加新的
    if (agentList && agentList.length > 0) {
        agentList.forEach(agent => {
            addAgentMesh(agent);
        });
    }
    
    updateUI();
    
    // 更新数据面板
    if (dashboard) {
        dashboard.update(agentList, taskCount, messageCount);
    }
    
    // 更新侧边栏
    const listEl = document.getElementById('agent-list');
    if (listEl && agentList && agentList.length > 0) {
        listEl.innerHTML = agentList.map(agent => `
            <div class="agent-item">
                <div class="name">${agent.visual?.emoji || '🦐'} ${agent.name || '未知'}</div>
                <div class="status">
                    <span class="status-dot online"></span>
                    ${agent.status || '在线'}
                </div>
            </div>
        `).join('');
    }
}

// 更新UI
function updateUI() {
    document.getElementById('online-count').textContent = agents.size;
    document.getElementById('task-count').textContent = taskCount;
    document.getElementById('message-count').textContent = messageCount;
}

// ============ 智能体选择和相机模式控制 ============

function onCanvasClick(event) {
    // 计算鼠标位置
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    // 射线检测
    raycaster.setFromCamera(mouse, camera);
    
    // 获取所有智能体mesh
    const meshes = [];
    agents.forEach((data) => {
        meshes.push(data.mesh);
    });
    
    const intersects = raycaster.intersectObjects(meshes, true);
    
    if (intersects.length > 0) {
        // 找到被点击的智能体
        let clickedMesh = intersects[0].object;
        // 向上查找智能体根节点
        while (clickedMesh.parent && !clickedMesh.userData.agentId) {
            clickedMesh = clickedMesh.parent;
        }
        
        if (clickedMesh.userData.agentId) {
            selectAgent(clickedMesh.userData.agentId);
        }
    } else {
        // 点击空白区域，取消选择
        deselectAgent();
    }
}

function selectAgent(agentId) {
    const agentData = agents.get(agentId);
    if (!agentData) return;
    
    // 取消之前的选中状态
    if (selectedAgentId) {
        const prevAgent = agents.get(selectedAgentId);
        if (prevAgent) {
            // 恢复原始颜色
            setAgentColor(prevAgent.mesh, false);
        }
    }
    
    selectedAgentId = agentId;
    
    // 高亮选中状态
    setAgentColor(agentData.mesh, true);
    
    // 显示信息面板
    showAgentInfo(agentData);
    
    // 更新相机模式为跟随
    if (cameraMode === 'orbit') {
        setCameraMode('follow');
    }
    
    console.log('🎯 选中智能体:', agentData.data.name);
}

function deselectAgent() {
    if (selectedAgentId) {
        const prevAgent = agents.get(selectedAgentId);
        if (prevAgent) {
            setAgentColor(prevAgent.mesh, false);
        }
    }
    selectedAgentId = null;
    hideAgentInfo();
    
    // 恢复到俯瞰模式
    setCameraMode('orbit');
    
    console.log('❌ 取消选择');
}

function setAgentColor(mesh, isSelected) {
    // 遍历mesh的所有材质
    mesh.traverse((child) => {
        if (child.isMesh && child.material) {
            if (Array.isArray(child.material)) {
                child.material.forEach(mat => {
                    if (isSelected) {
                        mat.emissive = new THREE.Color(0x4444ff);
                    } else {
                        mat.emissive = new THREE.Color(0x000000);
                    }
                });
            } else {
                if (isSelected) {
                    child.material.emissive = new THREE.Color(0x4444ff);
                } else {
                    child.material.emissive = new THREE.Color(0x000000);
                }
            }
        }
    });
}

function showAgentInfo(agentData) {
    // 可以通过自定义事件通知UI
    window.dispatchEvent(new CustomEvent('agentSelected', {
        detail: {
            agentId: agentData.data.agentId,
            name: agentData.data.name,
            tags: agentData.data.tags
        }
    }));
}

function hideAgentInfo() {
    window.dispatchEvent(new CustomEvent('agentDeselected'));
}

function setCameraMode(mode) {
    const prevMode = cameraMode;
    cameraMode = mode;
    
    // 禁用/启用 OrbitControls
    if (controls) {
        if (mode === 'orbit') {
            controls.enabled = true;
            controls.minDistance = 10;
            controls.maxDistance = 100;
            controls.maxPolarAngle = Math.PI / 2 - 0.1;
        } else {
            controls.enabled = false;
        }
    }
    
    // 通知UI更新
    window.dispatchEvent(new CustomEvent('cameraModeChanged', {
        detail: { mode: mode, prevMode: prevMode }
    }));
    
    console.log('📷 相机模式:', mode);
}

function updateCameraForMode() {
    if (!selectedAgentId) return;
    
    const agentData = agents.get(selectedAgentId);
    if (!agentData) return;
    
    const mesh = agentData.mesh;
    
    if (cameraMode === 'follow') {
        // 跟随模式：相机在智能体后方上方
        const angle = Math.atan2(mesh.position.x, mesh.position.z);
        const offsetX = Math.sin(angle) * followDistance;
        const offsetZ = Math.cos(angle) * followDistance;
        
        // 平滑移动相机
        camera.position.x += (mesh.position.x + offsetX - camera.position.x) * 0.05;
        camera.position.y += (mesh.position.y + followHeight - camera.position.y) * 0.05;
        camera.position.z += (mesh.position.z + offsetZ - camera.position.z) * 0.05;
        
        // 看向智能体
        camera.lookAt(mesh.position.x, mesh.position.y + 1, mesh.position.z);
        
    } else if (cameraMode === 'firstPerson') {
        // 第一人称模式：相机在智能体位置，高度为龙虾视角
        camera.position.x = mesh.position.x;
        camera.position.y = mesh.position.y + firstPersonHeight;
        camera.position.z = mesh.position.z;
        
        // 龙虾朝向移动方向
        const targetX = mesh.userData.targetX;
        const targetZ = mesh.userData.targetZ;
        if (targetX !== undefined && targetZ !== undefined) {
            const lookX = targetX - mesh.position.x;
            const lookZ = targetZ - mesh.position.z;
            if (Math.abs(lookX) > 0.1 || Math.abs(lookZ) > 0.1) {
                camera.lookAt(mesh.position.x + lookX, mesh.position.y + firstPersonHeight, mesh.position.z + lookZ);
            }
        }
    }
}

// ============ 启动 ============
// 确保 Three.js 和 DOM 都加载完成
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    // DOM 已加载完成
    setTimeout(init, 100);
}

// ============ 打招呼气泡 ============
const greetingBubbles = new Map(); // agentId -> { sprite, timeout }

const GREETINGS = ['你好!', '嗨~', '早上好!', '很高兴见到你!', '你好呀!', '嘿!'];

function showGreeting(agentId) {
    const agentData = agents.get(agentId);
    if (!agentData) return;
    
    // 如果已有气泡，先移除
    if (greetingBubbles.has(agentId)) {
        const existing = greetingBubbles.get(agentId);
        if (existing.timeout) clearTimeout(existing.timeout);
        if (existing.sprite) {
            scene.remove(existing.sprite);
        }
    }
    
    // 创建气泡
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    
    // 气泡背景
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.beginPath();
    ctx.roundRect(0, 0, 256, 64, 12);
    ctx.fill();
    
    // 气泡边框
    ctx.strokeStyle = '#9333EA';
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // 文字
    ctx.fillStyle = '#333';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const text = GREETINGS[Math.floor(Math.random() * GREETINGS.length)];
    ctx.fillText(text, 128, 32);
    
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(material);
    sprite.position.set(agentData.mesh.position.x, agentData.mesh.position.y + 2.5, agentData.mesh.position.z);
    sprite.scale.set(2, 0.5, 1);
    scene.add(sprite);
    
    // 保存引用
    greetingBubbles.set(agentId, { sprite, timeout: null });
    
    // 3秒后自动消失
    const timeout = setTimeout(() => {
        const bubble = greetingBubbles.get(agentId);
        if (bubble && bubble.sprite) {
            scene.remove(bubble.sprite);
        }
        greetingBubbles.delete(agentId);
    }, 3000);
    
    greetingBubbles.set(agentId, { sprite, timeout });
}

// 暴露给全局，让其他代码可以调用
window.showGreeting = showGreeting;

// ============ 对话气泡 ============
const dialogueBubbles = new Map(); // agentId -> { sprite, timeout }

function showDialogueBubble(fromAgentId, toAgentId, content) {
    // 显示在发送消息的智能体头顶
    const agentData = agents.get(fromAgentId);
    if (!agentData) {
        // 尝试显示在接收方
        const targetData = agents.get(toAgentId);
        if (!targetData) return;
    }
    
    const mesh = agentData?.mesh || agents.get(toAgentId)?.mesh;
    if (!mesh) return;
    
    // 移除已有的气泡
    if (dialogueBubbles.has(fromAgentId)) {
        const existing = dialogueBubbles.get(fromAgentId);
        if (existing.timeout) clearTimeout(existing.timeout);
        if (existing.sprite) {
            scene.remove(existing.sprite);
        }
    }
    
    // 创建气泡
    const canvas = document.createElement('canvas');
    canvas.width = 320;
    canvas.height = 80;
    const ctx = canvas.getContext('2d');
    
    // 气泡背景（蓝色表示对话）
    ctx.fillStyle = 'rgba(147, 51, 234, 0.95)';
    ctx.beginPath();
    ctx.roundRect(0, 0, 320, 80, 16);
    ctx.fill();
    
    // 气泡边框
    ctx.strokeStyle = '#7C3AED';
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // 文字（白色）
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // 截断过长的消息
    let displayContent = content;
    if (displayContent.length > 20) {
        displayContent = displayContent.substring(0, 18) + '...';
    }
    ctx.fillText(displayContent, 160, 40);
    
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(material);
    sprite.position.set(mesh.position.x, mesh.position.y + 2.8, mesh.position.z);
    sprite.scale.set(2.5, 0.625, 1);
    scene.add(sprite);
    
    // 保存引用
    const timeout = setTimeout(() => {
        const bubble = dialogueBubbles.get(fromAgentId);
        if (bubble && bubble.sprite) {
            scene.remove(bubble.sprite);
        }
        dialogueBubbles.delete(fromAgentId);
    }, 5000);
    
    dialogueBubbles.set(fromAgentId, { sprite, timeout });
}

function hideDialogueBubble(agentId) {
    if (dialogueBubbles.has(agentId)) {
        const bubble = dialogueBubbles.get(agentId);
        if (bubble.timeout) clearTimeout(bubble.timeout);
        if (bubble.sprite) {
            scene.remove(bubble.sprite);
        }
        dialogueBubbles.delete(agentId);
    }
}

// ============ 成就徽章 ============
const achievementBadges = new Map(); // agentId -> { sprite, timeout }

const ACHIEVEMENT_EMOJIS = {
    'explorer': '🗺️',
    'social_butterfly': '🦋',
    'task_master': '📋',
    'helper': '🤝'
};

function showAchievementBadge(agentId, achievement, placeName) {
    const agentData = agents.get(agentId);
    if (!agentData) return;
    
    const mesh = agentData.mesh;
    
    // 移除已有的徽章
    if (achievementBadges.has(agentId)) {
        const existing = achievementBadges.get(agentId);
        if (existing.timeout) clearTimeout(existing.timeout);
        if (existing.sprite) {
            scene.remove(existing.sprite);
        }
    }
    
    // 获取成就emoji
    const emoji = ACHIEVEMENT_EMOJIS[achievement] || '🏆';
    const displayText = placeName ? `${emoji} 新地点!` : emoji;
    
    // 创建徽章气泡
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    
    // 徽章背景（金色）
    ctx.fillStyle = 'rgba(251, 191, 36, 0.95)';
    ctx.beginPath();
    ctx.roundRect(0, 0, 128, 64, 32);
    ctx.fill();
    
    // 边框
    ctx.strokeStyle = '#F59E0B';
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // 文字
    ctx.font = 'bold 36px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emoji, 64, 32);
    
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(material);
    sprite.position.set(mesh.position.x, mesh.position.y + 3.2, mesh.position.z);
    sprite.scale.set(1.5, 0.75, 1);
    scene.add(sprite);
    
    // 保存引用
    const timeout = setTimeout(() => {
        const badge = achievementBadges.get(agentId);
        if (badge && badge.sprite) {
            scene.remove(badge.sprite);
        }
        achievementBadges.delete(agentId);
    }, 4000);
    
    achievementBadges.set(agentId, { sprite, timeout });
}

// ============ 语音气泡系统 ============
const voiceBubbles = new Map(); // agentId -> { sprite, timeout }

// 语音配置
const VOICE_CONFIG = {
    female_1: { lang: 'zh-CN', pitch: 1.0, rate: 0.9 },  // 温柔女声
    female_2: { lang: 'zh-CN', pitch: 1.2, rate: 1.1 },   // 明亮女声
    male_1: { lang: 'zh-CN', pitch: 0.8, rate: 0.85 },    // 沉稳男声
    male_2: { lang: 'zh-CN', pitch: 1.0, rate: 1.0 },     // 年轻男声
    default: { lang: 'zh-CN', pitch: 1.0, rate: 0.95 }
};

// 显示语音气泡
function showVoiceBubble(fromAgentId, fromAgentName, content, voiceType) {
    const agentData = agents.get(fromAgentId);
    if (!agentData) return;
    
    const mesh = agentData.mesh;
    
    // 移除已有的气泡
    if (voiceBubbles.has(fromAgentId)) {
        const existing = voiceBubbles.get(fromAgentId);
        if (existing.timeout) clearTimeout(existing.timeout);
        if (existing.sprite) {
            scene.remove(existing.sprite);
        }
    }
    
    // 创建气泡（带语音图标）
    const canvas = document.createElement('canvas');
    canvas.width = 320;
    canvas.height = 80;
    const ctx = canvas.getContext('2d');
    
    // 气泡背景（绿色表示语音）
    ctx.fillStyle = 'rgba(34, 197, 94, 0.95)';
    ctx.beginPath();
    ctx.roundRect(0, 0, 320, 80, 16);
    ctx.fill();
    
    // 气泡边框
    ctx.strokeStyle = '#16A34A';
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // 语音图标
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('🔊', 15, 48);
    
    // 说话者名字
    ctx.font = 'bold 18px Arial';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(fromAgentName, 55, 28);
    
    // 内容（截断）
    ctx.font = '18px Arial';
    let displayContent = content;
    if (displayContent.length > 22) {
        displayContent = displayContent.substring(0, 20) + '...';
    }
    ctx.fillText(displayContent, 55, 55);
    
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(material);
    sprite.position.set(mesh.position.x, mesh.position.y + 3.0, mesh.position.z);
    sprite.scale.set(2.5, 0.625, 1);
    scene.add(sprite);
    
    // 保存引用
    const timeout = setTimeout(() => {
        const bubble = voiceBubbles.get(fromAgentId);
        if (bubble && bubble.sprite) {
            scene.remove(bubble.sprite);
        }
        voiceBubbles.delete(fromAgentId);
    }, 5000);
    
    voiceBubbles.set(fromAgentId, { sprite, timeout });
    
    // 播放语音
    playVoice(content, voiceType || 'default');
}

// 使用 Web Speech API 播放语音
function playVoice(text, voiceType) {
    // 检查浏览器是否支持语音合成
    if (!('speechSynthesis' in window)) {
        console.log('浏览器不支持语音合成');
        return;
    }
    
    // 获取语音配置
    const config = VOICE_CONFIG[voiceType] || VOICE_CONFIG.default;
    
    // 创建语音合成对象
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = config.lang;
    utterance.pitch = config.pitch;
    utterance.rate = config.rate;
    utterance.volume = 1.0;
    
    // 选择语音（如果可用）
    const voices = speechSynthesis.getVoices();
    // 优先选择中文语音
    const zhVoice = voices.find(v => v.lang.includes('zh'));
    if (zhVoice) {
        utterance.voice = zhVoice;
    }
    
    // 播放
    speechSynthesis.speak(utterance);
}

// 预加载语音列表
if ('speechSynthesis' in window) {
    speechSynthesis.getVoices();
    speechSynthesis.onvoiceschanged = () => {
        speechSynthesis.getVoices();
    };
}

// ============ 等级徽章 ============
const levelBadges = new Map(); // agentId -> { sprite, level }

function showLevelUpBadge(agentId, agentName, level, levelName) {
    const agentData = agents.get(agentId);
    if (!agentData) return;
    
    const mesh = agentData.mesh;
    
    // 创建升级庆祝气泡
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 96;
    const ctx = canvas.getContext('2d');
    
    // 金色渐变背景
    const gradient = ctx.createLinearGradient(0, 0, 256, 96);
    gradient.addColorStop(0, '#FFD700');
    gradient.addColorStop(1, '#FFA500');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.roundRect(0, 0, 256, 96, 20);
    ctx.fill();
    
    // 边框
    ctx.strokeStyle = '#FF8C00';
    ctx.lineWidth = 4;
    ctx.stroke();
    
    // 星星装饰
    ctx.font = 'bold 28px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('⭐', 40, 35);
    ctx.fillText('⭐', 216, 35);
    
    // 等级文字
    ctx.font = 'bold 36px Arial';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(`Lv.${level}`, 128, 40);
    
    // 等级名称
    ctx.font = '20px Arial';
    ctx.fillStyle = '#FFF8DC';
    ctx.fillText(levelName, 128, 72);
    
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(material);
    sprite.position.set(mesh.position.x, mesh.position.y + 4.0, mesh.position.z);
    sprite.scale.set(2.5, 1, 1);
    scene.add(sprite);
    
    // 保存引用
    const timeout = setTimeout(() => {
        if (sprite) {
            scene.remove(sprite);
        }
        levelBadges.delete(agentId);
    }, 4000);
    
    levelBadges.set(agentId, { sprite, level });
    
    // 添加升级动画 - 向上飘动
    const startY = sprite.position.y;
    const startTime = Date.now();
    
    function animateLevelUp() {
        const elapsed = Date.now() - startTime;
        if (elapsed < 2000) {
            sprite.position.y = startY + (elapsed / 2000) * 1.5;
            requestAnimationFrame(animateLevelUp);
        }
    }
    animateLevelUp();
    
    // 播放庆祝音效（使用Web Audio API发出简单的声音）
    playCelebrationSound();
}

function playCelebrationSound() {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        oscillator.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
        oscillator.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.1); // E5
        oscillator.frequency.setValueAtTime(783.99, audioCtx.currentTime + 0.2); // G5
        
        gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
        
        oscillator.start(audioCtx.currentTime);
        oscillator.stop(audioCtx.currentTime + 0.5);
    } catch (e) {
        console.log('Could not play celebration sound');
    }
}

// 暴露给全局
window.showDialogueBubble = showDialogueBubble;
window.hideDialogueBubble = hideDialogueBubble;
window.showAchievementBadge = showAchievementBadge;
window.showVoiceBubble = showVoiceBubble;
window.playVoice = playVoice;
window.showLevelUpBadge = showLevelUpBadge;
