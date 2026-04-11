/**
 * @fileoverview 动画循环系统
 * 
 * 职责：
 * - 主渲染循环
 * - 各子系统更新调度
 * - 时间跟踪
 * 
 * 使用方式：
 *   import { startAnimationLoop } from './systems/animation.js';
 *   startAnimationLoop(renderer, scene, camera);
 * 
 * @module systems/animation
 */

import * as THREE from 'three';

// 状态
let isRunning = false;
let animationId = null;
let clock = null;
let lastTime = 0;
let frameCount = 0;
let lastFpsTime = 0;
let fps = 0;

// 子系统更新器
const updaters = [];

/**
 * 注册更新器
 * @param {Function} updateFn - (deltaTime, elapsed) => void
 * @param {string} name - 名称
 */
export function registerUpdater(updateFn, name = 'unnamed') {
    updaters.push({ updateFn, name });
    console.log(`[Animation] Registered updater: ${name}`);
}

/**
 * 启动动画循环
 * @param {THREE.WebGLRenderer} renderer
 * @param {THREE.Scene} scene
 * @param {THREE.Camera} camera
 */
export function startAnimationLoop(renderer, scene, camera) {
    if (isRunning) {
        console.warn('[Animation] Already running');
        return;
    }

    isRunning = true;
    clock = new THREE.Clock();
    lastTime = 0;
    frameCount = 0;
    lastFpsTime = performance.now();
    fps = 0;

    console.log('[Animation] Starting animation loop');

    function animate() {
        if (!isRunning) return;

        animationId = requestAnimationFrame(animate);

        const elapsed = clock.getElapsedTime();
        const deltaTime = clock.getDelta(); // 注意：getDelta() 会重置，所以用 elapsed - lastTime
        lastTime = elapsed;

        // FPS 计算
        frameCount++;
        const now = performance.now();
        if (now - lastFpsTime >= 1000) {
            fps = frameCount;
            frameCount = 0;
            lastFpsTime = now;
            // console.log('[Animation] FPS:', fps);
        }

        // 调用所有注册的上Updater
        for (const updater of updaters) {
            try {
                updater.updateFn(deltaTime, elapsed);
            } catch (e) {
                console.error(`[Animation] Updater ${updater.name} error:`, e);
            }
        }

        // 更新控制器
        if (window.updateControls) {
            window.updateControls();
        }

        // 渲染
        if (renderer && scene && camera) {
            renderer.render(scene, camera);
        }
    }

    animate();
}

/**
 * 停止动画循环
 */
export function stopAnimationLoop() {
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
    isRunning = false;
    console.log('[Animation] Stopped');
}

/**
 * 暂停/恢复
 */
export function toggleAnimation() {
    if (isRunning) {
        stopAnimationLoop();
    } else {
        // 需要重新调用 startAnimationLoop
        console.warn('[Animation] Call startAnimationLoop to resume');
    }
}

/**
 * 获取当前 FPS
 */
export function getFps() {
    return fps;
}

/**
 * 获取已运行时间
 */
export function getElapsed() {
    return clock ? clock.getElapsedTime() : 0;
}

/**
 * 是否正在运行
 */
export function isAnimating() {
    return isRunning;
}

// 兼容旧代码
window.animate = () => {
    console.log('[Animation] animate called - system running:', isRunning);
};

export default {
    startAnimationLoop,
    stopAnimationLoop,
    toggleAnimation,
    registerUpdater,
    getFps,
    getElapsed,
    isAnimating
};
