/**
 * Stores - Store 导出
 */

const BaseStore = require('./base-store');
const AgentStore = require('./agent-store');
const TaskStore = require('./task-store');
const ReputationStore = require('./reputation-store');
const { Cache, MultiLevelCache, globalCache } = require('./cache');

module.exports = {
    BaseStore,
    AgentStore,
    TaskStore,
    ReputationStore,
    Cache,
    MultiLevelCache,
    globalCache
};
