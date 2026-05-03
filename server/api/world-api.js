/**
 * World API - HTTP API 路由
 * 
 * 提供世界状态的 HTTP 接口
 */

const WorldState = require('../world/world-state');

// 创建世界状态单例
let worldState = null;

function getWorldState() {
    if (!worldState) {
        worldState = new WorldState();
    }
    return worldState;
}

/**
 * 注册 API 路由
 */
function registerRoutes(app) {
    const world = getWorldState();
    
    // ========== 世界状态 ==========
    
    /**
     * GET /api/world/state
     * 获取完整世界状态
     */
    app.get('/api/world/state', (req, res) => {
        try {
            const state = world.getState();
            res.json({
                success: true,
                data: state
            });
        } catch (error) {
            console.error('[WorldAPI] Error getting world state:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    });
    
    /**
     * GET /api/world/summary
     * 获取世界状态摘要（用于增量更新）
     */
    app.get('/api/world/summary', (req, res) => {
        try {
            const summary = world.getSummary();
            res.json({
                success: true,
                data: summary
            });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });
    
    // ========== 地形 ==========
    
    /**
     * GET /api/world/terrain
     * 获取地形数据
     */
    app.get('/api/world/terrain', (req, res) => {
        try {
            const terrain = world.terrain.getState();
            res.json({
                success: true,
                data: terrain
            });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });
    
    /**
     * GET /api/world/terrain/walkable?x=100&z=100
     * 检查位置是否可通行
     */
    app.get('/api/world/terrain/walkable', (req, res) => {
        const { x, z } = req.query;
        if (x === undefined || z === undefined) {
            return res.status(400).json({ success: false, error: 'Missing x or z' });
        }
        
        const walkable = world.terrain.isWalkable(parseFloat(x), parseFloat(z));
        res.json({ success: true, data: { walkable } });
    });
    
    // ========== 建筑 ==========
    
    /**
     * GET /api/world/buildings
     * 获取所有建筑
     */
    app.get('/api/world/buildings', (req, res) => {
        try {
            const buildings = world.buildings.getState();
            res.json({
                success: true,
                data: buildings
            });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });
    
    /**
     * GET /api/world/buildings/:id
     * 获取指定建筑
     */
    app.get('/api/world/buildings/:id', (req, res) => {
        const building = world.buildings.getBuilding(req.params.id);
        if (!building) {
            return res.status(404).json({ success: false, error: 'Building not found' });
        }
        res.json({ success: true, data: building.toJSON() });
    });
    
    /**
     * POST /api/world/buildings
     * 创建建筑
     */
    app.post('/api/world/buildings', (req, res) => {
        try {
            const result = world.addBuilding(req.body);
            if (!result.success) {
                return res.status(400).json({ success: false, error: result.reason });
            }
            res.json({ success: true, data: result.building.toJSON() });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });
    
    /**
     * DELETE /api/world/buildings/:id
     * 删除建筑
     */
    app.delete('/api/world/buildings/:id', (req, res) => {
        const result = world.removeBuilding(req.params.id);
        if (!result.success) {
            return res.status(404).json({ success: false, error: result.reason });
        }
        res.json({ success: true, data: result.building });
    });
    
    /**
     * GET /api/world/buildings/nearby?x=100&z=100&radius=50
     * 获取附近的建筑
     */
    app.get('/api/world/buildings/nearby', (req, res) => {
        const { x, z, radius } = req.query;
        if (x === undefined || z === undefined || radius === undefined) {
            return res.status(400).json({ success: false, error: 'Missing parameters' });
        }
        
        const buildings = world.getBuildingsInArea(
            parseFloat(x),
            parseFloat(z),
            parseFloat(radius)
        );
        
        res.json({ success: true, data: buildings });
    });
    
    // ========== 装饰物 ==========
    
    /**
     * GET /api/world/decorations
     * 获取所有装饰物
     */
    app.get('/api/world/decorations', (req, res) => {
        try {
            const decorations = world.decorations.getState();
            res.json({
                success: true,
                data: decorations
            });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });
    
    /**
     * GET /api/world/decorations/nearby?x=100&z=100&radius=50
     * 获取附近的装饰物
     */
    app.get('/api/world/decorations/nearby', (req, res) => {
        const { x, z, radius } = req.query;
        if (x === undefined || z === undefined || radius === undefined) {
            return res.status(400).json({ success: false, error: 'Missing parameters' });
        }
        
        const decorations = world.decorations.getDecorationsInArea(
            parseFloat(x),
            parseFloat(z),
            parseFloat(radius)
        );
        
        res.json({ success: true, data: decorations });
    });
    
    // ========== 智能体 ==========
    
    /**
     * GET /api/agents/:id/state
     * 获取智能体状态
     */
    app.get('/api/agents/:id/state', (req, res) => {
        const state = world.agents.getState(req.params.id);
        if (!state) {
            return res.status(404).json({ success: false, error: 'Agent not found' });
        }
        res.json({ success: true, data: state });
    });
    
    /**
     * POST /api/agents/register
     * 注册智能体
     */
    app.post('/api/agents/register', (req, res) => {
        const { agentId, position } = req.body;
        if (!agentId || !position) {
            return res.status(400).json({ success: false, error: 'Missing agentId or position' });
        }
        
        const result = world.agents.registerAgent(agentId, position);
        if (!result.success) {
            return res.status(400).json({ success: false, error: result.reason });
        }
        
        res.json({ success: true, data: result.agent.toJSON() });
    });
    
    /**
     * PATCH /api/agents/:id/position
     * 更新智能体位置（带验证）
     */
    app.patch('/api/agents/:id/position', (req, res) => {
        const { position } = req.body;
        if (!position) {
            return res.status(400).json({ success: false, error: 'Missing position' });
        }
        
        const result = world.updateAgentPosition(req.params.id, position);
        if (!result.success) {
            return res.status(400).json({ success: false, error: result.reason });
        }
        
        res.json({ success: true, data: { position: result.position } });
    });
    
    /**
     * POST /api/agents/:id/validate-move
     * 验证移动（不实际移动）
     */
    app.post('/api/agents/:id/validate-move', (req, res) => {
        const { position } = req.body;
        if (!position) {
            return res.status(400).json({ success: false, error: 'Missing position' });
        }
        
        const result = world.validateAgentMove(req.params.id, position);
        res.json({
            success: true,
            data: {
                valid: result.valid,
                reason: result.reason
            }
        });
    });
    
    // ========== 时间/天气 ==========
    
    /**
     * GET /api/world/time
     * 获取当前时间
     */
    app.get('/api/world/time', (req, res) => {
        res.json({
            success: true,
            data: world.timeSystem.getState()
        });
    });
    
    /**
     * POST /api/world/time
     * 设置时间
     */
    app.post('/api/world/time', (req, res) => {
        const { hour, minute, speed } = req.body;
        
        if (hour !== undefined) {
            world.timeSystem.setTime(hour, minute || 0);
        }
        if (speed !== undefined) {
            world.timeSystem.setSpeed(speed);
        }
        
        res.json({
            success: true,
            data: world.timeSystem.getState()
        });
    });
    
    /**
     * GET /api/world/weather
     * 获取当前天气
     */
    app.get('/api/world/weather', (req, res) => {
        res.json({
            success: true,
            data: world.weatherSystem.getState()
        });
    });
    
    /**
     * POST /api/world/weather
     * 设置天气
     */
    app.post('/api/world/weather', (req, res) => {
        const { type, duration } = req.body;
        if (!type) {
            return res.status(400).json({ success: false, error: 'Missing weather type' });
        }
        
        const success = world.weatherSystem.setWeather(type, duration);
        res.json({
            success,
            data: world.weatherSystem.getState()
        });
    });
    
    console.log('[WorldAPI] 路由注册完成');
}

/**
 * 获取世界状态实例（供 WebSocket 使用）
 */
function getWorldStateInstance() {
    return getWorldState();
}

module.exports = {
    registerRoutes,
    getWorldStateInstance
};
