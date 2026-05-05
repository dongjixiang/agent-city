/**
 * Cow - Farm cow
 *
 * @module systems/ecology/cow
 */

import * as THREE from 'three';

export class Cow {
    constructor(x, z, entityData) {
        this.group = new THREE.Group();
        this.speed = entityData?.speed || (0.2 + Math.random() * 0.2);
        this.direction = entityData?.direction || Math.random() * Math.PI * 2;
        this.turnTimer = 0;
        this.turnInterval = 8 + Math.random() * 6;
        
        // 优先使用服务器边界，无则用本地默认值
        const bounds = entityData?.bounds || {};
        this.boundX1 = bounds.boundX1 ?? (x - 10);
        this.boundX2 = bounds.boundX2 ?? (x + 10);
        this.boundZ1 = bounds.boundZ1 ?? (z - 10);
        this.boundZ2 = bounds.boundZ2 ?? (z + 10);
        
        this.homeX = entityData?.homeX ?? x;
        this.homeZ = entityData?.homeZ ?? z;
        
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
        // 检查是否夜间（21:00-5:00）
        const hour = window.virtualHour || 12;
        const isNight = hour >= 21 || hour < 5;
        
        if (isNight) {
            // 夜间：缓慢返回家
            this.returnHome(deltaTime);
        } else {
            // 白天：正常游荡
            this.wander(deltaTime);
        }
    }
    
    wander(deltaTime) {
        this.turnTimer += deltaTime;
        
        if (this.turnTimer > this.turnInterval) {
            this.direction += (Math.random() - 0.5) * Math.PI * 0.5;
            this.turnTimer = 0;
            this.turnInterval = 8 + Math.random() * 6;
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
        
        // 检测水域（湖泊、河流、海洋），不能进入水中
        if (this.isInWater(pos.x, pos.z)) {
            // 后退一步
            pos.x -= Math.sin(this.direction) * this.speed * deltaTime * 2;
            pos.z -= Math.cos(this.direction) * this.speed * deltaTime * 2;
            // 计算新方向（远离水域）
            const awayAngle = this.getAwayFromWaterAngle(pos.x, pos.z);
            this.direction = awayAngle + (Math.random() - 0.5) * Math.PI * 0.5;
        }
        
        this.group.rotation.y = this.direction;
        this.group.position.y = Math.sin(Date.now() * 0.003) * 0.05;
    }
    
    isInWater(x, z) {
        // 湖泊（椭圆，中心 10,-75，半径 55x22）
        const ldx = (x - 10) / 55;
        const ldz = (z - (-75)) / 22;
        if (ldx * ldx + ldz * ldz <= 1) return true;

        // 河流（折线，宽度 8）
        const rp = [[-45,-55],[-40,-50],[-35,-40],[-30,-30],[-25,-20],[-20,-10],[-15,0],[-10,10],[-5,20],[0,30],[5,40],[10,50],[15,60],[20,70],[25,80]];
        for (let i = 0; i < rp.length - 1; i++) {
            const p1 = rp[i], p2 = rp[i+1];
            const dx = p2[0]-p1[0], dz = p2[1]-p1[1];
            const len2 = dx*dx + dz*dz;
            const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((x-p1[0])*dx + (z-p1[1])*dz) / len2));
            const d = Math.sqrt((x-(p1[0]+t*dx))**2 + (z-(p1[1]+t*dz))**2);
            if (d < 4) return true;
        }

        // 海洋 (z > 85)
        if (z > 85) return true;

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
    
    returnHome(deltaTime) {
        const pos = this.group.position;
        const dx = this.homeX - pos.x;
        const dz = this.homeZ - pos.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        
        if (dist > 0.5) {
            // 缓慢移动回家
            const speed = 0.3;
            pos.x += (dx / dist) * speed * deltaTime;
            pos.z += (dz / dist) * speed * deltaTime;
            
            // 面向回家方向
            this.group.rotation.y = Math.atan2(dx, dz);
        }
        
        // 轻微的呼吸动画
        this.group.position.y = Math.sin(Date.now() * 0.002) * 0.02;
    }
}
