/**
 * Router - 路由
 * 
 * 负责：
 * - HTTP 请求路由
 * - WebSocket 连接路由
 */

const logger = require('./utils/logger');

// Handler 占位符（后续创建）
let wsHandler = null;
let httpHandler = null;

/**
 * 设置 Handler
 */
function setHandlers(handlers) {
    wsHandler = handlers.wsHandler;
    httpHandler = handlers.httpHandler;
}

/**
 * 处理 HTTP 请求
 */
async function handleHttp(req, res) {
    const startTime = Date.now();
    
    try {
        // 解析路径
        const pathname = new URL(req.url, `http://${req.headers.host}`).pathname;
        
        logger.debug(`HTTP ${req.method} ${pathname}`);
        
        if (httpHandler) {
            await httpHandler.handle(req, res, pathname);
        } else {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ 
                status: 'ok',
                service: 'agent-city',
                path: pathname
            }));
        }
        
    } catch (err) {
        logger.error('HTTP 处理错误', { error: err.message, stack: err.stack });
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Internal Server Error' }));
    }
}

/**
 * 处理 WebSocket 连接
 */
function handleWebSocket(ws, req) {
    const startTime = Date.now();
    
    try {
        // 解析路径和查询参数
        const urlInfo = new URL(req.url, `http://${req.headers.host}`);
        const pathname = urlInfo.pathname;
        
        logger.debug(`WebSocket 连接: ${pathname}`);
        
        if (wsHandler) {
            wsHandler.handle(ws, req, urlInfo);
        } else {
            ws.send(JSON.stringify({ 
                type: 'ERROR',
                message: 'Handler not initialized'
            }));
            ws.close();
        }
        
    } catch (err) {
        logger.error('WebSocket 处理错误', { error: err.message });
        ws.close(1011, 'Internal error');
    }
}

/**
 * 解析 WebSocket 消息
 */
function parseMessage(data) {
    try {
        return JSON.parse(data);
    } catch (err) {
        return { type: 'UNKNOWN', raw: data.toString() };
    }
}

/**
 * 路由消息类型到 Handler
 */
function routeMessage(ws, msg, context) {
    if (!wsHandler) {
        ws.send(JSON.stringify({ type: 'ERROR', message: 'Handler not initialized' }));
        return;
    }
    
    wsHandler.handleMessage(ws, msg, context);
}

module.exports = {
    setHandlers,
    handleHttp,
    handleWebSocket,
    parseMessage,
    routeMessage
};
