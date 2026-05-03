/**
 * WorldLoader - 从服务端加载世界状态
 * 
 * 职责：
 * - 从服务端 API 获取世界状态
 * - 解析建筑、装饰物数据
 * - 提供渲染所需的数据结构
 */

class WorldLoader {
    constructor() {
        this.worldState = null;
        this.buildings = [];
        this.decorations = {
            trees: [],
            flowers: [],
            benches: [],
            lamps: [],
            fountains: []
        };
        this.terrain = null;
        this.time = null;
        this.weather = null;
        this.loaded = false;
    }
    
    /**
     * 从服务端加载完整世界状态
     */
    async load() {
        console.log('[WorldLoader] 开始加载世界状态...');
        
        try {
            const response = await fetch('/api/world/state');
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            if (!result.success) {
                throw new Error(result.error || '加载失败');
            }
            
            this.worldState = result.data;
            this.parseWorldState(this.worldState);
            this.loaded = true;
            
            console.log('[WorldLoader] 世界状态加载完成');
            console.log(`  - 建筑: ${this.buildings.length}`);
            console.log(`  - 树木: ${this.decorations.trees.length}`);
            console.log(`  - 时间: ${this.time?.formattedTime}`);
            console.log(`  - 天气: ${this.weather?.name}`);
            
            return true;
        } catch (error) {
            console.error('[WorldLoader] 加载失败:', error);
            return false;
        }
    }
    
    /**
     * 解析世界状态
     */
    parseWorldState(state) {
        // 解析建筑
        this.buildings = (state.buildings || []).map(b => ({
            id: b.id,
            type: b.type,
            name: b.name,
            position: b.position,
            size: b.size,
            bounds: b.bounds,
            floors: b.floors,
            style: b.style
        }));
        
        // 解析装饰物
        const dec = state.decorations || {};
        this.decorations.trees = dec.trees || [];
        this.decorations.flowers = dec.flowers || [];
        this.decorations.benches = dec.benches || [];
        this.decorations.lamps = dec.lamps || [];
        this.decorations.fountains = dec.fountains || [];
        
        // 解析地形
        this.terrain = state.terrain || {};
        
        // 解析时间
        this.time = state.time || {};
        
        // 解析天气
        this.weather = state.weather || {};
    }
    
    /**
     * 获取所有建筑数据（用于渲染）
     */
    getBuildingsForRendering() {
        return this.buildings.map(b => ({
            id: b.id,
            type: b.type,
            position: b.position,
            size: b.size,
            style: b.style,
            floors: b.floors
        }));
    }
    
    /**
     * 获取指定类型的建筑
     */
    getBuildingsByType(type) {
        return this.buildings.filter(b => b.type === type);
    }
    
    /**
     * 获取装饰物（合并所有类型）
     */
    getAllDecorations() {
        return [
            ...this.decorations.trees,
            ...this.decorations.flowers,
            ...this.decorations.benches,
            ...this.decorations.lamps,
            ...this.decorations.fountains
        ];
    }
    
    /**
     * 获取树木
     */
    getTrees() {
        return this.decorations.trees;
    }
    
    /**
     * 获取喷泉
     */
    getFountains() {
        return this.decorations.fountains;
    }
    
    /**
     * 获取时间数据
     */
    getTime() {
        return this.time;
    }
    
    /**
     * 获取天气数据
     */
    getWeather() {
        return this.weather;
    }
    
    /**
     * 获取天气视觉参数
     */
    getWeatherVisualParams() {
        return this.weather?.visualParams || {
            fog: { density: 0, color: 0xffffff },
            ambient: { intensity: 1.0 },
            sky: { color: 0x87CEEB }
        };
    }
    
    /**
     * 获取光照等级
     */
    getLightLevel() {
        return this.time?.lightLevel || 1.0;
    }
    
    /**
     * 检查世界是否已加载
     */
    isLoaded() {
        return this.loaded;
    }
}

/**
 * 世界状态同步器 - 处理 WebSocket 实时更新
 */
class WorldSync {
    constructor(worldLoader) {
        this.loader = worldLoader;
        this.ws = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 3000;
        this.listeners = new Map();
    }
    
    /**
     * 连接到 WebSocket 服务器
     */
    connect() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}`;
        
        console.log('[WorldSync] 连接到:', wsUrl);
        
        this.ws = new WebSocket(wsUrl);
        
        this.ws.onopen = () => {
            console.log('[WorldSync] WebSocket 连接成功');
            this.reconnectAttempts = 0;
        };
        
        this.ws.onclose = () => {
            console.log('[WorldSync] WebSocket 连接关闭');
            this.attemptReconnect();
        };
        
        this.ws.onerror = (error) => {
            console.error('[WorldSync] WebSocket 错误:', error);
        };
        
        this.ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                this.handleMessage(message);
            } catch (error) {
                console.error('[WorldSync] 消息解析错误:', error);
            }
        };
    }
    
    /**
     * 处理消息
     */
    handleMessage(message) {
        switch (message.type) {
            case 'world:init':
            case 'world:state':
                // 完整世界状态
                this.loader.worldState = message.data;
                this.loader.parseWorldState(message.data);
                this.loader.loaded = true;
                this.emit('world:loaded', message.data);
                break;
                
            case 'world:update':
                // 时间/天气更新
                if (message.data.time) {
                    this.loader.time = message.data.time;
                    this.emit('time:update', message.data.time);
                }
                if (message.data.weather) {
                    this.loader.weather = message.data.weather;
                    this.emit('weather:update', message.data.weather);
                }
                break;
                
            case 'building:added':
                this.loader.buildings.push(message.data);
                this.emit('building:added', message.data);
                break;
                
            case 'building:removed':
                this.loader.buildings = this.loader.buildings.filter(
                    b => b.id !== message.data.id
                );
                this.emit('building:removed', message.data);
                break;
                
            case 'agent:moved':
                this.emit('agent:moved', message.data);
                break;
        }
    }
    
    /**
     * 尝试重连
     */
    attemptReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.log('[WorldSync] 最大重连次数已达，停止重连');
            return;
        }
        
        this.reconnectAttempts++;
        console.log(`[WorldSync] ${this.reconnectDelay/1000}秒后尝试重连... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        
        setTimeout(() => {
            this.connect();
        }, this.reconnectDelay);
    }
    
    /**
     * 添加事件监听
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
     * 断开连接
     */
    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }
    
    /**
     * 发送消息到服务器
     */
    send(message) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(message));
        }
    }
    
    /**
     * 请求智能体移动
     */
    requestAgentMove(agentId, position) {
        this.send({
            type: 'agent:move',
            agentId,
            position
        });
    }
    
    /**
     * 注册智能体
     */
    registerAgent(agentId, position) {
        this.send({
            type: 'agent:register',
            agentId,
            position
        });
    }
}

// 导出
window.WorldLoader = WorldLoader;
window.WorldSync = WorldSync;
