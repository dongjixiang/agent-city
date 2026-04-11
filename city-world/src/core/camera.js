/**
 * @fileoverview 相机控制
 * 
 * 职责：
 * - 创建各类型相机（透视/正交）
 * - 支持多种相机模式（俯瞰、自由、第一人称）
 * - 相机动画过渡
 * 
 * @module core/camera
 */

import * as THREE from 'three';

// 相机模式
export const CameraMode = {
    ORBIT: 'orbit',           // 轨道模式（默认）
    TOP: 'top',              // 俯视
    FIRST_PERSON: 'firstPerson', // 第一人称
    FOLLOW: 'follow'          // 跟随智能体
};

let currentMode = CameraMode.ORBIT;
let targetCamera = null;
let orbitControls = null;

/**
 * 创建相机
 * @param {number} aspect - 宽高比
 * @returns {THREE.PerspectiveCamera}
 */
export function createCamera(aspect) {
    const camera = new THREE.PerspectiveCamera(
        60,
        aspect,
        0.1,
        1000
    );
    camera.position.set(0, 50, 50);
    camera.lookAt(0, 0, 0);
    
    targetCamera = camera;
    return camera;
}

/**
 * 设置相机模式
 * @param {string} mode - 模式
 * @param {Object} options - 模式特定选项
 */
export function setCameraMode(mode, options = {}) {
    currentMode = mode;
    
    switch (mode) {
        case CameraMode.TOP:
            // 俯视：正上方
            animateCameraTo({ x: 0, y: 100, z: 0 }, { x: 0, y: 0, z: 0 });
            break;
            
        case CameraMode.FIRST_PERSON:
            // 第一人称：低位
            if (options.agentPosition) {
                animateCameraTo({
                    x: options.agentPosition.x,
                    y: options.agentPosition.y + 2,
                    z: options.agentPosition.z + 5
                }, options.target || { x: 0, y: 0, z: 0 });
            }
            break;
            
        case CameraMode.ORBIT:
        default:
            // 恢复默认轨道位置
            animateCameraTo({ x: 0, y: 50, z: 50 }, { x: 0, y: 0, z: 0 });
            break;
    }
}

/**
 * 相机平滑移动到目标位置
 */
function animateCameraTo(targetPos, lookAt) {
    // TODO: 实现平滑过渡动画
    if (targetCamera) {
        targetCamera.position.set(targetPos.x, targetPos.y, targetPos.z);
        targetCamera.lookAt(lookAt.x, lookAt.y, lookAt.z);
    }
}

/**
 * 获取当前相机模式
 */
export function getCurrentMode() {
    return currentMode;
}

export default { createCamera, setCameraMode, getCurrentMode, CameraMode };
