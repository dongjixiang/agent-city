/**
 * Boats - Sailboats and yachts in the ocean
 */

import * as THREE from 'three';

export class Sailboat {
    constructor(x, z, speed) {
        this.group = new THREE.Group();
        this.speed = speed || 0.5;
        this.direction = Math.random() * Math.PI * 2;
        this.turnTimer = 0;
        this.turnInterval = 60 + Math.random() * 120;
        
        // Hull
        const hullGeo = new THREE.BoxGeometry(2, 0.8, 6);
        const hullMat = new THREE.MeshStandardMaterial({ color: this.randomHullColor() });
        const hull = new THREE.Mesh(hullGeo, hullMat);
        hull.position.y = 0.4;
        this.group.add(hull);
        
        // Cabin
        const cabinGeo = new THREE.BoxGeometry(1.5, 1, 2);
        const cabinMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
        const cabin = new THREE.Mesh(cabinGeo, cabinMat);
        cabin.position.set(0, 1.2, 0);
        this.group.add(cabin);
        
        // Mast
        const mastGeo = new THREE.CylinderGeometry(0.08, 0.1, 6, 6);
        const mastMat = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
        const mast = new THREE.Mesh(mastGeo, mastMat);
        mast.position.set(0, 4, 0);
        this.group.add(mast);
        
        // Sail
        const sailGeo = new THREE.PlaneGeometry(3, 5);
        const sailMat = new THREE.MeshStandardMaterial({ color: 0xffffff, side: THREE.DoubleSide });
        const sail = new THREE.Mesh(sailGeo, sailMat);
        sail.position.set(0.8, 3.5, 0);
        sail.rotation.y = Math.PI / 6;
        this.group.add(sail);
        
        // Flag
        const flagGeo = new THREE.PlaneGeometry(0.8, 0.5);
        const flagMat = new THREE.MeshStandardMaterial({ color: 0xff0000, side: THREE.DoubleSide });
        const flag = new THREE.Mesh(flagGeo, flagMat);
        flag.position.set(0, 6.5, 0);
        this.group.add(flag);
        
        this.group.position.set(x, 0.2, z);
        this.group.scale.setScalar(0.8 + Math.random() * 0.4);
    }
    
    randomHullColor() {
        const colors = [0x8b4513, 0x654321, 0x2f4f4f, 0xffffff, 0x4169e1];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    update(deltaTime) {
        this.turnTimer += deltaTime;
        
        if (this.turnTimer > this.turnInterval) {
            this.direction += (Math.random() - 0.5) * Math.PI * 0.3;
            this.turnTimer = 0;
            this.turnInterval = 60 + Math.random() * 120;
        }
        
        // Ocean bounds: keep sailboats in the sea area
        const pos = this.group.position;
        if (pos.x < -95 || pos.x > 95) {
            this.direction = Math.PI - this.direction;
            // Clamp to prevent getting stuck at boundary
            pos.x = Math.max(-93, Math.min(93, pos.x));
        }
        if (pos.z > 102 || pos.z < 95) {
            this.direction = -this.direction;
            // Clamp to prevent getting stuck at boundary
            pos.z = Math.max(96, Math.min(101, pos.z));
        }
        
        // Bob on water
        this.group.position.y = 0.2 + Math.sin(Date.now() * 0.001) * 0.1;
        this.group.rotation.z = Math.sin(Date.now() * 0.0015) * 0.05;
        this.group.rotation.x = Math.sin(Date.now() * 0.0012) * 0.03;
        
        // Move
        this.group.position.x += Math.sin(this.direction) * this.speed * deltaTime;
        this.group.position.z += Math.cos(this.direction) * this.speed * deltaTime;
        
        // Face direction
        this.group.rotation.y = this.direction;
    }
}

export class Yacht {
    constructor(x, z, speed) {
        this.group = new THREE.Group();
        this.speed = speed || 0.8;
        this.direction = Math.random() * Math.PI * 2;
        this.turnTimer = 0;
        this.turnInterval = 120 + Math.random() * 180;
        
        // Hull
        const hullGeo = new THREE.BoxGeometry(3, 1.2, 10);
        const hullMat = new THREE.MeshStandardMaterial({ color: 0x1a1a2e });
        const hull = new THREE.Mesh(hullGeo, hullMat);
        hull.position.y = 0.6;
        this.group.add(hull);
        
        // Deck
        const deckGeo = new THREE.BoxGeometry(2.8, 0.3, 9);
        const deckMat = new THREE.MeshStandardMaterial({ color: 0xdeb887 });
        const deck = new THREE.Mesh(deckGeo, deckMat);
        deck.position.set(0, 1.35, 0);
        this.group.add(deck);
        
        // Cabin
        const cabinGeo = new THREE.BoxGeometry(2.5, 2, 4);
        const cabinMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
        const cabin = new THREE.Mesh(cabinGeo, cabinMat);
        cabin.position.set(0, 2.6, -2);
        this.group.add(cabin);
        
        // Windows
        const winMat = new THREE.MeshStandardMaterial({ color: 0x87ceeb });
        for (let i = -1; i <= 1; i++) {
            const win = new THREE.Mesh(
                new THREE.BoxGeometry(0.5, 0.5, 0.1),
                winMat
            );
            win.position.set(i * 0.8, 2.8, -0.1);
            this.group.add(win);
        }
        
        // Flying bridge
        const fbGeo = new THREE.BoxGeometry(2.2, 0.8, 3);
        const fbMat = new THREE.MeshStandardMaterial({ color: 0x1a1a2e });
        const flyingBridge = new THREE.Mesh(fbGeo, fbMat);
        flyingBridge.position.set(0, 3.6, 1);
        this.group.add(flyingBridge);
        
        // Antenna
        const antGeo = new THREE.CylinderGeometry(0.05, 0.05, 2, 4);
        const antMat = new THREE.MeshStandardMaterial({ color: 0xff0000 });
        const antenna = new THREE.Mesh(antGeo, antMat);
        antenna.position.set(0, 4.8, 1);
        this.group.add(antenna);
        
        this.group.position.set(x, 0.3, z);
        this.group.scale.setScalar(0.6 + Math.random() * 0.3);
    }
    
    update(deltaTime) {
        this.turnTimer += deltaTime;
        
        if (this.turnTimer > this.turnInterval) {
            this.direction += (Math.random() - 0.5) * Math.PI * 0.2;
            this.turnTimer = 0;
            this.turnInterval = 120 + Math.random() * 180;
        }
        
        // Ocean bounds: keep yachts in the positive Z ocean area
        const pos = this.group.position;
        if (pos.x < -90 || pos.x > 90) {
            this.direction = Math.PI - this.direction;
            // Clamp to prevent getting stuck
            pos.x = Math.max(-88, Math.min(88, pos.x));
        }
        if (pos.z > 102 || pos.z < 95) {
            this.direction = -this.direction;
            // Clamp to prevent getting stuck  
            pos.z = Math.max(96, Math.min(101, pos.z));
        }
        
        // Bob on water
        this.group.position.y = 0.3 + Math.sin(Date.now() * 0.0008) * 0.15;
        this.group.rotation.z = Math.sin(Date.now() * 0.001) * 0.04;
        this.group.rotation.x = Math.sin(Date.now() * 0.0009) * 0.02;
        
        // Move
        this.group.position.x += Math.sin(this.direction) * this.speed * deltaTime;
        this.group.position.z += Math.cos(this.direction) * this.speed * deltaTime;
        
        // Face direction
        this.group.rotation.y = this.direction;
    }
}

export class BoatSystem {
    constructor(scene) {
        this.scene = scene;
        this.boats = [];
    }
    
    init() {
        // Sailboats - spawn in the sea area (z=96-101)
        for (let i = 0; i < 2; i++) {
            const boat = new Sailboat(
                -80 + Math.random() * 160,
                96 + Math.random() * 5,
                0.008 + Math.random() * 0.006
            );
            this.boats.push(boat);
            this.scene.add(boat.group);
        }
        
        // Yachts
        for (let i = 0; i < 1; i++) {
            const yacht = new Yacht(
                -70 + Math.random() * 140,
                95 + Math.random() * 4,
                0.006 + Math.random() * 0.004
            );
            this.boats.push(yacht);
            this.scene.add(yacht.group);
        }
        
        console.log('[BoatSystem] Created', this.boats.length, 'boats');
    }
    
    update(deltaTime) {
        this.boats.forEach(boat => boat.update(deltaTime));
    }
}
