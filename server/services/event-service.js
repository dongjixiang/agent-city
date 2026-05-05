/**
 * EventService - 事件服务
 */

const logger = require('../../utils/logger');

class EventService {
    constructor() {
        this.events = [];
        this.activeEvent = null;
        this.eventHistory = [];
    }

    /**
     * 创建事件
     */
    createEvent(event) {
        const newEvent = {
            id: `event_${Date.now()}`,
            name: event.name,
            description: event.description,
            type: event.type || 'special',
            startTime: event.startTime || Date.now(),
            endTime: event.endTime || (Date.now() + 24 * 60 * 60 * 1000),
            effects: event.effects || {},
            rewards: event.rewards || {},
            active: false
        };

        this.events.push(newEvent);

        logger.info(`[Event] Created event: ${newEvent.name}`);

        return newEvent;
    }

    /**
     * 激活事件
     */
    activateEvent(eventId) {
        const event = this.events.find(e => e.id === eventId);
        if (!event) return null;

        // 停用当前事件
        if (this.activeEvent) {
            this.activeEvent.active = false;
        }

        event.active = true;
        this.activeEvent = event;

        logger.info(`[Event] Activated event: ${event.name}`);

        return event;
    }

    /**
     * 结束事件
     */
    endEvent(eventId) {
        const event = this.events.find(e => e.id === eventId);
        if (!event) return null;

        event.active = false;
        event.endTime = Date.now();

        if (this.activeEvent?.id === eventId) {
            this.activeEvent = null;
        }

        this.eventHistory.push(event);

        return event;
    }

    /**
     * 获取当前事件
     */
    getActiveEvent() {
        return this.activeEvent;
    }

    /**
     * 获取所有事件
     */
    getAllEvents() {
        return this.events.map(e => ({
            ...e,
            isActive: e.active,
            isExpired: Date.now() > e.endTime
        }));
    }

    /**
     * 获取事件效果
     */
    getEventEffects() {
        if (!this.activeEvent) return {};

        return this.activeEvent.effects;
    }

    /**
     * 获取事件奖励
     */
    getEventRewards() {
        if (!this.activeEvent) return {};

        return this.activeEvent.rewards;
    }

    /**
     * 检查奖励是否翻倍
     */
    isRewardDoubled() {
        return this.activeEvent?.effects?.doubleRewards || false;
    }

    /**
     * 应用事件效果
     */
    applyEffects(reward) {
        if (!this.activeEvent) return reward;

        const effects = this.activeEvent.effects;

        if (effects.doubleRewards) {
            if (reward.coins) reward.coins *= 2;
            if (reward.reputation) reward.reputation *= 2;
        }

        if (effects.bonusCoins) {
            reward.coins = (reward.coins || 0) + effects.bonusCoins;
        }

        if (effects.bonusReputation) {
            reward.reputation = (reward.reputation || 0) + effects.bonusReputation;
        }

        return reward;
    }

    /**
     * 创建春节事件
     */
    createSpringFestival() {
        return this.createEvent({
            name: '春节庆典',
            description: '春节期间完成任务获得双倍奖励！',
            type: 'festival',
            startTime: Date.now(),
            endTime: Date.now() + 7 * 24 * 60 * 60 * 1000,
            effects: {
                doubleRewards: true,
                bonusReputation: 10
            },
            rewards: {
                coins: 1.5,
                reputation: 1.5
            }
        });
    }

    /**
     * 创建周年庆事件
     */
    createAnniversary() {
        return this.createEvent({
            name: '周年庆典',
            description: '智体城周年庆，全员福利！',
            type: 'festival',
            startTime: Date.now(),
            endTime: Date.now() + 3 * 24 * 60 * 60 * 1000,
            effects: {
                doubleRewards: true,
                bonusCoins: 100
            }
        });
    }
}

const eventService = new EventService();

module.exports = { eventService, EventService };
