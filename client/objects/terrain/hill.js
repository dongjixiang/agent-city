/**
 * Hill - Rounded hills with height-based coloring
 */

import * as THREE from 'three';

function randInt(min, max) { return Math.floor(min + Math.random() * (max - min + 1)); }

// Color gradient from low to high altitude
const HILL_COLORS = {
    low: 0x4a7a4a,    // Low grass green
    mid: 0x5a8a5a,    // Mid green
    high: 0x6a9a6a,   // Higher lighter green
    rock: 0x8a8a7a,   // Rocky gray
    snow: 0xffffff,    // Snow cap
};

export function createHill(x, z, radius, height, baseColor) {
    const group = new THREE.Group();
    
    // Main hill body with gradient effect using multiple cones
    const segments = Math.max(6, Math.floor(height / 3));
    
    // Create layered hill for gradient effect
    for (let layer = 0; layer < 3; layer++) {
        const layerHeight = height * (1 - layer * 0.3);
        const layerRadius = radius * (1 - layer * 0.2);
        const layerY = height * layer * 0.15;
        
        // Color based on height
        let color;
        if (layer === 0) color = baseColor || 0x4a7a4a;
        else if (layer === 1) color = 0x5a8a5a;
        else color = 0x6a9a6a;
        
        const geo = new THREE.ConeGeometry(layerRadius, layerHeight, segments);
        const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.85, flatShading: true });
        const cone = new THREE.Mesh(geo, mat);
        cone.position.set(x, layerY + layerHeight / 2, z);
        cone.rotation.y = Math.random() * Math.PI;
        group.add(cone);
    }
    
    return group;
}
