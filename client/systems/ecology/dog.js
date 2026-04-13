/**
 * Dog - Suburban dog
 *
 * @module systems/ecology/dog
 */

import * as THREE from 'three';

export class Dog {
    constructor(x, z) {
        this.group = new THREE.Group();
        this.speed = 0.008 + Math.random() * 0.004;
        this.direction = Math.random() * Math.PI * 2;
        this.turnTimer = 0;
        this.turnInterval = 50 + Math.random() * 100;
        this.boundX1 = x - 8;
        this.boundX2 = x + 8;
        this.boundZ1 = z - 8;
        this.boundZ2 = z + 8;
        
        this._buildMesh();
        this.group.position.set(x, 0, z);
    }
    
    _buildMesh() {
        const isSmall = Math.random() > 0.5;
        const scale = isSmall ? 0.5 : 0.7;
        
        const bodyColor = Math.random() > 0.5 ? 0x8b4513 : 0xd2691e;
        const bodyMat = new THREE.MeshStandardMaterial({ color: bodyColor });
        
        // Body
        const body = new THREE.Mesh(
            new THREE.BoxGeometry(0.8 * scale, 0.8 * scale, 1.5 * scale),
            bodyMat
        );
        body.position.y = 0.8 * scale;
        this.group.add(body);
        
        // Head
        const head = new THREE.Mesh(
            new THREE.BoxGeometry(0.6 * scale, 0.6 * scale, 0.7 * scale),
            bodyMat
        );
        head.position.set(0, 1.1 * scale, 0.9 * scale);
        this.group.add(head);
        
        // Snout
        const snout = new THREE.Mesh(
            new THREE.BoxGeometry(0.3 * scale, 0.3 * scale, 0.4 * scale),
            new THREE.MeshStandardMaterial({ color: 0xffccaa })
        );
        snout.position.set(0, 0.95 * scale, 1.3 * scale);
        this.group.add(snout);
        
        // Nose
        const nose = new THREE.Mesh(
            new THREE.SphereGeometry(0.08 * scale, 6, 6),
            new THREE.MeshStandardMaterial({ color: 0x333333 })
        );
        nose.position.set(0, 1 * scale, 1.5 * scale);
        this.group.add(nose);
        
        // Eyes
        const eyeMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
        const leftEye = new THREE.Mesh(new THREE.SphereGeometry(0.08 * scale, 6, 6), eyeMat);
        leftEye.position.set(-0.2 * scale, 1.25 * scale, 1.2 * scale);
        this.group.add(leftEye);
        const rightEye = leftEye.clone();
        rightEye.position.x = 0.2 * scale;
        this.group.add(rightEye);
        
        // Ears
        const earMat = new THREE.MeshStandardMaterial({ color: bodyColor });
        const leftEar = new THREE.Mesh(
            new THREE.BoxGeometry(0.2 * scale, 0.35 * scale, 0.15 * scale),
            earMat
        );
        leftEar.position.set(-0.35 * scale, 1.35 * scale, 0.7 * scale);
        leftEar.rotation.z = 0.3;
        this.group.add(leftEar);
        const rightEar = leftEar.clone();
        rightEar.position.x = 0.35 * scale;
        rightEar.rotation.z = -0.3;
        this.group.add(rightEar);
        
        // Legs
        const legPositions = [[-0.25, 0.5], [0.25, 0.5], [-0.25, -0.5], [0.25, -0.5]];
        legPositions.forEach(pos => {
            const leg = new THREE.Mesh(
                new THREE.BoxGeometry(0.15 * scale, 0.5 * scale, 0.15 * scale),
                bodyMat
            );
            leg.position.set(pos[0] * scale, 0.25 * scale, pos[1] * scale);
            this.group.add(leg);
        });
        
        // Tail
        const tail = new THREE.Mesh(
            new THREE.CylinderGeometry(0.06 * scale, 0.1 * scale, 0.6 * scale, 4),
            bodyMat
        );
        tail.position.set(0, 1 * scale, -0.9 * scale);
        tail.rotation.x = Math.PI / 3;
        this.group.add(tail);
        
        this.group.scale.setScalar(scale);
    }
    
    update(deltaTime) {
        this.turnTimer += deltaTime;
        
        if (this.turnTimer > this.turnInterval) {
            this.direction += (Math.random() - 0.5) * Math.PI * 0.8;
            this.turnTimer = 0;
            this.turnInterval = 50 + Math.random() * 100;
        }
        
        const pos = this.group.position;
        if (pos.x < this.boundX1 || pos.x > this.boundX2) {
            this.direction = Math.PI - this.direction;
        }
        if (pos.z < this.boundZ1 || pos.z > this.boundZ2) {
            this.direction = -this.direction;
        }
        
        pos.x += Math.sin(this.direction) * this.speed * deltaTime;
        pos.z += Math.cos(this.direction) * this.speed * deltaTime;
        
        this.group.rotation.y = this.direction;
        this.group.position.y = Math.sin(Date.now() * 0.005) * 0.03;
    }
}
