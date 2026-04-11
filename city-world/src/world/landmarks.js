/**
 * Landmarks - 地标
 * 
 * 世界中的标志性建筑和地点
 */

import * as THREE from 'three';

class Landmark {
    constructor(id, config) {
        this.id = id;
        this.name = config.name;
        this.position = config.position;
        this.description = config.description || '';
        this.mesh = null;
    }

    create() {
        // 默认地标是一个简单的纪念碑
        const group = new THREE.Group();
        group.name = this.name;
        group.position.set(this.position.x, 0, this.position.z);

        const pillarGeo = new THREE.CylinderGeometry(0.5, 0.7, 5, 8);
        const pillarMat = new THREE.MeshStandardMaterial({
            color: 0xcccccc,
            roughness: 0.7,
            metalness: 0.3
        });
        const pillar = new THREE.Mesh(pillarGeo, pillarMat);
        pillar.position.y = 2.5;
        pillar.castShadow = true;
        group.add(pillar);

        const topGeo = new THREE.SphereGeometry(0.6, 16, 16);
        const topMat = new THREE.MeshStandardMaterial({
            color: 0xffd700,
            metalness: 0.6,
            roughness: 0.4
        });
        const top = new THREE.Mesh(topGeo, topMat);
        top.position.y = 5.3;
        group.add(top);

        this.mesh = group;
        return group;
    }
}

class LandmarksManager {
    constructor() {
        this.scene = null;
        this.group = null;
        this.landmarks = new Map();
    }

    init(scene) {
        this.scene = scene;
        this.group = new THREE.Group();
        this.group.name = 'landmarks';
        this.scene.add(this.group);
        return this;
    }

    createAll() {
        // 城市广场 - 中央
        this.createLandmark('city_square', {
            name: '城市广场',
            position: { x: 0, z: 0 },
            description: '智体城的中心广场'
        });

        // 城门 - 四个方向
        this.createLandmark('gate_north', {
            name: '北门',
            position: { x: 0, z: -50 },
            description: '通往北方'
        });
        this.createLandmark('gate_south', {
            name: '南门',
            position: { x: 0, z: 50 },
            description: '通往南方'
        });
        this.createLandmark('gate_east', {
            name: '东门',
            position: { x: 50, z: 0 },
            description: '通往东方'
        });
        this.createLandmark('gate_west', {
            name: '西门',
            position: { x: -50, z: 0 },
            description: '通往西方'
        });

        // 观景台
        this.createLandmark('viewpoint', {
            name: '观景台',
            position: { x: 45, z: -45 },
            description: '俯瞰整个城市'
        });

        console.log(`[Landmarks] Created ${this.landmarks.size} landmarks`);
        return this;
    }

    createLandmark(id, config) {
        const landmark = new Landmark(id, config);
        const mesh = landmark.create();
        this.group.add(mesh);
        this.landmarks.set(id, landmark);
        return landmark;
    }

    getLandmark(id) {
        return this.landmarks.get(id);
    }

    getAllLandmarks() {
        return Array.from(this.landmarks.values());
    }

    dispose() {
        for (const landmark of this.landmarks.values()) {
            if (landmark.mesh) {
                this.group.remove(landmark.mesh);
            }
        }
        this.landmarks.clear();
    }
}

const landmarksManager = new LandmarksManager();

export { LandmarksManager, landmarksManager, Landmark };
