// 诊断：测试各位置是否被阻塞及原因
const fs = require('fs');

// 加载 entity-validator.js 的逻辑
const LAKE_NORTH = {
    position: { x: 10, z: -75 },
    radiusX: 55,
    radiusZ: 22
};
const RIVER_MAIN = {
    width: 8,
    points: [
        [-45, -55], [-40, -50], [-35, -40], [-30, -30], [-25, -20],
        [-20, -10], [-15, 0], [-10, 10], [-5, 20], [0, 30],
        [5, 40], [10, 50], [15, 60], [20, 70], [25, 80]
    ]
};
const BUILDINGS = [
    { id: 'bld_skillAcademy', position: { x: -30, z: -35 }, size: { width: 8, depth: 8 } },
    { id: 'bld_library', position: { x: 0, z: 50 }, size: { width: 14, depth: 12 } },
    { id: 'bld_workshop', position: { x: 27, z: 74 }, size: { width: 14, depth: 10 } },
    { id: 'bld_messageStation', position: { x: 78, z: 50 }, size: { width: 6, depth: 6 } },
    { id: 'bld_artGallery', position: { x: 0, z: 75 }, size: { width: 14, depth: 10 } },
    { id: 'bld_archive', position: { x: 50, z: 72 }, size: { width: 14, depth: 12 } },
    { id: 'bld_taskCenter', position: { x: 74, z: 72 }, size: { width: 10, depth: 8 } },
    { id: 'bld_dataCenter', position: { x: 0, z: 20 }, size: { width: 14, depth: 10 } },
    { id: 'bld_reputationTower', position: { x: -75, z: 72 }, size: { width: 7, depth: 7 } },
    { id: 'bld_plazaFountain', position: { x: 40, z: 40 }, size: { width: 12, depth: 12 } },
    { id: 'bld_civicNorth', position: { x: 40, z: 23 }, size: { width: 10, depth: 10 } },
    { id: 'bld_civicEast', position: { x: 25, z: 42 }, size: { width: 10, depth: 10 } },
    { id: 'bld_civicWest', position: { x: 55, z: 42 }, size: { width: 10, depth: 10 } },
    { id: 'bld_flagpole1', position: { x: 30, z: 23 }, size: { width: 0.3, depth: 0.3 } },
    { id: 'bld_flagpole2', position: { x: 50, z: 23 }, size: { width: 0.3, depth: 0.3 } },
    { id: 'bld_urban_1', position: { x: 5, z: -2 }, size: { width: 6, depth: 5 } },
    { id: 'bld_urban_2', position: { x: 80, z: 28 }, size: { width: 6, depth: 5 } },
    { id: 'bld_urban_3', position: { x: 22, z: -2 }, size: { width: 6, depth: 5 } },
    { id: 'bld_urban_4', position: { x: 47, z: -2 }, size: { width: 6, depth: 5 } },
    { id: 'bld_urban_5', position: { x: 72, z: 28 }, size: { width: 6, depth: 5 } },
    { id: 'bld_urban_6', position: { x: 32, z: -2 }, size: { width: 6, depth: 5 } },
    { id: 'bld_urban_7', position: { x: 58, z: -2 }, size: { width: 6, depth: 5 } },
    { id: 'bld_urban_8', position: { x: 73, z: -2 }, size: { width: 6, depth: 5 } },
    { id: 'bld_urban_9', position: { x: 79, z: 10 }, size: { width: 6, depth: 5 } },
    { id: 'bld_urban_10', position: { x: 71, z: 10 }, size: { width: 6, depth: 5 } },
    { id: 'bld_nw_house_1', position: { x: -57, z: -56 }, size: { width: 6, depth: 5 } },
    { id: 'bld_nw_house_2', position: { x: -55, z: -40 }, size: { width: 6, depth: 5 } },
    { id: 'bld_nw_house_3', position: { x: -57, z: -25 }, size: { width: 6, depth: 5 } },
    { id: 'bld_nw_house_4', position: { x: -53, z: -12 }, size: { width: 6, depth: 5 } },
    { id: 'bld_nw_house_5', position: { x: -50, z: 5 }, size: { width: 6, depth: 5 } },
    { id: 'bld_nw_house_6', position: { x: -46, z: -50 }, size: { width: 6, depth: 5 } },
    { id: 'bld_nw_house_7', position: { x: -48, z: -30 }, size: { width: 6, depth: 5 } },
    { id: 'bld_nw_house_8', position: { x: -44, z: -13 }, size: { width: 6, depth: 5 } },
    { id: 'bld_nw_house_9', position: { x: -46, z: 20 }, size: { width: 6, depth: 5 } },
    { id: 'bld_lake_house_1', position: { x: 62, z: -45 }, size: { width: 6, depth: 5 } },
    { id: 'bld_lake_house_2', position: { x: 65, z: -55 }, size: { width: 6, depth: 5 } },
    { id: 'bld_lake_house_3', position: { x: 60, z: -65 }, size: { width: 6, depth: 5 } },
    { id: 'bld_lake_house_4', position: { x: 55, z: -75 }, size: { width: 6, depth: 5 } },
    { id: 'bld_lake_house_5', position: { x: 40, z: -45 }, size: { width: 6, depth: 5 } },
];

function pointToSeg(px, pz, x1, y1, x2, y2) {
    const dx = x2-x1, dz = y2-y1, len2 = dx*dx+dz*dz;
    if (len2 === 0) return Math.sqrt((px-x1)**2+(pz-y1)**2);
    let t = Math.max(0, Math.min(1, ((px-x1)*dx+(pz-y1)*dz)/len2));
    return Math.sqrt((px-(x1+t*dx))**2+(pz-(y1+t*dz))**2);
}

function isValidWalkPosition(x, z) {
    if (x < -100 || x >= 100 || z < -100 || z >= 100) return { valid: false, reason: '超出世界边界' };
    if (z > 85) return { valid: false, reason: '海洋区域不可通行' };
    const ldx = (x-10)/55, ldz = (z-(-75))/22;
    if (ldx*ldx+ldz*ldz <= 1) return { valid: false, reason: '湖泊区域不可通行' };
    for (let i = 0; i < RIVER_MAIN.points.length-1; i++) {
        const p1 = RIVER_MAIN.points[i], p2 = RIVER_MAIN.points[i+1];
        if (pointToSeg(x, z, p1[0], p1[1], p2[0], p2[1]) < 4) return { valid: false, reason: '河流区域不可通行' };
    }
    for (const b of BUILDINGS) {
        const hw = (b.size?.width||6)/2+1, hd = (b.size?.depth||5)/2+1;
        if (x >= b.position.x-hw && x <= b.position.x+hw && z >= b.position.z-hd && z <= b.position.z+hd) {
            return { valid: false, reason: `建筑 "${b.id}" 区域不可通行` };
        }
    }
    return { valid: true, reason: null };
}

// 测试用户报告的关键位置
const testPositions = [
    [0, 70],    // 用户报告被Block但离海还有距离
    [0, 80],    // 近海
    [0, 75],    // art gallery附近
    [0, 30],    // 河边上
    [25, 80],   // 河末端
    [30, 30],   // 坦克起始点
    [0, 85],    // 刚好在海边界
    [0, -75],   // 湖中心
    [10, -75],  // 湖中心
    [-20, -20], // 坦克巡逻起点
];

console.log('=== 位置验证诊断 ===');
for (const [x, z] of testPositions) {
    const r = isValidWalkPosition(x, z);
    console.log(`(${x}, ${z}): ${r.valid ? 'OK' : 'BLOCKED - ' + r.reason}`);
}
