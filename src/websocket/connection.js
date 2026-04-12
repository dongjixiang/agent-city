/**
 * WebSocket Connection - WebSocket 客户端
 *
 * 管理与 Agent City 服务器的 WebSocket 连接
 *
 * @module websocket/connection
 */

import { eventBus, Events } from '../core/event-bus.js';

class Connection {
    constructor() {
        this.ws = null;
        this.url = 'ws://localhost:9876';
        this.isConnected = false;
        this.reconnectInterval = 3000;
        this.reconnectTimer = null;
        this.messageQueue = [];
        this.agentId = null;
        this.listeners = new Map();
    }

    /**
     * 连接到服务器
     */
    connect(url, agentId) {
        this.url = url || this.url;
        this.agentId = agentId;

        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            console.log('[WS] Already connected');
            return;
        }

        console.log(`[WS] Connecting to ${this.url}...`);

        try {
            this.ws = new WebSocket(this.url);

            this.ws.onopen = () => {
                console.log('[WS] Connected');
                this.isConnected = true;

                // 发送认证
                this.send({
                    type: 'agent_connect',
                    agentId: this.agentId,
                    timestamp: Date.now()
                });

                // 发送队列中的消息
                this._flushQueue();

                eventBus.emit(Events.WS_CONNECTED, {});
            };

            this.ws.onmessage = (event) => {
                this._handleMessage(event.data);
            };

            this.ws.onerror = (error) => {
                console.error('[WS] Error:', error);
                eventBus.emit(Events.WS_ERROR, { error });
            };

            this.ws.onclose = () => {
                console.log('[WS] Disconnected');
                this.isConnected = false;
                eventBus.emit(Events.WS_DISCONNECTED, {});
                this._scheduleReconnect();
            };
        } catch (err) {
            console.error('[WS] Connection failed:', err);
            this._scheduleReconnect();
        }
    }

    /**
     * 断开连接
     */
    disconnect() {
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }

        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.isConnected = false;
    }

    /**
     * 发送消息
     */
    send(message) {
        const data = JSON.stringify(message);

        if (this.isConnected && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(data);
        } else {
            // 队列消息等待重连
            this.messageQueue.push(message);
        }
    }

    /**
     * 发送私聊消息
     */
    sendPrivate(toAgentId, content) {
        this.send({
            type: 'private_message',
            from: this.agentId,
            to: toAgentId,
            content,
            timestamp: Date.now()
        });
    }

    /**
     * 发送广播
     */
    broadcast(content) {
        this.send({
            type: 'broadcast',
            from: this.agentId,
            content,
            timestamp: Date.now()
        });
    }

    /**
     * 发送位置更新
     */
    sendPosition(position) {
        this.send({
            type: 'position_update',
            agentId: this.agentId,
            position,
            timestamp: Date.now()
        });
    }

    /**
     * 注册消息监听器
     */
    on(type, callback) {
        if (!this.listeners.has(type)) {
            this.listeners.set(type, []);
        }
        this.listeners.get(type).push(callback);

        // 返回取消订阅函数
        return () => {
            const cbs = this.listeners.get(type);
            const idx = cbs.indexOf(callback);
            if (idx !== -1) cbs.splice(idx, 1);
        };
    }

    /**
     * 处理收到的消息
     */
    _handleMessage(data) {
        let message;
        try {
            message = JSON.parse(data);
        } catch (err) {
            console.error('[WS] Failed to parse message:', data);
            return;
        }

        // 触发全局事件
        eventBus.emit(Events.WS_MESSAGE, message);

        // 触发类型特定事件
        const typeSpecific = Events[`WS_${message.type.toUpperCase()}`];
        if (typeSpecific) {
            eventBus.emit(typeSpecific, message);
        }

        // 触发自定义监听器
        const listeners = this.listeners.get(message.type);
        if (listeners) {
            for (const callback of listeners) {
                try {
                    callback(message);
                } catch (err) {
                    console.error('[WS] Listener error:', err);
                }
            }
        }
    }

    /**
     * 刷新消息队列
     */
    _flushQueue() {
        while (this.messageQueue.length > 0) {
            const msg = this.messageQueue.shift();
            this.send(msg);
        }
    }

    /**
     * 计划重连
     */
    _scheduleReconnect() {
        if (this.reconnectTimer) return;

        console.log(`[WS] Reconnecting in ${this.reconnectInterval}ms...`);
        this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = null;
            if (this.agentId) {
                this.connect(this.url, this.agentId);
            }
        }, this.reconnectInterval);
    }
}

// 扩展 Events
Object.assign(Events, {
    WS_CONNECTED: 'ws:connected',
    WS_DISCONNECTED: 'ws:disconnected',
    WS_ERROR: 'ws:error',
    WS_MESSAGE: 'ws:message',
    WS_PRIVATE_MESSAGE: 'ws:private_message',
    WS_BROADCAST: 'ws:broadcast',
    WS_AGENT_CONNECTED: 'ws:agent_connected',
    WS_AGENT_DISCONNECTED: 'ws:agent_disconnected',
    WS_POSITION_UPDATE: 'ws:position_update'
});

// 全局单例
const connection = new Connection();

export { Connection, connection };
