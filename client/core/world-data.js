/**
 * WorldData - 客户端世界数据
 * 
 * 基于 MAP_ELEMENTS.md 整理，与服务器 world-data.js 保持一致
 * 用于客户端3D渲染
 * 
 * @module client/core/world-data
 */

// 建筑模板 - 对应服务器 buildingTemplates
export const BUILDING_TEMPLATES = {
    skillAcademy: { name: "技能学院", createFn: 'createSkillAcademyBuilding' },
    library: { name: "图书馆", createFn: 'createLibraryBuilding' },
    workshop: { name: "工坊", createFn: 'createWorkshopBuilding' },
    messageStation: { name: "消息驿站", createFn: 'createMessageStationBuilding' },
    artGallery: { name: "艺术展厅", createFn: 'createArtGalleryBuilding' },
    archive: { name: "档案馆", createFn: 'createArchiveBuilding' },
    taskCenter: { name: "任务中心", createFn: 'createTaskCenterBuilding' },
    dataCenter: { name: "数据中心", createFn: 'createDataCenterBuilding' },
    reputationTower: { name: "声誉塔", createFn: 'createReputationTower' },
    civicCenter: { name: "市民中心", createFn: 'createCivicCenterNorth' },
    suburbanHouse: { name: "郊区别墅", createFn: 'createSuburbanHouse' },
    diverseUrban: { name: "多元城市建筑", createFn: 'createDiverseUrbanBuilding' },
    fountain: { name: "喷泉", createFn: 'createPlazaFountain' },
    flagpole: { name: "旗杆", createFn: 'createFlagpole' }
};

// 建筑实例 - 与服务器 world-data.js 的 buildings 一致
export const BUILDINGS = [
    { id: "bld_skillAcademy", type: "skillAcademy", position: { x: -30, z: -35 } },
    { id: "bld_library", type: "library", position: { x: 0, z: 50 } },
    { id: "bld_workshop", type: "workshop", position: { x: 27, z: 74 } },
    { id: "bld_messageStation", type: "messageStation", position: { x: 78, z: 50 } },
    { id: "bld_artGallery", type: "artGallery", position: { x: 0, z: 75 } },
    { id: "bld_archive", type: "archive", position: { x: 50, z: 72 } },
    { id: "bld_taskCenter", type: "taskCenter", position: { x: 74, z: 72 } },
    { id: "bld_dataCenter", type: "dataCenter", position: { x: 0, z: 20 } },
    { id: "bld_reputationTower", type: "reputationTower", position: { x: -75, z: 72 } },
    { id: "bld_civicNorth", type: "civicCenter", position: { x: 40, z: 23 }, facing: "north" },
    { id: "bld_civicEast", type: "civicCenter", position: { x: 25, z: 42 }, facing: "east" },
    { id: "bld_civicWest", type: "civicCenter", position: { x: 55, z: 42 }, facing: "west" },
    { id: "bld_plazaFountain", type: "fountain", position: { x: 40, z: 40 } },
    { id: "bld_flagpole1", type: "flagpole", position: { x: 30, z: 23 } },
    { id: "bld_flagpole2", type: "flagpole", position: { x: 50, z: 23 } },
    { id: "bld_urban_1", type: "diverseUrban", position: { x: 5, z: -2 } },
    { id: "bld_urban_2", type: "diverseUrban", position: { x: 80, z: 28 } },
    { id: "bld_urban_3", type: "diverseUrban", position: { x: 22, z: -2 } },
    { id: "bld_urban_4", type: "diverseUrban", position: { x: 47, z: -2 } },
    { id: "bld_urban_5", type: "diverseUrban", position: { x: 72, z: 28 } },
    { id: "bld_urban_6", type: "diverseUrban", position: { x: 32, z: -2 } },
    { id: "bld_urban_7", type: "diverseUrban", position: { x: 58, z: -2 } },
    { id: "bld_urban_8", type: "diverseUrban", position: { x: 73, z: -2 } },
    { id: "bld_urban_9", type: "diverseUrban", position: { x: 79, z: 10 } },
    { id: "bld_urban_10", type: "diverseUrban", position: { x: 71, z: 10 } },
    { id: "bld_nw_house_1", type: "suburbanHouse", position: { x: -57, z: -56 } },
    { id: "bld_nw_house_2", type: "suburbanHouse", position: { x: -55, z: -40 } },
    { id: "bld_nw_house_3", type: "suburbanHouse", position: { x: -57, z: -25 } },
    { id: "bld_nw_house_4", type: "suburbanHouse", position: { x: -53, z: -12 } },
    { id: "bld_nw_house_5", type: "suburbanHouse", position: { x: -50, z: 5 } },
    { id: "bld_nw_house_6", type: "suburbanHouse", position: { x: -46, z: -50 } },
    { id: "bld_nw_house_7", type: "suburbanHouse", position: { x: -48, z: -30 } },
    { id: "bld_nw_house_8", type: "suburbanHouse", position: { x: -44, z: -13 } },
    { id: "bld_nw_house_9", type: "suburbanHouse", position: { x: -46, z: 20 } },
    { id: "bld_lake_house_1", type: "suburbanHouse", position: { x: 62, z: -45 } },
    { id: "bld_lake_house_2", type: "suburbanHouse", position: { x: 65, z: -55 } },
    { id: "bld_lake_house_3", type: "suburbanHouse", position: { x: 60, z: -65 } },
    { id: "bld_lake_house_4", type: "suburbanHouse", position: { x: 55, z: -75 } },
    { id: "bld_lake_house_5", type: "suburbanHouse", position: { x: 40, z: -45 } }
];

// 地形 - 山脉
export const HILLS = [
    { id: "H1", position: { x: -73, z: -92 }, radius: 28, height: 32 },
    { id: "H2", position: { x: -53, z: -90 }, radius: 24, height: 28 },
    { id: "H3", position: { x: -33, z: -92 }, radius: 22, height: 24 },
    { id: "H4", position: { x: -13, z: -90 }, radius: 20, height: 22 },
    { id: "H5", position: { x: 25, z: -92 }, radius: 18, height: 20 },
    { id: "H6", position: { x: 40, z: -90 }, radius: 16, height: 16 },
    { id: "H7", position: { x: 60, z: -88 }, radius: 14, height: 12 },
    { id: "H8", position: { x: 80, z: -85 }, radius: 12, height: 8 },
    { id: "H9", position: { x: 90, z: -82 }, radius: 10, height: 6 }
];

// 水体
export const WATER_BODIES = {
    lake: { id: "lake_north", position: { x: 10, z: -75 }, radiusX: 55, radiusZ: 22 },
    river: {
        id: "river_main",
        points: [
            { x: -10, z: -55 }, { x: -10, z: -20 }, { x: -12, z: 0 },
            { x: -15, z: 20 }, { x: -18, z: 40 }, { x: -20, z: 55 }, { x: -20, z: 91 }
        ],
        width: 8
    }
};

// 道路
export const ROADS = {
    suburban: [
        { id: "SR1", points: [{ x: -50, z: -55 }, { x: -50, z: -45 }], width: 3 },
        { id: "SR2", points: [{ x: -40, z: -55 }, { x: -40, z: -45 }], width: 3 },
        { id: "SR3", points: [{ x: -55, z: -40 }, { x: -55, z: -30 }], width: 3 },
        { id: "SR4", points: [{ x: -45, z: -35 }, { x: -45, z: -25 }], width: 3 },
        { id: "SR5", points: [{ x: -55, z: -20 }, { x: -55, z: -10 }], width: 3 },
        { id: "SR6", points: [{ x: -45, z: -15 }, { x: -45, z: -5 }], width: 3 },
        { id: "SR7", points: [{ x: -55, z: 0 }, { x: -55, z: 10 }], width: 3 },
        { id: "SR8", points: [{ x: -45, z: 5 }, { x: -45, z: 15 }], width: 3 },
        { id: "SR9", points: [{ x: -50, z: 20 }, { x: -50, z: 30 }], width: 3 },
        { id: "SR10", points: [{ x: -40, z: 25 }, { x: -40, z: 35 }], width: 3 }
    ],
    urban: [
        { id: "UN1", start: { x: 15, z: -10 }, end: { x: 15, z: 80 }, width: 4 },
        { id: "UN2", start: { x: 40, z: -10 }, end: { x: 40, z: 5 }, width: 4 },
        { id: "UN3", start: { x: 40, z: 65 }, end: { x: 40, z: 80 }, width: 4 },
        { id: "UN4", start: { x: 65, z: -10 }, end: { x: 65, z: 80 }, width: 4 },
        { id: "UE1", start: { x: -10, z: 5 }, end: { x: 85, z: 5 }, width: 4 },
        { id: "UE2", start: { x: -10, z: 35 }, end: { x: 17, z: 35 }, width: 4 },
        { id: "UE3", start: { x: 63, z: 35 }, end: { x: 85, z: 35 }, width: 4 },
        { id: "UE4", start: { x: -10, z: 65 }, end: { x: 85, z: 65 }, width: 4 }
    ],
    scenicAvenue: { id: "scenicAvenue", points: [{ x: -40, z: 87.5 }, { x: 100, z: 87.5 }], width: 5 }
};

// 桥梁
export const BRIDGES = [
    { id: "B1", position: { x: -12.5, z: -5 }, size: { width: 5, depth: 15.8 } },
    { id: "B2", position: { x: -14.5, z: 35 }, size: { width: 5, depth: 15.8 } },
    { id: "B3", position: { x: -17.5, z: 65 }, size: { width: 5, depth: 15.8 } }
];

// 装饰物
export const DECORATIONS = {
    trees: [
        { id: "tree_m1", type: "tree", position: { x: 48, z: 28 }, style: "maple" },
        { id: "tree_m2", type: "tree", position: { x: 62, z: 28 }, style: "maple" },
        { id: "tree_m3", type: "tree", position: { x: 48, z: 38 }, style: "maple" },
        { id: "tree_m4", type: "tree", position: { x: 62, z: 38 }, style: "maple" },
        { id: "tree_w1", type: "tree", position: { x: -55, z: 55 }, style: "willow" },
        { id: "tree_w2", type: "tree", position: { x: -45, z: 45 }, style: "willow" },
        { id: "tree_w3", type: "tree", position: { x: -35, z: 35 }, style: "willow" },
        { id: "tree_w4", type: "tree", position: { x: -25, z: 25 }, style: "willow" },
        { id: "tree_w5", type: "tree", position: { x: 65, z: 50 }, style: "willow" }
    ],
    benches: [
        { id: "bench_1", position: { x: -40, z: -45 } },
        { id: "bench_2", position: { x: -50, z: -15 } },
        { id: "bench_3", position: { x: 50, z: 5 } },
        { id: "bench_4", position: { x: 68, z: 35 } },
        { id: "bench_5", position: { x: 32, z: 30 } },
        { id: "bench_6", position: { x: 48, z: 30 } },
        { id: "bench_7", position: { x: 32, z: 40 } },
        { id: "bench_8", position: { x: 48, z: 40 } },
        { id: "bench_9", position: { x: 36, z: 35 } },
        { id: "bench_10", position: { x: 44, z: 35 } }
    ]
};

// 地标
export const LANDMARKS = {
    FOUNTAIN: { x: 55, z: 35 },
    TOWN_HALL: { x: 50, z: 20 },
    SKILL_ACADEMY: { x: -45, z: -50 },
    LIBRARY: { x: 65, z: 5 },
    WORKSHOP: { x: 70, z: 25 },
    GALLERY: { x: 75, z: 45 },
    ARCHIVE: { x: 60, z: 55 },
    MESSAGE_STATION: { x: 55, z: 10 },
    REPUTATION_TOWER: { x: 45, z: 60 },
    DATA_CENTER: { x: 35, z: 50 },
    TASK_CENTER: { x: 65, z: 65 }
};

// 生成点
export const SPAWN_POINTS = [
    { id: "spawn_fountain", name: "喷泉广场", position: { x: 40, z: 35 }, radius: 10 },
    { id: "spawn_library", name: "图书馆前", position: { x: 0, z: 44 }, radius: 8 },
    { id: "spawn_plaza", name: "市民中心", position: { x: 40, z: 23 }, radius: 10 },
    { id: "spawn_skill", name: "技能学院", position: { x: -30, z: -28 }, radius: 8 },
    { id: "spawn_farm", name: "农田", position: { x: -82, z: -32 }, radius: 15 }
];

// 动物初始位置
export const ANIMALS = {
    cows: [
        { x: -85, z: -40 },
        { x: -78, z: -50 },
        { x: -88, z: -20 },
        { x: -72, z: -35 }
    ],
    dogs: [
        { x: -50, z: -30 },
        { x: -55, z: -45 },
        { x: -40, z: 0 },
        { x: 55, z: -50 },
        { x: 45, z: -60 }
    ]
};

// 世界元数据
export const META = {
    name: "智体城",
    version: "3.0",
    worldSize: 200,
    center: { x: 0, z: 0 },
    bounds: { minX: -100, maxX: 100, minZ: -100, maxZ: 100 }
};

// 导出所有数据
export default {
    META,
    BUILDING_TEMPLATES,
    BUILDINGS,
    HILLS,
    WATER_BODIES,
    ROADS,
    BRIDGES,
    DECORATIONS,
    LANDMARKS,
    SPAWN_POINTS,
    ANIMALS
};
