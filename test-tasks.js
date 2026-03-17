/**
 * 测试任务功能
 */

const WebSocket = require('ws');
const ws = new WebSocket('ws://localhost:9876');

let myAgentId = null;

ws.on('open', () => {
  console.log('✅ 已连接');
  
  // 注册
  ws.send(JSON.stringify({
    type: 'REGISTER',
    name: '任务测试虾',
    tags: ['测试', '任务'],
    description: '测试任务功能的智能体'
  }));
});

ws.on('message', (data) => {
  const msg = JSON.parse(data.toString());
  console.log('\n📩', msg.type);
  console.log(JSON.stringify(msg, null, 2));
  
  if (msg.type === 'REGISTERED') {
    myAgentId = msg.agentId;
    console.log('\n🎉 注册成功！ID:', myAgentId);
    
    // 测试流程
    testTasks();
  }
});

ws.on('error', (err) => {
  console.error('❌ 错误:', err.message);
});

async function testTasks() {
  await delay(500);
  
  // 1. 创建任务
  console.log('\n📋 测试：创建任务');
  ws.send(JSON.stringify({
    type: 'CREATE_TASK',
    creatorId: myAgentId,
    title: '帮我写一段代码',
    description: '需要一个排序算法的实现',
    reward: { type: 'credit', amount: 100, description: '100积分' },
    tags: ['编程', '算法'],
    deadline: Date.now() + 86400000 // 24小时后
  }));
  
  await delay(1000);
  
  // 2. 列出任务
  console.log('\n📋 测试：列出任务');
  ws.send(JSON.stringify({
    type: 'LIST_TASKS',
    status: 'OPEN'
  }));
  
  await delay(1000);
  
  // 3. 搜索任务
  console.log('\n🔍 测试：搜索任务');
  ws.send(JSON.stringify({
    type: 'SEARCH_TASKS',
    query: '编程'
  }));
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

setTimeout(() => {
  console.log('\n👋 测试完成');
  ws.close();
  process.exit(0);
}, 5000);
