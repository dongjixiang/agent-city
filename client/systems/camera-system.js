/**
 * Camera System - 相机控制系统
 * 管理相机模式、跟随和第一人称视角
 */
import * as THREE from 'three';

export class CameraSystem {
    constructor(app) {
        this.app = app;  // 主应用引用
        
        // 相机模式: 'orbit' | 'follow' | 'firstPerson'
        this.mode = 'orbit';
        
        // 跟随目标
        this.targetAgent = null;
        this.targetAgentId = null;
        
        // 相机参数
        this.followDistance = 10;   // 跟随距离
        this.followHeight = 5;     // 跟随高度
        this.firstPersonHeight = 1.6; // 第一人称视角高度
        
        // UI 元素
        this.controlBar = null;
        
        // 射线检测用于点击选中
        this.raycaster = null;
        this.mouse = null;
    }
    
    /**
     * 初始化
     */
    init(camera, controls, scene) {
        this.camera = camera;
        this.controls = controls;
        this.scene = scene;
        
        // 初始化射线检测
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        
        // 绑定点击事件
        const canvas = this.app.renderer?.domElement;
        if (canvas) {
            canvas.addEventListener('click', (e) => this.onCanvasClick(e));
        }
    }
    
    /**
     * 设置相机模式
     * @param {string} mode - 'orbit' | 'follow' | 'firstPerson'
     */
    setMode(mode) {
        const prevMode = this.mode;
        this.mode = mode;
        
        // 更新 OrbitControls 状态
        if (this.controls) {
            this.controls.enabled = (mode === 'orbit');
        }
        
        // 如果切换到 orbit 模式，清除目标并取消高亮
        if (mode === 'orbit') {
            if (this.targetAgentId === '__transformer__') {
                this._highlightTransformer(false);
            } else if (this.targetAgentId) {
                this.highlightAgent(this.targetAgentId, false);
            }
            this.targetAgent = null;
            this.targetAgentId = null;
            this.hideControlBar();
        }
        
        // 更新控制条 UI
        this.updateControlBar();
        
        console.log(`[CameraSystem] 相机模式: ${prevMode} -> ${mode}`);
    }
    
    /**
     * 设置跟随目标
     * @param {string} agentId - 智能体 ID
     */
    setTarget(agentId) {
        if (!agentId) {
            this.targetAgent = null;
            this.targetAgentId = null;
            this.hideControlBar();
            return;
        }
        
        const agent = this.app.systems.agent.getAgent(agentId);
        if (!agent) {
            console.log('[CameraSystem] 跟随目标不存在:', agentId);
            return;
        }
        
        this.targetAgent = agent;
        this.targetAgentId = agentId;
        console.log('[CameraSystem] 设置跟随目标:', agent.name);
        
        // 显示控制条
        this.showControlBar(agent.name);
        
        // 如果当前是 orbit 模式，切换到 follow 模式
        if (this.mode === 'orbit') {
            this.setMode('follow');
        }
    }
    
    /**
     * 点击画布选中智能体
     */
    onCanvasClick(event) {
        // 获取 canvas 元素
        const canvas = this.app.renderer?.domElement;
        if (!canvas) return;
        
        // 计算鼠标位置（归一化设备坐标）
        const rect = canvas.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        
        // 射线检测
        this.raycaster.setFromCamera(this.mouse, this.camera);
        
        // 获取所有智能体的 mesh
        const agentMeshes = [];
        this.app.systems.agent.agents.forEach((agent, id) => {
            if (agent.mesh) {
                agent.mesh.userData.agentId = id;
                agent.mesh.userData.agentName = agent.name;
                agentMeshes.push(agent.mesh);
            }
        });
        
        // 获取变形金刚的 mesh
        const transformerMesh = this.app.systems.transformer?.getTransformerMesh();
        if (transformerMesh) {
            transformerMesh.userData.agentId = '__transformer__';
            transformerMesh.userData.agentName = '🤖 变形金刚';
            transformerMesh.userData.isTransformer = true;
            agentMeshes.push(transformerMesh);
        }
        
        const intersects = this.raycaster.intersectObjects(agentMeshes, true);
        
        if (intersects.length > 0) {
            // 找到被点击的智能体
            let clickedMesh = intersects[0].object;
            // 向上查找有 agentId 的父对象
            while (clickedMesh && !clickedMesh.userData.agentId) {
                clickedMesh = clickedMesh.parent;
            }
            
            if (clickedMesh && clickedMesh.userData.agentId) {
                console.log('[CameraSystem] 点击选中:', clickedMesh.userData.agentName);
                
                // 检查是否是变形金刚
                if (clickedMesh.userData.isTransformer) {
                    this._handleTransformerClick();
                } else {
                    this.setTarget(clickedMesh.userData.agentId);
                    this.highlightAgent(clickedMesh.userData.agentId, true);
                    if (window.eventBus) {
                        window.eventBus.emit('agent:selected', { agentId: clickedMesh.userData.agentId, agentName: clickedMesh.userData.agentName });
                    }
                }
            }
        }
    }
    
    /**
     * 处理变形金刚点击
     */
    _handleTransformerClick() {
        // 变形金刚使用特殊的跟随逻辑
        // 设置一个假的 agent 对象用于相机跟随
        const transformerMesh = this.app.systems.transformer?.getTransformerMesh();
        if (!transformerMesh) return;
        
        // 创建虚拟的"智能体"用于相机跟随
        this.targetAgent = {
            id: '__transformer__',
            name: '🤖 变形金刚',
            mesh: transformerMesh,
            isTransformer: true
        };
        this.targetAgentId = '__transformer__';
        
        // 先激活变形金刚控制模式（确保 isActive 在相机更新前为 true）
        this.app.transformerController?.activate();
        
        // 如果当前是 orbit 模式，切换到 follow 模式
        if (this.mode === 'orbit') {
            this.setMode('follow');
        }
        
        // 显示控制条
        this.showControlBar('🤖 变形金刚');
    }

    /**
     * 高亮变形金刚
     */
    _highlightTransformer(highlight) {
        const mesh = this.app.systems.transformer?.getTransformerMesh();
        if (!mesh) return;
        
        mesh.traverse((child) => {
            if (child.isMesh && child.material && child.material.emissive) {
                child.material.emissive = highlight ? new THREE.Color(0xFFD700) : new THREE.Color(0x000000);
            }
        });
    }
    
    /**
     * 高亮智能体
     */
    highlightAgent(agentId, highlight) {
        const agent = this.app.systems.agent.getAgent(agentId);
        if (agent && agent.mesh) {
            // 简单的高亮效果 - 改变 emissive 颜色
            agent.mesh.traverse((child) => {
                if (child.isMesh && child.material) {
                    if (highlight) {
                        child.material.emissive = new THREE.Color(0x4ecdc4);
                    } else {
                        child.material.emissive = new THREE.Color(0x000000);
                    }
                }
            });
        }
    }
    
    /**
     * 更新相机位置（每帧调用）
     * @param {number} deltaTime - 时间增量
     */
    update(deltaTime) {
        // 只有在 follow 或 firstPerson 模式下才更新
        if (this.mode === 'orbit' || !this.targetAgent) {
            return;
        }
        
        const agent = this.targetAgent;
        const mesh = agent.mesh;
        if (!mesh) return;
        
        if (this.mode === 'follow') {
            // 跟随模式：相机在智能体正后方（控制模式下始终在后）
            // 变形金刚控制时使用专用跟随逻辑
            if (agent.isTransformer && this.app.transformerController?.isActive) {
                // 控制模式：相机在正后方
                const agentRotation = mesh.rotation.y;
                
                // 变形金刚高度根据形态变化：机器人较高（约3），汽车较低（约1.5）
                const transformer = this.app.systems.transformer?.transformer;
                const isRobot = transformer?.state?.isTransformed === true;
                const followHeight = isRobot ? 3.0 : 1.5;
                
                // 正后方 = rotation - PI（180度转向）
                const offsetX = -Math.sin(agentRotation) * this.followDistance;
                const offsetZ = -Math.cos(agentRotation) * this.followDistance;
                
                this.camera.position.x = mesh.position.x + offsetX;
                this.camera.position.z = mesh.position.z + offsetZ;
                this.camera.position.y = followHeight;
                
                // 相机看向变形金刚中心
                this.camera.lookAt(
                    mesh.position.x,
                    followHeight,
                    mesh.position.z
                );
            } else {
                // 普通跟随模式
                const agentRotation = mesh.rotation.y;
                const offsetX = -Math.sin(agentRotation) * this.followDistance;
                const offsetZ = -Math.cos(agentRotation) * this.followDistance;
                
                this.camera.position.x = mesh.position.x + offsetX;
                this.camera.position.z = mesh.position.z + offsetZ;
                this.camera.position.y = mesh.position.y + this.followHeight;
                
                // 相机看向智能体
                this.camera.lookAt(mesh.position.x, mesh.position.y + 1, mesh.position.z);
            }
        }
        else if (this.mode === 'firstPerson') {
            // 第一人称模式：相机在智能体头部位置
            // 变形金刚控制时使用专用逻辑
            if (agent.isTransformer) {
                // 根据形态决定高度
                const transformer = this.app.systems.transformer?.transformer;
                const isRobot = transformer?.state?.isTransformed === true;
                const fpHeight = isRobot ? 5.3 : 1.6; // 机器人头部约5.3m，汽车约1.6m
                
                this.camera.position.x = mesh.position.x;
                this.camera.position.y = fpHeight;
                this.camera.position.z = mesh.position.z;
                
                // 看向前方
                const lookX = Math.sin(mesh.rotation.y) * 10;
                const lookZ = Math.cos(mesh.rotation.y) * 10;
                this.camera.lookAt(
                    mesh.position.x + lookX,
                    fpHeight,
                    mesh.position.z + lookZ
                );
            } else {
                this.camera.position.x = mesh.position.x;
                this.camera.position.y = mesh.position.y + this.firstPersonHeight;
                this.camera.position.z = mesh.position.z;
                
                // 相机朝向与智能体朝向一致
                const lookX = Math.sin(mesh.rotation.y) * 10;
                const lookZ = Math.cos(mesh.rotation.y) * 10;
                this.camera.lookAt(
                    mesh.position.x + lookX,
                    mesh.position.y + this.firstPersonHeight,
                    mesh.position.z + lookZ
                );
            }
        }
    }
    
    /**
     * 显示控制条 UI - 位于世界之窗右侧
     */
    showControlBar(agentName) {
        // 如果已经存在，先移除
        this.hideControlBar();
        
        // 创建控制条 - 垂直排列在世界之窗右侧
        this.controlBar = document.createElement('div');
        this.controlBar.id = 'camera-control-bar';
        this.controlBar.innerHTML = `
            <style>
                #camera-control-bar {
                    position: fixed;
                    right: 20px;
                    bottom: 220px;
                    background: rgba(26, 26, 46, 0.92);
                    border-radius: 10px;
                    padding: 8px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 6px;
                    z-index: 999;
                    border: 1px solid rgba(78, 205, 196, 0.25);
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
                    font-family: 'Microsoft YaHei', sans-serif;
                    animation: fadeIn 0.3s ease;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateX(20px); }
                    to { opacity: 1; transform: translateX(0); }
                }
                #camera-control-bar .cam-label {
                    color: #4ecdc4;
                    font-size: 11px;
                    font-weight: bold;
                    margin-bottom: 4px;
                    text-align: center;
                }
                #camera-control-bar .cam-btn {
                    width: 36px;
                    height: 36px;
                    border-radius: 8px;
                    border: none;
                    cursor: pointer;
                    font-size: 16px;
                    transition: all 0.2s;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: rgba(255, 255, 255, 0.08);
                }
                #camera-control-bar .cam-btn.follow {
                    color: #4ecdc4;
                    border: 1px solid rgba(78, 205, 196, 0.3);
                }
                #camera-control-bar .cam-btn.follow.active {
                    background: #4ecdc4;
                    color: #1a1a2e;
                }
                #camera-control-bar .cam-btn.first-person {
                    color: #9c27b0;
                    border: 1px solid rgba(156, 39, 176, 0.3);
                }
                #camera-control-bar .cam-btn.first-person.active {
                    background: #9c27b0;
                    color: white;
                }
                #camera-control-bar .cam-btn.orbit {
                    color: #ff9800;
                    border: 1px solid rgba(255, 152, 0, 0.3);
                }
                #camera-control-bar .cam-btn.orbit.active {
                    background: #ff9800;
                    color: #1a1a2e;
                }
                #camera-control-bar .cam-btn:hover {
                    opacity: 0.85;
                    transform: scale(1.1);
                }
            </style>
            <div class="cam-label">🎯 ${agentName}</div>
            <button class="cam-btn follow active" onclick="window.app.systems.camera.setMode('follow')" title="跟随视角">👁️</button>
            <button class="cam-btn first-person" onclick="window.app.systems.camera.setMode('firstPerson')" title="第一人称">🎥</button>
            <button class="cam-btn orbit" onclick="window.app.systems.camera.setMode('orbit')" title="轨道视角">🌀</button>
        `;
        
        document.body.appendChild(this.controlBar);
    }
    
    /**
     * 隐藏控制条 UI
     */
    hideControlBar() {
        if (this.controlBar) {
            this.controlBar.remove();
            this.controlBar = null;
        }
    }
    
    /**
     * 更新控制条 UI（高亮当前模式）
     */
    updateControlBar() {
        if (!this.controlBar) return;
        
        const followBtn = this.controlBar.querySelector('.cam-btn.follow');
        const firstPersonBtn = this.controlBar.querySelector('.cam-btn.first-person');
        const orbitBtn = this.controlBar.querySelector('.cam-btn.orbit');
        
        // 移除所有 active 类
        followBtn?.classList.remove('active');
        firstPersonBtn?.classList.remove('active');
        orbitBtn?.classList.remove('active');
        
        // 添加当前模式的 active 类
        if (this.mode === 'follow') {
            followBtn?.classList.add('active');
        } else if (this.mode === 'firstPerson') {
            firstPersonBtn?.classList.add('active');
        } else if (this.mode === 'orbit') {
            orbitBtn?.classList.add('active');
        }
    }
}
