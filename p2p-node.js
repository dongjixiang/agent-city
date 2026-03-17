/**
 * 智体城 - P2P 去中心化协议
 * 
 * 让每个节点都能成为服务器
 * 节点之间通过 WebRTC 或 WebSocket 直连
 */

const WebSocket = require('ws');
const http = require('http');
const url = require('url');
const { v4: uuidv4 } = require('uuid');

/**
 * P2P 节点配置
 */
const DEFAULT_CONFIG = {
  port: 0, // 0 = 自动分配
  bootstrapNodes: [], // 引导节点列表
  maxPeers: 50, // 最大连接数
  heartbeatInterval: 30000 // 心跳间隔
};

/**
 * P2P 节点类
 */
class P2PNode {
  constructor(config = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.nodeId = config.nodeId || uuidv4();
    this.peers = new Map(); // nodeId -> { ws, address, lastSeen }
    this.data = new Map(); // 本地数据存储
    this.handlers = new Map(); // 消息处理器
    this.server = null;
    this.port = null;
    
    // 注册默认处理器
    this._registerDefaultHandlers();
  }
  
  /**
   * 启动节点
   */
  async start() {
    return new Promise((resolve, reject) => {
      this.server = http.createServer();
      const wss = new WebSocket.Server({ server: this.server });
      
      // 处理入站连接
      wss.on('connection', (ws, req) => {
        this._handleIncomingConnection(ws, req);
      });
      
      // 自动分配端口
      this.server.listen(this.config.port || 0, () => {
        this.port = this.server.address().port;
        console.log(`🌐 P2P 节点启动: ${this.nodeId.slice(0, 8)} 监听端口 ${this.port}`);
        
        // 连接引导节点
        this._connectToBootstrapNodes();
        
        // 启动心跳
        this._startHeartbeat();
        
        resolve(this.port);
      });
      
      this.server.on('error', reject);
    });
  }
  
  /**
   * 连接到引导节点
   */
  async _connectToBootstrapNodes() {
    for (const bootstrap of this.config.bootstrapNodes) {
      try {
        await this.connect(bootstrap);
      } catch (err) {
        console.log(`⚠️ 无法连接引导节点: ${bootstrap}`);
      }
    }
  }
  
  /**
   * 连接到其他节点
   */
  connect(address) {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(address);
      
      ws.on('open', () => {
        // 发送握手消息
        ws.send(JSON.stringify({
          type: 'HANDSHAKE',
          nodeId: this.nodeId,
          port: this.port,
          timestamp: Date.now()
        }));
      });
      
      ws.on('message', (data) => {
        try {
          const msg = JSON.parse(data.toString());
          this._handleMessage(ws, msg);
        } catch (err) {
          console.error('消息解析错误:', err.message);
        }
      });
      
      ws.on('error', (err) => {
        reject(err);
      });
      
      ws.on('close', () => {
        // 移除断开的节点
        this.peers.forEach((peer, id) => {
          if (peer.ws === ws) {
            this.peers.delete(id);
            console.log(`👋 节点离线: ${id.slice(0, 8)}`);
          }
        });
      });
      
      // 设置连接超时
      setTimeout(() => {
        if (ws.readyState === WebSocket.CONNECTING) {
          ws.close();
          reject(new Error('连接超时'));
        }
      }, 5000);
    });
  }
  
  /**
   * 处理入站连接
   */
  _handleIncomingConnection(ws, req) {
    console.log('📥 收到入站连接');
    
    ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data.toString());
        this._handleMessage(ws, msg);
      } catch (err) {
        console.error('消息解析错误:', err.message);
      }
    });
    
    ws.on('close', () => {
      this.peers.forEach((peer, id) => {
        if (peer.ws === ws) {
          this.peers.delete(id);
          console.log(`👋 节点离线: ${id.slice(0, 8)}`);
        }
      });
    });
  }
  
  /**
   * 处理消息
   */
  _handleMessage(ws, msg) {
    const { type } = msg;
    
    // 握手消息特殊处理
    if (type === 'HANDSHAKE') {
      const { nodeId, port } = msg;
      
      if (this.peers.has(nodeId)) {
        return; // 已连接
      }
      
      if (this.peers.size >= this.config.maxPeers) {
        ws.send(JSON.stringify({
          type: 'ERROR',
          error: '节点已满'
        }));
        ws.close();
        return;
      }
      
      this.peers.set(nodeId, {
        ws,
        address: `ws://localhost:${port}`,
        lastSeen: Date.now()
      });
      
      console.log(`🤝 新节点: ${nodeId.slice(0, 8)}`);
      
      // 发送已知节点列表
      const knownPeers = Array.from(this.peers.keys()).filter(id => id !== nodeId);
      ws.send(JSON.stringify({
        type: 'PEER_LIST',
        peers: knownPeers.map(id => ({
          nodeId: id,
          address: this.peers.get(id)?.address
        })),
        timestamp: Date.now()
      }));
      
      return;
    }
    
    // 其他消息交给处理器
    const handler = this.handlers.get(type);
    if (handler) {
      handler(ws, msg, this);
    } else {
      console.log(`收到未处理消息类型: ${type}`);
    }
  }
  
  /**
   * 注册消息处理器
   */
  on(type, handler) {
    this.handlers.set(type, handler);
  }
  
  /**
   * 广播消息给所有节点
   */
  broadcast(msg, excludeNodeId = null) {
    const message = typeof msg === 'string' ? msg : JSON.stringify(msg);
    
    this.peers.forEach((peer, nodeId) => {
      if (nodeId !== excludeNodeId) {
        try {
          peer.ws.send(message);
        } catch (err) {
          // 发送失败，可能节点已断开
        }
      }
    });
  }
  
  /**
   * 发送消息给特定节点
   */
  send(nodeId, msg) {
    const peer = this.peers.get(nodeId);
    if (!peer) {
      throw new Error(`节点不存在: ${nodeId}`);
    }
    
    const message = typeof msg === 'string' ? msg : JSON.stringify(msg);
    peer.ws.send(message);
  }
  
  /**
   * 存储数据（本地）
   */
  set(key, value) {
    this.data.set(key, {
      value,
      timestamp: Date.now(),
      nodeId: this.nodeId
    });
  }
  
  /**
   * 获取数据（本地）
   */
  get(key) {
    return this.data.get(key);
  }
  
  /**
   * 查询数据（全网）
   */
  query(key) {
    return new Promise((resolve) => {
      const localData = this.data.get(key);
      if (localData) {
        resolve(localData);
        return;
      }
      
      // 广播查询请求
      const queryId = uuidv4();
      const handler = (ws, msg) => {
        if (msg.type === 'QUERY_RESPONSE' && msg.queryId === queryId) {
          resolve(msg.data);
        }
      };
      
      this.handlers.set(`QUERY_RESPONSE_${queryId}`, handler);
      
      this.broadcast({
        type: 'QUERY',
        queryId,
        key,
        from: this.nodeId
      });
      
      // 超时
      setTimeout(() => {
        this.handlers.delete(`QUERY_RESPONSE_${queryId}`);
        resolve(null);
      }, 5000);
    });
  }
  
  /**
   * 发布数据（全网）
   */
  publish(key, value) {
    this.set(key, value);
    
    this.broadcast({
      type: 'DATA_PUBLISH',
      key,
      value,
      nodeId: this.nodeId,
      timestamp: Date.now()
    });
  }
  
  /**
   * 启动心跳
   */
  _startHeartbeat() {
    setInterval(() => {
      const now = Date.now();
      
      this.peers.forEach((peer, nodeId) => {
        if (now - peer.lastSeen > this.config.heartbeatInterval * 2) {
          console.log(`💔 节点超时: ${nodeId.slice(0, 8)}`);
          peer.ws.close();
          this.peers.delete(nodeId);
        }
      });
      
      // 发送心跳
      this.broadcast({
        type: 'HEARTBEAT',
        nodeId: this.nodeId,
        timestamp: now
      });
    }, this.config.heartbeatInterval);
  }
  
  /**
   * 注册默认处理器
   */
  _registerDefaultHandlers() {
    // 心跳
    this.on('HEARTBEAT', (ws, msg) => {
      const peer = this.peers.get(msg.nodeId);
      if (peer) {
        peer.lastSeen = Date.now();
      }
    });
    
    // 数据发布
    this.on('DATA_PUBLISH', (ws, msg) => {
      this.data.set(msg.key, {
        value: msg.value,
        timestamp: msg.timestamp,
        nodeId: msg.nodeId
      });
      
      // 继续转发（泛洪，但有 TTL）
      if (!msg._ttl) msg._ttl = 5;
      if (msg._ttl > 0) {
        msg._ttl--;
        this.broadcast(msg, msg.nodeId);
      }
    });
    
    // 数据查询
    this.on('QUERY', (ws, msg) => {
      const localData = this.data.get(msg.key);
      if (localData) {
        this.send(msg.from, {
          type: 'QUERY_RESPONSE',
          queryId: msg.queryId,
          data: localData
        });
      }
    });
    
    // 节点列表
    this.on('PEER_LIST', (ws, msg) => {
      msg.peers.forEach(peer => {
        if (!this.peers.has(peer.nodeId) && peer.address) {
          this.connect(peer.address).catch(() => {});
        }
      });
    });
  }
  
  /**
   * 获取节点状态
   */
  getStatus() {
    return {
      nodeId: this.nodeId,
      port: this.port,
      peers: Array.from(this.peers.keys()).map(id => ({
        nodeId: id,
        address: this.peers.get(id)?.address,
        lastSeen: this.peers.get(id)?.lastSeen
      })),
      dataCount: this.data.size
    };
  }
  
  /**
   * 停止节点
   */
  stop() {
    return new Promise((resolve) => {
      // 通知所有节点
      this.broadcast({
        type: 'GOODBYE',
        nodeId: this.nodeId
      });
      
      // 关闭所有连接
      this.peers.forEach(peer => peer.ws.close());
      this.peers.clear();
      
      // 关闭服务器
      if (this.server) {
        this.server.close(() => {
          console.log('🛑 P2P 节点已停止');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
}

module.exports = { P2PNode };
