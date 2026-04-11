/**
 * Services - Service 导出
 */

const { agentService, AgentService, setStores: setAgentStores } = require('./agent-service');
const { taskService, TaskService, setStores: setTaskStores } = require('./task-service');
const { messageService, MessageService, setStores: setMessageStores } = require('./message-service');

/**
 * 初始化所有服务
 */
function initializeServices(stores) {
    setAgentStores(stores);
    setTaskStores(stores);
    setMessageStores(stores);

    return {
        agentService,
        taskService,
        messageService
    };
}

module.exports = {
    agentService,
    taskService,
    messageService,
    AgentService,
    TaskService,
    MessageService,
    initializeServices
};
