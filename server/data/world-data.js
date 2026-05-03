/**
 * WorldData - 智体城世界数据
 * 
 * 【核心原则】服务端只存储纯数据，不含任何渲染信息
 * - 位置、尺寸、类型、ID - 服务端存储
 * - 颜色、材质、特效、网格 - 客户端处理
 * 
 * 所有数据都应该可以从这个文件导出，供服务端和客户端共享
 */

module.exports = {
    /**
     * 世界元数据
     */
    meta: {
        name: "智体城",
        version: "1.0",
        width: 500,
        height: 500,
        maxAgents: 100,
        center: { x: 250, z: 250 },
        description: "一个去中心化的智能体社会平台"
    },

    /**
     * 地形区域定义
     * 服务端用于碰撞检测和移动验证
     */
    terrainZones: [
        // 中心商业区
        {
            id: "zone_downtown",
            name: "市中心商业区",
            type: "commercial",
            bounds: { minX: 100, maxX: 400, minZ: 100, maxZ: 400 },
            walkable: true,
            buildable: false,
            description: "高楼林立的商业中心"
        },
        // 公园区
        {
            id: "zone_park",
            name: "中央公园",
            type: "park",
            bounds: { minX: 350, maxZ: 350, maxX: 480, maxZ: 480 },
            walkable: true,
            buildable: false,
            description: "绿树成荫的休闲公园"
        },
        // 北部居住区
        {
            id: "zone_north",
            name: "北部居住区",
            type: "residential",
            bounds: { minX: 0, maxX: 500, minZ: 0, maxZ: 80 },
            walkable: true,
            buildable: true,
            description: "宁静的住宅小区"
        },
        // 西部工业区
        {
            id: "zone_industrial",
            name: "西部工业区",
            type: "industrial",
            bounds: { minX: 0, maxX: 80, minZ: 200, maxZ: 400 },
            walkable: true,
            buildable: true,
            description: "工业厂房区域"
        }
    ],

    /**
     * 道路数据
     * 服务端用于验证移动路径
     */
    roads: [
        // 东西向主干道
        {
            id: "road_eastwest_1",
            name: "东西向主干道",
            type: "main",
            start: { x: 0, z: 200 },
            end: { x: 500, z: 200 },
            width: 15,
            direction: "horizontal"
        },
        {
            id: "road_eastwest_2",
            name: "东西向次干道",
            type: "secondary",
            start: { x: 0, z: 300 },
            end: { x: 500, z: 300 },
            width: 12,
            direction: "horizontal"
        },
        // 南北向主干道
        {
            id: "road_northsouth_1",
            name: "南北向主干道",
            type: "main",
            start: { x: 200, z: 0 },
            end: { x: 200, z: 500 },
            width: 15,
            direction: "vertical"
        },
        {
            id: "road_northsouth_2",
            name: "南北向次干道",
            type: "secondary",
            start: { x: 350, z: 0 },
            end: { x: 350, z: 500 },
            width: 12,
            direction: "vertical"
        },
        // 环城路
        {
            id: "road_ring",
            name: "环城路",
            type: "ring",
            center: { x: 250, z: 250 },
            radius: 200,
            width: 10,
            direction: "ring"
        }
    ],

    /**
     * 桥梁数据
     */
    bridges: [
        {
            id: "bridge_1",
            name: "中心桥",
            position: { x: 200, z: 200 },
            size: { width: 15, height: 1, depth: 15 },
            connects: ["road_eastwest_1", "road_northsouth_1"],
            type: "stone"
        },
        {
            id: "bridge_2",
            name: "公园桥",
            position: { x: 350, z: 350 },
            size: { width: 12, height: 1, depth: 12 },
            connects: ["road_ring", "zone_park"],
            type: "wood"
        }
    ],

    /**
     * 建筑模板
     * 服务端用于验证建筑数据和计算碰撞边界
     */
    buildingTemplates: {
        skyscraper: {
            type: "skyscraper",
            name: "摩天大楼",
            defaultSize: { width: 25, height: 150, depth: 25 },
            floors: 40,
            styles: ["modern", "glass", "classic"],
            buildable: true,
            collisionRadius: 15
        },
        office: {
            type: "office",
            name: "写字楼",
            defaultSize: { width: 30, height: 60, depth: 20 },
            floors: 15,
            styles: ["modern", "glass"],
            buildable: true,
            collisionRadius: 18
        },
        house: {
            type: "house",
            name: "独栋别墅",
            defaultSize: { width: 15, height: 10, depth: 12 },
            floors: 2,
            styles: ["villa", "modern", "traditional"],
            buildable: true,
            collisionRadius: 10
        },
        apartment: {
            type: "apartment",
            name: "公寓楼",
            defaultSize: { width: 20, height: 30, depth: 15 },
            floors: 8,
            styles: ["modern", "residential"],
            buildable: true,
            collisionRadius: 12
        },
        shop: {
            type: "shop",
            name: "商店",
            defaultSize: { width: 12, height: 8, depth: 15 },
            floors: 1,
            styles: ["storefront", "mall", "market"],
            buildable: true,
            collisionRadius: 8
        },
        factory: {
            type: "factory",
            name: "工厂",
            defaultSize: { width: 40, height: 15, depth: 30 },
            floors: 1,
            styles: ["industrial", "modern"],
            buildable: true,
            collisionRadius: 25
        },
        warehouse: {
            type: "warehouse",
            name: "仓库",
            defaultSize: { width: 35, height: 12, depth: 25 },
            floors: 1,
            styles: ["industrial", "modern"],
            buildable: true,
            collisionRadius: 20
        },
        park设施: {
            type: "park设施",
            name: "公园设施",
            defaultSize: { width: 10, height: 6, depth: 10 },
            floors: 1,
            styles: ["kiosk", "restroom", "booth"],
            buildable: false,
            collisionRadius: 6
        },
        tower: {
            type: "tower",
            name: "塔楼",
            defaultSize: { width: 15, height: 80, depth: 15 },
            floors: 20,
            styles: ["medieval", "observation", "bell"],
            buildable: true,
            collisionRadius: 10
        }
    },

    /**
     * 默认建筑实例
     * 位置、尺寸、类型 - 服务端数据
     * 颜色、材质 - 客户端渲染
     */
    buildings: [
        // 市中心摩天大楼群
        { id: "bld_001", type: "skyscraper", name: "智体大厦", position: { x: 150, z: 150 }, size: { width: 30, height: 200, depth: 30 }, floors: 55, style: "modern" },
        { id: "bld_002", type: "skyscraper", name: "科技中心", position: { x: 220, z: 150 }, size: { width: 25, height: 150, depth: 25 }, floors: 40, style: "glass" },
        { id: "bld_003", type: "skyscraper", name: "金融中心", position: { x: 290, z: 150 }, size: { width: 28, height: 180, depth: 28 }, floors: 50, style: "classic" },
        { id: "bld_004", type: "office", name: "创业大厦", position: { x: 150, z: 220 }, size: { width: 35, height: 80, depth: 20 }, floors: 20, style: "modern" },
        { id: "bld_005", type: "office", name: "创新园", position: { x: 220, z: 220 }, size: { width: 30, height: 60, depth: 25 }, floors: 15, style: "glass" },
        { id: "bld_006", type: "office", name: "商务中心", position: { x: 290, z: 220 }, size: { width: 32, height: 70, depth: 22 }, floors: 18, style: "modern" },
        { id: "bld_007", type: "skyscraper", name: "云端大厦", position: { x: 350, z: 180 }, size: { width: 22, height: 160, depth: 22 }, floors: 45, style: "glass" },
        { id: "bld_008", type: "skyscraper", name: "星际塔", position: { x: 350, z: 250 }, size: { width: 25, height: 190, depth: 25 }, floors: 52, style: "modern" },
        
        // 北部居住区
        { id: "bld_101", type: "house", name: "花园洋房1", position: { x: 50, z: 30 }, size: { width: 12, height: 9, depth: 10 }, floors: 2, style: "villa" },
        { id: "bld_102", type: "house", name: "花园洋房2", position: { x: 80, z: 30 }, size: { width: 12, height: 9, depth: 10 }, floors: 2, style: "villa" },
        { id: "bld_103", type: "house", name: "花园洋房3", position: { x: 110, z: 30 }, size: { width: 12, height: 9, depth: 10 }, floors: 2, style: "modern" },
        { id: "bld_104", type: "house", name: "花园洋房4", position: { x: 50, z: 60 }, size: { width: 12, height: 9, depth: 10 }, floors: 2, style: "traditional" },
        { id: "bld_105", type: "house", name: "花园洋房5", position: { x: 80, z: 60 }, size: { width: 12, height: 9, depth: 10 }, floors: 2, style: "villa" },
        { id: "bld_106", type: "apartment", name: "宜居小区1", position: { x: 130, z: 40 }, size: { width: 25, height: 35, depth: 18 }, floors: 10, style: "residential" },
        { id: "bld_107", type: "apartment", name: "宜居小区2", position: { x: 180, z: 40 }, size: { width: 25, height: 35, depth: 18 }, floors: 10, style: "residential" },
        { id: "bld_108", type: "apartment", name: "宜居小区3", position: { x: 230, z: 40 }, size: { width: 25, height: 40, depth: 18 }, floors: 12, style: "modern" },
        
        // 西部工业区
        { id: "bld_201", type: "factory", name: "制造工厂1", position: { x: 30, z: 250 }, size: { width: 45, height: 18, depth: 35 }, floors: 1, style: "industrial" },
        { id: "bld_202", type: "factory", name: "制造工厂2", position: { x: 30, z: 320 }, size: { width: 40, height: 15, depth: 30 }, floors: 1, style: "industrial" },
        { id: "bld_203", type: "warehouse", name: "物流仓库1", position: { x: 60, z: 280 }, size: { width: 40, height: 14, depth: 28 }, floors: 1, style: "modern" },
        { id: "bld_204", type: "warehouse", name: "物流仓库2", position: { x: 60, z: 350 }, size: { width: 38, height: 12, depth: 25 }, floors: 1, style: "industrial" },
        
        // 商业街商店
        { id: "bld_301", type: "shop", name: "便利店1", position: { x: 180, z: 185 }, size: { width: 8, height: 6, depth: 10 }, floors: 1, style: "storefront" },
        { id: "bld_302", type: "shop", name: "便利店2", position: { x: 240, z: 185 }, size: { width: 8, height: 6, depth: 10 }, floors: 1, style: "storefront" },
        { id: "bld_303", type: "shop", name: "餐厅1", position: { x: 180, z: 260 }, size: { width: 12, height: 7, depth: 15 }, floors: 1, style: "storefront" },
        { id: "bld_304", type: "shop", name: "餐厅2", position: { x: 260, z: 260 }, size: { width: 12, height: 7, depth: 15 }, floors: 1, style: "mall" },
        
        // 公园设施
        { id: "bld_401", type: "tower", name: "钟楼", position: { x: 400, z: 400 }, size: { width: 10, height: 40, depth: 10 }, floors: 8, style: "medieval" },
        { id: "bld_402", type: "park设施", name: "公园亭1", position: { x: 420, z: 420 }, size: { width: 8, height: 5, depth: 8 }, floors: 1, style: "kiosk" },
        { id: "bld_403", type: "park设施", name: "公园亭2", position: { x: 380, z: 430 }, size: { width: 8, height: 5, depth: 8 }, floors: 1, style: "kiosk" }
    ],

    /**
     * 装饰物模板
     */
    decorationTemplates: {
        tree: {
            type: "tree",
            name: "树木",
            defaultSize: { radius: 1.5, height: 8 },
            styles: ["oak", "pine", "willow", "maple"]
        },
        flower: {
            type: "flower",
            name: "花卉",
            defaultSize: { radius: 0.3, height: 0.5 },
            styles: ["rose", "tulip", "sunflower", "lotus"]
        },
        bench: {
            type: "bench",
            name: "长椅",
            defaultSize: { width: 2, height: 1, depth: 0.6 },
            styles: ["wooden", "metal", "modern"]
        },
        lamp: {
            type: "lamp",
            name: "路灯",
            defaultSize: { radius: 0.2, height: 4 },
            styles: ["classic", "modern", "street"]
        },
        rock: {
            type: "rock",
            name: "岩石",
            defaultSize: { radius: 0.8, height: 0.6 },
            styles: ["boulder", "pebble", "cliff"]
        },
        fountain: {
            type: "fountain",
            name: "喷泉",
            defaultSize: { radius: 3, height: 2 },
            styles: ["modern", "classic", "musical"]
        }
    },

    /**
     * 默认装饰物实例
     */
    decorations: {
        trees: [
            // 公园树木
            { id: "tree_p001", type: "tree", position: { x: 360, z: 360 }, style: "oak" },
            { id: "tree_p002", type: "tree", position: { x: 380, z: 370 }, style: "pine" },
            { id: "tree_p003", type: "tree", position: { x: 400, z: 360 }, style: "oak" },
            { id: "tree_p004", type: "tree", position: { x: 420, z: 380 }, style: "willow" },
            { id: "tree_p005", type: "tree", position: { x: 440, z: 370 }, style: "maple" },
            { id: "tree_p006", type: "tree", position: { x: 460, z: 390 }, style: "pine" },
            { id: "tree_p007", type: "tree", position: { x: 370, z: 410 }, style: "oak" },
            { id: "tree_p008", type: "tree", position: { x: 390, z: 430 }, style: "willow" },
            { id: "tree_p009", type: "tree", position: { x: 430, z: 420 }, style: "maple" },
            { id: "tree_p010", type: "tree", position: { x: 450, z: 440 }, style: "pine" },
            // 路边树木
            { id: "tree_r001", type: "tree", position: { x: 160, z: 200 }, style: "maple" },
            { id: "tree_r002", type: "tree", position: { x: 240, z: 200 }, style: "maple" },
            { id: "tree_r003", type: "tree", position: { x: 310, z: 200 }, style: "oak" },
            { id: "tree_r004", type: "tree", position: { x: 200, z: 240 }, style: "pine" },
            { id: "tree_r005", type: "tree", position: { x: 200, z: 310 }, style: "oak" }
        ],
        flowers: [
            // 公园花卉
            { id: "flower_f001", type: "flower", position: { x: 370, z: 385 }, style: "rose" },
            { id: "flower_f002", type: "flower", position: { x: 410, z: 400 }, style: "tulip" },
            { id: "flower_f003", type: "flower", position: { x: 435, z: 405 }, style: "sunflower" },
            { id: "flower_f004", type: "flower", position: { x: 455, z: 415 }, style: "lotus" },
            { id: "flower_f005", type: "flower", position: { x: 385, z: 445 }, style: "rose" },
            { id: "flower_f006", type: "flower", position: { x: 415, z: 435 }, style: "tulip" }
        ],
        benches: [
            { id: "bench_b001", type: "bench", position: { x: 380, z: 395 }, rotation: 0, style: "wooden" },
            { id: "bench_b002", type: "bench", position: { x: 430, z: 395 }, rotation: Math.PI / 2, style: "modern" },
            { id: "bench_b003", type: "bench", position: { x: 405, z: 450 }, rotation: 0, style: "wooden" },
            { id: "bench_b004", type: "bench", position: { x: 180, z: 185 }, rotation: Math.PI / 4, style: "metal" }
        ],
        lamps: [
            // 道路路灯
            { id: "lamp_l001", type: "lamp", position: { x: 160, z: 200 }, rotation: 0, style: "street" },
            { id: "lamp_l002", type: "lamp", position: { x: 240, z: 200 }, rotation: 0, style: "street" },
            { id: "lamp_l003", type: "lamp", position: { x: 310, z: 200 }, rotation: 0, style: "street" },
            { id: "lamp_l004", type: "lamp", position: { x: 200, z: 160 }, rotation: 0, style: "classic" },
            { id: "lamp_l005", type: "lamp", position: { x: 200, z: 240 }, rotation: 0, style: "classic" },
            { id: "lamp_l006", type: "lamp", position: { x: 200, z: 310 }, rotation: 0, style: "modern" },
            { id: "lamp_l007", type: "lamp", position: { x: 350, z: 200 }, rotation: 0, style: "street" }
        ],
        rocks: [
            { id: "rock_r001", type: "rock", position: { x: 395, z: 380 }, style: "boulder" },
            { id: "rock_r002", type: "rock", position: { x: 445, z: 425 }, style: "pebble" },
            { id: "rock_r003", type: "rock", position: { x: 25, z: 280 }, style: "boulder" }
        ],
        fountains: [
            { id: "fountain_f001", type: "fountain", position: { x: 400, z: 400 }, style: "modern" }
        ]
    },

    /**
     * 地形高度数据
     * 服务端用于验证移动和计算视野
     */
    terrain: {
        type: "flat",
        defaultHeight: 0,
        heightVariations: [
            // 北部小山丘
            { id: "hill_north", position: { x: 400, z: 50 }, radius: 40, height: 15 },
            // 东部小山
            { id: "hill_east", position: { x: 450, z: 300 }, radius: 30, height: 10 },
            // 西部丘陵
            { id: "hill_west", position: { x: 30, z: 400 }, radius: 35, height: 12 }
        ],
        waterBodies: [
            // 南部小湖
            { id: "lake_south", position: { x: 250, z: 450 }, radiusX: 30, radiusZ: 20, depth: 3 }
        ]
    },

    /**
     * 智能体生成点
     * 服务端用于复活和生成智能体
     */
    spawnPoints: [
        { id: "spawn_1", name: "市中心广场", position: { x: 250, z: 250 }, radius: 10 },
        { id: "spawn_2", name: "公园入口", position: { x: 380, z: 360 }, radius: 8 },
        { id: "spawn_3", name: "北部住宅区", position: { x: 150, z: 50 }, radius: 10 },
        { id: "spawn_4", name: "商业街", position: { x: 220, z: 200 }, radius: 8 }
    ],

    /**
     * 特殊区域
     */
    specialZones: [
        {
            id: "zone_fountain",
            name: "喷泉广场",
            position: { x: 250, z: 250 },
            radius: 15,
            type: "meeting_point",
            description: "智能体相遇时会在这里聚集"
        },
        {
            id: "zone_transformer",
            name: "变形金刚区域",
            position: { x: 100, z: 400 },
            radius: 20,
            type: "battle_zone",
            description: "变形金刚的专属区域"
        }
    ]
};
