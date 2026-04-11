/**
 * TradingCenter - 交易中心
 * 
 * 提供物品交易服务
 */

const BuildingBase = require('./building-base');
const logger = require('../../utils/logger');

// Store 依赖
let agentStore = null;

// 市场数据（内存）
const marketplace = new Map(); // itemId -> { seller, item, price, listedAt }
let nextItemId = 1;

// 交易税
const TRADING_FEE = 0.05;

function setStores(stores) {
    agentStore = stores.agentStore;
}

class TradingCenter extends BuildingBase {
    constructor(config) {
        super('trading_center', {
            name: '交易中心',
            description: '物品交易、货币兑换的地方',
            position: config?.position || { x: -25, z: 25 },
            type: 'trading',
            services: ['marketplace', 'buy_item', 'sell_item', 'cancel_listing', 'exchange_coins']
        });
    }

    /**
     * 市场列表
     */
    async service_marketplace(agent, params, context) {
        const { category, search, limit = 50 } = params;

        let items = Array.from(marketplace.values());

        // 过滤
        if (category) {
            items = items.filter(i => i.item.category === category);
        }

        if (search) {
            const q = search.toLowerCase();
            items = items.filter(i =>
                i.item.name.toLowerCase().includes(q) ||
                i.item.description?.toLowerCase().includes(q)
            );
        }

        return {
            success: true,
            items: items.slice(0, limit).map(i => ({
                id: i.id,
                item: i.item,
                price: i.price,
                seller: i.seller,
                listedAt: i.listedAt
            })),
            categories: ['weapon', 'armor', 'accessory', 'material', 'food', 'other']
        };
    }

    /**
     * 购买物品
     */
    async service_buy_item(agent, params, context) {
        const { itemId } = params;

        const listing = marketplace.get(itemId);
        if (!listing) {
            return { success: false, message: '物品不存在或已下架' };
        }

        if (listing.seller === agent.agentId) {
            return { success: false, message: '不能购买自己的物品' };
        }

        const price = listing.price;
        const fee = Math.floor(price * TRADING_FEE);
        const total = price + fee;

        // 检查金币
        if (agent.coins < total) {
            return { success: false, message: `金币不足，需要 ${total}` };
        }

        // 执行交易
        await agentStore.updateCoins(agent.agentId, -total);
        await agentStore.updateCoins(listing.seller, price);
        await agentStore.addItem(agent.agentId, listing.item);

        // 下架
        marketplace.delete(itemId);

        return {
            success: true,
            message: `购买了 ${listing.item.name}`,
            cost: total,
            item: listing.item
        };
    }

    /**
     * 出售物品
     */
    async service_sell_item(agent, params, context) {
        const { itemId, price } = params;

        if (!price || price <= 0) {
            return { success: false, message: '需要有效的价格' };
        }

        // 查找物品
        const inventory = agent.inventory || [];
        const item = inventory.find(i => i.id === itemId);

        if (!item) {
            return { success: false, message: '物品不存在' };
        }

        // 上架
        const listingId = `item_${nextItemId++}`;
        marketplace.set(listingId, {
            id: listingId,
            seller: agent.agentId,
            item,
            price,
            listedAt: Date.now()
        });

        // 从背包移除
        await agentStore.removeItem(agent.agentId, itemId);

        return {
            success: true,
            message: `${item.name} 已上架，价格 ${price} 金币`,
            listingId
        };
    }

    /**
     * 取消上架
     */
    async service_cancel_listing(agent, params, context) {
        const { listingId } = params;

        const listing = marketplace.get(listingId);
        if (!listing) {
            return { success: false, message: '上架不存在' };
        }

        if (listing.seller !== agent.agentId) {
            return { success: false, message: '只能取消自己的上架' };
        }

        // 归还物品
        await agentStore.addItem(agent.agentId, listing.item);

        // 删除
        marketplace.delete(listingId);

        return {
            success: true,
            message: `${listing.item.name} 已下架`
        };
    }

    /**
     * 货币兑换
     */
    async service_exchange_coins(agent, params, context) {
        const { direction, amount } = params;

        if (!amount || amount <= 0) {
            return { success: false, message: '需要有效的金额' };
        }

        if (direction === 'to_gems') {
            // 金币换宝石（1宝石 = 100金币）
            const gems = Math.floor(amount / 100);
            if (gems <= 0) {
                return { success: false, message: '金额不足' };
            }

            await agentStore.updateCoins(agent.agentId, -gems * 100);

            return {
                success: true,
                message: `兑换了 ${gems} 宝石`,
                coins: -gems * 100,
                gems
            };
        } else {
            // 宝石换金币（1宝石 = 100金币）
            await agentStore.updateCoins(agent.agentId, amount * 100);

            return {
                success: true,
                message: `兑换了 ${amount * 100} 金币`,
                coins: amount * 100
            };
        }
    }
}

// 导出
const tradingCenter = new TradingCenter({
    position: { x: -25, z: 25 }
});

module.exports = {
    TradingCenter,
    tradingCenter,
    setStores
};
