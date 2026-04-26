/**
 * Agent - 智能体基类
 *
 * 继承 WorldObject，所有智能体的基类
 *
 * @module core/agent
 */

import * as THREE from 'three';
import { WorldObject } from './world-object.js';
import { eventBus, Events } from './event-bus.js';

// 智能体状态
const AgentState = {
    IDLE: 'idle',
    MOVING: 'moving',
    SPEAKING: 'speaking',
    THINKING: 'thinking',
    RESTING: 'resting',
    WORKING: 'working',
    SOCIAL: 'social',
    FLEEING: 'fleeing'
};

// 智能体类型
const AgentType = {
    LOBSTER: 'lobster',
    HUMAN: 'human'
};

class Agent extends WorldObject {
    constructor(id, data = {}) {
        super(id, 'agent');

        // 身份
        this.name = data.name || `Agent_${id}`;
        this.agentType = data.agentType || AgentType.LOBSTER;

        // 状态
        this.state = AgentState.IDLE;
        this.emotion = 'neutral';
        this.visionRange = data.visionRange || 15;

        // 需求
        this.needs = {
            energy: data.needs?.energy ?? 80,
            social: data.needs?.social ?? 50,
            fun: data.needs?.fun ?? 50,
            achievement: data.needs?.achievement ?? 30
        };

        // 声誉
        this.reputation = data.reputation ?? 50;

        // 位置
        this.setPosition(
            data.position?.x ?? 0,
            data.position?.y ?? 0,
            data.position?.z ?? 0
        );

        // 移动目标
        this.targetPosition = null;
        this.speed = data.speed || 3;

        // 网格
        this.mesh = null;
        this.headMesh = null;

        // 技能
        this.skills = new Set(['move-to', 'talk-to', 'rest', 'explore', 'interact-world', 'visit_building', 'accept_task', 'complete_task']);
    }

    /**
     * 创建 3D 模型
     */
    createMesh() {
        const group = this.agentType === AgentType.LOBSTER
            ? this.createLobsterMesh()
            : this.createHumanMesh();

        this.mesh = group;
        return group;
    }

    createLobsterMesh() {
        const group = new THREE.Group();
        const bodyColor = 0xe74c3c;

        const bodyGeo = new THREE.SphereGeometry(0.4, 8, 8);
        const bodyMat = new THREE.MeshLambertMaterial({ color: bodyColor });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = 0.5;
        body.name = 'body';
        group.add(body);

        const eyeGeo = new THREE.SphereGeometry(0.08, 6, 6);
        const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const pupilGeo = new THREE.SphereGeometry(0.04, 6, 6);
        const pupilMat = new THREE.MeshBasicMaterial({ color: 0x000000 });

        for (const side of [-0.15, 0.15]) {
            const eye = new THREE.Mesh(eyeGeo, eyeMat);
            eye.position.set(side, 0.65, 0.3);
            group.add(eye);
            const pupil = new THREE.Mesh(pupilGeo, pupilMat);
            pupil.position.set(side, 0.65, 0.36);
            group.add(pupil);
        }

        const legGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.3, 4);
        const legMat = new THREE.MeshLambertMaterial({ color: 0xc0392b });
        for (let i = 0; i < 4; i++) {
            const leg = new THREE.Mesh(legGeo, legMat);
            const angle = (i / 4) * Math.PI + Math.PI / 4;
            leg.position.set(Math.cos(angle) * 0.3, 0.15, Math.sin(angle) * 0.3);
            leg.rotation.z = Math.PI / 4;
            leg.rotation.y = -angle;
            group.add(leg);
        }


        // Head name label
        var nameC = document.createElement("canvas");
        nameC.width = 256;
        nameC.height = 64;
        var nameCX = nameC.getContext("2d");
        nameCX.fillStyle = "rgba(0,0,0,0.6)";
        nameCX.roundRect(0, 0, 256, 64, 12);
        nameCX.fill();
        nameCX.fillStyle = "#ffffff";
        nameCX.font = "bold 24px Microsoft YaHei, sans-serif";
        nameCX.textAlign = "center";
        nameCX.textBaseline = "middle";
        nameCX.fillText(this.name, 128, 32);
        var nameTex = new THREE.CanvasTexture(nameC);
        var nameSp = new THREE.Sprite(new THREE.SpriteMaterial({ map: nameTex, transparent: true, depthTest: false }));
        nameSp.scale.set(2.5, 0.6, 1);
        nameSp.position.set(0, 1.8, 0);
        nameSp.renderOrder = 999;
        group.add(nameSp);
        return group;
    }

    createHumanMesh() {

    const group = new THREE.Group();

    

    // 颜色设置 - 使用更自然的色调

    let skinColor = 0xffd5b4; // 自然肤色

    let clothColor = 0x4a90d9; // 蓝色衬衫

    let hairColor = 0x3d2314; // 棕色头发

    let pantsColor = 0x2c3e50; // 深色裤子

    let shoesColor = 0x1a1a1a; // 黑色鞋子

    

    // 使用 visual.color 如果可用

    if (this.visual && this.visual.color) {

        const colorHex = this.visual.color.replace('#', '');

        clothColor = parseInt(colorHex, 16);

    }

    // 根据标签设置衣服颜色

    else if (this.tags && this.tags.length > 0) {

        if (this.tags.includes('ai') || this.tags.includes('assistant')) {

            clothColor = 0x6366f1; // 紫色

            pantsColor = 0x4338ca;

        } else if (this.tags.includes('analyst')) {

            clothColor = 0xf97316; // 橙色

        } else if (this.tags.includes('coordinator')) {

            clothColor = 0x3b82f6; // 蓝色

        } else if (this.tags.includes('social')) {

            clothColor = 0xec4899; // 粉色

        } else if (this.tags.includes('creative')) {

            clothColor = 0xeab308; // 黄色

        }

    }

    

    // 缩放比例

    const scale = (this.visual && this.visual.size) || 1.0;

    

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

    

    let displayName = this.name || '人类';

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


    

    return group;

}

    /**
     * 设置移动目标
     */
    setTarget(x, z) {
        this.targetPosition = { x, z };
        this.state = AgentState.MOVING;
    }

    /**
     * 每帧更新
     */
    update(deltaTime) {
        // 移动逻辑
        if (this.state === AgentState.MOVING && this.targetPosition) {
            const dx = this.targetPosition.x - this.position.x;
            const dz = this.targetPosition.z - this.position.z;
            const dist = Math.sqrt(dx * dx + dz * dz);

            if (dist < 0.1) {
                this.targetPosition = null;
                this.state = AgentState.IDLE;
            } else {
                const speed = this.speed * deltaTime;
                this.position.x += (dx / dist) * Math.min(speed, dist);
                this.position.z += (dz / dist) * Math.min(speed, dist);

                // 面向移动方向
                this.rotation.y = Math.atan2(dx, dz);
            }

            if (this.mesh) {
                this.mesh.position.set(this.position.x, this.position.y, this.position.z);
                this.mesh.rotation.y = this.rotation.y;
            }
        }
    }

    /**
     * 获取边界半径
     */
    getBoundingRadius() {
        return 0.5;
    }

    /**
     * 上线
     */
    goOnline() {
        eventBus.emit(Events.AGENT_ADDED, { agent: this });
    }

    /**
     * 下线
     */
    goOffline() {
        eventBus.emit(Events.AGENT_REMOVED, { agentId: this.id });
    }

    /**
     * 转为 JSON
     */
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            type: this.agentType,
            state: this.state,
            emotion: this.emotion,
            position: { ...this.position },
            needs: { ...this.needs },
            reputation: this.reputation
        };
    }
}

export { Agent, AgentState, AgentType };
