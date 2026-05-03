/**
 * Server Entry Point - 智体城服务端主入口
 *
 * @module server
 */

const WebSocket = require('ws');
const http = require('http');
const url = require('url');
const path = require('path');
const fs = require('fs');

// 工具
const logger = require('./utils/logger');
const config = require('./utils/config-loader');

// Stores
const {
    agentStore,
    taskStore,
    reputationService,
    memoryStore,
    stateStore,
    identityStore,
    paymentStore
} = require('./stores');

// Services
const { agentService, setStores: setAgentStores } = require('./services/agent-service');
const { taskService, setStores: setTaskStores } = require('./services/task-service');
const { messageService, setStores: setMessageStores, setEventDispatcher: setMessageEventDispatcher } = require('./services/message-service');
const buildingsService = require('./services/buildings');

// AI
const { aiEngine, setStores: setAIStores } = require('./ai/ai-engine');
const { llmManager } = require('./ai/llm-manager');

// Event Dispatcher
const { eventDispatcher } = require('./event-dispatcher');

// Handlers
const { wsHandler, WebSocketHandler, setDependencies } = require('./handlers/ws-handler');
const { httpHandler, HTTPHandler } = require('./handlers/http-handler');

// Router
const router = require('./router');

// Message Bridge
const { messageBridge } = require('./message-bridge');

// WebRTC Signaling
const { signaling } = require('./webrtc-signaling');

// I18n
const { i18n } = require('../i18n');

// 全局实例
let stores = {};
let services = {};

/**
 * 初始化所有存储
 */
async function initStores() {
    logger.info('[Init] Initializing stores...');

    // 使用已初始化的单例
    stores.agentStore = agentStore;
    stores.taskStore = taskStore;
    stores.reputationStore = reputationService;
    stores.memoryStore = memoryStore;
    stores.stateStore = stateStore;
    stores.identityStore = identityStore;
    stores.paymentStore = paymentStore;

    // 初始化存储（从数据文件加载等）
    await stores.agentStore.init();
    await stores.taskStore.init();
    await stores.reputationStore.init();
    await stores.memoryStore.init();
    await stores.stateStore.init();
    await stores.identityStore.init();
    await stores.paymentStore.init();

    // 会话清理
    stores.identityStore.startSessionCleanup();

    logger.info('[Init] Stores initialized');
    return stores;
}

/**
 * 初始化所有服务
 */
async function initServices() {
    logger.info('[Init] Initializing services...');

    // 设置 Store 依赖
    setAgentStores(stores);
    setTaskStores(stores);
    setMessageStores(stores);

    // 使用单例
    services.agentService = agentService;
    services.taskService = taskService;
    services.messageService = messageService;

    // 初始化建筑服务
    const buildingInstances = buildingsService.initializeBuildings(stores);
    services.buildings = buildingInstances;

    logger.info('[Init] Services initialized');
    return services;
}

/**
 * 初始化 AI 引擎
 */
async function initAI() {
    logger.info('[Init] Initializing AI...');

    // 初始化 LLM Manager
    llmManager.initialize();

    // 设置依赖（使用单例）
    setAIStores(stores);

    // 设置消息桥接
    messageBridge.setAIEngine(aiEngine);

    // 启动 AI 引擎
    aiEngine.start();

    logger.info('[Init] AI initialized');
    return aiEngine;
}

/**
 * 初始化处理器
 */
function initHandlers() {
    logger.info('[Init] Initializing handlers...');

    // HTTP Handler - 使用单例
    httpHandler.setStores(stores);
    httpHandler.initDefaultRoutes();

    // 设置事件分发器（在 wsHandler 之后）
    const { setEventDispatcher } = require('./handlers/ws-handler');
    setEventDispatcher(eventDispatcher);

    // WebSocket Handler - 使用 setDependencies
    setDependencies({
        agentStore: stores.agentStore,
        messageService: services.messageService,
        aiService: aiEngine,
        eventDispatcher: eventDispatcher
    });

    // 设置 Router
    router.setHandlers({
        wsHandler,
        httpHandler
    });

    // 设置事件分发器依赖 (sendEventToAgent 在 ws-handler.js 中定义)
    setEventDispatcher(eventDispatcher);
    
    // 设置 wsHandler 引用到 eventDispatcher（用于广播事件给客户端）
    eventDispatcher.setWsHandler(wsHandler);

    // 设置消息服务的路由依赖
    setMessageEventDispatcher(eventDispatcher);

    // 初始化 EventDispatcher 的依赖（contextBuilder 需要 cityState 和 agentRegistry）
    // agentRegistry 需要有 getAgent(agentId) 和 getOnlineAgents() 方法
    const cityState = {
        weather: 'sunny',
        timeOfDay: 'day',
        objects: [],
        buildings: []
    };
    // 创建 agentRegistry 适配器
    const agentRegistry = {
        getAgent: (agentId) => stores.agentStore.get(agentId),
        getOnlineAgents: () => stores.agentStore.getOnlineAgents()
    };
    eventDispatcher.setStores(stores.agentStore, cityState, null, agentRegistry);

    logger.info('[Init] Handlers initialized');
}

/**
 * 加载翻译
 */
function initI18n() {
    logger.info('[Init] Initializing i18n...');

    // 加载翻译配置
    const i18nConfig = config.get('i18n', {});
    const resources = {
        'zh-CN': {
            agent: {
                greeting: '你好！我是{ name }',
                goodbye: '再见！',
                welcome: '欢迎来到智体城！'
            },
            system: {
                connected: '已连接到服务器',
                error: '发生错误：{ message }'
            }
        }
    };

    i18n.load(resources);
    logger.info('[Init] i18n initialized');
}

/**
 * 创建 HTTP 服务器
 */
function createHttpServer() {
    const httpServer = http.createServer(async (req, res) => {
        // CORS
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

        if (req.method === 'OPTIONS') {
            res.writeHead(200);
            res.end();
            return;
        }

        // 请求日志
        const start = Date.now();
        logger.debug(`HTTP ${req.method} ${req.url}`);

        try {
            await router.handleHttp(req, res);
        } catch (err) {
            logger.error('HTTP error', { error: err.message });
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Internal Server Error' }));
        }

        logger.debug(`HTTP ${req.method} ${req.url} - ${Date.now() - start}ms`);
    });

    return httpServer;
}

/**
 * 主函数
 */
async function main() {
    try {
        logger.info('========================================');
        logger.info('  Agent City Server Starting...');
        logger.info('========================================');

        // 加载配置
        await config.load();
        logger.info('[Config] Loaded');

        // 初始化组件
        await initStores();
        await initServices();
        await initI18n();
        await initAI();
        
        // 设置配置到 eventDispatcher（在 initHandlers 之前）
        eventDispatcher.setConfig(config);
        
        initHandlers();

        // 创建 HTTP 服务器
        const httpServer = createHttpServer();

        // WebRTC Signaling Server (独立端口)
        const signalingServer = http.createServer();
        signalingServer.on('request', (req, res) => {
            // WebRTC signaling handled separately
        });

        // 启动服务器
        const HOST = config.getValue('server.host', '127.0.0.1');
        const HTTP_PORT = config.getValue('server.http.port', 9877);
        const WS_PORT = config.getValue('server.websocket.port', 9876);

        // HTTP API 服务器
        httpServer.listen(HTTP_PORT, HOST, () => {
            logger.info(`  HTTP API: http://${HOST}:${HTTP_PORT}`);
        });

        // WebSocket 服务器
        const WebSocket = require('ws');
        const wsServer = new WebSocket.Server({ port: WS_PORT });
        wsServer.on('connection', (ws, req) => {
            const ip = req.socket.remoteAddress;
            const urlInfo = new URL(req.url, `http://127.0.0.1:${WS_PORT}`);
            const query = urlInfo.searchParams;
            const agentId = query.get('agentId');

            logger.info(`[WebSocket] New connection: ${ip}`, { agentId });

            const rateLimiter = new (require('./utils/time').RateLimiter)(100, 60000);
            if (!rateLimiter.canPass(ip)) {
                logger.warn(`[WebSocket] Rate limited: ${ip}`);
                ws.close(1008, 'Rate limit exceeded');
                return;
            }

            const clientId = wsHandler.handle(ws, req, urlInfo);
            if (agentId) {
                messageBridge.addClient(agentId, ws);
            }
        });

        wsServer.on('listening', () => {
            logger.info('========================================');
            logger.info(`  Agent City Server Running`);
            logger.info(`  WebSocket: ws://${HOST}:${WS_PORT}`);
            logger.info('========================================');
        });

        // WebRTC Signaling on separate port
        const WEBRTC_PORT = config.getValue('server.webrtc.port', 9878);
        signalingServer.listen(WEBRTC_PORT, HOST, () => {
            logger.info(`[WebRTC] Signaling server: ws://${HOST}:${WEBRTC_PORT}`);
        });

        // 优雅关闭
        const shutdown = (signal) => {
            logger.info(`[Server] Received ${signal}, shutting down...`);

            // 停止 AI
            if (aiEngine) aiEngine.stop();

            // 停止会话清理
            if (stores.identityStore) {
                stores.identityStore.stopSessionCleanup();
            }

            // 关闭服务器
            httpServer.close(() => {
                logger.info('[Server] HTTP server closed');
                signalingServer.close(() => {
                    logger.info('[Server] Signaling server closed');
                    process.exit(0);
                });
            });

            // 超时强制退出
            setTimeout(() => {
                logger.error('[Server] Forced shutdown');
                process.exit(1);
            }, 5000);
        };

        process.on('SIGINT', () => shutdown('SIGINT'));
        process.on('SIGTERM', () => shutdown('SIGTERM'));

    } catch (err) {
        logger.error('========================================');
        logger.error('  Server Start Failed');
        logger.error('========================================');
        logger.error('Error:', err.message);
        logger.error('Stack:', err.stack);
        process.exit(1);
    }
}

// 导出
module.exports = { main };

// 如果直接运行
if (require.main === module) {
    main();
}
