/**
 * @fileoverview 智能体模型工厂
 * 
 * 职责：
 * - 创建智能体 3D 模型（龙虾、人形）
 * - 根据标签设置颜色
 * - 生成名字标签
 * 
 * 使用方式：
 *   import { createAgentMesh } from './agents/factory.js';
 *   const mesh = createAgentMesh(scene, 'lobster', agentData);
 * 
 * @module agents/factory
 */

import * as THREE from 'three';

// 智能体类型
export const AgentType = {
    LOBSTER: 'lobster',
    HUMAN: 'human'
};

// 标签到颜色的映射
const TAG_COLORS = {
    ai: { body: 0x6366f1, cloth: 0x6366f1, pants: 0x4338ca, claw: 0x8b5cf6 },
    assistant: { body: 0x6366f1, cloth: 0x6366f1, pants: 0x4338ca, claw: 0x8b5cf6 },
    analyst: { body: 0xf97316, cloth: 0xf97316, pants: 0xf97316, claw: 0xfb923c },
    data: { body: 0xf97316, cloth: 0xf97316, pants: 0xf97316, claw: 0xfb923c },
    coordinator: { body: 0x3b82f6, cloth: 0x3b82f6, pants: 0x3b82f6, claw: 0x60a5fa },
    management: { body: 0x3b82f6, cloth: 0x3b82f6, pants: 0x3b82f6, claw: 0x60a5fa },
    social: { body: 0xec4899, cloth: 0xec4899, pants: 0xec4899, claw: 0xf472b6 },
    communication: { body: 0xec4899, cloth: 0xec4899, pants: 0xec4899, claw: 0xf472b6 },
    creative: { body: 0xeab308, cloth: 0xeab308, pants: 0xeab308, claw: 0xfacc15 },
    innovation: { body: 0xeab308, cloth: 0xeab308, pants: 0xeab308, claw: 0xfacc15 },
    guardian: { body: 0x14b8a6, cloth: 0x14b8a6, pants: 0x14b8a6, claw: 0x2dd4bf },
    security: { body: 0x14b8a6, cloth: 0x14b8a6, pants: 0x14b8a6, claw: 0x2dd4bf },
    observer: { body: 0x06b6d4, cloth: 0x06b6d4, pants: 0x06b6d4, claw: 0x22d3ee },
    creator: { body: 0xf59e0b, cloth: 0xf59e0b, pants: 0xf59e0b, claw: 0xfbbf24 },
    worker: { body: 0x10b981, cloth: 0x10b981, pants: 0x10b981, claw: 0x34d399 }
};

// 默认龙虾颜色
const DEFAULT_LOBSTER_COLOR = 0xff6b6b;
const DEFAULT_CLAW_COLOR = 0xff4444;

// 默认人形颜色
const DEFAULT_SKIN_COLOR = 0xffd5b4;
const DEFAULT_CLOTH_COLOR = 0x4a90d9;
const DEFAULT_HAIR_COLOR = 0x3d2314;
const DEFAULT_PANTS_COLOR = 0x2c3e50;
const DEFAULT_SHOES_COLOR = 0x1a1a1a;

/**
 * 获取标签对应的颜色
 * @param {Array} tags - 标签数组
 * @param {string} colorType - body/cloth/pants/claw
 */
function getTagColor(tags, colorType = 'body') {
    if (!tags || !tags.length) return null;
    for (const tag of tags) {
        const lower = tag.toLowerCase();
        if (TAG_COLORS[lower]) {
            return TAG_COLORS[lower][colorType];
        }
    }
    return null;
}

/**
 * 获取智能体视觉配置
 */
function getAgentVisual(agent) {
    return agent.visual || {};
}

/**
 * 创建智能体模型
 * @param {string} type - AgentType
 * @param {Object} agent - 智能体数据 { name, tags, visual }
 * @returns {THREE.Group}
 */
export function createAgentMesh(type, agent) {
    switch (type) {
        case AgentType.HUMAN:
            return createHumanMesh(agent);
        case AgentType.LOBSTER:
        default:
            return createLobsterMesh(agent);
    }
}

/**
 * 创建龙虾模型
 * @param {Object} agent - 智能体数据
 * @returns {THREE.Group}
 */
export function createLobsterMesh(agent) {
    const group = new THREE.Group();

    // 获取颜色
    let bodyColor = DEFAULT_LOBSTER_COLOR;
    let clawColor = DEFAULT_CLAW_COLOR;

    const visual = getAgentVisual(agent);
    if (visual.color) {
        const colorHex = visual.color.replace('#', '');
        bodyColor = parseInt(colorHex, 16);
        clawColor = Math.max(0, bodyColor - 0x0000ff);
    } else {
        const taggedBodyColor = getTagColor(agent.tags, 'body');
        const taggedClawColor = getTagColor(agent.tags, 'claw');
        if (taggedBodyColor) bodyColor = taggedBodyColor;
        if (taggedClawColor) clawColor = taggedClawColor;
    }

    const lobsterHeight = 0.5; // 龙虾高度

    // 身体
    const bodyGeom = new THREE.SphereGeometry(0.8, 16, 16);
    const bodyMat = new THREE.MeshStandardMaterial({ 
        color: bodyColor, 
        roughness: 0.5, 
        metalness: 0.3 
    });
    const body = new THREE.Mesh(bodyGeom, bodyMat);
    body.position.y = lobsterHeight;
    body.castShadow = true;
    group.add(body);

    // 钳子
    const clawGeom = new THREE.SphereGeometry(0.3, 8, 8);
    const clawMat = new THREE.MeshStandardMaterial({ color: clawColor });

    const leftClaw = new THREE.Mesh(clawGeom, clawMat);
    leftClaw.position.set(-1.2, lobsterHeight, 0);
    group.add(leftClaw);

    const rightClaw = new THREE.Mesh(clawGeom, clawMat);
    rightClaw.position.set(1.2, lobsterHeight, 0);
    group.add(rightClaw);

    // 名字标签
    const sprite = createNameSprite(agent, bodyColor);
    sprite.position.y = lobsterHeight + 1.5;
    group.add(sprite);

    return group;
}

/**
 * 创建人形模型
 * @param {Object} agent - 智能体数据
 * @returns {THREE.Group}
 */
export function createHumanMesh(agent) {
    const group = new THREE.Group();

    // 获取颜色
    let skinColor = DEFAULT_SKIN_COLOR;
    let clothColor = DEFAULT_CLOTH_COLOR;
    let hairColor = DEFAULT_HAIR_COLOR;
    let pantsColor = DEFAULT_PANTS_COLOR;
    let shoesColor = DEFAULT_SHOES_COLOR;

    const visual = getAgentVisual(agent);
    if (visual.color) {
        const colorHex = visual.color.replace('#', '');
        clothColor = parseInt(colorHex, 16);
    } else {
        const taggedClothColor = getTagColor(agent.tags, 'cloth');
        if (taggedClothColor) clothColor = taggedClothColor;
    }

    const scale = visual.size || 1.0;

    // 材质
    const skinMat = new THREE.MeshStandardMaterial({ color: skinColor, roughness: 0.8, metalness: 0.0 });
    const clothMat = new THREE.MeshStandardMaterial({ color: clothColor, roughness: 0.7, metalness: 0.1 });
    const hairMat = new THREE.MeshStandardMaterial({ color: hairColor, roughness: 0.9, metalness: 0.0 });
    const pantsMat = new THREE.MeshStandardMaterial({ color: pantsColor, roughness: 0.8, metalness: 0.0 });
    const shoesMat = new THREE.MeshStandardMaterial({ color: shoesColor, roughness: 0.6, metalness: 0.2 });

    // 骨骼
    const bones = {};

    // 头部
    const headGeom = new THREE.SphereGeometry(0.28, 20, 20);
    const head = new THREE.Mesh(headGeom, skinMat);
    head.position.y = 1.55 * scale;
    head.scale.set(1, 1.1, 1);
    head.castShadow = true;
    bones.head = head;
    group.add(head);

    // 头发
    const hairGeom = new THREE.SphereGeometry(0.29, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.55);
    const hair = new THREE.Mesh(hairGeom, hairMat);
    hair.position.y = 1.6 * scale;
    hair.position.z = -0.02;
    hair.castShadow = true;
    group.add(hair);

    // 眼睛
    const eyeWhiteGeom = new THREE.SphereGeometry(0.05, 12, 12);
    const eyeWhiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const pupilGeom = new THREE.SphereGeometry(0.028, 10, 10);
    const pupilMat = new THREE.MeshStandardMaterial({ color: 0x2d4a6f });

    const leftEyeWhite = new THREE.Mesh(eyeWhiteGeom, eyeWhiteMat);
    leftEyeWhite.position.set(-0.09, 1.57 * scale, 0.23);
    group.add(leftEyeWhite);
    const rightEyeWhite = new THREE.Mesh(eyeWhiteGeom, eyeWhiteMat);
    rightEyeWhite.position.set(0.09, 1.57 * scale, 0.23);
    group.add(rightEyeWhite);

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

    // 嘴巴
    const smileGeom = new THREE.TorusGeometry(0.05, 0.012, 8, 12, Math.PI);
    const smileMat = new THREE.MeshStandardMaterial({ color: 0xd4a5a5 });
    const smile = new THREE.Mesh(smileGeom, smileMat);
    smile.position.set(0, 1.46 * scale, 0.25);
    smile.rotation.x = Math.PI;
    group.add(smile);

    // 颈部
    const neckGeom = new THREE.CylinderGeometry(0.09, 0.1, 0.15, 12);
    const neck = new THREE.Mesh(neckGeom, skinMat);
    neck.position.y = 1.23 * scale;
    group.add(neck);

    // 躯干
    const torsoGeom = new THREE.BoxGeometry(0.45, 0.5, 0.24);
    const torso = new THREE.Mesh(torsoGeom, clothMat);
    torso.position.y = 0.83 * scale;
    torso.castShadow = true;
    bones.torso = torso;
    group.add(torso);

    // 手臂
    const upperArmGeom = new THREE.CylinderGeometry(0.08, 0.07, 0.32, 10);
    const leftUpperArm = new THREE.Mesh(upperArmGeom, clothMat);
    leftUpperArm.position.set(-0.3, 0.92 * scale, 0);
    leftUpperArm.rotation.z = 0.12;
    leftUpperArm.castShadow = true;
    group.add(leftUpperArm);

    const rightUpperArm = new THREE.Mesh(upperArmGeom, clothMat);
    rightUpperArm.position.set(0.3, 0.92 * scale, 0);
    rightUpperArm.rotation.z = -0.12;
    rightUpperArm.castShadow = true;
    group.add(rightUpperArm);

    // 前臂
    const forearmGeom = new THREE.CylinderGeometry(0.06, 0.05, 0.26, 10);
    const leftForearm = new THREE.Mesh(forearmGeom, skinMat);
    leftForearm.position.set(-0.35, 0.48 * scale, 0);
    leftForearm.castShadow = true;
    group.add(leftForearm);

    const rightForearm = new THREE.Mesh(forearmGeom, skinMat);
    rightForearm.position.set(0.35, 0.48 * scale, 0);
    rightForearm.castShadow = true;
    group.add(rightForearm);

    // 手
    const handGeom = new THREE.SphereGeometry(0.048, 10, 10);
    const leftHand = new THREE.Mesh(handGeom, skinMat);
    leftHand.position.set(-0.35, 0.3 * scale, 0);
    leftHand.scale.set(0.8, 1, 0.6);
    leftHand.castShadow = true;
    group.add(leftHand);

    const rightHand = new THREE.Mesh(handGeom, skinMat);
    rightHand.position.set(0.35, 0.3 * scale, 0);
    rightHand.scale.set(0.8, 1, 0.6);
    rightHand.castShadow = true;
    group.add(rightHand);

    // 腿
    const thighGeom = new THREE.CylinderGeometry(0.1, 0.09, 0.42, 10);
    const leftThigh = new THREE.Mesh(thighGeom, pantsMat);
    leftThigh.position.set(-0.12, 0.22 * scale, 0);
    leftThigh.castShadow = true;
    group.add(leftThigh);

    const rightThigh = new THREE.Mesh(thighGeom, pantsMat);
    rightThigh.position.set(0.12, 0.22 * scale, 0);
    rightThigh.castShadow = true;
    group.add(rightThigh);

    const calfGeom = new THREE.CylinderGeometry(0.07, 0.055, 0.4, 10);
    const leftCalf = new THREE.Mesh(calfGeom, pantsMat);
    leftCalf.position.set(-0.12, -0.18 * scale, 0);
    leftCalf.castShadow = true;
    group.add(leftCalf);

    const rightCalf = new THREE.Mesh(calfGeom, pantsMat);
    rightCalf.position.set(0.12, -0.18 * scale, 0);
    rightCalf.castShadow = true;
    group.add(rightCalf);

    // 脚
    const footGeom = new THREE.BoxGeometry(0.09, 0.07, 0.16);
    const leftFoot = new THREE.Mesh(footGeom, shoesMat);
    leftFoot.position.set(-0.12, -0.405 * scale, 0.03);
    leftFoot.castShadow = true;
    group.add(leftFoot);

    const rightFoot = new THREE.Mesh(footGeom, shoesMat);
    rightFoot.position.set(0.12, -0.405 * scale, 0.03);
    rightFoot.castShadow = true;
    group.add(rightFoot);

    // 名字标签
    const sprite = createNameSprite(agent, clothColor);
    sprite.position.y = 2.1 * scale;
    sprite.scale.set(2.2, 0.45, 1);
    group.add(sprite);

    // 应用缩放和偏移
    group.scale.set(scale, scale, scale);
    group.position.y = 0.44 * scale;

    return group;
}

/**
 * 创建名字标签
 * @param {Object} agent
 * @param {number} bgColor - 背景颜色
 * @returns {THREE.Sprite}
 */
function createNameSprite(agent, bgColor) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 80;
    const ctx = canvas.getContext('2d');

    // 背景
    let bgColorStr;
    if (agent.tags && agent.tags.includes('ai')) {
        bgColorStr = 'rgba(99, 102, 241, 0.9)';
    } else if (agent.tags && agent.tags.includes('analyst')) {
        bgColorStr = 'rgba(249, 115, 22, 0.9)';
    } else if (agent.tags && agent.tags.includes('coordinator')) {
        bgColorStr = 'rgba(59, 130, 246, 0.9)';
    } else {
        bgColorStr = `rgba(${((bgColor >> 16) & 0xff)}, ${((bgColor >> 8) & 0xff)}, ${bgColor & 0xff}, 0.9)`;
    }

    ctx.fillStyle = bgColorStr;
    ctx.roundRect(0, 0, 512, 80, 12);
    ctx.fill();

    // 文字
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    let displayName = agent.name || '未知';
    if (displayName.length > 12) {
        displayName = displayName.substring(0, 10) + '...';
    }

    ctx.fillText(displayName, 256, 40);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(4, 0.8, 1);

    return sprite;
}

export default { AgentType, createAgentMesh, createLobsterMesh, createHumanMesh };
