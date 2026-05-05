/**
 * EntityValidator v6 - 客户端实体边界验证
 * 坐标系统: -100 ~ 100
 * 海洋: z > 90 | 湖泊: 椭圆中心(10,-75)半径55×22 | 河流: 折线宽度8
 */

// 世界边界
const WORLD_MIN = -100;
const WORLD_MAX = 100;

// 海洋: z > 90 不可通行
const OCEAN_Z = 90;

// 湖泊（椭圆，中心 10,-75，半径 55x22）
const LAKE_NORTH = {
    position: { x: 10, z: -75 },
    radiusX: 55,
    radiusZ: 22
};

// 河流（折线，宽度 8）
const RIVER_MAIN = {
    width: 8,
    points: [
        [-45, -55], [-40, -50], [-35, -40], [-30, -30], [-25, -20],
        [-20, -10], [-15, 0], [-10, 10], [-5, 20], [0, 30],
        [5, 40], [10, 50], [15, 60], [20, 70], [25, 80]
    ]
};

// 桥梁列表（道路横穿河流的位置）
// 每个桥梁: { x, z, halfWidth } 中心点(x,z)，有效宽度=halfWidth×2
const BRIDGES = [
    { x: -12.5, z: 5,   halfWidth: 5  },  // ewRoad1 @ z=5,  x=-10~85
    { x: 7,     z: 35,  halfWidth: 4  },  // ewRoad2 @ z=35, x=-10~17
    { x: 75,    z: 65,  halfWidth: 4  },  // ewRoad4 @ z=65, x=-10~85
    { x: 15,    z: 65,  halfWidth: 4  },  // nsRoad1 @ x=15
    { x: -50,   z: -10, halfWidth: 4  },  // suburban road x=-50 @ z=-10~30
];

// 建筑碰撞（已大幅缩小，避免遮挡道路）
const BUILDINGS = [
    { id: 'bld_skillAcademy',  position: { x: -30, z: -35 }, size: { width: 6, depth: 6 } },
    { id: 'bld_library',       position: { x: 0,   z: 50  }, size: { width: 8, depth: 8 } },
    { id: 'bld_workshop',       position: { x: 27,  z: 74  }, size: { width: 8, depth: 6 } },
    { id: 'bld_messageStation', position: { x: 78,  z: 50  }, size: { width: 4, depth: 4 } },
    { id: 'bld_artGallery',     position: { x: 0,   z: 75  }, size: { width: 8, depth: 4 } },
    { id: 'bld_archive',        position: { x: 50,  z: 72  }, size: { width: 8, depth: 8 } },
    { id: 'bld_taskCenter',     position: { x: 74,  z: 72  }, size: { width: 6, depth: 6 } },
    { id: 'bld_dataCenter',     position: { x: 0,   z: 20  }, size: { width: 8, depth: 6 } },
    { id: 'bld_reputationTower', position: { x: -75, z: 72  }, size: { width: 4, depth: 4 } },
    { id: 'bld_plazaFountain',  position: { x: 40,  z: 40  }, size: { width: 6, depth: 6 } },
    { id: 'bld_civicNorth',     position: { x: 40,  z: 23  }, size: { width: 6, depth: 6 } },
    { id: 'bld_civicEast',      position: { x: 25,  z: 42  }, size: { width: 6, depth: 6 } },
    { id: 'bld_civicWest',      position: { x: 55,  z: 42  }, size: { width: 6, depth: 6 } },
    { id: 'bld_flagpole1',      position: { x: 30,  z: 23  }, size: { width: 0.3, depth: 0.3 } },
    { id: 'bld_flagpole2',      position: { x: 50,  z: 23  }, size: { width: 0.3, depth: 0.3 } },
    { id: 'bld_urban_1',        position: { x: 5,   z: -2  }, size: { width: 4, depth: 3 } },
    { id: 'bld_urban_2',        position: { x: 80,  z: 28  }, size: { width: 4, depth: 3 } },
    { id: 'bld_urban_3',        position: { x: 22,  z: -2  }, size: { width: 4, depth: 3 } },
    { id: 'bld_urban_4',        position: { x: 47,  z: -2  }, size: { width: 4, depth: 3 } },
    { id: 'bld_urban_5',        position: { x: 72,  z: 28  }, size: { width: 4, depth: 3 } },
    { id: 'bld_urban_6',        position: { x: 32,  z: -2  }, size: { width: 4, depth: 3 } },
    { id: 'bld_urban_7',        position: { x: 58,  z: -2  }, size: { width: 4, depth: 3 } },
    { id: 'bld_urban_8',        position: { x: 73,  z: -2  }, size: { width: 4, depth: 3 } },
    { id: 'bld_urban_9',        position: { x: 79,  z: 10  }, size: { width: 4, depth: 3 } },
    { id: 'bld_urban_10',       position: { x: 71,  z: 10  }, size: { width: 4, depth: 3 } },
    { id: 'bld_nw_house_1',     position: { x: -57, z: -56 }, size: { width: 4, depth: 3 } },
    { id: 'bld_nw_house_2',     position: { x: -55, z: -40 }, size: { width: 4, depth: 3 } },
    { id: 'bld_nw_house_3',     position: { x: -57, z: -25 }, size: { width: 4, depth: 3 } },
    { id: 'bld_nw_house_4',     position: { x: -53, z: -12 }, size: { width: 4, depth: 3 } },
    { id: 'bld_nw_house_5',     position: { x: -50, z: 5   }, size: { width: 4, depth: 3 } },
    { id: 'bld_nw_house_6',     position: { x: -46, z: -50 }, size: { width: 4, depth: 3 } },
    { id: 'bld_nw_house_7',     position: { x: -48, z: -30 }, size: { width: 4, depth: 3 } },
    { id: 'bld_nw_house_8',     position: { x: -44, z: -13 }, size: { width: 4, depth: 3 } },
    { id: 'bld_nw_house_9',     position: { x: -46, z: 20  }, size: { width: 4, depth: 3 } },
    { id: 'bld_lake_house_1',   position: { x: 62,  z: -45 }, size: { width: 4, depth: 3 } },
    { id: 'bld_lake_house_2',   position: { x: 65,  z: -55 }, size: { width: 4, depth: 3 } },
    { id: 'bld_lake_house_3',   position: { x: 60,  z: -65 }, size: { width: 4, depth: 3 } },
    { id: 'bld_lake_house_4',   position: { x: 55,  z: -75 }, size: { width: 4, depth: 3 } },
    { id: 'bld_lake_house_5',   position: { x: 40,  z: -45 }, size: { width: 4, depth: 3 } },
];

function pointToSegmentDistance(px, pz, x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dz = y2 - y1;
    const len2 = dx * dx + dz * dz;
    if (len2 === 0) return Math.sqrt((px - x1) ** 2 + (pz - y1) ** 2);
    let t = ((px - x1) * dx + (pz - y1) * dz) / len2;
    t = Math.max(0, Math.min(1, t));
    const nearX = x1 + t * dx;
    const nearZ = y1 + t * dz;
    return Math.sqrt((px - nearX) ** 2 + (pz - nearZ) ** 2);
}

/**
 * 检查点是否在桥梁范围内（河流专用）
 * @returns {boolean} true=在桥梁上，可通行
 */
function isOnBridge(x, z) {
    for (const b of BRIDGES) {
        if (Math.abs(z - b.z) < b.halfWidth && Math.abs(x - b.x) < b.halfWidth) {
            return true;
        }
    }
    return false;
}

// 调试：每次调用打印日志（河流详细版）
window.__debugValidator = (x, z) => {
    // 河流检查
    for (let i = 0; i < RIVER_MAIN.points.length - 1; i++) {
        const p1 = RIVER_MAIN.points[i], p2 = RIVER_MAIN.points[i+1];
        const d = pointToSegmentDistance(x, z, p1[0], p1[1], p2[0], p2[1]);
        if (d < RIVER_MAIN.width / 2) {
            const onBridge = isOnBridge(x, z);
            console.log(`[Validator:river] (${x.toFixed(1)},${z.toFixed(1)}) dist=${d.toFixed(2)} inRiver=true onBridge=${onBridge}`);
        }
    }
    const r = isValidWalkPosition(x, z);
    console.log(`[Validator:debug] (${x.toFixed(1)}, ${z.toFixed(1)}) → ${r.valid ? 'OK' : 'BLOCKED: ' + r.reason}`);
    return r;
};
window.__debugRiver = (x, z) => {
    for (let i = 0; i < RIVER_MAIN.points.length - 1; i++) {
        const p1 = RIVER_MAIN.points[i], p2 = RIVER_MAIN.points[i+1];
        const d = pointToSegmentDistance(x, z, p1[0], p1[1], p2[0], p2[1]);
        console.log(`  segment ${i}: dist=${d.toFixed(2)}, inRiver=${d < RIVER_MAIN.width/2}, onBridge=${isOnBridge(x,z)}`);
    }
};
window.__debugBridges = () => {
    console.log('BRIDGES:', BRIDGES);
};

function isValidWalkPosition(x, z) {
    // 调试：每次调用打印
    // console.log('[Validator:isValidWalkPosition called]', x, z);
    // 世界边界
    if (x < WORLD_MIN || x >= WORLD_MAX || z < WORLD_MIN || z >= WORLD_MAX) {
        return { valid: false, reason: '超出世界边界' };
    }

    // 海洋 (z > 90) — 海滩 z=85~90 可通行
    if (z > OCEAN_Z) {
        return { valid: false, reason: '海洋区域不可通行' };
    }

    // 湖泊（椭圆，内部不可通行）
    const ldx = (x - LAKE_NORTH.position.x) / LAKE_NORTH.radiusX;
    const ldz = (z - LAKE_NORTH.position.z) / LAKE_NORTH.radiusZ;
    if (ldx * ldx + ldz * ldz <= 1) {
        return { valid: false, reason: '湖泊区域不可通行' };
    }

    // 河流：检查是否在桥梁上，桥梁上可穿行
    for (let i = 0; i < RIVER_MAIN.points.length - 1; i++) {
        const p1 = RIVER_MAIN.points[i];
        const p2 = RIVER_MAIN.points[i + 1];
        const dist = pointToSegmentDistance(x, z, p1[0], p1[1], p2[0], p2[1]);
        if (dist < RIVER_MAIN.width / 2) {
            // 在河流范围内，检查是否是桥
            if (!isOnBridge(x, z)) {
                return { valid: false, reason: '河流区域不可通行（请走桥梁）' };
            }
        }
    }

    // 建筑（已缩小边界，仅作为近距离障碍提示）
    for (const b of BUILDINGS) {
        const hw = (b.size?.width || 4) / 2 + 1;
        const hd = (b.size?.depth || 3) / 2 + 1;
        if (x >= b.position.x - hw && x <= b.position.x + hw &&
            z >= b.position.z - hd && z <= b.position.z + hd) {
            return { valid: false, reason: `建筑 "${b.id}" 区域不可通行` };
        }
    }

    return { valid: true, reason: null };
}

export { isValidWalkPosition };
