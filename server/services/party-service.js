/**
 * PartyService - 组队服务
 */

const logger = require('../../utils/logger');

class PartyService {
    constructor() {
        this.parties = new Map(); // partyId -> { members, leader, maxSize, createdAt }
        this.invites = new Map(); // inviteId -> { partyId, from, to, expiresAt }
    }

    /**
     * 创建队伍
     */
    async createParty(leaderId, options = {}) {
        const partyId = `party_${Date.now()}`;
        const maxSize = options.maxSize || 5;

        const party = {
            id: partyId,
            leader: leaderId,
            members: [leaderId],
            maxSize,
            createdAt: Date.now(),
            level: 1
        };

        this.parties.set(partyId, party);

        logger.info(`[Party] ${leaderId} created party ${partyId}`);

        return {
            success: true,
            party: this.getPartyInfo(party)
        };
    }

    /**
     * 邀请加入
     */
    async invite(partyId, fromId, toId) {
        const party = this.parties.get(partyId);
        if (!party) {
            return { success: false, message: '队伍不存在' };
        }

        if (!party.members.includes(fromId)) {
            return { success: false, message: '你不是队伍成员' };
        }

        if (party.members.length >= party.maxSize) {
            return { success: false, message: '队伍已满' };
        }

        const inviteId = `invite_${Date.now()}`;
        this.invites.set(inviteId, {
            partyId,
            from: fromId,
            to: toId,
            expiresAt: Date.now() + 300000 // 5分钟
        });

        return {
            success: true,
            inviteId,
            message: `已向 ${toId} 发送邀请`
        };
    }

    /**
     * 接受邀请
     */
    async acceptInvite(inviteId, agentId) {
        const invite = this.invites.get(inviteId);
        if (!invite) {
            return { success: false, message: '邀请不存在' };
        }

        if (invite.to !== agentId) {
            return { success: false, message: '邀请不是给你的' };
        }

        if (Date.now() > invite.expiresAt) {
            this.invites.delete(inviteId);
            return { success: false, message: '邀请已过期' };
        }

        const party = this.parties.get(invite.partyId);
        if (!party) {
            return { success: false, message: '队伍已解散' };
        }

        if (party.members.length >= party.maxSize) {
            return { success: false, message: '队伍已满' };
        }

        party.members.push(agentId);
        this.invites.delete(inviteId);

        logger.info(`[Party] ${agentId} joined party ${party.id}`);

        return {
            success: true,
            party: this.getPartyInfo(party)
        };
    }

    /**
     * 离开队伍
     */
    async leave(partyId, agentId) {
        const party = this.parties.get(partyId);
        if (!party) {
            return { success: false, message: '队伍不存在' };
        }

        const index = party.members.indexOf(agentId);
        if (index === -1) {
            return { success: false, message: '你不是队伍成员' };
        }

        party.members.splice(index, 1);

        // 如果是队长离开，转移给下一个成员
        if (party.leader === agentId && party.members.length > 0) {
            party.leader = party.members[0];
        }

        // 队伍为空则解散
        if (party.members.length === 0) {
            this.parties.delete(partyId);
        }

        return { success: true, message: '已离开队伍' };
    }

    /**
     * 获取队伍信息
     */
    async getParty(partyId) {
        const party = this.parties.get(partyId);
        if (!party) return null;
        return this.getPartyInfo(party);
    }

    /**
     * 获取玩家的队伍
     */
    async getAgentParty(agentId) {
        for (const party of this.parties.values()) {
            if (party.members.includes(agentId)) {
                return this.getPartyInfo(party);
            }
        }
        return null;
    }

    /**
     * 队伍聊天
     */
    async sendMessage(partyId, fromId, content) {
        const party = this.parties.get(partyId);
        if (!party) {
            return { success: false, message: '队伍不存在' };
        }

        if (!party.members.includes(fromId)) {
            return { success: false, message: '你不是队伍成员' };
        }

        return {
            success: true,
            message: {
                from: fromId,
                content,
                partyId,
                timestamp: Date.now()
            }
        };
    }

    getPartyInfo(party) {
        return {
            id: party.id,
            leader: party.leader,
            members: party.members,
            memberCount: party.members.length,
            maxSize: party.maxSize,
            createdAt: party.createdAt
        };
    }
}

const partyService = new PartyService();

module.exports = { partyService, PartyService };
