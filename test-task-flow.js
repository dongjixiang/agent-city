/**
 * 测试任务完整流程
 * 
 * 需要2个终端同时运行：
 * 终端1：node test-task-flow.js creator
 * 终端2：node test-task-flow.js worker
 */

const WebSocket = require('ws');
const ws = new WebSocket('ws://localhost:9876');

const role = process.argv[2] || 'creator';
let myAgentId = null;
let taskId = null;

ws.on('open', () => {
  console.log(`✅ 已连接，角色: ${role}`);
  
  ws.send(JSON.stringify({
    type: 'REGISTER',
    name: role === 'creator' ? '任务发布者' : '任务执行者',
    tags: [role, '测试'],
    description: role === 'creator' ? '发布任务的智能体' : '执行任务的智能体'
  }));
});

ws.on('message', (data) => {
  const msg = JSON.parse(data.toString());
  console.log(`\n📩 [${role}] ${msg.type}`);
  
  if (msg.type === 'REGISTERED') {
    myAgentId = msg.agentId;
    console.log(`   ID: ${myAgentId}`);
    
    if (role === 'creator') {
      // 创建者：发布任务
      setTimeout(() => {
        console.log('\n📋 发布任务...');
        ws.send(JSON.stringify({
          type: 'CREATE_TASK',
          creatorId: myAgentId,
          title: '帮我分析数据',
          description: '需要分析一批数据并生成报告',
          reward: { type: 'credit', amount: 200, description: '200积分' },
          tags: ['数据分析', '报告']
        }));
      }, 500);
    } else {
      // 执行者：等待并接受任务
      setTimeout(() => {
        console.log('\n📋 查询开放任务...');
        ws.send(JSON.stringify({ type: 'LIST_TASKS', status: 'OPEN' }));
      }, 2000);
    }
  }
  
  if (msg.type === 'TASK_CREATED') {
    taskId = msg.task.taskId;
    console.log(`   任务ID: ${taskId}`);
    
    // 查询任务列表
    setTimeout(() => {
      ws.send(JSON.stringify({ type: 'LIST_TASKS', status: 'OPEN' }));
    }, 1000);
  }
  
  if (msg.type === 'TASK_LIST') {
    if (role === 'worker' && msg.tasks.length > 0) {
      taskId = msg.tasks[0].taskId;
      console.log(`   找到任务: ${msg.tasks[0].title}`);
      
      // 申请任务
      setTimeout(() => {
        console.log('\n📨 申请任务...');
        ws.send(JSON.stringify({
          type: 'APPLY_TASK',
          taskId: taskId,
          agentId: myAgentId
        }));
      }, 500);
    }
  }
  
  if (msg.type === 'TASK_APPLIED') {
    console.log(`   申请成功！`);
    
    // 尝试直接接受（先到先得模式）
    setTimeout(() => {
      console.log('\n✅ 直接接受任务...');
      ws.send(JSON.stringify({
        type: 'ACCEPT_TASK',
        taskId: taskId,
        agentId: myAgentId
      }));
    }, 500);
  }
  
  if (msg.type === 'TASK_ACCEPTED') {
    console.log(`   已接受任务！`);
    
    if (role === 'worker') {
      // 执行者：完成任务
      setTimeout(() => {
        console.log('\n🎉 完成任务...');
        ws.send(JSON.stringify({
          type: 'COMPLETE_TASK',
          taskId: taskId,
          agentId: myAgentId
        }));
      }, 1000);
    }
  }
  
  if (msg.type === 'TASK_APPLICATION') {
    console.log(`   有新申请者: ${msg.applicant.name}`);
    
    // 创建者：接受申请者
    setTimeout(() => {
      console.log('\n✅ 接受申请者...');
      ws.send(JSON.stringify({
        type: 'ACCEPT_APPLICANT',
        taskId: taskId,
        creatorId: myAgentId,
        assigneeId: msg.applicant.agentId
      }));
    }, 500);
  }
  
  if (msg.type === 'TASK_ASSIGNED') {
    console.log(`   你被指派了任务！`);
  }
  
  if (msg.type === 'TASK_COMPLETED') {
    console.log(`   任务已完成！`);
  }
});

ws.on('error', (err) => {
  console.error('❌ 错误:', err.message);
});

setTimeout(() => {
  console.log('\n👋 测试完成');
  ws.close();
  process.exit(0);
}, 10000);
