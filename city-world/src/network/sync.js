/**
 * Sync - 网络同步
 * 
 * 处理与服务端的状态同步
 */

import { eventBus, Events } from '../../core/event-bus.js';
import { worldState } from '../world/world-state.js';

class Sync {
    constructor() {
        this.ws = null;
        this.serverUrl = 'ws://47.77.238.56:9876';
        this.isConnected = false;
        this.reconnectInterval = null;
        this.reconnectDelay = 3000;
        this.maxReconnectDelay = 30000;
        this.messageQueue = [];
    }

    /**
     * 连接服务器
     */
    connect(url) {
        if (url) this.serverUrl = url;

        return new Promise((resolve, reject) => {
            try {
                console.log(`[Sync] Connecting to ${this.serverUrl}...`);
                this.ws = new WebSocket(this.serverUrl);

                this.ws.onopen = () => {
                    console.log('[Sync] Connected');
                    this.isConnected = true;
                    eventBus.emit(Events.CONNECTED);
                    this.flushMessageQueue();
                    this.startHeartbeat();
                    resolve();
                };

                this.ws.onclose = (e) => {
                    console.log(`[Sync] Disconnected: ${e.code}`);
                    this.isConnected = false;
                    eventBus.emit(Events.DISCONNECTED);
                    this.scheduleReconnect();
                };

                this.ws.onerror = (e) => {
                    console.error('[Sync] Error:', e);
                    reject(e);
                };

                this.ws.onmessage = (event) => {
                    this.handleMessage(event.data);
                };
            } catch (err) {
                reject(err);
            }
        });
    }

    /**
     * 处理消息
     */
    handleMessage(data) {
        try {
            const msg = JSON.parse(data);
            
            switch (msg.type) {
                case 'AGENT_LIST':
                    this.handleAgentList(msg);
                    break;

                case 'AGENT_UPDATE':
                    this.handleAgentUpdate(msg);
                    break;

                case 'MESSAGE':
                    this.handleChatMessage(msg);
                    break;

                case 'BROADCAST':
                    this.handleBroadcast(msg);
                    break;

                case 'WORLD_STATE':
                    this.handleWorldState(msg);
                    break;

                case 'PONG':
                    // 心跳响应
                    break;

                default:
                    console.log('[Sync] Unknown message type:', msg.type);
            }
        } catch (err) {
            console.error('[Sync] Failed to parse message:', err);
        }
    }

    /**
     * 处理智能体列表
     */
    handleAgentList(msg) {
        if (msg.agents) {
            for (const agentData of msg.agents) {
                worldState.addAgent(agentData);
            }
        }
    }

    /**
     * 处理智能体更新
     */
    handleAgentUpdate(msg) {
        if (msg.agentId && msg.updates) {
            worldState.updateAgent(msg.agentId, msg.updates);
        }
    }

    /**
     * 处理聊天消息
     */
    handleChatMessage(msg) {
        eventBus.emit(Events.MESSAGE_RECEIVED, {
            from: msg.from,
            fromName: msg.fromName,
            content: msg.content,
            timestamp: msg.timestamp
        });
    }

    /**
     * 处理广播
     */
    handleBroadcast(msg) {
        eventBus.emit(Events.AGENT_MESSAGE, {
            fromName: msg.fromName,
            content: msg.content
        });
    }

    /**
     * 处理世界状态
     */
    handleWorldState(msg) {
        if (msg.state) {
            worldState.fromJSON(msg.state);
        }
    }

    /**
     * 发送消息
     */
    send(data) {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            this.messageQueue.push(data);
            return false;
        }

        this.ws.send(JSON.stringify(data));
        return true;
    }

    /**
     * 发送聊天消息
     */
    sendMessage(content) {
        return this.send({
            type: 'MESSAGE',
            content,
            contentType: 'text',
            timestamp: Date.now()
        });
    }

    /**
     * 发送广播
     */
    sendBroadcast(content) {
        return this.send({
            type: 'BROADCAST',
            content,
            contentType: 'text',
            timestamp: Date.now()
        });
    }

    /**
     * 发送位置更新
     */
    sendPosition(x, z) {
        return this.send({
            type: 'MOVE_TO',
            x,
            z
        });
    }

    /**
     * 刷新消息队列
     */
    flushMessageQueue() {
        while (this.messageQueue.length > 0) {
            const msg = this.messageQueue.shift();
            this.send(msg);
        }
    }

    /**
     * 开始心跳
     */
    startHeartbeat() {
        this.heartbeatInterval = setInterval(() => {
            this.send({ type: 'PING' });
        }, 30000);
    }

    /**
     * 调度重连
     */
    scheduleReconnect() {
        if (this.reconnectInterval) return;

        console.log(`[Sync] Reconnecting in ${this.reconnectDelay / 1000}s...`);
        
        this.reconnectInterval = setTimeout(() => {
            this.reconnectInterval = null;
            this.reconnectDelay = Math.min(this.reconnectDelay * 1.5, this.maxReconnectDelay);
            this.connect().catch(() => {});
        }, this.reconnectDelay);
    }

    /**
     * 断开连接
     */
    disconnect() {
        if (this.reconnectInterval) {
            clearTimeout(this.reconnectInterval);
            this.reconnectInterval = null;
        }

        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }

        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }

        this.isConnected = false;
    }

    /**
     * 获取连接状态
     */
    getStatus() {
        return {
            isConnected: this.isConnected,
            serverUrl: this.serverUrl,
            queuedMessages: this.messageQueue.length
        };
    }
}

const sync = new Sync();

export { Sync, sync };
