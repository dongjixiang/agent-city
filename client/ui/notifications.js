/**
 * @fileoverview 通知系统（气泡、徽章）
 * 
 * 职责：
 * - 问候气泡
 * - 对话气泡
 * - 成就徽章
 * - 语音气泡
 * - 等级徽章
 * 
 * 使用方式：
 *   import { showGreeting, showDialogueBubble, showAchievementBadge } from './ui/notifications.js';
 *   showGreeting(agentId, scene, agents);
 * 
 * 导出：
 * - window.showGreeting
 * - window.showDialogueBubble
 * - window.hideDialogueBubble
 * - window.showAchievementBadge
 * - window.showVoiceBubble
 * - window.showLevelUpBadge
 * - window.playVoice
 * 
 * @module ui/notifications
 */

import * as THREE from 'three';

// 问候语
const GREETINGS = [
    '你好！', '很高兴见到你！', '欢迎来到智体城！', 
    '你好呀！', '今天怎么样？', '最近好吗？',
    '见到你很开心！', '欢迎欢迎！', '你好你好！'
];

// 通知管理器
const notifications = new Map();
const dialogueBubbles = new Map();
const achievementBadges = new Map();

/**
 * 显示问候气泡
 * @param {string} agentId
 * @param {THREE.Scene} scene
 * @param {Map} agents - agents Map
 */
export function showGreeting(agentId, scene, agents) {
    const agentData = agents.get(agentId);
    if (!agentData) return;

    // 移除已有的
    if (notifications.has(agentId)) {
        const existing = notifications.get(agentId);
        if (existing.timeout) clearTimeout(existing.timeout);
        if (existing.sprite && scene) {
            scene.remove(existing.sprite);
        }
    }

    // 创建气泡
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.beginPath();
    ctx.roundRect(0, 0, 256, 64, 12);
    ctx.fill();

    ctx.strokeStyle = '#9333EA';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = '#333';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const text = GREETINGS[Math.floor(Math.random() * GREETINGS.length)];
    ctx.fillText(text, 128, 32);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(material);
    sprite.position.set(agentData.mesh.position.x, agentData.mesh.position.y + 2.5, agentData.mesh.position.z);
    sprite.scale.set(2, 0.5, 1);
    
    if (scene) scene.add(sprite);

    const timeout = setTimeout(() => {
        if (scene && sprite) scene.remove(sprite);
        notifications.delete(agentId);
    }, 3000);

    notifications.set(agentId, { sprite, timeout });
}

/**
 * 显示对话气泡
 * @param {string} agentId
 * @param {string} content
 * @param {THREE.Scene} scene
 * @param {Map} agents
 */
export function showDialogueBubble(agentId, content, scene, agents) {
    const agentData = agents.get(agentId);
    if (!agentData) return;

    // 移除已有的
    if (dialogueBubbles.has(agentId)) {
        const existing = dialogueBubbles.get(agentId);
        if (existing.timeout) clearTimeout(existing.timeout);
        if (existing.sprite && scene) {
            scene.remove(existing.sprite);
        }
    }

    // 创建气泡
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.beginPath();
    ctx.roundRect(0, 0, 512, 128, 16);
    ctx.fill();

    ctx.strokeStyle = '#3B82F6';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = '#1F2937';
    ctx.font = 'bold 28px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // 截断长文本
    let text = content || '';
    if (text.length > 20) {
        text = text.substring(0, 18) + '...';
    }
    ctx.fillText(text, 256, 64);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(material);
    sprite.position.set(agentData.mesh.position.x, agentData.mesh.position.y + 2.5, agentData.mesh.position.z);
    sprite.scale.set(3, 0.75, 1);
    
    if (scene) scene.add(sprite);

    const timeout = setTimeout(() => {
        if (scene && sprite) scene.remove(sprite);
        dialogueBubbles.delete(agentId);
    }, 5000);

    dialogueBubbles.set(agentId, { sprite, timeout });
}

/**
 * 隐藏对话气泡
 * @param {string} agentId
 * @param {THREE.Scene} scene
 */
export function hideDialogueBubble(agentId, scene) {
    if (dialogueBubbles.has(agentId)) {
        const existing = dialogueBubbles.get(agentId);
        if (existing.timeout) clearTimeout(existing.timeout);
        if (existing.sprite && scene) {
            scene.remove(existing.sprite);
        }
        dialogueBubbles.delete(agentId);
    }
}

/**
 * 显示成就徽章
 * @param {string} agentId
 * @param {string} achievement
 * @param {string} placeName
 * @param {THREE.Scene} scene
 * @param {Map} agents
 */
export function showAchievementBadge(agentId, achievement, placeName, scene, agents) {
    const agentData = agents.get(agentId);
    if (!agentData) return;

    // 创建徽章
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // 渐变背景
    const gradient = ctx.createLinearGradient(0, 0, 512, 256);
    gradient.addColorStop(0, '#F59E0B');
    gradient.addColorStop(1, '#D97706');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.roundRect(0, 0, 512, 256, 20);
    ctx.fill();

    // 金色边框
    ctx.strokeStyle = '#FCD34D';
    ctx.lineWidth = 6;
    ctx.stroke();

    // 星星
    ctx.fillStyle = '#FEF3C7';
    ctx.font = 'bold 60px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('⭐ 成就达成 ⭐', 256, 80);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 32px Arial';
    ctx.fillText(achievement || '新成就', 256, 150);

    ctx.font = '24px Arial';
    ctx.fillText(placeName || '', 256, 200);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(material);
    sprite.position.set(agentData.mesh.position.x, agentData.mesh.position.y + 4, agentData.mesh.position.z);
    sprite.scale.set(4, 2, 1);
    
    if (scene) scene.add(sprite);

    const timeout = setTimeout(() => {
        if (scene && sprite) scene.remove(sprite);
        achievementBadges.delete(agentId);
    }, 4000);

    achievementBadges.set(agentId, { sprite, timeout });
}

/**
 * 显示语音气泡
 * @param {string} agentId
 * @param {THREE.Scene} scene
 * @param {Map} agents
 */
export function showVoiceBubble(agentId, scene, agents) {
    const agentData = agents.get(agentId);
    if (!agentData) return;

    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    // 圆形背景
    ctx.fillStyle = 'rgba(59, 130, 246, 0.9)';
    ctx.beginPath();
    ctx.arc(64, 64, 60, 0, Math.PI * 2);
    ctx.fill();

    // 音波图标
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(64, 64, 20, -Math.PI/2, Math.PI/2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(64, 64, 35, -Math.PI/2, Math.PI/2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(64, 64, 50, -Math.PI/2, Math.PI/2);
    ctx.stroke();

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(material);
    sprite.position.set(agentData.mesh.position.x, agentData.mesh.position.y + 3, agentData.mesh.position.z);
    sprite.scale.set(1, 1, 1);
    
    if (scene) scene.add(sprite);

    return sprite;
}

/**
 * 播放语音（显示气泡）
 * @param {string} agentId
 * @param {string} text
 * @param {THREE.Scene} scene
 * @param {Map} agents
 */
export function playVoice(agentId, text, scene, agents) {
    // 显示语音气泡
    const sprite = showVoiceBubble(agentId, scene, agents);
    
    // 3秒后消失
    setTimeout(() => {
        if (scene && sprite) scene.remove(sprite);
    }, 3000);
}

/**
 * 显示等级徽章
 * @param {string} agentId
 * @param {number} level
 * @param {THREE.Scene} scene
 * @param {Map} agents
 */
export function showLevelUpBadge(agentId, level, scene, agents) {
    const agentData = agents.get(agentId);
    if (!agentData) return;

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // 紫色渐变背景
    const gradient = ctx.createLinearGradient(0, 0, 512, 256);
    gradient.addColorStop(0, '#8B5CF6');
    gradient.addColorStop(1, '#6D28D9');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.roundRect(0, 0, 512, 256, 20);
    ctx.fill();

    ctx.strokeStyle = '#C4B5FD';
    ctx.lineWidth = 6;
    ctx.stroke();

    ctx.fillStyle = '#FEF3C7';
    ctx.font = 'bold 60px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`🎉 等级 ${level} 🎉`, 256, 140);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '28px Arial';
    ctx.fillText('恭喜升级！', 256, 200);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(material);
    sprite.position.set(agentData.mesh.position.x, agentData.mesh.position.y + 4.5, agentData.mesh.position.z);
    sprite.scale.set(4, 2, 1);
    
    if (scene) scene.add(sprite);

    setTimeout(() => {
        if (scene && sprite) scene.remove(sprite);
    }, 4000);
}

// 挂载到 window（兼容旧代码）
window.showGreeting = (agentId) => {
    console.log('[Notifications] showGreeting called');
};

window.showDialogueBubble = (agentId, content) => {
    console.log('[Notifications] showDialogueBubble:', content?.substring(0, 30));
};

window.hideDialogueBubble = (agentId) => {
    console.log('[Notifications] hideDialogueBubble');
};

window.showAchievementBadge = (agentId, achievement, placeName) => {
    console.log('[Notifications] Achievement:', achievement);
};

window.showVoiceBubble = () => {
    console.log('[Notifications] showVoiceBubble');
};

window.showLevelUpBadge = (agentId, level) => {
    console.log('[Notifications] Level up:', level);
};

window.playVoice = () => {
    console.log('[Notifications] playVoice');
};

export default {
    showGreeting,
    showDialogueBubble,
    hideDialogueBubble,
    showAchievementBadge,
    showVoiceBubble,
    showLevelUpBadge,
    playVoice
};


export class Notifications { init() { console.log('[Notifications] Initialized'); } }
