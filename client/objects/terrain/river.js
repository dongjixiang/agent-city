/**
 * River - Flowing water
 */

import * as THREE from 'three';

const WATER_COLOR = 0x3498db;

export function createRiver(points, width) {
    if (!points || points.length < 2) {
        console.warn('[River] Invalid points:', points);
        return null;
    }
    
    console.log('[River] Creating river with', points.length, 'points, width:', width);
    const group = new THREE.Group();
    const halfWidth = width / 2;
    
    for (let i = 0; i < points.length - 1; i++) {
        const p1 = points[i];
        const p2 = points[i + 1];
        
        const dx = p2.x - p1.x;
        const dz = p2.z - p1.z;
        const len = Math.sqrt(dx * dx + dz * dz) || 1;
        
        const perpX = -dz / len;
        const perpZ = dx / len;
        
        const vertices = [];
        const x1 = p1.x + perpX * halfWidth;
        const z1 = p1.z + perpZ * halfWidth;
        const x2 = p1.x - perpX * halfWidth;
        const z2 = p1.z - perpZ * halfWidth;
        const x3 = p2.x + perpX * halfWidth;
        const z3 = p2.z + perpZ * halfWidth;
        const x4 = p2.x - perpX * halfWidth;
        const z4 = p2.z - perpZ * halfWidth;
        
        vertices.push(x1, 0.1, z1, x2, 0.1, z2, x3, 0.1, z3);
        vertices.push(x2, 0.1, z2, x4, 0.1, z4, x3, 0.1, z3);
        
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geometry.computeVertexNormals();
        
        const material = new THREE.MeshStandardMaterial({
            color: WATER_COLOR,
            transparent: false,
            opacity: 1.0,
            roughness: 0.15,
            metalness: 0.3,
            side: THREE.DoubleSide
        });
        
        const river = new THREE.Mesh(geometry, material);
        group.add(river);
    }
    
    return group;
}

export function createLake(cfg) {
    const shape = new THREE.Shape();
    const segments = 24;
    
    for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * Math.PI * 2;
        let factor = 1.0;
        if (cfg.organicPoints) {
            for (const cp of cfg.organicPoints) {
                const targetAngle = cp.angle * Math.PI / 180;
                const diff = Math.abs(angle - targetAngle);
                if (diff < Math.PI / 4) {
                    factor = cp.factor;
                    break;
                }
            }
        }
        const rx = cfg.radiusX * factor;
        const rz = cfg.radiusZ * factor;
        const px = cfg.x + Math.cos(angle) * rx;
        const pz = cfg.z + Math.sin(angle) * rz;
        if (i === 0) shape.moveTo(px, pz);
        else shape.lineTo(px, pz);
    }
    
    const geometry = new THREE.ShapeGeometry(shape);
    const material = new THREE.MeshStandardMaterial({
        color: 0x3498db,
        transparent: true,
        opacity: 0.8,
        roughness: 0.1,
        metalness: 0.2,
        side: THREE.DoubleSide
    });
    
    const lake = new THREE.Mesh(geometry, material);
    // Use +PI/2 to preserve z axis direction (shape's y becomes +z, not -z)
    lake.rotation.x = Math.PI / 2;
    lake.position.y = 0.2;
    return lake;
}

// Beach/sand shore (north of lake)
export function createBeach(x, z, width, depth) {
    const shape = new THREE.Shape();
    
    // Simple rectangle beach
    shape.moveTo(x - width / 2, z - depth / 2);
    shape.lineTo(x + width / 2, z - depth / 2);
    shape.lineTo(x + width / 2, z + depth / 2);
    shape.lineTo(x - width / 2, z + depth / 2);
    shape.lineTo(x - width / 2, z - depth / 2);
    
    const geometry = new THREE.ShapeGeometry(shape);
    const material = new THREE.MeshStandardMaterial({
        color: 0xf4d03f,  // Sandy color
        roughness: 0.95,
        side: THREE.DoubleSide
    });
    
    const beach = new THREE.Mesh(geometry, material);
    // Use +PI/2 to preserve z axis direction
    beach.rotation.x = Math.PI / 2;
    beach.position.y = 0.05;
    return beach;
}

// Coast (rocky shore, north of beach)
export function createCoast(x, z, width, depth) {
    const shape = new THREE.Shape();
    
    // Irregular coast shape
    const segments = 16;
    for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * Math.PI * 2;
        const wobble = 0.8 + Math.sin(angle * 3) * 0.1 + Math.random() * 0.1;
        const px = x + Math.cos(angle) * width / 2 * wobble;
        const pz = z + Math.sin(angle) * depth / 2 * wobble;
        if (i === 0) shape.moveTo(px, pz);
        else shape.lineTo(px, pz);
    }
    
    const geometry = new THREE.ShapeGeometry(shape);
    const material = new THREE.MeshStandardMaterial({
        color: 0x808080,  // Rocky gray
        roughness: 0.9,
        side: THREE.DoubleSide
    });
    
    const coast = new THREE.Mesh(geometry, material);
    // Use +PI/2 to preserve z axis direction
    coast.rotation.x = Math.PI / 2;
    coast.position.y = 0.02;
    return coast;
}

// Ocean (big body of water at south edge)
export function createOcean(zStart, width, depth) {
    const shape = new THREE.Shape();
    
    // Large rectangular ocean
    // zStart is the south edge (more negative z = further south)
    shape.moveTo(-width / 2, zStart);           // SW corner
    shape.lineTo(width / 2, zStart);             // SE corner
    shape.lineTo(width / 2, zStart + depth);     // NE corner
    shape.lineTo(-width / 2, zStart + depth);    // NW corner
    shape.lineTo(-width / 2, zStart);
    
    const geometry = new THREE.ShapeGeometry(shape);
    const material = new THREE.MeshStandardMaterial({
        color: 0x1a5f7a,  // Deep ocean blue
        transparent: true,
        opacity: 0.85,
        roughness: 0.15,
        metalness: 0.3,
        side: THREE.DoubleSide
    });
    
    const ocean = new THREE.Mesh(geometry, material);
    // Use rotation.x = +PI/2 instead of -PI/2 to keep z axis consistent
    // rotation.x = -PI/2 gives z' = -y (inverts z axis)
    // rotation.x = +PI/2 gives z' = y (preserves z axis)
    ocean.rotation.x = Math.PI / 2;
    ocean.position.y = 0.1;
    return ocean;
}

// Beach for ocean (sandy shore)
export function createOceanBeach(x, z, width, depth) {
    const shape = new THREE.Shape();
    
    shape.moveTo(x - width / 2, z - depth / 2);
    shape.lineTo(x + width / 2, z - depth / 2);
    shape.lineTo(x + width / 2, z + depth / 2);
    shape.lineTo(x - width / 2, z + depth / 2);
    shape.lineTo(x - width / 2, z - depth / 2);
    
    const geometry = new THREE.ShapeGeometry(shape);
    const material = new THREE.MeshStandardMaterial({
        color: 0xe8d174,  // Light sandy beach
        roughness: 0.95,
        side: THREE.DoubleSide
    });
    
    const beach = new THREE.Mesh(geometry, material);
    // Use +PI/2 to preserve z axis direction
    beach.rotation.x = Math.PI / 2;
    beach.position.y = 0.03;
    return beach;
}
