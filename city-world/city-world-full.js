/**
 * 智体城 3D 世界 - 完整版
 * WebSocket连接 + 3D场景渲染
 */

// ============ 全局变量 ============
let scene, camera, renderer, controls;
let agents = new Map(); // agentId -> { mesh, data }
let messageCount = 0;
let taskCount = 0;
let dashboard = null; // 数据面板
let taskViz = null; // 任务可视化系统
let agentDetailPanel = null; // 智能体详情面板
let raycaster = null; // 射线检测器
let mouse = null; // 鼠标位置

// WebSocket 连接
let ws = null;
let wsConnected = false;

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
        createCity();
        
        console.log('✅ 3D场景创建完成');
        
    } catch (err) {
        console.error('❌ 初始化失败:', err);
    }

    // 射线检测（用于点击）
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();
    
    // 事件监听
    window.addEventListener('resize', onWindowResize);

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

    buildings.forEach(b => {
        const building = createBuilding(b.w, b.h, b.d, b.color);
        building.position.set(b.x, b.h / 2, b.z);
        building.userData = { type: 'building', name: b.name };
        scene.add(building);
        
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

// ============ 龙虾模型 ============
function createLobsterMesh(agent) {
    const group = new THREE.Group();
    
    // 根据标签决定颜色
    let bodyColor = 0xff6b6b; // 默认红色
    let clawColor = 0xff4444;
    
    if (agent.tags && agent.tags.length > 0) {
        // AI助手 - 紫色
        if (agent.tags.includes('ai') || agent.tags.includes('assistant')) {
            bodyColor = 0x6366f1; // 紫色
            clawColor = 0x8b5cf6;
        }
        // 数据分析师 - 橙色
        else if (agent.tags.includes('analyst') || agent.tags.includes('data')) {
            bodyColor = 0xf97316; // 橙色
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
    console.log('✅ 添加龙虾 3D 模型:', agent.name);
    
    const mesh = createLobsterMesh(agent);
    
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
}

function removeAgentMesh(agentId) {
    const agent = agents.get(agentId);
    if (agent) {
        scene.remove(agent.mesh);
        agents.delete(agentId);
    }
}

// ============ 动画循环 ============
function animate() {
    requestAnimationFrame(animate);
    
    if (controls.update) {
        controls.update();
    }
    
    // 龙虾动画
    const time = Date.now();
    agents.forEach((data, id) => {
        const mesh = data.mesh;
        
        // 上下浮动
        mesh.position.y = Math.sin(time * 0.002 + id.charCodeAt(0)) * 0.1;
        
        // 缓慢旋转
        mesh.rotation.y += 0.002;
        
        // 移动动画（向目标位置移动）
        if (mesh.userData.targetX !== undefined && mesh.userData.targetZ !== undefined) {
            const dx = mesh.userData.targetX - mesh.position.x;
            const dz = mesh.userData.targetZ - mesh.position.z;
            const distance = Math.sqrt(dx * dx + dz * dz);
            
            // 如果距离大于0.1，继续移动
            if (distance > 0.1) {
                const speed = mesh.userData.speed || 0.02;
                mesh.position.x += (dx / distance) * speed;
                mesh.position.z += (dz / distance) * speed;
                
                // 面向移动方向
                mesh.rotation.y = Math.atan2(dx, dz);
            } else {
                // 到达目标，生成新目标
                generateNewTarget(mesh);
            }
        }
    });
    
    renderer.render(scene, camera);
}

// 生成新的移动目标
function generateNewTarget(mesh) {
    // 根据智能体类型，在一定范围内生成新目标
    const range = 8;
    mesh.userData.targetX = mesh.position.x + (Math.random() - 0.5) * range;
    mesh.userData.targetZ = mesh.position.z + (Math.random() - 0.5) * range;
    
    // 限制在合理范围内
    mesh.userData.targetX = Math.max(-50, Math.min(50, mesh.userData.targetX));
    mesh.userData.targetZ = Math.max(-50, Math.min(50, mesh.userData.targetZ));
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
                <div class="name">🦐 ${agent.name || '未知'}</div>
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

// ============ 启动 ============
// 确保 Three.js 和 DOM 都加载完成
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    // DOM 已加载完成
    setTimeout(init, 100);
}
