/**
 * RelationService - 关系服务
 */

const logger = require('../../utils/logger');

class RelationService {
    constructor() {
        // 关系数据：agentId -> { friendId -> { intimacy, status, since } }
        this.relations = new Map();
        // 黑名单：agentId -> Set<blockId>
        this.blocklist = new Map();
    }

    /**
     * 添加好友
     */
    async addFriend(agentId, friendId) {
        if (agentId === friendId) {
            return { success: false, message: '不能添加自己为好友' };
        }

        // 检查黑名单
        if (this.isBlocked(agentId, friendId) || this.isBlocked(friendId, agentId)) {
            return { success: false, message: '无法添加好友' };
        }

        const relation = this.getOrCreateRelation(agentId, friendId);
        relation.status = 'friend';
        relation.since = Date.now();
        relation.intimacy = relation.intimacy || 0;

        // 双向好友
        const reverseRelation = this.getOrCreateRelation(friendId, agentId);
        reverseRelation.status = 'friend';
        reverseRelation.since = Date.now();

        logger.info(`[Relation] ${agentId} added ${friendId} as friend`);

        return {
            success: true,
            message: `已添加 ${friendId} 为好友`,
            intimacy: relation.intimacy
        };
    }

    /**
     * 移除好友
     */
    async removeFriend(agentId, friendId) {
        const relation = this.getRelation(agentId, friendId);
        if (!relation || relation.status !== 'friend') {
            return { success: false, message: '不是好友关系' };
        }

        relation.status = 'none';
        relation.intimacy = 0;

        // 双向移除
        const reverseRelation = this.getRelation(friendId, agentId);
        if (reverseRelation) {
            reverseRelation.status = 'none';
            reverseRelation.intimacy = 0;
        }

        return { success: true, message: `已解除与 ${friendId} 的好友关系` };
    }

    /**
     * 获取好友列表
     */
    async getFriends(agentId) {
        const agentRelations = this.relations.get(agentId);
        if (!agentRelations) return [];

        const friends = [];
        for (const [friendId, relation] of Object.entries(agentRelations)) {
            if (relation.status === 'friend') {
                friends.push({
                    agentId: friendId,
                    intimacy: relation.intimacy || 0,
                    since: relation.since,
                    recent: relation.recent || false
                });
            }
        }

        // 按亲密度排序
        friends.sort((a, b) => b.intimacy - a.intimacy);

        return friends;
    }

    /**
     * 增加亲密度
     */
    async increaseIntimacy(agentId, friendId, amount = 1) {
        const relation = this.getRelation(agentId, friendId);
        if (!relation || relation.status !== 'friend') {
            return { success: false };
        }

        relation.intimacy = (relation.intimacy || 0) + amount;
        relation.recent = true;

        // 标记最近互动
        relation.lastInteraction = Date.now();

        // 检查里程碑
        const milestones = [10, 30, 50, 100, 200];
        const leveledUp = milestones.find(m => relation.intimacy >= m && (relation.intimacy - amount) < m);

        return {
            success: true,
            intimacy: relation.intimacy,
            leveledUp
        };
    }

    /**
     * 黑名单
     */
    async block(agentId, blockId) {
        if (!this.blocklist.has(agentId)) {
            this.blocklist.set(agentId, new Set());
        }
        this.blocklist.get(agentId).add(blockId);

        // 移除好友关系
        await this.removeFriend(agentId, blockId);

        return { success: true, message: `已拉黑 ${blockId}` };
    }

    /**
     * 解除黑名单
     */
    async unblock(agentId, blockId) {
        const list = this.blocklist.get(agentId);
        if (list) {
            list.delete(blockId);
        }

        return { success: true, message: `已解除对 ${blockId} 的拉黑` };
    }

    /**
     * 检查是否被拉黑
     */
    isBlocked(agentId, targetId) {
        const list = this.blocklist.get(agentId);
        return list ? list.has(targetId) : false;
    }

    /**
     * 获取黑名单
     */
    async getBlocklist(agentId) {
        const list = this.blocklist.get(agentId);
        return list ? Array.from(list) : [];
    }

    /**
     * 获取关系状态
     */
    async getRelationStatus(agentId, targetId) {
        if (this.isBlocked(agentId, targetId)) {
            return { status: 'blocked_by_you' };
        }
        if (this.isBlocked(targetId, agentId)) {
            return { status: 'blocked_by_them' };
        }

        const relation = this.getRelation(agentId, targetId);
        if (!relation || relation.status === 'none') {
            return { status: 'none' };
        }

        return {
            status: relation.status,
            intimacy: relation.intimacy || 0
        };
    }

    /**
     * 辅助方法
     */
    getOrCreateRelation(agentId, targetId) {
        if (!this.relations.has(agentId)) {
            this.relations.set(agentId, {});
        }
        const relations = this.relations.get(agentId);
        if (!relations[targetId]) {
            relations[targetId] = { status: 'none', intimacy: 0 };
        }
        return relations[targetId];
    }

    getRelation(agentId, targetId) {
        const relations = this.relations.get(agentId);
        return relations ? relations[targetId] : null;
    }
}

const relationService = new RelationService();

module.exports = { relationService, RelationService };
