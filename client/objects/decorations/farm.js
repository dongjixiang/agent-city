/**
 * Farm - 农田系统
 *
 * 农田、农作物和稻草人
 *
 * @module objects/decorations/farm
 */

import * as THREE from 'three';

/**
 * 创建小麦
 */
export function createWheat(x, z) {
    const group = new THREE.Group();
    
    // 麦秆
    const stemGeo = new THREE.CylinderGeometry(0.03, 0.04, 0.6, 4);
    const stemMat = new THREE.MeshLambertMaterial({ color: 0xDAA520 });
    const stem = new THREE.Mesh(stemGeo, stemMat);
    stem.position.y = 0.3;
    group.add(stem);
    
    // 麦穗
    const wheatHead = new THREE.Mesh(
        new THREE.SphereGeometry(0.08, 6, 4),
        new THREE.MeshLambertMaterial({ color: 0xFFD700 })
    );
    wheatHead.position.y = 0.65;
    wheatHead.scale.y = 1.5;
    group.add(wheatHead);
    
    group.position.set(x, 0, z);
    group.scale.setScalar(0.8 + Math.random() * 0.4);
    return group;
}

/**
 * 创建玉米
 */
export function createCorn(x, z) {
    const group = new THREE.Group();
    
    // 玉米秆
    const stemGeo = new THREE.CylinderGeometry(0.05, 0.06, 1.2, 4);
    const stemMat = new THREE.MeshLambertMaterial({ color: 0x228B22 });
    const stem = new THREE.Mesh(stemGeo, stemMat);
    stem.position.y = 0.6;
    group.add(stem);
    
    // 玉米叶子
    const leafMat = new THREE.MeshLambertMaterial({ color: 0x228B22, side: THREE.DoubleSide });
    for (let i = 0; i < 3; i++) {
        const leaf = new THREE.Mesh(
            new THREE.PlaneGeometry(0.3, 0.5),
            leafMat
        );
        leaf.position.set(0.1, 0.4 + i * 0.2, 0);
        leaf.rotation.z = Math.PI / 6;
        group.add(leaf);
    }
    
    // 玉米棒子
    const cornCob = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.08, 0.4, 6),
        new THREE.MeshLambertMaterial({ color: 0xFFD700 })
    );
    cornCob.position.set(-0.12, 0.5, 0);
    cornCob.rotation.z = Math.PI / 4;
    group.add(cornCob);
    
    group.position.set(x, 0, z);
    group.scale.setScalar(0.8 + Math.random() * 0.4);
    return group;
}

/**
 * 创建白菜
 */
export function createCabbage(x, z) {
    const group = new THREE.Group();
    
    // 菜叶（多层圆形叶片）
    const leafMat = new THREE.MeshLambertMaterial({ color: 0x228B22 });
    for (let i = 0; i < 5; i++) {
        const leaf = new THREE.Mesh(
            new THREE.SphereGeometry(0.2 - i * 0.03, 8, 6),
            leafMat
        );
        leaf.position.y = 0.1 + i * 0.05;
        leaf.scale.y = 0.3;
        group.add(leaf);
    }
    
    // 菜心（白色部分）
    const heartMat = new THREE.MeshLambertMaterial({ color: 0xFFFACD });
    const heart = new THREE.Mesh(
        new THREE.SphereGeometry(0.1, 8, 6),
        heartMat
    );
    heart.position.y = 0.2;
    group.add(heart);
    
    group.position.set(x, 0, z);
    group.scale.setScalar(0.8 + Math.random() * 0.4);
    return group;
}

/**
 * 创建萝卜
 */
export function createRadish(x, z) {
    const group = new THREE.Group();
    
    // 绿色萝卜叶
    const leafMat = new THREE.MeshLambertMaterial({ color: 0x228B22 });
    for (let i = 0; i < 4; i++) {
        const leaf = new THREE.Mesh(
            new THREE.ConeGeometry(0.05, 0.4, 4),
            leafMat
        );
        const angle = (i / 4) * Math.PI * 2;
        leaf.position.set(Math.cos(angle) * 0.1, 0.35, Math.sin(angle) * 0.1);
        leaf.rotation.z = Math.PI / 6;
        group.add(leaf);
    }
    
    // 露出地面的萝卜尖（粉色）
    const tipMat = new THREE.MeshLambertMaterial({ color: 0xFF69B4 });
    const tip = new THREE.Mesh(
        new THREE.ConeGeometry(0.12, 0.2, 6),
        tipMat
    );
    tip.position.y = 0.15;
    tip.rotation.x = Math.PI;
    group.add(tip);
    
    group.position.set(x, 0, z);
    group.scale.setScalar(0.8 + Math.random() * 0.4);
    return group;
}

/**
 * 创建稻草人
 */
export function createScarecrow(x, z) {
    const group = new THREE.Group();
    
    // 垂直木杆
    const poleMat = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    const verticalPole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.08, 2.5, 6),
        poleMat
    );
    verticalPole.position.y = 1.25;
    group.add(verticalPole);
    
    // 水平木杆（手臂）
    const horizontalPole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.06, 1.5, 6),
        poleMat
    );
    horizontalPole.rotation.z = Math.PI / 2;
    horizontalPole.position.y = 1.8;
    group.add(horizontalPole);
    
    // 草帽
    const hatMat = new THREE.MeshLambertMaterial({ color: 0xD2691E });
    const hatBrim = new THREE.Mesh(
        new THREE.CylinderGeometry(0.5, 0.5, 0.05, 12),
        hatMat
    );
    hatBrim.position.y = 2.5;
    group.add(hatBrim);
    
    const hatTop = new THREE.Mesh(
        new THREE.CylinderGeometry(0.25, 0.3, 0.3, 12),
        hatMat
    );
    hatTop.position.y = 2.65;
    group.add(hatTop);
    
    // 布衣服
    const clothMat = new THREE.MeshLambertMaterial({ color: 0x8B0000 });
    const cloth = new THREE.Mesh(
        new THREE.BoxGeometry(0.6, 0.5, 0.15),
        clothMat
    );
    cloth.position.y = 1.5;
    group.add(cloth);
    
    // 布条袖子
    const sleeveMat = new THREE.MeshLambertMaterial({ color: 0x8B0000 });
    const leftSleeve = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.08, 0.4, 4),
        sleeveMat
    );
    leftSleeve.rotation.z = Math.PI / 2;
    leftSleeve.position.set(-0.65, 1.65, 0);
    group.add(leftSleeve);
    
    const rightSleeve = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.08, 0.4, 4),
        sleeveMat
    );
    rightSleeve.rotation.z = Math.PI / 2;
    rightSleeve.position.set(0.65, 1.65, 0);
    group.add(rightSleeve);
    
    group.position.set(x, 0, z);
    return group;
}

/**
 * 创建阡陌（田间小路）
 */
export function createPathSegment(x1, z1, x2, z2, width = 1.2) {
    const group = new THREE.Group();
    
    const length = Math.sqrt((x2-x1)**2 + (z2-z1)**2);
    const pathMat = new THREE.MeshLambertMaterial({ color: 0xD2B48C });
    
    const path = new THREE.Mesh(
        new THREE.CylinderGeometry(width/2, width/2, length, 8),
        pathMat
    );
    
    // 计算旋转角度
    const dx = x2 - x1;
    const dz = z2 - z1;
    const angle = Math.atan2(dx, dz);
    
    path.rotation.x = Math.PI / 2;
    path.rotation.z = angle;
    path.position.set((x1+x2)/2, 0.02, (z1+z2)/2);
    
    group.add(path);
    return group;
}

/**
 * 创建一块农田
 * @param {number} x - 左下角 X
 * @param {number} z - 左下角 Z
 * @param {number} width - 宽度
 * @param {number} depth - 深度
 * @param {string} cropType - 'wheat' | 'corn' | 'cabbage' | 'radish'
 */
export function createFarmland(x, z, width, depth, cropType) {
    const group = new THREE.Group();
    
    // 农田地面（土黄色）
    const farmlandMat = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
    const farmland = new THREE.Mesh(
        new THREE.PlaneGeometry(width, depth),
        farmlandMat
    );
    farmland.rotation.x = -Math.PI / 2;
    farmland.position.set(x + width/2, 0.01, z + depth/2);
    group.add(farmland);
    
    // 根据类型创建作物
    const cropSpacing = cropType === 'corn' ? 2.5 : 1.8;
    const createCrop = cropType === 'wheat' ? createWheat :
                       cropType === 'corn' ? createCorn :
                       cropType === 'cabbage' ? createCabbage : createRadish;
    
    // 在农田中种植作物（留出边缘）
    const margin = 1.5;
    for (let cx = x + margin; cx < x + width - margin; cx += cropSpacing) {
        for (let cz = z + margin; cz < z + depth - margin; cz += cropSpacing) {
            // 添加一些随机性
            const offsetX = (Math.random() - 0.5) * 0.5;
            const offsetZ = (Math.random() - 0.5) * 0.5;
            const crop = createCrop(cx + offsetX, cz + offsetZ);
            group.add(crop);
        }
    }
    
    return group;
}

/**
 * 创建一整片农田区域
 */
export function createFarmlandArea() {
    const group = new THREE.Group();
    
    // 四块农田
    // 1号田: 小麦 X:-95~-82, Z:-60~-35
    group.add(createFarmland(-95, -60, 13, 25, 'wheat'));
    
    // 2号田: 玉米 X:-80~-70, Z:-60~-35
    group.add(createFarmland(-80, -60, 10, 25, 'corn'));
    
    // 3号田: 白菜 X:-95~-82, Z:-30~-5
    group.add(createFarmland(-95, -30, 13, 25, 'cabbage'));
    
    // 4号田: 萝卜 X:-80~-70, Z:-30~-5
    group.add(createFarmland(-80, -30, 10, 25, 'radish'));
    
    // 纵向阡陌 X ≈ -81.5
    group.add(createPathSegment(-81.5, -60, -81.5, -5, 1.2));
    
    // 横向阡陌 Z ≈ -35
    group.add(createPathSegment(-95, -35, -70, -35, 1.2));
    
    // 横向阡陌 Z ≈ -30
    group.add(createPathSegment(-95, -30, -70, -30, 1.2));
    
    // 稻草人
    group.add(createScarecrow(-88, -25));  // 小麦田中央
    group.add(createScarecrow(-75, -48));  // 玉米田边缘
    group.add(createScarecrow(-90, -55));  // 入口处
    
    // 农田四周的树木
    group.add(createFarmlandTrees());
    
    return group;
}

/**
 * 创建农田四周的树木
 */
function createFarmlandTrees() {
    const group = new THREE.Group();
    
    // 农田边界范围
    const farmX1 = -95, farmX2 = -70;  // X: -95 ~ -70
    const farmZ1 = -60, farmZ2 = -5;   // Z: -60 ~ -5
    
    // 树距农田的间距
    const treeSpacing = 4;
    const treeOffset = 2;  // 树离农田边界的距离
    
    // 北边 (Z = farmZ2 + treeOffset)
    const northZ = farmZ2 + treeOffset;
    for (let x = farmX1 - 3; x <= farmX2 + 3; x += treeSpacing) {
        group.add(createSimpleTree(x, northZ + (Math.random() - 0.5)));
    }
    
    // 南边 (Z = farmZ1 - treeOffset)
    const southZ = farmZ1 - treeOffset;
    for (let x = farmX1 - 3; x <= farmX2 + 3; x += treeSpacing) {
        group.add(createSimpleTree(x, southZ + (Math.random() - 0.5)));
    }
    
    // 西边 (X = farmX1 - treeOffset)
    const westX = farmX1 - treeOffset;
    for (let z = farmZ1; z <= farmZ2; z += treeSpacing) {
        group.add(createSimpleTree(westX + (Math.random() - 0.5), z));
    }
    
    // 东边 (X = farmX2 + treeOffset)
    const eastX = farmX2 + treeOffset;
    for (let z = farmZ1; z <= farmZ2; z += treeSpacing) {
        group.add(createSimpleTree(eastX + (Math.random() - 0.5), z));
    }
    
    // 角落加强
    group.add(createSimpleTree(farmX1 - 2, farmZ1 - 2));
    group.add(createSimpleTree(farmX2 + 2, farmZ1 - 2));
    group.add(createSimpleTree(farmX1 - 2, farmZ2 + 2));
    group.add(createSimpleTree(farmX2 + 2, farmZ2 + 2));
    
    return group;
}

/**
 * 创建简单的树（用于农田装饰）
 */
function createSimpleTree(x, z) {
    const group = new THREE.Group();
    
    // 树干
    const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.15, 0.2, 2, 6),
        new THREE.MeshStandardMaterial({ color: 0x8B4513 })
    );
    trunk.position.y = 1;
    group.add(trunk);
    
    // 树叶（随机选择类型）
    const treeType = Math.random();
    if (treeType < 0.4) {
        // 圆形树冠
        const foliage = new THREE.Mesh(
            new THREE.SphereGeometry(1.5, 8, 6),
            new THREE.MeshStandardMaterial({ color: 0x228B22 })
        );
        foliage.position.y = 3;
        group.add(foliage);
    } else if (treeType < 0.7) {
        // 锥形松树
        for (let i = 0; i < 3; i++) {
            const cone = new THREE.Mesh(
                new THREE.ConeGeometry(1.3 - i * 0.3, 1.2, 8),
                new THREE.MeshStandardMaterial({ color: 0x228B22 })
            );
            cone.position.y = 2 + i * 0.8;
            group.add(cone);
        }
    } else {
        // 阔叶树
        const foliage = new THREE.Mesh(
            new THREE.SphereGeometry(1.2, 8, 6),
            new THREE.MeshStandardMaterial({ color: 0x32CD32 })
        );
        foliage.position.y = 3;
        foliage.scale.y = 0.7;
        group.add(foliage);
    }
    
    group.position.set(x, 0, z);
    group.scale.setScalar(0.8 + Math.random() * 0.4);
    return group;
}
