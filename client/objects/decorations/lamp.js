/**
 * Lamp - 路灯装饰
 *
 * @module objects/decorations/lamp
 */

import * as THREE from 'three';

class Lamp {
    constructor(position) {
        this.position = position;
        this.mesh = null;
        this.isOn = false;
    }

    createMesh() {
        const group = new THREE.Group();

        // 灯柱
        const poleGeo = new THREE.CylinderGeometry(0.05, 0.08, 2, 6);
        const poleMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
        const pole = new THREE.Mesh(poleGeo, poleMat);
        pole.position.y = 1;
        group.add(pole);

        // 灯罩
        const shadeGeo = new THREE.CylinderGeometry(0.15, 0.1, 0.2, 6);
        const shadeMat = new THREE.MeshLambertMaterial({ color: 0x888888 });
        const shade = new THREE.Mesh(shadeGeo, shadeMat);
        shade.position.y = 2.1;
        group.add(shade);

        // 灯泡
        const bulbGeo = new THREE.SphereGeometry(0.08, 8, 8);
        const bulbMat = new THREE.MeshBasicMaterial({ color: 0xffffaa });
        this.bulbMesh = new THREE.Mesh(bulbGeo, bulbMat);
        this.bulbMesh.position.y = 2;
        group.add(this.bulbMesh);

        // 点光源（可选）
        this.light = new THREE.PointLight(0xffffaa, 0, 5);
        this.light.position.y = 2;
        group.add(this.light);

        group.position.set(this.position.x, 0, this.position.z);
        this.mesh = group;
        return group;
    }

    turnOn() {
        this.isOn = true;
        if (this.bulbMesh) {
            this.bulbMesh.material.color.setHex(0xffffaa);
        }
        if (this.light) {
            this.light.intensity = 1;
        }
    }

    turnOff() {
        this.isOn = false;
        if (this.bulbMesh) {
            this.bulbMesh.material.color.setHex(0x333333);
        }
        if (this.light) {
            this.light.intensity = 0;
        }
    }
}

export { Lamp };
