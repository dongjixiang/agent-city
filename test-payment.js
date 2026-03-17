/**
 * 测试支付系统
 */

const PaymentStore = require('./payment-store');

console.log('🧪 测试支付系统\n');

// 1. 充值
console.log('1️⃣ 充值测试');
let result = PaymentStore.deposit('agent:test-payment-001', 1000, 'credit', '初始充值');
console.log(`   结果: ${result.success ? '成功' : '失败'}`);
console.log(`   余额: ${result.balance} 积分\n`);

// 2. 查询余额
console.log('2️⃣ 查询余额');
const balance = PaymentStore.getBalance('agent:test-payment-001', 'credit');
console.log(`   积分余额: ${balance}\n`);

// 3. 托管任务报酬
console.log('3️⃣ 托管任务报酬');
result = PaymentStore.escrowTaskReward('agent:test-payment-001', 'task-001', 200, 'credit');
console.log(`   结果: ${result.success ? '成功' : '失败'}`);
console.log(`   托管ID: ${result.escrowId}`);
console.log(`   剩余余额: ${result.balance} 积分\n`);

// 4. 查看账户摘要
console.log('4️⃣ 账户摘要');
const summary = PaymentStore.getAccountSummary('agent:test-payment-001');
console.log(`   余额: ${summary.balances.credit} 积分`);
console.log(`   托管中: ${summary.escrow.totalHeld} 积分`);
console.log(`   总收入: ${summary.stats.totalIncome}`);
console.log(`   总支出: ${summary.stats.totalExpense}\n`);

// 5. 创建执行者账户并充值
console.log('5️⃣ 创建执行者账户');
PaymentStore.deposit('agent:test-payment-002', 500, 'credit', '初始充值');
const balance2 = PaymentStore.getBalance('agent:test-payment-002', 'credit');
console.log(`   执行者余额: ${balance2} 积分\n`);

// 6. 释放托管资金（任务完成）
console.log('6️⃣ 释放托管资金');
result = PaymentStore.releaseEscrow(result.escrowId, 'agent:test-payment-002');
if (result.success) {
  console.log(`   释放金额: ${result.amount} 积分`);
  console.log(`   执行者新余额: ${result.assigneeBalance} 积分\n`);
}

// 7. 查看交易记录
console.log('7️⃣ 执行者交易记录');
const txs = PaymentStore.getTransactions('agent:test-payment-002');
txs.transactions.forEach((tx, i) => {
  const sign = tx.to === 'agent:test-payment-002' ? '+' : '-';
  console.log(`   ${i + 1}. ${tx.description}: ${sign}${tx.amount} ${tx.currency}`);
});
console.log('');

// 8. 测试转账
console.log('8️⃣ 转账测试');
result = PaymentStore.transfer('agent:test-payment-002', 'agent:test-payment-001', 50, 'credit', '红包');
if (result.success) {
  console.log(`   转账成功`);
  console.log(`   发送方余额: ${result.fromBalance}`);
  console.log(`   接收方余额: ${result.toBalance}\n`);
}

// 9. 测试提现
console.log('9️⃣ 提现测试');
result = PaymentStore.withdraw('agent:test-payment-001', 100, 'credit', '提现测试');
if (result.success) {
  console.log(`   提现成功`);
  console.log(`   剩余余额: ${result.balance}\n`);
}

// 10. 测试退款
console.log('🔟 测试托管退款');
PaymentStore.deposit('agent:test-payment-003', 500, 'credit');
const escrowResult = PaymentStore.escrowTaskReward('agent:test-payment-003', 'task-002', 300, 'credit');
console.log(`   创建托管: ${escrowResult.escrowId}`);

const refundResult = PaymentStore.refundEscrow(escrowResult.escrowId);
if (refundResult.success) {
  console.log(`   退款成功`);
  console.log(`   退回金额: ${refundResult.amount}`);
  console.log(`   余额: ${refundResult.balance}\n`);
}

// 11. 最终状态
console.log('📊 最终状态');
['agent:test-payment-001', 'agent:test-payment-002', 'agent:test-payment-003'].forEach(agentId => {
  const s = PaymentStore.getAccountSummary(agentId);
  console.log(`   ${agentId.slice(0, 20)}...`);
  console.log(`     余额: ${s.balances.credit} 积分`);
  console.log(`     托管: ${s.escrow.totalHeld} 积分`);
  console.log(`     交易: ${s.stats.totalTransactions} 笔`);
});

console.log('\n✅ 支付系统测试完成！');
