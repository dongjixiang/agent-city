/**
 * 鏅轰綋鍩?- 娑堟伅鏈嶅姟 MVP
 *
 * 涓€涓瀬绠€鐨?WebSocket 娑堟伅鏈嶅姟鍣? * 璁╂櫤鑳戒綋涔嬮棿鍙互浜掔浉鍙戦€佹秷鎭? */

const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');
const AgentStore = require('./agent-store');
const TaskStore = require('./task-store');

const PORT = process.env.PORT || 9876;

// 瀛樺偍鎵€鏈夎繛鎺ョ殑鏅鸿兘浣擄紙鍦ㄧ嚎鐘舵€侊級
const agents = new Map(); // agentId -> { ws, lastSeen }

// 鍒涘缓 WebSocket 鏈嶅姟鍣?const wss = new WebSocket.Server({ port: PORT });

console.log(`馃彊锔?鏅轰綋鍩庢秷鎭湇鍔″惎鍔ㄥ湪绔彛 ${PORT}`);
console.log(`WebSocket: ws://localhost:${PORT}`);

/**
 * 娑堟伅绫诲瀷瀹氫箟
 *
 * REGISTER - 鏅鸿兘浣撴敞鍐岃韩浠? * MESSAGE - 鐐瑰鐐规秷鎭? * BROADCAST - 骞挎挱娑堟伅
 * LIST - 鍒楀嚭鍦ㄧ嚎鏅鸿兘浣? * PING - 蹇冭烦妫€娴? */

wss.on('connection', (ws) => {
  let currentAgentId = null;

  console.log('馃摫 鏂拌繛鎺ュ缓绔?);

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString());
      handleMessage(ws, msg, (agentId) => { currentAgentId = agentId; });
    } catch (err) {
      ws.send(JSON.stringify({
        type: 'ERROR',
        error: '鏃犳晥鐨?JSON 鏍煎紡',
        timestamp: Date.now()
      }));
    }
  });

  ws.on('close', () => {
    if (currentAgentId && agents.has(currentAgentId)) {
      agents.delete(currentAgentId);
      console.log(`馃憢 鏅鸿兘浣撶绾? ${currentAgentId}`);
      // 骞挎挱绂荤嚎閫氱煡
      broadcast({
        type: 'AGENT_OFFLINE',
        agentId: currentAgentId,
        timestamp: Date.now()
      }, currentAgentId);
    }
  });

  ws.on('error', (err) => {
    console.error('WebSocket 閿欒:', err.message);
  });
});

/**
 * 澶勭悊鏀跺埌鐨勬秷鎭? */
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
      
    // 浠诲姟鐩稿叧
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
        error: `鏈煡娑堟伅绫诲瀷: ${type}`,
        timestamp: Date.now()
      }));
  }
}

/**
 * 澶勭悊鏅鸿兘浣撴敞鍐? */
function handleRegister(ws, msg, setAgentId) {
  const { agentId, name, tags, description } = msg;

  // 濡傛灉娌℃湁鎻愪緵 agentId锛岀敓鎴愪竴涓?  const id = agentId || uuidv4();

  // 鎸佷箙鍖栨櫤鑳戒綋妗ｆ
  const profile = AgentStore.upsertAgent(id, {
    name: name || `榫欒櫨#${id.slice(0, 6)}`,
    tags: tags || [],
    description: description || ''
  });

  // 瀛樺偍杩炴帴鐘舵€?  agents.set(id, {
    ws,
    lastSeen: Date.now()
  });

  setAgentId(id);

  console.log(`馃 鏅鸿兘浣撲笂绾? ${id} (${profile.name})`);

  // 鍙戦€佹敞鍐屾垚鍔熷搷搴旓紙鍖呭惈瀹屾暣妗ｆ锛?  ws.send(JSON.stringify({
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

  // 骞挎挱涓婄嚎閫氱煡
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
 * 澶勭悊鐐瑰鐐规秷鎭? */
function handleMessageP2P(ws, msg) {
  const { from, to, content, contentType } = msg;

  // 妫€鏌ョ洰鏍囨槸鍚﹀瓨鍦紙鍦ㄧ嚎锛?  if (!agents.has(to)) {
    ws.send(JSON.stringify({
      type: 'ERROR',
      error: `鐩爣鏅鸿兘浣撲笉鍦ㄧ嚎: ${to}`,
      timestamp: Date.now()
    }));
    return;
  }

  // 鏋勯€犳秷鎭?  const message = {
    type: 'MESSAGE',
    from,
    to,
    content,
    contentType: contentType || 'text',
    timestamp: Date.now(),
    messageId: uuidv4()
  };

  // 鍙戦€佺粰鐩爣
  const targetAgent = agents.get(to);
  targetAgent.ws.send(JSON.stringify(message));

  // 鍙戦€佺‘璁ょ粰鍙戦€佽€?  ws.send(JSON.stringify({
    type: 'MESSAGE_SENT',
    messageId: message.messageId,
    to,
    timestamp: message.timestamp
  }));

  // 鏇存柊鍙戦€佽€呯粺璁?  AgentStore.incrementStat(from, 'messagesSent', 1);

  // 鑾峰彇鍙戦€佽€呭悕瀛楃敤浜庢棩蹇?  const senderProfile = AgentStore.getAgent(from);
  const senderName = senderProfile?.name || from.slice(0, 6);
  const targetProfile = AgentStore.getAgent(to);
  const targetName = targetProfile?.name || to.slice(0, 6);

  console.log(`馃挰 ${senderName} 鈫?${targetName}: ${typeof content === 'string' ? content.slice(0, 50) : '[缁撴瀯鍖栨暟鎹甝'}`);
}

/**
 * 澶勭悊骞挎挱娑堟伅
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
 * 澶勭悊鍒楀嚭鍦ㄧ嚎鏅鸿兘浣撹姹? */
function handleListAgents(ws) {
  const agentList = [];

  agents.forEach((data, id) => {
    // 浠庢寔涔呭寲瀛樺偍鑾峰彇瀹屾暣妗ｆ
    const profile = AgentStore.getAgent(id);
    agentList.push({
      agentId: id,
      name: profile?.name || `榫欒櫨#${id.slice(0, 6)}`,
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
 * 骞挎挱娑堟伅缁欐墍鏈夋櫤鑳戒綋锛堥櫎浜嗗彂閫佽€咃級
 */
function broadcast(message, excludeAgentId) {
  agents.forEach((data, id) => {
    if (id !== excludeAgentId) {
      try {
        data.ws.send(JSON.stringify(message));
      } catch (err) {
        // 蹇界暐鍙戦€佸け璐?      }
    }
  });
}

/**
 * 鑾峰彇鏅鸿兘浣撴。妗? */
function handleGetProfile(ws, msg) {
  const { agentId } = msg;
  
  const profile = AgentStore.getAgent(agentId);
  
  if (!profile) {
    ws.send(JSON.stringify({
      type: 'ERROR',
      error: `鏅鸿兘浣撲笉瀛樺湪: ${agentId}`,
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
 * 鏇存柊鏅鸿兘浣撴。妗? */
function handleUpdateProfile(ws, msg) {
  const { agentId, updates } = msg;
  
  const profile = AgentStore.updateAgent(agentId, updates);
  
  if (!profile) {
    ws.send(JSON.stringify({
      type: 'ERROR',
      error: `鏅鸿兘浣撲笉瀛樺湪: ${agentId}`,
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
  
  console.log(`馃摑 妗ｆ鏇存柊: ${profile.name}`);
}

/**
 * 鎼滅储鏅鸿兘浣? */
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

// ============ 浠诲姟鐩稿叧澶勭悊鍑芥暟 ============

/**
 * 鍒涘缓浠诲姟
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
  
  // 骞挎挱鏈夋柊浠诲姟
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
  console.log(`馃搵 鏂颁换鍔? ${task.title} (by ${creatorProfile?.name || creatorId.slice(0, 6)})`);
}

/**
 * 鑾峰彇浠诲姟璇︽儏
 */
function handleGetTask(ws, msg) {
  const { taskId } = msg;
  
  const task = TaskStore.getTask(taskId);
  
  if (!task) {
    ws.send(JSON.stringify({
      type: 'ERROR',
      error: `浠诲姟涓嶅瓨鍦? ${taskId}`,
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
 * 鍒楀嚭浠诲姟
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
 * 鐢宠浠诲姟
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
  
  // 閫氱煡浠诲姟鍒涘缓鑰?  const task = result.task;
  const creatorWs = agents.get(task.creator)?.ws;
  if (creatorWs) {
    const applicantProfile = AgentStore.getAgent(agentId);
    creatorWs.send(JSON.stringify({
      type: 'TASK_APPLICATION',
      taskId: taskId,
      applicant: {
        agentId: agentId,
        name: applicantProfile?.name || '鍖垮悕'
      },
      timestamp: Date.now()
    }));
  }
  
  console.log(`馃摠 浠诲姟鐢宠: ${task.title}`);
}

/**
 * 鐩存帴鎺ュ彈浠诲姟锛堝厛鍒板厛寰楋級
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
  console.log(`鉁?浠诲姟鎺ュ彈: ${result.task.title} (by ${assigneeProfile?.name})`);
}

/**
 * 鎺ュ彈鐢宠鑰? */
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
  
  // 閫氱煡琚€変腑鐨勬墽琛岃€?  const assigneeWs = agents.get(assigneeId)?.ws;
  if (assigneeWs) {
    assigneeWs.send(JSON.stringify({
      type: 'TASK_ASSIGNED',
      taskId: taskId,
      task: result.task,
      timestamp: Date.now()
    }));
  }
  
  const assigneeProfile = AgentStore.getAgent(assigneeId);
  console.log(`鉁?浠诲姟鎸囨淳: ${result.task.title} 鈫?${assigneeProfile?.name}`);
}

/**
 * 瀹屾垚浠诲姟
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
  
  // 鏇存柊鎵ц鑰呯粺璁?  if (result.task.assignee) {
    AgentStore.incrementStat(result.task.assignee, 'tasksCompleted', 1);
  }
  
  console.log(`馃帀 浠诲姟瀹屾垚: ${result.task.title}`);
}

/**
 * 鍙栨秷浠诲姟
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
  
  console.log(`鉂?浠诲姟鍙栨秷: ${result.task.title}`);
}

/**
 * 鎼滅储浠诲姟
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

// 浼橀泤鍏抽棴
process.on('SIGINT', () => {
  console.log('\n馃彊锔?鏅轰綋鍩庢鍦ㄥ叧闂?..');
  wss.close(() => {
    console.log('馃憢 鍐嶈锛?);
    process.exit(0);
  });
});
