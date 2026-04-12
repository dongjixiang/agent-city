/**
 * Fountain - 喷泉设施
 *
 * 城市中心的喷泉，可作为地标
 *
 * @module objects/facilities/fountain
 */

import * as THREE from 'three';

class Fountain {
    constructor(position) {
        this.position = position;
        this.mesh = null;
        this.particles = [];
    }

    createMesh() {
        const group = new THREE.Group();

        // 基座
        const baseGeo = new THREE.CylinderGeometry(1.5, 1.8, 0.4, 12);
        const baseMat = new THREE.MeshLambertMaterial({ color: 0x666666 });
        const base = new THREE.Mesh(baseGeo, baseMat);
        base.position.y = 0.2;
        group.add(base);

        // 水池
        const poolGeo = new THREE.CylinderGeometry(1.3, 1.3, 0.2, 12);
        const poolMat = new THREE.MeshLambertMaterial({ color: 0x3399cc });
        const pool = new THREE.Mesh(poolGeo, poolMat);
        pool.position.y = 0.5;
        group.add(pool);

        // 中央柱
        const pillarGeo = new THREE.CylinderGeometry(0.15, 0.2, 1.5, 8);
        const pillarMat = new THREE.MeshLambertMaterial({ color: 0x888888 });
        const pillar = new THREE.Mesh(pillarGeo, pillarMat);
        pillar.position.y = 1.3;
        group.add(pillar);

        // 顶部装饰
        const topGeo = new THREE.SphereGeometry(0.25, 8, 8);
        const topMat = new THREE.MeshPhongMaterial({ color: 0xaaaaaa, shininess: 100 });
        const top = new THREE.Mesh(topGeo, topMat);
        top.position.y = 2.1;
        group.add(top);

        // 水滴粒子（简单表示）
        const dropGeo = new THREE.SphereGeometry(0.03, 4, 4);
        const dropMat = new THREE.MeshBasicMaterial({ color: 0x66ccff, transparent: true, opacity: 0.6 });

        for (let i = 0; i < 20; i++) {
            const drop = new THREE.Mesh(dropGeo, dropMat);
            const angle = Math.random() * Math.PI * 2;
            const r = Math.random() * 0.3;
            drop.position.set(
                Math.cos(angle) * r,
                2.1 + Math.random() * 0.5,
                Math.sin(angle) * r
            );
            drop.userData = {
                speed: 1 + Math.random() * 0.5,
                angle,
                r,
                phase: Math.random() * Math.PI * 2
            };
            group.add(drop);
            this.particles.push(drop);
        }

        group.position.set(this.position.x, 0, this.position.z);
        this.mesh = group;
        return group;
    }

    /**
     * 更新喷泉动画
     */
    update(deltaTime, time) {
        for (const drop of this.particles) {
            const ud = drop.userData;
            ud.phase += deltaTime * ud.speed * 3;

            drop.position.y = 2.1 + Math.sin(ud.phase) * 0.5;
            drop.position.x = Math.cos(ud.angle + ud.phase * 0.5) * ud.r;
            drop.position.z = Math.sin(ud.angle + ud.phase * 0.5) * ud.r;

            if (drop.position.y < 0.5) {
                ud.phase = 0;
            }
        }
    }
}

export { Fountain };
