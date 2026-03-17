/**
 * 测试 HTTP API
 */

const http = require('http');

const BASE_URL = 'http://localhost:9877';

function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = BASE_URL + path;
    
    const req = http.request(url, { method }, (res) => {
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
    
    if (body) {
      req.write(JSON.stringify(body));
    }
    
    req.end();
  });
}

async function test() {
  console.log('🧪 测试 HTTP API\n');
  
  // 1. 列出智能体
  console.log('1️⃣ GET /agents');
  let result = await request('GET', '/agents');
  console.log(`   状态: ${result.status}`);
  console.log(`   智能体数量: ${result.data.total}`);
  
  // 2. 创建智能体
  console.log('\n2️⃣ POST /agents');
  result = await request('POST', '/agents', {
    agentId: 'test-虾-' + Date.now(),
    name: 'HTTP测试虾',
    tags: ['HTTP', 'API', '测试'],
    description: '通过 HTTP API 创建的智能体'
  });
  console.log(`   状态: ${result.status}`);
  console.log(`   创建: ${result.data.agent?.name}`);
  const agentId = result.data.agent?.agentId;
  
  // 3. 获取智能体
  console.log('\n3️⃣ GET /agents/:id');
  const encodedAgentId = encodeURIComponent(agentId);
  result = await request('GET', `/agents/${encodedAgentId}`);
  console.log(`   状态: ${result.status}`);
  console.log(`   名称: ${result.data.agent?.name}`);
  console.log(`   标签: ${result.data.agent?.tags?.join(', ')}`);
  
  // 4. 搜索智能体
  console.log('\n4️⃣ GET /agents/search?q=HTTP');
  result = await request('GET', '/agents/search?q=HTTP');
  console.log(`   状态: ${result.status}`);
  console.log(`   找到: ${result.data.count} 个`);
  
  // 5. 创建任务
  console.log('\n5️⃣ POST /tasks');
  result = await request('POST', '/tasks', {
    creatorId: agentId,
    title: 'HTTP API 测试任务',
    description: '通过 HTTP API 创建的任务',
    reward: { type: 'credit', amount: 50, description: '50积分' },
    tags: ['测试', 'HTTP']
  });
  console.log(`   状态: ${result.status}`);
  console.log(`   任务: ${result.data.task?.title}`);
  const taskId = result.data.task?.taskId;
  
  // 6. 列出任务
  console.log('\n6️⃣ GET /tasks');
  result = await request('GET', '/tasks?status=OPEN');
  console.log(`   状态: ${result.status}`);
  console.log(`   开放任务: ${result.data.total}`);
  
  // 7. 搜索任务
  console.log('\n7️⃣ GET /tasks/search?q=HTTP');
  result = await request('GET', '/tasks/search?q=HTTP');
  console.log(`   状态: ${result.status}`);
  console.log(`   找到: ${result.data.count} 个`);
  
  // 8. 接受任务
  console.log('\n8️⃣ POST /tasks/:id/accept');
  result = await request('POST', `/tasks/${taskId}/accept`, { agentId });
  console.log(`   状态: ${result.status}`);
  console.log(`   任务状态: ${result.data.task?.status}`);
  
  // 9. 完成任务
  console.log('\n9️⃣ POST /tasks/:id/complete');
  result = await request('POST', `/tasks/${taskId}/complete`, { agentId });
  console.log(`   状态: ${result.status}`);
  console.log(`   任务状态: ${result.data.task?.status}`);
  
  console.log('\n✅ HTTP API 测试完成！');
}

test().catch(console.error);
