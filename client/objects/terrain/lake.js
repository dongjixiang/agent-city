/**
 * Lake - 湖泊地形
 *
 * 创建水面效果
 *
 * @module objects/terrain/lake
 */

import * as THREE from 'three';

class Lake {
    constructor(position, radius = 5) {
        this.position = position;
        this.radius = radius;
        this.mesh = null;
    }

    /**
     * 创建湖泊 mesh
     */
    createMesh() {
        const group = new THREE.Group();

        // 水面
        const waterGeo = new THREE.CircleGeometry(this.radius, 32);
        const waterMat = new THREE.MeshPhongMaterial({
            color: 0x1a5f7a,
            transparent: true,
            opacity: 0.7,
            shininess: 100
        });
        const water = new THREE.Mesh(waterGeo, waterMat);
        water.rotation.x = Math.PI / 2;
        water.position.y = 0.05;
        group.add(water);

        // 边缘
        const edgeGeo = new THREE.RingGeometry(this.radius, this.radius + 0.5, 32);
        const edgeMat = new THREE.MeshLambertMaterial({
            color: 0x3d8b6e,
            side: THREE.DoubleSide
        });
        const edge = new THREE.Mesh(edgeGeo, edgeMat);
        edge.rotation.x = Math.PI / 2;
        edge.position.y = 0.02;
        group.add(edge);

        group.position.set(this.position.x, 0, this.position.z);
        this.mesh = group;
        return group;
    }
}

export { Lake };

