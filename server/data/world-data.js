/**
 * WorldData - 智体城世界数据 v3.0
 * 
 * 【核心原则】服务端存储所有世界数据，供渲染和碰撞检测使用
 * - 位置、尺寸、类型、ID - 服务端存储
 * - 颜色、材质、特效、网格 - 客户端从模板读取渲染
 * 
 * 基于 client/objects/ 和 world-builder.js 整理
 * 坐标系统: 以(0,0)为中心，200x200世界
 */

module.exports = {
    meta: {
        name: "智体城",
        version: "3.0",
        width: 200,
        height: 200,
        worldSize: 200,
        center: { x: 0, z: 0 },
        maxAgents: 100
    },

    /**
     * 地形区域定义
     */
    terrainZones: [
        { id: "zone_downtown", name: "市中心商业区", type: "commercial", bounds: { minX: 25, maxX: 55, minZ: 20, maxZ: 50 }, walkable: true, buildable: false },
        { id: "zone_plaza", name: "市民广场", type: "park", bounds: { minX: 25, maxX: 55, minZ: 20, maxZ: 50 }, walkable: true, buildable: false },
        { id: "zone_suburban", name: "郊区住宅区", type: "residential", bounds: { minX: -65, maxX: -40, minZ: -65, maxZ: 35 }, walkable: true, buildable: true },
        { id: "zone_farm", name: "农田", type: "farm", bounds: { minX: -95, maxX: -70, minZ: -60, maxZ: -5 }, walkable: true, buildable: false },
        { id: "zone_mountain", name: "山脉", type: "mountain", bounds: { minX: -90, maxX: 95, minZ: -98, maxZ: -80 }, walkable: false, buildable: false },
        { id: "zone_lake", name: "北海湖", type: "water", bounds: { minX: -45, maxX: 65, minZ: -97, maxZ: -53 }, walkable: false, buildable: false },
        { id: "zone_ocean", name: "海洋", type: "water", bounds: { minX: 85, maxX: 95, minZ: 200, maxZ: 210 }, walkable: false, buildable: false }
    ],

    /**
     * 道路数据
     */
    roads: [
        { id: "road_ns_1", name: "N-S道路1", type: "main", start: { x: 15, z: -10 }, end: { x: 15, z: 80 }, width: 4 },
        { id: "road_ns_2", name: "N-S道路2", type: "main", start: { x: 40, z: -10 }, end: { x: 40, z: 80 }, width: 4 },
        { id: "road_ns_3", name: "N-S道路3", type: "main", start: { x: 65, z: -10 }, end: { x: 65, z: 80 }, width: 4 },
        { id: "road_ew_1", name: "E-W道路1", type: "main", start: { x: -10, z: 5 }, end: { x: 85, z: 5 }, width: 4 },
        { id: "road_ew_2", name: "E-W道路2", type: "main", start: { x: -10, z: 35 }, end: { x: 85, z: 35 }, width: 4 },
        { id: "road_ew_3", name: "E-W道路3", type: "main", start: { x: -10, z: 65 }, end: { x: 85, z: 65 }, width: 4 },
        { id: "road_scenic", name: "景观大道", type: "scenic", start: { x: -40, z: 87.5 }, end: { x: 100, z: 87.5 }, width: 5 },
        { id: "road_suburban_1", name: "郊区道路1", type: "suburban", start: { x: -50, z: -55 }, end: { x: -50, z: -45 }, width: 3 },
        { id: "road_suburban_2", name: "郊区道路2", type: "suburban", start: { x: -40, z: -55 }, end: { x: -40, z: -45 }, width: 3 }
    ],

    /**
     * 桥梁数据
     */
    bridges: [
        { id: "bridge_1", name: "中心桥1", position: { x: -12.5, z: -5 }, size: { width: 5, height: 1, depth: 15.8 }, type: "simple" },
        { id: "bridge_2", name: "中心桥2", position: { x: -14.5, z: 35 }, size: { width: 5, height: 1, depth: 15.8 }, type: "simple" },
        { id: "bridge_3", name: "中心桥3", position: { x: -17.5, z: 65 }, size: { width: 5, height: 1, depth: 15.8 }, type: "simple" }
    ],

    /**
     * 建筑模板
     */
    buildingTemplates: {
        skillAcademy: { type: "skillAcademy", name: "技能学院", defaultSize: { width: 8, height: 25.5, depth: 8 }, floors: 5, buildable: true, collisionRadius: 13 },
        library: { type: "library", name: "图书馆", defaultSize: { width: 14, height: 14.5, depth: 12 }, floors: 3, buildable: true, collisionRadius: 7 },
        workshop: { type: "workshop", name: "工坊", defaultSize: { width: 14, height: 17, depth: 10 }, floors: 1, buildable: true, collisionRadius: 7 },
        messageStation: { type: "messageStation", name: "消息驿站", defaultSize: { width: 6, height: 20.5, depth: 6 }, floors: 1, buildable: true, collisionRadius: 6 },
        artGallery: { type: "artGallery", name: "艺术展厅", defaultSize: { width: 14, height: 10, depth: 10 }, floors: 1, buildable: true, collisionRadius: 9 },
        archive: { type: "archive", name: "档案馆", defaultSize: { width: 14, height: 15, depth: 12 }, floors: 3, buildable: true, collisionRadius: 8 },
        taskCenter: { type: "taskCenter", name: "任务中心", defaultSize: { width: 10, height: 15, depth: 8 }, floors: 4, buildable: true, collisionRadius: 12 },
        dataCenter: { type: "dataCenter", name: "数据中心", defaultSize: { width: 14, height: 10.5, depth: 10 }, floors: 2, buildable: true, collisionRadius: 7 },
        reputationTower: { type: "reputationTower", name: "声誉塔", defaultSize: { width: 7, height: 35, depth: 7 }, floors: 5, buildable: true, collisionRadius: 7 },
        civicCenter: { type: "civicCenter", name: "市民中心", defaultSize: { width: 10, height: 14, depth: 10 }, floors: 3, buildable: true, collisionRadius: 5 },
        suburbanHouse: { type: "suburbanHouse", name: "郊区别墅", defaultSize: { width: 6, height: 8, depth: 5 }, floors: 2, buildable: true, collisionRadius: 4 },
        diverseUrban: { type: "diverseUrban", name: "多元城市建筑", defaultSize: { width: 6, height: 14, depth: 5 }, floors: 2, buildable: true, collisionRadius: 4 },
        fountain: { type: "fountain", name: "喷泉", defaultSize: { width: 12, height: 7, depth: 12 }, floors: 1, buildable: false, collisionRadius: 6 },
        flagpole: { type: "flagpole", name: "旗杆", defaultSize: { width: 0.3, height: 8, depth: 0.3 }, floors: 1, buildable: false, collisionRadius: 0.5 }
    },

    /**
     * 建筑实例 (MAP_ELEMENTS.md 坐标)
     */
    buildings: [
        { id: "bld_skillAcademy", type: "skillAcademy", name: "技能学院", position: { x: -30, z: -35 }, size: { width: 8, height: 25.5, depth: 8 } },
        { id: "bld_library", type: "library", name: "图书馆", position: { x: 0, z: 50 }, size: { width: 14, height: 14.5, depth: 12 } },
        { id: "bld_workshop", type: "workshop", name: "工坊", position: { x: 27, z: 74 }, size: { width: 14, height: 17, depth: 10 } },
        { id: "bld_messageStation", type: "messageStation", name: "消息驿站", position: { x: 78, z: 50 }, size: { width: 6, height: 20.5, depth: 6 } },
        { id: "bld_artGallery", type: "artGallery", name: "艺术展厅", position: { x: 0, z: 75 }, size: { width: 14, height: 10, depth: 10 } },
        { id: "bld_archive", type: "archive", name: "档案馆", position: { x: 50, z: 72 }, size: { width: 14, height: 15, depth: 12 } },
        { id: "bld_taskCenter", type: "taskCenter", name: "任务中心", position: { x: 74, z: 72 }, size: { width: 10, height: 15, depth: 8 } },
        { id: "bld_dataCenter", type: "dataCenter", name: "数据中心", position: { x: 0, z: 20 }, size: { width: 14, height: 10.5, depth: 10 } },
        { id: "bld_reputationTower", type: "reputationTower", name: "声誉塔", position: { x: -75, z: 72 }, size: { width: 7, height: 35, depth: 7 } },
        { id: "bld_civicNorth", type: "civicCenter", name: "市民中心(北)", position: { x: 40, z: 23 }, facing: "north", size: { width: 10, height: 14, depth: 10 } },
        { id: "bld_civicEast", type: "civicCenter", name: "市民中心(东)", position: { x: 25, z: 42 }, facing: "east", size: { width: 10, height: 14, depth: 10 } },
        { id: "bld_civicWest", type: "civicCenter", name: "市民中心(西)", position: { x: 55, z: 42 }, facing: "west", size: { width: 10, height: 14, depth: 10 } },
        { id: "bld_plazaFountain", type: "fountain", name: "广场喷泉", position: { x: 40, z: 40 }, size: { width: 12, height: 7, depth: 12 } },
        { id: "bld_flagpole1", type: "flagpole", name: "旗杆1", position: { x: 30, z: 23 }, size: { width: 0.3, height: 8, depth: 0.3 } },
        { id: "bld_flagpole2", type: "flagpole", name: "旗杆2", position: { x: 50, z: 23 }, size: { width: 0.3, height: 8, depth: 0.3 } },
        { id: "bld_urban_1", type: "diverseUrban", name: "城市建筑1", position: { x: 5, z: -2 }, size: { width: 6, height: 14, depth: 5 } },
        { id: "bld_urban_2", type: "diverseUrban", name: "城市建筑2", position: { x: 80, z: 28 }, size: { width: 6, height: 14, depth: 5 } },
        { id: "bld_urban_3", type: "diverseUrban", name: "城市建筑3", position: { x: 22, z: -2 }, size: { width: 6, height: 14, depth: 5 } },
        { id: "bld_urban_4", type: "diverseUrban", name: "城市建筑4", position: { x: 47, z: -2 }, size: { width: 6, height: 14, depth: 5 } },
        { id: "bld_urban_5", type: "diverseUrban", name: "城市建筑5", position: { x: 72, z: 28 }, size: { width: 6, height: 14, depth: 5 } },
        { id: "bld_urban_6", type: "diverseUrban", name: "城市建筑6", position: { x: 32, z: -2 }, size: { width: 6, height: 14, depth: 5 } },
        { id: "bld_urban_7", type: "diverseUrban", name: "城市建筑7", position: { x: 58, z: -2 }, size: { width: 6, height: 14, depth: 5 } },
        { id: "bld_urban_8", type: "diverseUrban", name: "城市建筑8", position: { x: 73, z: -2 }, size: { width: 6, height: 14, depth: 5 } },
        { id: "bld_urban_9", type: "diverseUrban", name: "城市建筑9", position: { x: 79, z: 10 }, size: { width: 6, height: 14, depth: 5 } },
        { id: "bld_urban_10", type: "diverseUrban", name: "城市建筑10", position: { x: 71, z: 10 }, size: { width: 6, height: 14, depth: 5 } },
        { id: "bld_nw_house_1", type: "suburbanHouse", name: "郊区别墅1", position: { x: -57, z: -56 }, size: { width: 6, height: 8, depth: 5 } },
        { id: "bld_nw_house_2", type: "suburbanHouse", name: "郊区别墅2", position: { x: -55, z: -40 }, size: { width: 6, height: 8, depth: 5 } },
        { id: "bld_nw_house_3", type: "suburbanHouse", name: "郊区别墅3", position: { x: -57, z: -25 }, size: { width: 6, height: 8, depth: 5 } },
        { id: "bld_nw_house_4", type: "suburbanHouse", name: "郊区别墅4", position: { x: -53, z: -12 }, size: { width: 6, height: 8, depth: 5 } },
        { id: "bld_nw_house_5", type: "suburbanHouse", name: "郊区别墅5", position: { x: -50, z: 5 }, size: { width: 6, height: 8, depth: 5 } },
        { id: "bld_nw_house_6", type: "suburbanHouse", name: "郊区别墅6", position: { x: -46, z: -50 }, size: { width: 6, height: 8, depth: 5 } },
        { id: "bld_nw_house_7", type: "suburbanHouse", name: "郊区别墅7", position: { x: -48, z: -30 }, size: { width: 6, height: 8, depth: 5 } },
        { id: "bld_nw_house_8", type: "suburbanHouse", name: "郊区别墅8", position: { x: -44, z: -13 }, size: { width: 6, height: 8, depth: 5 } },
        { id: "bld_nw_house_9", type: "suburbanHouse", name: "郊区别墅9", position: { x: -46, z: 20 }, size: { width: 6, height: 8, depth: 5 } },
        { id: "bld_lake_house_1", type: "suburbanHouse", name: "湖边别墅1", position: { x: 62, z: -45 }, size: { width: 6, height: 8, depth: 5 } },
        { id: "bld_lake_house_2", type: "suburbanHouse", name: "湖边别墅2", position: { x: 65, z: -55 }, size: { width: 6, height: 8, depth: 5 } },
        { id: "bld_lake_house_3", type: "suburbanHouse", name: "湖边别墅3", position: { x: 60, z: -65 }, size: { width: 6, height: 8, depth: 5 } },
        { id: "bld_lake_house_4", type: "suburbanHouse", name: "湖边别墅4", position: { x: 55, z: -75 }, size: { width: 6, height: 8, depth: 5 } },
        { id: "bld_lake_house_5", type: "suburbanHouse", name: "湖边别墅5", position: { x: 40, z: -45 }, size: { width: 6, height: 8, depth: 5 } }
    ],

    /**
     * 装饰物模板
     */
    decorationTemplates: {
        tree: { type: "tree", name: "树木", defaultSize: { radius: 1.5, height: 8 }, styles: ["oak", "pine", "willow", "maple"] },
        flower: { type: "flower", name: "花卉", defaultSize: { radius: 0.3, height: 0.5 }, styles: ["rose", "tulip", "sunflower", "lotus"] },
        bench: { type: "bench", name: "长椅", defaultSize: { width: 2, height: 1, depth: 0.6 }, styles: ["wooden", "metal", "modern"] },
        lamp: { type: "lamp", name: "路灯", defaultSize: { radius: 0.2, height: 4 }, styles: ["classic", "modern", "street"] },
        rock: { type: "rock", name: "岩石", defaultSize: { radius: 0.8, height: 0.6 }, styles: ["boulder", "pebble", "cliff"] },
        fountain: { type: "fountain", name: "喷泉", defaultSize: { radius: 3, height: 2 }, styles: ["modern", "classic", "musical"] }
    },

    /**
     * 装饰物实例
     */
    decorations: {
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
        flowers: [
            { id: "flower_1", type: "flower", position: { x: 50, z: -80 }, style: "rose" },
            { id: "flower_2", type: "flower", position: { x: 55, z: -75 }, style: "tulip" }
        ],
        benches: [
            { id: "bench_1", type: "bench", position: { x: -40, z: -45 }, style: "wooden" },
            { id: "bench_2", type: "bench", position: { x: -50, z: -15 }, style: "wooden" },
            { id: "bench_3", type: "bench", position: { x: 50, z: 5 }, style: "modern" },
            { id: "bench_4", type: "bench", position: { x: 68, z: 35 }, style: "wooden" },
            { id: "bench_5", type: "bench", position: { x: 32, z: 30 }, style: "wooden" },
            { id: "bench_6", type: "bench", position: { x: 48, z: 30 }, style: "wooden" },
            { id: "bench_7", type: "bench", position: { x: 32, z: 40 }, style: "wooden" },
            { id: "bench_8", type: "bench", position: { x: 48, z: 40 }, style: "wooden" },
            { id: "bench_9", type: "bench", position: { x: 36, z: 35 }, style: "metal" },
            { id: "bench_10", type: "bench", position: { x: 44, z: 35 }, style: "metal" }
        ],
        lamps: [
            { id: "lamp_1", type: "lamp", position: { x: 15, z: 10 }, style: "street" },
            { id: "lamp_2", type: "lamp", position: { x: 15, z: 25 }, style: "street" },
            { id: "lamp_3", type: "lamp", position: { x: 15, z: 40 }, style: "street" },
            { id: "lamp_4", type: "lamp", position: { x: 15, z: 55 }, style: "street" },
            { id: "lamp_5", type: "lamp", position: { x: 40, z: 10 }, style: "street" },
            { id: "lamp_6", type: "lamp", position: { x: 40, z: 25 }, style: "street" },
            { id: "lamp_7", type: "lamp", position: { x: 40, z: 40 }, style: "street" },
            { id: "lamp_8", type: "lamp", position: { x: 40, z: 55 }, style: "street" },
            { id: "lamp_9", type: "lamp", position: { x: 65, z: 10 }, style: "street" },
            { id: "lamp_10", type: "lamp", position: { x: 65, z: 25 }, style: "street" },
            { id: "lamp_11", type: "lamp", position: { x: 65, z: 40 }, style: "street" },
            { id: "lamp_12", type: "lamp", position: { x: 65, z: 55 }, style: "street" }
        ],
        rocks: [
            { id: "rock_1", type: "rock", position: { x: -80, z: -80 }, style: "boulder" }
        ],
        fountains: [
            { id: "fountain_plaza", type: "fountain", position: { x: 40, z: 40 }, style: "modern" }
        ]
    },

    /**
     * 地形高度数据
     */
    terrain: {
        type: "flat",
        defaultHeight: 0,
        heightVariations: [
            { id: "H1", position: { x: -73, z: -92 }, radius: 28, height: 32 },
            { id: "H2", position: { x: -53, z: -90 }, radius: 24, height: 28 },
            { id: "H3", position: { x: -33, z: -92 }, radius: 22, height: 24 },
            { id: "H4", position: { x: -13, z: -90 }, radius: 20, height: 22 },
            { id: "H5", position: { x: 25, z: -92 }, radius: 18, height: 20 },
            { id: "H6", position: { x: 40, z: -90 }, radius: 16, height: 16 },
            { id: "H7", position: { x: 60, z: -88 }, radius: 14, height: 12 },
            { id: "H8", position: { x: 80, z: -85 }, radius: 12, height: 8 },
            { id: "H9", position: { x: 90, z: -82 }, radius: 10, height: 6 }
        ],
        waterBodies: [
            { id: "lake_north", position: { x: 10, z: -75 }, radiusX: 55, radiusZ: 22, depth: 1 },
            { id: "river_main", points: [[-10,-55],[-10,-20],[-12,0],[-15,20],[-18,40],[-20,55],[-20,91]], width: 8 }
        ]
    },

    /**
     * 智能体生成点
     */
    spawnPoints: [
        { id: "spawn_fountain", name: "喷泉广场", position: { x: 40, z: 35 }, radius: 10 },
        { id: "spawn_library", name: "图书馆前", position: { x: 0, z: 44 }, radius: 8 },
        { id: "spawn_plaza", name: "市民中心", position: { x: 40, z: 23 }, radius: 10 },
        { id: "spawn_skill", name: "技能学院", position: { x: -30, z: -28 }, radius: 8 },
        { id: "spawn_farm", name: "农田", position: { x: -82, z: -32 }, radius: 15 }
    ],

    /**
     * 特殊区域
     */
    specialZones: [
        { id: "zone_fountain", name: "喷泉广场", position: { x: 40, z: 35 }, radius: 15, type: "meeting_point" },
        { id: "zone_art", name: "艺术展厅", position: { x: 0, z: 75 }, radius: 12, type: "gallery" }
    ],

    /**
     * 地标位置
     */
    landmarks: {
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
    }
};

// ============================================================
// 工具函数（供 event-dispatcher 等模块使用）
// ============================================================

/**
 * 点到线段的距离
 */
function pointToSegmentDistance(px, pz, x1, z1, x2, z2) {
    const dx = x2 - x1;
    const dz = z2 - z1;
    const len2 = dx * dx + dz * dz;
    if (len2 === 0) return Math.sqrt((px - x1) ** 2 + (pz - z1) ** 2);
    const t = Math.max(0, Math.min(1, ((px - x1) * dx + (pz - z1) * dz) / len2));
    const nearX = x1 + t * dx;
    const nearZ = z1 + t * dz;
    return Math.sqrt((px - nearX) ** 2 + (pz - nearZ) ** 2);
}

/**
 * 检查点是否在道路上
 */
function isOnRoad(x, z, roadWidth = 2) {
    // N-S 垂直道路
    for (const road of module.exports.roads) {
        if (road.type === 'main') {
            // N-S 道路: x 是常量，z 是范围
            if (road.start.x === road.end.x) {
                if (Math.abs(x - road.start.x) <= roadWidth &&
                    z >= Math.min(road.start.z, road.end.z) &&
                    z <= Math.max(road.start.z, road.end.z)) {
                    return true;
                }
            }
            // E-W 道路: z 是常量，x 是范围
            if (road.start.z === road.end.z) {
                if (Math.abs(z - road.start.z) <= roadWidth &&
                    x >= Math.min(road.start.x, road.end.x) &&
                    x <= Math.max(road.start.x, road.end.x)) {
                    return true;
                }
            }
        }
    }
    // 沿海景观大道（折线）
    const scenic = module.exports.roads.find(r => r.id === 'road_scenic');
    if (scenic) {
        const points = [];
        for (let i = 0; i <= Math.abs(scenic.end.x - scenic.start.x) / 20; i++) {
            points.push({
                x: scenic.start.x + (scenic.end.x - scenic.start.x) * (i / (Math.abs(scenic.end.x - scenic.start.x) / 20)),
                z: scenic.start.z
            });
        }
        for (let i = 0; i < points.length - 1; i++) {
            const dist = pointToSegmentDistance(x, z, points[i].x, points[i].z, points[i + 1].x, points[i + 1].z);
            if (dist <= roadWidth) return true;
        }
    }
    return false;
}

/**
 * 检查坐标是否可行走（不在水/山/建筑上）
 */
function isValidWalkPosition(x, z) {
    const d = module.exports;
    
    // 世界边界
    if (Math.abs(x) > 100 || Math.abs(z) > 100) return false;
    
    // 海洋 (南边界外)
    if (z > 85) return false;
    
    // 北海湖 (椭圆形)
    const lake = d.terrain.waterBodies.find(w => w.id === 'lake_north');
    if (lake) {
        const lakeDistX = (x - lake.position.x) / lake.radiusX;
        const lakeDistZ = (z - lake.position.z) / lake.radiusZ;
        if (lakeDistX * lakeDistX + lakeDistZ * lakeDistZ < 1) return false;
    }
    
    // 河流（折线判断）
    const river = d.terrain.waterBodies.find(w => w.id === 'river_main');
    if (river) {
        for (let i = 0; i < river.points.length - 1; i++) {
            const p1 = river.points[i];
            const p2 = river.points[i + 1];
            const dist = pointToSegmentDistance(x, z, p1[0], p1[1], p2[0], p2[1]);
            if (dist < river.width / 2) return false;
        }
    }
    
    // 山脉
    for (const hill of d.terrain.heightVariations) {
        const dist = Math.sqrt((x - hill.position.x) ** 2 + (z - hill.position.z) ** 2);
        if (dist < hill.radius) return false;
    }
    
    // 建筑
    for (const b of d.buildings) {
        const halfW = (b.size?.width || 10) / 2 + 1;
        const halfD = (b.size?.depth || 10) / 2 + 1;
        if (x >= b.position.x - halfW && x <= b.position.x + halfW &&
            z >= b.position.z - halfD && z <= b.position.z + halfD) return false;
    }
    
    return true;
}

/**
 * 找安全的生成位置
 */
function findSafeSpawnPosition() {
    const safeZones = [
        { center: { x: 40, z: 35 }, radius: 10 },  // 喷泉广场
        { center: { x: 40, z: 23 }, radius: 10 },  // 市民中心
        { center: { x: -10, z: 35 }, radius: 8 },   // 西侧
        { center: { x: 0, z: 44 }, radius: 8 },    // 图书馆北侧
    ];
    
    for (const zone of safeZones) {
        for (let attempt = 0; attempt < 10; attempt++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = Math.random() * zone.radius;
            const x = zone.center.x + Math.cos(angle) * dist;
            const z = zone.center.z + Math.sin(angle) * dist;
            if (isValidWalkPosition(x, z)) {
                return { x, z };
            }
        }
    }
    
    return { x: 40, z: 35 }; // 默认返回喷泉广场
}

/**
 * 找最近的路上点
 */
function snapToRoad(x, z, roadWidth = 2) {
    let bestDist = Infinity;
    let bestPoint = { x, z };
    
    for (const road of module.exports.roads) {
        if (road.start.x === road.end.x) {
            // N-S 道路
            if (z >= Math.min(road.start.z, road.end.z) && z <= Math.max(road.start.z, road.end.z)) {
                const dist = Math.abs(x - road.start.x);
                if (dist < bestDist) {
                    bestDist = dist;
                    bestPoint = { x: road.start.x, z };
                }
            }
        }
        if (road.start.z === road.end.z) {
            // E-W 道路
            if (x >= Math.min(road.start.x, road.end.x) && x <= Math.max(road.start.x, road.end.x)) {
                const dist = Math.abs(z - road.start.z);
                if (dist < bestDist) {
                    bestDist = dist;
                    bestPoint = { x, z: road.start.z };
                }
            }
        }
    }
    
    return bestPoint;
}

/**
 * 获取道路路径点序列（分步移动）
 * 用于智能体沿道路移动
 */
function getRoadPath(startX, startZ, endX, endZ, maxSteps = 20) {
    const d = module.exports;
    const path = [];
    const startOnRoad = d.isOnRoad(startX, startZ);
    const endOnRoad = d.isOnRoad(endX, endZ);
    
    let sx = startX, sz = startZ;
    
    // 如果起点不在道路上，先snap到最近道路
    if (!startOnRoad) {
        const snapped = d.snapToRoad(startX, startZ);
        sx = snapped.x;
        sz = snapped.z;
        path.push({ x: sx, z: sz, type: 'snap-start' });
    } else {
        path.push({ x: sx, z: sz, type: 'start' });
    }
    
    // 计算路径段
    const steps = [];
    
    // 水平移动到目标x
    if (Math.abs(sx - endX) > 0.5) {
        const step = sx < endX ? 1 : -1;
        // 找最近的横向道路
        let roadZ = sz;
        for (const road of d.roads) {
            if (road.start.z === road.end.z && Math.abs(road.start.z - sz) < Math.abs(roadZ - sz) && endX >= Math.min(road.start.x, road.end.x) && endX <= Math.max(road.start.x, road.end.x)) {
                roadZ = road.start.z;
            }
        }
        for (let x = sx + step; (step > 0 ? x <= endX : x >= endX); x += step) {
            steps.push({ x, z: roadZ, type: 'horizontal' });
        }
    }
    
    // 纵向移动到目标z
    if (Math.abs(sz - endZ) > 0.5) {
        const step = sz < endZ ? 1 : -1;
        // 找最近的纵向道路
        let roadX = endX;
        for (const road of d.roads) {
            if (road.start.x === road.end.x && Math.abs(road.start.x - endX) < Math.abs(roadX - endX) && endZ >= Math.min(road.start.z, road.end.z) && endZ <= Math.max(road.start.z, road.end.z)) {
                roadX = road.start.x;
            }
        }
        for (let z = sz + step; (step > 0 ? z <= endZ : z >= endZ); z += step) {
            steps.push({ x: roadX, z, type: 'vertical' });
        }
    }
    
    // 去重并添加到路径
    for (const s of steps) {
        if (!path.some(p => Math.abs(p.x - s.x) < 0.5 && Math.abs(p.z - s.z) < 0.5)) {
            path.push(s);
        }
    }
    
    // 如果终点不在道路上，添加终点snap
    if (!endOnRoad && path.length < maxSteps) {
        const snapped = d.snapToRoad(endX, endZ);
        if (!path.some(p => Math.abs(p.x - snapped.x) < 0.5 && Math.abs(p.z - snapped.z) < 0.5)) {
            path.push({ x: snapped.x, z: snapped.z, type: 'snap-end' });
        }
    }
    
    return path.slice(0, maxSteps);
}

// 导出工具函数
module.exports.isOnRoad = isOnRoad;
module.exports.isValidWalkPosition = isValidWalkPosition;
module.exports.findSafeSpawnPosition = findSafeSpawnPosition;
module.exports.snapToRoad = snapToRoad;
module.exports.pointToSegmentDistance = pointToSegmentDistance;
module.exports.getRoadPath = getRoadPath;
