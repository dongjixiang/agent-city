/**
 * ContextBuilder - 上下文构建器
 * 
 * 负责收集智能体的环境上下文：
 * 1. 自身状态（位置、心情、能量等）
 * 2. 周边环境（智能体、建筑、物体）
 * 3. 城市状态（天气、时间等）
 * 4. 触发原因
 */

class ContextBuilder {
    constructor(cityState, agentRegistry) {
        this.cityState = cityState;
        this.agentRegistry = agentRegistry;
        
        // 感知范围（米）
        this.SENSE_RANGE = 50;
        
        // 建筑感知范围（米，更大）
        this.BUILDING_SENSE_RANGE = 100;
    }

    /**
     * 构建环境上下文
     */
    build(event) {
        const agent = this.getAgent(event.agentId);
        if (!agent) {
            console.log(`[ContextBuilder] 智能体 ${event.agentId} 不存在`);
            return null;
        }

        return {
            self: this.buildSelfInfo(agent),
            nearby: this.buildNearbyInfo(agent),
            city: this.buildCityInfo(),
            trigger: this.buildTrigger(event)
        };
    }

    /**
     * 获取智能体信息
     */
    getAgent(agentId) {
        if (this.agentRegistry) {
            return this.agentRegistry.getAgent(agentId);
        }
        return null;
    }

    /**
     * 构建自身信息
     */
    buildSelfInfo(agent) {
        return {
            id: agent.id || agent.agentId,
            name: agent.name || '未知',
            position: { 
                x: typeof agent.x === 'number' ? agent.x : (agent.position?.x || 0),
                z: typeof agent.z === 'number' ? agent.z : (agent.position?.z || 0)
            },
            state: agent.state || 'idle',
            mood: agent.mood || 'neutral',
            reputation: agent.reputation || 0,
            level: agent.level || 1,
            skills: this.getAgentSkills(agent),
            energy: agent.energy || 100,
            social: agent.social || 50,
            lastAction: agent.lastAction || null
        };
    }

    /**
     * 获取智能体技能列表
     */
    getAgentSkills(agent) {
        // 默认技能列表
        const defaultSkills = ['goTo', 'sendMessage', 'broadcast', 'think', 'stay', 'explore', 'interact', 'respond'];
        
        if (agent.skills && Array.isArray(agent.skills)) {
            return [...defaultSkills, ...agent.skills];
        }
        
        return defaultSkills;
    }

    /**
     * 构建周边环境信息
     */
    buildNearbyInfo(agent) {
        const nearby = {
            agents: [],
            objects: [],
            buildings: []
        };

        const agentX = typeof agent.x === 'number' ? agent.x : (agent.position?.x || 0);
        const agentZ = typeof agent.z === 'number' ? agent.z : (agent.position?.z || 0);

        // 附近的智能体
        if (this.agentRegistry) {
            for (const other of this.agentRegistry.getOnlineAgents()) {
                if (other.id === agent.id || other.agentId === agent.id) continue;
                
                const otherX = typeof other.x === 'number' ? other.x : (other.position?.x || 0);
                const otherZ = typeof other.z === 'number' ? other.z : (other.position?.z || 0);
                
                const dist = this.distance(agentX, agentZ, otherX, otherZ);
                
                if (dist <= this.SENSE_RANGE) {
                    nearby.agents.push({
                        id: other.id || other.agentId,
                        name: other.name || '未知',
                        position: { x: otherX, z: otherZ },
                        distance: Math.round(dist * 10) / 10,
                        state: other.state || 'idle',
                        mood: other.mood || 'neutral'
                    });
                }
            }
        }

        // 附近的物体（从 cityState 获取）
        if (this.cityState && this.cityState.objects) {
            for (const obj of this.cityState.objects) {
                const objX = obj.position?.x || obj.x || 0;
                const objZ = obj.position?.z || obj.z || 0;
                const dist = this.distance(agentX, agentZ, objX, objZ);
                
                if (dist <= this.SENSE_RANGE) {
                    nearby.objects.push({
                        type: obj.type || 'unknown',
                        id: obj.id || obj.type,
                        position: { x: objX, z: objZ },
                        distance: Math.round(dist * 10) / 10
                    });
                }
            }
        }

        // 附近的建筑（从 cityState 获取）
        if (this.cityState && this.cityState.buildings) {
            for (const building of this.cityState.buildings) {
                const bldX = building.position?.x || building.x || 0;
                const bldZ = building.position?.z || building.z || 0;
                const dist = this.distance(agentX, agentZ, bldX, bldZ);
                
                if (dist <= this.BUILDING_SENSE_RANGE) {
                    nearby.buildings.push({
                        type: building.type || 'unknown',
                        id: building.id || building.type,
                        position: { x: bldX, z: bldZ },
                        distance: Math.round(dist * 10) / 10,
                        description: building.description || ''
                    });
                }
            }
        }

        return nearby;
    }

    /**
     * 构建城市状态信息
     */
    buildCityInfo() {
        const info = {
            weather: 'sunny',
            temperature: 20,
            timeOfDay: 'morning',
            onlineAgentCount: 0,
            totalVisitorsToday: 0,
            activeTasks: 0,
            announcements: []
        };

        if (this.cityState) {
            if (this.cityState.weather) {
                info.weather = this.cityState.weather;
            }
            if (this.cityState.temperature !== undefined) {
                info.temperature = this.cityState.temperature;
            }
            if (this.cityState.timeOfDay) {
                info.timeOfDay = this.cityState.timeOfDay;
            }
            if (this.cityState.visitorsToday !== undefined) {
                info.totalVisitorsToday = this.cityState.visitorsToday;
            }
            if (this.cityState.activeTasks !== undefined) {
                info.activeTasks = this.cityState.activeTasks;
            }
            if (this.cityState.announcements) {
                info.announcements = this.cityState.announcements;
            }
        }

        if (this.agentRegistry) {
            info.onlineAgentCount = this.agentRegistry.getOnlineAgentCount();
        }

        return info;
    }

    /**
     * 构建触发原因
     */
    buildTrigger(event) {
        const trigger = {
            type: event.type,
            priority: event.priority
        };

        // 根据事件类型添加额外字段
        switch (event.type) {
            case 'USER_MESSAGE':
                trigger.message = event.data;
                break;
            case 'AGENT_ENTER':
                trigger.newAgent = event.data?.newAgent;
                break;
            case 'AGENT_LEAVE':
                trigger.leftAgent = event.data?.leftAgent;
                break;
            case 'WEATHER_CHANGE':
                trigger.weatherChange = event.data;
                break;
            case 'BROADCAST':
                trigger.broadcast = event.data;
                break;
            case 'TASK_AVAILABLE':
                trigger.task = event.data;
                break;
            case 'PERIODIC_SNAPSHOT':
                // 定期快照不需要额外字段
                break;
        }

        return trigger;
    }

    /**
     * 计算两点距离
     */
    distance(x1, z1, x2, z2) {
        return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(z1 - z2, 2));
    }
}

module.exports = ContextBuilder;
