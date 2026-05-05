/**
 * Ground - Simple flat terrain
 */

import * as THREE from 'three';

const CONFIG = {
    WORLD_SIZE: 200,
    GRASS_COLOR: 0x3a6a3e,
};

export function createBaseGround() {
    const geo = new THREE.PlaneGeometry(CONFIG.WORLD_SIZE, CONFIG.WORLD_SIZE, 1, 1);
    const mat = new THREE.MeshStandardMaterial({ color: CONFIG.GRASS_COLOR, roughness: 0.95 });
    const ground = new THREE.Mesh(geo, mat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.1;
    return ground;
}
