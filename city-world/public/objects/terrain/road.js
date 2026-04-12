/**
 * Road - 道路
 *
 * 创建路径/道路
 *
 * @module objects/terrain/road
 */

import * as THREE from 'three';

class Road {
    /**
     * 创建道路
     * @param {Array<{x,z}>} points - 路径点
     * @param {number} width - 宽度
     */
    constructor(points, width = 2) {
        this.points = points;
        this.width = width;
        this.mesh = null;
    }

    createMesh() {
        if (this.points.length < 2) return null;

        const group = new THREE.Group();

        // 创建道路形状
        const shape = new THREE.Shape();
        shape.moveTo(this.points[0].x - this.width / 2, this.points[0].z);

        // 右边缘
        for (let i = 1; i < this.points.length; i++) {
            shape.lineTo(this.points[i].x - this.width / 2, this.points[i].z);
        }

        // 左边缘（反向）
        for (let i = this.points.length - 1; i >= 0; i--) {
            shape.lineTo(this.points[i].x + this.width / 2, this.points[i].z);
        }

        shape.closePath();

        const geometry = new THREE.ShapeGeometry(shape);
        const material = new THREE.MeshLambertMaterial({
            color: 0x3a3a5a,
            side: THREE.DoubleSide
        });

        const road = new THREE.Mesh(geometry, material);
        road.rotation.x = -Math.PI / 2;
        road.position.y = 0.01;
        group.add(road);

        // 中心线
        const lineMat = new THREE.MeshBasicMaterial({ color: 0xaaaaaa });
        for (let i = 0; i < this.points.length - 1; i++) {
            const p1 = this.points[i];
            const p2 = this.points[i + 1];
            const dx = p2.x - p1.x;
            const dz = p2.z - p1.z;
            const length = Math.sqrt(dx * dx + dz * dz);
            const angle = Math.atan2(dz, dx);

            const lineGeo = new THREE.PlaneGeometry(length, 0.1);
            const line = new THREE.Mesh(lineGeo, lineMat);
            line.rotation.x = -Math.PI / 2;
            line.rotation.z = -angle;
            line.position.set((p1.x + p2.x) / 2, 0.02, (p1.z + p2.z) / 2);
            group.add(line);
        }

        this.mesh = group;
        return group;
    }
}

export { Road };
