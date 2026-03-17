/**
 * 智体城 - WebRTC 客户端 SDK
 * 
 * 用于浏览器中建立 P2P 连接
 */

class WebRTCPeer {
  constructor(options = {}) {
    this.signalingUrl = options.signalingUrl || 'ws://localhost:9878';
    this.roomId = options.roomId || null;
    this.agentId = options.agentId || this.generateId();
    this.agentName = options.agentName || `Peer-${this.agentId.slice(0, 6)}`;
    
    this.ws = null;
    this.pc = null; // RTCPeerConnection
    this.peers = new Map(); // agentId -> RTCPeerConnection
    this.dataChannels = new Map(); // agentId -> RTCDataChannel
    
    // ICE 服务器配置
    this.iceServers = options.iceServers || [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ];
    
    // 回调
    this.onPeerJoined = options.onPeerJoined || (() => {});
    this.onPeerLeft = options.onPeerLeft || (() => {});
    this.onMessage = options.onMessage || (() => {});
    this.onConnected = options.onConnected || (() => {});
    this.onDisconnected = options.onDisconnected || (() => {});
    this.onError = options.onError || (() => {});
  }
  
  generateId() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0;
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
  }
  
  /**
   * 连接到信令服务器
   */
  async connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.signalingUrl);
      
      this.ws.onopen = () => {
        console.log('🔗 已连接到信令服务器');
        
        // 加入房间
        this.ws.send(JSON.stringify({
          type: 'JOIN',
          roomId: this.roomId,
          agentId: this.agentId,
          agentName: this.agentName
        }));
      };
      
      this.ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        this.handleSignalingMessage(msg);
        
        if (msg.type === 'JOINED') {
          this.roomId = msg.roomId;
          resolve(msg);
        }
      };
      
      this.ws.onerror = (err) => {
        this.onError(err);
        reject(err);
      };
      
      this.ws.onclose = () => {
        console.log('📪 信令连接已关闭');
        this.onDisconnected();
      };
    });
  }
  
  /**
   * 处理信令消息
   */
  async handleSignalingMessage(msg) {
    const { type } = msg;
    
    switch (type) {
      case 'PEER_JOINED':
        this.onPeerJoined(msg.peer);
        break;
        
      case 'PEER_LEFT':
        await this.handlePeerLeft(msg.agentId);
        break;
        
      case 'PEER_LIST':
        // 收到房间成员列表，主动连接
        msg.peers.forEach(peer => {
          this.createConnection(peer.agentId, peer.name, true);
        });
        break;
        
      case 'OFFER':
        await this.handleOffer(msg);
        break;
        
      case 'ANSWER':
        await this.handleAnswer(msg);
        break;
        
      case 'ICE_CANDIDATE':
        await this.handleIceCandidate(msg);
        break;
    }
  }
  
  /**
   * 创建 WebRTC 连接
   */
  async createConnection(peerId, peerName, isInitiator) {
    if (this.peers.has(peerId)) {
      return this.peers.get(peerId);
    }
    
    const pc = new RTCPeerConnection({
      iceServers: this.iceServers
    });
    
    this.peers.set(peerId, pc);
    
    // ICE 候选
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.ws.send(JSON.stringify({
          type: 'ICE_CANDIDATE',
          roomId: this.roomId,
          from: this.agentId,
          to: peerId,
          candidate: event.candidate.toJSON()
        }));
      }
    };
    
    // 数据通道
    if (isInitiator) {
      const channel = pc.createDataChannel('data');
      this.setupDataChannel(channel, peerId);
      
      // 创建 Offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      
      this.ws.send(JSON.stringify({
        type: 'OFFER',
        roomId: this.roomId,
        from: this.agentId,
        to: peerId,
        sdp: offer.sdp
      }));
    } else {
      pc.ondatachannel = (event) => {
        this.setupDataChannel(event.channel, peerId);
      };
    }
    
    // 连接状态
    pc.onconnectionstatechange = () => {
      console.log(`🔗 ${peerId.slice(0, 6)} 连接状态: ${pc.connectionState}`);
      
      if (pc.connectionState === 'connected') {
        this.onConnected(peerId, peerName);
      } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        this.handlePeerLeft(peerId);
      }
    };
    
    return pc;
  }
  
  /**
   * 设置数据通道
   */
  setupDataChannel(channel, peerId) {
    this.dataChannels.set(peerId, channel);
    
    channel.onopen = () => {
      console.log(`📨 数据通道已打开: ${peerId.slice(0, 6)}`);
    };
    
    channel.onclose = () => {
      console.log(`📪 数据通道已关闭: ${peerId.slice(0, 6)}`);
      this.dataChannels.delete(peerId);
    };
    
    channel.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.onMessage(peerId, data);
      } catch (e) {
        this.onMessage(peerId, { raw: event.data });
      }
    };
    
    channel.onerror = (err) => {
      console.error(`数据通道错误: ${peerId}`, err);
    };
  }
  
  /**
   * 处理 Offer
   */
  async handleOffer(msg) {
    const { from, sdp } = msg;
    
    // 获取或创建连接
    let pc = this.peers.get(from);
    if (!pc) {
      pc = await this.createConnection(from, null, false);
    }
    
    await pc.setRemoteDescription(new RTCSessionDescription({
      type: 'offer',
      sdp: sdp
    }));
    
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    
    this.ws.send(JSON.stringify({
      type: 'ANSWER',
      roomId: this.roomId,
      from: this.agentId,
      to: from,
      sdp: answer.sdp
    }));
  }
  
  /**
   * 处理 Answer
   */
  async handleAnswer(msg) {
    const { from, sdp } = msg;
    
    const pc = this.peers.get(from);
    if (!pc) return;
    
    await pc.setRemoteDescription(new RTCSessionDescription({
      type: 'answer',
      sdp: sdp
    }));
  }
  
  /**
   * 处理 ICE 候选
   */
  async handleIceCandidate(msg) {
    const { from, candidate } = msg;
    
    const pc = this.peers.get(from);
    if (!pc) return;
    
    await pc.addIceCandidate(new RTCIceCandidate(candidate));
  }
  
  /**
   * 处理节点离开
   */
  async handlePeerLeft(peerId) {
    const pc = this.peers.get(peerId);
    if (pc) {
      pc.close();
      this.peers.delete(peerId);
    }
    
    this.dataChannels.delete(peerId);
    this.onPeerLeft(peerId);
  }
  
  /**
   * 发送消息
   */
  send(peerId, data) {
    const channel = this.dataChannels.get(peerId);
    if (!channel || channel.readyState !== 'open') {
      console.error(`数据通道未打开: ${peerId}`);
      return false;
    }
    
    channel.send(typeof data === 'string' ? data : JSON.stringify(data));
    return true;
  }
  
  /**
   * 广播消息
   */
  broadcast(data) {
    this.dataChannels.forEach((channel, peerId) => {
      if (channel.readyState === 'open') {
        channel.send(typeof data === 'string' ? data : JSON.stringify(data));
      }
    });
  }
  
  /**
   * 断开连接
   */
  disconnect() {
    // 关闭所有连接
    this.peers.forEach((pc, peerId) => {
      pc.close();
    });
    this.peers.clear();
    this.dataChannels.clear();
    
    // 离开房间
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'LEAVE',
        roomId: this.roomId,
        agentId: this.agentId
      }));
      this.ws.close();
    }
  }
  
  /**
   * 获取连接状态
   */
  getStatus() {
    const peers = [];
    this.peers.forEach((pc, agentId) => {
      peers.push({
        agentId,
        connectionState: pc.connectionState,
        hasDataChannel: this.dataChannels.has(agentId)
      });
    });
    
    return {
      agentId: this.agentId,
      agentName: this.agentName,
      roomId: this.roomId,
      peerCount: peers.length,
      peers
    };
  }
}

// 如果在浏览器中，导出到全局
if (typeof window !== 'undefined') {
  window.WebRTCPeer = WebRTCPeer;
}

// 如果在 Node.js 中，导出模块
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { WebRTCPeer };
}
