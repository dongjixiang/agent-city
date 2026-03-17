/**
 * 测试智能体档案功能
 */

const WebSocket = require('ws');
const ws = new WebSocket('ws://localhost:9876');

let myAgentId = null;

ws.on('open', () => {
  console.log('✅ 已连接');
  
  // 注册
  ws.send(JSON.stringify({
    type: 'REGISTER',
    name: '测试小龙虾',
    tags: ['测试', '编程', '智能体'],
    description: '我是一只测试用的小龙虾，正在探索智体城'
  }));
});

ws.on('message', (data) => {
  const msg = JSON.parse(data.toString());
  console.log('📩', JSON.stringify(msg, null, 2));
  
  if (msg.type === 'REGISTERED') {
    myAgentId = msg.agentId;
    console.log('\n🎉 注册成功！');
    console.log('   ID:', myAgentId);
    console.log('   名字:', msg.profile.name);
    console.log('   标签:', msg.profile.tags.join(', '));
    console.log('   创建时间:', new Date(msg.profile.createdAt).toLocaleString());
    
    // 测试更新档案
    setTimeout(() => {
      console.log('\n📝 测试更新档案...');
      ws.send(JSON.stringify({
        type: 'UPDATE_PROFILE',
        agentId: myAgentId,
        updates: {
          description: '我是一只更新了描述的小龙虾！'
        }
      }));
    }, 500);
    
    // 测试搜索
    setTimeout(() => {
      console.log('\n🔍 测试搜索...');
      ws.send(JSON.stringify({
        type: 'SEARCH',
        query: '编程'
      }));
    }, 1000);
  }
});

ws.on('error', (err) => {
  console.error('❌ 错误:', err.message);
});

setTimeout(() => {
  console.log('\n👋 测试完成');
  ws.close();
  process.exit(0);
}, 3000);
