/**
 * @fileoverview WebSocket 连接管理
 * 
 * 职责：
 * - 连接/断开 WebSocket
 * - 消息发送和接收
 * - 重连逻辑
 * - 消息路由到各处理器
 * 
 * 使用方式：
 *   import { connect, send, onMessage } from './websocket/connection.js';
 *   connect();
 *   send({ type: 'MESSAGE', content: 'Hello' });
 *   onMessage('AGENT_ONLINE', (msg) => { ... });
 * 
 * @module websocket/connection
 */

// 默认配置
const DEFAULT_WS_URL = 'ws://47.77.238.56:9876';

// 状态
let ws = null;
let wsUrl = DEFAULT_WS_URL;
let isConnected = false;
let reconnectTimer = null;
let reconnectDelay = 3000;

// 消息处理器
const messageHandlers = new Map();

/**
 * 设置 WebSocket URL
 * @param {string} url
 */
export function setUrl(url) {
    wsUrl = url;
}

/**
 * 连接 WebSocket
 */
export function connect() {
    if (ws && ws.readyState === WebSocket.OPEN) {
        console.log('[WS] Already connected');
        return;
    }

    console.log(`[WS] Connecting to ${wsUrl}...`);

    try {
        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
            console.log('[WS] Connected');
            isConnected = true;
            clearTimeout(reconnectTimer);
            dispatchEvent('connected', {});

            // 注册
            send({
                type: 'REGISTER',
                name: '🏙️ 3D观察者',
                tags: ['observer', '3d-world']
            });

            // 请求列表
            send({ type: 'LIST' });
            send({ type: 'LIST_TASKS' });
        };

        ws.onmessage = (event) => {
            try {
                const msg = JSON.parse(event.data);
                handleMessage(msg);
            } catch (e) {
                console.error('[WS] Parse error:', e);
            }
        };

        ws.onclose = () => {
            console.log('[WS] Disconnected');
            isConnected = false;
            dispatchEvent('disconnected', {});
            scheduleReconnect();
        };

        ws.onerror = (err) => {
            console.error('[WS] Error:', err);
            dispatchEvent('error', { error: err });
        };

    } catch (err) {
        console.error('[WS] Connection failed:', err);
        scheduleReconnect();
    }
}

/**
 * 处理接收到的消息
 * @param {Object} msg
 */
function handleMessage(msg) {
    console.log('[WS] Message:', msg.type);

    // 派发给注册的处理器
    const handler = messageHandlers.get(msg.type);
    if (handler) {
        handler(msg);
    }

    // 派发给通配符处理器
    const wildcardHandler = messageHandlers.get('*');
    if (wildcardHandler) {
        wildcardHandler(msg);
    }

    // 派发给 ALL 处理器
    const allHandler = messageHandlers.get('ALL');
    if (allHandler) {
        allHandler(msg);
    }
}

/**
 * 发送消息
 * @param {Object} data
 */
export function send(data) {
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(data));
        return true;
    } else {
        console.warn('[WS] Not connected, cannot send');
        return false;
    }
}

/**
 * 注册消息处理器
 * @param {string} type - 消息类型，或 '*' 表示通配符
 * @param {Function} handler
 */
export function onMessage(type, handler) {
    messageHandlers.set(type, handler);
}

/**
 * 移除消息处理器
 * @param {string} type
 */
export function offMessage(type) {
    messageHandlers.delete(type);
}

/**
 * 派发事件
 */
function dispatchEvent(event, data) {
    window.dispatchEvent(new CustomEvent(`ws_${event}`, data));
}

/**
 * 计划重连
 */
function scheduleReconnect() {
    if (reconnectTimer) return;
    reconnectTimer = setTimeout(() => {
        reconnectTimer = null;
        connect();
    }, reconnectDelay);
}

/**
 * 断开连接
 */
export function disconnect() {
    if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
    }
    if (ws) {
        ws.close();
        ws = null;
    }
    isConnected = false;
}

/**
 * 获取连接状态
 */
export function getStatus() {
    return {
        connected: isConnected,
        url: wsUrl
    };
}

/**
 * 设置重连延迟
 * @param {number} delay - 毫秒
 */
export function setReconnectDelay(delay) {
    reconnectDelay = delay;
}

// 兼容旧代码 - 挂载到 window
window.updateConnectionStatus = (connected) => {
    isConnected = connected;
    console.log('[WS] Status:', connected ? 'Connected' : 'Disconnected');
};

export default { 
    connect, 
    disconnect, 
    send, 
    setUrl,
    onMessage, 
    offMessage,
    getStatus,
    setReconnectDelay
};
