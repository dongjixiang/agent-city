/**
 * Tree - Simple stylized trees
 */

import * as THREE from 'three';

function rand(min, max) { return min + Math.random() * (max - min); }

const TREE_COLORS = {
    maple: 0xd44a2a,
    cherry: 0xffb7c5,
    willow: 0x5a8a5a,
    oak: 0x3d6b3d,
    pine: 0x2d5a2d,
};

export function createTree(x, z, type = 'oak', scale = 1) {
    const group = new THREE.Group();
    const color = TREE_COLORS[type] || TREE_COLORS.oak;
    
    // Trunk
    const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.15 * scale, 0.2 * scale, 2 * scale, 6),
        new THREE.MeshStandardMaterial({ color: 0x5a4030 })
    );
    trunk.position.y = scale;
    group.add(trunk);
    
    // Foliage
    const foliage = new THREE.Mesh(
        new THREE.SphereGeometry(1.2 * scale, 8, 6),
        new THREE.MeshStandardMaterial({ color })
    );
    foliage.position.y = 2.5 * scale;
    foliage.scale.y = 0.7 + Math.random() * 0.3;
    group.add(foliage);
    
    group.position.set(x, 0, z);
    return group;
}

export function createPineTree(x, z, scale = 1) {
    const group = new THREE.Group();
    
    const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.15 * scale, 0.2 * scale, 2 * scale, 6),
        new THREE.MeshStandardMaterial({ color: 0x5a4030 })
    );
    trunk.position.y = scale;
    group.add(trunk);
    
    for (let i = 0; i < 3; i++) {
        const cone = new THREE.Mesh(
            new THREE.ConeGeometry((1.5 - i * 0.3) * scale, 1.5 * scale, 8),
            new THREE.MeshStandardMaterial({ color: 0x2d5a2d })
        );
        cone.position.y = 2 * scale + i * 0.8 * scale;
        group.add(cone);
    }
    
    group.position.set(x, 0, z);
    return group;
}

// Palm tree - tall trunk with fronds at top
export function createPalmTree(x, z, scale = 1) {
    const group = new THREE.Group();
    
    // Tall thin trunk
    const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1 * scale, 0.15 * scale, 4 * scale, 6),
        new THREE.MeshStandardMaterial({ color: 0x8b7355 })
    );
    trunk.position.y = 2 * scale;
    group.add(trunk);
    
    // Palm fronds (leaves) at top
    const frondMat = new THREE.MeshStandardMaterial({ color: 0x228b22 });
    for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        const frond = new THREE.Mesh(
            new THREE.ConeGeometry(0.3 * scale, 2 * scale, 4),
            frondMat
        );
        frond.position.set(
            Math.cos(angle) * 0.5 * scale,
            4 * scale,
            Math.sin(angle) * 0.5 * scale
        );
        frond.rotation.z = Math.PI / 3;
        frond.rotation.y = -angle;
        group.add(frond);
    }
    
    // Coconuts at top
    const coconutMat = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
    for (let i = 0; i < 3; i++) {
        const coconut = new THREE.Mesh(
            new THREE.SphereGeometry(0.15 * scale, 6, 4),
            coconutMat
        );
        coconut.position.set(
            Math.cos(i * 2.1) * 0.2 * scale,
            3.8 * scale,
            Math.sin(i * 2.1) * 0.2 * scale
        );
        group.add(coconut);
    }
    
    group.position.set(x, 0, z);
    return group;
}

// Fruit tree - apple/pear style with fruits
export function createFruitTree(x, z, fruitType = 'apple', scale = 1) {
    const group = new THREE.Group();
    
    // Trunk
    const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2 * scale, 0.25 * scale, 2 * scale, 6),
        new THREE.MeshStandardMaterial({ color: 0x8B4513 })
    );
    trunk.position.y = scale;
    group.add(trunk);
    
    // Foliage (round canopy)
    const foliageColor = fruitType === 'apple' ? 0x228B22 : (fruitType === 'pear' ? 0x32CD32 : 0xffb7c5);
    const foliage = new THREE.Mesh(
        new THREE.SphereGeometry(1.5 * scale, 8, 8),
        new THREE.MeshStandardMaterial({ color: foliageColor })
    );
    foliage.position.y = 3 * scale;
    group.add(foliage);
    
    // Fruits
    const fruitColor = fruitType === 'apple' ? 0xdc143c : (fruitType === 'pear' ? 0xffd700 : 0xffa07a);
    const fruitMat = new THREE.MeshStandardMaterial({ color: fruitColor });
    for (let i = 0; i < 5; i++) {
        const fruit = new THREE.Mesh(
            new THREE.SphereGeometry(0.15 * scale, 6, 6),
            fruitMat
        );
        const angle = (i / 5) * Math.PI * 2;
        const r = 0.8 * scale;
        fruit.position.set(
            Math.cos(angle) * r,
            3 * scale + (Math.random() - 0.5) * 0.5 * scale,
            Math.sin(angle) * r
        );
        group.add(fruit);
    }
    
    group.position.set(x, 0, z);
    return group;
}
