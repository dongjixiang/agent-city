/**
 * GuildService - 公会服务
 */

const logger = require('../../utils/logger');

class GuildService {
    constructor() {
        this.guilds = new Map(); // guildId -> Guild
        this.memberGuilds = new Map(); // agentId -> guildId
        this.ranks = ['leader', 'officer', 'member'];
    }

    /**
     * 创建公会
     */
    async createGuild(name, leaderId, options = {}) {
        if (this.memberGuilds.has(leaderId)) {
            return { success: false, message: '已在公会中' };
        }

        const guildId = `guild_${Date.now()}`;

        const guild = {
            id: guildId,
            name,
            leader: leaderId,
            officers: [],
            members: [leaderId],
            createdAt: Date.now(),
            level: 1,
            experience: 0,
            description: options.description || '',
            maxMembers: options.maxMembers || 50,
            buffs: [], // 公会增益
            public: options.public !== false
        };

        this.guilds.set(guildId, guild);
        this.memberGuilds.set(leaderId, guildId);

        logger.info(`[Guild] ${leaderId} created guild ${name}`);

        return {
            success: true,
            guild: this.getGuildInfo(guild)
        };
    }

    /**
     * 申请加入
     */
    async apply(guildId, agentId) {
        const guild = this.guilds.get(guildId);
        if (!guild) {
            return { success: false, message: '公会不存在' };
        }

        if (this.memberGuilds.has(agentId)) {
            return { success: false, message: '已在公会中' };
        }

        if (guild.members.length >= guild.maxMembers) {
            return { success: false, message: '公会已满' };
        }

        // 直接加入（简化版）
        guild.members.push(agentId);
        this.memberGuilds.set(agentId, guildId);

        return {
            success: true,
            message: `已加入 ${guild.name}`,
            guild: this.getGuildInfo(guild)
        };
    }

    /**
     * 离开公会
     */
    async leave(guildId, agentId) {
        const guild = this.guilds.get(guildId);
        if (!guild) {
            return { success: false, message: '公会不存在' };
        }

        if (agentId === guild.leader) {
            return { success: false, message: '会长不能离开，请先转让会长' };
        }

        const index = guild.members.indexOf(agentId);
        if (index === -1) {
            return { success: false, message: '不是公会成员' };
        }

        guild.members.splice(index, 1);
        guild.officers = guild.officers.filter(id => id !== agentId);
        this.memberGuilds.delete(agentId);

        return { success: true, message: '已离开公会' };
    }

    /**
     * 设置官员
     */
    async setOfficer(guildId, leaderId, targetId, isOfficer = true) {
        const guild = this.guilds.get(guildId);
        if (!guild) {
            return { success: false, message: '公会不存在' };
        }

        if (guild.leader !== leaderId) {
            return { success: false, message: '只有会长可以设置官员' };
        }

        if (isOfficer) {
            if (!guild.officers.includes(targetId)) {
                guild.officers.push(targetId);
            }
        } else {
            guild.officers = guild.officers.filter(id => id !== targetId);
        }

        return { success: true, message: `已更新 ${targetId} 的职位` };
    }

    /**
     * 转让会长
     */
    async transferLeadership(guildId, currentLeader, newLeader) {
        const guild = this.guilds.get(guildId);
        if (!guild) {
            return { success: false, message: '公会不存在' };
        }

        if (guild.leader !== currentLeader) {
            return { success: false, message: '只有会长可以转让' };
        }

        if (!guild.members.includes(newLeader)) {
            return { success: false, message: '新会长必须是公会成员' };
        }

        guild.leader = newLeader;
        guild.officers = guild.officers.filter(id => id !== newLeader);
        guild.officers.push(currentLeader);

        return { success: true, message: `会长已转让给 ${newLeader}` };
    }

    /**
     * 获取公会信息
     */
    async getGuild(guildId) {
        const guild = this.guilds.get(guildId);
        if (!guild) return null;
        return this.getGuildInfo(guild);
    }

    /**
     * 获取玩家的公会
     */
    async getAgentGuild(agentId) {
        const guildId = this.memberGuilds.get(agentId);
        if (!guildId) return null;
        return this.getGuild(guildId);
    }

    /**
     * 获取公会列表
     */
    async getGuildList(limit = 20) {
        const guilds = Array.from(this.guilds.values())
            .sort((a, b) => b.experience - a.experience)
            .slice(0, limit);

        return guilds.map(g => ({
            id: g.id,
            name: g.name,
            leader: g.leader,
            memberCount: g.members.length,
            maxMembers: g.maxMembers,
            level: g.level,
            public: g.public
        }));
    }

    /**
     * 添加公会增益
     */
    async addBuff(guildId, buff) {
        const guild = this.guilds.get(guildId);
        if (!guild) {
            return { success: false, message: '公会不存在' };
        }

        guild.buffs.push({
            ...buff,
            addedAt: Date.now()
        });

        return { success: true };
    }

    /**
     * 增加经验
     */
    async addExperience(guildId, amount) {
        const guild = this.guilds.get(guildId);
        if (!guild) return null;

        guild.experience += amount;

        // 检查升级
        const newLevel = this.calculateLevel(guild.experience);
        const leveledUp = newLevel > guild.level;

        if (leveledUp) {
            guild.level = newLevel;
            guild.maxMembers += 10;
        }

        return {
            leveledUp,
            level: guild.level,
            experience: guild.experience
        };
    }

    calculateLevel(experience) {
        // 简单公式：每1000经验升1级
        return Math.floor(experience / 1000) + 1;
    }

    getGuildInfo(guild) {
        return {
            id: guild.id,
            name: guild.name,
            leader: guild.leader,
            officers: guild.officers,
            members: guild.members,
            memberCount: guild.members.length,
            maxMembers: guild.maxMembers,
            level: guild.level,
            experience: guild.experience,
            description: guild.description,
            buffs: guild.buffs,
            public: guild.public,
            createdAt: guild.createdAt
        };
    }
}

const guildService = new GuildService();

module.exports = { guildService, GuildService };
