/**
 * TradingCenter - 交易中心
 *
 * 市场买卖、货币兑换（声誉↔金币）
 *
 * @module systems/buildings/trading-center
 */

import { Building } from './building.js';

class TradingCenter extends Building {
    constructor(position) {
        super(
            'trading_center',
            '交易中心',
            position,
            {
                services: ['list_item', 'buy_item', 'exchange_currency'],
                requirements: { minReputation: 5 }
            }
        );

        // 市场
        this.marketItems = new Map(); // itemId -> { sellerId, name, price, reputation, listedAt }
        this.itemIdCounter = 0;
    }

    /**
     * 服务：上架物品
     */
    service_list_item(agent, params) {
        const { name, price, reputation } = params || {};

        if (!name || (!price && !reputation)) {
            return { success: false, message: '需要提供物品名称和价格' };
        }

        const itemId = `item_${++this.itemIdCounter}`;
        this.marketItems.set(itemId, {
            id: itemId,
            sellerId: agent.id,
            sellerName: agent.name,
            name,
            price: price || 0,
            reputation: reputation || 0,
            listedAt: Date.now()
        });

        return {
            success: true,
            itemId,
            message: `已将「${name}」上架，价格：💰${price || 0} / ⭐${reputation || 0}`
        };
    }

    /**
     * 服务：购买物品
     */
    service_buy_item(agent, params) {
        const { itemId } = params || {};

        if (!itemId) {
            // 返回市场列表
            const items = Array.from(this.marketItems.values()).map(item => ({
                id: item.id,
                name: item.name,
                seller: item.sellerName,
                price: item.price,
                reputation: item.reputation
            }));

            return {
                success: true,
                items,
                message: `当前市场有 ${items.length} 件物品`
            };
        }

        const item = this.marketItems.get(itemId);
        if (!item) {
            return { success: false, message: '物品不存在或已下架' };
        }
        if (item.sellerId === agent.id) {
            return { success: false, message: '不能购买自己的物品' };
        }

        // 尝试用金币购买
        if (item.price > 0) {
            return { success: false, message: '金币交易暂未开放，请使用声誉购买' };
        }

        // 声誉购买
        if (item.reputation > 0) {
            if (agent.reputation < item.reputation) {
                return {
                    success: false,
                    message: `声誉不足，需要 ⭐${item.reputation}，你只有 ⭐${agent.reputation}`
                };
            }

            agent.reputation -= item.reputation;
            this.marketItems.delete(itemId);

            return {
                success: true,
                item: item.name,
                cost: item.reputation,
                message: `购买成功！「${item.name}」，花费 ⭐${item.reputation}`
            };
        }

        return { success: false, message: '物品价格异常' };
    }

    /**
     * 服务：货币兑换
     */
    service_exchange_currency(agent, params) {
        const { type, amount } = params || {};

        if (!type || !amount) {
            return {
                success: true,
                rates: {
                    'reputation_to_gold': 2,  // 1 声誉 = 2 金币
                    'gold_to_reputation': 0.5 // 2 金币 = 1 声誉
                },
                message: '请指定兑换类型（reputation_to_gold 或 gold_to_reputation）和数量'
            };
        }

        const amountNum = parseInt(amount);
        if (isNaN(amountNum) || amountNum <= 0) {
            return { success: false, message: '兑换数量必须为正数' };
        }

        if (type === 'reputation_to_gold') {
            // 声誉 -> 金币
            if (agent.reputation < amountNum) {
                return { success: false, message: '声誉不足' };
            }
            agent.reputation -= amountNum;
            // 金币系统暂未实现，这里返回信息
            return {
                success: true,
                reputationSpent: amountNum,
                goldGained: amountNum * 2,
                message: `兑换成功：花费 ⭐${amountNum}，获得 💰${amountNum * 2}`
            };
        }

        if (type === 'gold_to_reputation') {
            // 金币 -> 声誉（反向兑换，汇率较差）
            const reputationGained = Math.floor(amountNum / 2);
            if (reputationGained < 1) {
                return { success: false, message: '金币数量不足，至少需要 2 金币兑换 1 声誉' };
            }
            return {
                success: true,
                goldSpent: amountNum,
                reputationGained,
                message: `兑换成功：花费 💰${amountNum}，获得 ⭐${reputationGained}`
            };
        }

        return { success: false, message: '未知的兑换类型' };
    }
}

export { TradingCenter };
