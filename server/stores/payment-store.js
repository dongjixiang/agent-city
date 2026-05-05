/**
 * PaymentStore - 支付/金币存储
 *
 * 管理智能体的金币、交易记录
 *
 * @module stores/payment-store
 */

const BaseStore = require('./base-store');
const logger = require('../utils/logger');

class PaymentStore extends BaseStore {
    constructor() {
        super('PaymentStore');

        // 索引
        this.setIndex('agentId');
        this.setIndex('type'); // 'transaction' | 'reward' | 'purchase' | 'exchange'
        this.setIndex('status'); // 'pending' | 'completed' | 'failed'

        // 金币系统
        this.balances = new Map(); // agentId -> { coins, lastUpdated }
        this.initialCoins = 100; // 新智能体初始金币
    }

    /**
     * 获取余额
     */
    async getBalance(agentId) {
        if (!this.balances.has(agentId)) {
            this.balances.set(agentId, {
                coins: this.initialCoins,
                lastUpdated: Date.now()
            });
        }
        return this.balances.get(agentId).coins;
    }

    /**
     * 初始化智能体余额
     */
    async initBalance(agentId, initialCoins = null) {
        if (this.balances.has(agentId)) {
            return this.balances.get(agentId).coins;
        }

        const coins = initialCoins || this.initialCoins;
        this.balances.set(agentId, {
            coins,
            lastUpdated: Date.now()
        });

        await this.recordTransaction(agentId, {
            type: 'reward',
            amount: coins,
            description: '初始金币',
            status: 'completed'
        });

        return coins;
    }

    /**
     * 增加金币
     */
    async addCoins(agentId, amount, reason = '') {
        const balance = this.balances.get(agentId) || { coins: 0 };
        balance.coins += amount;
        balance.lastUpdated = Date.now();
        this.balances.set(agentId, balance);

        await this.recordTransaction(agentId, {
            type: 'reward',
            amount,
            description: reason || '获得金币',
            balanceAfter: balance.coins,
            status: 'completed'
        });

        logger.debug(`[PaymentStore] ${agentId} +${amount} coins, balance: ${balance.coins}`);
        return balance.coins;
    }

    /**
     * 扣除金币
     */
    async deductCoins(agentId, amount, reason = '') {
        const balance = this.balances.get(agentId);
        if (!balance || balance.coins < amount) {
            return { success: false, reason: '余额不足' };
        }

        balance.coins -= amount;
        balance.lastUpdated = Date.now();
        this.balances.set(agentId, balance);

        await this.recordTransaction(agentId, {
            type: 'purchase',
            amount: -amount,
            description: reason || '消费',
            balanceAfter: balance.coins,
            status: 'completed'
        });

        logger.debug(`[PaymentStore] ${agentId} -${amount} coins, balance: ${balance.coins}`);
        return { success: true, balance: balance.coins };
    }

    /**
     * 转账
     */
    async transfer(fromAgentId, toAgentId, amount) {
        // 扣除发送者
        const deductResult = await this.deductCoins(fromAgentId, amount, `转账给 ${toAgentId}`);
        if (!deductResult.success) {
            return deductResult;
        }

        // 增加接收者
        await this.addCoins(toAgentId, amount, `收到 ${fromAgentId} 转账`);

        return {
            success: true,
            fromBalance: deductResult.balance,
            toBalance: await this.getBalance(toAgentId)
        };
    }

    /**
     * 记录交易
     */
    async recordTransaction(agentId, transaction) {
        const id = this.generateId('txn');
        const record = {
            id,
            agentId,
            type: transaction.type || 'transaction',
            amount: transaction.amount,
            description: transaction.description || '',
            balanceAfter: transaction.balanceAfter || 0,
            status: transaction.status || 'completed',
            relatedAgentId: transaction.relatedAgentId || null,
            createdAt: Date.now()
        };

        await this.create(id, record);
        return record;
    }

    /**
     * 获取交易历史
     */
    async getTransactionHistory(agentId, options = {}) {
        let transactions = await this.findByIndex('agentId', agentId);

        // 过滤类型
        if (options.type) {
            transactions = transactions.filter(t => t.type === options.type);
        }

        // 排序（最新的在前）
        transactions.sort((a, b) => b.createdAt - a.createdAt);

        // 分页
        const page = options.page || 1;
        const pageSize = options.pageSize || 20;
        const start = (page - 1) * pageSize;
        transactions = transactions.slice(start, start + pageSize);

        return transactions;
    }

    /**
     * 声誉兑换金币
     */
    async reputationToCoins(agentId, reputationAmount) {
        const exchangeRate = 2; // 1 声誉 = 2 金币
        const coinsGained = reputationAmount * exchangeRate;

        // 声誉扣除由声誉系统处理，这里只处理金币增加
        await this.addCoins(agentId, coinsGained, '声誉兑换');

        return {
            reputationSpent: reputationAmount,
            coinsGained
        };
    }

    /**
     * 金币兑换声誉
     */
    async coinsToReputation(agentId, coinsAmount) {
        const exchangeRate = 2; // 2 金币 = 1 声誉
        const reputationGained = Math.floor(coinsAmount / exchangeRate);

        if (reputationGained < 1) {
            return { success: false, reason: '金币不足' };
        }

        // 金币扣除
        const deductResult = await this.deductCoins(agentId, coinsAmount, '金币兑换声誉');
        if (!deductResult.success) {
            return deductResult;
        }

        return {
            success: true,
            coinsSpent: coinsAmount,
            reputationGained
        };
    }

    /**
     * 获取金币排行榜
     */
    async getLeaderboard(limit = 10) {
        const balances = [];
        for (const [agentId, data] of this.balances) {
            balances.push({
                agentId,
                coins: data.coins
            });
        }

        balances.sort((a, b) => b.coins - a.coins);
        return balances.slice(0, limit);
    }

    /**
     * 获取余额信息
     */
    async getBalanceInfo(agentId) {
        const balance = await this.getBalance(agentId);
        const transactions = await this.getTransactionHistory(agentId, { pageSize: 5 });

        return {
            agentId,
            coins: balance,
            recentTransactions: transactions
        };
    }
}

module.exports = PaymentStore;
