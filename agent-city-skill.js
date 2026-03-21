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
