/**
 * 测试支付系统 HTTP API
 */

const http = require('http');

const BASE_URL = 'http://localhost:9877';

function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(BASE_URL + path, { method }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, data });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function test() {
  console.log('🧪 测试支付系统 HTTP API\n');
  
  // 启动服务器
  require('./http-server');
  await delay(1000);
  
  const agent1 = 'payment-api-test-001';
  const agent2 = 'payment-api-test-002';
  
  // 1. 充值
  console.log('1️⃣ 充值');
  let result = await request('POST', `/payment/${agent1}/deposit`, { amount: 1000, description: '初始充值' });
  console.log(`   状态: ${result.status}`);
  console.log(`   余额: ${result.data.balance}\n`);
  
  // 2. 查询余额
  console.log('2️⃣ 查询余额');
  result = await request('GET', `/payment/${agent1}/balance`);
  console.log(`   状态: ${result.status}`);
  console.log(`   余额: ${JSON.stringify(result.data.balances)}\n`);
  
  // 3. 账户摘要
  console.log('3️⃣ 账户摘要');
  result = await request('GET', `/payment/${agent1}/summary`);
  console.log(`   状态: ${result.status}`);
  console.log(`   余额: ${result.data.summary.balances.credit}`);
  console.log(`   交易: ${result.data.summary.stats.totalTransactions} 笔\n`);
  
  // 4. 转账
  console.log('4️⃣ 转账');
  result = await request('POST', `/payment/${agent1}/transfer`, { toAgentId: agent2, amount: 200, description: '测试转账' });
  console.log(`   状态: ${result.status}`);
  console.log(`   发送方余额: ${result.data.fromBalance}`);
  console.log(`   接收方余额: ${result.data.toBalance}\n`);
  
  // 5. 创建托管
  console.log('5️⃣ 创建托管');
  result = await request('POST', '/payment/escrow/create', { agentId: agent1, taskId: 'task-payment-test', amount: 100 });
  console.log(`   状态: ${result.status}`);
  console.log(`   托管ID: ${result.data.escrowId}`);
  console.log(`   剩余余额: ${result.data.balance}`);
  const escrowId = result.data.escrowId;
  
  // 6. 释放托管
  console.log('\n6️⃣ 释放托管');
  result = await request('POST', `/payment/escrow/${escrowId}/release`, { assigneeId: agent2 });
  console.log(`   状态: ${result.status}`);
  console.log(`   释放金额: ${result.data.amount}`);
  console.log(`   接收方余额: ${result.data.assigneeBalance}\n`);
  
  // 7. 交易记录
  console.log('7️⃣ 交易记录');
  result = await request('GET', `/payment/${agent2}/transactions`);
  console.log(`   状态: ${result.status}`);
  console.log(`   交易数: ${result.data.total}`);
  result.data.transactions.slice(0, 3).forEach((tx, i) => {
    const sign = tx.to === agent2 ? '+' : '-';
    console.log(`   ${i + 1}. ${tx.description}: ${sign}${tx.amount}`);
  });
  
  // 8. 最终余额
  console.log('\n8️⃣ 最终余额');
  const balances1 = await request('GET', `/payment/${agent1}/balance`);
  const balances2 = await request('GET', `/payment/${agent2}/balance`);
  console.log(`   ${agent1}: ${balances1.data.balances.credit} 积分`);
  console.log(`   ${agent2}: ${balances2.data.balances.credit} 积分`);
  
  console.log('\n✅ 支付系统 HTTP API 测试完成！');
  process.exit(0);
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

test().catch(err => {
  console.error('测试失败:', err);
  process.exit(1);
});
