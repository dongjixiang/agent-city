/**
 * Dog - Suburban dog
 *
 * @module systems/ecology/dog
 */

import * as THREE from 'three';

export class Dog {
    constructor(x, z) {
        this.group = new THREE.Group();
        this.direction = Math.random() * Math.PI * 2;
        this.turnTimer = 0;
        this.turnInterval = 50 + Math.random() * 100;
        this.boundX1 = x - 8;
        this.boundX2 = x + 8;
        this.boundZ1 = z - 8;
        this.boundZ2 = z + 8;
        
        // 回家点（夜间返回的位置）
        this.homeX = x;
        this.homeZ = z;
        
        this._buildMesh();
        this.group.position.set(x, 0, z);
    }
    
    _buildMesh() {
        // Dogs should be smaller than cows but still visible
        const isSmall = Math.random() > 0.7;  // Most dogs are normal size
        const scale = isSmall ? 0.7 : 1.2;  // Normal dogs larger
        
        // Speed for movement (units per second)
        this.speed = (isSmall ? 0.3 : 0.5) + Math.random() * 0.2;
        
        const bodyColor = Math.random() > 0.5 ? 0x8b4513 : 0xd2691e;
        const bodyMat = new THREE.MeshStandardMaterial({ color: bodyColor });
        
        // Body
        const body = new THREE.Mesh(
            new THREE.BoxGeometry(0.6 * scale, 0.5 * scale, 1.2 * scale),
            bodyMat
        );
        body.position.y = 0.5 * scale;
        this.group.add(body);
        
        // Head
        const head = new THREE.Mesh(
            new THREE.BoxGeometry(0.45 * scale, 0.45 * scale, 0.5 * scale),
            bodyMat
        );
        head.position.set(0, 0.75 * scale, 0.7 * scale);
        this.group.add(head);
        
        // Snout
        const snout = new THREE.Mesh(
            new THREE.BoxGeometry(0.25 * scale, 0.2 * scale, 0.3 * scale),
            new THREE.MeshStandardMaterial({ color: 0xffccaa })
        );
        snout.position.set(0, 0.6 * scale, 1.0 * scale);
        this.group.add(snout);
        
        // Nose
        const nose = new THREE.Mesh(
            new THREE.SphereGeometry(0.06 * scale, 6, 6),
            new THREE.MeshStandardMaterial({ color: 0x333333 })
        );
        nose.position.set(0, 0.65 * scale, 1.15 * scale);
        this.group.add(nose);
        
        // Eyes
        const eyeMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
        const leftEye = new THREE.Mesh(new THREE.SphereGeometry(0.06 * scale, 6, 6), eyeMat);
        leftEye.position.set(-0.15 * scale, 0.85 * scale, 0.9 * scale);
        this.group.add(leftEye);
        const rightEye = leftEye.clone();
        rightEye.position.x = 0.15 * scale;
        this.group.add(rightEye);
        
        // Ears (pointy)
        const earMat = new THREE.MeshStandardMaterial({ color: bodyColor });
        const leftEar = new THREE.Mesh(
            new THREE.ConeGeometry(0.12 * scale, 0.25 * scale, 4),
            earMat
        );
        leftEar.position.set(-0.25 * scale, 1.0 * scale, 0.5 * scale);
        this.group.add(leftEar);
        const rightEar = leftEar.clone();
        rightEar.position.x = 0.25 * scale;
        this.group.add(rightEar);
        
        // Legs
        const legPositions = [[-0.18, 0.4], [0.18, 0.4], [-0.18, -0.3], [0.18, -0.3]];
        legPositions.forEach(pos => {
            const leg = new THREE.Mesh(
                new THREE.BoxGeometry(0.12 * scale, 0.4 * scale, 0.12 * scale),
                bodyMat
            );
            leg.position.set(pos[0] * scale, 0.2 * scale, pos[1] * scale);
            this.group.add(leg);
        });
        
        // Tail
        const tail = new THREE.Mesh(
            new THREE.CylinderGeometry(0.04 * scale, 0.07 * scale, 0.5 * scale, 4),
            bodyMat
        );
        tail.position.set(0, 0.55 * scale, -0.7 * scale);
        tail.rotation.x = Math.PI / 3;
        this.group.add(tail);
        
        this.group.scale.setScalar(scale);
    }
    
    update(deltaTime) {
        // 检查是否夜间（21:00-5:00）
        const hour = window.virtualHour || 12;
        const isNight = hour >= 21 || hour < 5;
        
        if (isNight) {
            // 夜间：返回家中休息
            this.goHome(deltaTime);
        } else {
            // 白天：正常活动
            this.wander(deltaTime);
        }
    }
    
    wander(deltaTime) {
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
    
    goHome(deltaTime) {
        const pos = this.group.position;
        const dx = this.homeX - pos.x;
        const dz = this.homeZ - pos.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        
        if (dist > 0.3) {
            // 回家休息
            const speed = 0.4;
            pos.x += (dx / dist) * speed * deltaTime;
            pos.z += (dz / dist) * speed * deltaTime;
            this.group.rotation.y = Math.atan2(dx, dz);
        }
        
        // 轻微休息动画
        this.group.position.y = Math.sin(Date.now() * 0.001) * 0.01;
    }
}
