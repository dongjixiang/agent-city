/**
 * @fileoverview 灯光系统
 * 
 * 职责：
 * - 创建环境光、方向光、点光源
 * - 昼夜循环时的灯光变化
 * - 特殊场景灯光效果
 * 
 * @module core/lighting
 */

import * as THREE from 'three';

let lights = {};

/**
 * 创建所有灯光
 * @param {THREE.Scene} scene
 * @returns {Object} lights - 灯光对象集合
 */
export function createLights(scene) {
    // 环境光
    lights.ambient = new THREE.AmbientLight(0x404040, 0.5);
    scene.add(lights.ambient);

    // 主方向光（太阳）
    lights.sun = new THREE.DirectionalLight(0xffffff, 1);
    lights.sun.position.set(50, 100, 50);
    lights.sun.castShadow = true;
    scene.add(lights.sun);

    // 补光
    lights.fill = new THREE.DirectionalLight(0x8888ff, 0.3);
    lights.fill.position.set(-50, 50, -50);
    scene.add(lights.fill);

    return lights;
}

/**
 * 设置白天模式
 */
export function setDaylight() {
    if (lights.ambient) {
        lights.ambient.intensity = 0.6;
        lights.ambient.color.setHex(0xffffff);
    }
    if (lights.sun) {
        lights.sun.intensity = 1;
        lights.sun.color.setHex(0xffffff);
    }
}

/**
 * 设置夜晚模式
 */
export function setNightlight() {
    if (lights.ambient) {
        lights.ambient.intensity = 0.2;
        lights.ambient.color.setHex(0x1a1a3e);
    }
    if (lights.sun) {
        lights.sun.intensity = 0.3;
        lights.sun.color.setHex(0x4444aa);
    }
}

/**
 * 设置傍晚模式
 */
export function setEveningLight() {
    if (lights.ambient) {
        lights.ambient.intensity = 0.4;
        lights.ambient.color.setHex(0xffaa66);
    }
    if (lights.sun) {
        lights.sun.intensity = 0.7;
        lights.sun.color.setHex(0xff6633);
    }
}

/**
 * 获取灯光对象
 */
export function getLights() {
    return lights;
}

export default { createLights, setDaylight, setNightlight, setEveningLight, getLights };
