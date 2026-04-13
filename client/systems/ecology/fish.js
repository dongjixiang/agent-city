/**
 * Fish - Swimming fish in water bodies
 */

import * as THREE from 'three';

export class Fish {
    constructor(x, z, waterBody) {
        this.group = new THREE.Group();
        this.waterBody = waterBody; // 'lake', 'river', 'ocean'
        this.speed = 1 + Math.random() * 1;
        this.direction = Math.random() * Math.PI * 2;
        this.turnTimer = 0;
        this.turnInterval = 30 + Math.random() * 60;
        this.baseY = 0.3;
        
        // Fish body
        const bodyGeo = new THREE.ConeGeometry(0.3, 1, 4);
        bodyGeo.rotateX(Math.PI / 2);
        const bodyMat = new THREE.MeshStandardMaterial({ 
            color: this.randomFishColor(),
            metalness: 0.3,
            roughness: 0.4
        });
        this.body = new THREE.Mesh(bodyGeo, bodyMat);
        this.group.add(this.body);
        
        // Tail
        const tailGeo = new THREE.ConeGeometry(0.2, 0.4, 4);
        tailGeo.rotateX(-Math.PI / 2);
        const tailMat = new THREE.MeshStandardMaterial({ color: bodyMat.color });
        this.tail = new THREE.Mesh(tailGeo, tailMat);
        this.tail.position.z = -0.6;
        this.group.add(this.tail);
        
        // Eye
        const eyeGeo = new THREE.SphereGeometry(0.08, 6, 6);
        const eyeMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
        const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
        eyeL.position.set(0.2, 0.05, 0.25);
        this.group.add(eyeL);
        const eyeR = eyeL.clone();
        eyeR.position.z = 0.25;
        this.group.add(eyeR);
        
        this.group.position.set(x, this.baseY, z);
        this.group.scale.setScalar(0.8 + Math.random() * 0.4);
    }
    
    randomFishColor() {
        const colors = [0xff6b6b, 0xffa500, 0xffd700, 0x87ceeb, 0x4682b4, 0x20b2aa, 0xff69b4, 0x98fb98];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    update(deltaTime) {
        // Move fish
        this.turnTimer += deltaTime;
        
        // Occasionally change direction
        if (this.turnTimer > this.turnInterval) {
            this.direction += (Math.random() - 0.5) * Math.PI * 0.5;
            this.turnTimer = 0;
            this.turnInterval = 30 + Math.random() * 60;
        }
        
        // Keep within water body bounds
        const bounds = this.getBounds();
        if (bounds) {
            const pos = this.group.position;
            if (pos.x < bounds.minX || pos.x > bounds.maxX) {
                this.direction = Math.PI - this.direction;
            }
            if (pos.z < bounds.minZ || pos.z > bounds.maxZ) {
                this.direction = -this.direction;
            }
            
            // Stay at water depth (use water level instead of fixed Y)
            this.group.position.y = this.baseY;
        }
        
        // Move
        this.group.position.x += Math.sin(this.direction) * this.speed * deltaTime;
        this.group.position.z += Math.cos(this.direction) * this.speed * deltaTime;
        
        // Face direction of movement
        this.group.rotation.y = this.direction;
        
        // Wag tail
        this.tail.rotation.y = Math.sin(Date.now() * 0.02) * 0.3;
    }
    
    getBounds() {
        // Water bodies from world-builder.js:
        // Ocean: at z=-100, size 200x10
        // Lake: center (10, 75), radiusX=55, radiusZ=22 → roughly x=-45 to 65, z=53 to 97
        // River: x=-10 to -20, z=-55 to 91
        switch (this.waterBody) {
            case 'lake':
                return { minX: -45, maxX: 65, minZ: 53, maxZ: 97 };
            case 'river':
                return { minX: -25, maxX: 0, minZ: -55, maxZ: 91 };
            case 'ocean':
                return { minX: -100, maxX: 100, minZ: -105, maxZ: -95 };
            default:
                return null;
        }
    }
}

export class FishSystem {
    constructor(scene) {
        this.scene = scene;
        this.fish = [];
    }
    
    init() {
        // Lake fish (center at 10, 75)
        for (let i = 0; i < 10; i++) {
            const fish = new Fish(
                -10 + Math.random() * 40,
                60 + Math.random() * 30,
                'lake'
            );
            this.fish.push(fish);
            this.scene.add(fish.group);
        }
        
        // River fish (x=-10 to -20, z=-55 to 91)
        for (let i = 0; i < 12; i++) {
            const fish = new Fish(
                -18 + Math.random() * 6,
                -50 + Math.random() * 140,
                'river'
            );
            this.fish.push(fish);
            this.scene.add(fish.group);
        }
        
        // Ocean fish (at z=-100)
        for (let i = 0; i < 8; i++) {
            const fish = new Fish(
                -80 + Math.random() * 160,
                -102 + Math.random() * 6,
                'ocean'
            );
            this.fish.push(fish);
            this.scene.add(fish.group);
        }
        
        console.log('[FishSystem] Created', this.fish.length, 'fish');
    }
    
    update(deltaTime) {
        this.fish.forEach(fish => fish.update(deltaTime));
    }
}
