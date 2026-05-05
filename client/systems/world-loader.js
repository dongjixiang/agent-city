/**
 * WorldLoader - 从服务端加载世界状态
 * 
 * 职责：
 * - 从服务端 API 获取世界状态
 * - 解析建筑、装饰物数据
 * - 提供渲染所需的数据结构
 */

class WorldLoader {
    constructor(baseUrl = '') {
        // 如果 baseUrl 为空，使用当前页面 origin
        this.baseUrl = baseUrl || window.location.origin;
        console.log('[WorldLoader] constructor baseUrl:', this.baseUrl);
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
        this.entities = [];     // 实体数据（变形金刚、狗、牛）
        this.loaded = false;
        this._loadCallbacks = [];
        this._errorCallbacks = [];
    }
    
    /**
     * 注册加载完成回调
     */
    onLoad(callback) {
        this._loadCallbacks.push(callback);
    }
    
    /**
     * 注册错误回调
     */
    onError(callback) {
        this._errorCallbacks.push(callback);
    }
    
    /**
     * 调用加载完成回调
     */
    _notifyLoad() {
        this._loadCallbacks.forEach(cb => {
            try { cb(this.worldState); } catch(e) { console.error('[WorldLoader] callback error:', e); }
        });
    }
    
    /**
     * 调用错误回调
     */
    _notifyError(error) {
        this._errorCallbacks.forEach(cb => {
            try { cb(error); } catch(e) { console.error('[WorldLoader] error callback error:', e); }
        });
    }
    
    /**
     * 从服务端加载完整世界状态
     */
    async load() {
        console.log('[WorldLoader] 开始加载世界状态...');
        console.log('[WorldLoader] baseUrl:', this.baseUrl);
        
        try {
            const url = `${this.baseUrl}/api/world/state`;
            console.log('[WorldLoader] fetching:', url);
            
            // 添加 timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            
            const response = await fetch(url, { signal: controller.signal });
            clearTimeout(timeoutId);
            console.log('[WorldLoader] fetch 完成, status:', response.status);
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
            
            // 触发回调
            this._notifyLoad();
            
            return true;
        } catch (error) {
            console.error('[WorldLoader] 加载失败:', error.name, error.message);
            if (error.name === 'AbortError') {
                console.error('[WorldLoader] 请求超时');
            }
            console.error('[WorldLoader] baseUrl was:', this.baseUrl);
            this._notifyError(error);
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
        
        // 解析实体（变形金刚、狗、牛）
        this.entities = state.entities || [];
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
     * 获取实体数据（变形金刚、狗、牛）
     */
    getEntities() {
        return this.entities;
    }
    
    /**
     * 按类型获取实体
     */
    getEntitiesByType(type) {
        return this.entities.filter(e => e.type === type);
    }
    
    /**
     * 从服务器更新实体状态（增量更新）
     */
    async updateEntities() {
        try {
            const response = await fetch(`${this.baseUrl}/api/entities`);
            const result = await response.json();
            if (result.success) {
                this.entities = result.data;
                return true;
            }
            return false;
        } catch (error) {
            console.error('[WorldLoader] updateEntities failed:', error);
            return false;
        }
    }
    
    /**
     * 验证实体移动（询问服务器）
     */
    async validateEntityMove(entityId, position) {
        try {
            const response = await fetch(`${this.baseUrl}/api/entities/${entityId}/validate-move`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ position })
            });
            const result = await response.json();
            return result.data;
        } catch (error) {
            console.error('[WorldLoader] validateEntityMove failed:', error);
            return { valid: false, reason: 'Network error' };
        }
    }
    
    /**
     * 更新实体位置到服务器
     */
    async updateEntityPosition(entityId, position, rotation) {
        try {
            const response = await fetch(`${this.baseUrl}/api/entities/${entityId}/position`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ position, rotation })
            });
            const result = await response.json();
            return result;
        } catch (error) {
            console.error('[WorldLoader] updateEntityPosition failed:', error);
            return { success: false, reason: 'Network error' };
        }
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

// 导出（兼容 ES Module 和 window）
export { WorldLoader, WorldSync };
window.WorldLoader = WorldLoader;
window.WorldSync = WorldSync;
