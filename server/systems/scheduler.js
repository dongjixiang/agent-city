/**
 * Scheduler - 定时任务调度器
 * 
 * 负责管理智能体的定期快照定时器
 */

class Scheduler {
    constructor() {
        this.timers = new Map(); // agentId -> timerId
        this.callbacks = new Map(); // agentId -> callback
        this.defaultInterval = 10000; // 10秒
    }

    /**
     * 启动定时器
     */
    startTimer(agentId, callback, intervalMs = this.defaultInterval) {
        this.stopTimer(agentId);
        
        const timer = setInterval(() => {
            callback(agentId);
        }, intervalMs);
        
        this.timers.set(agentId, timer);
        this.callbacks.set(agentId, callback);
        console.log(`[Scheduler] Timer started for ${agentId}, interval: ${intervalMs}ms`);
    }

    /**
     * 停止定时器
     */
    stopTimer(agentId) {
        if (this.timers.has(agentId)) {
            clearInterval(this.timers.get(agentId));
            this.timers.delete(agentId);
            this.callbacks.delete(agentId);
        }
    }

    /**
     * 重启定时器（间隔改变时）
     */
    restartTimer(agentId, callback, intervalMs) {
        this.stopTimer(agentId);
        this.startTimer(agentId, callback, intervalMs);
    }

    /**
     * 获取定时器间隔
     */
    getInterval(agentId) {
        // 返回保存的间隔值（如果有）
        return this._intervals?.get(agentId) || this.defaultInterval;
    }

    /**
     * 设置默认间隔
     */
    setDefaultInterval(intervalMs) {
        this.defaultInterval = intervalMs;
    }

    /**
     * 检查定时器是否运行中
     */
    isRunning(agentId) {
        return this.timers.has(agentId);
    }

    /**
     * 获取所有活跃定时器的数量
     */
    getActiveCount() {
        return this.timers.size;
    }

    /**
     * 停止所有定时器
     */
    stopAll() {
        for (const timer of this.timers.values()) {
            clearInterval(timer);
        }
        this.timers.clear();
        this.callbacks.clear();
    }
}

module.exports = Scheduler;
