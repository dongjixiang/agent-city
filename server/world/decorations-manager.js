/**
 * DecorationsManager - 装饰物管理
 * 
 * 负责：
 * - 树木、花卉、路灯等装饰物存储
 * - 装饰物 CRUD
 * - 装饰物位置查询
 */

class DecorationsManager {
    constructor(worldState) {
        this.worldState = worldState;
        
        // 装饰物存储
        this.decorations = new Map();
        
        // 装饰物类型
        this.decoratorTypes = {
            tree: {
                type: "tree",
                name: "树木",
                defaultSize: { radius: 1, height: 8 }
            },
            flower: {
                type: "flower",
                name: "花卉",
                defaultSize: { radius: 0.3, height: 0.5 }
            },
            bench: {
                type: "bench",
                name: "长椅",
                defaultSize: { width: 2, height: 1, depth: 0.5 }
            },
            lamp: {
                type: "lamp",
                name: "路灯",
                defaultSize: { radius: 0.2, height: 4 }
            },
            rock: {
                type: "rock",
                name: "岩石",
                defaultSize: { radius: 0.8, height: 0.6 }
            },
            fountain: {
                type: "fountain",
                name: "喷泉",
                defaultSize: { radius: 3, height: 2 }
            }
        };
        
        // 初始化默认装饰物
        this.initDefaultDecorations();
    }
    
    /**
     * 初始化默认装饰物
     */
    initDefaultDecorations() {
        const defaultDecorations = [
            // 公园树木
            { id: "tree_p1", type: "tree", position: { x: 310, z: 310 }, style: "oak" },
            { id: "tree_p2", type: "tree", position: { x: 330, z: 320 }, style: "pine" },
            { id: "tree_p3", type: "tree", position: { x: 350, z: 310 }, style: "oak" },
            { id: "tree_p4", type: "tree", position: { x: 370, z: 340 }, style: "pine" },
            { id: "tree_p5", type: "tree", position: { x: 390, z: 360 }, style: "oak" },
            
            // 公园花卉
            { id: "flower_f1", type: "flower", position: { x: 320, z: 350 }, style: "red" },
            { id: "flower_f2", type: "flower", position: { x: 340, z: 370 }, style: "yellow" },
            { id: "flower_f3", type: "flower", position: { x: 360, z: 350 }, style: "pink" },
            { id: "flower_f4", type: "flower", position: { x: 380, z: 380 }, style: "red" },
            
            // 公园长椅
            { id: "bench_b1", type: "bench", position: { x: 335, z: 360 }, rotation: 0 },
            { id: "bench_b2", type: "bench", position: { x: 375, z: 320 }, rotation: Math.PI / 2 },
            
            // 路灯（市中心）
            { id: "lamp_l1", type: "lamp", position: { x: 120, z: 80 }, rotation: 0 },
            { id: "lamp_l2", type: "lamp", position: { x: 140, z: 80 }, rotation: 0 },
            { id: "lamp_l3", type: "lamp", position: { x: 120, z: 100 }, rotation: 0 },
            { id: "lamp_l4", type: "lamp", position: { x: 140, z: 100 }, rotation: 0 },
            
            // 喷泉
            { id: "fountain_1", type: "fountain", position: { x: 160, z: 140 }, style: "modern" },
            
            // 公园喷泉
            { id: "fountain_p1", type: "fountain", position: { x: 400, z: 400 }, style: "classic" }
        ];
        
        for (const data of defaultDecorations) {
            const decoration = new Decoration(data);
            this.decorations.set(decoration.id, decoration);
        }
        
        console.log(`[DecorationsManager] 初始化了 ${this.decorations.size} 个装饰物`);
    }
    
    /**
     * 添加装饰物
     */
    addDecoration(data) {
        if (!data.id || !data.type || !data.position) {
            return { success: false, reason: "Missing required fields" };
        }
        
        if (this.decorations.has(data.id)) {
            return { success: false, reason: "Decoration ID already exists" };
        }
        
        const decoration = new Decoration(data);
        this.decorations.set(decoration.id, decoration);
        
        return { success: true, decoration };
    }
    
    /**
     * 删除装饰物
     */
    removeDecoration(id) {
        if (!this.decorations.has(id)) {
            return { success: false, reason: "Decoration not found" };
        }
        
        const decoration = this.decorations.get(id);
        this.decorations.delete(id);
        
        return { success: true, decoration };
    }
    
    /**
     * 获取装饰物
     */
    getDecoration(id) {
        return this.decorations.get(id);
    }
    
    /**
     * 获取所有装饰物
     */
    getAllDecorations() {
        return Array.from(this.decorations.values());
    }
    
    /**
     * 获取指定范围内的装饰物
     */
    getDecorationsInArea(x, z, radius) {
        const result = [];
        for (const decoration of this.decorations.values()) {
            const dist = Math.hypot(decoration.position.x - x, decoration.position.z - z);
            if (dist <= radius) {
                result.push({
                    ...decoration,
                    distance: dist
                });
            }
        }
        return result.sort((a, b) => a.distance - b.distance);
    }
    
    /**
     * 检查某位置附近是否有装饰物
     */
    hasDecorationNear(x, z, minDistance) {
        for (const decoration of this.decorations.values()) {
            const dist = Math.hypot(decoration.position.x - x, decoration.position.z - z);
            if (dist < minDistance) {
                return true;
            }
        }
        return false;
    }
    
    /**
     * 按类型获取装饰物
     */
    getByType(type) {
        return Array.from(this.decorations.values()).filter(d => d.type === type);
    }
    
    /**
     * 获取状态
     */
    getState() {
        return {
            trees: this.getByType("tree").map(d => d.toJSON()),
            flowers: this.getByType("flower").map(d => d.toJSON()),
            benches: this.getByType("bench").map(d => d.toJSON()),
            lamps: this.getByType("lamp").map(d => d.toJSON()),
            rocks: this.getByType("rock").map(d => d.toJSON()),
            fountains: this.getByType("fountain").map(d => d.toJSON())
        };
    }
}

/**
 * 装饰物数据模型
 */
class Decoration {
    constructor(data) {
        this.id = data.id;
        this.type = data.type;
        this.position = { x: data.position.x, z: data.position.z };
        this.rotation = data.rotation || 0;
        this.style = data.style || "default";
        this.size = data.size || this.getDefaultSize();
        this.createdAt = data.createdAt || Date.now();
    }
    
    getDefaultSize() {
        switch (this.type) {
            case "tree": return { radius: 1, height: 8 };
            case "flower": return { radius: 0.3, height: 0.5 };
            case "bench": return { width: 2, height: 1, depth: 0.5 };
            case "lamp": return { radius: 0.2, height: 4 };
            case "rock": return { radius: 0.8, height: 0.6 };
            case "fountain": return { radius: 3, height: 2 };
            default: return { radius: 1, height: 1 };
        }
    }
    
    /**
     * 检查点是否在装饰物范围内
     */
    containsPoint(x, z) {
        if (this.size.radius) {
            // 圆形范围
            const dist = Math.hypot(x - this.position.x, z - this.position.z);
            return dist < this.size.radius;
        } else if (this.size.width && this.size.depth) {
            // 矩形范围
            const halfW = this.size.width / 2;
            const halfD = this.size.depth / 2;
            return x >= this.position.x - halfW && x <= this.position.x + halfW &&
                   z >= this.position.z - halfD && z <= this.position.z + halfD;
        }
        return false;
    }
    
    toJSON() {
        return {
            id: this.id,
            type: this.type,
            position: this.position,
            rotation: this.rotation,
            style: this.style,
            size: this.size,
            createdAt: this.createdAt
        };
    }
}

module.exports = DecorationsManager;
