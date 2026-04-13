/**
 * Cow - Farm cow
 *
 * @module systems/ecology/cow
 */

import * as THREE from 'three';

export class Cow {
    constructor(x, z) {
        this.group = new THREE.Group();
        this.speed = 0.2 + Math.random() * 0.2;
        this.direction = Math.random() * Math.PI * 2;
        this.turnTimer = 0;
        this.turnInterval = 100 + Math.random() * 150;
        this.boundX1 = x - 10;
        this.boundX2 = x + 10;
        this.boundZ1 = z - 10;
        this.boundZ2 = z + 10;
        
        this._buildMesh();
        this.group.position.set(x, 0, z);
    }
    
    _buildMesh() {
        // Random cow color pattern
        const isSpotted = Math.random() > 0.5;
        const baseColor = isSpotted ? 0xffffff : (Math.random() > 0.5 ? 0x8b4513 : 0x4a4a4a);
        const bodyMat = new THREE.MeshStandardMaterial({ color: baseColor });
        this.bodyMat = bodyMat;
        
        // Body
        const body = new THREE.Mesh(
            new THREE.BoxGeometry(2, 1.4, 3.5),
            bodyMat
        );
        body.position.y = 1.3;
        this.group.add(body);
        
        // Spots on body
        if (isSpotted) {
            const spotMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
            for (let i = 0; i < 3; i++) {
                const spot = new THREE.Mesh(
                    new THREE.SphereGeometry(0.3 + Math.random() * 0.2, 6, 6),
                    spotMat
                );
                spot.position.set(
                    (Math.random() - 0.5) * 1.2,
                    1.3 + (Math.random() - 0.5) * 0.5,
                    (Math.random() - 0.5) * 2
                );
                spot.scale.y = 0.3;
                this.group.add(spot);
            }
        }
        
        // Head
        const head = new THREE.Mesh(
            new THREE.BoxGeometry(0.8, 0.9, 1),
            bodyMat
        );
        head.position.set(0, 1.6, 1.5);
        this.group.add(head);
        
        // Snout
        const snout = new THREE.Mesh(
            new THREE.BoxGeometry(0.5, 0.4, 0.4),
            new THREE.MeshStandardMaterial({ color: 0xffcccc })
        );
        snout.position.set(0, 1.35, 2.1);
        this.group.add(snout);
        
        // Eyes
        const eyeMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
        const leftEye = new THREE.Mesh(new THREE.SphereGeometry(0.1, 6, 6), eyeMat);
        leftEye.position.set(-0.25, 1.8, 1.9);
        this.group.add(leftEye);
        const rightEye = leftEye.clone();
        rightEye.position.x = 0.25;
        this.group.add(rightEye);
        
        // Ears
        const earMat = new THREE.MeshStandardMaterial({ color: 0xf5f5dc });
        const leftEar = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.4, 0.1), earMat);
        leftEar.position.set(-0.5, 2, 1.3);
        leftEar.rotation.z = 0.3;
        this.group.add(leftEar);
        const rightEar = leftEar.clone();
        rightEar.position.x = 0.5;
        rightEar.rotation.z = -0.3;
        this.group.add(rightEar);
        
        // Horns
        const hornMat = new THREE.MeshStandardMaterial({ color: 0xffffcc });
        const leftHorn = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.4, 6), hornMat);
        leftHorn.position.set(-0.35, 2.3, 1.3);
        leftHorn.rotation.z = 0.2;
        this.group.add(leftHorn);
        const rightHorn = leftHorn.clone();
        rightHorn.position.x = 0.35;
        rightHorn.rotation.z = -0.2;
        this.group.add(rightHorn);
        
        // Legs
        const legMat = new THREE.MeshStandardMaterial({ color: 0xf5f5dc });
        const legPositions = [[-0.6, 0.5], [0.6, 0.5], [-0.6, -0.8], [0.6, -0.8]];
        legPositions.forEach(pos => {
            const leg = new THREE.Mesh(
                new THREE.BoxGeometry(0.3, 0.8, 0.3),
                legMat
            );
            leg.position.set(pos[0], 0.4, pos[1]);
            this.group.add(leg);
        });
        
        // Tail
        const tail = new THREE.Mesh(
            new THREE.CylinderGeometry(0.05, 0.08, 1, 4),
            new THREE.MeshStandardMaterial({ color: 0xf5f5dc })
        );
        tail.position.set(0, 1.3, -1.8);
        tail.rotation.x = Math.PI / 4;
        this.group.add(tail);
        
        // Tail tuft
        const tuft = new THREE.Mesh(
            new THREE.SphereGeometry(0.12, 6, 6),
            new THREE.MeshStandardMaterial({ color: 0x8b4513 })
        );
        tuft.position.set(0, 1, -2.2);
        this.group.add(tuft);
        
        this.group.scale.setScalar(0.6 + Math.random() * 0.2);
    }
    
    update(deltaTime) {
        this.turnTimer += deltaTime;
        
        if (this.turnTimer > this.turnInterval) {
            this.direction += (Math.random() - 0.5) * Math.PI * 0.5;
            this.turnTimer = 0;
            this.turnInterval = 100 + Math.random() * 150;
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
        this.group.position.y = Math.sin(Date.now() * 0.003) * 0.05;
    }
}
