/**
 * Agent City - Message Service MVP
 */

const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');
const AgentStore = require('./agent-store');
const TaskStore = require('./task-store');

const PORT = process.env.PORT || 9876;

// Store all connected agents (online status)
const agents = new Map(); // agentId -> { ws, lastSeen }

// Track 3D world client connection
let worldClientWs = null; // The 3D world client WebSocket

// Create WebSocket Server
const wss = new WebSocket.Server({ port: PORT });

console.log(`Agent City server starting on port ${PORT}`);
console.log(`WebSocket: ws://localhost:${PORT}`);

wss.on('connection', (ws) => {
  let currentAgentId = null;

  console.log('New connection established');

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString());
      handleMessage(ws, msg, (agentId) => { currentAgentId = agentId; });
    } catch (err) {
      ws.send(JSON.stringify({
        type: 'ERROR',
        error: 'Invalid JSON format',
        timestamp: Date.now()
      }));
    }
  });

  ws.on('close', () => {
    // Check if this was the 3D world client
    if (ws === worldClientWs) {
      worldClientWs = null;
      console.log('🔌 3D World client disconnected');
    }
    
    if (currentAgentId && agents.has(currentAgentId)) {
      agents.delete(currentAgentId);
      console.log(`Agent offline: ${currentAgentId}`);
      broadcast({
        type: 'AGENT_OFFLINE',
        agentId: currentAgentId,
        timestamp: Date.now()
      }, currentAgentId);
    }
  });

  ws.on('error', (err) => {
    console.error('WebSocket error:', err.message);
  });
});

/**
 * Handle incoming messages
 */
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
      
    case 'MOVE_TO':
      handleMoveTo(ws, msg);
      break;
      
    case 'VISION_REQUEST':
      handleVisionRequest(ws, msg);
      break;
      
    case 'VISION_RESPONSE':
      handleVisionResponse(ws, msg);
      break;
      
    // Task related
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
        error: `Unknown message type: ${type}`,
        timestamp: Date.now()
      }));
  }
}

/**
 * Handle agent registration
 */
function handleRegister(ws, msg, setAgentId) {
  const { agentId, name, tags, description, visual } = msg;

  const id = agentId || uuidv4();

  // Persist agent profile
  const profile = AgentStore.upsertAgent(id, {
    name: name || `Agent#${id.slice(0, 6)}`,
    tags: tags || [], visual: visual || { color: '#FF6B6B', size: 1.0, emoji: '🦐', modelType: 'crayfish' },
    description: description || ''
  });

  // Store connection state
  agents.set(id, {
    ws,
    lastSeen: Date.now()
  });

  setAgentId(id);

  console.log(`Agent online: ${id} (${profile.name})`);
  
  // Check if this is the 3D world client
  if (profile.name && profile.name.includes('3D观察者') || 
      (profile.tags && profile.tags.includes('3d-world'))) {
    worldClientWs = ws;
    console.log('🔌 3D World client registered');
  }

  ws.send(JSON.stringify({
    type: 'REGISTERED',
    agentId: id,
    profile: {
      name: profile.name,
      tags: profile.tags, visual: profile.visual,
      description: profile.description, visual: profile.visual,
      createdAt: profile.createdAt,
      stats: profile.stats
    },
    timestamp: Date.now()
  }));

  // Broadcast online notification
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
 * Handle P2P messages
 */
function handleMessageP2P(ws, msg) {
  const { from, to, content, contentType } = msg;

  // Check if target exists (online)
  if (!agents.has(to)) {
    ws.send(JSON.stringify({
      type: 'ERROR',
      error: `Target agent not online: ${to}`,
      timestamp: Date.now()
    }));
    return;
  }

  // Construct message
  const message = {
    type: 'MESSAGE',
    from,
    to,
    content,
    contentType: contentType || 'text',
    timestamp: Date.now(),
    messageId: uuidv4()
  };

  // Send to target
  const targetAgent = agents.get(to);
  targetAgent.ws.send(JSON.stringify(message));

  // Broadcast AGENT_THINKING to show thinking icon in 3D world
  const targetProfile = AgentStore.getAgent(to);
  broadcast({
    type: 'AGENT_THINKING',
    agentId: to,
    agentName: targetProfile ? targetProfile.name : to,
    timestamp: Date.now()
  });

  // Send confirmation
  ws.send(JSON.stringify({
    type: 'MESSAGE_SENT',
    messageId: message.messageId,
    to,
    timestamp: message.timestamp
  }));

  // Update sender stats
  AgentStore.incrementStat(from, 'messagesSent', 1);

  console.log(`Message from ${from} to ${to}: ${typeof content === 'string' ? content.slice(0, 50) : '[structured data]'}`);
}

/**
 * Handle broadcast messages
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
 * Handle list agents request
 */
function handleListAgents(ws) {
  const agentList = [];

  agents.forEach((data, id) => {
    const profile = AgentStore.getAgent(id);
    agentList.push({
      agentId: id,
      name: profile?.name || `Agent#${id.slice(0, 6)}`,
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
 * Broadcast message to all agents and observers (except sender)
 * Now also sends to non-agent connections (like world-window)
 */
function broadcast(message, excludeAgentId) {
  const messageStr = JSON.stringify(message);
  
  // Track sent WebSockets to avoid duplicate sending
  const sent = new Set();
  
  // Send to all registered agents
  agents.forEach((data, id) => {
    if (id !== excludeAgentId) {
      try {
        data.ws.send(messageStr);
        sent.add(data.ws);
      } catch (err) {
        // Ignore send failure
      }
    }
  });
  
  // Also send to all observer connections (wss.clients contains all WebSocket connections)
  wss.clients.forEach((ws) => {
    // Skip already sent (registered agents)
    if (!sent.has(ws) && ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(messageStr);
      } catch (err) {
        // Ignore send failure
      }
    }
  });
}

/**
 * Get agent profile
 */
function handleGetProfile(ws, msg) {
  const { agentId } = msg;
  
  const profile = AgentStore.getAgent(agentId);
  
  if (!profile) {
    ws.send(JSON.stringify({
      type: 'ERROR',
      error: `Agent not found: ${agentId}`,
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
 * Update agent profile
 */
function handleUpdateProfile(ws, msg) {
  const { agentId, updates } = msg;
  
  const profile = AgentStore.updateAgent(agentId, updates);
  
  if (!profile) {
    ws.send(JSON.stringify({
      type: 'ERROR',
      error: `Agent not found: ${agentId}`,
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
  
  console.log(`Profile updated: ${profile.name}`);
}

/**
 * Search agents
 */
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

// ============ Task-related handlers ============

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
  
  console.log(`New task: ${task.title}`);
}

function handleGetTask(ws, msg) {
  const { taskId } = msg;
  
  const task = TaskStore.getTask(taskId);
  
  if (!task) {
    ws.send(JSON.stringify({
      type: 'ERROR',
      error: `Task not found: ${taskId}`,
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
  
  console.log(`Task applied: ${result.task.title}`);
}

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
  
  console.log(`Task accepted: ${result.task.title}`);
}

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
  
  console.log(`Task assigned: ${result.task.title}`);
}

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
  
  console.log(`Task completed: ${result.task.title}`);
}

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
  
  console.log(`Task cancelled: ${result.task.title}`);
}

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

/**
 * Handle MOVE_TO command - agent wants to move to a position in 3D world
 */
function handleMoveTo(ws, msg) {
  const { x, z } = msg;
  
  // Find the agent by their WebSocket connection
  let agentId = null;
  for (const [id, agent] of agents) {
    if (agent.ws === ws) {
      agentId = id;
      break;
    }
  }
  
  if (!agentId) {
    ws.send(JSON.stringify({
      type: 'ERROR',
      error: 'Agent not registered',
      timestamp: Date.now()
    }));
    return;
  }
  
  // Validate coordinates
  if (typeof x !== 'number' || typeof z !== 'number' || isNaN(x) || isNaN(z)) {
    ws.send(JSON.stringify({
      type: 'ERROR',
      error: 'Invalid coordinates',
      timestamp: Date.now()
    }));
    return;
  }
  
  // Clamp to reasonable bounds (-50 to 50)
  const clampedX = Math.max(-50, Math.min(50, x));
  const clampedZ = Math.max(-50, Math.min(50, z));
  
  // Get agent profile for broadcasting
  const profile = AgentStore.getAgent(agentId);
  
  // Broadcast the movement to all clients (including 3D world observer)
  broadcast({
    type: 'AGENT_MOVE_TO',
    agentId: agentId,
    x: clampedX,
    z: clampedZ,
    timestamp: Date.now()
  }, agentId);
  
  console.log(`Agent ${agentId} (${profile?.name || 'unknown'}) moving to (${clampedX.toFixed(2)}, ${clampedZ.toFixed(2)})`);
  
  // Confirm to the agent
  ws.send(JSON.stringify({
    type: 'MOVE_TO_CONFIRMED',
    x: clampedX,
    z: clampedZ,
    timestamp: Date.now()
  }));
}

/**
 * Handle VISION_REQUEST - render first-person view from agent's position
 */
function handleVisionRequest(ws, msg) {
  const { agentId, x, z, direction, fov, range, requestId } = msg;
  
  // Find the requesting agent
  let requestingAgentId = null;
  for (const [id, agent] of agents) {
    if (agent.ws === ws) {
      requestingAgentId = id;
      break;
    }
  }
  
  if (!requestingAgentId) {
    ws.send(JSON.stringify({
      type: 'ERROR',
      error: 'Agent not registered',
      timestamp: Date.now()
    }));
    return;
  }
  
  // Check if 3D world is connected
  if (!worldClientWs || worldClientWs.readyState !== WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: 'VISION_RESPONSE',
      requestId: requestId,
      error: '3D world not connected',
      timestamp: Date.now()
    }));
    return;
  }
  
  // Validate parameters
  const renderX = (typeof x === 'number' && !isNaN(x)) ? x : 0;
  const renderZ = (typeof z === 'number' && !isNaN(z)) ? z : 0;
  const renderDir = (typeof direction === 'number') ? direction : 0;
  const renderFov = (typeof fov === 'number' && fov > 0 && fov <= 180) ? fov : 90;
  const renderRange = (typeof range === 'number' && range > 0) ? range : 50;
  const rid = requestId || uuidv4();
  
  console.log(`Vision request from ${requestingAgentId}: pos=(${renderX.toFixed(1)}, ${renderZ.toFixed(1)}) dir=${renderDir} fov=${renderFov} range=${renderRange}`);
  
  // Forward to 3D world client
  worldClientWs.send(JSON.stringify({
    type: 'RENDER_VISION',
    requestId: rid,
    agentId: requestingAgentId,
    x: renderX,
    z: renderZ,
    direction: renderDir,
    fov: renderFov,
    range: renderRange,
    timestamp: Date.now()
  }));
}

/**
 * Handle VISION_RESPONSE from 3D world - route to requesting agent
 */
function handleVisionResponse(ws, msg) {
  // Verify this is coming from the 3D world
  if (ws !== worldClientWs) {
    console.error('VISION_RESPONSE from unknown source');
    return;
  }
  
  const { requestId, imageData, width, height, objects, error } = msg;
  
  if (error) {
    console.error('Vision render error:', error);
  } else {
    console.log(`Vision rendered for request ${requestId}: ${width}x${height}`);
  }
  
  // Broadcast the vision response to all agents
  // The client will use requestId to match with the original request
  broadcast({
    type: 'VISION_RESPONSE',
    requestId: requestId,
    imageData: imageData,
    width: width,
    height: height,
    objects: objects || [],
    error: error,
    timestamp: Date.now()
  });
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down...');
  wss.close(() => {
    console.log('Goodbye');
    process.exit(0);
  });
});

module.exports = { wss, broadcast };
