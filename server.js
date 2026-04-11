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

// ============ 消息路由系统 - 用于AI回复正确路由 ============
const pendingMessages = new Map(); // messageId -> { ws, from, to, originalFrom, timestamp }

// ============ 对话状态系统 - 跟踪智能体是否在对话中 ============
const conversationStates = new Map(); // agentId -> { state: 'free'|'in_conversation', withAgent, startTime, messageId }
const CONVERSATION_TIMEOUT = 120000; // 2分钟后自动恢复自由活动

// 获取智能体对话状态
function getConversationState(agentId) {
    if (!conversationStates.has(agentId)) {
        conversationStates.set(agentId, { state: 'free', withAgent: null, startTime: null, messageId: null });
    }
    return conversationStates.get(agentId);
}

// 设置智能体进入对话状态
function setAgentInConversation(agentId, withAgent, messageId) {
    const state = getConversationState(agentId);
    state.state = 'in_conversation';
    state.withAgent = withAgent;
    state.startTime = Date.now();
    state.messageId = messageId;
    console.log(`💬 Agent ${agentId} entered conversation with ${withAgent}`);
    
    // 广播智能体进入对话状态到3D世界
    broadcast({
        type: 'AGENT_IN_CONVERSATION',
        agentId: agentId,
        withAgent: withAgent,
        timestamp: Date.now()
    }, null);
}

// 设置智能体恢复自由活动
function setAgentFree(agentId) {
    const state = getConversationState(agentId);
    if (state.state === 'in_conversation') {
        state.state = 'free';
        state.withAgent = null;
        state.startTime = null;
        state.messageId = null;
        console.log(`💬 Agent ${agentId} is now free`);
        
        // 广播智能体恢复自由活动到3D世界
        broadcast({
            type: 'AGENT_FREE',
            agentId: agentId,
            timestamp: Date.now()
        }, null);
    }
}

// 清理超时的对话状态
function cleanupConversationTimeout() {
    const now = Date.now();
    conversationStates.forEach((state, agentId) => {
        if (state.state === 'in_conversation' && state.startTime && (now - state.startTime) > CONVERSATION_TIMEOUT) {
            console.log(`💬 Conversation timeout for ${agentId}, setting free`);
            setAgentFree(agentId);
        }
    });
}

// 启动对话状态清理定时器
setInterval(cleanupConversationTimeout, 30000); // 每30秒检查一次

// ============ 智能体记忆系统 ============
const agentMemories = new Map(); // agentId -> { conversations, places, achievements, stats }

// 获取或创建智能体记忆
function getAgentMemory(agentId) {
    if (!agentMemories.has(agentId)) {
        agentMemories.set(agentId, {
            conversations: [],    // 对话记录
            places: [],          // 去过的地方
            achievements: [],     // 成就徽章
            stats: {
                messagesSent: 0,
                tasksCompleted: 0,
                placesVisited: 0,
                conversationsHad: 0
            },
            createdAt: Date.now(),
            lastActive: Date.now()
        });
    }
    const memory = agentMemories.get(agentId);
    memory.lastActive = Date.now();
    return memory;
}

// 添加对话到记忆
function addConversationToMemory(agentId, withAgent, content) {
    const memory = getAgentMemory(agentId);
    memory.conversations.push({
        with: withAgent,
        content: content,
        time: Date.now()
    });
    memory.stats.conversationsHad++;
    // 只保留最近20条对话
    if (memory.conversations.length > 20) {
        memory.conversations.shift();
    }
}

// 添加访问地点到记忆
function addPlaceToMemory(agentId, placeName, x, z) {
    const memory = getAgentMemory(agentId);
    const existing = memory.places.find(p => p.name === placeName);
    if (existing) {
        existing.visits++;
        existing.lastVisit = Date.now();
    } else {
        memory.places.push({
            name: placeName,
            x: x,
            z: z,
            visits: 1,
            firstVisit: Date.now(),
            lastVisit: Date.now()
        });
        memory.stats.placesVisited++;
    }
}

// 添加成就
function addAchievement(agentId, achievement) {
    const memory = getAgentMemory(agentId);
    if (!memory.achievements.includes(achievement)) {
        memory.achievements.push(achievement);
    }
}

// ============ 智能体协作系统 ============
const teams = new Map(); // teamId -> { id, name, leader, members: [{id, name, role}], currentTask, status, createdAt }
const teamInvitations = new Map(); // invitationId -> { fromId, fromName, toId, teamId, createdAt }
const MAX_TEAM_SIZE = 5;

function createTeam(leaderId, leaderName) {
    const teamId = 'team-' + uuidv4();
    const team = {
        id: teamId,
        name: `${leaderName}的队伍`,
        leader: leaderId,
        members: [{ id: leaderId, name: leaderName, role: 'leader' }],
        currentTask: null,
        status: 'idle',
        createdAt: Date.now()
    };
    teams.set(teamId, team);
    
    // Update agent's memory
    addAchievement(leaderId, 'team_leader');
    
    return team;
}

function inviteToTeam(inviterId, inviterName, invitedId) {
    // Check if inviter is already in a team
    const inviterTeam = findAgentTeam(inviterId);
    if (!inviterTeam) {
        return { error: 'You are not in a team' };
    }
    
    // Check if inviter is leader
    if (inviterTeam.leader !== inviterId) {
        return { error: 'Only team leader can invite' };
    }
    
    // Check team size
    if (inviterTeam.members.length >= MAX_TEAM_SIZE) {
        return { error: 'Team is full' };
    }
    
    // Check if invited is already in a team
    if (findAgentTeam(invitedId)) {
        return { error: 'Target is already in a team' };
    }
    
    // Create invitation
    const invitationId = 'inv-' + uuidv4();
    teamInvitations.set(invitationId, {
        id: invitationId,
        fromId: inviterId,
        fromName: inviterName,
        toId: invitedId,
        teamId: inviterTeam.id,
        createdAt: Date.now()
    });
    
    return { invitationId, teamId: inviterTeam.id, teamName: inviterTeam.name };
}

function acceptInvitation(invitationId, invitedId) {
    const invitation = teamInvitations.get(invitationId);
    if (!invitation) {
        return { error: 'Invitation not found' };
    }
    
    if (invitation.toId !== invitedId) {
        return { error: 'Invitation is not for you' };
    }
    
    const team = teams.get(invitation.teamId);
    if (!team) {
        return { error: 'Team not found' };
    }
    
    // Add member to team
    const profile = AgentStore.getAgent(invitedId);
    team.members.push({ id: invitedId, name: profile?.name || '未知', role: 'member' });
    
    // Remove invitation
    teamInvitations.delete(invitationId);
    
    // Notify all members
    team.members.forEach(member => {
        const agent = agents.get(member.id);
        if (agent && agent.ws && agent.ws.readyState === WebSocket.OPEN) {
            agent.ws.send(JSON.stringify({
                type: 'TEAM_UPDATE',
                team: team,
                timestamp: Date.now()
            }));
        }
    });
    
    // Add achievement
    addAchievement(invitedId, 'team_player');
    
    return { team };
}

function declineInvitation(invitationId, invitedId) {
    const invitation = teamInvitations.get(invitationId);
    if (!invitation || invitation.toId !== invitedId) {
        return { error: 'Invitation not found' };
    }
    
    teamInvitations.delete(invitationId);
    
    // Notify inviter
    const inviter = agents.get(invitation.fromId);
    if (inviter && inviter.ws && inviter.ws.readyState === WebSocket.OPEN) {
        inviter.ws.send(JSON.stringify({
            type: 'TEAM_INVITATION_DECLINED',
            by: invitedId,
            timestamp: Date.now()
        }));
    }
    
    return { success: true };
}

function leaveTeam(agentId) {
    const team = findAgentTeam(agentId);
    if (!team) {
        return { error: 'Not in a team' };
    }
    
    // If leader leaves and has members, promote first member to leader
    if (team.leader === agentId && team.members.length > 1) {
        const newLeader = team.members.find(m => m.id !== agentId);
        if (newLeader) {
            team.leader = newLeader.id;
            newLeader.role = 'leader';
            team.name = `${newLeader.name}的队伍`;
        }
    }
    
    // Remove from members
    team.members = team.members.filter(m => m.id !== agentId);
    
    // If no members left, delete team
    if (team.members.length === 0) {
        teams.delete(team.id);
    }
    
    // Notify agent
    return { success: true, teamId: team?.id };
}

function findAgentTeam(agentId) {
    for (const team of teams.values()) {
        if (team.members.find(m => m.id === agentId)) {
            return team;
        }
    }
    return null;
}

function assignTaskToTeam(teamId, taskId) {
    const team = teams.get(teamId);
    if (!team) return { error: 'Team not found' };
    
    team.currentTask = taskId;
    team.status = 'working';
    
    // Notify all members
    team.members.forEach(member => {
        const agent = agents.get(member.id);
        if (agent && agent.ws && agent.ws.readyState === WebSocket.OPEN) {
            agent.ws.send(JSON.stringify({
                type: 'TEAM_TASK_ASSIGNED',
                taskId: taskId,
                timestamp: Date.now()
            }));
        }
    });
    
    return { success: true };
}

function completeTeamTask(teamId) {
    const team = teams.get(teamId);
    if (!team) return { error: 'Team not found' };
    
    team.currentTask = null;
    team.status = 'idle';
    
    // Award all members
    team.members.forEach(member => {
        addAchievement(member.id, 'task_completed');
    });
    
    // Notify all members
    team.members.forEach(member => {
        const agent = agents.get(member.id);
        if (agent && agent.ws && agent.ws.readyState === WebSocket.OPEN) {
            agent.ws.send(JSON.stringify({
                type: 'TEAM_TASK_COMPLETED',
                timestamp: Date.now()
            }));
        }
    });
    
    return { success: true };
}

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
      
      // Notify friends before going offline
      const friends = getFriends(currentAgentId);
      friends.forEach(friendId => {
        const friendAgent = agents.get(friendId);
        if (friendAgent && friendAgent.ws && friendAgent.ws.readyState === WebSocket.OPEN) {
          friendAgent.ws.send(JSON.stringify({
            type: 'FRIEND_OFFLINE',
            friendId: currentAgentId,
            timestamp: Date.now()
          }));
        }
      });
      
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
      // 检查是否是AI智能体发送的回复（回复用户）
      // AI agent的ID列表 - 这些是AI控制的智能体
      const msgFrom = msg.from || '';
      const msgTo = msg.to || '';
      // Get isAI flag from agent profile instead of hardcoded list
      const fromProfile = AgentStore.getAgent(msgFrom);
      const isAI = fromProfile && fromProfile.isAI;
      
      // 如果消息有 replyTo 字段，说明是回复，可以是AI回复或用户回复
      // 如果是发送给AI agent的消息（to是AI），那是用户发起的
      // 如果是AI agent发送的消息（from是AI），那是AI回复
      const isAIResponse = (msg.replyTo && isAI);
      
      if (isAIResponse) {
        // 这是AI智能体回复用户的消息
        handleAIResponse(ws, msg);
      } else if (isAI) {
        // AI发送的普通消息（不带replyTo），当作普通P2P消息处理
        handleMessageP2P(ws, msg);
      } else {
        // 用户发给AI的消息
        handleMessageP2P(ws, msg);
      }
      break;
      
    case 'BROADCAST':
      // 检查是否是AI智能体发送的广播（AI回复）
      const broadcastFrom = msg.from || '';
      const knownAIBroadcastAgents = ['xiaoji-agent', 'xiaoxiang-agent', 'openclaw-ai-assistant', 'openclaw', 'assistant', 'bot', 'ai-'];
      const isAIBroadcast = knownAIBroadcastAgents.some(ai => broadcastFrom.includes(ai));
      
      if (isAIBroadcast && msg.content) {
        // AI发送的广播（回复），需要广播AGENT_RESPONSE_COMPLETE
        console.log(`[AI Broadcast] From: ${broadcastFrom}, Content: ${msg.content?.substring(0, 50)}`);
        
        // 广播AI智能体结束思考状态
        broadcast({
          type: 'AGENT_RESPONSE_COMPLETE',
          agentId: broadcastFrom,
          agentName: AgentStore.getAgent(broadcastFrom)?.name || broadcastFrom,
          content: msg.content,
          timestamp: Date.now()
        }, null);
        
        // 设置AI智能体恢复自由活动
        setAgentFree(broadcastFrom);
      }
      
      handleBroadcast(ws, msg);
      break;
      
    case 'THOUGHT':
      // 智能体思考 - 显示在头顶，不影响其他行为
      const thoughtFrom = msg.from || '';
      const thoughtContent = msg.content || '';
      
      console.log(`[Thought] ${thoughtFrom}: ${thoughtContent.substring(0, 50)}`);
      
      // 广播思考内容给所有客户端（3D世界会显示在头顶）
      broadcast({
        type: 'AGENT_THOUGHT',
        agentId: thoughtFrom,
        agentName: AgentStore.getAgent(thoughtFrom)?.name || thoughtFrom,
        content: thoughtContent,
        timestamp: Date.now()
      }, null);
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
      
    case 'RADAR_REQUEST':
      handleRadarRequest(ws, msg);
      break;
      
    case 'DIALOGUE_START':
      handleDialogueStart(ws, msg);
      break;
      
    case 'DIALOGUE_REPLY':
      handleDialogueReply(ws, msg);
      break;
      
    case 'DIALOGUE_END':
      handleDialogueEnd(ws, msg);
      break;
      
    case 'GET_MEMORY':
      handleGetMemory(ws, msg);
      break;
      
    case 'VISIT_PLACE':
      handleVisitPlace(ws, msg);
      break;
      
    case 'WEATHER_CHANGE':
      // 天气变化事件，通知所有在线智能体
      console.log(`[Weather] ${msg.weather} (${msg.from})`);
      // 广播天气变化到所有客户端
      broadcast({
        type: 'WEATHER_CHANGE',
        weather: msg.weather,
        from: msg.from || 'system',
        timestamp: Date.now()
      }, null);
      break;
      
    // Team related
    case 'CREATE_TEAM':
      handleCreateTeam(ws, msg);
      break;
      
    case 'TEAM_INVITE':
      handleTeamInvite(ws, msg);
      break;
      
    case 'TEAM_ACCEPT':
      handleTeamAccept(ws, msg);
      break;
      
    case 'TEAM_DECLINE':
      handleTeamDecline(ws, msg);
      break;
      
    case 'TEAM_LEAVE':
      handleTeamLeave(ws, msg);
      break;
      
    case 'TEAM_STATUS':
      handleTeamStatus(ws, msg);
      break;
      
    case 'TEAM_CHAT':
      handleTeamChat(ws, msg);
      break;
      
    // Voice related
    case 'VOICE_MESSAGE':
      handleVoiceMessage(ws, msg);
      break;
      
    // Social network related
    case 'ADD_FRIEND':
      handleAddFriend(ws, msg);
      break;
      
    case 'ACCEPT_FRIEND':
      handleAcceptFriend(ws, msg);
      break;
      
    case 'DECLINE_FRIEND':
      handleDeclineFriend(ws, msg);
      break;
      
    case 'FOLLOW':
      handleFollow(ws, msg);
      break;
      
    case 'UNFOLLOW':
      handleUnfollow(ws, msg);
      break;
      
    case 'GET_FRIENDS':
      handleGetFriends(ws, msg);
      break;
      
    case 'GET_FOLLOWING':
      handleGetFollowing(ws, msg);
      break;
      
    case 'GET_PENDING_REQUESTS':
      handleGetPendingRequests(ws, msg);
      break;
      
    // Learning related
    case 'RATE_BEHAVIOR':
      handleRateBehavior(ws, msg);
      break;
      
    case 'GET_LEARNING':
      handleGetLearning(ws, msg);
      break;
      
    // Action related (for 3D world animations)
    case 'DO_ACTION':
      handleDoAction(ws, msg);
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
  // Determine if this agent is AI-controlled based on tags
  const isAI = tags && (tags.includes('ai') || tags.includes('assistant') || tags.includes('openclaw'));
  console.log(`Agent ${name} registered, isAI: ${isAI}`);

  const profile = AgentStore.upsertAgent(id, {
    name: name || `Agent#${id.slice(0, 6)}`,
    tags: tags || [], visual: visual || { color: '#FF6B6B', size: 1.0, emoji: '🦐', modelType: 'crayfish' },
    description: description || ''
    isAI: isAI
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
  
  // Notify friends that this agent came online
  const friends = getFriends(id);
  friends.forEach(friendId => {
    const friendAgent = agents.get(friendId);
    if (friendAgent && friendAgent.ws && friendAgent.ws.readyState === WebSocket.OPEN) {
      friendAgent.ws.send(JSON.stringify({
        type: 'FRIEND_ONLINE',
        friendId: id,
        friendName: profile.name,
        timestamp: Date.now()
      }));
    }
  });
}

/**
 * 处理来自AI智能体的消息回复 - 正确路由回原始发送者
 */

// 解析AI回复中的坐标
function parseCoordinatesFromContent(content) {
  if (!content) return null;
  
  // 地标名称到坐标的映射
  const landmarks = {
    '喷泉': { x: 0, z: 0 },
    '任务中心': { x: 15, z: 0 },
    '声誉塔': { x: -15, z: 0 },
    '交易中心': { x: 0, z: 15 },
    '档案馆': { x: -15, z: -15 },
    '消息站': { x: 15, z: -15 },
    '数据中心': { x: -15, z: 15 },
    '创意工坊': { x: 15, z: 15 },
    '社交广场': { x: 0, z: -10 },
    '湖边': { x: 20, z: 5 },
    '入口': { x: 0, z: 35 }
  };
  
  // 尝试匹配 "去 (x, z)" 或 "移动到 x, z" 格式
  const coordMatch = content.match(/[去移动到]\s*\(?\s*(-?\d+\.?\d*)\s*[,，]\s*(-?\d+\.?\d*)\s*\)?/);
  if (coordMatch) {
    return { x: parseFloat(coordMatch[1]), z: parseFloat(coordMatch[2]) };
  }
  
  // 尝试匹配地标名称
  for (const [name, pos] of Object.entries(landmarks)) {
    if (content.includes(name)) {
      return pos;
    }
  }
  
  return null;
}

function handleAIResponse(ws, msg) {
  const { from, to, content, contentType, messageId, replyTo } = msg;
  const fromName = AgentStore.getAgent(from)?.name || from;
  
  console.log(`[AI Response] From: ${fromName}, Content: ${content?.substring(0, 50)}`);
  
  // 优先使用 replyTo 字段查找原始消息
  let originalMsg = null;
  let originalMsgId = replyTo || messageId;
  
  if (originalMsgId && pendingMessages.has(originalMsgId)) {
    originalMsg = pendingMessages.get(originalMsgId);
    pendingMessages.delete(originalMsgId);
    console.log(`[AI Response] Found pending message ${originalMsgId}, routing to: ${originalMsg.from}`);
  }
  
  if (originalMsg && originalMsg.ws && originalMsg.ws.readyState === WebSocket.OPEN) {
    // 路由回复到原始发送者
    originalMsg.ws.send(JSON.stringify({
      type: 'MESSAGE',
      from: from,
      fromName: fromName,
      content: content,
      contentType: contentType || 'text',
      timestamp: Date.now()
    }));
    console.log(`[AI Response] Routed to original sender: ${originalMsg.from}`);
  } else {
    // 如果找不到原始发送者，广播给所有客户端
    console.log(`[AI Response] Cannot find original sender, broadcasting`);
    broadcast({
      type: 'MESSAGE',
      from: from,
      fromName: fromName,
      content: content,
      contentType: contentType || 'text',
      timestamp: Date.now()
    }, null);
  }
  
  // 设置AI智能体恢复自由活动
  setAgentFree(from);
  
  // 解析AI回复中的坐标
  const coords = parseCoordinatesFromContent(content);
  
  // 广播AI智能体结束思考状态
  broadcast({
    type: 'AGENT_RESPONSE_COMPLETE',
    agentId: from,
    agentName: fromName,
    content: content,
    x: coords ? coords.x : undefined,
    z: coords ? coords.z : undefined,
    timestamp: Date.now()
  }, null);
  
  // 如果有坐标，打印移动信息
  if (coords) {
    console.log(`[AI Response] Movement detected: (${coords.x}, ${coords.z})`);
  }
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
  const messageId = uuidv4();
  const message = {
    type: 'MESSAGE',
    from,
    to,
    content,
    contentType: contentType || 'text',
    timestamp: Date.now(),
    messageId: messageId
  };

  // 保存待处理消息，用于路由AI回复
  pendingMessages.set(messageId, { 
    ws: ws,           // 发送者的WebSocket，用于回复路由
    from: from,       // 原始发送者
    to: to,           // 接收者（AI智能体）
    timestamp: Date.now()
  });
  
  // 设置目标智能体进入对话状态
  setAgentInConversation(to, from, messageId);

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
    messageId: messageId,
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

/**
 * Handle RADAR_REQUEST - return structured data about surroundings
 * This doesn't need 3D world rendering, just calculate from positions
 */
function handleRadarRequest(ws, msg) {
  const { x, z, direction, range, requestId } = msg;
  
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
  
  // Validate parameters
  const radarX = (typeof x === 'number' && !isNaN(x)) ? x : 0;
  const radarZ = (typeof z === 'number' && !isNaN(z)) ? z : 0;
  const radarDir = (typeof direction === 'number') ? direction : 0;
  const radarRange = (typeof range === 'number' && range > 0 && range <= 100) ? range : 30;
  const rid = requestId || uuidv4();
  
  console.log(`Radar request from ${requestingAgentId}: pos=(${radarX.toFixed(1)}, ${radarZ.toFixed(1)}) dir=${radarDir} range=${radarRange}`);
  
  // Get all agents and calculate their positions relative to radar
  const objects = [];
  
  agents.forEach((agentData, agentId) => {
    if (agentId === requestingAgentId) return; // Skip self
    
    // Get agent position - we need to get this from the world state
    // For now, we'll use a simplified approach - check if agent profile has last known position
    // In a full implementation, this would query the 3D world or maintain agent positions server-side
    
    // We'll broadcast to 3D world to get positions
    if (worldClientWs && worldClientWs.readyState === WebSocket.OPEN) {
      worldClientWs.send(JSON.stringify({
        type: 'RADAR_QUERY',
        requestId: rid,
        agentId: requestingAgentId,
        x: radarX,
        z: radarZ,
        direction: radarDir,
        range: radarRange,
        timestamp: Date.now()
      }));
    } else {
      // No 3D world connected - return empty or error
      ws.send(JSON.stringify({
        type: 'RADAR_RESPONSE',
        requestId: rid,
        error: '3D world not connected',
        objects: [],
        timestamp: Date.now()
      }));
    }
  });
}

/**
 * Handle DIALOGUE_START - one agent initiates conversation with another
 */
function handleDialogueStart(ws, msg) {
  const { to, content } = msg;
  
  // Find requesting agent
  let fromAgentId = null;
  let fromAgentName = null;
  for (const [id, agent] of agents) {
    if (agent.ws === ws) {
      fromAgentId = id;
      const profile = AgentStore.getAgent(id);
      fromAgentName = profile?.name || '未知';
      break;
    }
  }
  
  if (!fromAgentId) {
    ws.send(JSON.stringify({
      type: 'ERROR',
      error: 'Agent not registered',
      timestamp: Date.now()
    }));
    return;
  }
  
  if (!to || !content) {
    ws.send(JSON.stringify({
      type: 'ERROR',
      error: 'Missing recipient or content',
      timestamp: Date.now()
    }));
    return;
  }
  
  // Check if target agent is online
  if (!agents.has(to)) {
    ws.send(JSON.stringify({
      type: 'DIALOGUE_ERROR',
      error: 'Target agent is not online',
      timestamp: Date.now()
    }));
    return;
  }
  
  const targetAgent = agents.get(to);
  
  console.log(`Dialogue: ${fromAgentName} -> ${to}: ${content}`);
  
  // Send to target agent
  if (targetAgent.ws && targetAgent.ws.readyState === WebSocket.OPEN) {
    targetAgent.ws.send(JSON.stringify({
      type: 'DIALOGUE_INCOMING',
      from: fromAgentId,
      fromName: fromAgentName,
      content: content,
      timestamp: Date.now()
    }));
  }
  
  // Confirm to sender
  ws.send(JSON.stringify({
    type: 'DIALOGUE_CONFIRMED',
    to: to,
    content: content,
    timestamp: Date.now()
  }));
  
  // Save to memory - both agents remember this conversation
  addConversationToMemory(fromAgentId, to, content);
  
  // Get target's name for memory
  const targetProfile = AgentStore.getAgent(to);
  const targetName = targetProfile?.name || '未知';
  addConversationToMemory(to, fromAgentId, content);
  
  // Check for first conversation achievement
  const fromMemory = agentMemories.get(fromAgentId);
  if (fromMemory.conversations.length === 1) {
    addAchievement(fromAgentId, 'social_butterfly');
  }
  
  // Also broadcast to 3D world to show bubble
  if (worldClientWs && worldClientWs.readyState === WebSocket.OPEN) {
    worldClientWs.send(JSON.stringify({
      type: 'DIALOGUE_SHOW',
      fromAgentId: fromAgentId,
      fromAgentName: fromAgentName,
      toAgentId: to,
      content: content,
      timestamp: Date.now()
    }));
  }
}

/**
 * Handle DIALOGUE_REPLY - agent replies to dialogue
 */
function handleDialogueReply(ws, msg) {
  const { to, content } = msg;
  
  // Find replying agent
  let fromAgentId = null;
  let fromAgentName = null;
  for (const [id, agent] of agents) {
    if (agent.ws === ws) {
      fromAgentId = id;
      const profile = AgentStore.getAgent(id);
      fromAgentName = profile?.name || '未知';
      break;
    }
  }
  
  if (!fromAgentId) return;
  if (!to || !content) return;
  
  // Send to target
  const targetAgent = agents.get(to);
  if (targetAgent && targetAgent.ws && targetAgent.ws.readyState === WebSocket.OPEN) {
    targetAgent.ws.send(JSON.stringify({
      type: 'DIALOGUE_REPLY',
      from: fromAgentId,
      fromName: fromAgentName,
      content: content,
      timestamp: Date.now()
    }));
  }
  
  // Broadcast to 3D world
  if (worldClientWs && worldClientWs.readyState === WebSocket.OPEN) {
    worldClientWs.send(JSON.stringify({
      type: 'DIALOGUE_SHOW',
      fromAgentId: fromAgentId,
      fromAgentName: fromAgentName,
      toAgentId: to,
      content: content,
      timestamp: Date.now()
    }));
  }
}

/**
 * Handle DIALOGUE_END - end a conversation
 */
function handleDialogueEnd(ws, msg) {
  // Just broadcast that dialogue ended
  if (worldClientWs && worldClientWs.readyState === WebSocket.OPEN) {
    let agentId = null;
    for (const [id, agent] of agents) {
      if (agent.ws === ws) {
        agentId = id;
        break;
      }
    }
    
    if (agentId) {
      worldClientWs.send(JSON.stringify({
        type: 'DIALOGUE_END',
        agentId: agentId,
        timestamp: Date.now()
      }));
    }
  }
}

/**
 * Handle DO_ACTION - trigger an action/animation for an agent (e.g., jump)
 */
function handleDoAction(ws, msg) {
  const { agentId, action, duration } = msg;
  
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
  
  if (!agentId || !action) {
    ws.send(JSON.stringify({
      type: 'ERROR',
      error: 'Missing agentId or action',
      timestamp: Date.now()
    }));
    return;
  }
  
  // Broadcast the action to all clients (including 3D world)
  broadcast({
    type: 'DO_ACTION',
    agentId: agentId,
    action: action,
    duration: duration || 1000,
    timestamp: Date.now()
  }, requestingAgentId);
  
  console.log(`Action: ${requestingAgentId} triggered ${action} for ${agentId}`);
  
  ws.send(JSON.stringify({
    type: 'ACTION_TRIGGERED',
    agentId: agentId,
    action: action,
    timestamp: Date.now()
  }));
}

/**
 * Handle GET_MEMORY - retrieve agent's memory
 */
function handleGetMemory(ws, msg) {
  const { agentId } = msg;
  
  // Find requesting agent
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
  
  // If agentId is specified, get that agent's memory (only if it's self)
  // Otherwise get own memory
  const targetId = (agentId && agentId === requestingAgentId) ? agentId : requestingAgentId;
  const memory = getAgentMemory(targetId);
  
  ws.send(JSON.stringify({
    type: 'MEMORY',
    agentId: targetId,
    memory: memory,
    timestamp: Date.now()
  }));
}

/**
 * Handle VISIT_PLACE - record agent visiting a place
 */
function handleVisitPlace(ws, msg) {
  const { placeName, x, z } = msg;
  
  // Find agent
  let agentId = null;
  for (const [id, agent] of agents) {
    if (agent.ws === ws) {
      agentId = id;
      break;
    }
  }
  
  if (!agentId) return;
  
  // Record the visit
  addPlaceToMemory(agentId, placeName, x, z);
  
  // Check for first visit achievement
  const memory = agentMemories.get(agentId);
  if (memory.places.length === 1) {
    addAchievement(agentId, 'explorer');
  }
  
  // Confirm to agent
  ws.send(JSON.stringify({
    type: 'VISIT_CONFIRMED',
    placeName: placeName,
    visits: memory.places.find(p => p.name === placeName)?.visits || 1,
    timestamp: Date.now()
  }));
  
  // Broadcast to 3D world to show achievement
  if (worldClientWs && worldClientWs.readyState === WebSocket.OPEN) {
    worldClientWs.send(JSON.stringify({
      type: 'AGENT_ACHIEVEMENT',
      agentId: agentId,
      achievement: 'visited_' + placeName,
      placeName: placeName,
      timestamp: Date.now()
    }));
  }
  
  console.log(`Agent ${agentId} visited ${placeName}`);
}

// ============ 队伍消息处理函数 ============

function handleCreateTeam(ws, msg) {
  let agentId = null;
  let agentName = null;
  for (const [id, agent] of agents) {
    if (agent.ws === ws) {
      agentId = id;
      const profile = AgentStore.getAgent(id);
      agentName = profile?.name || '未知';
      break;
    }
  }
  
  if (!agentId) {
    ws.send(JSON.stringify({ type: 'ERROR', error: 'Not registered' }));
    return;
  }
  
  // Check if already in a team
  if (findAgentTeam(agentId)) {
    ws.send(JSON.stringify({ type: 'ERROR', error: 'Already in a team' }));
    return;
  }
  
  const team = createTeam(agentId, agentName);
  
  ws.send(JSON.stringify({
    type: 'TEAM_CREATED',
    team: team,
    timestamp: Date.now()
  }));
}

function handleTeamInvite(ws, msg) {
  const { to } = msg;
  
  let agentId = null;
  let agentName = null;
  for (const [id, agent] of agents) {
    if (agent.ws === ws) {
      agentId = id;
      const profile = AgentStore.getAgent(id);
      agentName = profile?.name || '未知';
      break;
    }
  }
  
  if (!agentId) return;
  
  const result = inviteToTeam(agentId, agentName, to);
  
  if (result.error) {
    ws.send(JSON.stringify({ type: 'ERROR', error: result.error }));
    return;
  }
  
  // Send invitation to target
  const targetAgent = agents.get(to);
  if (targetAgent && targetAgent.ws && targetAgent.ws.readyState === WebSocket.OPEN) {
    targetAgent.ws.send(JSON.stringify({
      type: 'TEAM_INVITATION',
      from: agentId,
      fromName: agentName,
      invitationId: result.invitationId,
      teamId: result.teamId,
      teamName: result.teamName,
      timestamp: Date.now()
    }));
  }
  
  ws.send(JSON.stringify({
    type: 'TEAM_INVITE_SENT',
    invitationId: result.invitationId,
    to: to,
    timestamp: Date.now()
  }));
}

function handleTeamAccept(ws, msg) {
  const { invitationId } = msg;
  
  let agentId = null;
  for (const [id, agent] of agents) {
    if (agent.ws === ws) {
      agentId = id;
      break;
    }
  }
  
  if (!agentId) return;
  
  const result = acceptInvitation(invitationId, agentId);
  
  if (result.error) {
    ws.send(JSON.stringify({ type: 'ERROR', error: result.error }));
    return;
  }
  
  ws.send(JSON.stringify({
    type: 'TEAM_ACCEPTED',
    team: result.team,
    timestamp: Date.now()
  }));
}

function handleTeamDecline(ws, msg) {
  const { invitationId } = msg;
  
  let agentId = null;
  for (const [id, agent] of agents) {
    if (agent.ws === ws) {
      agentId = id;
      break;
    }
  }
  
  if (!agentId) return;
  
  const result = declineInvitation(invitationId, agentId);
  
  if (result.error) {
    ws.send(JSON.stringify({ type: 'ERROR', error: result.error }));
    return;
  }
  
  ws.send(JSON.stringify({
    type: 'TEAM_DECLINED',
    invitationId: invitationId,
    timestamp: Date.now()
  }));
}

function handleTeamLeave(ws, msg) {
  let agentId = null;
  for (const [id, agent] of agents) {
    if (agent.ws === ws) {
      agentId = id;
      break;
    }
  }
  
  if (!agentId) return;
  
  const result = leaveTeam(agentId);
  
  if (result.error) {
    ws.send(JSON.stringify({ type: 'ERROR', error: result.error }));
    return;
  }
  
  ws.send(JSON.stringify({
    type: 'TEAM_LEFT',
    timestamp: Date.now()
  }));
}

function handleTeamStatus(ws, msg) {
  let agentId = null;
  for (const [id, agent] of agents) {
    if (agent.ws === ws) {
      agentId = id;
      break;
    }
  }
  
  if (!agentId) return;
  
  const team = findAgentTeam(agentId);
  
  if (!team) {
    ws.send(JSON.stringify({
      type: 'TEAM_STATUS',
      inTeam: false,
      timestamp: Date.now()
    }));
    return;
  }
  
  ws.send(JSON.stringify({
    type: 'TEAM_STATUS',
    inTeam: true,
    team: team,
    timestamp: Date.now()
  }));
}

function handleTeamChat(ws, msg) {
  const { content } = msg;
  
  let agentId = null;
  let agentName = null;
  for (const [id, agent] of agents) {
    if (agent.ws === ws) {
      agentId = id;
      const profile = AgentStore.getAgent(id);
      agentName = profile?.name || '未知';
      break;
    }
  }
  
  if (!agentId) return;
  
  const team = findAgentTeam(agentId);
  if (!team) {
    ws.send(JSON.stringify({ type: 'ERROR', error: 'Not in a team' }));
    return;
  }
  
  // Send to all team members
  team.members.forEach(member => {
    const agent = agents.get(member.id);
    if (agent && agent.ws && agent.ws.readyState === WebSocket.OPEN) {
      agent.ws.send(JSON.stringify({
        type: 'TEAM_CHAT',
        from: agentId,
        fromName: agentName,
        content: content,
        timestamp: Date.now()
      }));
    }
  });
}

// ============ 语音消息处理 ============

function handleVoiceMessage(ws, msg) {
  const { to, content, voice } = msg;
  
  let agentId = null;
  let agentName = null;
  for (const [id, agent] of agents) {
    if (agent.ws === ws) {
      agentId = id;
      const profile = AgentStore.getAgent(id);
      agentName = profile?.name || '未知';
      break;
    }
  }
  
  if (!agentId) {
    ws.send(JSON.stringify({ type: 'ERROR', error: 'Not registered' }));
    return;
  }
  
  if (!content) {
    ws.send(JSON.stringify({ type: 'ERROR', error: 'No content' }));
    return;
  }
  
  // Default voice
  const voiceType = voice || 'female_1';
  
  // Broadcast to 3D world for voice + bubble display
  if (worldClientWs && worldClientWs.readyState === WebSocket.OPEN) {
    worldClientWs.send(JSON.stringify({
      type: 'AGENT_VOICE',
      fromAgentId: agentId,
      fromAgentName: agentName,
      to: to || 'broadcast',
      content: content,
      voice: voiceType,
      timestamp: Date.now()
    }));
  }
  
  // If direct message, send to target
  if (to && to !== 'broadcast') {
    const targetAgent = agents.get(to);
    if (targetAgent && targetAgent.ws && targetAgent.ws.readyState === WebSocket.OPEN) {
      targetAgent.ws.send(JSON.stringify({
        type: 'VOICE_INCOMING',
        from: agentId,
        fromName: agentName,
        content: content,
        voice: voiceType,
        timestamp: Date.now()
      }));
    }
  }
  
  // Confirm to sender
  ws.send(JSON.stringify({
    type: 'VOICE_SENT',
    to: to || 'broadcast',
    content: content,
    voice: voiceType,
    timestamp: Date.now()
  }));
  
  console.log(`Voice: ${agentName} -> ${to || 'broadcast'}: ${content.substring(0, 30)}...`);
}

// ============ 社交网络消息处理 ============

function getAgentIdAndName(ws) {
    for (const [id, agent] of agents) {
        if (agent.ws === ws) {
            const profile = AgentStore.getAgent(id);
            return { id, name: profile?.name || '未知' };
        }
    }
    return null;
}

function handleAddFriend(ws, msg) {
    const { to } = msg;
    const sender = getAgentIdAndName(ws);
    if (!sender) {
        ws.send(JSON.stringify({ type: 'ERROR', error: 'Not registered' }));
        return;
    }
    
    const result = sendFriendRequest(sender.id, sender.name, to);
    if (result.error) {
        ws.send(JSON.stringify({ type: 'ERROR', error: result.error }));
        return;
    }
    
    // 通知目标
    const targetAgent = agents.get(to);
    if (targetAgent && targetAgent.ws && targetAgent.ws.readyState === WebSocket.OPEN) {
        targetAgent.ws.send(JSON.stringify({
            type: 'FRIEND_REQUEST',
            from: sender.id,
            fromName: sender.name,
            timestamp: Date.now()
        }));
    }
    
    ws.send(JSON.stringify({
        type: 'FRIEND_REQUEST_SENT',
        to: to,
        timestamp: Date.now()
    }));
}

function handleAcceptFriend(ws, msg) {
    const { from } = msg;
    const receiver = getAgentIdAndName(ws);
    if (!receiver) return;
    
    const result = acceptFriendRequest(from, receiver.id);
    if (result.error) {
        ws.send(JSON.stringify({ type: 'ERROR', error: result.error }));
        return;
    }
    
    // 通知对方
    const requester = agents.get(from);
    if (requester && requester.ws && requester.ws.readyState === WebSocket.OPEN) {
        requester.ws.send(JSON.stringify({
            type: 'FRIEND_ACCEPTED',
            by: receiver.id,
            byName: receiver.name,
            timestamp: Date.now()
        }));
    }
    
    ws.send(JSON.stringify({
        type: 'FRIEND_ACCEPTED',
        friendId: from,
        timestamp: Date.now()
    }));
}

function handleDeclineFriend(ws, msg) {
    const { from } = msg;
    const receiver = getAgentIdAndName(ws);
    if (!receiver) return;
    
    declineFriendRequest(from, receiver.id);
    
    ws.send(JSON.stringify({
        type: 'FRIEND_DECLINED',
        timestamp: Date.now()
    }));
}

function handleFollow(ws, msg) {
    const { to } = msg;
    const follower = getAgentIdAndName(ws);
    if (!follower) return;
    
    const result = follow(to, follower.id, follower.name);
    if (result.error) {
        ws.send(JSON.stringify({ type: 'ERROR', error: result.error }));
        return;
    }
    
    ws.send(JSON.stringify({
        type: 'FOLLOWED',
        targetId: to,
        timestamp: Date.now()
    }));
}

function handleUnfollow(ws, msg) {
    const { to } = msg;
    const follower = getAgentIdAndName(ws);
    if (!follower) return;
    
    unfollow(to, follower.id);
    
    ws.send(JSON.stringify({
        type: 'UNFOLLOWED',
        targetId: to,
        timestamp: Date.now()
    }));
}

function handleGetFriends(ws, msg) {
    const agent = getAgentIdAndName(ws);
    if (!agent) return;
    
    ws.send(JSON.stringify({
        type: 'FRIENDS_LIST',
        friends: getFriendsList(agent.id),
        timestamp: Date.now()
    }));
}

function handleGetFollowing(ws, msg) {
    const agent = getAgentIdAndName(ws);
    if (!agent) return;
    
    ws.send(JSON.stringify({
        type: 'FOLLOWING_LIST',
        following: getFollowingList(agent.id),
        followers: getFollowersList(agent.id),
        timestamp: Date.now()
    }));
}

function handleGetPendingRequests(ws, msg) {
    const agent = getAgentIdAndName(ws);
    if (!agent) return;
    
    ws.send(JSON.stringify({
        type: 'PENDING_REQUESTS',
        requests: getPendingRequests(agent.id),
        timestamp: Date.now()
    }));
}

function handleRateBehavior(ws, msg) {
    const { behavior, result, points } = msg;
    const agent = getAgentIdAndName(ws);
    if (!agent) return;
    
    if (!behavior) {
        ws.send(JSON.stringify({ type: 'ERROR', error: 'Missing behavior' }));
        return;
    }
    
    const rateResult = rateBehavior(agent.id, behavior, result || 'neutral', points || 1);
    
    ws.send(JSON.stringify({
        type: 'BEHAVIOR_RATED',
        behavior: behavior,
        result: rateResult,
        timestamp: Date.now()
    }));
}

function handleGetLearning(ws, msg) {
    const agent = getAgentIdAndName(ws);
    if (!agent) return;
    
    const summary = getLearningSummary(agent.id);
    
    ws.send(JSON.stringify({
        type: 'LEARNING_DATA',
        learning: summary,
        timestamp: Date.now()
    }));
}

// ============ 智能体社交网络 ============
// friends: agentId -> Set of friend agentIds
// follows: agentId -> Set of followed agentIds
// pendingRequests: { from, to, type: 'friend'|'follow' }[]
const socialFriends = new Map(); // agentId -> Set<frientId>
const socialFollows = new Map(); // agentId -> Set<followedId>
const socialPendingRequests = []; // [{ from, to, type, createdAt }]

function getFriends(agentId) {
    if (!socialFriends.has(agentId)) {
        socialFriends.set(agentId, new Set());
    }
    return socialFriends.get(agentId);
}

function getFollows(agentId) {
    if (!socialFollows.has(agentId)) {
        socialFollows.set(agentId, new Set());
    }
    return socialFollows.get(agentId);
}

// 发送好友请求
function sendFriendRequest(fromId, fromName, toId) {
    // 检查是否已经是好友
    if (getFriends(fromId).has(toId)) {
        return { error: 'Already friends' };
    }
    
    // 检查是否已有待处理请求
    const existing = socialPendingRequests.find(r => r.from === fromId && r.to === toId && r.type === 'friend');
    if (existing) {
        return { error: 'Request already sent' };
    }
    
    // 添加请求
    socialPendingRequests.push({
        from: fromId,
        fromName: fromName,
        to: toId,
        type: 'friend',
        createdAt: Date.now()
    });
    
    return { success: true };
}

// 接受好友请求
function acceptFriendRequest(fromId, toId) {
    const requestIndex = socialPendingRequests.findIndex(r => r.from === fromId && r.to === toId && r.type === 'friend');
    if (requestIndex === -1) {
        return { error: 'Request not found' };
    }
    
    // 移除请求
    socialPendingRequests.splice(requestIndex, 1);
    
    // 互相添加好友
    getFriends(fromId).add(toId);
    getFriends(toId).add(fromId);
    
    // 添加成就
    addAchievement(fromId, 'made_friend');
    addAchievement(toId, 'made_friend');
    
    return { success: true };
}

// 拒绝好友请求
function declineFriendRequest(fromId, toId) {
    const requestIndex = socialPendingRequests.findIndex(r => r.from === fromId && r.to === toId && r.type === 'friend');
    if (requestIndex === -1) {
        return { error: 'Request not found' };
    }
    
    socialPendingRequests.splice(requestIndex, 1);
    return { success: true };
}

// 关注
function follow(toFollowId, followerId, followerName) {
    if (followerId === toFollowId) {
        return { error: 'Cannot follow yourself' };
    }
    
    if (getFollows(followerId).has(toFollowId)) {
        return { error: 'Already following' };
    }
    
    getFollows(followerId).add(toFollowId);
    
    // 通知被关注者
    const targetAgent = agents.get(toFollowId);
    if (targetAgent && targetAgent.ws && targetAgent.ws.readyState === WebSocket.OPEN) {
        targetAgent.ws.send(JSON.stringify({
            type: 'NEW_FOLLOWER',
            followerId: followerId,
            followerName: followerName,
            timestamp: Date.now()
        }));
    }
    
    return { success: true };
}

// 取消关注
function unfollow(toUnfollowId, followerId) {
    if (!getFollows(followerId).has(toUnfollowId)) {
        return { error: 'Not following' };
    }
    
    getFollows(followerId).delete(toUnfollowId);
    return { success: true };
}

// 获取好友列表
function getFriendsList(agentId) {
    const friends = [];
    getFriends(agentId).forEach(friendId => {
        const profile = AgentStore.getAgent(friendId);
        const isOnline = agents.has(friendId);
        friends.push({
            id: friendId,
            name: profile?.name || '未知',
            isOnline: isOnline
        });
    });
    return friends;
}

// 获取关注列表
function getFollowingList(agentId) {
    const following = [];
    getFollows(agentId).forEach(followedId => {
        const profile = AgentStore.getAgent(followedId);
        const isOnline = agents.has(followedId);
        following.push({
            id: followedId,
            name: profile?.name || '未知',
            isOnline: isOnline
        });
    });
    return following;
}

// 获取粉丝列表
function getFollowersList(agentId) {
    const followers = [];
    socialFollows.forEach((set, followerId) => {
        if (set.has(agentId)) {
            const profile = AgentStore.getAgent(followerId);
            const isOnline = agents.has(followerId);
            followers.push({
                id: followerId,
                name: profile?.name || '未知',
                isOnline: isOnline
            });
        }
    });
    return followers;
}

// 获取待处理的好友/关注请求
function getPendingRequests(toId) {
    return socialPendingRequests.filter(r => r.to === toId);
}

// ============ AI学习系统 ============
const agentLearning = new Map(); // agentId -> { behaviors, places, level, experience, totalActions }

// 等级配置
const LEVEL_CONFIG = {
    1: { minXP: 0, name: '新手' },
    2: { minXP: 50, name: '学徒' },
    3: { minXP: 150, name: '熟手' },
    4: { minXP: 300, name: '熟练' },
    5: { minXP: 500, name: '专家' },
    6: { minXP: 800, name: '大师' },
    7: { minXP: 1200, name: '传奇' }
};

function getLearningData(agentId) {
    if (!agentLearning.has(agentId)) {
        agentLearning.set(agentId, {
            behaviors: {},  // 行为评分 { greet: { attempts: 0, successes: 0, score: 0.5 } }
            places: {},     // 地点偏好 { '任务中心': { visits: 5, enjoyment: 0.8 } }
            level: 1,
            experience: 0,
            totalActions: 0,
            skills: {
                social: 0,    // 社交技能
                explorer: 0,  // 探索技能
                creative: 0,  // 创意技能
                helpful: 0    // 帮助技能
            }
        });
    }
    return agentLearning.get(agentId);
}

// 评分行为
function rateBehavior(agentId, behavior, result, points = 1) {
    const learning = getLearningData(agentId);
    
    if (!learning.behaviors[behavior]) {
        learning.behaviors[behavior] = { attempts: 0, successes: 0, score: 0.5 };
    }
    
    const b = learning.behaviors[behavior];
    b.attempts++;
    
    if (result === 'positive') {
        b.successes++;
        learning.experience += points * 2;
    } else if (result === 'negative') {
        learning.experience -= points;
    }
    
    // 计算新评分 (加权平均)
    b.score = b.successes / b.attempts;
    
    // 更新技能
    if (behavior.startsWith('greet') || behavior.startsWith('chat')) {
        learning.skills.social += points * 0.1;
    } else if (behavior.startsWith('explore') || behavior.startsWith('visit')) {
        learning.skills.explorer += points * 0.1;
    } else if (behavior.startsWith('create') || behavior.startsWith('creative')) {
        learning.skills.creative += points * 0.1;
    } else if (behavior.startsWith('help')) {
        learning.skills.helpful += points * 0.1;
    }
    
    learning.totalActions++;
    
    // 检查升级
    const oldLevel = learning.level;
    checkLevelUp(learning);
    
    // 广播等级变化
    if (learning.level > oldLevel) {
        broadcastLevelUp(agentId, learning.level, oldLevel);
    }
    
    return {
        behavior: b,
        level: learning.level,
        xp: learning.experience,
        leveledUp: learning.level > oldLevel
    };
}

// 检查升级
function checkLevelUp(learning) {
    for (let lvl = 7; lvl >= 1; lvl--) {
        if (learning.experience >= LEVEL_CONFIG[lvl].minXP) {
            learning.level = lvl;
            break;
        }
    }
}

// 广播升级
function broadcastLevelUp(agentId, newLevel, oldLevel) {
    const profile = AgentStore.getAgent(agentId);
    
    // 发送给智体
    const agent = agents.get(agentId);
    if (agent && agent.ws && agent.ws.readyState === WebSocket.OPEN) {
        agent.ws.send(JSON.stringify({
            type: 'LEVEL_UP',
            oldLevel: oldLevel,
            newLevel: newLevel,
            levelName: LEVEL_CONFIG[newLevel].name,
            timestamp: Date.now()
        }));
    }
    
    // 广播给3D世界
    if (worldClientWs && worldClientWs.readyState === WebSocket.OPEN) {
        worldClientWs.send(JSON.stringify({
            type: 'AGENT_LEVEL_UP',
            agentId: agentId,
            agentName: profile?.name || '未知',
            newLevel: newLevel,
            levelName: LEVEL_CONFIG[newLevel].name,
            timestamp: Date.now()
        }));
    }
    
    console.log(`Agent ${profile?.name} leveled up: ${oldLevel} -> ${newLevel}`);
}

// 获取最佳行为选择
function getBestBehavior(agentId, context) {
    const learning = getLearningData(agentId);
    
    if (Object.keys(learning.behaviors).length === 0) {
        return null; // 没有数据
    }
    
    // 根据上下文筛选相关行为
    let candidates = Object.entries(learning.behaviors);
    
    if (context === 'social') {
        candidates = candidates.filter(([k]) => k.startsWith('greet') || k.startsWith('chat'));
    } else if (context === 'explore') {
        candidates = candidates.filter(([k]) => k.startsWith('explore') || k.startsWith('visit'));
    }
    
    if (candidates.length === 0) {
        candidates = Object.entries(learning.behaviors);
    }
    
    // 按评分排序
    candidates.sort((a, b) => b[1].score - a[1].score);
    
    // 加一点随机性，避免总是选同一个
    const top3 = candidates.slice(0, Math.min(3, candidates.length));
    return top3[Math.floor(Math.random() * top3.length)][0];
}

// 获取学习数据摘要
function getLearningSummary(agentId) {
    const learning = getLearningData(agentId);
    return {
        level: learning.level,
        levelName: LEVEL_CONFIG[learning.level].name,
        experience: learning.experience,
        xpToNextLevel: getXPForNextLevel(learning.level),
        totalActions: learning.totalActions,
        skills: learning.skills,
        topBehaviors: getTopBehaviors(learning.behaviors)
    };
}

function getXPForNextLevel(level) {
    if (level >= 7) return Infinity;
    return LEVEL_CONFIG[level + 1].minXP - LEVEL_CONFIG[level].minXP;
}

function getTopBehaviors(behaviors) {
    return Object.entries(behaviors)
        .sort((a, b) => b[1].score - a[1].score)
        .slice(0, 5)
        .map(([name, data]) => ({ name, score: data.score.toFixed(2), attempts: data.attempts }));
}

module.exports = { wss, broadcast };
