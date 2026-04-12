/**
 * WorldState - 世界状态管理
 * 
 * 对应 DESIGN.md Section 5.2 WorldStateSystem
 * 所有对象的中心管理
 */

import { eventBus, Events } from '../../core/event-bus.js';

class WorldState {
    constructor() {
        this.agents = new Map();      // agentId -> agent data
        this.buildings = new Map();   // buildingId -> building data
        this.decorations = new Map();  // decorationId -> decoration data
        this.objects = new Map();      // any object with id
        
        this.time = 0;                // 游戏时间（秒）
        this.dayNumber = 1;
        this.weather = 'clear';
        this.season = 'spring';
        
        this.listeners = new Set();
    }

    /**
     * 添加智能体
     */
    addAgent(agent) {
        this.agents.set(agent.id, agent);
        this.objects.set(agent.id, agent);
        eventBus.emit(Events.AGENT_ADDED, agent);
        this.notifyChange();
    }

    /**
     * 移除智能体
     */
    removeAgent(agentId) {
        const agent = this.agents.get(agentId);
        if (agent) {
            this.agents.delete(agentId);
            this.objects.delete(agentId);
            eventBus.emit(Events.AGENT_REMOVED, { agentId });
            this.notifyChange();
        }
    }

    /**
     * 更新智能体
     */
    updateAgent(agentId, updates) {
        const agent = this.agents.get(agentId);
        if (agent) {
            Object.assign(agent, updates);
            eventBus.emit(Events.AGENT_MOVED, { agentId, ...updates });
            this.notifyChange();
        }
    }

    /**
     * 获取智能体
     */
    getAgent(agentId) {
        return this.agents.get(agentId);
    }

    /**
     * 获取所有智能体
     */
    getAllAgents() {
        return Array.from(this.agents.values());
    }

    /**
     * 获取在线智能体
     */
    getOnlineAgents() {
        return this.getAllAgents().filter(a => a.isOnline !== false);
    }

    /**
     * 添加建筑
     */
    addBuilding(building) {
        this.buildings.set(building.id, building);
        this.objects.set(building.id, building);
    }

    /**
     * 获取建筑
     */
    getBuilding(buildingId) {
        return this.buildings.get(buildingId);
    }

    /**
     * 获取所有建筑
     */
    getAllBuildings() {
        return Array.from(this.buildings.values());
    }

    /**
     * 添加装饰物
     */
    addDecoration(decoration) {
        this.decorations.set(decoration.id, decoration);
        this.objects.set(decoration.id, decoration);
    }

    /**
     * 获取装饰物
     */
    getDecoration(decorationId) {
        return this.decorations.get(decorationId);
    }

    /**
     * 获取所有装饰物
     */
    getAllDecorations() {
        return Array.from(this.decorations.values());
    }

    /**
     * 获取指定范围内的所有对象
     */
    getNearbyObjects(position, radius) {
        const results = [];
        const px = position.x;
        const pz = position.z;

        for (const obj of this.objects.values()) {
            if (obj.position) {
                const dx = obj.position.x - px;
                const dz = obj.position.z - pz;
                const dist = Math.sqrt(dx * dx + dz * dz);
                if (dist <= radius) {
                    results.push({ ...obj, distance: dist });
                }
            }
        }

        // 按距离排序
        results.sort((a, b) => a.distance - b.distance);
        return results;
    }

    /**
     * 获取最近的智能体
     */
    getNearestAgent(position, radius = Infinity) {
        const nearby = this.getNearbyObjects(position, radius);
        return nearby.find(obj => this.agents.has(obj.id));
    }

    /**
     * 获取最近的建筑
     */
    getNearestBuilding(position, radius = Infinity) {
        const nearby = this.getNearbyObjects(position, radius);
        return nearby.find(obj => this.buildings.has(obj.id));
    }

    /**
     * 添加任意对象
     */
    addObject(obj) {
        if (!obj.id) {
            console.warn('[WorldState] Object without id:', obj);
            return;
        }
        this.objects.set(obj.id, obj);
        this.notifyChange();
    }

    /**
     * 移除对象
     */
    removeObject(objId) {
        this.objects.delete(objId);
        this.agents.delete(objId);
        this.buildings.delete(objId);
        this.decorations.delete(objId);
        this.notifyChange();
    }

    /**
     * 获取对象
     */
    getObject(objId) {
        return this.objects.get(objId);
    }

    /**
     * 更新时间
     */
    tick(deltaTime) {
        this.time += deltaTime;
        eventBus.emit(Events.TIME_TICK, { time: this.time, deltaTime });
    }

    /**
     * 设置天气
     */
    setWeather(weather) {
        this.weather = weather;
        eventBus.emit('weather:change', { weather });
        this.notifyChange();
    }

    /**
     * 获取游戏时间（小时）
     */
    getGameHours() {
        return (this.time / 3600) % 24;
    }

    /**
     * 获取昼夜阶段
     */
    getDayNightPhase() {
        const hour = this.getGameHours();
        if (hour >= 6 && hour < 8) return 'dawn';
        if (hour >= 8 && hour < 12) return 'morning';
        if (hour >= 12 && hour < 14) return 'noon';
        if (hour >= 14 && hour < 18) return 'afternoon';
        if (hour >= 18 && hour < 21) return 'evening';
        return 'night';
    }

    /**
     * 获取世界摘要
     */
    getSummary() {
        return {
            agentCount: this.agents.size,
            buildingCount: this.buildings.size,
            decorationCount: this.decorations.size,
            time: this.time,
            dayNumber: this.dayNumber,
            gameHours: this.getGameHours().toFixed(1),
            dayNightPhase: this.getDayNightPhase(),
            weather: this.weather
        };
    }

    /**
     * 添加变化监听器
     */
    addChangeListener(callback) {
        this.listeners.add(callback);
        return () => this.listeners.delete(callback);
    }

    /**
     * 通知变化
     */
    notifyChange() {
        const summary = this.getSummary();
        for (const callback of this.listeners) {
            try {
                callback(summary);
            } catch (err) {
                console.error('[WorldState] Listener error:', err);
            }
        }
        eventBus.emit(Events.WORLD_STATE_UPDATE, summary);
    }

    /**
     * 清空所有数据
     */
    clear() {
        this.agents.clear();
        this.buildings.clear();
        this.decorations.clear();
        this.objects.clear();
        this.time = 0;
        this.notifyChange();
    }

    /**
     * 导出状态
     */
    toJSON() {
        return {
            agents: Array.from(this.agents.values()),
            buildings: Array.from(this.buildings.values()),
            decorations: Array.from(this.decorations.values()),
            time: this.time,
            weather: this.weather
        };
    }

    /**
     * 从导入恢复状态
     */
    fromJSON(data) {
        this.clear();
        if (data.agents) {
            data.agents.forEach(a => this.addAgent(a));
        }
        if (data.buildings) {
            data.buildings.forEach(b => this.addBuilding(b));
        }
        if (data.decorations) {
            data.decorations.forEach(d => this.addDecoration(d));
        }
        if (data.time !== undefined) {
            this.time = data.time;
        }
        if (data.weather) {
            this.weather = data.weather;
        }
        this.notifyChange();
    }
}

// 单例
const worldState = new WorldState();

export { WorldState, worldState };
