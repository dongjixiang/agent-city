/**
 * Bench - 长椅装饰
 *
 * @module objects/decorations/bench
 */

import * as THREE from 'three';

class Bench {
    constructor(position, rotation = 0) {
        this.position = position;
        this.rotation = rotation;
        this.mesh = null;
    }

    createMesh() {
        const group = new THREE.Group();

        const woodMat = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
        const metalMat = new THREE.MeshLambertMaterial({ color: 0x555555 });

        // 座板
        const seatGeo = new THREE.BoxGeometry(1.2, 0.08, 0.4);
        const seat = new THREE.Mesh(seatGeo, woodMat);
        seat.position.y = 0.45;
        group.add(seat);

        // 靠背
        const backGeo = new THREE.BoxGeometry(1.2, 0.5, 0.06);
        const back = new THREE.Mesh(backGeo, woodMat);
        back.position.set(0, 0.75, -0.17);
        back.rotation.x = 0.1;
        group.add(back);

        // 腿 x2
        const legGeo = new THREE.BoxGeometry(0.06, 0.45, 0.3);
        for (const x of [-0.5, 0.5]) {
            const leg = new THREE.Mesh(legGeo, metalMat);
            leg.position.set(x, 0.22, 0);
            group.add(leg);
        }

        group.position.set(this.position.x, 0, this.position.z);
        group.rotation.y = this.rotation;
        this.mesh = group;
        return group;
    }
}

export { Bench };
