/**
 * StateStore - 状态快照存储
 *
 * 管理世界状态快照和智能体状态
 *
 * @module stores/state-store
 */

const BaseStore = require('./base-store');
const logger = require('../utils/logger');

class StateStore extends BaseStore {
    constructor() {
        super('StateStore');

        // 索引
        this.setIndex('type'); // 'world' | 'agent' | 'building' | 'weather'
        this.setIndex('agentId');
        this.setIndex('worldTime');

        // 世界状态
        this.worldState = null;
        this.snapshotInterval = 60000; // 1分钟
        this.maxSnapshots = 60; // 保留最近60个快照
    }

    /**
     * 保存世界状态快照
     */
    async saveWorldSnapshot(state) {
        const id = `world_${Date.now()}`;
        const snapshot = {
            id,
            type: 'world',
            worldTime: state.worldTime,
            weather: state.weather,
            timeOfDay: state.timeOfDay,
            dayCount: state.dayCount,
            agentCount: state.agentCount,
            activeTaskCount: state.activeTaskCount,
            data: state,
            createdAt: Date.now()
        };

        await this.create(id, snapshot);

        // 更新当前世界状态
        this.worldState = snapshot;

        // 清理旧快照
        await this.pruneSnapshots();

        return snapshot;
    }

    /**
     * 保存智能体状态
     */
    async saveAgentState(agentId, state) {
        const id = `agent_${agentId}_${Date.now()}`;
        const snapshot = {
            id,
            type: 'agent',
            agentId,
            position: state.position,
            state: state.state,
            emotion: state.emotion,
            needs: state.needs,
            reputation: state.reputation,
            skills: state.skills,
            data: state,
            createdAt: Date.now()
        };

        // 更新同一智能体的最新状态（唯一索引）
        const existing = await this.findByIndex('agentId', agentId);
        if (existing) {
            await this.update(existing.id, snapshot);
        } else {
            await this.create(id, snapshot);
        }

        return snapshot;
    }

    /**
     * 获取世界状态
     */
    async getWorldState() {
        return this.worldState;
    }

    /**
     * 获取历史世界状态
     */
    async getWorldHistory(limit = 10) {
        const snapshots = await this.find({ type: 'world' });
        snapshots.sort((a, b) => b.createdAt - a.createdAt);
        return snapshots.slice(0, limit);
    }

    /**
     * 获取智能体状态历史
     */
    async getAgentHistory(agentId, limit = 10) {
        const snapshots = await this.find({ type: 'agent', agentId });
        snapshots.sort((a, b) => b.createdAt - a.createdAt);
        return snapshots.slice(0, limit);
    }

    /**
     * 获取智能体最新状态
     */
    async getAgentState(agentId) {
        return this.findByIndex('agentId', agentId);
    }

    /**
     * 恢复智能体状态
     */
    async restoreAgentState(snapshotId) {
        const snapshot = await this.get(snapshotId);
        if (!snapshot) {
            throw new Error(`Snapshot ${snapshotId} not found`);
        }

        // 创建新快照标记为恢复点
        const restorePoint = {
            ...snapshot,
            id: this.generateId('restore'),
            type: snapshot.type + '_restore',
            restoredAt: Date.now()
        };

        await this.create(restorePoint.id, restorePoint);
        return snapshot;
    }

    /**
     * 获取世界时间
     */
    async getWorldTime() {
        if (this.worldState) {
            return {
                worldTime: this.worldState.worldTime,
                timeOfDay: this.worldState.timeOfDay,
                dayCount: this.worldState.dayCount
            };
        }
        return { worldTime: 0, timeOfDay: 'day', dayCount: 0 };
    }

    /**
     * 推进世界时间
     */
    async advanceWorldTime(deltaMs) {
        if (!this.worldState) return;

        const newTime = this.worldState.worldTime + deltaMs;
        const dayMs = 24 * 60 * 60 * 1000;
        const newDayCount = Math.floor(newTime / dayMs);
        const timeInDay = newTime % dayMs;

        // 计算时间段
        const hourInDay = (timeInDay / dayMs) * 24;
        let timeOfDay;
        if (hourInDay < 6) timeOfDay = 'night';
        else if (hourInDay < 12) timeOfDay = 'morning';
        else if (hourInDay < 18) timeOfDay = 'afternoon';
        else timeOfDay = 'evening';

        this.worldState.worldTime = newTime;
        this.worldState.timeOfDay = timeOfDay;
        this.worldState.dayCount = newDayCount;

        return this.getWorldTime();
    }

    /**
     * 清理旧快照
     */
    async pruneSnapshots() {
        const snapshots = await this.find({ type: 'world' });
        snapshots.sort((a, b) => b.createdAt - a.createdAt);

        if (snapshots.length > this.maxSnapshots) {
            const toDelete = snapshots.slice(this.maxSnapshots);
            for (const snap of toDelete) {
                await this.delete(snap.id);
            }
            logger.debug(`[StateStore] Pruned ${toDelete.length} world snapshots`);
        }
    }

    /**
     * 获取差异（用于同步）
     */
    async getDelta(sinceTimestamp) {
        const snapshots = await this.find({
            type: 'agent',
            // 简单实现，实际需要基于 updatedAt
        });

        return snapshots
            .filter(s => s.createdAt > sinceTimestamp)
            .map(s => ({
                agentId: s.agentId,
                state: s.data,
                timestamp: s.createdAt
            }));
    }
}

module.exports = StateStore;
