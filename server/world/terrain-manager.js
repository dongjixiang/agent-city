/**
 * TerrainManager - 地形管理
 * 
 * 负责：
 * - 高度图管理
 * - 可行走区域
 * - 障碍物区域
 * - 地形类型查询
 */

const WorldData = require('../data/world-data');

class TerrainManager {
    constructor(worldState) {
        this.worldState = worldState;
        
        // 世界尺寸
        this.width = WorldData.meta.width;
        this.height = WorldData.meta.height;
        
        // 地形区域（从共享数据加载）
        this.terrainZones = WorldData.terrainZones.map(zone => ({
            ...zone,
            // 转换为 polygon 格式供碰撞检测使用
            polygon: this.boundsToPolygon(zone.bounds)
        }));
        
        // 道路数据（用于路径验证）
        this.roads = WorldData.roads;
        
        // 地形高度数据
        this.terrain = WorldData.terrain;
        
        // 地形类型
        this.terrainTypes = {
            grass: { id: "grass", name: "草地", height: 0, walkable: true, buildable: true },
            road: { id: "road", name: "道路", height: 0.1, walkable: true, buildable: false },
            water: { id: "water", name: "水面", height: -1, walkable: false, buildable: false },
            mountain: { id: "mountain", name: "山地", height: 10, walkable: false, buildable: false },
            building: { id: "building", name: "建筑地基", height: 0, walkable: false, buildable: false }
        };
        
        // 默认地形类型
        this.defaultTerrain = this.terrainTypes.grass;
        
        // 障碍物区域
        this.blockedZones = [];
        // 可行走区域
        this.walkableZones = [];
    }
    
    /**
     * 将 bounds 转换为 polygon
     */
    boundsToPolygon(bounds) {
        return [
            [bounds.minX, bounds.minZ],
            [bounds.maxX, bounds.minZ],
            [bounds.maxX, bounds.maxZ],
            [bounds.minX, bounds.maxZ]
        ];
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
        return x >= -100 && x < 100 && z >= -100 && z < 100;
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
            terrainZones: this.terrainZones.map(z => ({
                id: z.id,
                name: z.name,
                type: z.type,
                bounds: z.bounds,
                walkable: z.walkable
            })),
            roads: this.roads,
            terrain: this.terrain
        };
    }
}

module.exports = TerrainManager;
