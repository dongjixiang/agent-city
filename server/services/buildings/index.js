/**
 * Buildings - 建筑服务导出
 */

const BuildingBase = require('./building-base');
const { TaskCenter, taskCenter, setStores: setTaskCenterStores } = require('./task-center');
const { ReputationTower, reputationTower, setStores: setReputationStores } = require('./reputation-tower');
const { TradingCenter, tradingCenter, setStores: setTradingStores } = require('./trading-center');
const { Archive, archive, setStores: setArchiveStores } = require('./archive');
const { MessageStation, messageStation, setStores: setMessageStores } = require('./message-station');
const { DataCenter, dataCenter, setStores: setDataCenterStores } = require('./data-center');
const { CreativeWorkshop, creativeWorkshop, setStores: setCreativeStores } = require('./creative-workshop');
const { SkillAcademy, skillAcademy, setStores: setSkillAcademyStores } = require('./skill-academy');

/**
 * 初始化所有建筑服务
 */
function initializeBuildings(stores) {
    // 设置依赖
    setTaskCenterStores(stores);
    setReputationStores(stores);
    setTradingStores(stores);
    setArchiveStores(stores);
    setMessageStores(stores);
    setDataCenterStores(stores);
    setCreativeStores(stores);
    setSkillAcademyStores(stores);

    return {
        taskCenter,
        reputationTower,
        tradingCenter,
        archive,
        messageStation,
        dataCenter,
        creativeWorkshop,
        skillAcademy
    };
}

/**
 * 获取所有建筑
 */
function getAllBuildings() {
    return [
        taskCenter,
        reputationTower,
        tradingCenter,
        archive,
        messageStation,
        dataCenter,
        creativeWorkshop,
        skillAcademy
    ];
}

/**
 * 根据 ID 获取建筑
 */
function getBuildingById(id) {
    const buildings = getAllBuildings();
    return buildings.find(b => b.id === id);
}

module.exports = {
    BuildingBase,
    TaskCenter,
    taskCenter,
    ReputationTower,
    reputationTower,
    TradingCenter,
    tradingCenter,
    Archive,
    archive,
    MessageStation,
    messageStation,
    DataCenter,
    dataCenter,
    CreativeWorkshop,
    creativeWorkshop,
    SkillAcademy,
    skillAcademy,
    initializeBuildings,
    getAllBuildings,
    getBuildingById
};
