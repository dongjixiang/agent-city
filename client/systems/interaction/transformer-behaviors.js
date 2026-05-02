/**
 * TransformerBehaviors - 变形金刚 NPC 行为系统
 *
 * 管理变形金刚的巡逻、变形（机器人↔汽车）、动画
 *
 * @module systems/interaction/transformer-behaviors
 */

import * as THREE from 'three';

const TRANSFORMER_PATROL_ROUTE = [
    { x: 40, z: 35 },  // 广场中心
    { x: 40, z: 65 },  // 向北
    { x: 65, z: 65 },  // 向东
    { x: 65, z: 35 },  // 向南
    { x: 65, z: 5 },   // 向南到海边
    { x: 15, z: 5 },   // 向西
    { x: 15, z: 35 },  // 向北
    { x: -10, z: 35 }, // 向西
    { x: -10, z: 65 }, // 向北
    { x: -50, z: 65 }, // 向西到郊区
    { x: -50, z: 35 }, // 向南
    { x: -10, z: 35 }, // 返回
    { x: 40, z: 35 },  // 回到广场
];

class Transformer {
    constructor(scene) {
        this.scene = scene;
        this.group = null;           // 父容器
        this.robotMesh = null;       // 机器人形态
        this.carMesh = null;         // 汽车形态
        this.state = {
            x: 40,
            z: 35,
            targetX: 40,
            targetZ: 35,
            speed: 3.0,
            isTransformed: true,     // true=机器人, false=汽车
            transformTimer: 0,
            transformInterval: 8,    // 8秒变一次
            walkPhase: 0,
            waitTimer: 0,
            waitDuration: 2,
            currentPatrolIndex: 0,
            isTransforming: false,   // 正在变形中
            transformProgress: 0,    // 变形进度 0-1
            isControlled: false,      // 被控制中，不自动变形
        };
        this.bones = null;
    }

    /**
     * 创建变形金刚 mesh
     */
    createMesh() {
        this.group = new THREE.Group();
        this.group.position.set(this.state.x, 0, this.state.z);

        // 创建机器人形态
        this.robotMesh = this._createRobotMesh();
        this.group.add(this.robotMesh);

        // 创建汽车形态（初始隐藏）
        this.carMesh = this._createCarMesh();
        this.carMesh.visible = false;
        this.group.add(this.carMesh);

        // 初始化目标
        const firstTarget = TRANSFORMER_PATROL_ROUTE[0];
        this.state.targetX = firstTarget.x;
        this.state.targetZ = firstTarget.z;

        return this.group;
    }

    /**
     * 创建机器人形态
     */
    _createRobotMesh() {
        const group = new THREE.Group();

        const redMat = new THREE.MeshStandardMaterial({ color: 0xCC0000, metalness: 0.8, roughness: 0.3 });
        const blueMat = new THREE.MeshStandardMaterial({ color: 0x0033AA, metalness: 0.8, roughness: 0.3 });
        const silverMat = new THREE.MeshStandardMaterial({ color: 0xCCCCCC, metalness: 0.9, roughness: 0.2 });

        // 躯干
        const torso = new THREE.Mesh(new THREE.BoxGeometry(1.8, 2.5, 1.0), redMat);
        torso.position.y = 3.5;
        group.add(torso);

        // 头部
        const head = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.0, 0.8), silverMat);
        head.position.y = 5.3;
        group.add(head);

        // 眼睛
        const eyeMat = new THREE.MeshBasicMaterial({ color: 0x00FFFF });
        const leftEye = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.15, 0.1), eyeMat);
        leftEye.position.set(-0.25, 5.4, 0.4);
        group.add(leftEye);
        const rightEye = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.15, 0.1), eyeMat);
        rightEye.position.set(0.25, 5.4, 0.4);
        group.add(rightEye);

        // 天线
        const antenna = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.6, 0.1), silverMat);
        antenna.position.set(0, 6.0, 0);
        group.add(antenna);

        // 肩膀
        const leftShoulder = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.6, 0.8), blueMat);
        leftShoulder.position.set(-1.3, 4.5, 0);
        group.add(leftShoulder);
        const rightShoulder = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.6, 0.8), blueMat);
        rightShoulder.position.set(1.3, 4.5, 0);
        group.add(rightShoulder);

        // 手臂
        const leftArm = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.8, 0.5), redMat);
        leftArm.position.set(-1.3, 3.0, 0);
        group.add(leftArm);
        const rightArm = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.8, 0.5), redMat);
        rightArm.position.set(1.3, 3.0, 0);
        group.add(rightArm);

        // 拳头
        const leftFist = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.4), silverMat);
        leftFist.position.set(-1.3, 1.8, 0);
        group.add(leftFist);
        const rightFist = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.4), silverMat);
        rightFist.position.set(1.3, 1.8, 0);
        group.add(rightFist);

        // 腿部
        const leftThigh = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.5, 0.6), blueMat);
        leftThigh.position.set(-0.5, 1.5, 0);
        group.add(leftThigh);
        const rightThigh = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.5, 0.6), blueMat);
        rightThigh.position.set(0.5, 1.5, 0);
        group.add(rightThigh);

        const leftCalf = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.2, 0.5), silverMat);
        leftCalf.position.set(-0.5, 0.0, 0);
        group.add(leftCalf);
        const rightCalf = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.2, 0.5), silverMat);
        rightCalf.position.set(0.5, 0.0, 0);
        group.add(rightCalf);

        // 能量核心
        const coreMat = new THREE.MeshBasicMaterial({ color: 0xFF6600 });
        const core = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.2), coreMat);
        core.position.set(0, 3.8, 0.5);
        group.add(core);

        this.bones = { leftArm, rightArm, leftThigh, rightThigh, leftCalf, rightCalf };

        // 机器人形态的中心点在地面
        group.position.y = 0;

        return group;
    }

    /**
     * 创建汽车形态
     */
    _createCarMesh() {
        const group = new THREE.Group();

        const redMat = new THREE.MeshStandardMaterial({ color: 0xCC0000, metalness: 0.7, roughness: 0.4 });
        const blueMat = new THREE.MeshStandardMaterial({ color: 0x0033AA, metalness: 0.7, roughness: 0.4 });
        const glassMat = new THREE.MeshStandardMaterial({ color: 0x88CCFF, metalness: 0.9, roughness: 0.1, transparent: true, opacity: 0.7 });
        const silverMat = new THREE.MeshStandardMaterial({ color: 0xCCCCCC, metalness: 0.9, roughness: 0.2 });
        const blackMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });

        // 车身（主体）
        const bodyWidth = 2.0;
        const bodyLength = 4.0;
        const bodyHeight = 1.0;
        const body = new THREE.Mesh(
            new THREE.BoxGeometry(bodyWidth, bodyHeight, bodyLength),
            redMat
        );
        body.position.y = 0.8;
        group.add(body);

        // 车顶
        const roof = new THREE.Mesh(
            new THREE.BoxGeometry(1.6, 0.6, 2.0),
            redMat
        );
        roof.position.y = 1.6;
        roof.position.z = -0.3;
        group.add(roof);

        // 前挡风玻璃
        const windshield = new THREE.Mesh(
            new THREE.BoxGeometry(1.5, 0.5, 0.1),
            glassMat
        );
        windshield.position.set(0, 1.5, 0.9);
        windshield.rotation.x = 0.3;
        group.add(windshield);

        // 后窗
        const rearWindow = new THREE.Mesh(
            new THREE.BoxGeometry(1.5, 0.4, 0.1),
            glassMat
        );
        rearWindow.position.set(0, 1.4, -0.9);
        rearWindow.rotation.x = -0.3;
        group.add(rearWindow);

        // 车轮
        const wheelGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 16);
        wheelGeo.rotateZ(Math.PI / 2);
        const wheelPositions = [
            [-1.0, 0.4, 1.2],
            [1.0, 0.4, 1.2],
            [-1.0, 0.4, -1.2],
            [1.0, 0.4, -1.2],
        ];

        wheelPositions.forEach(pos => {
            const wheel = new THREE.Mesh(wheelGeo, blackMat);
            wheel.position.set(pos[0], pos[1], pos[2]);
            group.add(wheel);
        });

        // 大灯
        const lightMat = new THREE.MeshBasicMaterial({ color: 0xFFFF88 });
        const leftLight = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, 0.1), lightMat);
        leftLight.position.set(-0.6, 0.7, 2.0);
        group.add(leftLight);
        const rightLight = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, 0.1), lightMat);
        rightLight.position.set(0.6, 0.7, 2.0);
        group.add(rightLight);

        // 尾灯
        const tailMat = new THREE.MeshBasicMaterial({ color: 0xFF0000 });
        const leftTail = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.15, 0.1), tailMat);
        leftTail.position.set(-0.7, 0.7, -2.0);
        group.add(leftTail);
        const rightTail = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.15, 0.1), tailMat);
        rightTail.position.set(0.7, 0.7, -2.0);
        group.add(rightTail);

        // 车头标志（机器人眼睛位置变成车灯）
        const eyeMat = new THREE.MeshBasicMaterial({ color: 0x00FFFF });
        const frontEye = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.15, 0.1), eyeMat);
        frontEye.position.set(0, 1.1, 2.0);
        group.add(frontEye);

        // 能量核心（车尾）
        const coreMat = new THREE.MeshBasicMaterial({ color: 0xFF6600 });
        const core = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.2, 0.1), coreMat);
        core.position.set(0, 0.9, -2.0);
        group.add(core);

        // 汽车形态的中心也在地面
        group.position.y = 0;

        return group;
    }

    /**
     * 更新变形金刚（每帧调用）
     */
    update(deltaTime) {
        if (!this.group) return;

        const state = this.state;

        // 处理变形动画
        if (state.isTransforming) {
            this._updateTransformAnimation(deltaTime);
        }

        // 定时变形（被控制时不自动变形）
        if (!state.isTransforming && !state.isControlled && state.transformTimer >= state.transformInterval) {
            state.transformTimer = 0;
            this._startTransform();
        } else if (!state.isTransforming) {
            state.transformTimer += deltaTime;
        }

        // 移动逻辑
        const dx = state.targetX - this.group.position.x;
        const dz = state.targetZ - this.group.position.z;
        const dist = Math.sqrt(dx * dx + dz * dz);

        if (dist < 0.5) {
            // 到达目标，等待后前往下一个巡逻点
            state.waitTimer += deltaTime;
            if (state.waitTimer >= state.waitDuration) {
                state.waitTimer = 0;
                const nextIndex = (state.currentPatrolIndex + 1) % TRANSFORMER_PATROL_ROUTE.length;
                state.currentPatrolIndex = nextIndex;
                const next = TRANSFORMER_PATROL_ROUTE[nextIndex];
                state.targetX = next.x;
                state.targetZ = next.z;
            }
        } else {
            // 向目标移动
            // 汽车形态移动更快
            const speed = state.isTransformed ? state.speed : state.speed * 1.5;
            this.group.position.x += (dx / dist) * speed * deltaTime;
            this.group.position.z += (dz / dist) * speed * deltaTime;

            // 转向移动方向（+Z = North，atan2(dx, dz) 让汽车前方朝移动方向）
            this.group.rotation.y = Math.atan2(dx, dz);

            // 行走/行驶动画
            state.walkPhase += deltaTime * (state.isTransformed ? 6 : 10);
            const swing = Math.sin(state.walkPhase) * 0.3;

            if (state.isTransformed && this.bones) {
                // 机器人走路摆臂
                if (this.bones.leftArm) this.bones.leftArm.rotation.x = swing * 0.7;
                if (this.bones.rightArm) this.bones.rightArm.rotation.x = -swing * 0.7;
                if (this.bones.leftThigh) this.bones.leftThigh.rotation.x = -swing;
                if (this.bones.rightThigh) this.bones.rightThigh.rotation.x = swing;
            }
        }

        // 上下浮动效果（机器人形态有，汽车形态贴地）
        if (state.isTransformed && !state.isTransforming) {
            this.group.position.y = Math.sin(Date.now() * 0.003) * 0.05;
        } else {
            this.group.position.y = 0;
        }
    }

    /**
     * 开始变形
     */
    _startTransform() {
        this.state.isTransforming = true;
        this.state.transformProgress = 0;
        console.log('[Transformer] 开始变形！', this.state.isTransformed ? '机器人→汽车' : '汽车→机器人');
    }

    /**
     * 更新变形动画
     */
    _updateTransformAnimation(deltaTime) {
        this.state.transformProgress += deltaTime * 2; // 0.5秒完成变形

        if (this.state.transformProgress >= 1) {
            // 变形完成
            this.state.transformProgress = 1;
            this.state.isTransforming = false;
            this.state.isTransformed = !this.state.isTransformed;

            // 重置子 mesh 的旋转（确保变形后方向正确）
            this.robotMesh.rotation.y = 0;
            this.carMesh.rotation.y = 0;

            // 切换可见性
            if (this.robotMesh) this.robotMesh.visible = this.state.isTransformed;
            if (this.carMesh) this.carMesh.visible = !this.state.isTransformed;

            console.log('[Transformer] 变形完成！形态:', this.state.isTransformed ? '机器人' : '汽车');
        } else {
            // 变形中：旋转缩放过渡
            const t = this.state.transformProgress;
            const scale = 0.8 + 0.4 * Math.sin(t * Math.PI);

            if (this.state.isTransformed) {
                // 机器人→汽车：变形中的mesh保持正确朝向，隐藏中的mesh重置旋转
                if (this.robotMesh) {
                    this.robotMesh.scale.set(scale, scale, scale);
                    this.robotMesh.rotation.y = 0; // 变形中保持正确方向
                }
                if (this.carMesh) {
                    this.carMesh.scale.set(1 - t * 0.5, 1 - t * 0.5, 1 - t * 0.5);
                    this.carMesh.rotation.y = 0;
                }
            } else {
                // 汽车→机器人：变形中的mesh保持正确朝向，隐藏中的mesh重置旋转
                if (this.carMesh) {
                    this.carMesh.scale.set(scale, scale, scale);
                    this.carMesh.rotation.y = 0; // 变形中保持正确方向
                }
                if (this.robotMesh) {
                    this.robotMesh.scale.set(1 - t * 0.5, 1 - t * 0.5, 1 - t * 0.5);
                    this.robotMesh.rotation.y = 0;
                }
            }
        }
    }
}

class TransformerBehaviors {
    constructor() {
        this.transformer = null;
        this.scene = null;
    }

    /**
     * 初始化
     */
    init(scene) {
        this.scene = scene;
        this.transformer = new Transformer(scene);
        const mesh = this.transformer.createMesh();
        scene.add(mesh);
        console.log('[TransformerBehaviors] 变形金刚已加入城市巡逻！');
    }

    /**
     * 更新所有变形金刚
     */
    update(deltaTime) {
        if (this.transformer) {
            this.transformer.update(deltaTime);
        }
    }

    /**
     * 获取变形金刚 mesh（用于射线检测）
     */
    getTransformerMesh() {
        return this.transformer?.group || null;
    }

    /**
     * 检查点是否在变形金刚范围内
     */
    isPointInTransformer(x, z) {
        if (!this.transformer?.group) return false;
        const pos = this.transformer.group.position;
        const dx = x - pos.x;
        const dz = z - pos.z;
        return Math.sqrt(dx * dx + dz * dz) < 2; // 2米范围内
    }
}

export { TransformerBehaviors, Transformer, TRANSFORMER_PATROL_ROUTE };