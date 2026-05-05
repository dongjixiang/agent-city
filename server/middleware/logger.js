/**
 * RequestLogger - 请求日志中间件
 * 
 * 记录所有 HTTP 请求
 */

const logger = require('../utils/logger');
const { formatDate } = require('../utils/time');

/**
 * 创建请求日志中间件
 */
function requestLogger(options = {}) {
    const {
        logBody = false,
        logResponse = false,
        excludePaths = ['/api/health', '/favicon.ico']
    } = options;

    return async (req, res, next) => {
        // 跳过排除的路径
        if (excludePaths.includes(req.url)) {
            next();
            return;
        }

        const startTime = Date.now();
        const { method, url } = req;
        const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
                  req.ip ||
                  req.socket.remoteAddress;

        // 记录请求
        logger.debug(`[Request] ${method} ${url}`, {
            ip,
            userAgent: req.headers['user-agent']
        });

        // 保存原始 end
        const originalEnd = res.end;
        const responseBody = [];

        res.end = function(chunk, encoding) {
            res.end = originalEnd;
            res.end(chunk, encoding);

            const duration = Date.now() - startTime;
            const { statusCode } = res;

            // 根据状态码选择日志级别
            const logLevel = statusCode >= 500 ? 'error' :
                             statusCode >= 400 ? 'warn' : 'info';

            const logData = {
                method,
                url,
                status: statusCode,
                duration: `${duration}ms`,
                ip
            };

            if (logBody && req.body && Object.keys(req.body).length > 0) {
                logData.body = req.body;
            }

            if (logLevel === 'error') {
                logger.error(`[Request] ${method} ${url} ${statusCode}`, logData);
            } else if (logLevel === 'warn') {
                logger.warn(`[Request] ${method} ${url} ${statusCode}`, logData);
            } else {
                logger.info(`[Request] ${method} ${url} ${statusCode} ${duration}ms`);
            }
        };

        next();
    };
}

/**
 * 创建 WebSocket 日志中间件
 */
function wsLogger() {
    return {
        onConnect(ws, req) {
            const ip = req.socket.remoteAddress;
            logger.info(`[WS] Connection open`, { ip, url: req.url });
        },

        onMessage(msg) {
            logger.debug(`[WS] Message received`, {
                type: msg.type,
                size: JSON.stringify(msg).length
            });
        },

        onSend(data) {
            logger.debug(`[WS] Message sent`, {
                type: data.type,
                size: JSON.stringify(data).length
            });
        },

        onClose(ws, code, reason) {
            logger.info(`[WS] Connection closed`, {
                code,
                reason: reason?.toString()
            });
        },

        onError(ws, err) {
            logger.error(`[WS] Error`, { error: err.message });
        }
    };
}

module.exports = {
    requestLogger,
    wsLogger
};
