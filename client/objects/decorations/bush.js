/**
 * Bush - 灌木装饰
 *
 * @module objects/decorations/bush
 */

import * as THREE from 'three';

class Bush {
    constructor(position, size = 1) {
        this.position = position;
        this.size = size;
        this.mesh = null;
    }

    createMesh() {
        const group = new THREE.Group();

        const greenMat = new THREE.MeshLambertMaterial({ color: 0x2d5a27 });

        // 主球体
        const mainGeo = new THREE.SphereGeometry(0.4 * this.size, 8, 8);
        const main = new THREE.Mesh(mainGeo, greenMat);
        main.position.y = 0.4 * this.size;
        group.add(main);

        // 辅助球体
        const smallGeo = new THREE.SphereGeometry(0.25 * this.size, 8, 8);
        for (const offset of [
            { x: 0.25, z: 0 },
            { x: -0.25, z: 0 },
            { x: 0, z: 0.25 },
            { x: 0, z: -0.25 }
        ]) {
            const small = new THREE.Mesh(smallGeo, greenMat);
            small.position.set(
                offset.x * this.size,
                0.25 * this.size,
                offset.z * this.size
            );
            group.add(small);
        }

        group.position.set(this.position.x, 0, this.position.z);
        this.mesh = group;
        return group;
    }
}

export { Bush };
