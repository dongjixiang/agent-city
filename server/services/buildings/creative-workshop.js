/**
 * CreativeWorkshop - 创意工坊
 * 
 * 提供制作、强化、分解服务
 */

const BuildingBase = require('./building-base');
const logger = require('../../utils/logger');
const config = require('../../../utils/config-loader');

// Store 依赖
let agentStore = null;

// 配方
const recipes = [
    {
        id: 'wooden_sword',
        name: '木剑',
        description: '基础的近战武器',
        materials: [{ id: 'wood', name: '木材', count: 5 }],
        result: { id: 'wooden_sword', name: '木剑', type: 'weapon', rarity: 'common' },
        craftTime: 3
    },
    {
        id: 'health_potion',
        name: '生命药水',
        description: '恢复生命值',
        materials: [{ id: 'herb', name: '草药', count: 3 }],
        result: { id: 'health_potion', name: '生命药水', type: 'consumable', rarity: 'common' },
        craftTime: 2
    },
    {
        id: 'flower_crown',
        name: '花冠',
        description: '美丽的装饰品',
        materials: [{ id: 'flower', name: '花朵', count: 5 }],
        result: { id: 'flower_crown', name: '花冠', type: 'accessory', rarity: 'rare' },
        craftTime: 5
    },
    {
        id: 'magic_staff',
        name: '魔法杖',
        description: '施放魔法的工具',
        materials: [
            { id: 'wood', name: '木材', count: 2 },
            { id: 'crystal', name: '水晶', count: 3 }
        ],
        result: { id: 'magic_staff', name: '魔法杖', type: 'weapon', rarity: 'epic' },
        craftTime: 10
    },
    {
        id: 'iron_shield',
        name: '铁盾',
        description: '提供额外防护',
        materials: [
            { id: 'iron', name: '铁锭', count: 5 },
            { id: 'wood', name: '木材', count: 2 }
        ],
        result: { id: 'iron_shield', name: '铁盾', type: 'armor', rarity: 'uncommon' },
        craftTime: 8
    }
];

// 强化等级
const enhancementLevels = [
    { level: 1, cost: 100, successRate: 0.9 },
    { level: 2, cost: 250, successRate: 0.8 },
    { level: 3, cost: 500, successRate: 0.7 },
    { level: 4, cost: 1000, successRate: 0.6 },
    { level: 5, cost: 2000, successRate: 0.5 }
];

function setStores(stores) {
    agentStore = stores.agentStore;
}

class CreativeWorkshop extends BuildingBase {
    constructor(config) {
        super('creative_workshop', {
            name: '创意工坊',
            description: '制作物品、合成、附魔的地方',
            position: config?.position || { x: 35, z: 0 },
            type: 'creation',
            services: ['recipes', 'craft', 'enhance', 'disassemble'],
            requirements: {
                minReputation: 20,
                unlocked: true
            }
        });
    }

    /**
     * 配方列表
     */
    async service_recipes(agent, params, context) {
        return {
            success: true,
            recipes: recipes.map(r => ({
                id: r.id,
                name: r.name,
                description: r.description,
                materials: r.materials,
                result: r.result,
                craftTime: r.craftTime
            }))
        };
    }

    /**
     * 制作
     */
    async service_craft(agent, params, context) {
        const { recipeId } = params;

        if (!recipeId) {
            return { success: false, message: '需要指定配方' };
        }

        const recipe = recipes.find(r => r.id === recipeId);
        if (!recipe) {
            return { success: false, message: '配方不存在' };
        }

        // 检查材料
        const inventory = agent.inventory || [];
        const missingMaterials = [];

        for (const material of recipe.materials) {
            const have = inventory.filter(i => i.id === material.id).length;
            if (have < material.count) {
                missingMaterials.push({
                    id: material.id,
                    name: material.name,
                    need: material.count,
                    have
                });
            }
        }

        if (missingMaterials.length > 0) {
            return {
                success: false,
                message: '材料不足',
                missing: missingMaterials
            };
        }

        // 扣除材料
        for (const material of recipe.materials) {
            for (let i = 0; i < material.count; i++) {
                const item = inventory.find(inv => inv.id === material.id);
                if (item) {
                    await agentStore.removeItem(agent.agentId, item.id);
                }
            }
        }

        // 添加产物
        await agentStore.addItem(agent.agentId, {
            ...recipe.result,
            id: `${recipe.id}_${Date.now()}`,
            craftedAt: Date.now()
        });

        return {
            success: true,
            message: `制作了 ${recipe.name}！`,
            result: recipe.result
        };
    }

    /**
     * 强化
     */
    async service_enhance(agent, params, context) {
        const { itemId } = params;

        if (!itemId) {
            return { success: false, message: '需要指定物品' };
        }

        // 查找物品
        const inventory = agent.inventory || [];
        const item = inventory.find(i => i.id === itemId);

        if (!item) {
            return { success: false, message: '物品不存在' };
        }

        // 获取当前强化等级
        const currentLevel = item.enhancement || 0;
        if (currentLevel >= 5) {
            return { success: false, message: '物品已达到最大强化等级' };
        }

        // 获取下一级配置
        const nextLevel = enhancementLevels[currentLevel];
        if (!nextLevel) {
            return { success: false, message: '强化配置不存在' };
        }

        // 检查金币
        if ((agent.coins || 0) < nextLevel.cost) {
            return { success: false, message: `需要 ${nextLevel.cost} 金币` };
        }

        // 扣除金币
        await agentStore.updateCoins(agent.agentId, -nextLevel.cost);

        // 判定成功
        const success = Math.random() < nextLevel.successRate;

        if (success) {
            // 更新物品强化等级
            const newItem = {
                ...item,
                enhancement: currentLevel + 1,
                enhancedAt: Date.now()
            };

            await agentStore.removeItem(agent.agentId, itemId);
            await agentStore.addItem(agent.agentId, newItem);

            return {
                success: true,
                message: `强化成功！物品强化等级提升到 ${currentLevel + 1}`,
                newLevel: currentLevel + 1
            };
        } else {
            return {
                success: false,
                message: '强化失败...',
                lostCoins: nextLevel.cost
            };
        }
    }

    /**
     * 分解
     */
    async service_disassemble(agent, params, context) {
        const { itemId } = params;

        if (!itemId) {
            return { success: false, message: '需要指定物品' };
        }

        // 查找物品
        const inventory = agent.inventory || [];
        const item = inventory.find(i => i.id === itemId);

        if (!item) {
            return { success: false, message: '物品不存在' };
        }

        // 分解返还部分材料（稀有度越高，返还越多）
        const returnRates = {
            common: 0.3,
            uncommon: 0.5,
            rare: 0.7,
            epic: 0.9,
            legendary: 1.0
        };

        const rate = returnRates[item.rarity] || 0.3;

        // 模拟材料（实际应该查表）
        const mockMaterials = [
            { id: 'wood', name: '木材' },
            { id: 'iron', name: '铁锭' },
            { id: 'crystal', name: '水晶' }
        ];

        const returned = mockMaterials.slice(0, Math.floor(Math.random() * 2) + 1).map(m => ({
            ...m,
            count: Math.ceil(Math.random() * 3 * rate)
        })).filter(m => m.count > 0);

        // 从背包移除
        await agentStore.removeItem(agent.agentId, itemId);

        // 返还材料
        for (const mat of returned) {
            for (let i = 0; i < mat.count; i++) {
                await agentStore.addItem(agent.agentId, {
                    id: mat.id,
                    name: mat.name,
                    type: 'material'
                });
            }
        }

        return {
            success: true,
            message: `分解了 ${item.name}，返还了材料`,
            returned
        };
    }
}

// 导出
const creativeWorkshop = new CreativeWorkshop({
    position: { x: 35, z: 0 }
});

module.exports = {
    CreativeWorkshop,
    creativeWorkshop,
    setStores
};
