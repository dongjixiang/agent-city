/**
 * WeatherSystem - 天气系统
 * 
 * 负责管理天气状态和广播天气变化事件
 */

class WeatherSystem {
    constructor() {
        this.currentWeather = 'sunny';
        this.availableWeathers = ['sunny', 'cloudy', 'rainy', 'snowy', 'foggy'];
        this.listeners = [];
    }

    /**
     * 获取当前天气
     */
    getCurrentWeather() {
        return this.currentWeather;
    }

    /**
     * 设置天气
     */
    setWeather(weather) {
        const prev = this.currentWeather;
        if (prev !== weather && this.availableWeathers.includes(weather)) {
            this.currentWeather = weather;
            console.log(`[WeatherSystem] Weather changed: ${prev} -> ${weather}`);
            
            // 通知所有监听器
            for (const listener of this.listeners) {
                listener(prev, weather);
            }
            
            return { previousWeather: prev, weather };
        }
        return null;
    }

    /**
     * 添加天气变化监听器
     */
    addListener(callback) {
        this.listeners.push(callback);
    }

    /**
     * 移除天气变化监听器
     */
    removeListener(callback) {
        const index = this.listeners.indexOf(callback);
        if (index > -1) {
            this.listeners.splice(index, 1);
        }
    }

    /**
     * 获取可用的天气类型
     */
    getAvailableWeathers() {
        return [...this.availableWeathers];
    }

    /**
     * 根据时间自动设置天气（简单逻辑）
     */
    setWeatherByTime(hour) {
        // 简化逻辑：白天晴天，晚上多云
        if (hour >= 6 && hour < 18) {
            this.setWeather('sunny');
        } else {
            this.setWeather('cloudy');
        }
    }
}

module.exports = WeatherSystem;
