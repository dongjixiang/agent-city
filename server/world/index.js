/**
 * World Modules - 服务端世界状态系统
 * 
 * 导出所有世界状态相关模块
 */

const WorldState = require('./world-state');
const TerrainManager = require('./terrain-manager');
const BuildingManager = require('./building-manager');
const AgentsState = require('./agents-state');
const TimeSystem = require('./time-system');
const WeatherSystem = require('./weather-system');
const DecorationsManager = require('./decorations-manager');

module.exports = {
    // 核心
    WorldState,
    
    // 子系统
    TerrainManager,
    BuildingManager,
    AgentsState,
    TimeSystem,
    WeatherSystem,
    DecorationsManager
};
