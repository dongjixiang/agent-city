/**
 * TerritoryService - 领地服务
 */

const logger = require('../../utils/logger');
const config = require('../../utils/config-loader');

class TerritoryService {
    constructor() {
        // 领地数据: agentId -> { territories: [], items: [] }
        this.territories = new Map();
        // 领地物品定义
        this.items = config.get('world.world.territoryItems', [
            { id: 'flower_pot', name: '花盆', cost: 50, size: 1 },
            { id: 'bench', name: '长椅', cost: 100, size: 1 },
            { id: 'lamp', name: '灯笼', cost: 80, size: 1 },
            { id: 'statue', name: '雕像', cost: 500, size: 2 },
            { id: 'tree_small', name: '小树', cost: 150, size: 2 },
            { id: 'fountain_small', name: '小喷泉', cost: 1000, size: 4 },
            { id: 'fence', name: '栅栏', cost: 30, size: 1 },
            { id: 'sign', name: '告示牌', cost: 40, size: 1 }
        ]);
    }

    /**
     * 购买领地
     */
    async buyTerritory(agentId, position, size, agentStore) {
        // 计算价格（每格10金币）
        const price = size * size * 10;

        const agent = await agentStore.get(agentId);
        if (!agent) {
            return { success: false, message: '智能体不存在' };
        }

        if ((agent.coins || 0) < price) {
            return { success: false, message: `需要 ${price} 金币` };
        }

        // 检查是否与其他领地重叠
        const agentTerritory = this.territories.get(agentId) || { territories: [] };
        for (const t of agentTerritory.territories) {
            if (this.isOverlap(position, size, t.position, t.size)) {
                return { success: false, message: '与其他领地重叠' };
            }
        }

        // 扣除金币
        await agentStore.updateCoins(agentId, -price);

        // 创建领地
        const territory = {
            id: `territory_${Date.now()}`,
            agentId,
            position: { ...position },
            size,
            purchasedAt: Date.now()
        };

        agentTerritory.territories.push(territory);
        this.territories.set(agentId, agentTerritory);

        logger.info(`[Territory] ${agentId} bought territory at`, position);

        return {
            success: true,
            message: `购买了 ${size}x${size} 的领地`,
            territory,
            cost: price
        };
    }

    /**
     * 放置物品
     */
    async placeItem(agentId, itemId, position, agentStore) {
        const itemDef = this.items.find(i => i.id === itemId);
        if (!itemDef) {
            return { success: false, message: '物品不存在' };
        }

        const agent = await agentStore.get(agentId);
        if (!agent) {
            return { success: false, message: '智能体不存在' };
        }

        // 检查是否在自己的领地里
        const agentTerritory = this.territories.get(agentId);
        if (!agentTerritory) {
            return { success: false, message: '没有领地' };
        }

        let inTerritory = false;
        for (const t of agentTerritory.territories) {
            if (this.isInside(position, t.position, t.size)) {
                inTerritory = true;
                break;
            }
        }

        if (!inTerritory) {
            return { success: false, message: '物品必须放在自己的领地内' };
        }

        // 添加物品
        agentTerritory.items = agentTerritory.items || [];
        agentTerritory.items.push({
            id: `${itemId}_${Date.now()}`,
            type: itemId,
            name: itemDef.name,
            position: { ...position },
            placedAt: Date.now()
        });

        return {
            success: true,
            message: `放置了 ${itemDef.name}`,
            item: agentTerritory.items[agentTerritory.items.length - 1]
        };
    }

    /**
     * 移除物品
     */
    async removeItem(agentId, itemInstanceId, agentStore) {
        const agentTerritory = this.territories.get(agentId);
        if (!agentTerritory) {
            return { success: false, message: '没有领地' };
        }

        const index = agentTerritory.items?.findIndex(i => i.id === itemInstanceId);
        if (index === -1 || index === undefined) {
            return { success: false, message: '物品不存在' };
        }

        const item = agentTerritory.items[index];
        agentTerritory.items.splice(index, 1);

        return {
            success: true,
            message: `移除了 ${item.name}`
        };
    }

    /**
     * 获取领地
     */
    async getTerritories(agentId) {
        return this.territories.get(agentId) || { territories: [], items: [] };
    }

    /**
     * 获取所有领地（世界状态）
     */
    getAllTerritories() {
        const all = [];
        for (const [agentId, data] of this.territories) {
            for (const t of data.territories) {
                all.push({
                    ...t,
                    agentId
                });
            }
        }
        return all;
    }

    /**
     * 检查重叠
     */
    isOverlap(pos1, size1, pos2, size2) {
        const left1 = pos1.x;
        const right1 = pos1.x + size1;
        const top1 = pos1.z;
        const bottom1 = pos1.z + size1;

        const left2 = pos2.x;
        const right2 = pos2.x + size2;
        const top2 = pos2.z;
        const bottom2 = pos2.z + size2;

        return !(right1 <= left2 || right2 <= left1 || bottom1 <= top2 || bottom2 <= top1);
    }

    /**
     * 检查是否在区域内
     */
    isInside(pos, territoryPos, size) {
        return pos.x >= territoryPos.x &&
               pos.x < territoryPos.x + size &&
               pos.z >= territoryPos.z &&
               pos.z < territoryPos.z + size;
    }

    /**
     * 获取可购买物品
     */
    getAvailableItems() {
        return this.items;
    }
}

const territoryService = new TerritoryService();

module.exports = { territoryService, TerritoryService };
