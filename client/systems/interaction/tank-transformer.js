/**
 * 坦克变形金刚 (TankTransformer)
 * 可以在坦克形态和机器人形态之间切换
 * 坦克形态可以发射炮弹
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
    
    update(deltaTime) {
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