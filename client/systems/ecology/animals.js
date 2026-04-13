/**
 * Animals - Farm animals (cows, dogs)
 *
 * @module systems/ecology/animals
 */

import * as THREE from 'three';

/**
 * 创建耕牛
 */
export class Cow {
    constructor(x, z) {
        this.group = new THREE.Group();
        this.speed = 0.003 + Math.random() * 0.002;
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
        // Body
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0xf5f5dc });
        const body = new THREE.Mesh(
            new THREE.BoxGeometry(2, 1.2, 3),
            bodyMat
        );
        body.position.y = 1.2;
        this.group.add(body);
        
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
        
        // Stay within bounds
        const pos = this.group.position;
        if (pos.x < this.boundX1 || pos.x > this.boundX2) {
            this.direction = Math.PI - this.direction;
        }
        if (pos.z < this.boundZ1 || pos.z > this.boundZ2) {
            this.direction = -this.direction;
        }
        
        // Move
        pos.x += Math.sin(this.direction) * this.speed * deltaTime;
        pos.z += Math.cos(this.direction) * this.speed * deltaTime;
        
        // Face direction
        this.group.rotation.y = this.direction;
        
        // Bobbing
        this.group.position.y = Math.sin(Date.now() * 0.003) * 0.05;
    }
}

/**
 * 创建狗
 */
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
        
        // Body color - brown or tan
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
        
        // Ears (floppy)
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
        
        // Stay within bounds
        const pos = this.group.position;
        if (pos.x < this.boundX1 || pos.x > this.boundX2) {
            this.direction = Math.PI - this.direction;
        }
        if (pos.z < this.boundZ1 || pos.z > this.boundZ2) {
            this.direction = -this.direction;
        }
        
        // Move
        pos.x += Math.sin(this.direction) * this.speed * deltaTime;
        pos.z += Math.cos(this.direction) * this.speed * deltaTime;
        
        // Face direction
        this.group.rotation.y = this.direction;
        
        // Bobbing
        this.group.position.y = Math.sin(Date.now() * 0.005) * 0.03;
    }
}

/**
 * Animal System - Manages farm animals
 */
export class AnimalSystem {
    constructor(scene) {
        this.scene = scene;
        this.cows = [];
        this.dogs = [];
    }
    
    init() {
        // Cows in farmland (X: -95~-70, Z: -60~0)
        const cowPositions = [
            { x: -85, z: -40 },
            { x: -78, z: -50 },
            { x: -88, z: -20 },
            { x: -72, z: -35 },
        ];
        cowPositions.forEach(pos => {
            const cow = new Cow(pos.x, pos.z);
            this.cows.push(cow);
            this.scene.add(cow.group);
        });
        
        // Dogs near suburban houses
        // NW area
        const nwDogPositions = [
            { x: -50, z: -30 },
            { x: -55, z: -45 },
            { x: -40, z: 0 },
        ];
        nwDogPositions.forEach(pos => {
            const dog = new Dog(pos.x, pos.z);
            this.dogs.push(dog);
            this.scene.add(dog.group);
        });
        
        // East side
        const eastDogPositions = [
            { x: 55, z: -50 },
            { x: 45, z: -60 },
        ];
        eastDogPositions.forEach(pos => {
            const dog = new Dog(pos.x, pos.z);
            this.dogs.push(dog);
            this.scene.add(dog.group);
        });
        
        console.log(`[AnimalSystem] Created ${this.cows.length} cows and ${this.dogs.length} dogs`);
    }
    
    update(deltaTime) {
        this.cows.forEach(cow => cow.update(deltaTime));
        this.dogs.forEach(dog => dog.update(deltaTime));
    }
}
