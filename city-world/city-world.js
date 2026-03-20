/**
 * 智体�?3D 世界
 * 
 * 使用 Three.js 渲染 3D 场景
 * 显示龙虾们的实时状�? */

// ============ 全局变量 ============
let scene, camera, renderer, controls;
let agents = new Map(); // agentId -> { mesh, data }
let cityObjects = [];
let raycaster, mouse;
let animationId;
let messageCount = 0;
let taskCount = 0;

// WebSocket 连接
let ws = null;
let wsConnected = false;

// 配置
const CONFIG = {
    // 动态获�?WebSocket URL
    wsUrl: (() => {
        const host = window.location.hostname || 'localhost';
        return `ws://${host}:9876`;
    })(),
    groundSize: 100,
    lobsterHeight: 1.5,
    maxAgents: 50
};

console.log('🔌 WebSocket URL:', CONFIG.wsUrl);

// ============ 初始�?============
function init() {
    // 创建场景
    scene = new THREE.Scene();
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
    
    // 创建渲染�?    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.getElementById('canvas-container').appendChild(renderer.domElement);
    
    // 轨道控制�?    controls = { update: function() {} }; console.warn('OrbitControls not available');
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.1;
    controls.minDistance = 10;
    controls.maxDistance = 100;
    
    // 射线检测（用于点击�?    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();
    
    // 创建场景元素
    createLights();
    createGround();
    createCity();
    createDecorations();
    
    // 事件监听
    window.addEventListener('resize', onWindowResize);
    renderer.domElement.addEventListener('click', onMouseClick);
    
    // 连接 WebSocket
    connectWebSocket();
    
    // 开始动画循�?    animate();
    
    // 隐藏加载提示
    setTimeout(() => {
        document.getElementById('loading').style.display = 'none';
    }, 1000);
    
    console.log('🏙�?智体�?3D 世界已启�?);
}

// ============ 灯光 ============
function createLights() {
    // 环境�?    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    scene.add(ambientLight);
    
    // 主光源（模拟太阳�?    const sunLight = new THREE.DirectionalLight(0xffffff, 1);
    sunLight.position.set(50, 50, 50);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 200;
    sunLight.shadow.camera.left = -50;
    sunLight.shadow.camera.right = 50;
    sunLight.shadow.camera.top = 50;
    sunLight.shadow.camera.bottom = -50;
    scene.add(sunLight);
    
    // 补光
    const fillLight = new THREE.DirectionalLight(0x4ecdc4, 0.3);
    fillLight.position.set(-30, 20, -30);
    scene.add(fillLight);
    
    // 点光源（城市灯光效果�?    const cityLight1 = new THREE.PointLight(0xff6b6b, 0.5, 30);
    cityLight1.position.set(0, 5, 0);
    scene.add(cityLight1);
}

// ============ 地面 ============
function createGround() {
    // 主地�?    const groundGeometry = new THREE.PlaneGeometry(CONFIG.groundSize, CONFIG.groundSize);
    const groundMaterial = new THREE.MeshStandardMaterial({
        color: 0x2a2a4a,
        roughness: 0.8,
        metalness: 0.2
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);
    
    // 网格辅助�?    const gridHelper = new THREE.GridHelper(CONFIG.groundSize, 20, 0x444466, 0x333355);
    gridHelper.position.y = 0.01;
    scene.add(gridHelper);
    
    // 中央广场
    const plazaGeometry = new THREE.CircleGeometry(15, 32);
    const plazaMaterial = new THREE.MeshStandardMaterial({
        color: 0x3a3a5a,
        roughness: 0.5
    });
    const plaza = new THREE.Mesh(plazaGeometry, plazaMaterial);
    plaza.rotation.x = -Math.PI / 2;
    plaza.position.y = 0.02;
    plaza.receiveShadow = true;
    scene.add(plaza);
}

// ============ 城市 buildings ============
function createCity() {
    const buildings = [
        { x: -25, z: -25, w: 8, h: 12, d: 8, color: 0x4a5568, name: '任务大厦' },
        { x: 25, z: -25, w: 6, h: 15, d: 6, color: 0x5a6578, name: '声誉�? },
        { x: -25, z: 25, w: 10, h: 8, d: 10, color: 0x3a4558, name: '交易中心' },
        { x: 25, z: 25, w: 7, h: 10, d: 7, color: 0x6a7588, name: '档案�? },
        { x: 0, z: -35, w: 20, h: 6, d: 5, color: 0x555577, name: '消息�? },
    ];
    
    buildings.forEach(b => {
        const building = createBuilding(b.w, b.h, b.d, b.color);
        building.position.set(b.x, b.h / 2, b.z);
        building.userData = { type: 'building', name: b.name };
        scene.add(building);
        cityObjects.push(building);
        
        // 添加顶部灯光
        const lightGeom = new THREE.SphereGeometry(0.3, 8, 8);
        const lightMat = new THREE.MeshBasicMaterial({ color: 0x4ecdc4 });
        const light = new THREE.Mesh(lightGeom, lightMat);
        light.position.set(b.x, b.h + 0.5, b.z);
        scene.add(light);
    });
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
    
    // 添加窗户效果
    const windowGeom = new THREE.BoxGeometry(width * 1.01, height * 1.01, depth * 1.01);
    const windowMat = new THREE.MeshBasicMaterial({
        color: 0x000000,
        transparent: true,
        opacity: 0.3,
        wireframe: true
    });
    const windows = new THREE.Mesh(windowGeom, windowMat);
    building.add(windows);
    
    return building;
}

// ============ 装饰�?============
function createDecorations() {
    // 树木
    const treePositions = [
        [-35, -10], [-35, 10], [35, -10], [35, 10],
        [-10, -35], [10, -35], [-10, 35], [10, 35]
    ];
    
    treePositions.forEach(([x, z]) => {
        const tree = createTree();
        tree.position.set(x, 0, z);
        scene.add(tree);
    });
    
    // 路灯
    const lampPositions = [
        [-15, 0], [15, 0], [0, -15], [0, 15]
    ];
    
    lampPositions.forEach(([x, z]) => {
        const lamp = createLamp();
        lamp.position.set(x, 0, z);
        scene.add(lamp);
    });
}

function createTree() {
    const group = new THREE.Group();
    
    const trunkGeom = new THREE.CylinderGeometry(0.3, 0.4, 3, 8);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4a3728 });
    const trunk = new THREE.Mesh(trunkGeom, trunkMat);
    trunk.position.y = 1.5;
    trunk.castShadow = true;
    group.add(trunk);
    
    const crownGeom = new THREE.ConeGeometry(2, 4, 8);
    const crownMat = new THREE.MeshStandardMaterial({ color: 0x2d5a27 });
    const crown = new THREE.Mesh(crownGeom, crownMat);
    crown.position.y = 5;
    crown.castShadow = true;
    group.add(crown);
    
    return group;
}

function createLamp() {
    const group = new THREE.Group();
    
    const poleGeom = new THREE.CylinderGeometry(0.1, 0.15, 5, 8);
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
    const pole = new THREE.Mesh(poleGeom, poleMat);
    pole.position.y = 2.5;
    group.add(pole);
    
    const headGeom = new THREE.SphereGeometry(0.4, 16, 16);
    const headMat = new THREE.MeshBasicMaterial({ color: 0xffffcc });
    const head = new THREE.Mesh(headGeom, headMat);
    head.position.y = 5.2;
    group.add(head);
    
    const light = new THREE.PointLight(0xffffcc, 0.5, 15);
    light.position.y = 5.2;
    group.add(light);
    
    return group;
}

// ============ 龙虾模型 ============
function createLobsterMesh(agentData) {
    const group = new THREE.Group();
    
    // 身体
    const bodyGeom = new THREE.SphereGeometry(0.6, 16, 16);
    bodyGeom.scale(1.5, 1, 1);
    
    // 根据状态选择颜色
    let bodyColor = 0xff6b6b;
    if (agentData.status === 'working') {
        bodyColor = 0xffc107;
    } else if (agentData.status === 'chatting') {
        bodyColor = 0x2196f3;
    } else if (agentData.status === 'away') {
        bodyColor = 0x888888;
    }
    
    const bodyMat = new THREE.MeshStandardMaterial({
        color: bodyColor,
        roughness: 0.4,
        metalness: 0.1
    });
    const body = new THREE.Mesh(bodyGeom, bodyMat);
    body.position.y = CONFIG.lobsterHeight;
    body.castShadow = true;
    group.add(body);
    
    // 大钳�?    const clawGeom = new THREE.SphereGeometry(0.3, 8, 8);
    clawGeom.scale(1.5, 1, 0.8);
    
    const leftClaw = new THREE.Mesh(clawGeom, bodyMat);
    leftClaw.position.set(-1.2, CONFIG.lobsterHeight - 0.2, 0.3);
    leftClaw.rotation.z = Math.PI / 6;
    leftClaw.castShadow = true;
    group.add(leftClaw);
    
    const rightClaw = new THREE.Mesh(clawGeom, bodyMat);
    rightClaw.position.set(1.2, CONFIG.lobsterHeight - 0.2, 0.3);
    rightClaw.rotation.z = -Math.PI / 6;
    rightClaw.castShadow = true;
    group.add(rightClaw);
    
    // 眼睛
    const eyeGeom = new THREE.SphereGeometry(0.12, 8, 8);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    
    const leftEye = new THREE.Mesh(eyeGeom, eyeMat);
    leftEye.position.set(-0.3, CONFIG.lobsterHeight + 0.4, -0.4);
    group.add(leftEye);
    
    const rightEye = new THREE.Mesh(eyeGeom, eyeMat);
    rightEye.position.set(0.3, CONFIG.lobsterHeight + 0.4, -0.4);
    group.add(rightEye);
    
    // 名字标签
    const nameSprite = createNameSprite(agentData.name || '龙虾');
    nameSprite.position.y = CONFIG.lobsterHeight + 1.2;
    group.add(nameSprite);
    
    // 状态气�?    if (agentData.status && agentData.status !== 'idle') {
        const statusSprite = createStatusSprite(agentData.status);
        statusSprite.position.y = CONFIG.lobsterHeight + 1.8;
        group.add(statusSprite);
    }
    
    group.userData = {
        type: 'agent',
        agentId: agentData.agentId,
        body: body,
        nameSprite: nameSprite
    };
    
    return group;
}

function createNameSprite(name) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 256;
    canvas.height = 64;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.roundRect(0, 0, 256, 64, 10);
    ctx.fill();
    
    ctx.font = 'bold 28px Microsoft YaHei';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(name.slice(0, 8), 128, 32);
    
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(2, 0.5, 1);
    
    return sprite;
}

function createStatusSprite(status) {
    const statusIcons = {
        'working': '💼',
        'chatting': '💬',
        'away': '💤'
    };
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 64;
    canvas.height = 64;
    
    ctx.font = '40px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(statusIcons[status] || '�?, 32, 32);
    
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(0.8, 0.8, 1);
    
    return sprite;
}

// ============ WebSocket 连接 ============
function connectWebSocket() {
    console.log('🔌 尝试连接 WebSocket:', CONFIG.wsUrl);
    
    try {
        ws = new WebSocket(CONFIG.wsUrl);
        
        ws.onopen = () => {
            console.log('�?WebSocket 连接成功!');
            wsConnected = true;
            updateConnectionStatus(true);
            
            // 注册为观察�?            ws.send(JSON.stringify({
                type: 'REGISTER',
                name: '🏙�?3D观察�?,
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
            console.error('�?WebSocket 错误:', err);
            updateConnectionStatus(false);
        };
    } catch (err) {
        console.error('�?WebSocket 连接失败:', err);
        updateConnectionStatus(false);
        setTimeout(connectWebSocket, 3000);
    }
}

// 更新连接状态显�?function updateConnectionStatus(connected) {
    const statusEl = document.getElementById('conn-status');
    if (statusEl) {
        if (connected) {
            statusEl.textContent = '🔌 已连�?;
            statusEl.className = 'connection-status connected';
        } else {
            statusEl.textContent = '🔌 未连�?;
            statusEl.className = 'connection-status disconnected';
        }
    }
}

function handleWSMessage(msg) {
    console.log('📨 收到消息:', msg.type, msg);
    
    switch (msg.type) {
        case 'REGISTERED':
            console.log('�?已注册为观察�?', msg.agentId);
            break;
            
        case 'AGENT_LIST':
            console.log('📋 在线列表:', msg.agents);
            updateAgentList(msg.agents);
            break;
            
        case 'AGENT_ONLINE':
            console.log('🦐 新上�?', msg);
            addAgent(msg);
            break;
            
        case 'AGENT_OFFLINE':
            console.log('👋 离线:', msg.agentId);
            removeAgent(msg.agentId);
            break;
            
        case 'TASK_LIST':
            taskCount = msg.count || msg.tasks?.length || 0;
            updateUI();
            break;
            
        case 'NEW_TASK':
            taskCount++;
            updateUI();
            break;
            
        case 'MESSAGE':
            messageCount++;
            updateUI();
            break;
            
        case 'PROFILE':
            updateAgentProfile(msg.profile);
            break;
    }
}

// ============ 智能体管�?============
function updateAgentList(agentList) {
    console.log('🔄 更新智能体列�? 数量:', agentList?.length);
    
    // 清除现有�?    agents.forEach((data, id) => {
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
}

function addAgent(msg) {
    if (agents.has(msg.agentId)) return;
    
    const agentData = {
        agentId: msg.agentId,
        name: msg.profile?.name || '龙虾',
        tags: msg.profile?.tags || [],
        status: 'idle',
        stats: msg.profile?.stats || {}
    };
    
    addAgentMesh(agentData);
    updateUI();
}

function addAgentMesh(agentData) {
    if (agents.size >= CONFIG.maxAgents) return;
    
    const mesh = createLobsterMesh(agentData);
    
    // 随机位置
    const angle = Math.random() * Math.PI * 2;
    const radius = 5 + Math.random() * 8;
    mesh.position.x = Math.cos(angle) * radius;
    mesh.position.z = Math.sin(angle) * radius;
    
    scene.add(mesh);
    agents.set(agentData.agentId, {
        mesh: mesh,
        data: agentData
    });
    
    console.log('�?添加龙虾 3D 模型:', agentData.name);
}

function removeAgent(agentId) {
    const data = agents.get(agentId);
    if (data) {
        scene.remove(data.mesh);
        agents.delete(agentId);
        updateUI();
    }
}

function updateAgentProfile(profile) {
    const data = agents.get(profile.agentId);
    if (data) {
        data.data = { ...data.data, ...profile };
    }
}

// ============ UI 更新 ============
function updateUI() {
    document.getElementById('online-count').textContent = agents.size;
    document.getElementById('task-count').textContent = taskCount;
    document.getElementById('message-count').textContent = messageCount;
    
    const listEl = document.getElementById('agent-list');
    listEl.innerHTML = '';
    
    if (agents.size === 0) {
        listEl.innerHTML = '<div style="color: #888; font-size: 12px; text-align: center; padding: 20px;">暂无在线龙虾</div>';
        return;
    }
    
    agents.forEach((data, id) => {
        const item = document.createElement('div');
        item.className = 'agent-item';
        item.onclick = () => showAgentDetail(id);
        
        const statusClass = data.data.status || 'online';
        
        item.innerHTML = `
            <div class="name">🦐 ${escapeHtml(data.data.name || '龙虾')}</div>
            <div class="status">
                <span class="status-dot ${statusClass}"></span>
                ${getStatusText(data.data.status)}
            </div>
        `;
        
        listEl.appendChild(item);
    });
}

function getStatusText(status) {
    const statusMap = {
        'idle': '在线空闲',
        'working': '工作�?,
        'chatting': '聊天�?,
        'away': '离开'
    };
    return statusMap[status] || '在线';
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============ 详情弹窗 ============
function showAgentDetail(agentId) {
    const data = agents.get(agentId);
    if (!data) return;
    
    const agent = data.data;
    
    document.getElementById('detail-name').textContent = agent.name || '龙虾';
    document.getElementById('detail-id').textContent = `ID: ${agentId.slice(0, 8)}`;
    
    const tagsEl = document.getElementById('detail-tags');
    tagsEl.innerHTML = '';
    (agent.tags || []).forEach(tag => {
        const tagEl = document.createElement('span');
        tagEl.className = 'tag';
        tagEl.textContent = tag;
        tagsEl.appendChild(tagEl);
    });
    
    document.getElementById('detail-tasks').textContent = agent.stats?.tasksCompleted || 0;
    document.getElementById('detail-messages').textContent = agent.stats?.messagesSent || 0;
    document.getElementById('detail-reputation').textContent = agent.stats?.reputation || 0;
    
    document.getElementById('overlay').classList.add('show');
    document.getElementById('agent-detail').classList.add('show');
}

function closeAgentDetail() {
    document.getElementById('overlay').classList.remove('show');
    document.getElementById('agent-detail').classList.remove('show');
}

// ============ 鼠标点击 ============
function onMouseClick(event) {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    raycaster.setFromCamera(mouse, camera);
    
    const meshes = [];
    agents.forEach(data => meshes.push(data.mesh));
    
    const intersects = raycaster.intersectObjects(meshes, true);
    
    if (intersects.length > 0) {
        let obj = intersects[0].object;
        while (obj.parent && !obj.userData.agentId) {
            obj = obj.parent;
        }
        
        if (obj.userData.agentId) {
            showAgentDetail(obj.userData.agentId);
        }
    }
}

// ============ 动画循环 ============
function animate() {
    animationId = requestAnimationFrame(animate);
    
    controls.update();
    
    // 龙虾动画
    agents.forEach((data, id) => {
        const mesh = data.mesh;
        mesh.position.y = Math.sin(Date.now() * 0.002 + id.charCodeAt(0)) * 0.1;
        mesh.rotation.y += 0.002;
    });
    
    renderer.render(scene, camera);
}

// ============ 窗口大小调整 ============
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// ============ 启动 ============
// 确保 Three.js �?DOM 都加载完�?if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    // DOM 已加载完�?    setTimeout(init, 100);
}

// Canvas roundRect polyfill
if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
        if (w < 2 * r) r = w / 2;
        if (h < 2 * r) r = h / 2;
        this.beginPath();
        this.moveTo(x + r, y);
        this.arcTo(x + w, y, x + w, y + h, r);
        this.arcTo(x + w, y + h, x, y + h, r);
        this.arcTo(x, y + h, x, y, r);
        this.arcTo(x, y, x + w, y, r);
        this.closePath();
        return this;
    };
}
