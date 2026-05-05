/**
 * Bridge - Various bridge types
 */

import * as THREE from 'three';

const WOOD_COLOR = 0x7a6550;
const STONE_COLOR = 0x6a6a6a;

function getPerpendicular(v1, v2) {
    const dx = v2.x - v1.x;
    const dz = v2.z - v1.z;
    const len = Math.sqrt(dx * dx + dz * dz);
    if (len === 0) return { x: 1, z: 0 };
    return { x: -dz / len, z: dx / len };
}

export function createSimpleBridge(x1, z1, x2, z2) {
    const group = new THREE.Group();
    
    const dx = x2 - x1;
    const dz = z2 - z1;
    const length = Math.sqrt(dx * dx + dz * dz) || 1;
    const angle = Math.atan2(dz, dx);
    const perp = getPerpendicular({x: x1, z: z1}, {x: x2, z: z2});
    
    const midX = (x1 + x2) / 2;
    const midZ = (z1 + z2) / 2;
    
    // Deck
    const deck = new THREE.Mesh(
        new THREE.BoxGeometry(length, 0.3, 5),
        new THREE.MeshStandardMaterial({ color: WOOD_COLOR })
    );
    deck.position.set(midX, 0.35, midZ);
    deck.rotation.y = -angle;
    group.add(deck);
    
    // Rails
    for (let side of [-1, 1]) {
        const rail = new THREE.Mesh(
            new THREE.BoxGeometry(length, 0.5, 0.15),
            new THREE.MeshStandardMaterial({ color: 0x5a4a3a })
        );
        rail.position.set(midX + perp.x * side * 2.2, 0.8, midZ + perp.z * side * 2.2);
        rail.rotation.y = -angle;
        group.add(rail);
    }
    
    return group;
}

export function createLightBridge(x1, z1, x2, z2) {
    const group = new THREE.Group();
    
    const dx = x2 - x1;
    const dz = z2 - z1;
    const length = Math.sqrt(dx * dx + dz * dz) || 1;
    const angle = Math.atan2(dz, dx);
    const perp = getPerpendicular({x: x1, z: z1}, {x: x2, z: z2});
    
    const midX = (x1 + x2) / 2;
    const midZ = (z1 + z2) / 2;
    
    // Glowing deck
    const deckMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: 0xffffaa,
        emissiveIntensity: 0.4,
    });
    const deck = new THREE.Mesh(new THREE.BoxGeometry(length, 0.3, 5), deckMat);
    deck.position.set(midX, 1.5, midZ);
    deck.rotation.y = -angle;
    group.add(deck);
    
    // Gold rails
    const railMat = new THREE.MeshStandardMaterial({
        color: 0xffd700,
        metalness: 0.8,
        emissive: 0xffaa00,
        emissiveIntensity: 0.3,
    });
    for (let side of [-1, 1]) {
        const rail = new THREE.Mesh(new THREE.BoxGeometry(length, 0.8, 0.15), railMat);
        rail.position.set(midX + perp.x * side * 2.2, 2.2, midZ + perp.z * side * 2.2);
        rail.rotation.y = -angle;
        group.add(rail);
    }
    
    return group;
}

export function createArchBridge(x1, z1, x2, z2) {
    const group = new THREE.Group();
    
    const dx = x2 - x1;
    const dz = z2 - z1;
    const length = Math.sqrt(dx * dx + dz * dz) || 1;
    const angle = Math.atan2(dz, dx);
    const perp = getPerpendicular({x: x1, z: z1}, {x: x2, z: z2});
    
    const midX = (x1 + x2) / 2;
    const midZ = (z1 + z2) / 2;
    
    // Arch
    const arch = new THREE.Mesh(
        new THREE.TorusGeometry(4, 0.3, 8, 12, Math.PI),
        new THREE.MeshStandardMaterial({ color: STONE_COLOR, metalness: 0.3 })
    );
    arch.position.set(midX, 1.5, midZ);
    arch.rotation.y = -angle;
    arch.rotation.x = Math.PI / 2;
    group.add(arch);
    
    // Deck
    const deck = new THREE.Mesh(
        new THREE.BoxGeometry(length, 0.25, 5),
        new THREE.MeshStandardMaterial({ color: STONE_COLOR })
    );
    deck.position.set(midX, 0.5, midZ);
    deck.rotation.y = -angle;
    group.add(deck);
    
    return group;
}

export function createGlassBridge(x1, z1, x2, z2) {
    const group = new THREE.Group();
    
    const dx = x2 - x1;
    const dz = z2 - z1;
    const length = Math.sqrt(dx * dx + dz * dz) || 1;
    const angle = Math.atan2(dz, dx);
    const perp = getPerpendicular({x: x1, z: z1}, {x: x2, z: z2});
    
    const midX = (x1 + x2) / 2;
    const midZ = (z1 + z2) / 2;
    
    // Glass deck
    const glassMat = new THREE.MeshStandardMaterial({
        color: 0xaaddff,
        transparent: true,
        opacity: 0.5,
        metalness: 0.9,
        roughness: 0.1,
    });
    const glass = new THREE.Mesh(new THREE.BoxGeometry(length, 0.15, 3), glassMat);
    glass.position.set(midX, 0.5, midZ);
    glass.rotation.y = -angle;
    group.add(glass);
    
    // White rails
    const railMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.9 });
    for (let side of [-1, 1]) {
        const rail = new THREE.Mesh(new THREE.BoxGeometry(length, 0.6, 0.1), railMat);
        rail.position.set(midX + perp.x * side * 1.4, 1.1, midZ + perp.z * side * 1.4);
        rail.rotation.y = -angle;
        group.add(rail);
    }
    
    return group;
}
