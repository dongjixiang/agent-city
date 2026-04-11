/**
 * @fileoverview 智能体模型工厂
 * 
 * 职责：
 * - 根据类型创建智能体 3D 模型
 * - 龙虾模型、人形模型的创建
 * - 模型缓存
 * 
 * @module agents/factory
 */

import * as THREE from 'three';

// 模型缓存
const modelCache = new Map();

/**
 * 智能体类型
 */
export const AgentType = {
    LOBSTER: 'lobster',
    HUMAN: 'human',
    BEAUTY: 'beauty'
};

/**
 * 创建智能体模型
 * @param {THREE.Scene} scene
 * @param {string} type - AgentType
 * @param {Object} options - 配置选项
 * @returns {THREE.Group}
 */
export function createAgentMesh(scene, type, options = {}) {
    switch (type) {
        case AgentType.LOBSTER:
            return createLobsterMesh(options);
        case AgentType.HUMAN:
            return createHumanMesh(options);
        case AgentType.BEAUTY:
            return createBeautyMesh(options);
        default:
            return createLobsterMesh(options);
    }
}

/**
 * 创建龙虾模型
 */
function createLobsterMesh(options = {}) {
    const group = new THREE.Group();
    group.name = 'lobster';
    
    // TODO: 从 city-world-full.js 的 createLobsterMesh 移植
    // 身体、钳子、触须等
    
    return group;
}

/**
 * 创建人形模型
 */
function createHumanMesh(options = {}) {
    const group = new THREE.Group();
    group.name = 'human';
    
    // TODO: 从 city-world-full.js 的 createHumanMesh 移植
    // 头部、身体、手臂、腿部
    
    return group;
}

/**
 * 创建美女模型
 */
function createBeautyMesh(options = {}) {
    // TODO: 创建更精细的人形模型
    return createHumanMesh(options);
}

/**
 * 释放模型缓存
 */
export function clearCache() {
    modelCache.clear();
}

export default { createAgentMesh, AgentType, clearCache };
