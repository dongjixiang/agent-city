/**
 * TimeSystem - 时间系统
 * 
 * 负责：
 * - 游戏内时间管理
 * - 时间流速控制
 * - 昼夜计算
 */

class TimeSystem {
    constructor() {
        // 初始时间：上午8点
        this.hour = 8;
        this.minute = 0;
        
        // 时间流速（1.0 = 真实时间）
        this.speed = 1.0;
        
        // 时间是否暂停
        this.isPaused = false;
        
        // 变化检测
        this._lastHour = this.hour;
        this._lastMinute = this.minute;
        this._changed = false;
    }
    
    /**
     * 每帧更新
     * @param {number} deltaTime - 距离上一帧的毫秒数
     */
    tick(deltaTime) {
        if (this.isPaused) return;
        
        // deltaTime 毫秒 = deltaTime / 60000 分钟（真实时间）
        // 乘以 speed 得到游戏内分钟数
        const minutesPassed = (deltaTime / 60000) * this.speed;
        this.minute += minutesPassed;
        
        // 处理进位
        while (this.minute >= 60) {
            this.minute -= 60;
            this.hour++;
        }
        while (this.hour >= 24) {
            this.hour -= 24;
        }
        
        // 检测变化
        if (Math.floor(this.hour) !== Math.floor(this._lastHour) ||
            Math.floor(this.minute) !== Math.floor(this._lastMinute)) {
            this._changed = true;
        }
        
        this._lastHour = this.hour;
        this._lastMinute = this.minute;
    }
    
    /**
     * 检查时间是否变化（用于增量更新）
     */
    hasChanged() {
        if (this._changed) {
            this._changed = false;
            return true;
        }
        return false;
    }
    
    /**
     * 设置时间
     */
    setTime(hour, minute = 0) {
        this.hour = hour;
        this.minute = minute;
        this._changed = true;
    }
    
    /**
     * 设置时间流速
     */
    setSpeed(speed) {
        this.speed = Math.max(0, Math.min(speed, 100)); // 限制范围 0-100
    }
    
    /**
     * 暂停时间
     */
    pause() {
        this.isPaused = true;
    }
    
    /**
     * 恢复时间
     */
    resume() {
        this.isPaused = false;
    }
    
    /**
     * 获取时间描述
     */
    getTimeDescription() {
        const hour = Math.floor(this.hour);
        
        if (hour >= 5 && hour < 8) return "黎明";
        if (hour >= 8 && hour < 11) return "上午";
        if (hour >= 11 && hour < 13) return "中午";
        if (hour >= 13 && hour < 18) return "下午";
        if (hour >= 18 && hour < 20) return "傍晚";
        if (hour >= 20 && hour < 23) return "夜晚";
        if (hour >= 23 || hour < 5) return "深夜";
        
        return "未知";
    }
    
    /**
     * 获取时间段
     */
    getTimeOfDay() {
        const hour = Math.floor(this.hour);
        
        if (hour >= 6 && hour < 18) return "day";      // 白天
        if (hour >= 18 && hour < 20) return "sunset";  // 黄昏
        return "night";                                  // 夜晚
    }
    
    /**
     * 获取光照等级 (0-1)
     */
    getLightLevel() {
        const hour = this.hour;
        
        // 黎明 (5-8): 0.2 -> 1.0
        if (hour >= 5 && hour < 8) {
            return 0.2 + (hour - 5) / 3 * 0.8;
        }
        
        // 白天 (8-18): 1.0
        if (hour >= 8 && hour < 18) {
            return 1.0;
        }
        
        // 黄昏 (18-20): 1.0 -> 0.2
        if (hour >= 18 && hour < 20) {
            return 1.0 - (hour - 18) / 2 * 0.8;
        }
        
        // 夜晚 (20-5): 0.2
        return 0.2;
    }
    
    /**
     * 获取天空颜色
     */
    getSkyColor() {
        const timeOfDay = this.getTimeOfDay();
        
        switch (timeOfDay) {
            case "day":
                return 0x87CEEB; // 天蓝色
            case "sunset":
                return 0xFF6B35; // 橙红色
            case "night":
                return 0x1a1a2e; // 深蓝色
            default:
                return 0x87CEEB;
        }
    }
    
    /**
     * 获取环境光强度
     */
    getAmbientIntensity() {
        return this.getLightLevel() * 1.0;
    }
    
    /**
     * 获取格式化时间字符串
     */
    getFormattedTime() {
        const h = Math.floor(this.hour).toString().padStart(2, '0');
        const m = Math.floor(this.minute).toString().padStart(2, '0');
        return `${h}:${m}`;
    }
    
    /**
     * 获取状态（用于序列化）
     */
    getState() {
        return {
            hour: this.hour,
            minute: this.minute,
            speed: this.speed,
            isPaused: this.isPaused,
            description: this.getTimeDescription(),
            timeOfDay: this.getTimeOfDay(),
            lightLevel: this.getLightLevel(),
            formattedTime: this.getFormattedTime()
        };
    }
}

module.exports = TimeSystem;
