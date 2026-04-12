/**
 * System - 系统基类
 * 
 * 所有游戏系统的抽象基类
 * 对应 DESIGN.md Section 3.1 System 基类
 * 
 * 设计原则：
 * 1. 所有系统都有 init/update/dispose 生命周期
 * 2. 系统之间通过 EventBus 通信
 * 3. 系统可以有依赖关系
 */

import { eventBus, Events } from './event-bus.js';

class System {
    /**
     * @param {string} name - 系统名称
     * @param {Object} config - 配置
     */
    constructor(name, config = {}) {
        this.name = name;
        this.config = config;
        
        // 状态
        this.initialized = false;
        this.isRunning = false;
        
        // 场景引用
        this.scene = null;
        
        // 依赖系统
        this.dependencies = [];
        
        // 内部状态
        this._state = new Map();
        
        // 事件监听器存储
        this._listeners = [];
    }

    /**
     * 初始化系统
     * @param {Object} context - 初始化上下文 { scene, ...其他系统 }
     * @returns {System}
     */
    init(context = {}) {
        if (this.initialized) {
            console.warn(`[System:${this.name}] Already initialized`);
            return this;
        }

        this.scene = context.scene;
        
        // 检查依赖
        for (const dep of this.dependencies) {
            if (!context[dep]) {
                console.error(`[System:${this.name}] Missing dependency: ${dep}`);
                throw new Error(`System ${this.name} requires ${dep}`);
            }
        }

        // 调用子类初始化
        this.onInit(context);
        
        this.initialized = true;
        console.log(`[System:${this.name}] Initialized`);
        
        return this;
    }

    /**
     * 初始化钩子 - 子类实现
     * @param {Object} context
     */
    onInit(context) {
        // 子类覆盖
    }

    /**
     * 启动系统
     * @returns {System}
     */
    start() {
        if (!this.initialized) {
            console.error(`[System:${this.name}] Cannot start before init`);
            return this;
        }
        
        if (this.isRunning) {
            console.warn(`[System:${this.name}] Already running`);
            return this;
        }

        this.isRunning = true;
        this.onStart();
        console.log(`[System:${this.name}] Started`);
        
        return this;
    }

    /**
     * 启动钩子 - 子类实现
     */
    onStart() {
        // 子类覆盖
    }

    /**
     * 停止系统
     * @returns {System}
     */
    stop() {
        if (!this.isRunning) {
            return this;
        }

        this.isRunning = false;
        this.onStop();
        console.log(`[System:${this.name}] Stopped`);
        
        return this;
    }

    /**
     * 停止钩子 - 子类实现
     */
    onStop() {
        // 子类覆盖
    }

    /**
     * 更新系统 (每帧调用)
     * @param {number} deltaTime - 帧间隔时间（秒）
     */
    update(deltaTime) {
        if (!this.isRunning) return;
        this.onUpdate(deltaTime);
    }

    /**
     * 更新钩子 - 子类实现
     * @param {number} deltaTime
     */
    onUpdate(deltaTime) {
        // 子类覆盖
    }

    /**
     * 获取状态值
     * @param {string} key
     * @returns {*}
     */
    getState(key) {
        return this._state.get(key);
    }

    /**
     * 设置状态值
     * @param {string} key
     * @param {*} value
     */
    setState(key, value) {
        this._state.set(key, value);
    }

    /**
     * 订阅事件
     * @param {string} event - 事件名
     * @param {Function} callback - 回调
     * @returns {Function} 取消订阅函数
     */
    on(event, callback) {
        const unsubscribe = eventBus.on(event, callback);
        this._listeners.push({ event, unsubscribe });
        return unsubscribe;
    }

    /**
     * 订阅一次
     * @param {string} event
     * @param {Function} callback
     */
    once(event, callback) {
        eventBus.once(event, callback);
    }

    /**
     * 发送事件
     * @param {string} event
     * @param {*} data
     */
    emit(event, data) {
        eventBus.emit(event, data);
    }

    /**
     * 获取系统摘要
     * @returns {Object}
     */
    getSummary() {
        return {
            name: this.name,
            initialized: this.initialized,
            running: this.isRunning
        };
    }

    /**
     * 销毁系统
     */
    dispose() {
        // 停止
        this.stop();
        
        // 取消所有事件订阅
        for (const { event, unsubscribe } of this._listeners) {
            unsubscribe();
        }
        this._listeners = [];
        
        // 调用子类销毁
        this.onDispose();
        
        this.initialized = false;
        this.scene = null;
        
        console.log(`[System:${this.name}] Disposed`);
    }

    /**
     * 销毁钩子 - 子类实现
     */
    onDispose() {
        // 子类覆盖
    }
}

// 导出
export { System };
export default System;
