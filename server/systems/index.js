/**
 * Systems - 系统导出
 */

const EcologySystem = require('./ecology/ecology-system');
const Animal = require('./ecology/animal');
const BirdFlock = require('./ecology/bird-flock');
const WeatherSystem = require('./weather-system');
const DayNightSystem = require('./daynight-system');
const EventDispatcher = require('./event-dispatcher');
const ContextBuilder = require('./context-builder');
const PromptBuilder = require('./prompt-builder');

module.exports = {
    EcologySystem,
    Animal,
    BirdFlock,
    WeatherSystem,
    DayNightSystem,
    EventDispatcher,
    ContextBuilder,
    PromptBuilder
};
