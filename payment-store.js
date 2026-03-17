/**
 * 智体城 - 支付系统
 * 
 * 任务报酬结算
 * - 账户余额
 * - 充值、提现
 * - 任务报酬托管与释放
 * - 交易记录
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const PAYMENT_FILE = path.join(DATA_DIR, 'payments.json');

// 确保数据目录存在
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

/**
 * 货币类型
 */
const CURRENCY = {
  CREDIT: 'credit',     // 积分（虚拟货币）
  TOKEN: 'token'        // 代币（可兑换）
};

/**
 * 交易状态
 */
const TX_STATUS = {
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED',
  REFUNDED: 'REFUNDED'
};

/**
 * 交易类型
 */
const TX_TYPE = {
  DEPOSIT: 'DEPOSIT',           // 充值
  WITHDRAW: 'WITHDRAW',         // 提现
  TASK_REWARD: 'TASK_REWARD',   // 任务报酬
  TASK_PAYMENT: 'TASK_PAYMENT', // 任务支付
  ESCROW_HOLD: 'ESCROW_HOLD',   // 托管冻结
  ESCROW_RELEASE: 'ESCROW_RELEASE', // 托管释放
  ESCROW_REFUND: 'ESCROW_REFUND',   // 托管退款
  TRANSFER: 'TRANSFER'          // 转账
};

/**
 * 账户数据结构
 * 
 * {
 *   agentId: {
 *     balances: {
 *       credit: number,
 *       token: number
 *     },
 *     escrow: {                    // 托管资金
 *       [escrowId]: {
 *         amount: number,
 *         currency: string,
 *         taskId: string,
 *         status: 'HELD' | 'RELEASED' | 'REFUNDED',
 *         createdAt: number,
 *         releasedAt: number | null
 *       }
 *     },
 *     transactions: [{             // 交易记录
 *       txId: string,
 *       type: string,
 *       amount: number,
 *       currency: string,
 *       status: string,
 *       from: string | null,
 *       to: string | null,
 *       taskId: string | null,
 *       escrowId: string | null,
 *       description: string,
 *       createdAt: number,
 *       completedAt: number | null
 *     }]
 *   }
 * }
 */

// 内存缓存
let paymentCache = null;

/**
 * 加载支付数据
 */
function loadPayments() {
  if (paymentCache) return paymentCache;
  
  try {
    if (fs.existsSync(PAYMENT_FILE)) {
      const data = fs.readFileSync(PAYMENT_FILE, 'utf-8');
      paymentCache = JSON.parse(data);
      return paymentCache;
    }
  } catch (err) {
    console.error('加载支付数据失败:', err.message);
  }
  
  paymentCache = {};
  return paymentCache;
}

/**
 * 保存支付数据
 */
function savePayments() {
  try {
    fs.writeFileSync(PAYMENT_FILE, JSON.stringify(paymentCache, null, 2), 'utf-8');
  } catch (err) {
    console.error('保存支付数据失败:', err.message);
  }
}

/**
 * 生成交易 ID
 */
function generateTxId() {
  return `tx_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * 生成托管 ID
 */
function generateEscrowId() {
  return `esc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * 获取或创建账户
 */
function getOrCreateAccount(agentId) {
  const payments = loadPayments();
  
  if (!payments[agentId]) {
    payments[agentId] = {
      agentId,
      balances: {
        credit: 0,
        token: 0
      },
      escrow: {},
      transactions: []
    };
    savePayments();
  }
  
  return payments[agentId];
}

/**
 * 获取余额
 */
function getBalance(agentId, currency = CURRENCY.CREDIT) {
  const account = getOrCreateAccount(agentId);
  return account.balances[currency] || 0;
}

/**
 * 获取所有余额
 */
function getAllBalances(agentId) {
  const account = getOrCreateAccount(agentId);
  return { ...account.balances };
}

/**
 * 充值
 */
function deposit(agentId, amount, currency = CURRENCY.CREDIT, description = '充值') {
  const account = getOrCreateAccount(agentId);
  
  if (amount <= 0) {
    return { success: false, error: '金额必须大于 0' };
  }
  
  const txId = generateTxId();
  const now = Date.now();
  
  // 增加余额
  account.balances[currency] = (account.balances[currency] || 0) + amount;
  
  // 记录交易
  const tx = {
    txId,
    type: TX_TYPE.DEPOSIT,
    amount,
    currency,
    status: TX_STATUS.COMPLETED,
    from: null,
    to: agentId,
    taskId: null,
    escrowId: null,
    description,
    createdAt: now,
    completedAt: now
  };
  
  account.transactions.push(tx);
  savePayments();
  
  console.log(`💰 充值: ${agentId.slice(0, 8)} +${amount} ${currency}`);
  
  return { success: true, txId, balance: account.balances[currency] };
}

/**
 * 提现
 */
function withdraw(agentId, amount, currency = CURRENCY.CREDIT, description = '提现') {
  const account = getOrCreateAccount(agentId);
  
  if (amount <= 0) {
    return { success: false, error: '金额必须大于 0' };
  }
  
  const balance = account.balances[currency] || 0;
  if (balance < amount) {
    return { success: false, error: '余额不足' };
  }
  
  const txId = generateTxId();
  const now = Date.now();
  
  // 扣除余额
  account.balances[currency] -= amount;
  
  // 记录交易
  const tx = {
    txId,
    type: TX_TYPE.WITHDRAW,
    amount,
    currency,
    status: TX_STATUS.COMPLETED,
    from: agentId,
    to: null,
    taskId: null,
    escrowId: null,
    description,
    createdAt: now,
    completedAt: now
  };
  
  account.transactions.push(tx);
  savePayments();
  
  console.log(`💸 提现: ${agentId.slice(0, 8)} -${amount} ${currency}`);
  
  return { success: true, txId, balance: account.balances[currency] };
}

/**
 * 托管任务报酬（创建任务时）
 */
function escrowTaskReward(creatorId, taskId, amount, currency = CURRENCY.CREDIT) {
  const account = getOrCreateAccount(creatorId);
  
  if (amount <= 0) {
    return { success: false, error: '金额必须大于 0' };
  }
  
  const balance = account.balances[currency] || 0;
  if (balance < amount) {
    return { success: false, error: '余额不足' };
  }
  
  const escrowId = generateEscrowId();
  const txId = generateTxId();
  const now = Date.now();
  
  // 冻结余额
  account.balances[currency] -= amount;
  
  // 创建托管记录
  account.escrow[escrowId] = {
    escrowId,
    amount,
    currency,
    taskId,
    status: 'HELD',
    creatorId,
    createdAt: now,
    releasedAt: null
  };
  
  // 记录交易
  account.transactions.push({
    txId,
    type: TX_TYPE.ESCROW_HOLD,
    amount,
    currency,
    status: TX_STATUS.COMPLETED,
    from: creatorId,
    to: null,
    taskId,
    escrowId,
    description: `任务报酬托管`,
    createdAt: now,
    completedAt: now
  });
  
  savePayments();
  
  console.log(`🔒 托管: ${creatorId.slice(0, 8)} 冻结 ${amount} ${currency} 用于任务 ${taskId}`);
  
  return { success: true, escrowId, txId, balance: account.balances[currency] };
}

/**
 * 释放托管资金（任务完成时）
 */
function releaseEscrow(escrowId, assigneeId) {
  const payments = loadPayments();
  
  // 查找托管记录
  let escrow = null;
  let creatorId = null;
  
  for (const [agentId, account] of Object.entries(payments)) {
    if (account.escrow[escrowId]) {
      escrow = account.escrow[escrowId];
      creatorId = agentId;
      break;
    }
  }
  
  if (!escrow) {
    return { success: false, error: '托管记录不存在' };
  }
  
  if (escrow.status !== 'HELD') {
    return { success: false, error: '托管资金已释放或退款' };
  }
  
  const { amount, currency, taskId } = escrow;
  const now = Date.now();
  
  // 更新托管状态
  escrow.status = 'RELEASED';
  escrow.releasedAt = now;
  escrow.assigneeId = assigneeId;
  
  // 给执行者增加余额
  const assigneeAccount = getOrCreateAccount(assigneeId);
  assigneeAccount.balances[currency] = (assigneeAccount.balances[currency] || 0) + amount;
  
  // 记录交易 - 创建者
  payments[creatorId].transactions.push({
    txId: generateTxId(),
    type: TX_TYPE.ESCROW_RELEASE,
    amount,
    currency,
    status: TX_STATUS.COMPLETED,
    from: creatorId,
    to: assigneeId,
    taskId,
    escrowId,
    description: `任务报酬释放给 ${assigneeId.slice(0, 8)}`,
    createdAt: now,
    completedAt: now
  });
  
  // 记录交易 - 执行者
  assigneeAccount.transactions.push({
    txId: generateTxId(),
    type: TX_TYPE.TASK_REWARD,
    amount,
    currency,
    status: TX_STATUS.COMPLETED,
    from: creatorId,
    to: assigneeId,
    taskId,
    escrowId,
    description: `完成任务获得报酬`,
    createdAt: now,
    completedAt: now
  });
  
  savePayments();
  
  console.log(`✅ 释放托管: ${assigneeId.slice(0, 8)} 获得 ${amount} ${currency}`);
  
  return { 
    success: true, 
    amount, 
    currency,
    assigneeBalance: assigneeAccount.balances[currency]
  };
}

/**
 * 退款托管资金（任务取消时）
 */
function refundEscrow(escrowId) {
  const payments = loadPayments();
  
  // 查找托管记录
  let escrow = null;
  let creatorId = null;
  
  for (const [agentId, account] of Object.entries(payments)) {
    if (account.escrow[escrowId]) {
      escrow = account.escrow[escrowId];
      creatorId = agentId;
      break;
    }
  }
  
  if (!escrow) {
    return { success: false, error: '托管记录不存在' };
  }
  
  if (escrow.status !== 'HELD') {
    return { success: false, error: '托管资金已释放或退款' };
  }
  
  const { amount, currency, taskId } = escrow;
  const now = Date.now();
  
  // 更新托管状态
  escrow.status = 'REFUNDED';
  escrow.refundedAt = now;
  
  // 退款给创建者
  const creatorAccount = payments[creatorId];
  creatorAccount.balances[currency] = (creatorAccount.balances[currency] || 0) + amount;
  
  // 记录交易
  creatorAccount.transactions.push({
    txId: generateTxId(),
    type: TX_TYPE.ESCROW_REFUND,
    amount,
    currency,
    status: TX_STATUS.COMPLETED,
    from: null,
    to: creatorId,
    taskId,
    escrowId,
    description: '任务取消，托管资金退款',
    createdAt: now,
    completedAt: now
  });
  
  savePayments();
  
  console.log(`↩️ 退款: ${creatorId.slice(0, 8)} 收回 ${amount} ${currency}`);
  
  return { 
    success: true, 
    amount, 
    currency,
    balance: creatorAccount.balances[currency]
  };
}

/**
 * 转账
 */
function transfer(fromId, toId, amount, currency = CURRENCY.CREDIT, description = '转账') {
  const fromAccount = getOrCreateAccount(fromId);
  const toAccount = getOrCreateAccount(toId);
  
  if (amount <= 0) {
    return { success: false, error: '金额必须大于 0' };
  }
  
  const balance = fromAccount.balances[currency] || 0;
  if (balance < amount) {
    return { success: false, error: '余额不足' };
  }
  
  const txId = generateTxId();
  const now = Date.now();
  
  // 转账
  fromAccount.balances[currency] -= amount;
  toAccount.balances[currency] = (toAccount.balances[currency] || 0) + amount;
  
  // 记录交易 - 发送方
  fromAccount.transactions.push({
    txId,
    type: TX_TYPE.TRANSFER,
    amount,
    currency,
    status: TX_STATUS.COMPLETED,
    from: fromId,
    to: toId,
    taskId: null,
    escrowId: null,
    description,
    createdAt: now,
    completedAt: now
  });
  
  // 记录交易 - 接收方
  toAccount.transactions.push({
    txId: `${txId}_recv`,
    type: TX_TYPE.TRANSFER,
    amount,
    currency,
    status: TX_STATUS.COMPLETED,
    from: fromId,
    to: toId,
    taskId: null,
    escrowId: null,
    description,
    createdAt: now,
    completedAt: now
  });
  
  savePayments();
  
  console.log(`📤 转账: ${fromId.slice(0, 8)} → ${toId.slice(0, 8)} ${amount} ${currency}`);
  
  return { 
    success: true, 
    txId, 
    fromBalance: fromAccount.balances[currency],
    toBalance: toAccount.balances[currency]
  };
}

/**
 * 获取交易记录
 */
function getTransactions(agentId, options = {}) {
  const account = getOrCreateAccount(agentId);
  
  let transactions = [...account.transactions];
  
  // 按类型过滤
  if (options.type) {
    transactions = transactions.filter(tx => tx.type === options.type);
  }
  
  // 按状态过滤
  if (options.status) {
    transactions = transactions.filter(tx => tx.status === options.status);
  }
  
  // 按时间排序（最新在前）
  transactions.sort((a, b) => b.createdAt - a.createdAt);
  
  // 分页
  const limit = options.limit || 50;
  const offset = options.offset || 0;
  const paginated = transactions.slice(offset, offset + limit);
  
  return {
    total: transactions.length,
    count: paginated.length,
    transactions: paginated
  };
}

/**
 * 获取账户摘要
 */
function getAccountSummary(agentId) {
  const account = getOrCreateAccount(agentId);
  
  // 计算总收支
  let totalIncome = 0;
  let totalExpense = 0;
  
  account.transactions.forEach(tx => {
    if (tx.status === TX_STATUS.COMPLETED) {
      if (tx.to === agentId) {
        totalIncome += tx.amount;
      } else if (tx.from === agentId) {
        totalExpense += tx.amount;
      }
    }
  });
  
  // 统计托管
  const escrows = Object.values(account.escrow);
  const heldEscrows = escrows.filter(e => e.status === 'HELD');
  const totalHeld = heldEscrows.reduce((sum, e) => sum + e.amount, 0);
  
  return {
    agentId,
    balances: account.balances,
    escrow: {
      total: escrows.length,
      held: heldEscrows.length,
      totalHeld
    },
    stats: {
      totalTransactions: account.transactions.length,
      totalIncome,
      totalExpense
    }
  };
}

/**
 * 获取托管记录
 */
function getEscrow(escrowId) {
  const payments = loadPayments();
  
  for (const account of Object.values(payments)) {
    if (account.escrow[escrowId]) {
      return account.escrow[escrowId];
    }
  }
  
  return null;
}

module.exports = {
  CURRENCY,
  TX_STATUS,
  TX_TYPE,
  getBalance,
  getAllBalances,
  deposit,
  withdraw,
  escrowTaskReward,
  releaseEscrow,
  refundEscrow,
  transfer,
  getTransactions,
  getAccountSummary,
  getEscrow
};
