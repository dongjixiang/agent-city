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
            speed: 1.5,              // 降低速度：1.5 单位/秒（原3.0太快）
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
        
        // ========== 战斗系统 ==========
        this.maxHealth = 150; // 最大血量（擎天柱稍低）
        this.health = 150;    // 当前血量
        this.isDead = false;   // 是否死亡
        this.respawnTimer = 0; // 复活倒计时
        this.respawnTime = 60; // 复活时间（秒）
        this.invincible = false; // 无敌状态
        this.invincibleTimer = 0;
        
        // 攻击动作定义
        this.attackActions = {
            // 机器人形态近战攻击
            punch: {
                name: '重拳',
                damage: 20,
                cooldown: 1.2,
                range: 3,
                lastUsed: 0,
                animation: 'punch'
            },
            shieldBash: {
                name: '盾牌冲击',
                damage: 30,
                cooldown: 2.0,
                range: 3.5,
                lastUsed: 0,
                animation: 'shieldBash'
            },
            // 汽车形态攻击
            ram: {
                name: '冲撞',
                damage: 45,
                cooldown: 2.5,
                range: 6,
                lastUsed: 0,
                animation: 'ram'
            },
            boost: {
                name: '加速冲击',
                damage: 60,
                cooldown: 4.0,
                range: 8,
                lastUsed: 0,
                animation: 'boost'
            }
        };
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

        // 添加隐形点击区域（更大的碰撞盒，便于点击）
        const hitboxGeo = new THREE.BoxGeometry(4, 8, 4);
        const hitboxMat = new THREE.MeshBasicMaterial({ visible: false });
        const hitbox = new THREE.Mesh(hitboxGeo, hitboxMat);
        hitbox.position.y = 3.5; // 中心在中间高度
        this.group.add(hitbox);
        this.hitbox = hitbox;

        // 初始化目标
        const firstTarget = TRANSFORMER_PATROL_ROUTE[0];
        this.state.targetX = firstTarget.x;
        this.state.targetZ = firstTarget.z;

        return this.group;
    }

    /**
     * 创建机器人形态 - 精细版本
     */
    _createRobotMesh() {
        const group = new THREE.Group();

        // 配色方案：红蓝经典变形金刚配色
        const redMat = new THREE.MeshStandardMaterial({ color: 0xDD1111, metalness: 0.85, roughness: 0.25 });
        const darkRedMat = new THREE.MeshStandardMaterial({ color: 0xAA0000, metalness: 0.8, roughness: 0.3 });
        const blueMat = new THREE.MeshStandardMaterial({ color: 0x0044AA, metalness: 0.85, roughness: 0.25 });
        const darkBlueMat = new THREE.MeshStandardMaterial({ color: 0x002266, metalness: 0.8, roughness: 0.3 });
        const silverMat = new THREE.MeshStandardMaterial({ color: 0xDDDDDD, metalness: 0.95, roughness: 0.15 });
        const darkSilverMat = new THREE.MeshStandardMaterial({ color: 0xAAAAAA, metalness: 0.9, roughness: 0.2 });
        const blackMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.5, roughness: 0.7 });

        // ========== 躯干 ==========
        // 主躯干 - 红色胸甲
        const torso = new THREE.Mesh(new THREE.BoxGeometry(2.0, 2.6, 1.1), redMat);
        torso.position.y = 3.5;
        torso.castShadow = true;
        group.add(torso);

        // 胸部中央蓝色甲壳
        const chestPlate = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.4, 0.3), blueMat);
        chestPlate.position.set(0, 3.8, 0.5);
        chestPlate.castShadow = true;
        group.add(chestPlate);

        // 能量核心 - 发光效果
        const coreMat = new THREE.MeshBasicMaterial({ color: 0xFF6600 });
        const coreGlow = new THREE.Mesh(new THREE.SphereGeometry(0.25, 16, 16), coreMat);
        coreGlow.position.set(0, 3.8, 0.65);
        group.add(coreGlow);

        // 颈部
        const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 0.3, 8), silverMat);
        neck.position.set(0, 4.95, 0);
        group.add(neck);

        // ========== 头部 ==========
        // 主头部 - 银色
        const head = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.0, 0.9), silverMat);
        head.position.y = 5.6;
        head.castShadow = true;
        group.add(head);

        // 头顶
        const headTop = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.25, 0.7), darkSilverMat);
        headTop.position.set(0, 6.15, 0);
        group.add(headTop);

        // 面罩 - 蓝色
        const visor = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.35, 0.15), blueMat);
        visor.position.set(0, 5.65, 0.45);
        group.add(visor);

        // 眼睛 - 青色发光
        const eyeMat = new THREE.MeshBasicMaterial({ color: 0x00FFFF });
        const leftEye = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.12, 0.1), eyeMat);
        leftEye.position.set(-0.22, 5.72, 0.45);
        group.add(leftEye);
        const rightEye = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.12, 0.1), eyeMat);
        rightEye.position.set(0.22, 5.72, 0.45);
        group.add(rightEye);

        // 耳朵/声音采集器
        const earGeo = new THREE.BoxGeometry(0.15, 0.3, 0.2);
        const leftEar = new THREE.Mesh(earGeo, darkSilverMat);
        leftEar.position.set(-0.65, 5.6, 0);
        group.add(leftEar);
        const rightEar = new THREE.Mesh(earGeo, darkSilverMat);
        rightEar.position.set(0.65, 5.6, 0);
        group.add(rightEar);

        // 天线
        const antennaGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.6, 6);
        const antenna = new THREE.Mesh(antennaGeo, darkSilverMat);
        antenna.position.set(0, 6.5, 0);
        group.add(antenna);
        const antennaTip = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), coreMat);
        antennaTip.position.set(0, 6.82, 0);
        group.add(antennaTip);

        // ========== 肩膀 ==========
        // 左肩甲
        const shoulderGeo = new THREE.BoxGeometry(0.7, 0.7, 0.8);
        const leftShoulder = new THREE.Mesh(shoulderGeo, blueMat);
        leftShoulder.position.set(-1.4, 4.6, 0);
        leftShoulder.castShadow = true;
        group.add(leftShoulder);
        // 肩部关节球
        const shoulderJointGeo = new THREE.SphereGeometry(0.25, 12, 12);
        const leftShoulderJoint = new THREE.Mesh(shoulderJointGeo, silverMat);
        leftShoulderJoint.position.set(-1.15, 4.35, 0);
        group.add(leftShoulderJoint);

        // 右肩甲
        const rightShoulder = new THREE.Mesh(shoulderGeo, blueMat);
        rightShoulder.position.set(1.4, 4.6, 0);
        rightShoulder.castShadow = true;
        group.add(rightShoulder);
        const rightShoulderJoint = new THREE.Mesh(shoulderJointGeo, silverMat);
        rightShoulderJoint.position.set(1.15, 4.35, 0);
        group.add(rightShoulderJoint);

        // ========== 手臂 ==========
        // 左上臂
        const leftArmUpper = new THREE.Mesh(new THREE.BoxGeometry(0.55, 1.2, 0.55), redMat);
        leftArmUpper.position.set(-1.15, 3.5, 0);
        leftArmUpper.castShadow = true;
        group.add(leftArmUpper);

        // 左肘关节
        const elbowGeo = new THREE.SphereGeometry(0.22, 10, 10);
        const leftElbow = new THREE.Mesh(elbowGeo, darkSilverMat);
        leftElbow.position.set(-1.15, 2.7, 0);
        group.add(leftElbow);

        // 左前臂
        const leftArmLower = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.1, 0.5), darkRedMat);
        leftArmLower.position.set(-1.15, 1.95, 0);
        leftArmLower.castShadow = true;
        group.add(leftArmLower);

        // 左手
        const leftHand = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.4, 0.35), silverMat);
        leftHand.position.set(-1.15, 1.1, 0);
        leftHand.castShadow = true;
        group.add(leftHand);

        // 右臂
        const rightArmUpper = new THREE.Mesh(new THREE.BoxGeometry(0.55, 1.2, 0.55), redMat);
        rightArmUpper.position.set(1.15, 3.5, 0);
        rightArmUpper.castShadow = true;
        group.add(rightArmUpper);
        const rightElbow = new THREE.Mesh(elbowGeo, darkSilverMat);
        rightElbow.position.set(1.15, 2.7, 0);
        group.add(rightElbow);
        const rightArmLower = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.1, 0.5), darkRedMat);
        rightArmLower.position.set(1.15, 1.95, 0);
        rightArmLower.castShadow = true;
        group.add(rightArmLower);
        const rightHand = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.4, 0.35), silverMat);
        rightHand.position.set(1.15, 1.1, 0);
        rightHand.castShadow = true;
        group.add(rightHand);

        // ========== 腰部 ==========
        const waist = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.5, 0.8), darkSilverMat);
        waist.position.set(0, 1.9, 0);
        waist.castShadow = true;
        group.add(waist);

        // ========== 腿部 ==========
        // 左大腿
        const leftThigh = new THREE.Mesh(new THREE.BoxGeometry(0.65, 1.5, 0.7), blueMat);
        leftThigh.position.set(-0.45, 1.0, 0);
        leftThigh.castShadow = true;
        group.add(leftThigh);

        // 左膝关节
        const kneeGeo = new THREE.SphereGeometry(0.22, 10, 10);
        const leftKnee = new THREE.Mesh(kneeGeo, darkSilverMat);
        leftKnee.position.set(-0.45, 0.15, 0);
        group.add(leftKnee);

        // 左小腿
        const leftCalf = new THREE.Mesh(new THREE.BoxGeometry(0.55, 1.2, 0.6), darkBlueMat);
        leftCalf.position.set(-0.45, -0.65, 0);
        leftCalf.castShadow = true;
        group.add(leftCalf);

        // 左脚
        const leftFoot = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.3, 0.8), silverMat);
        leftFoot.position.set(-0.45, -1.35, 0.1);
        leftFoot.castShadow = true;
        group.add(leftFoot);

        // 右腿
        const rightThigh = new THREE.Mesh(new THREE.BoxGeometry(0.65, 1.5, 0.7), blueMat);
        rightThigh.position.set(0.45, 1.0, 0);
        rightThigh.castShadow = true;
        group.add(rightThigh);
        const rightKnee = new THREE.Mesh(kneeGeo, darkSilverMat);
        rightKnee.position.set(0.45, 0.15, 0);
        group.add(rightKnee);
        const rightCalf = new THREE.Mesh(new THREE.BoxGeometry(0.55, 1.2, 0.6), darkBlueMat);
        rightCalf.position.set(0.45, -0.65, 0);
        rightCalf.castShadow = true;
        group.add(rightCalf);
        const rightFoot = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.3, 0.8), silverMat);
        rightFoot.position.set(0.45, -1.35, 0.1);
        rightFoot.castShadow = true;
        group.add(rightFoot);

        // 背部散热片
        const backFin = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.0, 0.1), darkSilverMat);
        backFin.position.set(0, 4.0, -0.55);
        backFin.rotation.x = 0.2;
        group.add(backFin);

        this.bones = { leftArm: leftArmUpper, rightArm: rightArmUpper, leftThigh, rightThigh, leftCalf, rightCalf };

        group.position.y = 0;
        return group;
    }

    /**
     * 创建汽车形态 - 精细版本
     */
    _createCarMesh() {
        const group = new THREE.Group();

        // 配色
        const redMat = new THREE.MeshStandardMaterial({ color: 0xDD1111, metalness: 0.85, roughness: 0.2 });
        const darkRedMat = new THREE.MeshStandardMaterial({ color: 0xAA0000, metalness: 0.8, roughness: 0.25 });
        const blueMat = new THREE.MeshStandardMaterial({ color: 0x0044AA, metalness: 0.85, roughness: 0.2 });
        const glassMat = new THREE.MeshStandardMaterial({ color: 0x4488AA, metalness: 0.95, roughness: 0.05, transparent: true, opacity: 0.65 });
        const silverMat = new THREE.MeshStandardMaterial({ color: 0xDDDDDD, metalness: 0.95, roughness: 0.1 });
        const blackMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.8, metalness: 0.3 });
        const chromeMat = new THREE.MeshStandardMaterial({ color: 0xEEEEEE, metalness: 1.0, roughness: 0.05 });

        // ========== 车身主体 ==========
        // 主车身 - 楔形设计
        const bodyGeo = new THREE.BoxGeometry(2.1, 0.85, 4.2);
        const body = new THREE.Mesh(bodyGeo, redMat);
        body.position.set(0, 0.75, 0);
        body.castShadow = true;
        group.add(body);

        // 车头倾斜部
        const hoodGeo = new THREE.BoxGeometry(1.8, 0.35, 1.2);
        const hood = new THREE.Mesh(hoodGeo, redMat);
        hood.position.set(0, 1.2, 1.4);
        hood.rotation.x = -0.25;
        hood.castShadow = true;
        group.add(hood);

        // 发动机盖
        const engineHood = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.15, 1.0), darkRedMat);
        engineHood.position.set(0, 1.45, 1.5);
        engineHood.castShadow = true;
        group.add(engineHood);

        // 前格栅
        const grilleGeo = new THREE.BoxGeometry(1.4, 0.4, 0.1);
        const grille = new THREE.Mesh(grilleGeo, chromeMat);
        grille.position.set(0, 0.6, 2.05);
        group.add(grille);
        // 格栅条纹
        for (let i = -3; i <= 3; i++) {
            const bar = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.35, 0.05), blackMat);
            bar.position.set(i * 0.18, 0.6, 2.1);
            group.add(bar);
        }

        // ========== 车顶和车窗 ==========
        // 车顶
        const roofGeo = new THREE.BoxGeometry(1.7, 0.5, 1.8);
        const roof = new THREE.Mesh(roofGeo, redMat);
        roof.position.set(0, 1.65, -0.3);
        roof.castShadow = true;
        group.add(roof);

        // 前挡风玻璃
        const windshieldGeo = new THREE.BoxGeometry(1.55, 0.55, 0.08);
        const windshield = new THREE.Mesh(windshieldGeo, glassMat);
        windshield.position.set(0, 1.6, 0.7);
        windshield.rotation.x = 0.4;
        group.add(windshield);

        // 侧窗
        const sideWindowGeo = new THREE.BoxGeometry(0.08, 0.4, 1.2);
        const leftWindow = new THREE.Mesh(sideWindowGeo, glassMat);
        leftWindow.position.set(-0.85, 1.65, -0.3);
        group.add(leftWindow);
        const rightWindow = new THREE.Mesh(sideWindowGeo, glassMat);
        rightWindow.position.set(0.85, 1.65, -0.3);
        group.add(rightWindow);

        // 后窗
        const rearWindowGeo = new THREE.BoxGeometry(1.55, 0.4, 0.08);
        const rearWindow = new THREE.Mesh(rearWindowGeo, glassMat);
        rearWindow.position.set(0, 1.55, -1.15);
        rearWindow.rotation.x = -0.3;
        group.add(rearWindow);

        // ========== 大灯 ==========
        // 主大灯
        const headlightMat = new THREE.MeshBasicMaterial({ color: 0xFFFFAA });
        const leftHeadlight = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.2, 0.08), headlightMat);
        leftHeadlight.position.set(-0.65, 0.75, 2.08);
        group.add(leftHeadlight);
        const rightHeadlight = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.2, 0.08), headlightMat);
        rightHeadlight.position.set(0.65, 0.75, 2.08);
        group.add(rightHeadlight);

        // 雾灯
        const fogLightMat = new THREE.MeshBasicMaterial({ color: 0xFFFF00 });
        const leftFogLight = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.12, 0.05), fogLightMat);
        leftFogLight.position.set(-0.5, 0.35, 2.1);
        group.add(leftFogLight);
        const rightFogLight = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.12, 0.05), fogLightMat);
        rightFogLight.position.set(0.5, 0.35, 2.1);
        group.add(rightFogLight);

        // 转向灯
        const turnSignalMat = new THREE.MeshBasicMaterial({ color: 0xFF8800 });
        const leftTurnSignal = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.1, 0.05), turnSignalMat);
        leftTurnSignal.position.set(-0.85, 0.75, 2.05);
        group.add(leftTurnSignal);
        const rightTurnSignal = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.1, 0.05), turnSignalMat);
        rightTurnSignal.position.set(0.85, 0.75, 2.05);
        group.add(rightTurnSignal);

        // ========== 尾灯 ==========
        const tailLightMat = new THREE.MeshBasicMaterial({ color: 0xFF0000 });
        const leftTailLight = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.15, 0.08), tailLightMat);
        leftTailLight.position.set(-0.7, 0.75, -2.08);
        group.add(leftTailLight);
        const rightTailLight = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.15, 0.08), tailLightMat);
        rightTailLight.position.set(0.7, 0.75, -2.08);
        group.add(rightTailLight);

        // 刹车灯
        const brakeLightMat = new THREE.MeshBasicMaterial({ color: 0xFF3333 });
        const leftBrakeLight = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.1, 0.05), brakeLightMat);
        leftBrakeLight.position.set(-0.6, 0.95, -2.08);
        group.add(leftBrakeLight);
        const rightBrakeLight = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.1, 0.05), brakeLightMat);
        rightBrakeLight.position.set(0.6, 0.95, -2.08);
        group.add(rightBrakeLight);

        // 车牌
        const plateMat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
        const plate = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.15, 0.02), plateMat);
        plate.position.set(0, 0.45, 2.12);
        group.add(plate);

        // ========== 车轮 ==========
        const wheelGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.35, 20);
        wheelGeo.rotateZ(Math.PI / 2);
        const wheelPositions = [
            [-1.05, 0.42, 1.3],
            [1.05, 0.42, 1.3],
            [-1.05, 0.42, -1.3],
            [1.05, 0.42, -1.3],
        ];

        wheelPositions.forEach((pos, idx) => {
            // 轮胎
            const tire = new THREE.Mesh(wheelGeo, blackMat);
            tire.position.set(pos[0], pos[1], pos[2]);
            tire.castShadow = true;
            group.add(tire);

            // 轮毂
            const rimGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.36, 6);
            rimGeo.rotateZ(Math.PI / 2);
            const rim = new THREE.Mesh(rimGeo, silverMat);
            rim.position.set(pos[0], pos[1], pos[2]);
            group.add(rim);

            // 轮毂中心
            const hubGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.38, 8);
            hubGeo.rotateZ(Math.PI / 2);
            const hub = new THREE.Mesh(hubGeo, chromeMat);
            hub.position.set(pos[0], pos[1], pos[2]);
            group.add(hub);
        });

        // ========== 后视镜 ==========
        const mirrorGeo = new THREE.BoxGeometry(0.15, 0.12, 0.2);
        const leftMirror = new THREE.Mesh(mirrorGeo, redMat);
        leftMirror.position.set(-1.15, 1.3, 0.5);
        group.add(leftMirror);
        const rightMirror = new THREE.Mesh(mirrorGeo, redMat);
        rightMirror.position.set(1.15, 1.3, 0.5);
        group.add(rightMirror);

        // ========== 车尾装饰 ==========
        // 扰流板
        const spoilerGeo = new THREE.BoxGeometry(1.6, 0.08, 0.3);
        const spoiler = new THREE.Mesh(spoilerGeo, darkRedMat);
        spoiler.position.set(0, 1.35, -1.5);
        group.add(spoiler);
        // 扰流板支架
        const spoilerStandGeo = new THREE.BoxGeometry(0.08, 0.2, 0.08);
        const leftSpoilerStand = new THREE.Mesh(spoilerStandGeo, silverMat);
        leftSpoilerStand.position.set(-0.6, 1.25, -1.5);
        group.add(leftSpoilerStand);
        const rightSpoilerStand = new THREE.Mesh(spoilerStandGeo, silverMat);
        rightSpoilerStand.position.set(0.6, 1.25, -1.5);
        group.add(rightSpoilerStand);

        // 排气管
        const exhaustGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.2, 8);
        exhaustGeo.rotateX(Math.PI / 2);
        const leftExhaust = new THREE.Mesh(exhaustGeo, chromeMat);
        leftExhaust.position.set(-0.4, 0.25, -2.15);
        group.add(leftExhaust);
        const rightExhaust = new THREE.Mesh(exhaustGeo, chromeMat);
        rightExhaust.position.set(0.4, 0.25, -2.15);
        group.add(rightExhaust);

        // 汽车形态的中心在地面
        group.position.y = 0;
        return group;
    }

    /**
     * 更新变形金刚（每帧调用）
     */
    update(deltaTime) {
        if (!this.group) return;

        const state = this.state;

        // ========== 死亡和复活 ==========
        if (this.isDead) {
            this.respawnTimer -= deltaTime;
            if (this.respawnTimer <= 0) {
                this.respawn();
            }
            return;
        }
        
        // 无敌状态更新
        if (this.invincible) {
            this.invincibleTimer -= deltaTime;
            if (this.invincibleTimer <= 0) {
                this.invincible = false;
            }
        }

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
    
    // ========== 战斗系统方法 ==========
    
    /**
     * 执行攻击动作
     */
    performAttack(actionName, target = null) {
        if (this.isDead) return false;
        
        const action = this.attackActions[actionName];
        if (!action) return false;
        
        const now = Date.now();
        const cooldownMs = action.cooldown * 1000;
        
        if (now - action.lastUsed < cooldownMs) {
            console.log(`[Transformer] ${action.name} 冷却中...`);
            return false;
        }
        
        action.lastUsed = now;
        
        const isRobot = this.state.isTransformed;
        
        // 检查攻击是否适合当前形态
        if (actionName === 'punch' && !isRobot) return false;
        if (actionName === 'shieldBash' && !isRobot) return false;
        if (actionName === 'ram' && isRobot) return false;
        if (actionName === 'boost' && isRobot) return false;
        
        // 执行攻击动画
        this.playAttackAnimation(actionName);
        
        // 造成伤害
        if (target) {
            const dist = this.getDistanceTo(target);
            if (dist <= action.range) {
                target.takeDamage(action.damage, this);
                console.log(`[Transformer] ${action.name} 命中！伤害: ${action.damage}`);
            }
        } else {
            console.log(`[Transformer] ${action.name}！伤害: ${action.damage}`);
        }
        
        return true;
    }
    
    /**
     * 播放攻击动画
     */
    playAttackAnimation(actionName) {
        if (!this.group) return;
        
        const duration = 300;
        const originalScale = this.group.scale.clone();
        
        switch(actionName) {
            case 'punch':
                this.group.scale.z = 1.2;
                setTimeout(() => { this.group.scale.copy(originalScale); }, duration);
                break;
            case 'shieldBash':
                this.group.rotation.y += 0.4;
                setTimeout(() => { this.group.rotation.y -= 0.4; }, duration);
                break;
            case 'ram':
                this.group.scale.x = 1.15;
                setTimeout(() => { this.group.scale.x = 1.0; }, duration);
                break;
            case 'boost':
                this.group.scale.y = 0.85;
                setTimeout(() => { this.group.scale.y = 1.0; }, duration * 2);
                break;
        }
    }
    
    /**
     * 获取到目标的距离
     */
    getDistanceTo(target) {
        if (!target || !target.position) return Infinity;
        const dx = target.position.x - this.state.x;
        const dz = target.position.z - this.state.z;
        return Math.sqrt(dx * dx + dz * dz);
    }
    
    /**
     * 受到伤害
     */
    takeDamage(amount, attacker) {
        if (this.isDead || this.invincible) return;
        
        this.health -= amount;
        console.log(`[Transformer] 受到 ${amount} 点伤害！剩余血量: ${this.health}/${this.maxHealth}`);
        
        // 受伤闪烁效果
        this.playDamageEffect();
        
        if (this.health <= 0) {
            this.die(attacker);
        }
    }
    
    /**
     * 受伤特效
     */
    playDamageEffect() {
        if (!this.group) return;
        
        const flash = () => {
            this.group.traverse((child) => {
                if (child.isMesh && child.material && child.material.emissive) {
                    child.material.emissive.setHex(0xff0000);
                }
            });
        };
        
        flash();
        setTimeout(flash, 100);
        setTimeout(flash, 200);
    }
    
    /**
     * 死亡
     */
    die(killer) {
        console.log(`[Transformer] 被击败！`);
        this.isDead = true;
        this.health = 0;
        
        if (this.group) {
            this.group.visible = false;
        }
        
        this.state.targetX = this.state.x;
        this.state.targetZ = this.state.z;
        
        this.respawnTimer = this.respawnTime;
        console.log(`[Transformer] 将在 ${this.respawnTime} 秒后复活...`);
    }
    
    /**
     * 复活
     */
    respawn() {
        console.log(`[Transformer] 复活！`);
        this.isDead = false;
        this.health = this.maxHealth;
        this.respawnTimer = 0;
        this.invincible = true;
        this.invincibleTimer = 3;
        
        if (this.group) {
            this.group.visible = true;
            this.group.position.set(this.state.x, 0, this.state.z);
        }
        
        this.state.x = 40;
        this.state.z = 35;
        this.state.isTransformed = true;
        
        if (this.robotMesh) this.robotMesh.visible = true;
        if (this.carMesh) this.carMesh.visible = false;
        
        console.log(`[Transformer] 复活成功！血量: ${this.health}/${this.maxHealth}`);
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