/**
 * Services - Service 导出
 */

const { agentService, AgentService, setStores: setAgentStores } = require('./agent-service');
const { taskService, TaskService, setStores: setTaskStores } = require('./task-service');
const { messageService, MessageService, setStores: setMessageStores } = require('./message-service');
const { relationService, RelationService } = require('./relation-service');
const { partyService, PartyService } = require('./party-service');
const { guildService, GuildService } = require('./guild-service');
const { petService, PetService } = require('./pet-service');
const { achievementService, AchievementService } = require('./achievement-service');
const { appearanceService, AppearanceService } = require('./appearance-service');

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
        guildService,
        petService,
        achievementService,
        appearanceService
    };
}

module.exports = {
    agentService,
    taskService,
    messageService,
    relationService,
    partyService,
    guildService,
    petService,
    achievementService,
    appearanceService,
    AgentService,
    TaskService,
    MessageService,
    RelationService,
    PartyService,
    GuildService,
    PetService,
    AchievementService,
    AppearanceService,
    initializeServices
};
