/**
 * EventBus - 事件总线
 * 
 * 模块间通信的中央事件系统
 */

class EventBus {
    constructor() {
        this.listeners = new Map();
        this.onceListeners = new Map();
    }

    /**
     * 订阅事件
     * @param {string} event - 事件名
     * @param {Function} callback - 回调函数
     * @returns {Function} 取消订阅的函数
     */
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event).add(callback);

        // 返回取消订阅函数
        return () => this.off(event, callback);
    }

    /**
     * 订阅一次
     * @param {string} event - 事件名
     * @param {Function} callback - 回调函数
     */
    once(event, callback) {
        if (!this.onceListeners.has(event)) {
            this.onceListeners.set(event, new Set());
        }
        this.onceListeners.get(event).add(callback);
    }

    /**
     * 取消订阅
     * @param {string} event - 事件名
     * @param {Function} callback - 回调函数
     */
    off(event, callback) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).delete(callback);
        }
        if (this.onceListeners.has(event)) {
            this.onceListeners.get(event).delete(callback);
        }
    }

    /**
     * 发送事件
     * @param {string} event - 事件名
     * @param {*} data - 事件数据
     */
    emit(event, data) {
        // 执行普通监听器
        if (this.listeners.has(event)) {
            for (const callback of this.listeners.get(event)) {
                try {
                    callback(data);
                } catch (err) {
                    console.error(`[EventBus] Error in listener for "${event}":`, err);
                }
            }
        }

        // 执行一次性监听器
        if (this.onceListeners.has(event)) {
            for (const callback of this.onceListeners.get(event)) {
                try {
                    callback(data);
                } catch (err) {
                    console.error(`[EventBus] Error in once listener for "${event}":`, err);
                }
            }
            this.onceListeners.get(event).clear();
        }
    }

    /**
     * 清除所有监听器
     */
    clear() {
        this.listeners.clear();
        this.onceListeners.clear();
    }

    /**
     * 获取事件订阅数量
     */
    getListenerCount(event) {
        const normal = this.listeners.get(event)?.size || 0;
        const once = this.onceListeners.get(event)?.size || 0;
        return normal + once;
    }
}

// 全局单例
const eventBus = new EventBus();

// 标准化事件名
const Events = {
    // 智能体事件
    AGENT_ADDED: 'agent:added',
    AGENT_REMOVED: 'agent:removed',
    AGENT_CLICKED: 'agent:clicked',
    AGENT_SELECTED: 'agent:selected',
    AGENT_DESELECTED: 'agent:deselected',
    AGENT_MOVED: 'agent:moved',
    AGENT_MESSAGE: 'agent:message',
    AGENT_SPEAK: 'agent:speak',
    AGENT_THINK: 'agent:think',

    // 建筑事件
    BUILDING_ENTER: 'building:enter',
    BUILDING_LEAVE: 'building:leave',
    BUILDING_CLICKED: 'building:clicked',

    // 装饰物事件
    DECORATION_CLICKED: 'decoration:clicked',
    DECORATION_INTERACT: 'decoration:interact',

    // 世界事件
    WORLD_LOADED: 'world:loaded',
    WORLD_STATE_UPDATE: 'world:stateUpdate',

    // 相机事件
    CAMERA_MODE_CHANGE: 'camera:modeChange',

    // 时间事件
    TIME_TICK: 'time:tick',
    DAY_NIGHT_CHANGE: 'time:dayNightChange',

    // 连接事件
    CONNECTED: 'network:connected',
    DISCONNECTED: 'network:disconnected',
    MESSAGE_RECEIVED: 'network:messageReceived'
};

export { EventBus, eventBus, Events };
