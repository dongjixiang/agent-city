/**
 * @fileoverview 智能体管理器
 * 
 * 职责：
 * - 智能体的添加/移除
 * - 智能体状态管理
 * - 智能体移动和动画
 * - 头顶思考图标
 * 
 * 使用方式：
 *   import { addAgent, removeAgent } from './agents/manager.js';
 *   addAgent(scene, agentData);
 *   removeAgent(agentId);
 * 
 * @module agents/manager
 */

import * as THREE from 'three';
import { createAgentMesh } from './factory.js';

// 智能体 Map
const agents = new Map();

// 情绪状态 Map
const agentStates = new Map();

// 地标位置
const LANDMARKS = {
    FOUNTAIN: { x: 0, z: 0 },
    TASK_CENTER: { x: -25, z: -25 },
    CREATIVE_WORKSHOP: { x: 35, z: 0 },
    SOCIAL_PLAZA: { x: 0, z: 35 }
};

/**
 * 添加智能体到场景
 * @param {THREE.Scene} scene
 * @param {Object} agent - 智能体数据 { agentId, name, tags, visual }
 */
export function addAgent(scene, agent) {
    const modelType = agent.visual?.modelType || 'crayfish';

    console.log('[AgentManager] Adding agent:', agent.name, '- type:', modelType);

    // 根据类型决定初始位置
    const { x, z } = getInitialPosition(agent);

    // 创建模型（从 factory 导入）
    // 注意：这里需要根据 modelType 选择
    const mesh = createAgentMesh(modelType, agent);

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

/**
 * 根据智能体标签获取初始位置
 */
function getInitialPosition(agent) {
    let x, z;

    if (agent.tags) {
        if (agent.tags.includes('analyst')) {
            x = -35 + (Math.random() - 0.5) * 10;
            z = (Math.random() - 0.5) * 10;
        } else if (agent.tags.includes('creative')) {
            x = 35 + (Math.random() - 0.5) * 10;
            z = (Math.random() - 0.5) * 10;
        } else if (agent.tags.includes('social')) {
            x = (Math.random() - 0.5) * 10;
            z = 35 + (Math.random() - 0.5) * 10;
        } else if (agent.tags.includes('coordinator')) {
            x = -25 + (Math.random() - 0.5) * 10;
            z = -25 + (Math.random() - 0.5) * 10;
        } else if (agent.tags.includes('guardian')) {
            x = (Math.random() - 0.5) * 5;
            z = (Math.random() - 0.5) * 5;
        } else if (agent.tags.includes('ai') || agent.tags.includes('assistant')) {
            x = (Math.random() - 0.5) * 8;
            z = (Math.random() - 0.5) * 8;
        } else {
            const angle = Math.random() * Math.PI * 2;
            const radius = 5 + Math.random() * 15;
            x = Math.cos(angle) * radius;
            z = Math.sin(angle) * radius;
        }
    } else {
        const angle = Math.random() * Math.PI * 2;
        const radius = 20 + Math.random() * 10;
        x = Math.cos(angle) * radius;
        z = Math.sin(angle) * radius;
    }

    return { x, z };
}

/**
 * 从场景移除智能体
 * @param {string} agentId
 */
export function removeAgent(agentId) {
    const agent = agents.get(agentId);
    if (agent) {
        // 需要 scene 来移除，但这里只管理数据
        agents.delete(agentId);
        agentStates.delete(agentId);
        console.log('[AgentManager] Removed agent:', agentId);
    }
}

/**
 * 移除智能体的 mesh（需要传入 scene）
 * @param {THREE.Scene} scene
 * @param {string} agentId
 */
export function removeAgentMesh(scene, agentId) {
    const agent = agents.get(agentId);
    if (agent) {
        scene.remove(agent.mesh);
        agents.delete(agentId);
        agentStates.delete(agentId);
    }
}

/**
 * 显示思考图标
 * @param {string} agentId
 */
export function showThinkingIcon(agentId) {
    const agentData = agents.get(agentId);
    if (!agentData || !agentData.mesh) return;

    const mesh = agentData.mesh;

    // 移除已有的
    const existing = mesh.getObjectByName('thinkingIcon');
    if (existing) mesh.remove(existing);

    // 创建问号气泡
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#ffeb3b';
    ctx.beginPath();
    ctx.arc(64, 64, 50, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#ff9800';
    ctx.lineWidth = 4;
    ctx.stroke();

    // 问号
    ctx.fillStyle = '#333';
    ctx.font = 'bold 60px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('?', 64, 64);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.name = 'thinkingIcon';
    sprite.scale.set(1, 1, 1);
    sprite.position.y = 2;
    mesh.add(sprite);
}

/**
 * 隐藏思考图标
 * @param {string} agentId
 */
export function hideThinkingIcon(agentId) {
    const agentData = agents.get(agentId);
    if (!agentData || !agentData.mesh) return;

    const existing = agentData.mesh.getObjectByName('thinkingIcon');
    if (existing) {
        agentData.mesh.remove(existing);
    }
}

/**
 * 移动智能体到喷泉
 * @param {string} agentId
 */
export function moveAgentToFountain(agentId) {
    const agentData = agents.get(agentId);
    if (!agentData) return;

    agentData.mesh.userData.targetX = LANDMARKS.FOUNTAIN.x;
    agentData.mesh.userData.targetZ = LANDMARKS.FOUNTAIN.z;
}

/**
 * 移动智能体到指定位置
 * @param {string} agentId
 * @param {number} x
 * @param {number} z
 */
export function moveAgentToPosition(agentId, x, z) {
    const agentData = agents.get(agentId);
    if (!agentData) return;

    agentData.mesh.userData.targetX = x;
    agentData.mesh.userData.targetZ = z;
}

/**
 * 生成智能体新目标位置
 * @param {string} agentId
 */
export function generateNewTargetForAgent(agentId) {
    const agentData = agents.get(agentId);
    if (!agentData) return;

    const angle = Math.random() * Math.PI * 2;
    const radius = 5 + Math.random() * 15;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;

    agentData.mesh.userData.targetX = x;
    agentData.mesh.userData.targetZ = z;
}

/**
 * 获取智能体状态
 * @param {string} agentId
 */
export function getAgentState(agentId) {
    if (!agentStates.has(agentId)) {
        agentStates.set(agentId, {
            emotion: 'neutral',
            action: 'idle'
        });
    }
    return agentStates.get(agentId);
}

/**
 * 设置智能体情绪
 * @param {string} agentId
 * @param {string} emotion
 */
export function setAgentEmotion(agentId, emotion) {
    const state = getAgentState(agentId);
    state.emotion = emotion;
    // TODO: 更新情绪显示
}

/**
 * 设置智能体动作
 * @param {string} agentId
 * @param {string} action
 */
export function setAgentAction(agentId, action) {
    const state = getAgentState(agentId);
    state.action = action;
    // TODO: 执行动作动画
}

/**
 * 获取所有在线智能体
 */
export function getAllAgents() {
    return Array.from(agents.values());
}

/**
 * 获取单个智能体
 */
export function getAgent(agentId) {
    return agents.get(agentId);
}

/**
 * 更新智能体位置（每帧调用）
 * @param {number} deltaTime
 */
export function updateAgents(deltaTime) {
    for (const [agentId, agentData] of agents) {
        const mesh = agentData.mesh;
        const { targetX, targetZ, speed } = mesh.userData;

        // 移动向目标
        const dx = targetX - mesh.position.x;
        const dz = targetZ - mesh.position.z;
        const dist = Math.sqrt(dx * dx + dz * dz);

        if (dist > 0.1) {
            mesh.position.x += (dx / dist) * speed;
            mesh.position.z += (dz / dist) * speed;

            // 面向移动方向
            mesh.rotation.y = Math.atan2(dx, dz);
        }
    }
}

export default {
    addAgent,
    removeAgent,
    removeAgentMesh,
    showThinkingIcon,
    hideThinkingIcon,
    moveAgentToFountain,
    moveAgentToPosition,
    generateNewTargetForAgent,
    getAgentState,
    setAgentEmotion,
    setAgentAction,
    getAllAgents,
    getAgent,
    updateAgents
};
