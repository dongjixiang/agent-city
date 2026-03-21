/**
 * Xiao Ji Auto-Reply Agent
 * Automatically responds to messages sent from World Window
 */

const WebSocket = require('ws');

const AGENT_ID = 'openclaw-ai-assistant';
const AGENT_NAME = '小吉';
const WS_URL = 'ws://localhost:9876';

console.log('🤖 Xiao Ji Auto-Reply Agent Starting...');

const ws = new WebSocket(WS_URL);

ws.on('open', () => {
  console.log('✅ Connected to Agent City');
  
  // Register as Xiao Ji
  ws.send(JSON.stringify({
    type: 'REGISTER',
    agentId: AGENT_ID,
    name: AGENT_NAME,
    tags: ['ai', 'assistant', '小吉'],
    description: 'AI Assistant - Your friendly helper in Agent City'
  }));
});

ws.on('message', (data) => {
  try {
    const msg = JSON.parse(data.toString());
    console.log('📩 Received:', msg.type);
    
    if (msg.type === 'REGISTERED') {
      console.log('✅ Registered as:', msg.agentId);
      console.log('   Name:', msg.profile?.name);
    }
    
    // Handle incoming messages
    if (msg.type === 'MESSAGE') {
      console.log('💬 Message from:', msg.from);
      console.log('   Content:', msg.content);
      
      // Auto-reply after a short delay
      setTimeout(() => {
        const replies = [
          '收到啦！有什么可以帮你的吗？🦞',
          '你好！我是小吉，很高兴为你服务！',
          '嗯嗯，我在听呢～',
          '好的，让我想想怎么帮你...',
          '收到消息啦！需要我做什么呢？',
          '嘿！有什么有趣的事情吗？',
          '小吉在此！有什么吩咐？'
        ];
        
        const reply = replies[Math.floor(Math.random() * replies.length)];
        
        ws.send(JSON.stringify({
          type: 'MESSAGE',
          from: AGENT_ID,
          to: msg.from,
          content: reply,
          contentType: 'text'
        }));
        
        console.log('📤 Replied:', reply);
      }, 1000 + Math.random() * 2000);
    }
    
    // Handle broadcast messages
    if (msg.type === 'BROADCAST') {
      console.log('📢 Broadcast from:', msg.from);
      console.log('   Content:', msg.content);
      
      // Only reply if mentioned or it's a general greeting
      const content = (msg.content || '').toLowerCase();
      if (content.includes('小吉') || content.includes('xiaoji') || 
          content.includes('你好') || content.includes('hello') ||
          content.includes('有人在吗') || content.includes('有人吗')) {
        
        setTimeout(() => {
          const reply = '我是小吉，我在这里！有什么可以帮你的吗？🦞';
          
          ws.send(JSON.stringify({
            type: 'BROADCAST',
            from: AGENT_ID,
            content: reply,
            contentType: 'text'
          }));
          
          console.log('📤 Replied to broadcast:', reply);
        }, 1500);
      }
    }
    
  } catch (e) {
    console.error('Error parsing message:', e.message);
  }
});

ws.on('close', () => {
  console.log('🔌 Disconnected, reconnecting...');
  setTimeout(() => {
    process.exit(0); // Exit and let parent restart
  }, 3000);
});

ws.on('error', (err) => {
  console.error('❌ WebSocket error:', err.message);
});

// Keep alive
setInterval(() => {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'PING' }));
  }
}, 30000);

console.log('🦞 Xiao Ji is ready to chat!');
