/**
 * Server Entry Point - 服务端入口
 * 
 * 智体城服务端主入口
 */

const WebSocket = require('ws');
const http = require('http');
const url = require('url');

// 工具
const logger = require('./utils/logger');
const { generateId, now } = require('./utils/crypto');
const { RateLimiter } = require('./utils/time');

// 配置
const config = require('./utils/config-loader');

// 路由
const router = require('./router');

// 初始化
async function main() {
    logger.info('智体城服务器启动中...');
    
    // 加载配置
    await config.load();
    logger.info('配置加载完成');
    
    // 创建 HTTP 服务器
    const httpServer = http.createServer((req, res) => {
        // CORS
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        
        if (req.method === 'OPTIONS') {
            res.writeHead(200);
            res.end();
            return;
        }
        
        // 路由到 HTTP Handler
        router.handleHttp(req, res);
    });
    
    // 创建 WebSocket 服务器
    const wss = new WebSocket.Server({ server: httpServer });
    
    wss.on('connection', (ws, req) => {
        const ip = req.socket.remoteAddress;
        const query = url.parse(req.url, true).query;
        
        logger.info(`WebSocket 连接: ${ip}`, { query });
        
        // 限流检查
        if (!rateLimiter.canPass(ip)) {
            logger.warn(`连接被限流: ${ip}`);
            ws.close(1008, 'Rate limit exceeded');
            return;
        }
        
        // 路由到 WebSocket Handler
        router.handleWebSocket(ws, req);
    });
    
    // 启动 HTTP 服务器
    const PORT = config.get('server.port', 9876);
    const HOST = config.get('server.host', '0.0.0.0');
    
    httpServer.listen(PORT, HOST, () => {
        logger.info(`服务器已启动: ws://${HOST}:${PORT}`);
    });
    
    // 优雅关闭
    process.on('SIGINT', () => {
        logger.info('收到 SIGINT，正在关闭...');
        httpServer.close(() => {
            logger.info('服务器已关闭');
            process.exit(0);
        });
    });
    
    process.on('SIGTERM', () => {
        logger.info('收到 SIGTERM，正在关闭...');
        httpServer.close(() => {
            logger.info('服务器已关闭');
            process.exit(0);
        });
    });
}

// 限流器
const rateLimiter = new RateLimiter(100, 60000); // 1分钟100次

// 启动
main().catch(err => {
    logger.error('启动失败', { error: err.message });
    process.exit(1);
});
