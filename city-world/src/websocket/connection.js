/**
 * @fileoverview WebSocket 连接管理
 * 
 * 职责：
 * - 连接/断开 WebSocket
 * - 消息发送和接收
 * - 重连逻辑
 * 
 * @module websocket/connection
 */

let ws = null;
let reconnectTimer = null;
const WS_URL = 'ws://47.77.238.56:9876';

/**
 * 连接 WebSocket
 */
export function connect() {
    if (ws && ws.readyState === WebSocket.OPEN) {
        console.log('[WS] Already connected');
        return;
    }

    console.log(`[WS] Connecting to ${WS_URL}...`);
    ws = new WebSocket(WS_URL);

    ws.onopen = () => {
        console.log('[WS] Connected');
        clearTimeout(reconnectTimer);
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
        scheduleReconnect();
    };

    ws.onerror = (err) => {
        console.error('[WS] Error:', err);
    };
}

/**
 * 处理接收到的消息
 * @param {Object} msg
 */
function handleMessage(msg) {
    console.log('[WS] Message:', msg.type);
    
    switch (msg.type) {
        case 'AGENT_ONLINE':
        case 'AGENT_OFFLINE':
        case 'MESSAGE':
        case 'BROADCAST':
        case 'AGENT_RESPONSE_COMPLETE':
            // 转发给 UI 或其他系统
            break;
        default:
            console.log('[WS] Unknown message type:', msg.type);
    }
}

/**
 * 发送消息
 * @param {Object} data
 */
export function send(data) {
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(data));
    } else {
        console.warn('[WS] Not connected, cannot send');
    }
}

/**
 * 计划重连
 */
function scheduleReconnect() {
    if (reconnectTimer) return;
    reconnectTimer = setTimeout(() => {
        reconnectTimer = null;
        connect();
    }, 5000);
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
}

export default { connect, disconnect, send };
