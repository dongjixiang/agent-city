/**
 * 测试声誉系统 HTTP API
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
  console.log('🧪 测试声誉系统 HTTP API\n');
  
  // 先启动 HTTP 服务器
  require('./http-server');
  
  await delay(1000);
  
  // 1. 创建智能体
  console.log('1️⃣ 创建智能体');
  let result = await request('POST', '/agents', {
    agentId: 'reputation-test-agent',
    name: '声誉测试虾',
    tags: ['测试', '声誉']
  });
  console.log(`   状态: ${result.status}`);
  
  // 2. 创建任务
  console.log('\n2️⃣ 创建任务');
  result = await request('POST', '/tasks', {
    creatorId: 'reputation-test-agent',
    title: '声誉测试任务',
    description: '测试声誉系统的任务',
    reward: { type: 'credit', amount: 100 }
  });
  console.log(`   状态: ${result.status}`);
  const taskId = result.data.task?.taskId;
  
  // 3. 接受任务
  console.log('\n3️⃣ 接受任务');
  result = await request('POST', `/tasks/${taskId}/accept`, {
    agentId: 'reputation-test-agent'
  });
  console.log(`   状态: ${result.status}`);
  
  // 4. 完成任务（会触发声誉变化）
  console.log('\n4️⃣ 完成任务');
  result = await request('POST', `/tasks/${taskId}/complete`, {
    agentId: 'reputation-test-agent'
  });
  console.log(`   状态: ${result.status}`);
  
  await delay(500);
  
  // 5. 获取声誉
  console.log('\n5️⃣ 获取声誉摘要');
  result = await request('GET', '/reputation/reputation-test-agent');
  console.log(`   状态: ${result.status}`);
  if (result.data.reputation) {
    const rep = result.data.reputation;
    console.log(`   分数: ${rep.score}`);
    console.log(`   等级: ${rep.levelIcon} ${rep.level}`);
    console.log(`   进度: ${rep.progress}%`);
    console.log(`   已完成任务: ${rep.stats.tasksCompleted}`);
  }
  
  // 6. 添加评分
  console.log('\n6️⃣ 添加评分');
  result = await request('POST', '/reputation/reputation-test-agent/rate', {
    fromAgentId: 'rater-001',
    taskId: taskId,
    score: 5,
    comment: '非常棒！'
  });
  console.log(`   状态: ${result.status}`);
  console.log(`   平均评分: ${result.data.avgRating}`);
  
  // 7. 再次获取声誉
  console.log('\n7️⃣ 更新后的声誉');
  result = await request('GET', '/reputation/reputation-test-agent');
  if (result.data.reputation) {
    const rep = result.data.reputation;
    console.log(`   分数: ${rep.score}`);
    console.log(`   等级: ${rep.levelIcon} ${rep.level}`);
    console.log(`   平均评分: ${rep.stats.avgRating}`);
    console.log(`   徽章: ${rep.badges.map(b => b.icon + b.name).join(', ')}`);
  }
  
  // 8. 排行榜
  console.log('\n8️⃣ 排行榜');
  result = await request('GET', '/leaderboard?limit=5');
  console.log(`   状态: ${result.status}`);
  result.data.leaderboard?.forEach((entry, i) => {
    console.log(`   ${entry.rank}. ${entry.levelIcon} ${entry.agentId.slice(0, 15)}... - 分数: ${entry.score}`);
  });
  
  console.log('\n✅ 声誉系统 HTTP API 测试完成！');
  process.exit(0);
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

test().catch(err => {
  console.error('测试失败:', err);
  process.exit(1);
});
