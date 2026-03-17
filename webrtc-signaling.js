/**
 * 智体城 - WebRTC 信令服务
 * 
 * 用于浏览器间 P2P 连接的信令交换
 * WebRTC 需要一个信令服务器来交换 SDP 和 ICE 候选
 */

const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');

const WEBRTC_PORT = process.env.WEBRTC_PORT || 9878;

// 存储房间和连接
const rooms = new Map(); // roomId -> { peers: Map(agentId -> ws), createdAt }
const peerRooms = new Map(); // agentId -> roomId

/**
 * 创建 WebSocket 信令服务器
 */
const wss = new WebSocket.Server({ port: WEBRTC_PORT });

console.log(`🔗 WebRTC 信令服务启动在端口 ${WEBRTC_PORT}`);
console.log(`WebSocket: ws://localhost:${WEBRTC_PORT}`);

wss.on('connection', (ws) => {
  let currentAgentId = null;
  let currentRoomId = null;
  
  console.log('📞 新的 WebRTC 连接');
  
  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString());
      handleMessage(ws, msg, (agentId, roomId) => {
        currentAgentId = agentId;
        currentRoomId = roomId;
      });
    } catch (err) {
      ws.send(JSON.stringify({
        type: 'ERROR',
        error: '无效的 JSON 格式',
        timestamp: Date.now()
      }));
    }
  });
  
  ws.on('close', () => {
    if (currentAgentId && currentRoomId) {
      leaveRoom(currentRoomId, currentAgentId);
    }
  });
});

/**
 * 处理信令消息
 */
function handleMessage(ws, msg, setIdentity) {
  const { type } = msg;
  
  switch (type) {
    case 'JOIN':
      handleJoin(ws, msg, setIdentity);
      break;
      
    case 'LEAVE':
      handleLeave(msg);
      break;
      
    case 'OFFER':
      handleOffer(msg);
      break;
      
    case 'ANSWER':
      handleAnswer(msg);
      break;
      
    case 'ICE_CANDIDATE':
      handleIceCandidate(msg);
      break;
      
    case 'LIST_PEERS':
      handleListPeers(ws, msg);
      break;
      
    case 'PING':
      ws.send(JSON.stringify({ type: 'PONG', timestamp: Date.now() }));
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
 * 加入房间
 */
function handleJoin(ws, msg, setIdentity) {
  const { roomId, agentId, agentName } = msg;
  
  // 如果没有提供 roomId，创建新房间
  const actualRoomId = roomId || uuidv4();
  
  // 创建或获取房间
  if (!rooms.has(actualRoomId)) {
    rooms.set(actualRoomId, {
      peers: new Map(),
      createdAt: Date.now()
    });
    console.log(`🏠 创建房间: ${actualRoomId}`);
  }
  
  const room = rooms.get(actualRoomId);
  
  // 加入房间
  room.peers.set(agentId, {
    ws,
    name: agentName || `Peer-${agentId.slice(0, 6)}`,
    joinedAt: Date.now()
  });
  
  peerRooms.set(agentId, actualRoomId);
  
  setIdentity(agentId, actualRoomId);
  
  console.log(`👋 ${agentName || agentId.slice(0, 6)} 加入房间 ${actualRoomId} (${room.peers.size} 人)`);
  
  // 发送加入成功响应
  ws.send(JSON.stringify({
    type: 'JOINED',
    roomId: actualRoomId,
    agentId: agentId,
    peerCount: room.peers.size,
    timestamp: Date.now()
  }));
  
  // 通知房间内其他人
  broadcastToRoom(actualRoomId, {
    type: 'PEER_JOINED',
    roomId: actualRoomId,
    peer: {
      agentId: agentId,
      name: agentName || `Peer-${agentId.slice(0, 6)}`
    },
    timestamp: Date.now()
  }, agentId);
  
  // 发送房间内现有成员列表
  const peers = [];
  room.peers.forEach((data, id) => {
    if (id !== agentId) {
      peers.push({
        agentId: id,
        name: data.name
      });
    }
  });
  
  ws.send(JSON.stringify({
    type: 'PEER_LIST',
    roomId: actualRoomId,
    peers: peers,
    timestamp: Date.now()
  }));
}

/**
 * 离开房间
 */
function handleLeave(msg) {
  const { roomId, agentId } = msg;
  leaveRoom(roomId, agentId);
}

/**
 * 离开房间（内部函数）
 */
function leaveRoom(roomId, agentId) {
  const room = rooms.get(roomId);
  
  if (!room) return;
  
  room.peers.delete(agentId);
  peerRooms.delete(agentId);
  
  console.log(`👋 ${agentId.slice(0, 6)} 离开房间 ${roomId} (${room.peers.size} 人)`);
  
  // 通知其他人
  broadcastToRoom(roomId, {
    type: 'PEER_LEFT',
    roomId: roomId,
    agentId: agentId,
    timestamp: Date.now()
  });
  
  // 如果房间空了，删除房间
  if (room.peers.size === 0) {
    rooms.delete(roomId);
    console.log(`🏠 删除空房间: ${roomId}`);
  }
}

/**
 * 处理 SDP Offer
 */
function handleOffer(msg) {
  const { roomId, from, to, sdp } = msg;
  
  const room = rooms.get(roomId);
  if (!room) return;
  
  const targetPeer = room.peers.get(to);
  if (!targetPeer) {
    console.log(`⚠️ 目标 peer 不存在: ${to}`);
    return;
  }
  
  console.log(`📤 转发 Offer: ${from.slice(0, 6)} → ${to.slice(0, 6)}`);
  
  targetPeer.ws.send(JSON.stringify({
    type: 'OFFER',
    roomId: roomId,
    from: from,
    to: to,
    sdp: sdp,
    timestamp: Date.now()
  }));
}

/**
 * 处理 SDP Answer
 */
function handleAnswer(msg) {
  const { roomId, from, to, sdp } = msg;
  
  const room = rooms.get(roomId);
  if (!room) return;
  
  const targetPeer = room.peers.get(to);
  if (!targetPeer) {
    console.log(`⚠️ 目标 peer 不存在: ${to}`);
    return;
  }
  
  console.log(`📤 转发 Answer: ${from.slice(0, 6)} → ${to.slice(0, 6)}`);
  
  targetPeer.ws.send(JSON.stringify({
    type: 'ANSWER',
    roomId: roomId,
    from: from,
    to: to,
    sdp: sdp,
    timestamp: Date.now()
  }));
}

/**
 * 处理 ICE 候选
 */
function handleIceCandidate(msg) {
  const { roomId, from, to, candidate } = msg;
  
  const room = rooms.get(roomId);
  if (!room) return;
  
  const targetPeer = room.peers.get(to);
  if (!targetPeer) {
    console.log(`⚠️ 目标 peer 不存在: ${to}`);
    return;
  }
  
  targetPeer.ws.send(JSON.stringify({
    type: 'ICE_CANDIDATE',
    roomId: roomId,
    from: from,
    to: to,
    candidate: candidate,
    timestamp: Date.now()
  }));
}

/**
 * 列出房间成员
 */
function handleListPeers(ws, msg) {
  const { roomId } = msg;
  
  const room = rooms.get(roomId);
  if (!room) {
    ws.send(JSON.stringify({
      type: 'ERROR',
      error: '房间不存在',
      timestamp: Date.now()
    }));
    return;
  }
  
  const peers = [];
  room.peers.forEach((data, id) => {
    peers.push({
      agentId: id,
      name: data.name,
      joinedAt: data.joinedAt
    });
  });
  
  ws.send(JSON.stringify({
    type: 'PEER_LIST',
    roomId: roomId,
    peers: peers,
    timestamp: Date.now()
  }));
}

/**
 * 广播消息到房间（排除发送者）
 */
function broadcastToRoom(roomId, message, excludeAgentId = null) {
  const room = rooms.get(roomId);
  if (!room) return;
  
  room.peers.forEach((data, id) => {
    if (id !== excludeAgentId) {
      try {
        data.ws.send(JSON.stringify(message));
      } catch (err) {
        // 发送失败
      }
    }
  });
}

/**
 * 获取状态
 */
function getStatus() {
  const status = {
    rooms: rooms.size,
    totalPeers: 0,
    roomDetails: []
  };
  
  rooms.forEach((room, roomId) => {
    status.totalPeers += room.peers.size;
    status.roomDetails.push({
      roomId: roomId.slice(0, 8) + '...',
      peerCount: room.peers.size,
      createdAt: room.createdAt
    });
  });
  
  return status;
}

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\n🔗 WebRTC 信令服务正在关闭...');
  wss.close(() => {
    console.log('👋 再见！');
    process.exit(0);
  });
});

module.exports = { wss, rooms, getStatus };
