/**
 * WeatherSystem - 天气系统
 */

const logger = require('../../utils/logger');
const config = require('../../utils/config-loader');

class WeatherSystem {
    constructor() {
        this.currentWeather = 'sunny';
        this.nextChangeTime = 0;
        this.transitionProgress = 0;
        this.isTransitioning = false;

        this.weatherConfig = config.getValue('world.weather', {
            changeInterval: 300000, // 5分钟
            default: 'sunny',
            types: ['sunny', 'cloudy', 'rainy', 'snowy']
        });

        this.weatherEffects = {
            sunny: {
                skyColor: 0x87CEEB,
                lightIntensity: 1.0,
                moodBonus: 0.1,
                description: '阳光明媚'
            },
            cloudy: {
                skyColor: 0x708090,
                lightIntensity: 0.7,
                moodBonus: 0,
                description: '多云'
            },
            rainy: {
                skyColor: 0x4A4A4A,
                lightIntensity: 0.5,
                moodBonus: -0.1,
                description: '下雨'
            },
            snowy: {
                skyColor: 0xE8E8E8,
                lightIntensity: 0.6,
                moodBonus: -0.15,
                description: '下雪'
            }
        };

        this.lastUpdate = Date.now();
    }

    /**
     * 更新天气
     */
    update(deltaTime) {
        const now = Date.now();

        // 检查是否需要切换天气
        if (now >= this.nextChangeTime) {
            this.changeWeather();
            this.nextChangeTime = now + this.weatherConfig.changeInterval;
        }

        // 更新过渡
        if (this.isTransitioning) {
            this.transitionProgress += deltaTime / 5000; // 5秒过渡
            if (this.transitionProgress >= 1) {
                this.transitionProgress = 1;
                this.isTransitioning = false;
            }
        }

        this.lastUpdate = now;

        return this.getState();
    }

    /**
     * 切换天气
     */
    changeWeather() {
        const types = this.weatherConfig.types || ['sunny', 'cloudy', 'rainy', 'snowy'];
        let newWeather;

        // 不连续两次相同的天气
        do {
            newWeather = types[Math.floor(Math.random() * types.length)];
        } while (newWeather === this.currentWeather);

        this.previousWeather = this.currentWeather;
        this.currentWeather = newWeather;
        this.isTransitioning = true;
        this.transitionProgress = 0;

        logger.info(`[Weather] Changed to ${newWeather}`);
    }

    /**
     * 获取当前天气效果
     */
    getCurrentEffects() {
        const current = this.weatherEffects[this.currentWeather];
        const previous = this.previousWeather ? this.weatherEffects[this.previousWeather] : current;

        if (!this.isTransitioning) {
            return current;
        }

        // 线性插值过渡效果
        return {
            skyColor: this.interpolateColor(previous.skyColor, current.skyColor, this.transitionProgress),
            lightIntensity: previous.lightIntensity + (current.lightIntensity - previous.lightIntensity) * this.transitionProgress,
            moodBonus: previous.moodBonus + (current.moodBonus - previous.moodBonus) * this.transitionProgress,
            description: current.description
        };
    }

    /**
     * 插值颜色
     */
    interpolateColor(color1, color2, t) {
        const r1 = (color1 >> 16) & 0xFF;
        const g1 = (color1 >> 8) & 0xFF;
        const b1 = color1 & 0xFF;

        const r2 = (color2 >> 16) & 0xFF;
        const g2 = (color2 >> 8) & 0xFF;
        const b2 = color2 & 0xFF;

        const r = Math.round(r1 + (r2 - r1) * t);
        const g = Math.round(g1 + (g2 - g1) * t);
        const b = Math.round(b1 + (b2 - b1) * t);

        return (r << 16) | (g << 8) | b;
    }

    /**
     * 获取状态
     */
    getState() {
        return {
            current: this.currentWeather,
            effects: this.getCurrentEffects(),
            isTransitioning: this.isTransitioning,
            transitionProgress: this.transitionProgress,
            nextChange: this.nextChangeTime
        };
    }
}

module.exports = WeatherSystem;
