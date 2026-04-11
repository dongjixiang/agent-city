/**
 * @fileoverview 相机控制
 * 
 * 职责：
 * - 创建各类型相机
 * - 支持多种相机模式（orbit/follow/firstPerson）
 * - 相机跟随和切换动画
 * 
 * 使用方式：
 *   import { initCamera, setCameraMode } from './core/camera.js';
 *   const camera = initCamera(container);
 *   setCameraMode('follow');
 * 
 * @module core/camera
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// 相机模式
export const CameraMode = {
    ORBIT: 'orbit',
    TOP: 'top',
    FIRST_PERSON: 'firstPerson',
    FOLLOW: 'follow'
};

// 状态
let camera = null;
let controls = null;
let currentMode = CameraMode.ORBIT;
let selectedAgentId = null;
let agentMesh = null;

// 相机配置
const followDistance = 8;
const followHeight = 5;
const firstPersonHeight = 1.2;

/**
 * 初始化相机
 * @param {HTMLElement} container - 渲染容器
 * @param {number} width - 宽度
 * @param {number} height - 高度
 * @returns {THREE.PerspectiveCamera}
 */
export function initCamera(container, width, height) {
    const aspect = width / height;
    camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 2000);
    camera.position.set(0, 50, 50);
    camera.lookAt(0, 0, 0);

    // 创建轨道控制器
    controls = new OrbitControls(camera, container);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2;
    controls.minDistance = 5;
    controls.maxDistance = 200;

    // 监听窗口大小变化
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
    });

    console.log('[Camera] Initialized');
    return camera;
}

/**
 * 获取相机
 */
export function getCamera() {
    return camera;
}

/**
 * 获取控制器
 */
export function getControls() {
    return controls;
}

/**
 * 设置相机模式
 * @param {string} mode
 */
export function setCameraMode(mode) {
    currentMode = mode;

    if (controls) {
        controls.enabled = (mode === CameraMode.ORBIT);
    }

    window.dispatchEvent(new CustomEvent('cameraModeChanged', { detail: { mode } }));
    console.log('[Camera] Mode:', mode);
}

/**
 * 获取当前模式
 */
export function getCameraMode() {
    return currentMode;
}

/**
 * 设置选中的智能体（用于跟随/第一人称）
 * @param {string} agentId
 * @param {THREE.Group} mesh
 */
export function setFollowTarget(agentId, mesh) {
    selectedAgentId = agentId;
    agentMesh = mesh;
}

/**
 * 更新相机（每帧调用）
 */
export function updateCamera() {
    if (!camera || !agentMesh) return;

    if (currentMode === CameraMode.FOLLOW) {
        // 跟随模式
        const angle = Math.atan2(agentMesh.position.x, agentMesh.position.z);
        const offsetX = Math.sin(angle) * followDistance;
        const offsetZ = Math.cos(angle) * followDistance;

        camera.position.x += (agentMesh.position.x + offsetX - camera.position.x) * 0.05;
        camera.position.y += (agentMesh.position.y + followHeight - camera.position.y) * 0.05;
        camera.position.z += (agentMesh.position.z + offsetZ - camera.position.z) * 0.05;
        camera.lookAt(agentMesh.position.x, agentMesh.position.y + 1, agentMesh.position.z);

    } else if (currentMode === CameraMode.FIRST_PERSON) {
        // 第一人称模式
        camera.position.x = agentMesh.position.x;
        camera.position.y = agentMesh.position.y + firstPersonHeight;
        camera.position.z = agentMesh.position.z;

        // 面向移动方向
        const targetX = agentMesh.userData.targetX;
        const targetZ = agentMesh.userData.targetZ;
        if (targetX !== undefined && targetZ !== undefined) {
            const lookX = targetX - agentMesh.position.x;
            const lookZ = targetZ - agentMesh.position.z;
            if (Math.abs(lookX) > 0.1 || Math.abs(lookZ) > 0.1) {
                camera.lookAt(
                    agentMesh.position.x + lookX,
                    agentMesh.position.y + firstPersonHeight,
                    agentMesh.position.z + lookZ
                );
            }
        }
    }
}

/**
 * 聚焦到指定位置
 * @param {number} x
 * @param {number} y
 * @param {number} z
 */
export function focusOn(x, y, z) {
    if (controls) {
        controls.target.set(x, y, z);
        controls.update();
    }
}

export default {
    CameraMode,
    initCamera,
    getCamera,
    getControls,
    setCameraMode,
    getCameraMode,
    setFollowTarget,
    updateCamera,
    focusOn
};
