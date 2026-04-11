/**
 * AppearanceService - 外观服务
 */

const logger = require('../../utils/logger');

class AppearanceService {
    constructor() {
        // 外观配置
        this.models = ['default', 'robot', 'animal', 'fantasy'];
        this.colors = [
            { id: 'red', name: '红色', hex: '#FF6B6B' },
            { id: 'blue', name: '蓝色', hex: '#4ECDC4' },
            { id: 'green', name: '绿色', hex: '#95E1D3' },
            { id: 'yellow', name: '黄色', hex: '#F7DC6F' },
            { id: 'purple', name: '紫色', hex: '#BB8FCE' },
            { id: 'pink', name: '粉色', hex: '#F1948A' },
            { id: 'white', name: '白色', hex: '#FFFFFF' },
            { id: 'black', name: '黑色', hex: '#2C3E50' }
        ];
        this.accessories = [
            { id: 'hat', name: '帽子', cost: 100 },
            { id: 'glasses', name: '眼镜', cost: 80 },
            { id: 'cape', name: '披风', cost: 200 },
            { id: 'wings', name: '翅膀', cost: 500 },
            { id: 'crown', name: '皇冠', cost: 1000 },
            { id: 'mask', name: '面具', cost: 150 }
        ];
        this.titles = [
            { id: 'newcomer', name: '新人', requirement: 'join' },
            { id: 'explorer', name: '探索者', requirement: { type: 'explore_count', count: 10 } },
            { id: 'merchant', name: '商人', requirement: { type: 'trades_count', count: 10 } },
            { id: 'warrior', name: '战士', requirement: { type: 'tasks_completed', count: 50 } },
            { id: 'legend', name: '传奇', requirement: { type: 'reputation', count: 10000 } }
        ];
    }

    /**
     * 获取外观选项
     */
    getOptions() {
        return {
            models: this.models,
            colors: this.colors,
            accessories: this.accessories,
            titles: this.titles
        };
    }

    /**
     * 更新外观
     */
    async updateAppearance(agentId, appearance, agentStore) {
        const agent = await agentStore.get(agentId);
        if (!agent) {
            return { success: false, message: '智能体不存在' };
        }

        const updates = {};
        let changed = false;

        // 验证模型
        if (appearance.model) {
            if (!this.models.includes(appearance.model)) {
                return { success: false, message: '无效的模型' };
            }
            updates.model = appearance.model;
            changed = true;
        }

        // 验证颜色
        if (appearance.color) {
            const color = this.colors.find(c => c.id === appearance.color);
            if (!color) {
                return { success: false, message: '无效的颜色' };
            }
            updates.color = appearance.color;
            changed = true;
        }

        // 添加配饰
        if (appearance.addAccessory) {
            const accessory = this.accessories.find(a => a.id === appearance.addAccessory);
            if (!accessory) {
                return { success: false, message: '无效的配饰' };
            }

            const currentAccessories = agent.appearance?.accessories || [];
            if (currentAccessories.includes(accessory.id)) {
                return { success: false, message: '已拥有该配饰' };
            }

            if ((agent.coins || 0) < accessory.cost) {
                return { success: false, message: `需要 ${accessory.cost} 金币` };
            }

            await agentStore.updateCoins(agentId, -accessory.cost);
            updates.accessories = [...currentAccessories, accessory.id];
            changed = true;
        }

        // 移除配饰
        if (appearance.removeAccessory) {
            const currentAccessories = agent.appearance?.accessories || [];
            updates.accessories = currentAccessories.filter(a => a !== appearance.removeAccessory);
            changed = true;
        }

        // 设置称号
        if (appearance.title) {
            const title = this.titles.find(t => t.id === appearance.title);
            if (!title) {
                return { success: false, message: '无效的称号' };
            }

            // 检查是否满足条件
            const unlocked = await this.checkTitleUnlocked(agentId, title, agentStore);
            if (!unlocked) {
                return { success: false, message: '未解锁该称号' };
            }

            updates.title = title.id;
            changed = true;
        }

        if (!changed) {
            return { success: false, message: '没有更改' };
        }

        // 应用更新
        const currentAppearance = agent.appearance || {};
        const newAppearance = { ...currentAppearance, ...updates };
        await agentStore.update(agentId, { appearance: newAppearance });

        return {
            success: true,
            appearance: newAppearance,
            message: '外观已更新'
        };
    }

    /**
     * 检查称号是否解锁
     */
    async checkTitleUnlocked(agentId, title, agentStore) {
        const agent = await agentStore.get(agentId);
        if (!agent) return false;

        const req = title.requirement;

        if (req === 'join') return true;

        if (typeof req === 'object') {
            switch (req.type) {
                case 'explore_count':
                    return (agent.stats?.exploreCount || 0) >= req.count;
                case 'trades_count':
                    return (agent.stats?.tradesCount || 0) >= req.count;
                case 'tasks_completed':
                    return (agent.stats?.tasksCompleted || 0) >= req.count;
                case 'reputation':
                    return (agent.reputation || 0) >= req.count;
            }
        }

        return false;
    }

    /**
     * 获取解锁的称号
     */
    async getUnlockedTitles(agentId, agentStore) {
        const agent = await agentStore.get(agentId);
        if (!agent) return [];

        const unlocked = [];

        for (const title of this.titles) {
            if (await this.checkTitleUnlocked(agentId, title, agentStore)) {
                unlocked.push(title);
            }
        }

        return unlocked;
    }

    /**
     * 购买配饰
     */
    async buyAccessory(agentId, accessoryId, agentStore) {
        const accessory = this.accessories.find(a => a.id === accessoryId);
        if (!accessory) {
            return { success: false, message: '配饰不存在' };
        }

        const agent = await agentStore.get(agentId);
        if (!agent) {
            return { success: false, message: '智能体不存在' };
        }

        const currentAccessories = agent.appearance?.accessories || [];
        if (currentAccessories.includes(accessoryId)) {
            return { success: false, message: '已拥有该配饰' };
        }

        if ((agent.coins || 0) < accessory.cost) {
            return { success: false, message: `需要 ${accessory.cost} 金币` };
        }

        await agentStore.updateCoins(agentId, -accessory.cost);

        const newAccessories = [...currentAccessories, accessoryId];
        await agentStore.update(agentId, {
            appearance: { ...agent.appearance, accessories: newAccessories }
        });

        return {
            success: true,
            message: `购买了 ${accessory.name}`,
            accessory,
            remainingCoins: agent.coins - accessory.cost
        };
    }

    /**
     * 获取外观信息
     */
    async getAppearance(agentId, agentStore) {
        const agent = await agentStore.get(agentId);
        if (!agent) return null;

        const appearance = agent.appearance || {};

        return {
            model: appearance.model || 'default',
            color: appearance.color || 'blue',
            accessories: appearance.accessories || [],
            title: appearance.title || null,
            unlockedTitles: await this.getUnlockedTitles(agentId, agentStore)
        };
    }
}

const appearanceService = new AppearanceService();

module.exports = { appearanceService, AppearanceService };
