/**
 * CreativeWorkshop - 创意工坊
 *
 * 制作物品、装备强化、物品分解
 *
 * @module systems/buildings/creative-workshop
 */

import { Building } from './building.js';

class CreativeWorkshop extends Building {
    constructor(position) {
        super(
            'creative_workshop',
            '创意工坊',
            position,
            {
                services: ['craft_item', 'enhance_equipment', 'disassemble'],
                requirements: { minReputation: 30 }
            }
        );

        // 配方
        this.recipes = new Map([
            ['basic_potion', { name: '基础药水', cost: 20, result: 'potion_heal', quantity: 1 }],
            ['advanced_potion', { name: '高级药水', cost: 50, result: 'potion_power', quantity: 1 }],
            ['explorer_pack', { name: '探索者背包', cost: 30, result: 'item_pack', quantity: 1 }]
        ]);

        // 智能体背包（简化版）
        this.agentInventories = new Map(); // agentId -> Item[]
    }

    /**
     * 获取智能体背包
     */
    _getInventory(agentId) {
        if (!this.agentInventories.has(agentId)) {
            this.agentInventories.set(agentId, []);
        }
        return this.agentInventories.get(agentId);
    }

    /**
     * 服务：制作物品
     */
    service_craft_item(agent, params) {
        const { recipeId } = params || {};

        if (!recipeId) {
            // 返回配方列表
            const recipeList = Array.from(this.recipes.entries()).map(([id, r]) => ({
                id,
                name: r.name,
                cost: r.cost
            }));
            return {
                success: true,
                recipes: recipeList,
                message: '请选择要制作的配方 ID'
            };
        }

        const recipe = this.recipes.get(recipeId);
        if (!recipe) {
            return { success: false, message: `未知配方：${recipeId}` };
        }

        if (agent.reputation < recipe.cost) {
            return {
                success: false,
                message: `声誉不足，需要 ⭐${recipe.cost}，你只有 ⭐${agent.reputation}`
            };
        }

        agent.reputation -= recipe.cost;

        const inventory = this._getInventory(agent.id);
        inventory.push({
            id: `${recipe.result}_${Date.now()}`,
            name: recipe.name,
            type: recipe.result,
            craftedAt: Date.now()
        });

        return {
            success: true,
            item: recipe.name,
            cost: recipe.cost,
            inventorySize: inventory.length,
            message: `🔨 制作成功！获得「${recipe.name}」`
        };
    }

    /**
     * 服务：强化装备
     */
    service_enhance_equipment(agent, params) {
        const { itemId } = params || {};

        const inventory = this._getInventory(agent.id);

        if (!itemId) {
            return {
                success: true,
                items: inventory,
                message: `您有 ${inventory.length} 件物品，请指定要强化的物品 ID`
            };
        }

        const item = inventory.find(i => i.id === itemId);
        if (!item) {
            return { success: false, message: '物品不存在' };
        }

        // 简化强化逻辑
        const enhanceCost = 15;
        if (agent.reputation < enhanceCost) {
            return { success: false, message: `强化需要 ⭐${enhanceCost}，声誉不足` };
        }

        agent.reputation -= enhanceCost;

        return {
            success: true,
            item: item.name,
            cost: enhanceCost,
            message: `⚡ 「${item.name}」强化成功！`
        };
    }

    /**
     * 服务：分解物品
     */
    service_disassemble(agent, params) {
        const { itemId } = params || {};

        const inventory = this._getInventory(agent.id);

        if (!itemId) {
            return {
                success: true,
                items: inventory,
                message: `您有 ${inventory.length} 件物品，请指定要分解的物品 ID`
            };
        }

        const itemIdx = inventory.findIndex(i => i.id === itemId);
        if (itemIdx === -1) {
            return { success: false, message: '物品不存在' };
        }

        const item = inventory[itemIdx];
        inventory.splice(itemIdx, 1);

        // 分解返还 30% 声誉
        const refund = Math.floor(item.type === 'potion_heal' ? 5 : 10);
        agent.reputation += refund;

        return {
            success: true,
            refunded: refund,
            message: `🔧 「${item.name}」已分解，返还 ⭐${refund}`
        };
    }
}

export { CreativeWorkshop };
