/**
 * EventBus - 事件总线
 *
 * 全局事件系统，解耦模块通信
 *
 * @module core/event-bus
 */

const Events = {
    // 智能体
    AGENT_ADDED: 'agent:added',
    AGENT_REMOVED: 'agent:removed',
    AGENT_SELECTED: 'agent:selected',
    AGENT_DESELECTED: 'agent:deselected',
    AGENT_MOVED: 'agent:moved',
    AGENT_THINK: 'agent:think',
    AGENT_SPEAK: 'agent:speak',
    AGENT_MESSAGE: 'agent:message',

    // 世界
    DECORATION_INTERACT: 'decoration:interact',
    BUILDING_ENTER: 'building:enter',
    BUILDING_LEAVE: 'building:leave',
    BUILDING_SERVICE: 'building:service',

    // 系统
    WORLD_READY: 'world:ready',
    TIME_ADVANCE: 'time:advance'
};

class EventBus {
    constructor() {
        /** @type {Map<string, Function[]>} */
        this.listeners = new Map();
    }

    /**
     * 订阅事件
     * @param {string} event
     * @param {Function} callback
     * @returns {Function} 取消订阅函数
     */
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);

        // 返回取消订阅函数
        return () => this.off(event, callback);
    }

    /**
     * 取消订阅
     */
    off(event, callback) {
        if (!this.listeners.has(event)) return;
        const callbacks = this.listeners.get(event);
        const idx = callbacks.indexOf(callback);
        if (idx !== -1) callbacks.splice(idx, 1);
    }

    /**
     * 发送事件
     */
    emit(event, data) {
        if (!this.listeners.has(event)) return;
        for (const callback of this.listeners.get(event)) {
            try {
                callback(data);
            } catch (err) {
                console.error(`[EventBus] Error in handler for ${event}:`, err);
            }
        }
    }

    /**
     * 仅触发一次
     */
    once(event, callback) {
        const wrapper = (data) => {
            this.off(event, wrapper);
            callback(data);
        };
        this.on(event, wrapper);
    }

    /**
     * 清除所有事件监听
     */
    clear(event) {
        if (event) {
            this.listeners.delete(event);
        } else {
            this.listeners.clear();
        }
    }
}

// 全局单例
const eventBus = new EventBus();

export { EventBus, eventBus, Events };
