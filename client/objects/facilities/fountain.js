/**
 * Fountain - Central plaza fountain
 */

import * as THREE from 'three';

export function createFountain(x, z) {
    const group = new THREE.Group();
    
    // Pool
    const pool = new THREE.Mesh(
        new THREE.CylinderGeometry(6, 6, 1, 16),
        new THREE.MeshStandardMaterial({ color: 0x7a8a9a, roughness: 0.4 })
    );
    pool.position.y = 0.5;
    group.add(pool);
    
    // Water surface
    const water = new THREE.Mesh(
        new THREE.CircleGeometry(5.5, 24),
        new THREE.MeshStandardMaterial({ color: 0x4a90d9, transparent: true, opacity: 0.7 })
    );
    water.rotation.x = Math.PI / 2;
    water.position.y = 0.8;
    group.add(water);
    
    // Central statue
    const statueMat = new THREE.MeshStandardMaterial({ color: 0x8fa8bf, metalness: 0.6 });
    const statue = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.6, 5, 8), statueMat);
    statue.position.y = 3.5;
    group.add(statue);
    
    // Top orb
    const orb = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 12), statueMat);
    orb.position.y = 6.5;
    group.add(orb);
    
    // Water spray (simplified)
    const sprayMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 });
    for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const spray = new THREE.Mesh(new THREE.ConeGeometry(0.1, 1.5, 4), sprayMat);
        spray.position.set(Math.cos(angle) * 2, 1.5, Math.sin(angle) * 2);
        spray.rotation.z = Math.cos(angle) * 0.5;
        spray.rotation.x = Math.sin(angle) * 0.5;
        group.add(spray);
    }
    
    group.position.set(x, 0, z);
    return group;
}

