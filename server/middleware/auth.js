/**
 * Auth - 认证中间件
 * 
 * 验证请求的认证信息
 */

const logger = require('../utils/logger');
const { verifyJWT } = require('../utils/crypto');
const config = require('../utils/config-loader');

/**
 * 从请求中提取 token
 */
function extractToken(req) {
    // Header: Authorization: Bearer <token>
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.substring(7);
    }

    // Query: ?token=xxx
    const url = new URL(req.url, `http://${req.headers.host}`);
    return url.searchParams.get('token');
}

/**
 * 验证 token
 */
function verifyToken(token) {
    const secret = process.env.JWT_SECRET || 'agent-city-secret-key';
    const payload = verifyJWT(token, secret);
    return payload;
}

/**
 * 认证中间件
 */
function auth(options = {}) {
    const {
        required = true,
        optional = false
    } = options;

    return async (req, res, next) => {
        const token = extractToken(req);

        if (!token) {
            if (required) {
                res.writeHead(401, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Unauthorized', message: 'No token provided' }));
                return;
            }
            req.auth = null;
            next();
            return;
        }

        const payload = verifyToken(token);
        if (!payload) {
            if (required) {
                res.writeHead(401, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Unauthorized', message: 'Invalid token' }));
                return;
            }
            req.auth = null;
            next();
            return;
        }

        req.auth = payload;
        next();
    };
}

/**
 * 验证 API Key
 */
function apiKeyAuth(options = {}) {
    const { required = true } = options;

    return (req, res, next) => {
        const apiKey = req.headers['x-api-key'] || req.headers['api-key'];
        const validKey = process.env.API_KEY || 'agent-city-api-key';

        if (!apiKey) {
            if (required) {
                res.writeHead(401, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Unauthorized', message: 'No API key provided' }));
                return;
            }
            next();
            return;
        }

        if (apiKey !== validKey) {
            res.writeHead(403, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Forbidden', message: 'Invalid API key' }));
            return;
        }

        next();
    };
}

/**
 * 验证 Agent ID
 */
function validateAgentId(req, res, next) {
    const { agentId } = req.params;

    if (!agentId) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Bad Request', message: 'agentId is required' }));
        return;
    }

    // 简单验证格式
    if (!/^[a-zA-Z0-9_-]+$/.test(agentId)) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Bad Request', message: 'Invalid agentId format' }));
        return;
    }

    next();
}

/**
 * 验证 WebSocket 连接
 */
function validateWSConnection(ws) {
    const token = ws.token;
    const agentId = ws.agentId;

    if (!agentId) {
        return { valid: false, error: 'No agentId' };
    }

    if (token) {
        const payload = verifyToken(token);
        if (!payload) {
            return { valid: false, error: 'Invalid token' };
        }
    }

    return { valid: true };
}

module.exports = {
    extractToken,
    verifyToken,
    auth,
    apiKeyAuth,
    validateAgentId,
    validateWSConnection
};
