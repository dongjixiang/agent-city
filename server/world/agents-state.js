/**
 * AgentsState - 智能体状态管理
 * 
 * 负责：
 * - 智能体状态存储
 * - 智能体位置验证
 * - 智能体移动处理
 */

class AgentsState {
    constructor(worldState) {
        this.worldState = worldState;
        
        // 智能体存储
        this.agents = new Map();
        
        // 智能体半径（用于碰撞检测）
        this.agentRadius = 1.0;
    }
    
    /**
     * 注册智能体
     */
    registerAgent(agentId, initialPosition) {
        if (this.agents.has(agentId)) {
            return { success: false, reason: "Agent already exists" };
        }
        
        const agent = new AgentState(agentId, initialPosition);
        this.agents.set(agentId, agent);
        
        return { success: true, agent };
    }
    
    /**
     * 注销智能体
     */
    unregisterAgent(agentId) {
        if (!this.agents.has(agentId)) {
            return { success: false, reason: "Agent not found" };
        }
        
        const agent = this.agents.get(agentId);
        this.agents.delete(agentId);
        
        return { success: true, agent };
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
     * 验证移动
     * @returns { valid: boolean, reason?: string }
     */
    validateMove(agentId, newPosition) {
        const agent = this.agents.get(agentId);
        if (!agent) {
            return { valid: false, reason: "Agent not found" };
        }
        
        if (!agent.isAlive) {
            return { valid: false, reason: "Agent is dead" };
        }
        
        const { x, z } = newPosition;
        
        // 1. 检查世界边界
        if (!this.worldState.terrain.isInBounds(x, z)) {
            return { valid: false, reason: "Out of world bounds" };
        }
        
        // 2. 检查地形是否可通行
        if (!this.worldState.terrain.isWalkable(x, z)) {
            return { valid: false, reason: "Terrain not walkable" };
        }
        
        // 3. 检查是否与建筑碰撞
        const building = this.worldState.buildings.getBuildingAtPoint(x, z);
        if (building) {
            return { valid: false, reason: `Blocked by building ${building.id}` };
        }
        
        // 4. 检查与其他智能体的碰撞
        for (const [otherId, other] of this.agents) {
            if (otherId === agentId || !other.isAlive) continue;
            
            const dist = Math.hypot(other.position.x - x, other.position.z - z);
            if (dist < this.agentRadius * 2) {
                return { valid: false, reason: `Blocked by agent ${otherId}` };
            }
        }
        
        return { valid: true };
    }
    
    /**
     * 更新智能体位置
     */
    updatePosition(agentId, position) {
        // 先验证
        const validation = this.validateMove(agentId, position);
        if (!validation.valid) {
            return { success: false, reason: validation.reason };
        }
        
        const agent = this.agents.get(agentId);
        agent.updatePosition(position);
        
        return { success: true, position: agent.position };
    }
    
    /**
     * 更新智能体形态
     */
    updateForm(agentId, form) {
        const agent = this.agents.get(agentId);
        if (!agent) {
            return { success: false, reason: "Agent not found" };
        }
        
        agent.form = form;
        return { success: true, form };
    }
    
    /**
     * 智能体受到伤害
     */
    damage(agentId, amount, attackerId) {
        const agent = this.agents.get(agentId);
        if (!agent) {
            return { success: false, reason: "Agent not found" };
        }
        
        if (!agent.isAlive) {
            return { success: false, reason: "Agent is already dead" };
        }
        
        agent.health -= amount;
        
        if (agent.health <= 0) {
            agent.health = 0;
            agent.isAlive = false;
            agent.deathTime = Date.now();
            
            return {
                success: true,
                killed: true,
                attackerId,
                health: 0
            };
        }
        
        return {
            success: true,
            killed: false,
            health: agent.health
        };
    }
    
    /**
     * 复活智能体
     */
    respawn(agentId, position) {
        const agent = this.agents.get(agentId);
        if (!agent) {
            return { success: false, reason: "Agent not found" };
        }
        
        if (agent.isAlive) {
            return { success: false, reason: "Agent is already alive" };
        }
        
        // 重置状态
        agent.isAlive = true;
        agent.health = agent.maxHealth;
        agent.position = { ...position };
        agent.deathTime = null;
        
        return { success: true, agent };
    }
    
    /**
     * 获取智能体状态
     */
    getState(agentId) {
        const agent = this.agents.get(agentId);
        if (!agent) return null;
        return agent.toJSON();
    }
    
    /**
     * 获取所有智能体状态
     */
    getAllStates() {
        return Array.from(this.agents.values()).map(a => a.toJSON());
    }
}

/**
 * 智能体状态
 */
class AgentState {
    constructor(agentId, initialPosition) {
        this.agentId = agentId;
        this.position = { ...initialPosition };
        this.rotation = 0;          // 朝向（弧度）
        this.form = "robot";       // 形态: robot, car, tank
        this.health = 100;
        this.maxHealth = 100;
        this.isAlive = true;
        this.velocity = { x: 0, z: 0 };
        this.animation = "idle";
        this.lastUpdate = Date.now();
        this.deathTime = null;
        
        // 可选属性
        this.name = agentId;
        this.type = "agent";
    }
    
    updatePosition(newPosition) {
        this.position = { ...newPosition };
        this.lastUpdate = Date.now();
    }
    
    updateRotation(rotation) {
        this.rotation = rotation;
        this.lastUpdate = Date.now();
    }
    
    updateVelocity(velocity) {
        this.velocity = { ...velocity };
    }
    
    setAnimation(animation) {
        this.animation = animation;
    }
    
    toJSON() {
        return {
            agentId: this.agentId,
            name: this.name,
            type: this.type,
            position: this.position,
            rotation: this.rotation,
            form: this.form,
            health: this.health,
            maxHealth: this.maxHealth,
            isAlive: this.isAlive,
            velocity: this.velocity,
            animation: this.animation,
            lastUpdate: this.lastUpdate
        };
    }
}

module.exports = AgentsState;
