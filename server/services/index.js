/**
 * Services - Service 导出
 */

const { agentService, AgentService, setStores: setAgentStores } = require('./agent-service');
const { taskService, TaskService, setStores: setTaskStores } = require('./task-service');
const { messageService, MessageService, setStores: setMessageStores } = require('./message-service');
const { relationService, RelationService } = require('./relation-service');
const { partyService, PartyService } = require('./party-service');
const { guildService, GuildService } = require('./guild-service');

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
        messageService,
        relationService,
        partyService,
        guildService
    };
}

module.exports = {
    agentService,
    taskService,
    messageService,
    relationService,
    partyService,
    guildService,
    AgentService,
    TaskService,
    MessageService,
    RelationService,
    PartyService,
    GuildService,
    initializeServices
};
