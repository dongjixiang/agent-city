/**
 * Middleware - 中间件导出
 */

const auth = require('./auth');
const rateLimit = require('./rate-limit');
const validator = require('./validator');
const logger = require('./logger');
const errorHandler = require('./error-handler');

module.exports = {
    ...auth,
    ...rateLimit,
    ...validator,
    ...logger,
    ...errorHandler
};
