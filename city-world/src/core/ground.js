/**
 * @fileoverview 地面系统
 * 
 * 职责：
 * - 创建主地面（草地）
 * - 道路系统
 * - 水体（湖泊、河流）
 * 
 * @module core/ground
 */

import * as THREE from 'three';

/**
 * 创建地面
 * @param {THREE.Scene} scene
 * @returns {THREE.Mesh}
 */
export function createGround(scene) {
    const geometry = new THREE.PlaneGeometry(200, 200);
    const material = new THREE.MeshStandardMaterial({
        color: 0x3a5a3a,
        roughness: 0.9,
        metalness: 0.1
    });
    
    const ground = new THREE.Mesh(geometry, material);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    ground.position.y = 0;
    
    scene.add(ground);
    return ground;
}

/**
 * 创建道路
 * @param {THREE.Scene} scene
 */
export function createRoads(scene) {
    // TODO: 实现道路创建
}

/**
 * 创建湖泊
 * @param {THREE.Scene} scene
 * @param {Object} options - { x, z, size }
 */
export function createLake(scene, options = {}) {
    const geometry = new THREE.CircleGeometry(options.size || 10, 32);
    const material = new THREE.MeshStandardMaterial({
        color: 0x3388cc,
        transparent: true,
        opacity: 0.8
    });
    
    const lake = new THREE.Mesh(geometry, material);
    lake.rotation.x = -Math.PI / 2;
    lake.position.set(options.x || 0, 0.1, options.z || 0);
    
    scene.add(lake);
    return lake;
}

export default { createGround, createRoads, createLake };
