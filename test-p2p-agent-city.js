/**
 * 测试 P2P 智体城
 */

const { AgentCityP2P } = require('./p2p-agent-city');

async function test() {
  console.log('🧪 测试 P2P 智体城\n');
  
  // 1. 启动引导节点
  console.log('📡 启动引导节点...');
  const bootstrap = new AgentCityP2P({
    nodeId: 'agent-city-bootstrap'
  });
  const port1 = await bootstrap.start();
  console.log(`   端口: ${port1}\n`);
  
  await delay(500);
  
  // 2. 启动第二个节点
  console.log('📡 启动节点2...');
  const node2 = new AgentCityP2P({
    nodeId: 'agent-city-node2',
    bootstrapNodes: [`ws://localhost:${port1}`]
  });
  const port2 = await node2.start();
  console.log(`   端口: ${port2}\n`);
  
  await delay(1000);
  
  // 3. 在节点2上发布智能体
  console.log('📝 节点2 发布智能体档案...');
  node2.publishAgent('agent:p2p-test-001', {
    name: 'P2P测试虾',
    tags: ['P2P', '去中心化'],
    description: '通过 P2P 网络发布的智能体'
  });
  
  await delay(1000);
  
  // 4. 在引导节点上查询
  console.log('🔍 引导节点查询智能体...');
  const agent = await bootstrap.queryAgent('agent:p2p-test-001');
  if (agent) {
    console.log(`   找到: ${agent.name}`);
    console.log(`   标签: ${agent.tags?.join(', ')}`);
  }
  
  await delay(500);
  
  // 5. 在节点2上创建任务
  console.log('\n📋 节点2 创建任务...');
  const task = require('./task-store').createTask('agent:p2p-test-001', {
    title: 'P2P任务测试',
    description: '通过 P2P 网络同步的任务',
    reward: { type: 'credit', amount: 100 },
    tags: ['P2P']
  });
  node2.publishTask(task);
  console.log(`   任务ID: ${task.taskId}`);
  
  await delay(1000);
  
  // 6. 在引导节点上查询任务
  console.log('🔍 引导节点查询任务...');
  const taskData = await bootstrap.queryTask(task.taskId);
  if (taskData) {
    console.log(`   找到: ${taskData.title}`);
    console.log(`   创建者: ${taskData.creator?.slice(0, 15)}...`);
  }
  
  await delay(500);
  
  // 7. 显示状态
  console.log('\n📊 节点状态:');
  console.log('   引导节点:', bootstrap.getStatus().peers.length, '个连接');
  console.log('   节点2:', node2.getStatus().peers.length, '个连接');
  
  // 8. 清理
  console.log('\n🧹 清理...');
  await bootstrap.stop();
  await node2.stop();
  
  console.log('\n✅ P2P 智体城测试完成！');
  process.exit(0);
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

test().catch(err => {
  console.error('测试失败:', err);
  process.exit(1);
});
