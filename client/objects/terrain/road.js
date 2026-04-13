/**
 * Road - Simple road network
 */

import * as THREE from 'three';

const ROAD_COLOR = 0x3d3d3d;
const LINE_COLOR = 0xffff00;

export function createRoad(points, width) {
    if (!points || points.length < 2) return [];
    
    const meshes = [];
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
        
        vertices.push(x1, 0.2, z1, x2, 0.2, z2, x3, 0.2, z3);
        vertices.push(x2, 0.2, z2, x4, 0.2, z4, x3, 0.2, z3);
        
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geometry.computeVertexNormals();
        
        const material = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.9, side: THREE.DoubleSide });
        const road = new THREE.Mesh(geometry, material);
        meshes.push(road);
        
        // Center line (flat on ground, parallel to road)
        const midX = (p1.x + p2.x) / 2;
        const midZ = (p1.z + p2.z) / 2;
        const lineGeo = new THREE.PlaneGeometry(len * 0.8, 0.3);
        const lineMat = new THREE.MeshBasicMaterial({ color: LINE_COLOR });
        const line = new THREE.Mesh(lineGeo, lineMat);
        line.position.set(midX, 0.25, midZ);
        line.rotation.x = -Math.PI / 2;
        line.rotation.y = Math.atan2(dz, dx);
        meshes.push(line);
    }
    
    return meshes;
}

export function createPath(points, width) {
    if (!points || points.length < 2) return null;
    
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
        
        vertices.push(x1, 0.15, z1, x2, 0.15, z2, x3, 0.15, z3);
        vertices.push(x2, 0.15, z2, x4, 0.15, z4, x3, 0.15, z3);
        
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geometry.computeVertexNormals();
        
        const material = new THREE.MeshStandardMaterial({ color: 0x9a8a7a, roughness: 0.95, side: THREE.DoubleSide });
        const path = new THREE.Mesh(geometry, material);
        group.add(path);
    }
    
    return group;
}
