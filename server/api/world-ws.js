/**
 * World WebSocket Handler
 * 
 * 处理世界状态的 WebSocket 实时同步
 */

const { getWorldStateInstance } = require('./world-api');

class WorldWebSocketHandler {
    constructor(wss) {
        this.wss = wss;
        this.world = getWorldStateInstance();
        this.clients = new Set();
        
        // 注册世界状态事件监听
        this.setupEventListeners();
        
        console.log('[WorldWS] WebSocket 处理器初始化完成');
    }
    
    /**
     * 设置事件监听
     */
    setupEventListeners() {
        // 世界更新事件
        this.world.on('world:update', (data) => {
            this.broadcast({
                type: 'world:update',
                data: {
                    time: data.time,
                    weather: data.weather
                }
            });
        });
        
        // 建筑添加事件
        this.world.on('building:added', (building) => {
            this.broadcast({
                type: 'building:added',
                data: building.toJSON()
            });
        });
        
        // 建筑删除事件
        this.world.on('building:removed', (data) => {
            this.broadcast({
                type: 'building:removed',
                data: data
            });
        });
        
        // 智能体移动事件
        this.world.on('agent:moved', (data) => {
            this.broadcast({
                type: 'agent:moved',
                data: data
            });
        });
    }
    
    /**
     * 处理新连接
     */
    handleConnection(ws, req) {
        const clientId = this.generateClientId();
        ws.clientId = clientId;
        this.clients.add(ws);
        
        console.log(`[WorldWS] 客户端连接: ${clientId}, 总数: ${this.clients.size}`);
        
        // 发送当前世界状态
        ws.send(JSON.stringify({
            type: 'world:init',
            data: this.world.getState()
        }));
        
        ws.on('close', () => {
            this.clients.delete(ws);
            console.log(`[WorldWS] 客户端断开: ${clientId}, 剩余: ${this.clients.size}`);
        });
        
        ws.on('message', (message) => {
            try {
                const msg = JSON.parse(message);
                this.handleMessage(ws, msg);
            } catch (error) {
                console.error('[WorldWS] 消息解析错误:', error);
            }
        });
    }
    
    /**
     * 处理消息
     */
    handleMessage(ws, msg) {
        switch (msg.type) {
            case 'world:request':
                // 客户端请求完整世界状态
                ws.send(JSON.stringify({
                    type: 'world:state',
                    data: this.world.getState()
                }));
                break;
                
            case 'world:subscribe':
                // 客户端订阅特定区域
                // TODO: 实现区域订阅
                break;
                
            case 'agent:move':
                // 智能体移动请求
                this.handleAgentMove(ws, msg);
                break;
                
            case 'agent:register':
                // 智能体注册
                this.handleAgentRegister(ws, msg);
                break;
                
            default:
                console.log(`[WorldWS] 未知消息类型: ${msg.type}`);
        }
    }
    
    /**
     * 处理智能体移动
     */
    handleAgentMove(ws, msg) {
        const { agentId, position } = msg;
        
        if (!agentId || !position) {
            ws.send(JSON.stringify({
                type: 'agent:move:result',
                data: { success: false, reason: 'Missing agentId or position' }
            }));
            return;
        }
        
        const result = this.world.updateAgentPosition(agentId, position);
        
        ws.send(JSON.stringify({
            type: 'agent:move:result',
            data: {
                success: result.success,
                reason: result.reason,
                position: result.position
            }
        }));
        
        // 如果成功，广播给所有客户端
        if (result.success) {
            this.broadcast({
                type: 'agent:moved',
                data: { agentId, position: result.position }
            });
        }
    }
    
    /**
     * 处理智能体注册
     */
    handleAgentRegister(ws, msg) {
        const { agentId, position } = msg;
        
        if (!agentId) {
            ws.send(JSON.stringify({
                type: 'agent:register:result',
                data: { success: false, reason: 'Missing agentId' }
            }));
            return;
        }
        
        const result = this.world.agents.registerAgent(agentId, position || { x: 0, z: 0 });
        
        ws.send(JSON.stringify({
            type: 'agent:register:result',
            data: {
                success: result.success,
                reason: result.reason,
                agent: result.agent ? result.agent.toJSON() : null
            }
        }));
    }
    
    /**
     * 广播消息到所有客户端
     */
    broadcast(message) {
        const data = JSON.stringify(message);
        for (const client of this.clients) {
            if (client.readyState === 1) { // OPEN
                client.send(data);
            }
        }
    }
    
    /**
     * 生成客户端ID
     */
    generateClientId() {
        return 'client_' + Math.random().toString(36).substr(2, 9);
    }
    
    /**
     * 启动世界状态更新循环
     */
    startUpdateLoop() {
        let lastTime = Date.now();
        
        setInterval(() => {
            const now = Date.now();
            const deltaTime = now - lastTime;
            lastTime = now;
            
            // 更新世界状态
            this.world.tick(deltaTime);
        }, 1000); // 每秒更新一次
    }
}

/**
 * 初始化 World WebSocket Handler
 */
function initWorldWebSocket(wss) {
    const handler = new WorldWebSocketHandler(wss);
    handler.startUpdateLoop();
    return handler;
}

module.exports = { initWorldWebSocket };
