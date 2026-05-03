/**
 * TerrainManager - 地形管理
 * 
 * 负责：
 * - 高度图管理
 * - 可行走区域
 * - 障碍物区域
 * - 地形类型查询
 */

class TerrainManager {
    constructor(worldState) {
        this.worldState = worldState;
        
        // 世界尺寸
        this.width = 500;
        this.height = 500;
        
        // 高度图（简化版，实际可以从服务端加载）
        this.heightMap = this.generateDefaultHeightMap();
        
        // 可行走区域
        this.walkableZones = [
            { 
                id: "zone_downtown", 
                name: "市中心",
                polygon: [
                    [50, 50], [250, 50], [250, 250], [50, 250]
                ],
                walkable: true
            },
            { 
                id: "zone_park", 
                name: "公园区",
                polygon: [
                    [300, 300], [450, 300], [450, 450], [300, 450]
                ],
                walkable: true
            },
            { 
                id: "zone_north", 
                name: "北部区",
                polygon: [
                    [0, 0], [500, 0], [500, 50], [0, 50]
                ],
                walkable: true
            }
        ];
        
        // 障碍物区域（建筑内部、河流等）
        this.blockedZones = [
            // 河流
            {
                id: "river_1",
                polygon: [[0, 150], [100, 150], [100, 200], [0, 200]],
                blocked: true
            }
        ];
        
        // 地形类型
        this.terrainTypes = {
            grass: { id: "grass", name: "草地", height: 0, walkable: true, buildable: true, color: "#4a7c4e" },
            road: { id: "road", name: "道路", height: 0.1, walkable: true, buildable: false, color: "#666666" },
            water: { id: "water", name: "水面", height: -1, walkable: false, buildable: false, color: "#4a90d9" },
            mountain: { id: "mountain", name: "山地", height: 10, walkable: false, buildable: false, color: "#8b7355" },
            building: { id: "building", name: "建筑地基", height: 0, walkable: false, buildable: false, color: "#888888" }
        };
        
        // 默认地形类型
        this.defaultTerrain = this.terrainTypes.grass;
    }
    
    /**
     * 生成默认高度图
     */
    generateDefaultHeightMap() {
        const map = [];
        const resolution = 10; // 每10个单位一个高度点
        
        for (let x = 0; x < this.width; x += resolution) {
            const col = [];
            for (let z = 0; z < this.height; z += resolution) {
                // 默认高度为0
                col.push(0);
            }
            map.push(col);
        }
        
        return map;
    }
    
    /**
     * 检查坐标是否在世界边界内
     */
    isInBounds(x, z) {
        return x >= 0 && x < this.width && z >= 0 && z < this.height;
    }
    
    /**
     * 获取指定坐标的地形类型
     */
    getTerrainType(x, z) {
        // 首先检查是否是障碍物区域
        for (const zone of this.blockedZones) {
            if (this.pointInPolygon(x, z, zone.polygon)) {
                return zone.blocked ? this.terrainTypes.water : this.defaultTerrain;
            }
        }
        
        // 检查可行走区域
        for (const zone of this.walkableZones) {
            if (this.pointInPolygon(x, z, zone.polygon)) {
                return zone.walkable ? this.defaultTerrain : this.terrainTypes.water;
            }
        }
        
        return this.defaultTerrain;
    }
    
    /**
     * 获取高度（在高度图基础上插值）
     */
    getHeight(x, z) {
        // 简化实现：返回0
        // 实际可以从高度图插值计算
        return 0;
    }
    
    /**
     * 检查地形是否可通行
     */
    isWalkable(x, z) {
        if (!this.isInBounds(x, z)) return false;
        
        const terrain = this.getTerrainType(x, z);
        return terrain.walkable;
    }
    
    /**
     * 检查地形是否可建造
     */
    isBuildable(x, z) {
        if (!this.isInBounds(x, z)) return false;
        
        const terrain = this.getTerrainType(x, z);
        return terrain.buildable;
    }
    
    /**
     * 检查点是否在多边形内（Ray casting算法）
     */
    pointInPolygon(x, z, polygon) {
        let inside = false;
        const n = polygon.length;
        
        for (let i = 0, j = n - 1; i < n; j = i++) {
            const xi = polygon[i][0], zi = polygon[i][1];
            const xj = polygon[j][0], zj = polygon[j][1];
            
            if (((zi > z) !== (zj > z)) &&
                (x < (xj - xi) * (z - zi) / (zj - zi) + xi)) {
                inside = !inside;
            }
        }
        
        return inside;
    }
    
    /**
     * 检查是否在障碍区域内
     */
    isInBlockedZone(x, z) {
        for (const zone of this.blockedZones) {
            if (this.pointInPolygon(x, z, zone.polygon)) {
                return true;
            }
        }
        return false;
    }
    
    /**
     * 添加可行走区域
     */
    addWalkableZone(zone) {
        this.walkableZones.push(zone);
    }
    
    /**
     * 添加障碍物区域
     */
    addBlockedZone(zone) {
        this.blockedZones.push(zone);
    }
    
    /**
     * 获取状态（用于序列化）
     */
    getState() {
        return {
            width: this.width,
            height: this.height,
            terrainTypes: Object.keys(this.terrainTypes).map(k => this.terrainTypes[k]),
            walkableZones: this.walkableZones.map(z => ({
                id: z.id,
                name: z.name,
                polygon: z.polygon
            })),
            blockedZones: this.blockedZones.map(z => ({
                id: z.id,
                polygon: z.polygon
            }))
        };
    }
}

module.exports = TerrainManager;
