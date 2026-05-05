/**
 * ErrorHandler - 错误处理中间件
 * 
 * 统一处理所有错误
 */

const logger = require('../utils/logger');

/**
 * 自定义错误类
 */
class AppError extends Error {
    constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * 验证错误
 */
class ValidationError extends AppError {
    constructor(message, details = []) {
        super(message, 400, 'VALIDATION_ERROR');
        this.details = details;
    }
}

/**
 * 未找到错误
 */
class NotFoundError extends AppError {
    constructor(resource = 'Resource') {
        super(`${resource} not found`, 404, 'NOT_FOUND');
    }
}

/**
 * 认证错误
 */
class AuthError extends AppError {
    constructor(message = 'Authentication required') {
        super(message, 401, 'AUTH_ERROR');
    }
}

/**
 * 权限错误
 */
class ForbiddenError extends AppError {
    constructor(message = 'Permission denied') {
        super(message, 403, 'FORBIDDEN');
    }
}

/**
 * 速率限制错误
 */
class RateLimitError extends AppError {
    constructor(retryAfter = 60) {
        super('Rate limit exceeded', 429, 'RATE_LIMIT');
        this.retryAfter = retryAfter;
    }
}

/**
 * 错误处理中间件
 */
function errorHandler(err, req, res, next) {
    // 记录错误
    logger.error(`[Error] ${err.message}`, {
        stack: err.stack,
        code: err.code,
        statusCode: err.statusCode,
        url: req.url,
        method: req.method
    });

    // 如果已经发送了响应，就不再处理
    if (res.headersSent) {
        return next(err);
    }

    // 处理错误
    const statusCode = err.statusCode || 500;
    const code = err.code || 'INTERNAL_ERROR';

    res.writeHead(statusCode, { 'Content-Type': 'application/json' });

    const response = {
        error: {
            code,
            message: err.isOperational ? err.message : 'Internal server error'
        }
    };

    // 添加详细信息（仅开发环境）
    if (process.env.NODE_ENV === 'development') {
        response.error.stack = err.stack;
        if (err.details) {
            response.error.details = err.details;
        }
    }

    // 添加重试时间（速率限制）
    if (err.retryAfter) {
        response.error.retryAfter = err.retryAfter;
        res.setHeader('Retry-After', err.retryAfter);
    }

    res.end(JSON.stringify(response));
}

/**
 * 404 处理
 */
function notFoundHandler(req, res) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
        error: {
            code: 'NOT_FOUND',
            message: `Route ${req.method} ${req.url} not found`
        }
    }));
}

/**
 * 异步处理包装
 */
function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}

module.exports = {
    AppError,
    ValidationError,
    NotFoundError,
    AuthError,
    ForbiddenError,
    RateLimitError,
    errorHandler,
    notFoundHandler,
    asyncHandler
};
