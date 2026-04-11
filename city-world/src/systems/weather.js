/**
 * @fileoverview 天气系统
 * 
 * 职责：
 * - 天气状态管理（晴天/多云/雨天/雪天）
 * - 天气粒子效果
 * - 天气变化广播
 * 
 * 导出：
 * - window.getCurrentWeather
 * - window.setWeather
 * - window.toggleWeather
 * - window.updateWeatherParticles
 * 
 * @module systems/weather
 */

export const WeatherType = {
    SUNNY: 'sunny',
    CLOUDY: 'cloudy',
    RAINY: 'rainy',
    SNOWY: 'snowy'
};

let currentWeather = WeatherType.SUNNY;
let weatherParticles = null;

/**
 * 获取当前天气
 */
export function getCurrentWeather() {
    return currentWeather;
}

/**
 * 设置天气
 * @param {string} weather - WeatherType
 */
export function setWeather(weather) {
    currentWeather = weather;
    // 触发天气变化事件
    broadcastWeatherChange(weather);
}

/**
 * 切换天气
 */
export function toggleWeather() {
    const types = Object.values(WeatherType);
    const currentIndex = types.indexOf(currentWeather);
    const nextIndex = (currentIndex + 1) % types.length;
    setWeather(types[nextIndex]);
}

/**
 * 更新天气粒子
 * @param {number} deltaTime
 */
export function updateWeatherParticles(deltaTime) {
    // TODO: 实现粒子效果更新
}

/**
 * 广播天气变化
 */
function broadcastWeatherChange(weather) {
    // TODO: 通过 WebSocket 广播天气变化
}

// 挂载到 window
window.getCurrentWeather = getCurrentWeather;
window.setWeather = setWeather;
window.toggleWeather = toggleWeather;
window.updateWeatherParticles = updateWeatherParticles;

export default { WeatherType, getCurrentWeather, setWeather, toggleWeather, updateWeatherParticles };
