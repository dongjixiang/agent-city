/**
 * HTTPHandler - HTTP API 处理
 * 
 * 处理所有 HTTP 请求（REST API）
 */

const url = require('url');
const BaseHandler = require('./base-handler');
const logger = require('../utils/logger');
const { validate, Validators } = require('../utils/validation');
const config = require('../utils/config-loader');

// Store 占位符
let agentStore = null;
let taskStore = null;
let reputationStore = null;

// API 路由
const routes = {
    GET: {},
    POST: {},
    PUT: {},
    DELETE: {}
};

class HTTPHandler extends BaseHandler {
    constructor() {
        super('HTTPHandler');
    }

    /**
     * 处理 HTTP 请求
     */
    async handle(req, res, pathname) {
        const method = req.method.toUpperCase();
        
        logger.debug(`[HTTP] ${method} ${pathname}`);
        
        // CORS
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        
        if (method === 'OPTIONS') {
            res.writeHead(200);
            res.end();
            return;
        }

        // 解析路径
        const parsedUrl = url.parse(pathname, true);
        const path = parsedUrl.pathname;
        const query = parsedUrl.query;

        // 查找路由
        const handler = this.findRoute(method, path);
        
        if (!handler) {
            this.sendError(res, 404, 'Not Found', `Route ${method} ${path} not found`);
            return;
        }

        // 解析 body
        let body = {};
        if (method !== 'GET' && method !== 'DELETE') {
            try {
                const rawBody = await this.readBody(req);
                if (rawBody) {
                    body = JSON.parse(rawBody);
                }
            } catch (err) {
                this.sendError(res, 400, 'Bad Request', 'Invalid JSON body');
                return;
            }
        }

        // 执行处理器
        try {
            await handler.func(req, res, { path, query, body, params: handler.params });
        } catch (err) {
            logger.error(`[HTTP] Handler error`, { method, path, error: err.message });
            this.sendError(res, 500, 'Internal Server Error', err.message);
        }
    }

    /**
     * 读取请求体
     */
    readBody(req) {
        return new Promise((resolve, reject) => {
            let data = '';
            req.on('data', chunk => data += chunk);
            req.on('end', () => resolve(data));
            req.on('error', reject);
        });
    }

    /**
     * 查找路由
     */
    findRoute(method, path) {
        // 精确匹配
        if (routes[method] && routes[method][path]) {
            return { func: routes[method][path], params: {} };
        }

        // 参数匹配
        for (const routePath in routes[method] || {}) {
            const match = this.matchPath(routePath, path);
            if (match) {
                return { func: routes[method][routePath], params: match.params };
            }
        }

        return null;
    }

    /**
     * 匹配路径
     */
    matchPath(routePath, actualPath) {
        const routeParts = routePath.split('/').filter(Boolean);
        const pathParts = actualPath.split('/').filter(Boolean);

        if (routeParts.length !== pathParts.length) {
            return null;
        }

        const params = {};
        for (let i = 0; i < routeParts.length; i++) {
            if (routeParts[i].startsWith(':')) {
                params[routeParts[i].substring(1)] = pathParts[i];
            } else if (routeParts[i] !== pathParts[i]) {
                return null;
            }
        }

        return { params };
    }

    /**
     * 注册 GET 路由
     */
    get(path, handler) {
        routes.GET[path] = handler;
        return this;
    }

    /**
     * 注册 POST 路由
     */
    post(path, handler) {
        routes.POST[path] = handler;
        return this;
    }

    /**
     * 注册 PUT 路由
     */
    put(path, handler) {
        routes.PUT[path] = handler;
        return this;
    }

    /**
     * 注册 DELETE 路由
     */
    delete(path, handler) {
        routes.DELETE[path] = handler;
        return this;
    }

    /**
     * 发送 JSON 响应
     */
    sendJson(res, data, statusCode = 200) {
        res.writeHead(statusCode, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(data));
    }

    /**
     * 发送错误
     */
    sendError(res, statusCode, error, message) {
        res.writeHead(statusCode, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error, message }));
    }

    /**
     * 设置 Store 依赖
     */
    setStores(stores) {
        agentStore = stores.agentStore;
        taskStore = stores.taskStore;
        reputationStore = stores.reputationStore;
    }

    /**
     * 初始化默认路由
     */
    initDefaultRoutes() {
        // 健康检查
        this.get('/api/health', async (req, res) => {
            this.sendJson(res, {
                status: 'ok',
                uptime: process.uptime(),
                timestamp: Date.now()
            });
        });

        // 服务器信息
        this.get('/api/info', async (req, res) => {
            this.sendJson(res, {
                name: '智体城',
                version: '0.5.0',
                worldSize: config.get('world.size', { width: 200, height: 200 }),
                rules: config.get('server.worldRules', {})
            });
        });

        // Agent API
        this.get('/api/agents', async (req, res) => {
            if (!agentStore) {
                return this.sendError(res, 503, 'Service Unavailable', 'Store not initialized');
            }
            const agents = await agentStore.getAllAgents();
            this.sendJson(res, { agents });
        });

        this.get('/api/agents/:agentId', async (req, res, { params }) => {
            if (!agentStore) {
                return this.sendError(res, 503, 'Service Unavailable', 'Store not initialized');
            }
            const agent = await agentStore.getAgent(params.agentId);
            if (!agent) {
                return this.sendError(res, 404, 'Not Found', 'Agent not found');
            }
            this.sendJson(res, { agent });
        });

        this.put('/api/agents/:agentId', async (req, res, { params, body }) => {
            if (!agentStore) {
                return this.sendError(res, 503, 'Service Unavailable', 'Store not initialized');
            }
            const agent = await agentStore.updateAgent(params.agentId, body);
            this.sendJson(res, { agent });
        });

        // Task API
        this.get('/api/tasks', async (req, res) => {
            if (!taskStore) {
                return this.sendError(res, 503, 'Service Unavailable', 'Store not initialized');
            }
            const tasks = await taskStore.getAvailableTasks();
            this.sendJson(res, { tasks });
        });

        this.get('/api/tasks/:taskId', async (req, res, { params }) => {
            if (!taskStore) {
                return this.sendError(res, 503, 'Service Unavailable', 'Store not initialized');
            }
            const task = await taskStore.getTask(params.taskId);
            if (!task) {
                return this.sendError(res, 404, 'Not Found', 'Task not found');
            }
            this.sendJson(res, { task });
        });

        this.post('/api/tasks', async (req, res, { body }) => {
            if (!taskStore) {
                return this.sendError(res, 503, 'Service Unavailable', 'Store not initialized');
            }
            const task = await taskStore.createTask(body);
            this.sendJson(res, { task }, 201);
        });

        this.post('/api/tasks/:taskId/accept', async (req, res, { params, body }) => {
            if (!taskStore) {
                return this.sendError(res, 503, 'Service Unavailable', 'Store not initialized');
            }
            const { agentId } = body;
            const task = await taskStore.acceptTask(params.taskId, agentId);
            this.sendJson(res, { task });
        });

        this.post('/api/tasks/:taskId/complete', async (req, res, { params, body }) => {
            if (!taskStore) {
                return this.sendError(res, 503, 'Service Unavailable', 'Store not initialized');
            }
            const { agentId } = body;
            const task = await taskStore.completeTask(params.taskId, agentId);
            this.sendJson(res, { task });
        });

        // Reputation API
        this.get('/api/reputation/:agentId', async (req, res, { params }) => {
            if (!reputationStore) {
                return this.sendError(res, 503, 'Service Unavailable', 'Store not initialized');
            }
            const reputation = await reputationStore.getReputation(params.agentId);
            this.sendJson(res, { reputation });
        });

        this.get('/api/reputation/:agentId/history', async (req, res, { params }) => {
            if (!reputationStore) {
                return this.sendError(res, 503, 'Service Unavailable', 'Store not initialized');
            }
            const history = await reputationStore.getHistory(params.agentId);
            this.sendJson(res, { history });
        });

        this.get('/api/leaderboard', async (req, res) => {
            if (!reputationStore) {
                return this.sendError(res, 503, 'Service Unavailable', 'Store not initialized');
            }
            const leaderboard = await reputationStore.getLeaderboard(20);
            this.sendJson(res, { leaderboard });
        });

        logger.info('[HTTP] 默认路由初始化完成');
    }
}

// 导出
const httpHandler = new HTTPHandler();

module.exports = {
    httpHandler,
    HTTPHandler
};
