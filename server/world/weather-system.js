/**
 * WeatherSystem - 天气系统
 * 
 * 负责：
 * - 天气状态管理
 * - 天气过渡效果
 * - 天气视觉参数
 */

class WeatherSystem {
    constructor() {
        // 当前天气
        this.type = "sunny";
        
        // 天气参数
        this.temperature = 25;  // 摄氏度
        this.humidity = 50;     // 百分比
        this.wind = { 
            speed: 0,          // 风速 m/s
            direction: 0       // 风向 弧度
        };
        
        // 天气配置
        this.weatherConfigs = {
            sunny: {
                name: "晴天",
                temperature: 25,
                humidity: 50,
                wind: 0,
                fog: { density: 0, color: 0xffffff },
                ambient: { intensity: 1.0 },
                sky: { color: 0x87CEEB },
                particles: []
            },
            cloudy: {
                name: "多云",
                temperature: 22,
                humidity: 60,
                wind: 5,
                fog: { density: 0.005, color: 0x999999 },
                ambient: { intensity: 0.8 },
                sky: { color: 0x9999aa },
                particles: []
            },
            rainy: {
                name: "雨天",
                temperature: 18,
                humidity: 90,
                wind: 10,
                fog: { density: 0.02, color: 0x666666 },
                ambient: { intensity: 0.6 },
                sky: { color: 0x555566 },
                particles: [
                    { type: "rain", count: 500, speed: 1.5, color: 0xaaaacc }
                ]
            },
            snowy: {
                name: "雪天",
                temperature: -2,
                humidity: 70,
                wind: 3,
                fog: { density: 0.03, color: 0xcccccc },
                ambient: { intensity: 0.5 },
                sky: { color: 0xcccccc },
                particles: [
                    { type: "snow", count: 300, speed: 0.5, color: 0xffffff }
                ]
            },
            foggy: {
                name: "雾天",
                temperature: 15,
                humidity: 95,
                wind: 1,
                fog: { density: 0.05, color: 0xaaaaaa },
                ambient: { intensity: 0.4 },
                sky: { color: 0xaaaaaa },
                particles: []
            },
            night: {
                name: "夜晚",
                temperature: 18,
                humidity: 70,
                wind: 2,
                fog: { density: 0.01, color: 0x222244 },
                ambient: { intensity: 0.2 },
                sky: { color: 0x1a1a2e },
                particles: []
            }
        };
        
        // 天气过渡
        this.transition = null;
        this.transitionDuration = 300000; // 默认5分钟
        
        // 变化检测
        this._changed = false;
        this._lastType = this.type;
    }
    
    /**
     * 每帧更新
     */
    tick(deltaTime) {
        // 处理天气过渡
        if (this.transition) {
            const elapsed = Date.now() - this.transition.startTime;
            const progress = Math.min(1, elapsed / this.transition.duration);
            
            if (progress >= 1) {
                this.type = this.transition.to;
                this.transition = null;
                this._changed = true;
            }
        }
        
        // 检测变化
        if (this.type !== this._lastType) {
            this._changed = true;
            this._lastType = this.type;
        }
    }
    
    /**
     * 检查是否变化
     */
    hasChanged() {
        if (this._changed) {
            this._changed = false;
            return true;
        }
        return false;
    }
    
    /**
     * 设置天气（带过渡效果）
     * @param {string} newType - 天气类型
     * @param {number} duration - 过渡时间（毫秒）
     */
    setWeather(newType, duration = this.transitionDuration) {
        if (!this.weatherConfigs[newType]) {
            console.warn(`[WeatherSystem] Unknown weather type: ${newType}`);
            return false;
        }
        
        if (newType === this.type && !this.transition) {
            return false; // 已经是这个天气
        }
        
        // 如果正在过渡中，直接切换到目标
        this.transition = {
            from: this.type,
            to: newType,
            startTime: Date.now(),
            duration: duration
        };
        
        this._changed = true;
        return true;
    }
    
    /**
     * 获取当前天气配置
     */
    getConfig() {
        return this.weatherConfigs[this.type] || this.weatherConfigs.sunny;
    }
    
    /**
     * 获取当前天气名称
     */
    getName() {
        return this.getConfig().name;
    }
    
    /**
     * 获取视觉参数（用于客户端渲染）
     */
    getVisualParams() {
        const config = this.getConfig();
        
        // 如果有过渡，计算插值
        let fogDensity = config.fog.density;
        let ambientIntensity = config.ambient.intensity;
        let skyColor = config.sky.color;
        
        if (this.transition) {
            const elapsed = Date.now() - this.transition.startTime;
            const progress = Math.min(1, elapsed / this.transition.duration);
            
            const fromConfig = this.weatherConfigs[this.transition.from];
            const toConfig = this.weatherConfigs[this.transition.to];
            
            // 线性插值
            fogDensity = this.lerp(fromConfig.fog.density, toConfig.fog.density, progress);
            ambientIntensity = this.lerp(fromConfig.ambient.intensity, toConfig.ambient.intensity, progress);
            
            // 颜色插值
            skyColor = this.lerpColor(fromConfig.sky.color, toConfig.sky.color, progress);
        }
        
        return {
            fog: {
                density: fogDensity,
                color: skyColor
            },
            ambient: {
                intensity: ambientIntensity
            },
            sky: {
                color: skyColor
            },
            particles: config.particles,
            temperature: config.temperature,
            humidity: config.humidity,
            wind: config.wind
        };
    }
    
    /**
     * 线性插值
     */
    lerp(a, b, t) {
        return a + (b - a) * t;
    }
    
    /**
     * 颜色插值
     */
    lerpColor(colorA, colorB, t) {
        const rA = (colorA >> 16) & 0xff;
        const gA = (colorA >> 8) & 0xff;
        const bA = colorA & 0xff;
        
        const rB = (colorB >> 16) & 0xff;
        const gB = (colorB >> 8) & 0xff;
        const bB = colorB & 0xff;
        
        const r = Math.round(this.lerp(rA, rB, t));
        const g = Math.round(this.lerp(gA, gB, t));
        const b = Math.round(this.lerp(bA, bB, t));
        
        return (r << 16) | (g << 8) | b;
    }
    
    /**
     * 获取状态（用于序列化）
     */
    getState() {
        const config = this.getConfig();
        
        return {
            type: this.type,
            name: config.name,
            temperature: config.temperature,
            humidity: config.humidity,
            wind: {
                speed: config.wind,
                direction: this.wind.direction
            },
            transition: this.transition ? {
                from: this.transition.from,
                to: this.transition.to,
                progress: Math.min(1, (Date.now() - this.transition.startTime) / this.transition.duration)
            } : null,
            visualParams: this.getVisualParams()
        };
    }
}

module.exports = WeatherSystem;
