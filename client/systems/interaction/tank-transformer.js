/**
 * 坦克变形金刚 (TankTransformer)
 * 可以在坦克形态和机器人形态之间切换
 * 坦克形态可以发射炮弹
 * 机器人形态可以使用近战攻击
 */

import * as THREE from 'three';

export class TankTransformer {
    constructor(scene, agentId, startPosition) {
        this.scene = scene;
        this.agentId = agentId;
        this.position = startPosition || { x: 0, z: 0 };
        this.rotation = 0;
        this.isTransformed = false; // false = robot, true = tank
        this.isMoving = false;
        this.isControlled = false;
        this.canShoot = true;
        this.shootCooldown = 1000; // 1秒冷却
        this.lastShootTime = 0;
        this.mesh = null;
        this.tankMesh = null;
        this.robotMesh = null;
        this.projectiles = [];
        this.targetPosition = null;
        this.patrolRoute = [
            { x: -20, z: -20 },
            { x: -15, z: -20 },
            { x: -15, z: -15 },
            { x: -20, z: -15 }
        ];
        this.patrolIndex = 0;
        this.speed = 0.15;
        
        // ========== 战斗系统 ==========
        this.maxHealth = 200; // 最大血量
        this.health = 200;    // 当前血量
        this.isDead = false;   // 是否死亡
        this.respawnTimer = 0; // 复活倒计时
        this.respawnTime = 60; // 复活时间（秒）
        this.invincible = false; // 无敌状态
        this.invincibleTimer = 0;
        
        // 攻击动作定义
        this.attackActions = {
            // 机器人形态近战攻击
            punch: {
                name: '拳击',
                damage: 15,
                cooldown: 1.5,    // 1.5秒冷却
                range: 3,        // 近战范围
                lastUsed: 0,
                animation: 'punch'
            },
            slash: {
                name: '利爪斩',
                damage: 25,
                cooldown: 2.5,    // 2.5秒冷却
                range: 4,        // 稍大范围
                lastUsed: 0,
                animation: 'slash'
            },
            // 坦克形态攻击
            shoot: {
                name: '主炮射击',
                damage: 50,
                cooldown: 3.0,    // 3秒冷却
                range: 100,      // 远程
                lastUsed: 0,
                animation: 'shoot'
            },
            crush: {
                name: '碾压',
                damage: 80,
                cooldown: 5.0,    // 5秒冷却（高伤害）
                range: 5,        // 需要近距离
                lastUsed: 0,
                animation: 'crush'
            }
        };
        
        // 攻击特效
        this.attackEffect = null;
        
        // 自动变形计时器
        this.transformTimer = 0;
        this.transformInterval = 8; // 8秒自动变形一次
        
        // 状态对象（用于兼容控制器）
        this.state = {
            isTransforming: false
        };
        
        this.init();
    }
    
    init() {
        this.createRobotMesh();
        this.createTankMesh();
        this.mesh = this.robotMesh;
        
        // 初始化旋转 - 确保 mesh.rotation.y 和 tank.rotation 同步
        this.mesh.rotation.y = -this.rotation; // rotation=0，所以 mesh.rotation.y = 0
        
        // 创建时直接设置位置
        this.mesh.position.set(this.position.x, 0, this.position.z);
        
        // 添加点击标识
        this.mesh.userData.agentId = 'tank001';
        this.mesh.userData.agentName = '坦克变形金刚';
        this.mesh.userData.isTankTransformer = true;
        
        // 添加隐形点击区域（便于点击）
        const hitboxGeo = new THREE.BoxGeometry(4, 6, 4);
        const hitboxMat = new THREE.MeshBasicMaterial({ visible: false });
        const hitbox = new THREE.Mesh(hitboxGeo, hitboxMat);
        hitbox.position.y = 2.5;
        this.mesh.add(hitbox);
        
        this.scene.add(this.mesh);
        console.log(`[TankTransformer] 初始化完成，位置: (${this.position.x}, ${this.position.z})，rotation: ${this.rotation}，mesh.rotation.y: ${this.mesh.rotation.y}`);
    }
    
    createRobotMesh() {
        // 机器人形态 - 威震天风格精细版（银色+紫色+重型装甲）
        const robotGroup = new THREE.Group();

        // 材质定义
        const silverMat = new THREE.MeshStandardMaterial({ color: 0x8c8c8c, metalness: 0.95, roughness: 0.1 });
        const darkSilverMat = new THREE.MeshStandardMaterial({ color: 0x6a6a6a, metalness: 0.9, roughness: 0.15 });
        const purpleMat = new THREE.MeshStandardMaterial({ color: 0x6a0dad, metalness: 0.8, roughness: 0.2, emissive: 0x3d0666, emissiveIntensity: 0.3 });
        const darkPurpleMat = new THREE.MeshStandardMaterial({ color: 0x4a148c, metalness: 0.85, roughness: 0.15 });
        const blackMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.5, roughness: 0.7 });
        const redEyeMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        const redGlowMat = new THREE.MeshBasicMaterial({ color: 0xff3300 });

        // ========== 躯干 ==========
        // 主躯干 - 重型装甲
        const torso = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.8, 1.0), silverMat);
        torso.position.y = 2.8;
        torso.castShadow = true;
        robotGroup.add(torso);

        // 胸部紫色核心甲壳
        const chestPlate = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.0, 0.35), purpleMat);
        chestPlate.position.set(0, 3.0, 0.5);
        chestPlate.castShadow = true;
        robotGroup.add(chestPlate);

        // 能量核心
        const coreGlow = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 12), redGlowMat);
        coreGlow.position.set(0, 3.0, 0.68);
        robotGroup.add(coreGlow);

        // 颈部
        const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.25, 8), darkSilverMat);
        neck.position.set(0, 3.8, 0);
        robotGroup.add(neck);

        // ========== 头部 ==========
        // 主头部 - 棱角分明风格
        const head = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.85, 0.85), silverMat);
        head.position.y = 4.4;
        head.castShadow = true;
        robotGroup.add(head);

        // 头顶装甲
        const headTop = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.2, 0.65), darkSilverMat);
        headTop.position.set(0, 4.88, 0);
        robotGroup.add(headTop);

        // 面罩
        const visor = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.28, 0.12), purpleMat);
        visor.position.set(0, 4.45, 0.42);
        robotGroup.add(visor);

        // 眼睛 - 红色发光
        const leftEye = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.1, 0.08), redEyeMat);
        leftEye.position.set(-0.18, 4.52, 0.43);
        robotGroup.add(leftEye);
        const rightEye = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.1, 0.08), redEyeMat);
        rightEye.position.set(0.18, 4.52, 0.43);
        robotGroup.add(rightEye);

        // 耳朵/装甲
        const earGeo = new THREE.BoxGeometry(0.12, 0.25, 0.2);
        const leftEar = new THREE.Mesh(earGeo, darkSilverMat);
        leftEar.position.set(-0.55, 4.35, 0);
        robotGroup.add(leftEar);
        const rightEar = new THREE.Mesh(earGeo, darkSilverMat);
        rightEar.position.set(0.55, 4.35, 0);
        robotGroup.add(rightEar);

        // 天线
        const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.5, 6), darkSilverMat);
        antenna.position.set(0, 5.15, 0);
        robotGroup.add(antenna);
        const antennaTip = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 6), redGlowMat);
        antennaTip.position.set(0, 5.42, 0);
        robotGroup.add(antennaTip);

        // ========== 肩膀 ==========
        // 肩部装甲
        const shoulderGeo = new THREE.BoxGeometry(0.6, 0.65, 0.7);
        const leftShoulder = new THREE.Mesh(shoulderGeo, purpleMat);
        leftShoulder.position.set(-1.0, 4.0, 0);
        leftShoulder.castShadow = true;
        robotGroup.add(leftShoulder);
        const rightShoulder = new THREE.Mesh(shoulderGeo, purpleMat);
        rightShoulder.position.set(1.0, 4.0, 0);
        rightShoulder.castShadow = true;
        robotGroup.add(rightShoulder);

        // 肩部关节球
        const shoulderJoint = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 10), darkSilverMat);
        const leftShoulderJoint = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 10), darkSilverMat);
        leftShoulderJoint.position.set(-0.85, 3.65, 0);
        robotGroup.add(leftShoulderJoint);
        const rightShoulderJoint = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 10), darkSilverMat);
        rightShoulderJoint.position.set(0.85, 3.65, 0);
        robotGroup.add(rightShoulderJoint);

        // ========== 手臂 ==========
        // 左上臂
        const leftUpperArm = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.0, 0.5), silverMat);
        leftUpperArm.position.set(-0.85, 2.9, 0);
        leftUpperArm.castShadow = true;
        robotGroup.add(leftUpperArm);

        // 左肘
        const leftElbow = new THREE.Mesh(new THREE.SphereGeometry(0.17, 8, 8), darkSilverMat);
        leftElbow.position.set(-0.85, 2.2, 0);
        robotGroup.add(leftElbow);

        // 左前臂
        const leftForearm = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.95, 0.45), darkPurpleMat);
        leftForearm.position.set(-0.85, 1.55, 0);
        leftForearm.castShadow = true;
        robotGroup.add(leftForearm);

        // 左手
        const leftHand = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.35, 0.32), darkSilverMat);
        leftHand.position.set(-0.85, 0.85, 0);
        leftHand.castShadow = true;
        robotGroup.add(leftHand);

        // 右臂
        const rightUpperArm = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.0, 0.5), silverMat);
        rightUpperArm.position.set(0.85, 2.9, 0);
        rightUpperArm.castShadow = true;
        robotGroup.add(rightUpperArm);
        const rightElbow = new THREE.Mesh(new THREE.SphereGeometry(0.17, 8, 8), darkSilverMat);
        rightElbow.position.set(0.85, 2.2, 0);
        robotGroup.add(rightElbow);
        const rightForearm = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.95, 0.45), darkPurpleMat);
        rightForearm.position.set(0.85, 1.55, 0);
        rightForearm.castShadow = true;
        robotGroup.add(rightForearm);
        const rightHand = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.35, 0.32), darkSilverMat);
        rightHand.position.set(0.85, 0.85, 0);
        rightHand.castShadow = true;
        robotGroup.add(rightHand);

        // ========== 背包（坦克炮塔改造） ==========
        const backpack = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.8, 0.5), purpleMat);
        backpack.position.set(0, 3.6, -0.55);
        robotGroup.add(backpack);

        // 背包上的小炮塔
        const miniTurret = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 0.25, 8), darkPurpleMat);
        miniTurret.position.set(0, 4.2, -0.55);
        robotGroup.add(miniTurret);

        // ========== 腰部 ==========
        const waist = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.45, 0.75), darkSilverMat);
        waist.position.set(0, 1.65, 0);
        waist.castShadow = true;
        robotGroup.add(waist);

        // ========== 腿部（重型装甲风格） ==========
        // 左大腿
        const leftThigh = new THREE.Mesh(new THREE.BoxGeometry(0.55, 1.3, 0.6), silverMat);
        leftThigh.position.set(-0.4, 0.85, 0);
        leftThigh.castShadow = true;
        robotGroup.add(leftThigh);

        // 左膝关节
        const leftKnee = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), darkPurpleMat);
        leftKnee.position.set(-0.4, 0.08, 0);
        robotGroup.add(leftKnee);

        // 左小腿
        const leftShin = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.1, 0.55), darkSilverMat);
        leftShin.position.set(-0.4, -0.65, 0);
        leftShin.castShadow = true;
        robotGroup.add(leftShin);

        // 左脚（带履带纹理）
        const leftFoot = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.25, 0.7), purpleMat);
        leftFoot.position.set(-0.4, -1.28, 0.08);
        leftFoot.castShadow = true;
        robotGroup.add(leftFoot);

        // 右腿
        const rightThigh = new THREE.Mesh(new THREE.BoxGeometry(0.55, 1.3, 0.6), silverMat);
        rightThigh.position.set(0.4, 0.85, 0);
        rightThigh.castShadow = true;
        robotGroup.add(rightThigh);
        const rightKnee = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), darkPurpleMat);
        rightKnee.position.set(0.4, 0.08, 0);
        robotGroup.add(rightKnee);
        const rightShin = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.1, 0.55), darkSilverMat);
        rightShin.position.set(0.4, -0.65, 0);
        rightShin.castShadow = true;
        robotGroup.add(rightShin);
        const rightFoot = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.25, 0.7), purpleMat);
        rightFoot.position.set(0.4, -1.28, 0.08);
        rightFoot.castShadow = true;
        robotGroup.add(rightFoot);

        this.robotMesh = robotGroup;
    }

    createTankMesh() {
        // 坦克形态 - 威震天风格精细版
        const tankGroup = new THREE.Group();

        // 材质
        const purpleMat = new THREE.MeshStandardMaterial({ color: 0x6a0dad, metalness: 0.85, roughness: 0.15, emissive: 0x3d0666, emissiveIntensity: 0.2 });
        const darkPurpleMat = new THREE.MeshStandardMaterial({ color: 0x4a148c, metalness: 0.9, roughness: 0.1 });
        const silverMat = new THREE.MeshStandardMaterial({ color: 0x8c8c8c, metalness: 0.95, roughness: 0.08 });
        const darkSilverMat = new THREE.MeshStandardMaterial({ color: 0x6a6a6a, metalness: 0.9, roughness: 0.12 });
        const blackMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.3, roughness: 0.9 });
        const redMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });

        // ========== 底盘 ==========
        // 主底盘
        const chassis = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.55, 4.2), darkPurpleMat);
        chassis.position.y = 0.5;
        chassis.castShadow = true;
        tankGroup.add(chassis);

        // 底部装甲
        const bottomArmor = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.15, 4.0), blackMat);
        bottomArmor.position.y = 0.2;
        tankGroup.add(bottomArmor);

        // ========== 履带系统 ==========
        // 左侧履带
        const trackL = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.65, 4.4), blackMat);
        trackL.position.set(-1.25, 0.35, 0);
        trackL.castShadow = true;
        tankGroup.add(trackL);

        // 右侧履带
        const trackR = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.65, 4.4), blackMat);
        trackR.position.set(1.25, 0.35, 0);
        trackR.castShadow = true;
        tankGroup.add(trackR);

        // 履带轮
        const wheelGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.35, 14);
        wheelGeo.rotateZ(Math.PI / 2);
        const wheelPositions = [
            [-1.25, 0.38, 1.6],
            [-1.25, 0.38, 0.5],
            [-1.25, 0.38, -0.5],
            [-1.25, 0.38, -1.6],
            [1.25, 0.38, 1.6],
            [1.25, 0.38, 0.5],
            [1.25, 0.38, -0.5],
            [1.25, 0.38, -1.6],
        ];
        wheelPositions.forEach(pos => {
            const wheel = new THREE.Mesh(wheelGeo, silverMat);
            wheel.position.set(pos[0], pos[1], pos[2]);
            wheel.castShadow = true;
            tankGroup.add(wheel);
        });

        // 主动轮（前）
        const driveWheelGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.4, 12);
        driveWheelGeo.rotateZ(Math.PI / 2);
        const leftDriveWheel = new THREE.Mesh(driveWheelGeo, darkPurpleMat);
        leftDriveWheel.position.set(-1.25, 0.38, 1.85);
        tankGroup.add(leftDriveWheel);
        const rightDriveWheel = new THREE.Mesh(driveWheelGeo, darkPurpleMat);
        rightDriveWheel.position.set(1.25, 0.38, 1.85);
        tankGroup.add(rightDriveWheel);

        // 诱导轮（后）
        const idlerWheelGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.38, 12);
        idlerWheelGeo.rotateZ(Math.PI / 2);
        const leftIdlerWheel = new THREE.Mesh(idlerWheelGeo, darkPurpleMat);
        leftIdlerWheel.position.set(-1.25, 0.38, -1.85);
        tankGroup.add(leftIdlerWheel);
        const rightIdlerWheel = new THREE.Mesh(idlerWheelGeo, darkPurpleMat);
        rightIdlerWheel.position.set(1.25, 0.38, -1.85);
        tankGroup.add(rightIdlerWheel);

        // ========== 炮塔 ==========
        // 炮塔底座
        const turretBase = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 1.1, 0.35, 12), darkPurpleMat);
        turretBase.position.y = 1.05;
        turretBase.castShadow = true;
        tankGroup.add(turretBase);

        // 炮塔主体
        const turret = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.85, 0.55, 12), purpleMat);
        turret.position.y = 1.45;
        turret.castShadow = true;
        tankGroup.add(turret);

        // 指挥塔
        const commanderdome = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.3, 0.3, 10), darkPurpleMat);
        commanderdome.position.set(0.25, 1.95, -0.15);
        tankGroup.add(commanderdome);

        // 指挥塔舱门
        const hatch = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.08, 10), silverMat);
        hatch.position.set(0.25, 2.12, -0.15);
        tankGroup.add(hatch);

        // ========== 炮管 ==========
        // 炮盾
        const mantlet = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.4, 0.3), darkPurpleMat);
        mantlet.position.set(0, 1.42, 0.5);
        tankGroup.add(mantlet);

        // 主炮管
        const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 2.8, 10), silverMat);
        barrel.rotation.x = Math.PI / 2;
        barrel.position.set(0, 1.4, 1.9);
        barrel.castShadow = true;
        tankGroup.add(barrel);

        // 炮口
        const muzzle = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.1, 0.35, 10), darkPurpleMat);
        muzzle.rotation.x = Math.PI / 2;
        muzzle.position.set(0, 1.4, 3.35);
        tankGroup.add(muzzle);

        // 炮口制退器
        const muzzleBrake = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.2, 8), darkSilverMat);
        muzzleBrake.rotation.x = Math.PI / 2;
        muzzleBrake.position.set(0, 1.4, 3.55);
        tankGroup.add(muzzleBrake);

        // ========== 观察孔 ==========
        // 车长观察塔
        const viewportTower = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.25, 0.25), darkPurpleMat);
        viewportTower.position.set(-0.25, 1.72, 0.35);
        tankGroup.add(viewportTower);

        // 驾驶员观察孔
        const driverPort = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.15, 0.1), redMat);
        driverPort.position.set(0, 1.2, 0.72);
        tankGroup.add(driverPort);

        // ========== 车身细节 ==========
        // 前装甲板
        const frontArmor = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.8, 0.15), purpleMat);
        frontArmor.position.set(0, 0.75, 2.1);
        frontArmor.rotation.x = 0.2;
        tankGroup.add(frontArmor);

        // 侧装甲
        const sideArmorGeo = new THREE.BoxGeometry(0.12, 0.5, 3.8);
        const leftSideArmor = new THREE.Mesh(sideArmorGeo, purpleMat);
        leftSideArmor.position.set(-1.2, 0.85, 0);
        tankGroup.add(leftSideArmor);
        const rightSideArmor = new THREE.Mesh(sideArmorGeo, purpleMat);
        rightSideArmor.position.set(1.2, 0.85, 0);
        tankGroup.add(rightSideArmor);

        // 后备箱装饰
        const rearDecor = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.3, 0.12), darkPurpleMat);
        rearDecor.position.set(0, 1.1, -2.05);
        tankGroup.add(rearDecor);

        this.tankMesh = tankGroup;
    }
    
    transform() {
        // 注意：isControlled 检查只在 autoTransform() 中进行
        // 用户按空格键直接调用此方法，应该总是允许变形
        
        const oldMesh = this.mesh;
        
        if (this.isTransformed) {
            // 坦克 -> 机器人
            this.mesh = this.robotMesh;
            this.speed = 0.15;
        } else {
            // 机器人 -> 坦克
            this.mesh = this.tankMesh;
            this.speed = 0.25;
        }
        
        // 保持位置和旋转
        this.mesh.position.copy(oldMesh.position);
        this.mesh.rotation.copy(oldMesh.rotation);
        
        this.scene.remove(oldMesh);
        this.scene.add(this.mesh);
        
        this.isTransformed = !this.isTransformed;
        
        // 变形动画
        this.playTransformAnimation();
    }
    
    playTransformAnimation() {
        const targetScale = this.isTransformed ? 0.8 : 1.2;
        const startScale = 0.01;
        
        this.mesh.scale.set(startScale, startScale, startScale);
        
        let scale = startScale;
        const expand = setInterval(() => {
            scale += 0.1;
            if (scale >= targetScale) {
                scale = targetScale;
                clearInterval(expand);
            }
            this.mesh.scale.set(scale, scale, scale);
        }, 30);
    }
    
    shoot() {
        if (!this.canShoot || this.isTransformed !== true) return;
        
        const now = Date.now();
        if (now - this.lastShootTime < this.shootCooldown) return;
        
        this.lastShootTime = now;
        
        // 创建炮弹
        const projectileGeo = new THREE.SphereGeometry(0.15, 8, 8);
        const projectileMat = new THREE.MeshBasicMaterial({ color: 0xffaa00, emissive: 0xff6600 });
        const projectile = new THREE.Mesh(projectileGeo, projectileMat);
        
        // 从炮口位置发射
        const forward = new THREE.Vector3(0, 0, 1);
        forward.applyQuaternion(this.mesh.quaternion);
        
        projectile.position.set(
            this.mesh.position.x + forward.x * 3,
            this.mesh.position.y + 1.05,
            this.mesh.position.z + forward.z * 3
        );
        
        // 炮弹速度
        projectile.userData.velocity = forward.multiplyScalar(1);
        projectile.userData.life = 60; // 60帧后消失
        
        this.scene.add(projectile);
        this.projectiles.push(projectile);
        
        // 发射特效
        this.createMuzzleFlash();
        
        console.log(`[TankTransformer] ${this.agentId} fired!`);
    }
    
    createMuzzleFlash() {
        // 简单的炮口火焰效果
        const flashGeo = new THREE.SphereGeometry(0.3, 8, 8);
        const flashMat = new THREE.MeshBasicMaterial({ color: 0xffff00, transparent: true, opacity: 0.8 });
        const flash = new THREE.Mesh(flashGeo, flashMat);
        
        const forward = new THREE.Vector3(0, 0, 1);
        forward.applyQuaternion(this.mesh.quaternion);
        
        flash.position.set(
            this.mesh.position.x + forward.x * 3,
            this.mesh.position.y + 1.05,
            this.mesh.position.z + forward.z * 3
        );
        
        this.scene.add(flash);
        
        setTimeout(() => {
            this.scene.remove(flash);
        }, 100);
    }
    
    // ========== 战斗系统方法 ==========
    
    /**
     * 执行攻击
     * @param {string} attackType - 攻击类型 ('punch', 'slash', 'shoot', 'crush')
     * @returns {object} 攻击结果
     */
    performAttack(attackType) {
        if (this.isDead) return { success: false, reason: 'dead' };
        
        const attack = this.attackActions[attackType];
        if (!attack) return { success: false, reason: 'invalid_attack' };
        
        const now = Date.now() / 1000; // 转换为秒
        const cooldownRemaining = attack.cooldown - (now - attack.lastUsed);
        
        if (cooldownRemaining > 0) {
            return { 
                success: false, 
                reason: 'cooldown', 
                cooldownRemaining: cooldownRemaining.toFixed(1) + 's' 
            };
        }
        
        // 检查形态是否匹配攻击类型
        const isRobotAttack = attackType === 'punch' || attackType === 'slash';
        const isTankAttack = attackType === 'shoot' || attackType === 'crush';
        
        if ((isRobotAttack && this.isTransformed) || (isTankAttack && !this.isTransformed)) {
            return { success: false, reason: 'wrong_form' };
        }
        
        // 更新冷却时间
        attack.lastUsed = now;
        
        // 根据攻击类型执行不同的攻击
        switch (attackType) {
            case 'punch':
                this._doPunch(attack);
                break;
            case 'slash':
                this._doSlash(attack);
                break;
            case 'shoot':
                this._doShootAttack(attack);
                break;
            case 'crush':
                this._doCrush(attack);
                break;
        }
        
        console.log(`[TankTransformer] ${this.agentId} 使用 ${attack.name}！伤害: ${attack.damage}`);
        
        return { 
            success: true, 
            attackType: attackType,
            damage: attack.damage,
            attackName: attack.name
        };
    }
    
    _doPunch(attack) {
        // 拳击攻击 - 快速近战
        this._createAttackEffect('punch', attack.damage);
    }
    
    _doSlash(attack) {
        // 利爪斩 - 高伤害近战
        this._createAttackEffect('slash', attack.damage);
    }
    
    _doShootAttack(attack) {
        // 坦克主炮射击
        if (this.canShoot) {
            const now = Date.now();
            if (now - this.lastShootTime >= this.shootCooldown) {
                this.lastShootTime = now;
                this._createProjectile(attack.damage);
                this.createMuzzleFlash();
            }
        }
    }
    
    _doCrush(attack) {
        // 碾压攻击 - 坦克形态高伤害
        this._createAttackEffect('crush', attack.damage);
    }
    
    /**
     * 创建炮弹（远程攻击）
     */
    _createProjectile(damage) {
        const projectileGeo = new THREE.SphereGeometry(0.2, 10, 10);
        const projectileMat = new THREE.MeshStandardMaterial({ 
            color: 0xff6600, 
            emissive: 0xff3300,
            emissiveIntensity: 0.8
        });
        const projectile = new THREE.Mesh(projectileGeo, projectileMat);
        
        // 从炮口位置发射
        const forward = new THREE.Vector3(0, 0, 1);
        forward.applyQuaternion(this.mesh.quaternion);
        
        projectile.position.set(
            this.mesh.position.x + forward.x * 3,
            this.mesh.position.y + 1.4,
            this.mesh.position.z + forward.z * 3
        );
        
        // 炮弹速度
        projectile.userData.velocity = forward.multiplyScalar(2);
        projectile.userData.life = 120; // 120帧后消失
        projectile.userData.damage = damage;
        projectile.userData.fromAgent = this.agentId;
        
        this.scene.add(projectile);
        this.projectiles.push(projectile);
    }
    
    /**
     * 创建攻击特效
     */
    _createAttackEffect(type, damage) {
        // 移除之前的特效
        if (this.attackEffect) {
            this.scene.remove(this.attackEffect);
        }
        
        let color, size, duration;
        switch (type) {
            case 'punch':
                color = 0xff4444; // 红色拳击特效
                size = 0.8;
                duration = 300;
                break;
            case 'slash':
                color = 0xaa00ff; // 紫色斩击特效
                size = 1.2;
                duration = 400;
                break;
            case 'crush':
                color = 0xff8800; // 橙色碾压特效
                size = 2.0;
                duration = 500;
                break;
            default:
                color = 0xffff00;
                size = 1.0;
                duration = 300;
        }
        
        const effectGeo = new THREE.SphereGeometry(size, 16, 16);
        const effectMat = new THREE.MeshBasicMaterial({ 
            color: color, 
            transparent: true, 
            opacity: 0.8 
        });
        this.attackEffect = new THREE.Mesh(effectGeo, effectMat);
        
        // 放置在前方的攻击范围处
        const forward = new THREE.Vector3(0, 0, 1);
        forward.applyQuaternion(this.mesh.quaternion);
        this.attackEffect.position.set(
            this.mesh.position.x + forward.x * 2,
            this.mesh.position.y + 1.5,
            this.mesh.position.z + forward.z * 2
        );
        
        this.scene.add(this.attackEffect);
        
        setTimeout(() => {
            if (this.attackEffect) {
                this.scene.remove(this.attackEffect);
                this.attackEffect = null;
            }
        }, duration);
    }
    
    /**
     * 受到伤害
     * @param {number} amount - 伤害值
     * @param {string} attacker - 攻击者ID
     */
    takeDamage(amount, attacker) {
        if (this.isDead || this.invincible) return;
        
        this.health -= amount;
        console.log(`[TankTransformer] ${this.agentId} 受到 ${amount} 点伤害！剩余血量: ${this.health}/${this.maxHealth}`);
        
        // 受伤无敌时间（0.5秒）
        this.invincible = true;
        this.invincibleTimer = 0.5;
        
        // 受伤变色效果
        this._flashOnDamage();
        
        // 检查是否死亡
        if (this.health <= 0) {
            this.health = 0;
            this.die(attacker);
        }
    }
    
    /**
     * 受伤闪烁效果
     */
    _flashOnDamage() {
        const originalOpacity = {};
        this.mesh.traverse((child) => {
            if (child.isMesh && child.material) {
                if (child.material.opacity !== undefined) {
                    originalOpacity[child.id] = child.material.opacity;
                    child.material.opacity = 0.5;
                }
            }
        });
        
        setTimeout(() => {
            this.mesh.traverse((child) => {
                if (child.isMesh && child.material && originalOpacity[child.id] !== undefined) {
                    child.material.opacity = originalOpacity[child.id];
                }
            });
        }, 100);
    }
    
    /**
     * 死亡
     */
    die(killer) {
        console.log(`[TankTransformer] ${this.agentId} 被 ${killer} 击败！`);
        this.isDead = true;
        this.health = 0;
        this.respawnTimer = this.respawnTime;
        
        // 隐藏mesh
        if (this.mesh) {
            this.mesh.visible = false;
        }
        
        // 清除所有炮弹
        this.projectiles.forEach(p => this.scene.remove(p));
        this.projectiles = [];
        
        // 发送死亡事件
        if (window.eventBus) {
            window.eventBus.emit('transformer:death', {
                agentId: this.agentId,
                killer: killer,
                respawnTime: this.respawnTime
            });
        }
    }
    
    /**
     * 复活
     */
    respawn() {
        console.log(`[TankTransformer] ${this.agentId} 复活！`);
        this.isDead = false;
        this.health = this.maxHealth;
        this.invincible = true;
        this.invincibleTimer = 3; // 3秒无敌时间
        
        // 重置位置
        this.position = { x: -20, z: -20 };
        this.rotation = 0;
        
        // 显示mesh
        if (this.mesh) {
            this.mesh.visible = true;
            this.mesh.position.set(this.position.x, 0, this.position.z);
        }
        
        // 发送复活事件
        if (window.eventBus) {
            window.eventBus.emit('transformer:respawn', {
                agentId: this.agentId
            });
        }
    }
    
    /**
     * 获取当前状态摘要
     */
    getStatus() {
        return {
            agentId: this.agentId,
            health: this.health,
            maxHealth: this.maxHealth,
            isDead: this.isDead,
            isTransformed: this.isTransformed,
            respawnTimer: this.isDead ? this.respawnTimer : 0,
            attackCooldowns: {
                punch: this._getCooldownRemaining('punch'),
                slash: this._getCooldownRemaining('slash'),
                shoot: this._getCooldownRemaining('shoot'),
                crush: this._getCooldownRemaining('crush')
            }
        };
    }
    
    _getCooldownRemaining(attackType) {
        const attack = this.attackActions[attackType];
        if (!attack) return 0;
        const now = Date.now() / 1000;
        const remaining = attack.cooldown - (now - attack.lastUsed);
        return remaining > 0 ? remaining.toFixed(1) + 's' : '就绪';
    }
    
    updateProjectiles() {
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i];
            
            // 移动
            p.position.add(p.userData.velocity);
            
            // 减少生命
            p.userData.life--;
            
            // 更新位置日志（调试用）
            if (p.userData.life % 10 === 0) {
                console.log(`[TankTransformer] Projectile at (${p.position.x.toFixed(1)}, ${p.position.y.toFixed(1)}, ${p.position.z.toFixed(1)})`);
            }
            
            // 检查碰撞或生命结束
            if (p.userData.life <= 0 || p.position.y < 0 || p.position.y > 100) {
                this.scene.remove(p);
                this.projectiles.splice(i, 1);
                console.log(`[TankTransformer] Projectile removed`);
            }
        }
    }
    
    moveTo(x, z) {
        this.targetPosition = { x, z };
    }
    
    // ========== 战斗系统方法 ==========
    
    /**
     * 执行攻击动作
     * @param {string} actionName - 攻击动作名称
     * @param {object} target - 目标（可选）
     * @returns {boolean} 是否成功执行
     */
    performAttack(actionName, target = null) {
        if (this.isDead) return false;
        
        const action = this.attackActions[actionName];
        if (!action) return false;
        
        const now = Date.now();
        const cooldownMs = action.cooldown * 1000;
        
        if (now - action.lastUsed < cooldownMs) {
            console.log(`[TankTransformer] ${action.name} 冷却中...`);
            return false;
        }
        
        action.lastUsed = now;
        
        // 根据形态选择可用的攻击
        const isRobot = !this.isTransformed;
        
        // 检查攻击是否适合当前形态
        if (actionName === 'punch' && !isRobot) {
            console.log(`[TankTransformer] 坦克形态无法使用拳击！`);
            return false;
        }
        if (actionName === 'slash' && !isRobot) {
            console.log(`[TankTransformer] 坦克形态无法使用利爪斩！`);
            return false;
        }
        if (actionName === 'shoot' && isRobot) {
            console.log(`[TankTransformer] 机器人形态无法使用主炮！`);
            return false;
        }
        if (actionName === 'crush' && isRobot) {
            console.log(`[TankTransformer] 机器人形态无法使用碾压！`);
            return false;
        }
        
        // 执行攻击动画
        this.playAttackAnimation(actionName);
        
        // 造成伤害
        if (target) {
            const dist = this.getDistanceTo(target);
            if (dist <= action.range) {
                target.takeDamage(action.damage, this);
                console.log(`[TankTransformer] ${action.name} 命中！伤害: ${action.damage}`);
            } else {
                console.log(`[TankTransformer] ${action.name} 超出范围！距离: ${dist.toFixed(1)}, 范围: ${action.range}`);
            }
        } else {
            console.log(`[TankTransformer] ${action.name}！伤害: ${action.damage}`);
        }
        
        return true;
    }
    
    /**
     * 播放攻击动画
     */
    playAttackAnimation(actionName) {
        if (!this.mesh) return;
        
        const duration = 300; // 动画持续时间
        const originalScale = this.mesh.scale.clone();
        
        switch(actionName) {
            case 'punch':
                // 快速前冲
                this.mesh.scale.z = 1.2;
                setTimeout(() => { this.mesh.scale.copy(originalScale); }, duration);
                break;
            case 'slash':
                // 旋转斩击
                this.mesh.rotation.y += 0.3;
                setTimeout(() => { this.mesh.rotation.y -= 0.3; }, duration);
                break;
            case 'shoot':
                // 后坐力
                this.createMuzzleFlash();
                this.mesh.scale.x = 0.9;
                setTimeout(() => { this.mesh.scale.x = 1.0; }, 150);
                break;
            case 'crush':
                // 下压
                this.mesh.scale.y = 0.8;
                this.mesh.position.y = -0.5;
                setTimeout(() => { 
                    this.mesh.scale.y = 1.0; 
                    this.mesh.position.y = 0;
                }, duration * 2);
                break;
        }
    }
    
    /**
     * 获取到目标的距离
     */
    getDistanceTo(target) {
        if (!target || !target.position) return Infinity;
        const dx = target.position.x - this.position.x;
        const dz = target.position.z - this.position.z;
        return Math.sqrt(dx * dx + dz * dz);
    }
    
    /**
     * 受到伤害
     */
    takeDamage(amount, attacker) {
        if (this.isDead || this.invincible) return;
        
        this.health -= amount;
        console.log(`[TankTransformer] ${this.agentId} 受到 ${amount} 点伤害！剩余血量: ${this.health}/${this.maxHealth}`);
        
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
        if (!this.mesh) return;
        
        // 闪烁效果
        const flash = () => {
            this.mesh.traverse((child) => {
                if (child.isMesh && child.material && child.material.emissive) {
                    child.material.emissive.setHex(0xff0000);
                }
            });
        };
        
        flash();
        setTimeout(flash, 100);
        setTimeout(flash, 200);
        
        // 创建击中粒子效果
        this.createHitEffect();
    }
    
    /**
     * 击中特效（粒子爆炸）
     */
    createHitEffect() {
        if (!this.scene) return;
        
        const particleCount = 15;
        const particles = [];
        
        for (let i = 0; i < particleCount; i++) {
            const geo = new THREE.SphereGeometry(0.1, 6, 6);
            const mat = new THREE.MeshBasicMaterial({ 
                color: Math.random() > 0.5 ? 0xff4444 : 0xffaa00,
                transparent: true
            });
            const particle = new THREE.Mesh(geo, mat);
            particle.position.set(
                this.mesh.position.x + (Math.random() - 0.5) * 2,
                this.mesh.position.y + Math.random() * 2,
                this.mesh.position.z + (Math.random() - 0.5) * 2
            );
            particle.userData.velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 0.3,
                Math.random() * 0.2,
                (Math.random() - 0.5) * 0.3
            );
            particle.userData.life = 30;
            this.scene.add(particle);
            particles.push(particle);
        }
        
        // 动画更新
        const animate = () => {
            let alive = false;
            particles.forEach(p => {
                if (p.userData.life > 0) {
                    alive = true;
                    p.position.add(p.userData.velocity);
                    p.userData.life--;
                    p.material.opacity = p.userData.life / 30;
                    p.scale.multiplyScalar(0.95);
                } else {
                    this.scene.remove(p);
                }
            });
            if (alive) requestAnimationFrame(animate);
        };
        animate();
    }
    
    /**
     * 死亡
     */
    die(killer) {
        console.log(`[TankTransformer] ${this.agentId} 被击败！`);
        this.isDead = true;
        this.health = 0;
        
        // 隐藏 mesh
        if (this.mesh) {
            this.mesh.visible = false;
        }
        
        // 停止所有行为
        this.targetPosition = null;
        
        // 开始复活计时
        this.respawnTimer = this.respawnTime;
        console.log(`[TankTransformer] ${this.agentId} 将在 ${this.respawnTime} 秒后复活...`);
    }
    
    /**
     * 复活
     */
    respawn() {
        console.log(`[TankTransformer] ${this.agentId} 复活！`);
        this.isDead = false;
        this.health = this.maxHealth;
        this.respawnTimer = 0;
        this.invincible = true;
        this.invincibleTimer = 3; // 3秒无敌
        
        // 显示 mesh
        if (this.mesh) {
            this.mesh.visible = true;
            this.mesh.position.set(this.position.x, 0, this.position.z);
        }
        
        // 移动到初始位置
        this.position = { x: -20, z: -20 };
        this.rotation = 0;
        
        // 复位形态
        if (this.isTransformed) {
            this.transform();
        }
        
        console.log(`[TankTransformer] ${this.agentId} 复活成功！血量: ${this.health}/${this.maxHealth}`);
    }
    
    /**
     * 更新（用于复活计时）
     */
    update(deltaTime) {
        // 死亡状态更新
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
        
        // 自动变形计时（被控制时不自动变形）
        if (!this.isControlled) {
            this.transformTimer += deltaTime;
            if (this.transformTimer >= this.transformInterval) {
                this.transformTimer = 0;
                // 自动变形调用 autoTransform() 而不是直接调用 transform()
                this.autoTransform();
            }
        }
        
        // 更新炮弹
        this.updateProjectiles();
        
        // 自动巡逻
        if (!this.isControlled && !this.targetPosition) {
            this.updatePatrol(deltaTime);
        }
        
        // 移动到目标
        if (this.targetPosition) {
            this.updateMovement(deltaTime);
        }
    }
    
    /**
     * 自动变形（受 isControlled 标志控制）
     */
    autoTransform() {
        if (this.isControlled) return; // 受控时不自动变形
        this.transform();
    }
    
    updatePatrol(deltaTime) {
        const target = this.patrolRoute[this.patrolIndex];
        const dx = target.x - this.position.x;
        const dz = target.z - this.position.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        
        if (dist < 1) {
            // 到达目标点，切换到下一个
            this.patrolIndex = (this.patrolIndex + 1) % this.patrolRoute.length;
            // 到达后自动射击（坦克形态）
            if (this.isTransformed) {
                this.shoot();
            }
        } else {
            // 向目标移动（使用 deltaTime 保证速度一致）
            const moveX = (dx / dist) * this.speed * deltaTime;
            const moveZ = (dz / dist) * this.speed * deltaTime;
            this.position.x += moveX;
            this.position.z += moveZ;
            
            // 更新面向方向
            this.rotation = Math.atan2(dx, dz);
            
            this.mesh.position.x = this.position.x;
            this.mesh.position.z = this.position.z;
            this.mesh.rotation.y = -this.rotation;
        }
    }
    
    updateMovement(deltaTime) {
        const dx = this.targetPosition.x - this.position.x;
        const dz = this.targetPosition.z - this.position.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        
        if (dist < 0.5) {
            this.targetPosition = null;
            this.isMoving = false;
            return;
        }
        
        this.isMoving = true;
        
        // 使用 deltaTime 保证速度一致
        const moveX = (dx / dist) * this.speed * deltaTime;
        const moveZ = (dz / dist) * this.speed * deltaTime;
        this.position.x += moveX;
        this.position.z += moveZ;
        
        // 更新面向方向
        this.rotation = Math.atan2(dx, dz);
        
        this.mesh.position.x = this.position.x;
        this.mesh.position.z = this.position.z;
        this.mesh.rotation.y = -this.rotation;
    }
    
    activateControl() {
        this.isControlled = true;
        this.targetPosition = null;
    }
    
    deactivateControl() {
        this.isControlled = false;
    }
    
    getState() {
        return {
            agentId: this.agentId,
            position: this.position,
            rotation: this.rotation,
            isTransformed: this.isTransformed,
            isMoving: this.isMoving,
            isControlled: this.isControlled
        };
    }
    
    dispose() {
        if (this.robotMesh) this.scene.remove(this.robotMesh);
        if (this.tankMesh) this.scene.remove(this.tankMesh);
        for (const p of this.projectiles) {
            this.scene.remove(p);
        }
        this.projectiles = [];
    }
}