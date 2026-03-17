/**
 * 测试 P2P 网络
 * 
 * 启动多个节点，验证：
 * 1. 节点间连接
 * 2. 数据发布与同步
 * 3. 数据查询
 */

const { P2PNode } = require('./p2p-node');

async function testP2P() {
  console.log('🧪 测试 P2P 网络\n');
  
  // 1. 启动第一个节点（引导节点）
  console.log('📡 启动引导节点...');
  const bootstrap = new P2PNode({ nodeId: 'bootstrap-001' });
  const port1 = await bootstrap.start();
  console.log(`   端口: ${port1}\n`);
  
  // 等待一下
  await delay(500);
  
  // 2. 启动第二个节点，连接引导节点
  console.log('📡 启动节点2，连接引导节点...');
  const node2 = new P2PNode({
    nodeId: 'node-002',
    bootstrapNodes: [`ws://localhost:${port1}`]
  });
  const port2 = await node2.start();
  console.log(`   端口: ${port2}\n`);
  
  await delay(1000);
  
  // 3. 启动第三个节点
  console.log('📡 启动节点3，连接引导节点...');
  const node3 = new P2PNode({
    nodeId: 'node-003',
    bootstrapNodes: [`ws://localhost:${port1}`]
  });
  const port3 = await node3.start();
  console.log(`   端口: ${port3}\n`);
  
  await delay(1000);
  
  // 4. 检查节点状态
  console.log('📊 节点状态:');
  console.log('   引导节点:', bootstrap.getStatus().peers.length, '个连接');
  console.log('   节点2:', node2.getStatus().peers.length, '个连接');
  console.log('   节点3:', node3.getStatus().peers.length, '个连接\n');
  
  // 5. 测试数据发布
  console.log('📝 节点2 发布数据...');
  node2.publish('agent:测试虾', {
    name: '测试小龙虾',
    tags: ['P2P', '测试'],
    description: '我是通过 P2P 网络发布的智能体档案'
  });
  
  await delay(1000);
  
  // 6. 测试数据查询
  console.log('🔍 节点3 查询数据...');
  const data = await node3.query('agent:测试虾');
  if (data) {
    console.log('   找到数据:', data.value.name);
    console.log('   标签:', data.value.tags.join(', '));
    console.log('   来自节点:', data.nodeId.slice(0, 8));
  } else {
    console.log('   未找到数据');
  }
  
  await delay(500);
  
  // 7. 测试广播消息
  console.log('\n📢 测试广播消息...');
  node2.broadcast({
    type: 'CHAT',
    from: 'node-002',
    content: '大家好，我是节点2！'
  });
  
  // 注册聊天处理器
  node3.on('CHAT', (ws, msg) => {
    console.log(`   节点3 收到消息: ${msg.content}`);
  });
  
  await delay(500);
  
  // 8. 最终状态
  console.log('\n📊 最终状态:');
  console.log('   引导节点连接数:', bootstrap.getStatus().peers.length);
  console.log('   节点2连接数:', node2.getStatus().peers.length);
  console.log('   节点3连接数:', node3.getStatus().peers.length);
  console.log('   引导节点数据数:', bootstrap.getStatus().dataCount);
  console.log('   节点2数据数:', node2.getStatus().dataCount);
  console.log('   节点3数据数:', node3.getStatus().dataCount);
  
  // 9. 清理
  console.log('\n🧹 清理...');
  await bootstrap.stop();
  await node2.stop();
  await node3.stop();
  
  console.log('\n✅ P2P 测试完成！');
  
  process.exit(0);
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

testP2P().catch(err => {
  console.error('测试失败:', err);
  process.exit(1);
});
