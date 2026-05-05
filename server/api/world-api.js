/**
 * World API - HTTP API 路由
 * 
 * 提供世界状态的 HTTP 接口
 * 使用 HTTPHandler 的 this.get/post/put/delete/patch 方法
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
function registerRoutes(httpHandler) {
    const world = getWorldState();
    
    // ========== 世界状态 ==========
    
    /**
     * GET /api/world/state
     * 获取完整世界状态
     */
    httpHandler.get('/api/world/state', async (req, res) => {
        try {
            const state = world.getState();
            httpHandler.sendJson(res, { success: true, data: state });
        } catch (error) {
            console.error('[WorldAPI] Error getting world state:', error);
            httpHandler.sendError(res, 500, 'Internal Server Error', error.message);
        }
    });
    
    /**
     * GET /api/world/summary
     * 获取世界状态摘要（用于增量更新）
     */
    httpHandler.get('/api/world/summary', async (req, res) => {
        try {
            const summary = world.getSummary();
            httpHandler.sendJson(res, { success: true, data: summary });
        } catch (error) {
            httpHandler.sendError(res, 500, 'Internal Server Error', error.message);
        }
    });
    
    // ========== 地形 ==========
    
    /**
     * GET /api/world/terrain
     * 获取地形数据
     */
    httpHandler.get('/api/world/terrain', async (req, res) => {
        try {
            const terrain = world.terrain.getState();
            httpHandler.sendJson(res, { success: true, data: terrain });
        } catch (error) {
            httpHandler.sendError(res, 500, 'Internal Server Error', error.message);
        }
    });
    
    /**
     * GET /api/world/terrain/walkable?x=100&z=100
     * 检查位置是否可通行
     */
    httpHandler.get('/api/world/terrain/walkable', async (req, res, { query }) => {
        const { x, z } = query;
        if (x === undefined || z === undefined) {
            return httpHandler.sendError(res, 400, 'Bad Request', 'Missing x or z');
        }
        
        const walkable = world.terrain.isWalkable(parseFloat(x), parseFloat(z));
        httpHandler.sendJson(res, { success: true, data: { walkable } });
    });
    
    // ========== 建筑 ==========
    
    /**
     * GET /api/world/buildings
     * 获取所有建筑
     */
    httpHandler.get('/api/world/buildings', async (req, res) => {
        try {
            const buildings = world.buildings.getState();
            httpHandler.sendJson(res, { success: true, data: buildings });
        } catch (error) {
            httpHandler.sendError(res, 500, 'Internal Server Error', error.message);
        }
    });
    
    /**
     * GET /api/world/buildings/:id
     * 获取指定建筑
     */
    httpHandler.get('/api/world/buildings/:id', async (req, res, { params }) => {
        const building = world.buildings.getBuilding(params.id);
        if (!building) {
            return httpHandler.sendError(res, 404, 'Not Found', 'Building not found');
        }
        httpHandler.sendJson(res, { success: true, data: building.toJSON() });
    });
    
    /**
     * POST /api/world/buildings
     * 创建建筑
     */
    httpHandler.post('/api/world/buildings', async (req, res, { body }) => {
        try {
            const result = world.addBuilding(body);
            if (!result.success) {
                return httpHandler.sendError(res, 400, 'Bad Request', result.reason);
            }
            httpHandler.sendJson(res, { success: true, data: result.building.toJSON() }, 201);
        } catch (error) {
            httpHandler.sendError(res, 500, 'Internal Server Error', error.message);
        }
    });
    
    /**
     * DELETE /api/world/buildings/:id
     * 删除建筑
     */
    httpHandler.delete('/api/world/buildings/:id', async (req, res, { params }) => {
        const result = world.removeBuilding(params.id);
        if (!result.success) {
            return httpHandler.sendError(res, 404, 'Not Found', result.reason);
        }
        httpHandler.sendJson(res, { success: true, data: result.building });
    });
    
    /**
     * GET /api/world/buildings/nearby?x=100&z=100&radius=50
     * 获取附近的建筑
     */
    httpHandler.get('/api/world/buildings/nearby', async (req, res, { query }) => {
        const { x, z, radius } = query;
        if (x === undefined || z === undefined || radius === undefined) {
            return httpHandler.sendError(res, 400, 'Bad Request', 'Missing parameters');
        }
        
        const buildings = world.getBuildingsInArea(
            parseFloat(x),
            parseFloat(z),
            parseFloat(radius)
        );
        
        httpHandler.sendJson(res, { success: true, data: buildings });
    });
    
    // ========== 装饰物 ==========
    
    /**
     * GET /api/world/decorations
     * 获取所有装饰物
     */
    httpHandler.get('/api/world/decorations', async (req, res) => {
        try {
            const decorations = world.decorations.getState();
            httpHandler.sendJson(res, { success: true, data: decorations });
        } catch (error) {
            httpHandler.sendError(res, 500, 'Internal Server Error', error.message);
        }
    });
    
    /**
     * GET /api/world/decorations/nearby?x=100&z=100&radius=50
     * 获取附近的装饰物
     */
    httpHandler.get('/api/world/decorations/nearby', async (req, res, { query }) => {
        const { x, z, radius } = query;
        if (x === undefined || z === undefined || radius === undefined) {
            return httpHandler.sendError(res, 400, 'Bad Request', 'Missing parameters');
        }
        
        const decorations = world.decorations.getDecorationsInArea(
            parseFloat(x),
            parseFloat(z),
            parseFloat(radius)
        );
        
        httpHandler.sendJson(res, { success: true, data: decorations });
    });
    
    // ========== 智能体 ==========
    
    /**
     * GET /api/agents/:id/state
     * 获取智能体状态
     */
    httpHandler.get('/api/agents/:id/state', async (req, res, { params }) => {
        const state = world.agents.getState(params.id);
        if (!state) {
            return httpHandler.sendError(res, 404, 'Not Found', 'Agent not found');
        }
        httpHandler.sendJson(res, { success: true, data: state });
    });
    
    /**
     * POST /api/agents/register
     * 注册智能体
     */
    httpHandler.post('/api/agents/register', async (req, res, { body }) => {
        const { agentId, position } = body;
        if (!agentId || !position) {
            return httpHandler.sendError(res, 400, 'Bad Request', 'Missing agentId or position');
        }
        
        const result = world.agents.registerAgent(agentId, position);
        if (!result.success) {
            return httpHandler.sendError(res, 400, 'Bad Request', result.reason);
        }
        
        httpHandler.sendJson(res, { success: true, data: result.agent.toJSON() }, 201);
    });
    
    /**
     * PATCH /api/agents/:id/position
     * 更新智能体位置（带验证）
     */
    httpHandler.patch('/api/agents/:id/position', async (req, res, { params, body }) => {
        const { position } = body;
        if (!position) {
            return httpHandler.sendError(res, 400, 'Bad Request', 'Missing position');
        }
        
        const result = world.updateAgentPosition(params.id, position);
        if (!result.success) {
            return httpHandler.sendError(res, 400, 'Bad Request', result.reason);
        }
        
        httpHandler.sendJson(res, { success: true, data: { position: result.position } });
    });
    
    /**
     * POST /api/agents/:id/validate-move
     * 验证移动（不实际移动）
     */
    httpHandler.post('/api/agents/:id/validate-move', async (req, res, { params, body }) => {
        const { position } = body;
        if (!position) {
            return httpHandler.sendError(res, 400, 'Bad Request', 'Missing position');
        }
        
        const result = world.validateAgentMove(params.id, position);
        httpHandler.sendJson(res, {
            success: true,
            data: {
                valid: result.valid,
                reason: result.reason
            }
        });
    });
    
    // ========== 实体（变形金刚、狗、牛） ==========
    
    /**
     * GET /api/entities
     * 获取所有实体状态
     */
    httpHandler.get('/api/entities', async (req, res) => {
        try {
            const entities = world.entities.getState();
            httpHandler.sendJson(res, { success: true, data: entities });
        } catch (error) {
            httpHandler.sendError(res, 500, 'Internal Server Error', error.message);
        }
    });
    
    /**
     * GET /api/entities/:id
     * 获取指定实体状态
     */
    httpHandler.get('/api/entities/:id', async (req, res, { params }) => {
        const entity = world.entities.getEntity(params.id);
        if (!entity) {
            return httpHandler.sendError(res, 404, 'Not Found', 'Entity not found');
        }
        httpHandler.sendJson(res, { success: true, data: entity });
    });
    
    /**
     * PATCH /api/entities/:id/position
     * 更新实体位置（带边界验证）
     */
    httpHandler.patch('/api/entities/:id/position', async (req, res, { params, body }) => {
        const { position, rotation } = body;
        if (!position) {
            return httpHandler.sendError(res, 400, 'Bad Request', 'Missing position');
        }
        
        const result = world.entities.updatePosition(params.id, position, rotation);
        if (!result.success) {
            return httpHandler.sendError(res, 400, 'Bad Request', result.reason);
        }
        
        httpHandler.sendJson(res, { success: true, data: { position: result.position } });
    });
    
    /**
     * POST /api/entities/:id/validate-move
     * 验证移动（不实际移动）
     */
    httpHandler.post('/api/entities/:id/validate-move', async (req, res, { params, body }) => {
        const { position } = body;
        if (!position) {
            return httpHandler.sendError(res, 400, 'Bad Request', 'Missing position');
        }
        
        const result = world.entities.validateMove(params.id, position);
        httpHandler.sendJson(res, {
            success: true,
            data: { valid: result.valid, reason: result.reason }
        });
    });
    
    // ========== 时间/天气 ==========
    
    /**
     * GET /api/world/time
     * 获取当前时间
     */
    httpHandler.get('/api/world/time', async (req, res) => {
        httpHandler.sendJson(res, { success: true, data: world.timeSystem.getState() });
    });
    
    /**
     * POST /api/world/time
     * 设置时间
     */
    httpHandler.post('/api/world/time', async (req, res, { body }) => {
        const { hour, minute, speed } = body;
        
        if (hour !== undefined) {
            world.timeSystem.setTime(hour, minute || 0);
        }
        if (speed !== undefined) {
            world.timeSystem.setSpeed(speed);
        }
        
        httpHandler.sendJson(res, { success: true, data: world.timeSystem.getState() });
    });
    
    /**
     * GET /api/world/weather
     * 获取当前天气
     */
    httpHandler.get('/api/world/weather', async (req, res) => {
        httpHandler.sendJson(res, { success: true, data: world.weatherSystem.getState() });
    });
    
    /**
     * POST /api/world/weather
     * 设置天气
     */
    httpHandler.post('/api/world/weather', async (req, res, { body }) => {
        const { type, duration } = body;
        if (!type) {
            return httpHandler.sendError(res, 400, 'Bad Request', 'Missing weather type');
        }
        
        const success = world.weatherSystem.setWeather(type, duration);
        httpHandler.sendJson(res, { success, data: world.weatherSystem.getState() });
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
