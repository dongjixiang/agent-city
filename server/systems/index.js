/**
 * Systems - 系统导出
 */

const EcologySystem = require('./ecology/ecology-system');
const Animal = require('./ecology/animal');
const BirdFlock = require('./ecology/bird-flock');
const WeatherSystem = require('./weather-system');
const DayNightSystem = require('./daynight-system');

module.exports = {
    EcologySystem,
    Animal,
    BirdFlock,
    WeatherSystem,
    DayNightSystem
};
