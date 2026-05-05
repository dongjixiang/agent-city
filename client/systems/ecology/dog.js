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
        this.turnInterval = 5 + Math.random() * 8;
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
            this.turnInterval = 5 + Math.random() * 8;
        }
        
        // 先移动
        const pos = this.group.position;
        pos.x += Math.sin(this.direction) * this.speed * deltaTime;
        pos.z += Math.cos(this.direction) * this.speed * deltaTime;
        
        // 严格边界检测 - clamp并调整方向
        let hitBoundary = false;
        let newDirX = 0, newDirZ = 0;
        
        if (pos.x < this.boundX1) {
            pos.x = this.boundX1;
            hitBoundary = true;
            newDirX = 1;
        } else if (pos.x > this.boundX2) {
            pos.x = this.boundX2;
            hitBoundary = true;
            newDirX = -1;
        }
        if (pos.z < this.boundZ1) {
            pos.z = this.boundZ1;
            hitBoundary = true;
            newDirZ = 1;
        } else if (pos.z > this.boundZ2) {
            pos.z = this.boundZ2;
            hitBoundary = true;
            newDirZ = -1;
        }
        
        // 如果碰到边界，计算新方向
        if (hitBoundary) {
            const baseAngle = Math.atan2(newDirX || Math.sin(this.direction), newDirZ || Math.cos(this.direction));
            const randomOffset = (Math.random() - 0.5) * Math.PI * 0.8;
            this.direction = baseAngle + randomOffset;
        }
        
        // 检测水域，不能进入水中
        if (this.isInWater(pos.x, pos.z)) {
            // 后退一步
            pos.x -= Math.sin(this.direction) * this.speed * deltaTime * 2;
            pos.z -= Math.cos(this.direction) * this.speed * deltaTime * 2;
            // 计算新方向（远离水域）
            const awayAngle = this.getAwayFromWaterAngle(pos.x, pos.z);
            this.direction = awayAngle + (Math.random() - 0.5) * Math.PI * 0.5;
        }
        
        this.group.rotation.y = this.direction;
        this.group.position.y = Math.sin(Date.now() * 0.005) * 0.03;
    }
    
    isInWater(x, z) {
        // 湖泊：x=-45 to 65, z=53 to 97
        if (x >= -45 && x <= 65 && z >= 53 && z <= 97) return true;
        // 河流：x=-25 to 0, z=-55 to 91
        if (x >= -25 && x <= 0 && z >= -55 && z <= 91) return true;
        // 海洋：x=-100 to 100, z=-105 to -95
        if (x >= -100 && x <= 100 && z >= -105 && z <= -95) return true;
        return false;
    }
    
    getAwayFromWaterAngle(x, z) {
        // 计算最近水域的中心点，反向移动
        let targetX = 0, targetZ = 0;
        
        // 湖泊中心
        const lakeDist = Math.sqrt((x - 10) * (x - 10) + (z - 75) * (z - 75));
        // 河流中心
        const riverDist = Math.sqrt((x + 12.5) * (x + 12.5) + (z - 18) * (z - 18));
        
        if (lakeDist < riverDist) {
            targetX = 10;
            targetZ = 75;
        } else {
            targetX = -12.5;
            targetZ = 18;
        }
        
        // 反方向
        return Math.atan2(x - targetX, z - targetZ);
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
