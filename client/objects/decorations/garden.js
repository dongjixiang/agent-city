/**
 * Garden decorations - parks, flower beds, gardens
 */

import * as THREE from 'three';

// ============ FLOWER BED ============
export function createFlowerBed(x, z, size = 3) {
    const group = new THREE.Group();
    
    // Dirt base
    const base = new THREE.Mesh(
        new THREE.BoxGeometry(size, 0.2, size),
        new THREE.MeshStandardMaterial({ color: 0x8b4513 })
    );
    base.position.y = 0.1;
    group.add(base);
    
    // Flowers
    const flowerColors = [0xff0000, 0xff69b4, 0xffd700, 0xffa500, 0xee82ee, 0xffffff, 0xff1493];
    for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const dist = size * 0.3;
        const color = flowerColors[Math.floor(Math.random() * flowerColors.length)];
        
        // Stem
        const stem = new THREE.Mesh(
            new THREE.CylinderGeometry(0.05, 0.05, 0.5, 4),
            new THREE.MeshStandardMaterial({ color: 0x228b22 })
        );
        stem.position.set(Math.cos(angle) * dist, 0.45, Math.sin(angle) * dist);
        group.add(stem);
        
        // Flower
        const flower = new THREE.Mesh(
            new THREE.SphereGeometry(0.2, 6, 6),
            new THREE.MeshStandardMaterial({ color })
        );
        flower.position.set(Math.cos(angle) * dist, 0.75, Math.sin(angle) * dist);
        group.add(flower);
    }
    
    group.position.set(x, 0, z);
    return group;
}

// ============ SMALL PARK ============
export function createSmallPark(x, z) {
    const group = new THREE.Group();
    
    // Grass area
    const grass = new THREE.Mesh(
        new THREE.BoxGeometry(12, 0.15, 10),
        new THREE.MeshStandardMaterial({ color: 0x228b22 })
    );
    grass.position.y = 0.075;
    group.add(grass);
    
    // Path through park
    const path = new THREE.Mesh(
        new THREE.BoxGeometry(2, 0.1, 10),
        new THREE.MeshStandardMaterial({ color: 0xd2b48c })
    );
    path.position.y = 0.12;
    group.add(path);
    
    // Trees
    const treePositions = [
        { x: -4, z: -3 }, { x: 4, z: -3 },
        { x: -4, z: 3 }, { x: 4, z: 3 },
        { x: 0, z: -4 }, { x: 0, z: 4 }
    ];
    
    treePositions.forEach(pos => {
        if (Math.random() > 0.3) {
            const tree = createParkTree(pos.x, pos.z);
            group.add(tree);
        }
    });
    
    // Benches
    const bench1 = new THREE.Mesh(
        new THREE.BoxGeometry(2, 0.3, 0.6),
        new THREE.MeshStandardMaterial({ color: 0x8b4513 })
    );
    bench1.position.set(-3, 0.25, 0);
    group.add(bench1);
    
    const bench2 = bench1.clone();
    bench2.position.set(3, 0.25, 0);
    group.add(bench2);
    
    // Fountain in center
    const fountainBase = new THREE.Mesh(
        new THREE.CylinderGeometry(1, 1.2, 0.5, 8),
        new THREE.MeshStandardMaterial({ color: 0x696969 })
    );
    fountainBase.position.set(0, 0.35, 0);
    group.add(fountainBase);
    
    const fountainTop = new THREE.Mesh(
        new THREE.CylinderGeometry(0.6, 0.8, 0.3, 8),
        new THREE.MeshStandardMaterial({ color: 0x808080 })
    );
    fountainTop.position.set(0, 0.75, 0);
    group.add(fountainTop);
    
    // Water in fountain
    const water = new THREE.Mesh(
        new THREE.CylinderGeometry(0.5, 0.5, 0.2, 8),
        new THREE.MeshStandardMaterial({ color: 0x4169e1, transparent: true, opacity: 0.8 })
    );
    water.position.set(0, 0.6, 0);
    group.add(water);
    
    group.position.set(x, 0, z);
    return group;
}

// ============ PARK TREE ============
function createParkTree(x, z) {
    const group = new THREE.Group();
    
    const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.3, 2, 6),
        new THREE.MeshStandardMaterial({ color: 0x8b4513 })
    );
    trunk.position.y = 1;
    group.add(trunk);
    
    const foliageColors = [0x228b22, 0x32cd32, 0x2e8b57, 0x3cb371];
    const foliageColor = foliageColors[Math.floor(Math.random() * foliageColors.length)];
    
    const foliage = new THREE.Mesh(
        new THREE.SphereGeometry(1.5, 8, 8),
        new THREE.MeshStandardMaterial({ color: foliageColor })
    );
    foliage.position.y = 3;
    group.add(foliage);
    
    group.position.set(x, 0, z);
    return group;
}

// ============ GARDEN PLOT ============
export function createGardenPlot(x, z) {
    const group = new THREE.Group();
    
    // Fence
    const fenceMat = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
    
    // Posts
    for (let px = -3; px <= 3; px += 2) {
        const post = new THREE.Mesh(
            new THREE.BoxGeometry(0.2, 1, 0.2),
            fenceMat
        );
        post.position.set(px, 0.5, -2.5);
        group.add(post);
        
        const post2 = post.clone();
        post2.position.z = 2.5;
        group.add(post2);
    }
    
    for (let pz = -2; pz <= 2; pz += 2) {
        const post = new THREE.Mesh(
            new THREE.BoxGeometry(0.2, 1, 0.2),
            fenceMat
        );
        post.position.set(-3, 0.5, pz);
        group.add(post);
        
        const post2 = post.clone();
        post2.position.x = 3;
        group.add(post2);
    }
    
    // Grass inside
    const grass = new THREE.Mesh(
        new THREE.BoxGeometry(5.5, 0.1, 4.5),
        new THREE.MeshStandardMaterial({ color: 0x228b22 })
    );
    grass.position.y = 0.05;
    group.add(grass);
    
    // Vegetables/fruits
    const vegColors = [0xff0000, 0xffa500, 0xffff00, 0x800080];
    for (let i = 0; i < 6; i++) {
        const vx = rand(-2, 2);
        const vz = rand(-1.5, 1.5);
        const color = vegColors[Math.floor(Math.random() * vegColors.length)];
        
        const veg = new THREE.Mesh(
            new THREE.SphereGeometry(0.2, 6, 6),
            new THREE.MeshStandardMaterial({ color })
        );
        veg.position.set(vx, 0.3, vz);
        group.add(veg);
    }
    
    group.position.set(x, 0, z);
    return group;
}

function rand(min, max) { return min + Math.random() * (max - min); }

// ============ FOREST PATCH ============
export function createForestPatch(x, z, density = 8) {
    const group = new THREE.Group();
    
    // Ground cover
    const ground = new THREE.Mesh(
        new THREE.BoxGeometry(15, 0.2, 15),
        new THREE.MeshStandardMaterial({ color: 0x228b22 })
    );
    ground.position.y = 0.1;
    group.add(ground);
    
    // Trees
    for (let i = 0; i < density; i++) {
        const tx = rand(-6, 6);
        const tz = rand(-6, 6);
        const scale = rand(0.8, 1.5);
        
        const tree = createForestTree(tx, tz, scale);
        group.add(tree);
    }
    
    // Fallen logs
    if (Math.random() > 0.5) {
        const log = new THREE.Mesh(
            new THREE.CylinderGeometry(0.3, 0.4, 4, 6),
            new THREE.MeshStandardMaterial({ color: 0x654321 })
        );
        log.position.set(rand(-3, 3), 0.3, rand(-3, 3));
        log.rotation.z = Math.PI / 2;
        log.rotation.y = rand(0, Math.PI);
        group.add(log);
    }
    
    group.position.set(x, 0, z);
    return group;
}

function createForestTree(x, z, scale) {
    const group = new THREE.Group();
    
    const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.15 * scale, 0.25 * scale, 2 * scale, 6),
        new THREE.MeshStandardMaterial({ color: 0x5a4030 })
    );
    trunk.position.y = scale;
    group.add(trunk);
    
    const foliageColors = [0x228b22, 0x2d5a2d, 0x3a7a3a, 0x1a4a1a];
    const foliageColor = foliageColors[Math.floor(Math.random() * foliageColors.length)];
    
    // Multiple cone layers
    for (let i = 0; i < 3; i++) {
        const cone = new THREE.Mesh(
            new THREE.ConeGeometry((1.2 - i * 0.25) * scale, 1.5 * scale, 6),
            new THREE.MeshStandardMaterial({ color: foliageColor })
        );
        cone.position.y = 2 * scale + i * 0.7 * scale;
        group.add(cone);
    }
    
    group.position.set(x, 0, z);
    return group;
}

// ============ ROCKY AREA ============
export function createRockyArea(x, z) {
    const group = new THREE.Group();
    
    // Gravel base
    const base = new THREE.Mesh(
        new THREE.BoxGeometry(8, 0.3, 8),
        new THREE.MeshStandardMaterial({ color: 0x808080 })
    );
    base.position.y = 0.15;
    group.add(base);
    
    // Rocks
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x696969 });
    const rockPositions = [
        { x: -2, z: -2, s: 1 },
        { x: 1, z: 1, s: 0.8 },
        { x: 2, z: -1, s: 0.6 },
        { x: -1, z: 2, s: 0.7 },
        { x: 0, z: 0, s: 1.2 }
    ];
    
    rockPositions.forEach(rp => {
        const rock = new THREE.Mesh(
            new THREE.DodecahedronGeometry(rp.s, 0),
            rockMat
        );
        rock.position.set(rp.x, rp.s * 0.5, rp.z);
        rock.rotation.set(rand(0, Math.PI), rand(0, Math.PI), rand(0, Math.PI));
        group.add(rock);
    });
    
    group.position.set(x, 0, z);
    return group;
}
