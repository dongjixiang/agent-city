/**
 * Flower - 花朵装饰
 *
 * @module objects/decorations/flower
 */

import * as THREE from 'three';

class Flower {
    constructor(position, color = null) {
        this.position = position;
        this.color = color || this._randomColor();
        this.mesh = null;
    }

    _randomColor() {
        const colors = [0xff69b4, 0xff6347, 0xffd700, 0xffa500, 0xda70d6, 0xffffff];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    createMesh() {
        const group = new THREE.Group();

        // 茎
        const stemGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.3, 4);
        const stemMat = new THREE.MeshLambertMaterial({ color: 0x228b22 });
        const stem = new THREE.Mesh(stemGeo, stemMat);
        stem.position.y = 0.15;
        group.add(stem);

        // 花瓣
        const petalGeo = new THREE.SphereGeometry(0.08, 6, 6);
        const petalMat = new THREE.MeshLambertMaterial({ color: this.color });
        for (let i = 0; i < 5; i++) {
            const petal = new THREE.Mesh(petalGeo, petalMat);
            const angle = (i / 5) * Math.PI * 2;
            petal.position.set(
                Math.cos(angle) * 0.06,
                0.35,
                Math.sin(angle) * 0.06
            );
            group.add(petal);
        }

        // 花心
        const centerGeo = new THREE.SphereGeometry(0.04, 6, 6);
        const centerMat = new THREE.MeshLambertMaterial({ color: 0xffff00 });
        const center = new THREE.Mesh(centerGeo, centerMat);
        center.position.y = 0.35;
        group.add(center);

        group.position.set(this.position.x, 0, this.position.z);
        group.scale.set(0.5, 0.5, 0.5);
        this.mesh = group;
        return group;
    }
}

export { Flower };
