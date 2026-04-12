/**
 * IdentityStore - 身份存储
 *
 * 管理智能体的身份信息、认证和会话
 *
 * @module stores/identity-store
 */

const BaseStore = require('./base-store');
const logger = require('../utils/logger');

class IdentityStore extends BaseStore {
    constructor() {
        super('IdentityStore');

        // 索引
        this.setIndex('name', true); // 唯一名字索引
        this.setIndex('type'); // 'agent' | 'player' | 'npc'
        this.setIndex('status'); // 'online' | 'offline' | 'suspended'

        // 会话管理
        this.sessions = new Map(); // sessionId -> { agentId, createdAt, lastActive, data }
        this.sessionTimeout = 30 * 60 * 1000; // 30分钟
        this.sessionCleanupInterval = null;
    }

    /**
     * 注册身份
     */
    async register(identityData) {
        const { id, name, type = 'agent', locale = 'zh-CN', appearance = {} } = identityData;

        // 检查名字唯一性
        if (this.names.has(name)) {
            throw new Error(`名字 "${name}" 已被占用`);
        }

        const identity = {
            id,
            name,
            type,
            locale,
            appearance: appearance || {},
            status: 'offline',
            reputation: 50,
            createdAt: Date.now(),
            lastSeen: Date.now(),
            stats: {
                tasksCompleted: 0,
                conversationsCount: 0,
                distanceTraveled: 0
            }
        };

        await this.create(id, identity);
        this.names.set(name, id);

        logger.info(`[IdentityStore] Registered identity: ${name} (${id})`);
        return identity;
    }

    /**
     * 根据名字查找
     */
    async findByName(name) {
        return this.findByIndex('name', name);
    }

    /**
     * 根据 ID 获取完整身份
     */
    async getIdentity(agentId) {
        return this.get(agentId);
    }

    /**
     * 更新身份信息
     */
    async updateIdentity(agentId, data) {
        return this.update(agentId, data);
    }

    /**
     * 更新外观
     */
    async updateAppearance(agentId, appearance) {
        return this.update(agentId, { appearance });
    }

    /**
     * 上线
     */
    async goOnline(agentId, sessionData = {}) {
        const identity = await this.get(agentId);
        if (!identity) {
            throw new Error(`Identity ${agentId} not found`);
        }

        await this.update(agentId, {
            status: 'online',
            lastSeen: Date.now()
        });

        // 创建会话
        const sessionId = this._generateSessionId();
        this.sessions.set(sessionId, {
            agentId,
            createdAt: Date.now(),
            lastActive: Date.now(),
            data: sessionData
        });

        logger.info(`[IdentityStore] ${identity.name} went online, session: ${sessionId}`);
        return { sessionId, identity };
    }

    /**
     * 下线
     */
    async goOffline(agentId) {
        const identity = await this.get(agentId);
        if (!identity) return false;

        await this.update(agentId, {
            status: 'offline',
            lastSeen: Date.now()
        });

        // 清理会话
        for (const [sessionId, session] of this.sessions) {
            if (session.agentId === agentId) {
                this.sessions.delete(sessionId);
            }
        }

        logger.info(`[IdentityStore] ${identity.name} went offline`);
        return true;
    }

    /**
     * 创建会话
     */
    async createSession(agentId, data = {}) {
        const identity = await this.get(agentId);
        if (!identity) {
            throw new Error(`Identity ${agentId} not found`);
        }

        const sessionId = this._generateSessionId();
        this.sessions.set(sessionId, {
            agentId,
            createdAt: Date.now(),
            lastActive: Date.now(),
            data
        });

        return sessionId;
    }

    /**
     * 验证会话
     */
    async validateSession(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session) return null;

        // 检查超时
        if (Date.now() - session.lastActive > this.sessionTimeout) {
            this.sessions.delete(sessionId);
            return null;
        }

        // 更新最后活跃时间
        session.lastActive = Date.now();

        const identity = await this.get(session.agentId);
        return { sessionId, identity };
    }

    /**
     * 销毁会话
     */
    async destroySession(sessionId) {
        const session = this.sessions.get(sessionId);
        if (session) {
            this.sessions.delete(sessionId);
            logger.debug(`[IdentityStore] Session destroyed: ${sessionId}`);
        }
    }

    /**
     * 获取在线身份
     */
    async getOnlineIdentities() {
        return this.find({ status: 'online' });
    }

    /**
     * 搜索身份
     */
    async search(query, limit = 10) {
        const all = await this.getAll();
        const q = query.toLowerCase();

        return all
            .filter(identity =>
                identity.name.toLowerCase().includes(q) ||
                identity.id.toLowerCase().includes(q))
            .slice(0, limit);
    }

    /**
     * 更新统计
     */
    async updateStats(agentId, stats) {
        const identity = await this.get(agentId);
        if (!identity) return;

        const currentStats = identity.stats || {};
        await this.update(agentId, {
            stats: { ...currentStats, ...stats }
        });
    }

    /**
     * 生成会话 ID
     */
    _generateSessionId() {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substring(2, 10);
        return `sess_${timestamp}_${random}`;
    }

    /**
     * 启动会话清理定时器
     */
    startSessionCleanup() {
        if (this.sessionCleanupInterval) return;

        this.sessionCleanupInterval = setInterval(() => {
            const now = Date.now();
            for (const [sessionId, session] of this.sessions) {
                if (now - session.lastActive > this.sessionTimeout) {
                    this.sessions.delete(sessionId);
                    logger.debug(`[IdentityStore] Session expired: ${sessionId}`);
                }
            }
        }, 60000); // 每分钟检查

        logger.info('[IdentityStore] Session cleanup started');
    }

    /**
     * 停止会话清理
     */
    stopSessionCleanup() {
        if (this.sessionCleanupInterval) {
            clearInterval(this.sessionCleanupInterval);
            this.sessionCleanupInterval = null;
        }
    }

    /**
     * 名字索引辅助
     */
    get names() {
        if (!this._names) {
            this._names = new Map();
        }
        return this._names;
    }

    /**
     * 获取身份数量统计
     */
    async getStats() {
        const all = await this.getAll();
        return {
            total: all.length,
            online: all.filter(i => i.status === 'online').length,
            offline: all.filter(i => i.status === 'offline').length,
            byType: all.reduce((acc, i) => {
                acc[i.type] = (acc[i.type] || 0) + 1;
                return acc;
            }, {})
        };
    }
}

module.exports = IdentityStore;
