/**
 * Stores - Store 导出
 */

const BaseStore = require('./base-store');
const AgentStore = require('./agent-store');
const TaskStore = require('./task-store');
const ReputationStore = require('./reputation-store');
const MemoryStore = require('./memory-store');
const StateStore = require('./state-store');
const IdentityStore = require('./identity-store');
const PaymentStore = require('./payment-store');
const { Cache, MultiLevelCache, globalCache } = require('./cache');

// 创建单例实例
const agentStore = new AgentStore();
const taskStore = new TaskStore();
const reputationService = new ReputationStore(); // 或 ReputationService
const memoryStore = new MemoryStore();
const stateStore = new StateStore();
const identityStore = new IdentityStore();
const paymentStore = new PaymentStore();

module.exports = {
    BaseStore,
    AgentStore,
    TaskStore,
    ReputationStore,
    MemoryStore,
    StateStore,
    IdentityStore,
    PaymentStore,
    Cache,
    MultiLevelCache,
    globalCache,
    // 单例实例
    agentStore,
    taskStore,
    reputationService,
    memoryStore,
    stateStore,
    identityStore,
    paymentStore	
};
