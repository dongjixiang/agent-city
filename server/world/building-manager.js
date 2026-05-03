/**
 * BuildingManager - 建筑管理
 * 
 * 负责：
 * - 建筑数据存储
 * - 建筑CRUD操作
 * - 建筑碰撞边界计算
 */

class BuildingManager {
    constructor(worldState) {
        this.worldState = worldState;
        
        // 建筑存储
        this.buildings = new Map();
        
        // 预定义的建筑模板
        this.buildingTemplates = {
            skyscraper: {
                type: "skyscraper",
                name: "摩天大楼",
                defaultSize: { width: 20, height: 150, depth: 20 },
                floors: 40,
                style: "modern"
            },
            house: {
                type: "house",
                name: "房屋",
                defaultSize: { width: 10, height: 8, depth: 10 },
                floors: 2,
                style: "residential"
            },
            shop: {
                type: "shop",
                name: "商店",
                defaultSize: { width: 8, height: 6, depth: 12 },
                floors: 1,
                style: "commercial"
            },
            park: {
                type: "park",
                name: "公园设施",
                defaultSize: { width: 15, height: 5, depth: 15 },
                floors: 1,
                style: "nature"
            },
            tower: {
                type: "tower",
                name: "塔楼",
                defaultSize: { width: 15, height: 80, depth: 15 },
                floors: 20,
                style: "medieval"
            }
        };
        
        // 初始化默认建筑
        this.initDefaultBuildings();
    }
    
    /**
     * 初始化默认建筑
     */
    initDefaultBuildings() {
        const defaultBuildings = [
            {
                id: "bld_downtown_1",
                type: "skyscraper",
                position: { x: 100, z: 100 },
                size: { width: 25, height: 120, depth: 25 },
                floors: 35,
                style: "modern"
            },
            {
                id: "bld_downtown_2",
                type: "skyscraper",
                position: { x: 150, z: 120 },
                size: { width: 20, height: 100, depth: 20 },
                floors: 30,
                style: "modern"
            },
            {
                id: "bld_downtown_3",
                type: "skyscraper",
                position: { x: 180, z: 80 },
                size: { width: 30, height: 180, depth: 30 },
                floors: 50,
                style: "glass"
            },
            {
                id: "bld_house_1",
                type: "house",
                position: { x: 320, z: 350 },
                size: { width: 12, height: 8, depth: 10 },
                floors: 2,
                style: "residential"
            },
            {
                id: "bld_house_2",
                type: "house",
                position: { x: 350, z: 380 },
                size: { width: 10, height: 7, depth: 10 },
                floors: 2,
                style: "residential"
            },
            {
                id: "bld_shop_1",
                type: "shop",
                position: { x: 200, z: 150 },
                size: { width: 15, height: 6, depth: 20 },
                floors: 1,
                style: "commercial"
            },
            {
                id: "bld_tower_1",
                type: "tower",
                position: { x: 400, z: 100 },
                size: { width: 20, height: 60, depth: 20 },
                floors: 15,
                style: "medieval"
            }
        ];
        
        for (const data of defaultBuildings) {
            const building = new Building(data);
            this.buildings.set(building.id, building);
        }
        
        console.log(`[BuildingManager] 初始化了 ${this.buildings.size} 个默认建筑`);
    }
    
    /**
     * 添加建筑
     */
    addBuilding(data) {
        // 验证数据
        const validation = this.validateBuildingData(data);
        if (!validation.valid) {
            return { success: false, reason: validation.reason };
        }
        
        // 检查ID是否已存在
        if (this.buildings.has(data.id)) {
            return { success: false, reason: `Building ID ${data.id} already exists` };
        }
        
        // 创建建筑
        const building = new Building(data);
        
        // 检查是否与现有建筑重叠
        for (const existing of this.buildings.values()) {
            if (building.overlaps(existing)) {
                return { success: false, reason: "Overlaps with existing building" };
            }
        }
        
        this.buildings.set(building.id, building);
        return { success: true, building };
    }
    
    /**
     * 删除建筑
     */
    removeBuilding(id) {
        if (!this.buildings.has(id)) {
            return { success: false, reason: "Building not found" };
        }
        
        const building = this.buildings.get(id);
        this.buildings.delete(id);
        return { success: true, building };
    }
    
    /**
     * 获取建筑
     */
    getBuilding(id) {
        return this.buildings.get(id);
    }
    
    /**
     * 获取所有建筑
     */
    getAllBuildings() {
        return Array.from(this.buildings.values());
    }
    
    /**
     * 验证建筑数据
     */
    validateBuildingData(data) {
        if (!data.id) return { valid: false, reason: "Missing building ID" };
        if (!data.type) return { valid: false, reason: "Missing building type" };
        if (!data.position || data.position.x === undefined) {
            return { valid: false, reason: "Missing position" };
        }
        
        // 检查类型是否有效
        if (!this.buildingTemplates[data.type]) {
            return { valid: false, reason: `Invalid building type: ${data.type}` };
        }
        
        // 检查位置是否在边界内
        const { x, z } = data.position;
        const worldSize = this.worldState.meta?.width || 500;
        if (x < 0 || x >= worldSize || z < 0 || z >= worldSize) {
            return { valid: false, reason: "Position out of bounds" };
        }
        
        return { valid: true };
    }
    
    /**
     * 检查点是否在任何建筑内部
     */
    getBuildingAtPoint(x, z) {
        for (const building of this.buildings.values()) {
            if (building.containsPoint(x, z)) {
                return building;
            }
        }
        return null;
    }
    
    /**
     * 获取状态（用于序列化）
     */
    getState() {
        return this.buildings.values().map(b => b.toJSON());
    }
}

/**
 * 建筑数据模型
 */
class Building {
    constructor(data) {
        this.id = data.id;
        this.type = data.type;
        this.position = { x: data.position.x, z: data.position.z };
        this.size = {
            width: data.size?.width || 10,
            height: data.size?.height || 10,
            depth: data.size?.depth || 10
        };
        this.floors = data.floors || 1;
        this.style = data.style || "modern";
        this.name = data.name || `${this.type}_${this.id}`;
        this.owner = data.owner || null;
        this.createdAt = data.createdAt || Date.now();
        
        // 计算碰撞边界
        this.bounds = this.calculateBounds();
    }
    
    calculateBounds() {
        return {
            minX: this.position.x - this.size.width / 2,
            maxX: this.position.x + this.size.width / 2,
            minZ: this.position.z - this.size.depth / 2,
            maxZ: this.position.z + this.size.depth / 2,
            minY: 0,
            maxY: this.size.height
        };
    }
    
    /**
     * 检查点是否在建筑内部（仅地面投影）
     */
    containsPoint(x, z) {
        return x >= this.bounds.minX && x <= this.bounds.maxX &&
               z >= this.bounds.minZ && z <= this.bounds.maxZ;
    }
    
    /**
     * 检查是否与另一个建筑重叠
     */
    overlaps(other) {
        return !(this.bounds.maxX < other.bounds.minX ||
                 this.bounds.minX > other.bounds.maxX ||
                 this.bounds.maxZ < other.bounds.minZ ||
                 this.bounds.minZ > other.bounds.maxZ);
    }
    
    /**
     * 检查是否与圆形区域相交
     */
    intersectsCircle(cx, cz, radius) {
        // 找矩形上离圆心最近的点
        const closestX = Math.max(this.bounds.minX, Math.min(cx, this.bounds.maxX));
        const closestZ = Math.max(this.bounds.minZ, Math.min(cz, this.bounds.maxZ));
        
        const dist = Math.hypot(cx - closestX, cz - closestZ);
        return dist < radius;
    }
    
    /**
     * 转为JSON
     */
    toJSON() {
        return {
            id: this.id,
            type: this.type,
            name: this.name,
            position: this.position,
            size: this.size,
            bounds: this.bounds,
            floors: this.floors,
            style: this.style,
            owner: this.owner,
            createdAt: this.createdAt
        };
    }
}

module.exports = BuildingManager;
