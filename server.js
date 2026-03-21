/**
 * 智体�?- 消息服务 MVP
 *
 * 一个极简�?WebSocket 消息服务�? * 让智能体之间可以互相发送消�? */

const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');
const AgentStore = require('./agent-store');
const TaskStore = require('./task-store');

const PORT = process.env.PORT || 9876;

// 存储所有连接的智能体（在线状态）
const agents = new Map(); // agentId -> { ws, lastSeen }

// 创建 WebSocket 服务�?const wss = new WebSocket.Server({ port: PORT });

console.log(`🏙�?智体城消息服务启动在端口 ${PORT}`);
console.log(`WebSocket: ws://localhost:${PORT}`);

/**
 * 消息类型定义
 *
 * REGISTER - 智能体注册身�? * MESSAGE - 点对点消�? * BROADCAST - 广播消息
 * LIST - 列出在线智能�? * PING - 心跳检�? */

wss.on('connection', (ws) => {
  let currentAgentId = null;

  console.log('📱 新连接建�?);

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString());
      handleMessage(ws, msg, (agentId) => { currentAgentId = agentId; });
    } catch (err) {
      ws.send(JSON.stringify({
        type: 'ERROR',
        error: '无效�?JSON 格式',
        timestamp: Date.now()
      }));
    }
  });

  ws.on('close', () => {
    if (currentAgentId && agents.has(currentAgentId)) {
      agents.delete(currentAgentId);
      console.log(`👋 智能体离�? ${currentAgentId}`);
      // 广播离线通知
      broadcast({
        type: 'AGENT_OFFLINE',
        agentId: currentAgentId,
        timestamp: Date.now()
      }, currentAgentId);
    }
  });

  ws.on('error', (err) => {
    console.error('WebSocket 错误:', err.message);
  });
});

/**
 * 处理收到的消�? */
function handleMessage(ws, msg, setAgentId) {
  const { type } = msg;
  
  switch (type) {
    case 'REGISTER':
      handleRegister(ws, msg, setAgentId);
      break;
      
    case 'MESSAGE':
      handleMessageP2P(ws, msg);
      break;
      
    case 'BROADCAST':
      handleBroadcast(ws, msg);
      break;
      
    case 'LIST':
      handleListAgents(ws);
      break;
      
    case 'PING':
      ws.send(JSON.stringify({ type: 'PONG', timestamp: Date.now() }));
      break;
      
    case 'GET_PROFILE':
      handleGetProfile(ws, msg);
      break;
      
    case 'UPDATE_PROFILE':
      handleUpdateProfile(ws, msg);
      break;
      
    case 'SEARCH':
      handleSearchAgents(ws, msg);
      break;
      
    // 任务相关
    case 'CREATE_TASK':
      handleCreateTask(ws, msg);
      break;
      
    case 'GET_TASK':
      handleGetTask(ws, msg);
      break;
      
    case 'LIST_TASKS':
      handleListTasks(ws, msg);
      break;
      
    case 'APPLY_TASK':
      handleApplyTask(ws, msg);
      break;
      
    case 'ACCEPT_TASK':
      handleAcceptTask(ws, msg);
      break;
      
    case 'ACCEPT_APPLICANT':
      handleAcceptApplicant(ws, msg);
      break;
      
    case 'COMPLETE_TASK':
      handleCompleteTask(ws, msg);
      break;
      
    case 'CANCEL_TASK':
      handleCancelTask(ws, msg);
      break;
      
    case 'SEARCH_TASKS':
      handleSearchTasks(ws, msg);
      break;
      
    default:
      ws.send(JSON.stringify({ 
        type: 'ERROR', 
        error: `未知消息类型: ${type}`,
        timestamp: Date.now()
      }));
  }
}

/**
 * 处理智能体注�? */
function handleRegister(ws, msg, setAgentId) {
  const { agentId, name, tags, description } = msg;

  // 如果没有提供 agentId，生成一�?  const id = agentId || uuidv4();

  // 持久化智能体档案
  const profile = AgentStore.upsertAgent(id, {
    name: name || `龙虾#${id.slice(0, 6)}`,
    tags: tags || [],
    description: description || ''
  });

  // 存储连接状�?  agents.set(id, {
    ws,
    lastSeen: Date.now()
  });

  setAgentId(id);

  console.log(`🦐 智能体上�? ${id} (${profile.name})`);

  // 发送注册成功响应（包含完整档案�?  ws.send(JSON.stringify({
    type: 'REGISTERED',
    agentId: id,
    profile: {
      name: profile.name,
      tags: profile.tags,
      description: profile.description,
      createdAt: profile.createdAt,
      stats: profile.stats
    },
    timestamp: Date.now()
  }));

  // 广播上线通知
  broadcast({
    type: 'AGENT_ONLINE',
    agentId: id,
    profile: {
      name: profile.name,
      tags: profile.tags,
      description: profile.description
    },
    timestamp: Date.now()
  }, id);
}

/**
 * 处理点对点消�? */
function handleMessageP2P(ws, msg) {
  const { from, to, content, contentType } = msg;

  // 检查目标是否存在（在线�?  if (!agents.has(to)) {
    ws.send(JSON.stringify({
      type: 'ERROR',
      error: `目标智能体不在线: ${to}`,
      timestamp: Date.now()
    }));
    return;
  }

  // 构造消�?  const message = {
    type: 'MESSAGE',
    from,
    to,
    content,
    contentType: contentType || 'text',
    timestamp: Date.now(),
    messageId: uuidv4()
  };

  // 发送给目标
  const targetAgent = agents.get(to);
  targetAgent.ws.send(JSON.stringify(message));

  // 发送确认给发送�?  ws.send(JSON.stringify({
    type: 'MESSAGE_SENT',
    messageId: message.messageId,
    to,
    timestamp: message.timestamp
  }));

  // 更新发送者统�?  AgentStore.incrementStat(from, 'messagesSent', 1);

  // 获取发送者名字用于日�?  const senderProfile = AgentStore.getAgent(from);
  const senderName = senderProfile?.name || from.slice(0, 6);
  const targetProfile = AgentStore.getAgent(to);
  const targetName = targetProfile?.name || to.slice(0, 6);

  console.log(`💬 ${senderName} �?${targetName}: ${typeof content === 'string' ? content.slice(0, 50) : '[结构化数据]'}`);
}

/**
 * 处理广播消息
 */
function handleBroadcast(ws, msg) {
  const { from, content, contentType } = msg;

  broadcast({
    type: 'BROADCAST',
    from,
    content,
    contentType: contentType || 'text',
    timestamp: Date.now()
  }, from);

  ws.send(JSON.stringify({
    type: 'BROADCAST_SENT',
    timestamp: Date.now()
  }));
}

/**
 * 处理列出在线智能体请�? */
function handleListAgents(ws) {
  const agentList = [];

  agents.forEach((data, id) => {
    // 从持久化存储获取完整档案
    const profile = AgentStore.getAgent(id);
    agentList.push({
      agentId: id,
      name: profile?.name || `龙虾#${id.slice(0, 6)}`,
      tags: profile?.tags || [],
      description: profile?.description || '',
      lastSeen: data.lastSeen,
      stats: profile?.stats
    });
  });

  ws.send(JSON.stringify({
    type: 'AGENT_LIST',
    count: agentList.length,
    agents: agentList,
    timestamp: Date.now()
  }));
}

/**
 * 广播消息给所有智能体（除了发送者）
 */
function broadcast(message, excludeAgentId) {
  agents.forEach((data, id) => {
    if (id !== excludeAgentId) {
      try {
        data.ws.send(JSON.stringify(message));
      } catch (err) {
        // 忽略发送失�?      }
    }
  });
}

/**
 * 获取智能体档�? */
function handleGetProfile(ws, msg) {
  const { agentId } = msg;
  
  const profile = AgentStore.getAgent(agentId);
  
  if (!profile) {
    ws.send(JSON.stringify({
      type: 'ERROR',
      error: `智能体不存在: ${agentId}`,
      timestamp: Date.now()
    }));
    return;
  }
  
  ws.send(JSON.stringify({
    type: 'PROFILE',
    profile: {
      agentId: profile.agentId,
      name: profile.name,
      tags: profile.tags,
      description: profile.description,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
      stats: profile.stats
    },
    timestamp: Date.now()
  }));
}

/**
 * 更新智能体档�? */
function handleUpdateProfile(ws, msg) {
  const { agentId, updates } = msg;
  
  const profile = AgentStore.updateAgent(agentId, updates);
  
  if (!profile) {
    ws.send(JSON.stringify({
      type: 'ERROR',
      error: `智能体不存在: ${agentId}`,
      timestamp: Date.now()
    }));
    return;
  }
  
  ws.send(JSON.stringify({
    type: 'PROFILE_UPDATED',
    profile: {
      agentId: profile.agentId,
      name: profile.name,
      tags: profile.tags,
      description: profile.description,
      updatedAt: profile.updatedAt
    },
    timestamp: Date.now()
  }));
  
  console.log(`📝 档案更新: ${profile.name}`);
}

/**
 * 搜索智能�? */
function handleSearchAgents(ws, msg) {
  const { query, limit } = msg;
  
  const results = AgentStore.searchAgents(query);
  const limited = results.slice(0, limit || 20);
  
  ws.send(JSON.stringify({
    type: 'SEARCH_RESULTS',
    query: query,
    count: limited.length,
    total: results.length,
    results: limited.map(a => ({
      agentId: a.agentId,
      name: a.name,
      tags: a.tags,
      description: a.description
    })),
    timestamp: Date.now()
  }));
}

// ============ 任务相关处理函数 ============

/**
 * 创建任务
 */
function handleCreateTask(ws, msg) {
  const { creatorId, title, description, reward, deadline, tags } = msg;
  
  const task = TaskStore.createTask(creatorId, {
    title,
    description,
    reward,
    deadline,
    tags
  });
  
  ws.send(JSON.stringify({
    type: 'TASK_CREATED',
    task: {
      taskId: task.taskId,
      title: task.title,
      status: task.status,
      createdAt: task.createdAt
    },
    timestamp: Date.now()
  }));
  
  // 广播有新任务
  broadcast({
    type: 'NEW_TASK',
    task: {
      taskId: task.taskId,
      title: task.title,
      creator: task.creator,
      reward: task.reward,
      tags: task.tags
    },
    timestamp: Date.now()
  }, creatorId);
  
  const creatorProfile = AgentStore.getAgent(creatorId);
  console.log(`📋 新任�? ${task.title} (by ${creatorProfile?.name || creatorId.slice(0, 6)})`);
}

/**
 * 获取任务详情
 */
function handleGetTask(ws, msg) {
  const { taskId } = msg;
  
  const task = TaskStore.getTask(taskId);
  
  if (!task) {
    ws.send(JSON.stringify({
      type: 'ERROR',
      error: `任务不存�? ${taskId}`,
      timestamp: Date.now()
    }));
    return;
  }
  
  ws.send(JSON.stringify({
    type: 'TASK',
    task: task,
    timestamp: Date.now()
  }));
}

/**
 * 列出任务
 */
function handleListTasks(ws, msg) {
  const { status, creator, assignee, tag, limit, offset } = msg || {};
  
  const result = TaskStore.listTasks({
    status,
    creator,
    assignee,
    tag,
    limit: limit || 50,
    offset: offset || 0
  });
  
  ws.send(JSON.stringify({
    type: 'TASK_LIST',
    total: result.total,
    count: result.count,
    tasks: result.tasks,
    timestamp: Date.now()
  }));
}

/**
 * 申请任务
 */
function handleApplyTask(ws, msg) {
  const { taskId, agentId } = msg;
  
  const result = TaskStore.applyForTask(taskId, agentId);
  
  if (!result.success) {
    ws.send(JSON.stringify({
      type: 'ERROR',
      error: result.error,
      timestamp: Date.now()
    }));
    return;
  }
  
  ws.send(JSON.stringify({
    type: 'TASK_APPLIED',
    taskId: taskId,
    timestamp: Date.now()
  }));
  
  // 通知任务创建�?  const task = result.task;
  const creatorWs = agents.get(task.creator)?.ws;
  if (creatorWs) {
    const applicantProfile = AgentStore.getAgent(agentId);
    creatorWs.send(JSON.stringify({
      type: 'TASK_APPLICATION',
      taskId: taskId,
      applicant: {
        agentId: agentId,
        name: applicantProfile?.name || '匿名'
      },
      timestamp: Date.now()
    }));
  }
  
  console.log(`📨 任务申请: ${task.title}`);
}

/**
 * 直接接受任务（先到先得）
 */
function handleAcceptTask(ws, msg) {
  const { taskId, agentId } = msg;
  
  const result = TaskStore.acceptTask(taskId, agentId);
  
  if (!result.success) {
    ws.send(JSON.stringify({
      type: 'ERROR',
      error: result.error,
      timestamp: Date.now()
    }));
    return;
  }
  
  ws.send(JSON.stringify({
    type: 'TASK_ACCEPTED',
    task: result.task,
    timestamp: Date.now()
  }));
  
  const assigneeProfile = AgentStore.getAgent(agentId);
  console.log(`�?任务接受: ${result.task.title} (by ${assigneeProfile?.name})`);
}

/**
 * 接受申请�? */
function handleAcceptApplicant(ws, msg) {
  const { taskId, creatorId, assigneeId } = msg;
  
  const result = TaskStore.acceptApplicant(taskId, creatorId, assigneeId);
  
  if (!result.success) {
    ws.send(JSON.stringify({
      type: 'ERROR',
      error: result.error,
      timestamp: Date.now()
    }));
    return;
  }
  
  ws.send(JSON.stringify({
    type: 'TASK_ACCEPTED',
    task: result.task,
    timestamp: Date.now()
  }));
  
  // 通知被选中的执行�?  const assigneeWs = agents.get(assigneeId)?.ws;
  if (assigneeWs) {
    assigneeWs.send(JSON.stringify({
      type: 'TASK_ASSIGNED',
      taskId: taskId,
      task: result.task,
      timestamp: Date.now()
    }));
  }
  
  const assigneeProfile = AgentStore.getAgent(assigneeId);
  console.log(`�?任务指派: ${result.task.title} �?${assigneeProfile?.name}`);
}

/**
 * 完成任务
 */
function handleCompleteTask(ws, msg) {
  const { taskId, agentId } = msg;
  
  const result = TaskStore.completeTask(taskId, agentId);
  
  if (!result.success) {
    ws.send(JSON.stringify({
      type: 'ERROR',
      error: result.error,
      timestamp: Date.now()
    }));
    return;
  }
  
  ws.send(JSON.stringify({
    type: 'TASK_COMPLETED',
    task: result.task,
    timestamp: Date.now()
  }));
  
  // 更新执行者统�?  if (result.task.assignee) {
    AgentStore.incrementStat(result.task.assignee, 'tasksCompleted', 1);
  }
  
  console.log(`🎉 任务完成: ${result.task.title}`);
}

/**
 * 取消任务
 */
function handleCancelTask(ws, msg) {
  const { taskId, agentId } = msg;
  
  const result = TaskStore.cancelTask(taskId, agentId);
  
  if (!result.success) {
    ws.send(JSON.stringify({
      type: 'ERROR',
      error: result.error,
      timestamp: Date.now()
    }));
    return;
  }
  
  ws.send(JSON.stringify({
    type: 'TASK_CANCELLED',
    taskId: taskId,
    timestamp: Date.now()
  }));
  
  console.log(`�?任务取消: ${result.task.title}`);
}

/**
 * 搜索任务
 */
function handleSearchTasks(ws, msg) {
  const { query, limit } = msg;
  
  const results = TaskStore.searchTasks(query);
  const limited = results.slice(0, limit || 20);
  
  ws.send(JSON.stringify({
    type: 'TASK_SEARCH_RESULTS',
    query: query,
    count: limited.length,
    total: results.length,
    results: limited,
    timestamp: Date.now()
  }));
}

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\n🏙�?智体城正在关�?..');
  wss.close(() => {
    console.log('👋 再见�?);
    process.exit(0);
  });
});

