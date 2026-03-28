/**
 * 智体城视野测试脚本
 * 测试第一人称视野功能
 */

const WebSocket = require('ws');

const WS_URL = 'ws://47.77.238.56:9876';

let ws = null;
let requestId = null;

function connect() {
  return new Promise((resolve, reject) => {
    ws = new WebSocket(WS_URL);
    
    ws.on('open', () => {
      console.log('✅ 已连接智体城服务器');
      
      // 注册为观察者
      ws.send(JSON.stringify({
        type: 'REGISTER',
        name: '🔭 视野测试员',
        tags: ['test', 'vision'],
        description: '测试视野功能'
      }));
    });
    
    ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data.toString());
        handleMessage(msg);
      } catch (e) {
        console.error('解析消息失败:', e.message);
      }
    });
    
    ws.on('error', reject);
    ws.on('close', () => console.log('🔌 连接断开'));
    
    setTimeout(() => reject(new Error('连接超时')), 10000);
  });
}

function handleMessage(msg) {
  console.log('📩 收到:', msg.type);
  
  if (msg.type === 'REGISTERED') {
    console.log('✅ 注册成功:', msg.agentId);
    console.log('开始测试视野...\n');
    
    // 等待一下确保3D世界客户端也收到了注册
    setTimeout(() => {
      requestVision(0, 0, 0, 90, 30);
    }, 1000);
  }
  
  if (msg.type === 'VISION_RESPONSE' && msg.requestId === requestId) {
    console.log('\n📸 视野响应收到!');
    console.log('图片尺寸:', msg.width, 'x', msg.height);
    console.log('检测到的物体:', msg.objects?.length || 0);
    
    if (msg.objects && msg.objects.length > 0) {
      console.log('\n👁️ 视野中的物体:');
      msg.objects.forEach((obj, i) => {
        console.log(`  ${i + 1}. [${obj.type}] ${obj.name}`);
        console.log(`     距离: ${obj.distance}米, 角度: ${obj.angle}°`);
        if (obj.type === 'building') {
          console.log(`     高度: ${obj.height}米`);
        }
      });
    } else {
      console.log('\n👁️ 视野中没有检测到物体');
    }
    
    // 生成描述
    const description = describeVision({ objects: msg.objects });
    console.log('\n🗣️ 视野描述:');
    console.log(description);
    
    setTimeout(() => {
      ws.close();
      console.log('\n✅ 测试完成!');
      process.exit(0);
    }, 1000);
  }
}

function requestVision(x, z, direction, fov, range) {
  requestId = 'test-' + Date.now();
  console.log(`\n🔭 请求视野: 位置(${x}, ${z}), 方向${direction}°, FOV${fov}°, 范围${range}m`);
  
  ws.send(JSON.stringify({
    type: 'VISION_REQUEST',
    x, z, direction, fov, range,
    requestId
  }));
}

function describeVision(visionResult) {
  const { objects } = visionResult;
  
  if (!objects || objects.length === 0) {
    return '我环顾四周，这里看起来很空旷，没有看到其他智能体。';
  }
  
  const sorted = [...objects].sort((a, b) => a.distance - b.distance);
  const descriptions = [];
  
  for (const obj of sorted) {
    if (obj.type === 'agent') {
      const dist = obj.distance;
      const angle = obj.angle;
      const dir = getDirection(angle);
      const name = obj.name || '一只小龙虾';
      
      if (dist < 3) {
        descriptions.push(`眼前${dist.toFixed(1)}米处，${dir}方向，有一只${name}正站在那里。`);
      } else if (dist < 10) {
        descriptions.push(`不远处${dist.toFixed(1)}米，${dir}方向，有一只${name}。`);
      } else {
        descriptions.push(`远处${dist.toFixed(1)}米，${dir}方向，有一只${name}的身影。`);
      }
    } else if (obj.type === 'building') {
      const dist = obj.distance;
      const angle = obj.angle;
      const dir = getDirection(angle);
      const height = obj.height || '未知';
      
      descriptions.push(`${dir}方向${dist.toFixed(1)}米处，有一栋大约${height}米高的建筑。`);
    }
  }
  
  return descriptions.join('\n') || '我看到了一些模糊的轮廓，但看不太清楚。';
}

function getDirection(angle) {
  if (angle === undefined || angle === null) return '某';
  const abs = Math.abs(angle);
  if (abs < 15) return '正前方';
  if (abs < 45) return angle > 0 ? '右前方' : '左前方';
  if (abs < 75) return angle > 0 ? '右侧' : '左侧';
  if (abs < 105) return angle > 0 ? '右边' : '左边';
  if (abs < 150) return angle > 0 ? '右后方' : '左后方';
  return '身后';
}

async function main() {
  try {
    await connect();
  } catch (err) {
    console.error('❌ 连接失败:', err.message);
    process.exit(1);
  }
}

main();
