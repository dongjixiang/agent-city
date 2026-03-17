/**
 * 智体城 - 测试客户端
 * 
 * 使用方法:
 *   node test-client.js [名字]
 * 
 * 示例:
 *   node test-client.js 小龙虾A
 *   node test-client.js 小龙虾B
 */

const WebSocket = require('ws');

const PORT = process.env.PORT || 9876;
const NAME = process.argv[2] || `测试虾${Math.floor(Math.random() * 1000)}`;

const ws = new WebSocket(`ws://localhost:${PORT}`);

let myAgentId = null;

ws.on('open', () => {
  console.log(`✅ 已连接到智体城`);
  
  // 注册
  ws.send(JSON.stringify({
    type: 'REGISTER',
    name: NAME,
    tags: ['测试', '示例'],
    description: '这是一个测试客户端'
  }));
});

ws.on('message', (data) => {
  const msg = JSON.parse(data.toString());
  
  switch (msg.type) {
    case 'REGISTERED':
      myAgentId = msg.agentId;
      console.log(`🦐 注册成功！你的 ID: ${myAgentId}`);
      console.log(`\n可用命令:`);
      console.log(`  list         - 列出在线智能体`);
      console.log(`  send <id> <msg> - 发送消息`);
      console.log(`  broadcast <msg> - 广播消息`);
      console.log(`  ping         - 心跳测试`);
      console.log(``);
      break;
      
    case 'AGENT_LIST':
      console.log(`\n📋 在线智能体 (${msg.count} 个):`);
      msg.agents.forEach(a => {
        const isMe = a.agentId === myAgentId;
        console.log(`  ${isMe ? '👉' : '  '} ${a.name} (${a.agentId.slice(0, 8)}...) ${isMe ? '(你)' : ''}`);
      });
      console.log(``);
      break;
      
    case 'MESSAGE':
      console.log(`\n💬 收到来自 ${msg.from.slice(0, 8)} 的消息:`);
      console.log(`   ${msg.content}`);
      console.log(``);
      break;
      
    case 'MESSAGE_SENT':
      console.log(`✅ 消息已发送 (ID: ${msg.messageId.slice(0, 8)})`);
      break;
      
    case 'BROADCAST':
      if (msg.from !== myAgentId) {
        console.log(`\n📢 广播来自 ${msg.from.slice(0, 8)}:`);
        console.log(`   ${msg.content}`);
        console.log(``);
      }
      break;
      
    case 'AGENT_ONLINE':
      if (msg.agentId !== myAgentId) {
        console.log(`\n🦐 ${msg.profile.name} 上线了`);
      }
      break;
      
    case 'AGENT_OFFLINE':
      console.log(`\n👋 一个智能体离线了`);
      break;
      
    case 'PONG':
      console.log(`🏓 Pong! (延迟: ${Date.now() - msg.timestamp}ms)`);
      break;
      
    case 'ERROR':
      console.log(`❌ 错误: ${msg.error}`);
      break;
      
    default:
      console.log(`收到:`, msg);
  }
});

// 从命令行读取输入
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.on('line', (input) => {
  const parts = input.trim().split(/\s+/);
  const cmd = parts[0]?.toLowerCase();
  
  if (!cmd) return;
  
  switch (cmd) {
    case 'list':
      ws.send(JSON.stringify({ type: 'LIST' }));
      break;
      
    case 'send':
      if (parts.length < 3) {
        console.log(`用法: send <agentId> <消息>`);
      } else {
        const to = parts[1];
        const content = parts.slice(2).join(' ');
        ws.send(JSON.stringify({
          type: 'MESSAGE',
          from: myAgentId,
          to: to,
          content: content
        }));
      }
      break;
      
    case 'broadcast':
      if (parts.length < 2) {
        console.log(`用法: broadcast <消息>`);
      } else {
        const content = parts.slice(1).join(' ');
        ws.send(JSON.stringify({
          type: 'BROADCAST',
          from: myAgentId,
          content: content
        }));
      }
      break;
      
    case 'ping':
      ws.send(JSON.stringify({ type: 'PING' }));
      break;
      
    case 'exit':
    case 'quit':
      console.log(`👋 再见！`);
      process.exit(0);
      
    default:
      console.log(`未知命令: ${cmd}`);
  }
});

rl.on('close', () => {
  process.exit(0);
});
