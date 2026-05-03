/**
 * WorldState - 服务端世界状态核心类
 * 
 * 职责：
 * - 管理世界元数据
 * - 管理地形、建筑、装饰物
 * - 管理智能体状态
 * - 提供世界状态的序列化（用于同步）
 */

const TerrainManager = require('./terrain-manager');
const BuildingManager = require('./building-manager');
const AgentsState = require('./agents-state');
const TimeSystem = require('./time-system');
const WeatherSystem = require('./weather-system');
const DecorationsManager = require('./decorations-manager');

class WorldState {
    constructor() {
        this.version = "1.0";
        this.lastUpdate = Date.now();
        
        // 世界基本信息
        this.meta = {
            name: "Agent City",
            width: 500,
            height: 500,
            maxAgents: 100,
            createdAt: Date.now()
        };
        
        // 子系统
        this.terrain = new TerrainManager(this);
        this.buildings = new BuildingManager(this);
        this.agents = new AgentsState(this);
        this.timeSystem = new TimeSystem();
        this.weatherSystem = new WeatherSystem();
        this.decorations = new DecorationsManager(this);
        
        // 事件监听器
        this.listeners = new Map();
        
        console.log('[WorldState] 世界状态初始化完成');
    }
    
    /**
     * 添加事件监听器
     */
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }
    
    /**
     * 触发事件
     */
    emit(event, data) {
        const callbacks = this.listeners.get(event) || [];
        callbacks.forEach(cb => cb(data));
    }
    
    /**
     * 获取完整世界状态（用于同步）
     */
    getState() {
        return {
            meta: this.meta,
            version: this.version,
            time: this.timeSystem.getState(),
            weather: this.weatherSystem.getState(),
            terrain: this.terrain.getState(),
            buildings: this.buildings.getState(),
            decorations: this.decorations.getState(),
            lastUpdate: this.lastUpdate
        };
    }
    
    /**
     * 获取摘要（用于增量更新）
     */
    getSummary() {
        return {
            version: this.version,
            time: this.timeSystem.getState(),
            weather: this.weatherSystem.getState(),
            agentCount: this.agents.agents.size,
            buildingCount: this.buildings.buildings.size,
            lastUpdate: this.lastUpdate
        };
    }
    
    /**
     * 验证智能体移动
     * @returns { valid: boolean, reason?: string }
     */
    validateAgentMove(agentId, newPosition) {
        return this.agents.validateMove(agentId, newPosition);
    }
    
    /**
     * 更新智能体位置
     */
    updateAgentPosition(agentId, position) {
        const result = this.agents.updatePosition(agentId, position);
        if (result.success) {
            this.lastUpdate = Date.now();
            this.emit('agent:moved', { agentId, position });
        }
        return result;
    }
    
    /**
     * 每帧更新
     */
    tick(deltaTime) {
        // 更新时间
        this.timeSystem.tick(deltaTime);
        
        // 更新天气
        this.weatherSystem.tick(deltaTime);
        
        // 检查天气/时间变化，触发更新
        const timeChanged = this.timeSystem.hasChanged();
        const weatherChanged = this.weatherSystem.hasChanged();
        
        if (timeChanged || weatherChanged) {
            this.lastUpdate = Date.now();
            this.emit('world:update', {
                time: timeChanged ? this.timeSystem.getState() : null,
                weather: weatherChanged ? this.weatherSystem.getState() : null
            });
        }
    }
    
    /**
     * 添加建筑
     */
    addBuilding(buildingData) {
        const result = this.buildings.addBuilding(buildingData);
        if (result.success) {
            this.lastUpdate = Date.now();
            this.emit('building:added', result.building);
        }
        return result;
    }
    
    /**
     * 删除建筑
     */
    removeBuilding(buildingId) {
        const result = this.buildings.removeBuilding(buildingId);
        if (result.success) {
            this.lastUpdate = Date.now();
            this.emit('building:removed', { id: buildingId });
        }
        return result;
    }
    
    /**
     * 验证建造请求
     */
    validateBuild(agentId, buildingData) {
        // 检查权限
        const agent = this.agents.getAgent(agentId);
        if (!agent) {
            return { valid: false, reason: "Agent not found" };
        }
        
        // 检查位置是否可建造
        const { x, z } = buildingData.position;
        
        // 1. 检查边界
        if (!this.terrain.isInBounds(x, z)) {
            return { valid: false, reason: "Out of world bounds" };
        }
        
        // 2. 检查地形是否可建造
        if (!this.terrain.isBuildable(x, z)) {
            return { valid: false, reason: "Terrain not buildable" };
        }
        
        // 3. 检查是否与现有建筑冲突
        const size = buildingData.size || { width: 10, depth: 10 };
        const halfW = size.width / 2;
        const halfD = size.depth / 2;
        
        for (const building of this.buildings.buildings.values()) {
            const b = building.bounds;
            if (!(x + halfW < b.minX || x - halfW > b.maxX ||
                  z + halfD < b.minZ || z - halfD > b.maxZ)) {
                return { valid: false, reason: `Conflicts with building ${building.id}` };
            }
        }
        
        // 4. 检查与装饰物的冲突
        if (this.decorations.hasDecorationNear(x, z, 2)) {
            return { valid: false, reason: "Too close to decorations" };
        }
        
        return { valid: true };
    }
    
    /**
     * 获取指定区域内的建筑列表
     */
    getBuildingsInArea(x, z, radius) {
        const result = [];
        for (const building of this.buildings.buildings.values()) {
            const dist = Math.hypot(building.position.x - x, building.position.z - z);
            if (dist <= radius) {
                result.push({
                    ...building,
                    distance: dist
                });
            }
        }
        return result.sort((a, b) => a.distance - b.distance);
    }
    
    /**
     * 获取指定区域内的智能体列表
     */
    getAgentsInArea(x, z, radius) {
        const result = [];
        for (const [agentId, agent] of this.agents.agents) {
            const dist = Math.hypot(agent.position.x - x, agent.position.z - z);
            if (dist <= radius) {
                result.push({
                    agentId,
                    ...agent,
                    distance: dist
                });
            }
        }
        return result.sort((a, b) => a.distance - b.distance);
    }
}

module.exports = WorldState;
