/**
 * Flowers - Colorful flower field
 *
 * @module objects/decorations/flowers
 */

import * as THREE from 'three';

/**
 * Flower types with different colors and heights
 */
const FLOWER_TYPES = {
    tulip: { height: 0.6, color: 0xff4444, petalSize: 0.15 },
    sunflower: { height: 1.2, color: 0xffdd00, petalSize: 0.2 },
    rose: { height: 0.5, color: 0xff69b4, petalSize: 0.12 },
    lavender: { height: 0.8, color: 0x9966ff, petalSize: 0.08 },
    daisy: { height: 0.35, color: 0xffffff, petalSize: 0.1 },
    bluebell: { height: 0.45, color: 0x4444ff, petalSize: 0.1 },
    poppy: { height: 0.55, color: 0xff2200, petalSize: 0.14 },
    lily: { height: 0.9, color: 0xffaa00, petalSize: 0.18 },
};

/**
 * Create a single flower
 */
export function createFlower(x, z, type = 'tulip') {
    const group = new THREE.Group();
    const config = FLOWER_TYPES[type] || FLOWER_TYPES.tulip;
    
    // Stem
    const stemMat = new THREE.MeshStandardMaterial({ color: 0x228B22 });
    const stem = new THREE.Mesh(
        new THREE.CylinderGeometry(0.03, 0.04, config.height, 6),
        stemMat
    );
    stem.position.y = config.height / 2;
    group.add(stem);
    
    // Flower head
    const petalMat = new THREE.MeshStandardMaterial({ color: config.color });
    
    if (type === 'sunflower') {
        // Sunflower - large center with petals
        const center = new THREE.Mesh(
            new THREE.CylinderGeometry(0.15, 0.15, 0.05, 16),
            new THREE.MeshStandardMaterial({ color: 0x8B4513 })
        );
        center.position.y = config.height + 0.02;
        group.add(center);
        
        // Petals around
        for (let i = 0; i < 12; i++) {
            const petal = new THREE.Mesh(
                new THREE.BoxGeometry(0.15, 0.3, 0.02),
                petalMat
            );
            const angle = (i / 12) * Math.PI * 2;
            petal.position.set(
                Math.cos(angle) * 0.2,
                config.height + 0.1,
                Math.sin(angle) * 0.2
            );
            petal.rotation.y = -angle;
            group.add(petal);
        }
    } else if (type === 'rose' || type === 'poppy') {
        // Layered petals
        for (let layer = 0; layer < 3; layer++) {
            const petalCount = 5 + layer * 2;
            const layerScale = 1 - layer * 0.25;
            for (let i = 0; i < petalCount; i++) {
                const petal = new THREE.Mesh(
                    new THREE.SphereGeometry(config.petalSize * layerScale, 6, 6),
                    petalMat
                );
                const angle = (i / petalCount) * Math.PI * 2;
                petal.position.set(
                    Math.cos(angle) * config.petalSize * layerScale * 0.8,
                    config.height - 0.1 + layer * 0.05,
                    Math.sin(angle) * config.petalSize * layerScale * 0.8
                );
                group.add(petal);
            }
        }
    } else if (type === 'lavender' || type === 'bluebell') {
        // Vertical cluster
        for (let i = 0; i < 8; i++) {
            const bell = new THREE.Mesh(
                new THREE.SphereGeometry(config.petalSize, 6, 6),
                petalMat
            );
            bell.position.set(
                (Math.random() - 0.5) * 0.1,
                config.height - i * 0.08,
                (Math.random() - 0.5) * 0.1
            );
            bell.scale.y = 1.5;
            group.add(bell);
        }
    } else if (type === 'daisy') {
        // White petals with yellow center
        for (let i = 0; i < 10; i++) {
            const petal = new THREE.Mesh(
                new THREE.BoxGeometry(0.06, 0.15, 0.02),
                petalMat
            );
            const angle = (i / 10) * Math.PI * 2;
            petal.position.set(
                Math.cos(angle) * 0.1,
                config.height,
                Math.sin(angle) * 0.1
            );
            petal.rotation.y = -angle;
            group.add(petal);
        }
        // Yellow center
        const center = new THREE.Mesh(
            new THREE.SphereGeometry(0.08, 8, 8),
            new THREE.MeshStandardMaterial({ color: 0xffdd00 })
        );
        center.position.y = config.height;
        group.add(center);
    } else {
        // Default - simple tulip shape
        const petal = new THREE.Mesh(
            new THREE.SphereGeometry(config.petalSize, 8, 8),
            petalMat
        );
        petal.position.y = config.height + config.petalSize / 2;
        petal.scale.y = 1.3;
        group.add(petal);
    }
    
    // Leaves on stem
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x228B22 });
    const leftLeaf = new THREE.Mesh(
        new THREE.BoxGeometry(0.15, 0.08, 0.02),
        leafMat
    );
    leftLeaf.position.set(-0.1, config.height * 0.4, 0);
    leftLeaf.rotation.z = Math.PI / 4;
    group.add(leftLeaf);
    
    const rightLeaf = leftLeaf.clone();
    rightLeaf.position.x = 0.1;
    rightLeaf.rotation.z = -Math.PI / 4;
    group.add(rightLeaf);
    
    group.position.set(x, 0, z);
    group.scale.setScalar(0.8 + Math.random() * 0.4);
    return group;
}

/**
 * Create a flower field
 * @param {number} x - Left edge X
 * @param {number} z - Bottom edge Z
 * @param {number} width - Field width
 * @param {number} depth - Field depth
 * @param {number} density - Number of flowers
 */
export function createFlowerField(x, z, width, depth, density = 200) {
    const group = new THREE.Group();
    
    // Ground
    const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(width, depth),
        new THREE.MeshStandardMaterial({ color: 0x90EE90, transparent: true, opacity: 0.8 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(x + width / 2, 0.01, z + depth / 2);
    group.add(ground);
    
    // Flower types
    const types = Object.keys(FLOWER_TYPES);
    
    // Plant flowers
    for (let i = 0; i < density; i++) {
        const fx = x + Math.random() * width;
        const fz = z + Math.random() * depth;
        const type = types[Math.floor(Math.random() * types.length)];
        const flower = createFlower(fx, fz, type);
        group.add(flower);
    }
    
    return group;
}
