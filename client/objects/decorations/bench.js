/**
 * Bench - Simple street furniture
 */

import * as THREE from 'three';

export function createBench(x, z, rotationY = 0) {
    const group = new THREE.Group();
    
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x6a5a4a });
    const metalMat = new THREE.MeshStandardMaterial({ color: 0x4a4a4a });
    
    // Seat
    const seat = new THREE.Mesh(new THREE.BoxGeometry(2, 0.1, 0.6), woodMat);
    seat.position.y = 0.5;
    group.add(seat);
    
    // Back
    const back = new THREE.Mesh(new THREE.BoxGeometry(2, 0.5, 0.1), woodMat);
    back.position.set(0, 0.8, -0.25);
    group.add(back);
    
    // Legs
    for (let side of [-1, 1]) {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.5, 0.4), metalMat);
        leg.position.set(side * 0.85, 0.25, 0);
        group.add(leg);
    }
    
    group.position.set(x, 0, z);
    group.rotation.y = rotationY;
    return group;
}

export function createLamp(x, z, rotationY = 0) {
    const group = new THREE.Group();
    
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x3a3a3a });
    const lampMat = new THREE.MeshStandardMaterial({
        color: 0xffffcc,
        emissive: 0xffffaa,
        emissiveIntensity: 0,
    });
    
    // Pole
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 4, 6), poleMat);
    pole.position.y = 2;
    group.add(pole);
    
    // Lamp
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.25, 8, 8), lampMat);
    lamp.position.y = 4.3;
    group.add(lamp);
    
    // Point light for lamp
    const light = new THREE.PointLight(0xffdd88, 0, 12);
    light.position.y = 4.3;
    group.add(light);
    
    group.position.set(x, 0, z);
    group.rotation.y = rotationY;
    
    // Store references for on/off control
    group.userData.lampMat = lampMat;
    group.userData.light = light;
    
    return group;
}
