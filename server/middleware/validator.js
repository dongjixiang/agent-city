/**
 * Validator - 参数验证中间件
 * 
 * 验证请求参数
 */

const { validate, ValidationResult } = require('../utils/validation');

/**
 * 创建验证中间件
 * 
 * @param {Object} rules - 验证规则
 * @param {string} source - 参数来源 ('body', 'query', 'params')
 */
function validateRequest(rules, source = 'body') {
    return (req, res, next) => {
        const data = req[source] || {};

        const result = validate(data, rules);

        if (!result.valid) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                error: 'Validation Error',
                message: 'Request validation failed',
                details: result.errors
            }));
            return;
        }

        next();
    };
}

/**
 * 验证必填字段
 */
function required(fields, source = 'body') {
    const rules = {};
    for (const field of fields) {
        rules[field] = [value => {
            if (value === undefined || value === null || value === '') {
                return `${field} is required`;
            }
            return null;
        }];
    }
    return validateRequest(rules, source);
}

/**
 * 验证 Agent 注册
 */
const validateRegister = validateRequest({
    agentId: [
        value => {
            if (!value) return 'agentId is required';
            if (!/^[a-zA-Z0-9_-]{2,20}$/.test(value)) {
                return 'agentId must be 2-20 alphanumeric characters';
            }
            return null;
        }
    ],
    name: [
        value => {
            if (!value) return 'name is required';
            if (value.length < 2 || value.length > 20) {
                return 'name must be 2-20 characters';
            }
            return null;
        }
    ],
    type: [
        value => {
            if (!value) return 'type is required';
            const validTypes = ['explorer', 'merchant', 'scholar', 'artist', 'guardian', 'wanderer'];
            if (!validTypes.includes(value)) {
                return `type must be one of: ${validTypes.join(', ')}`;
            }
            return null;
        }
    ]
}, 'body');

/**
 * 验证消息
 */
const validateMessage = validateRequest({
    to: [
        value => {
            if (!value) return 'to is required';
            return null;
        }
    ],
    content: [
        value => {
            if (!value) return 'content is required';
            if (value.length > 1000) return 'content too long (max 1000)';
            return null;
        }
    ]
}, 'body');

/**
 * 验证移动
 */
const validateMove = validateRequest({
    x: [
        value => {
            if (typeof value !== 'number') return 'x must be a number';
            if (Math.abs(value) > 100) return 'x out of bounds';
            return null;
        }
    ],
    z: [
        value => {
            if (typeof value !== 'number') return 'z must be a number';
            if (Math.abs(value) > 100) return 'z out of bounds';
            return null;
        }
    ]
}, 'body');

/**
 * 验证任务创建
 */
const validateTaskCreate = validateRequest({
    title: [
        value => {
            if (!value) return 'title is required';
            if (value.length < 3 || value.length > 100) {
                return 'title must be 3-100 characters';
            }
            return null;
        }
    ],
    description: [
        value => {
            if (value && value.length > 500) return 'description too long (max 500)';
            return null;
        }
    ],
    reward: [
        value => {
            if (typeof value !== 'object' || !value.reputation || !value.coins) {
                return 'reward with reputation and coins is required';
            }
            return null;
        }
    ]
}, 'body');

/**
 * 清理输入
 */
function sanitizeInput(req, res, next) {
    if (req.body && typeof req.body === 'object') {
        req.body = sanitizeObject(req.body);
    }
    if (req.query && typeof req.query === 'object') {
        req.query = sanitizeObject(req.query);
    }
    next();
}

/**
 * 递归清理对象
 */
function sanitizeObject(obj) {
    if (typeof obj === 'string') {
        return obj.trim().replace(/[<>]/g, '');
    }
    if (Array.isArray(obj)) {
        return obj.map(sanitizeObject);
    }
    if (obj && typeof obj === 'object') {
        const result = {};
        for (const [key, value] of Object.entries(obj)) {
            // 只允许字母、数字、下划线、连字符作为 key
            if (/^[a-zA-Z0-9_-]+$/.test(key)) {
                result[key] = sanitizeObject(value);
            }
        }
        return result;
    }
    return obj;
}

module.exports = {
    validateRequest,
    required,
    validateRegister,
    validateMessage,
    validateMove,
    validateTaskCreate,
    sanitizeInput
};
