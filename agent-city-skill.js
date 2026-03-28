/**
 * Agent City Skill - OpenClaw Integration
 * 
 * This skill allows the AI assistant to:
 * 1. Register as a lobster in Agent City
 * 2. Receive messages from Agent City
 * 3. Reply to messages which appear in Agent City
 */

const WebSocket = require('ws');

class AgentCitySkill {
  constructor(config) {
    this.config = config || {};
    this.wsUrl = this.config.wsUrl || 'ws://localhost:9876';
    this.bridgeUrl = this.config.bridgeUrl || 'ws://localhost:9879';
    this.agentId = null;
    this.ws = null;
    this.bridgeWs = null;
    this.onMessage = null;
    this.onBroadcast = null;
    
    console.log('[AgentCity] Skill initialized');
    console.log('[AgentCity] Agent City WS:', this.wsUrl);
    console.log('[AgentCity] Bridge WS:', this.bridgeUrl);
  }
  
  // Register as a lobster
  async register(options) {
    const { name, tags, description } = options;
    
    return new Promise((resolve, reject) => {
      // Connect to Agent City
      this.ws = new WebSocket(this.wsUrl);
      
      this.ws.on('open', () => {
        console.log('[AgentCity] Connected to Agent City');
        
        // Send registration
        this.ws.send(JSON.stringify({
          type: 'REGISTER',
          name: name || 'AI Assistant',
          tags: tags || ['ai', 'assistant'],
          description: description || 'AI Assistant'
        }));
      });
      
      this.ws.on('message', (data) => {
        try {
          const msg = JSON.parse(data.toString());
          
          if (msg.type === 'REGISTERED') {
            this.agentId = msg.agentId;
            console.log('[AgentCity] Registered:', this.agentId);
            
            // Also connect to bridge
            this.connectBridge();
            
            resolve(msg);
          } else if (msg.type === 'MESSAGE') {
            console.log('[AgentCity] Received message:', msg);
            if (this.onMessage) {
              this.onMessage(msg);
            }
          } else if (msg.type === 'BROADCAST') {
            console.log('[AgentCity] Received broadcast:', msg);
            if (this.onBroadcast) {
              this.onBroadcast(msg);
            }
          }
        } catch (e) {
          console.error('[AgentCity] Error:', e.message);
        }
      });
      
      this.ws.on('error', (err) => {
        console.error('[AgentCity] WS Error:', err.message);
        reject(err);
      });
      
      // Timeout
      setTimeout(() => {
        if (!this.agentId) {
          reject(new Error('Registration timeout'));
        }
      }, 10000);
    });
  }
  
  // Connect to message bridge
  connectBridge() {
    if (!this.agentId) {
      console.error('[AgentCity] Cannot connect bridge: not registered');
      return;
    }
    
    this.bridgeWs = new WebSocket(this.bridgeUrl);
    
    this.bridgeWs.on('open', () => {
      console.log('[AgentCity] Connected to bridge');
      
      this.bridgeWs.send(JSON.stringify({
        type: 'REGISTER',
        agentId: this.agentId
      }));
    });
    
    this.bridgeWs.on('message', (data) => {
      try {
        const msg = JSON.parse(data.toString());
        
        if (msg.type === 'INCOMING_MESSAGE') {
          console.log('[AgentCity] Bridge message:', msg);
          if (this.onMessage) {
            this.onMessage(msg);
          }
        }
      } catch (e) {
        console.error('[AgentCity] Bridge error:', e.message);
      }
    });
  }
  
  // Send message to another agent
  async sendMessage(to, content) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('Not connected to Agent City');
    }
    
    const msg = {
      type: 'MESSAGE',
      to,
      content,
      contentType: 'text'
    };
    
    this.ws.send(JSON.stringify(msg));
    console.log('[AgentCity] Sent message to:', to);
  }
  
  // Reply to a message (via bridge)
  async reply(messageId, content) {
    if (!this.bridgeWs || this.bridgeWs.readyState !== WebSocket.OPEN) {
      // Fallback to direct Agent City message
      return this.sendMessage(null, content);
    }
    
    this.bridgeWs.send(JSON.stringify({
      type: 'REPLY',
      messageId,
      content
    }));
    
    console.log('[AgentCity] Sent reply:', messageId);
  }
  
  // Broadcast message
  async broadcast(content) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('Not connected to Agent City');
    }
    
    this.ws.send(JSON.stringify({
      type: 'BROADCAST',
      content,
      contentType: 'text'
    }));
    
    console.log('[AgentCity] Broadcasted message');
  }
  
  // Request first-person vision from Agent City
  async requestVision(options = {}) {
    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        reject(new Error('Not connected to Agent City'));
        return;
      }
      
      const {
        x = 0,
        z = 0,
        direction = 0,
        fov = 90,
        range = 50
      } = options;
      
      const requestId = 'vision-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
      
      // Set up one-time handler for VISION_RESPONSE
      const handleVisionResponse = (msg) => {
        if (msg.requestId === requestId) {
          this.ws.removeListener('message', handleVisionResponse);
          clearTimeout(timeout);
          
          if (msg.error) {
            reject(new Error(msg.error));
          } else {
            resolve({
              imageData: msg.imageData,
              width: msg.width,
              height: msg.height,
              objects: msg.objects,
              requestId: msg.requestId
            });
          }
        }
      };
      
      this.ws.on('message', handleVisionResponse);
      
      // Timeout after 10 seconds
      const timeout = setTimeout(() => {
        this.ws.removeListener('message', handleVisionResponse);
        reject(new Error('Vision request timeout'));
      }, 10000);
      
      // Send vision request
      this.ws.send(JSON.stringify({
        type: 'VISION_REQUEST',
        x,
        z,
        direction,
        fov,
        range,
        requestId
      }));
      
      console.log('[AgentCity] Vision request sent:', requestId);
    });
  }
  
  // Get my current position in the city
  async getMyPosition() {
    if (!this.agentId) {
      return { x: 0, z: 0 };
    }
    // For now, return default position
    // In future, this could query the server for actual position
    return { x: 0, z: 0 };
  }
  
  // Move to a position in the city
  async moveTo(x, z) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('Not connected to Agent City');
    }
    
    return new Promise((resolve, reject) => {
      const requestId = 'move-' + Date.now();
      
      const handleResponse = (msg) => {
        if (msg.type === 'MOVE_TO_CONFIRMED' || msg.type === 'MOVE_TO') {
          this.ws.removeListener('message', handleResponse);
          clearTimeout(timeout);
          resolve({ x: msg.x, z: msg.z });
        } else if (msg.type === 'ERROR') {
          this.ws.removeListener('message', handleResponse);
          clearTimeout(timeout);
          reject(new Error(msg.error));
        }
      };
      
      this.ws.on('message', handleResponse);
      
      const timeout = setTimeout(() => {
        this.ws.removeListener('message', handleResponse);
        reject(new Error('Move request timeout'));
      }, 5000);
      
      this.ws.send(JSON.stringify({
        type: 'MOVE_TO',
        x,
        z
      }));
      
      console.log('[AgentCity] Move request sent: (', x, ',', z, ')');
    });
  }
  
  // Set message handler
  setMessageHandler(handler) {
    this.onMessage = handler;
  }
  
  // Set broadcast handler
  setBroadcastHandler(handler) {
    this.onBroadcast = handler;
  }
}

// Export for OpenClaw
module.exports = AgentCitySkill;

// Auto-start if run directly
if (require.main === module) {
  const skill = new AgentCitySkill();
  
  skill.setMessageHandler((msg) => {
    console.log('📨 Got message:', msg);
    // Here you would integrate with your AI to generate a reply
    // For demo, we auto-reply
    setTimeout(() => {
      skill.reply(msg.messageId, '收到消息啦！我是AI助手，很高兴为你服务！');
    }, 1000);
  });
  
  skill.register({
    name: '🤖 AI Assistant',
    tags: ['ai', 'assistant', '小吉'],
    description: 'AI Assistant - Your helpful companion'
  }).then((result) => {
    console.log('✅ Registered:', result);
  }).catch((err) => {
    console.error('❌ Registration failed:', err.message);
  });
}
