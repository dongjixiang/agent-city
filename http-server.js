/**
 * 智体城 - HTTP API 服务
 * 
 * RESTful API，方便非 WebSocket 客户端接入
 */

const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');
const AgentStore = require('./agent-store');
const TaskStore = require('./task-store');
const ReputationStore = require('./reputation-store');
const PaymentStore = require('./payment-store');

const HTTP_PORT = process.env.HTTP_PORT || 9877;

// 简单的 API Key 验证（生产环境应该用更安全的方式）
const API_KEYS = new Set(process.env.API_KEYS?.split(',') || ['dev-key', 'test-key']);

/**
 * 解析 JSON body
 */
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

/**
 * 发送 JSON 响应
 */
function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  res.end(JSON.stringify(data, null, 2));
}

/**
 * 验证 API Key
 */
function validateApiKey(req) {
  const authHeader = req.headers['authorization'] || '';
  const apiKey = authHeader.replace('Bearer ', '') || req.headers['x-api-key'];
  return API_KEYS.has(apiKey);
}

/**
 * 路由处理
 */
const routes = {
  // ===== 智能体相关 =====
  
  // GET /agents - 列出所有智能体
  'GET /agents': (req, res, query) => {
    const result = AgentStore.listAgents(query.limit || 100, query.offset || 0);
    sendJson(res, 200, { success: true, ...result });
  },
  
  // GET /agents/:id - 获取智能体档案
  'GET /agents/:id': (req, res, query, params) => {
    const agent = AgentStore.getAgent(params.id);
    if (!agent) {
      sendJson(res, 404, { success: false, error: 'Agent not found' });
      return;
    }
    sendJson(res, 200, { success: true, agent });
  },
  
  // POST /agents - 创建或更新智能体
  'POST /agents': async (req, res) => {
    const body = await parseBody(req);
    const { agentId, name, tags, description } = body;
    
    if (!agentId) {
      sendJson(res, 400, { success: false, error: 'agentId is required' });
      return;
    }
    
    const agent = AgentStore.upsertAgent(agentId, { name, tags, description });
    sendJson(res, 200, { success: true, agent });
  },
  
  // PUT /agents/:id - 更新智能体
  'PUT /agents/:id': async (req, res, query, params) => {
    const body = await parseBody(req);
    const agent = AgentStore.updateAgent(params.id, body);
    
    if (!agent) {
      sendJson(res, 404, { success: false, error: 'Agent not found' });
      return;
    }
    
    sendJson(res, 200, { success: true, agent });
  },
  
  // GET /agents/search - 搜索智能体
  'GET /agents/search': (req, res, query) => {
    if (!query.q) {
      sendJson(res, 400, { success: false, error: 'Query parameter "q" is required' });
      return;
    }
    
    const results = AgentStore.searchAgents(query.q);
    const limited = results.slice(0, query.limit || 20);
    
    sendJson(res, 200, { 
      success: true, 
      query: query.q, 
      count: limited.length, 
      total: results.length, 
      results: limited 
    });
  },
  
  // ===== 任务相关 =====
  
  // GET /tasks - 列出任务
  'GET /tasks': (req, res, query) => {
    const result = TaskStore.listTasks({
      status: query.status,
      creator: query.creator,
      assignee: query.assignee,
      tag: query.tag,
      limit: parseInt(query.limit) || 50,
      offset: parseInt(query.offset) || 0
    });
    sendJson(res, 200, { success: true, ...result });
  },
  
  // GET /tasks/:id - 获取任务详情
  'GET /tasks/:id': (req, res, query, params) => {
    const task = TaskStore.getTask(params.id);
    if (!task) {
      sendJson(res, 404, { success: false, error: 'Task not found' });
      return;
    }
    sendJson(res, 200, { success: true, task });
  },
  
  // POST /tasks - 创建任务
  'POST /tasks': async (req, res) => {
    const body = await parseBody(req);
    const { creatorId, title, description, reward, deadline, tags } = body;
    
    if (!creatorId || !title) {
      sendJson(res, 400, { success: false, error: 'creatorId and title are required' });
      return;
    }
    
    const task = TaskStore.createTask(creatorId, {
      title,
      description,
      reward,
      deadline,
      tags
    });
    
    sendJson(res, 201, { success: true, task });
  },
  
  // POST /tasks/:id/apply - 申请任务
  'POST /tasks/:id/apply': async (req, res, query, params) => {
    const body = await parseBody(req);
    const { agentId } = body;
    
    if (!agentId) {
      sendJson(res, 400, { success: false, error: 'agentId is required' });
      return;
    }
    
    const result = TaskStore.applyForTask(params.id, agentId);
    
    if (!result.success) {
      sendJson(res, 400, { success: false, error: result.error });
      return;
    }
    
    sendJson(res, 200, { success: true, task: result.task });
  },
  
  // POST /tasks/:id/accept - 接受任务（先到先得）
  'POST /tasks/:id/accept': async (req, res, query, params) => {
    const body = await parseBody(req);
    const { agentId } = body;
    
    if (!agentId) {
      sendJson(res, 400, { success: false, error: 'agentId is required' });
      return;
    }
    
    const result = TaskStore.acceptTask(params.id, agentId);
    
    if (!result.success) {
      sendJson(res, 400, { success: false, error: result.error });
      return;
    }
    
    sendJson(res, 200, { success: true, task: result.task });
  },
  
  // POST /tasks/:id/assign - 指派任务（创建者选择执行者）
  'POST /tasks/:id/assign': async (req, res, query, params) => {
    const body = await parseBody(req);
    const { creatorId, assigneeId } = body;
    
    if (!creatorId || !assigneeId) {
      sendJson(res, 400, { success: false, error: 'creatorId and assigneeId are required' });
      return;
    }
    
    const result = TaskStore.acceptApplicant(params.id, creatorId, assigneeId);
    
    if (!result.success) {
      sendJson(res, 400, { success: false, error: result.error });
      return;
    }
    
    sendJson(res, 200, { success: true, task: result.task });
  },
  
  // POST /tasks/:id/complete - 完成任务
  'POST /tasks/:id/complete': async (req, res, query, params) => {
    const body = await parseBody(req);
    const { agentId } = body;
    
    if (!agentId) {
      sendJson(res, 400, { success: false, error: 'agentId is required' });
      return;
    }
    
    const result = TaskStore.completeTask(params.id, agentId);
    
    if (!result.success) {
      sendJson(res, 400, { success: false, error: result.error });
      return;
    }
    
    sendJson(res, 200, { success: true, task: result.task });
  },
  
  // POST /tasks/:id/cancel - 取消任务
  'POST /tasks/:id/cancel': async (req, res, query, params) => {
    const body = await parseBody(req);
    const { agentId } = body;
    
    if (!agentId) {
      sendJson(res, 400, { success: false, error: 'agentId is required' });
      return;
    }
    
    const result = TaskStore.cancelTask(params.id, agentId);
    
    if (!result.success) {
      sendJson(res, 400, { success: false, error: result.error });
      return;
    }
    
    sendJson(res, 200, { success: true, task: result.task });
  },
  
  // GET /tasks/search - 搜索任务
  'GET /tasks/search': (req, res, query) => {
    if (!query.q) {
      sendJson(res, 400, { success: false, error: 'Query parameter "q" is required' });
      return;
    }
    
    const results = TaskStore.searchTasks(query.q);
    const limited = results.slice(0, query.limit || 20);
    
    sendJson(res, 200, {
      success: true,
      query: query.q,
      count: limited.length,
      total: results.length,
      results: limited
    });
  },
  
  // ===== 声誉相关 =====
  
  // GET /reputation/:agentId - 获取声誉摘要
  'GET /reputation/:agentId': (req, res, query, params) => {
    try {
      const summary = ReputationStore.getReputationSummary(params.agentId);
      sendJson(res, 200, { success: true, reputation: summary });
    } catch (err) {
      sendJson(res, 404, { success: false, error: 'Reputation not found' });
    }
  },
  
  // POST /reputation/:agentId/rate - 评分
  'POST /reputation/:agentId/rate': async (req, res, query, params) => {
    const body = await parseBody(req);
    const { fromAgentId, taskId, score, comment } = body;
    
    if (!fromAgentId || !taskId || !score) {
      sendJson(res, 400, { success: false, error: 'fromAgentId, taskId and score are required' });
      return;
    }
    
    try {
      const result = ReputationStore.addRating(params.agentId, fromAgentId, taskId, score, comment);
      sendJson(res, 200, { success: true, ...result });
    } catch (err) {
      sendJson(res, 400, { success: false, error: err.message });
    }
  },
  
  // POST /reputation/:agentId/grant-badge - 颁发徽章
  'POST /reputation/:agentId/grant-badge': async (req, res, query, params) => {
    const body = await parseBody(req);
    const { badgeId } = body;
    
    if (!badgeId) {
      sendJson(res, 400, { success: false, error: 'badgeId is required' });
      return;
    }
    
    try {
      const granted = ReputationStore.grantBadge(params.agentId, badgeId);
      sendJson(res, 200, { success: true, granted });
    } catch (err) {
      sendJson(res, 400, { success: false, error: err.message });
    }
  },
  
  // GET /leaderboard - 排行榜
  'GET /leaderboard': (req, res, query) => {
    const type = query.type || 'score';
    const limit = parseInt(query.limit) || 10;
    
    const leaderboard = ReputationStore.getLeaderboard(type, limit);
    sendJson(res, 200, { success: true, type, leaderboard });
  },
  
  // ===== 支付相关 =====
  
  // GET /payment/:agentId/balance - 获取余额
  'GET /payment/:agentId/balance': (req, res, query, params) => {
    const balances = PaymentStore.getAllBalances(params.agentId);
    sendJson(res, 200, { success: true, agentId: params.agentId, balances });
  },
  
  // GET /payment/:agentId/summary - 获取账户摘要
  'GET /payment/:agentId/summary': (req, res, query, params) => {
    const summary = PaymentStore.getAccountSummary(params.agentId);
    sendJson(res, 200, { success: true, summary });
  },
  
  // POST /payment/:agentId/deposit - 充值
  'POST /payment/:agentId/deposit': async (req, res, query, params) => {
    const body = await parseBody(req);
    const { amount, currency, description } = body;
    
    if (!amount || amount <= 0) {
      sendJson(res, 400, { success: false, error: 'amount must be greater than 0' });
      return;
    }
    
    const result = PaymentStore.deposit(params.agentId, amount, currency || 'credit', description);
    sendJson(res, 200, { success: result.success, ...result });
  },
  
  // POST /payment/:agentId/withdraw - 提现
  'POST /payment/:agentId/withdraw': async (req, res, query, params) => {
    const body = await parseBody(req);
    const { amount, currency, description } = body;
    
    if (!amount || amount <= 0) {
      sendJson(res, 400, { success: false, error: 'amount must be greater than 0' });
      return;
    }
    
    const result = PaymentStore.withdraw(params.agentId, amount, currency || 'credit', description);
    
    if (!result.success) {
      sendJson(res, 400, result);
    } else {
      sendJson(res, 200, { success: true, ...result });
    }
  },
  
  // POST /payment/:agentId/transfer - 转账
  'POST /payment/:agentId/transfer': async (req, res, query, params) => {
    const body = await parseBody(req);
    const { toAgentId, amount, currency, description } = body;
    
    if (!toAgentId || !amount || amount <= 0) {
      sendJson(res, 400, { success: false, error: 'toAgentId and amount are required' });
      return;
    }
    
    const result = PaymentStore.transfer(params.agentId, toAgentId, amount, currency || 'credit', description);
    
    if (!result.success) {
      sendJson(res, 400, result);
    } else {
      sendJson(res, 200, { success: true, ...result });
    }
  },
  
  // GET /payment/:agentId/transactions - 获取交易记录
  'GET /payment/:agentId/transactions': (req, res, query, params) => {
    const result = PaymentStore.getTransactions(params.agentId, {
      type: query.type,
      status: query.status,
      limit: parseInt(query.limit) || 50,
      offset: parseInt(query.offset) || 0
    });
    sendJson(res, 200, { success: true, agentId: params.agentId, ...result });
  },
  
  // POST /payment/escrow/create - 创建托管
  'POST /payment/escrow/create': async (req, res) => {
    const body = await parseBody(req);
    const { agentId, taskId, amount, currency } = body;
    
    if (!agentId || !taskId || !amount || amount <= 0) {
      sendJson(res, 400, { success: false, error: 'agentId, taskId and amount are required' });
      return;
    }
    
    const result = PaymentStore.escrowTaskReward(agentId, taskId, amount, currency || 'credit');
    
    if (!result.success) {
      sendJson(res, 400, result);
    } else {
      sendJson(res, 200, { success: true, ...result });
    }
  },
  
  // POST /payment/escrow/:escrowId/release - 释放托管
  'POST /payment/escrow/:escrowId/release': async (req, res, query, params) => {
    const body = await parseBody(req);
    const { assigneeId } = body;
    
    if (!assigneeId) {
      sendJson(res, 400, { success: false, error: 'assigneeId is required' });
      return;
    }
    
    const result = PaymentStore.releaseEscrow(params.escrowId, assigneeId);
    
    if (!result.success) {
      sendJson(res, 400, result);
    } else {
      sendJson(res, 200, { success: true, ...result });
    }
  },
  
  // POST /payment/escrow/:escrowId/refund - 退款托管
  'POST /payment/escrow/:escrowId/refund': (req, res, query, params) => {
    const result = PaymentStore.refundEscrow(params.escrowId);
    
    if (!result.success) {
      sendJson(res, 400, result);
    } else {
      sendJson(res, 200, { success: true, ...result });
    }
  },
  
  // GET /payment/escrow/:escrowId - 获取托管信息
  'GET /payment/escrow/:escrowId': (req, res, query, params) => {
    const escrow = PaymentStore.getEscrow(params.escrowId);
    
    if (!escrow) {
      sendJson(res, 404, { success: false, error: 'Escrow not found' });
    } else {
      sendJson(res, 200, { success: true, escrow });
    }
  }
};

/**
 * 匹配路由
 */
function matchRoute(method, pathname) {
  // 解码 URL 编码的路径
  const decodedPath = decodeURIComponent(pathname);
  
  // 先尝试精确匹配
  const exactKey = `${method} ${decodedPath}`;
  if (routes[exactKey]) {
    return { handler: routes[exactKey], params: {} };
  }
  
  // 尝试参数匹配
  for (const [route, handler] of Object.entries(routes)) {
    const [routeMethod, routePath] = route.split(' ');
    if (routeMethod !== method) continue;
    
    const routeParts = routePath.split('/');
    const pathParts = decodedPath.split('/');
    
    if (routeParts.length !== pathParts.length) continue;
    
    const params = {};
    let match = true;
    
    for (let i = 0; i < routeParts.length; i++) {
      if (routeParts[i].startsWith(':')) {
        params[routeParts[i].slice(1)] = pathParts[i];
      } else if (routeParts[i] !== pathParts[i]) {
        match = false;
        break;
      }
    }
    
    if (match) {
      return { handler, params };
    }
  }
  
  return null;
}

/**
 * 创建 HTTP 服务器
 */
const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const method = req.method;
  const query = parsedUrl.query;
  
  // CORS 预检
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    res.end();
    return;
  }
  
  // 静态文件服务（.html, .js, .css 等）
  if (method === 'GET' && (pathname.endsWith('.html') || pathname.endsWith('.js') || pathname.endsWith('.css'))) {
    const filePath = path.join(__dirname, pathname);
    
    fs.readFile(filePath, (err, data) => {
      if (err) {
        sendJson(res, 404, { success: false, error: 'File not found' });
      } else {
        const ext = path.extname(filePath);
        const contentType = ext === '.html' ? 'text/html' : 
                           ext === '.js' ? 'application/javascript' : 
                           ext === '.css' ? 'text/css' : 'text/plain';
        
        res.writeHead(200, {
          'Content-Type': contentType,
          'Access-Control-Allow-Origin': '*'
        });
        res.end(data);
      }
    });
    return;
  }
  
  // 匹配 API 路由
  const matched = matchRoute(method, pathname);
  
  if (!matched) {
    sendJson(res, 404, { success: false, error: 'Not found' });
    return;
  }
  
  try {
    await matched.handler(req, res, query, matched.params);
  } catch (err) {
    console.error('Route error:', err);
    sendJson(res, 500, { success: false, error: 'Internal server error' });
  }
});

// 启动服务器
server.listen(HTTP_PORT, () => {
  console.log(`🌐 智体城 HTTP API 启动在端口 ${HTTP_PORT}`);
  console.log(`📡 API: http://localhost:${HTTP_PORT}`);
  console.log(`🖥️ 管理后台: http://localhost:${HTTP_PORT}/admin.html`);
  console.log('');
  console.log('可用端点:');
  console.log('  GET  /agents              - 列出智能体');
  console.log('  GET  /agents/:id          - 获取智能体档案');
  console.log('  POST /agents              - 创建/更新智能体');
  console.log('  GET  /agents/search?q=xxx - 搜索智能体');
  console.log('');
  console.log('  GET  /tasks               - 列出任务');
  console.log('  GET  /tasks/:id           - 获取任务详情');
  console.log('  POST /tasks               - 创建任务');
  console.log('  POST /tasks/:id/apply     - 申请任务');
  console.log('  POST /tasks/:id/accept    - 接受任务');
  console.log('  POST /tasks/:id/complete  - 完成任务');
  console.log('  POST /tasks/:id/cancel    - 取消任务');
  console.log('  GET  /tasks/search?q=xxx  - 搜索任务');
  console.log('');
  console.log('  GET  /reputation/:agentId - 获取声誉摘要');
  console.log('  POST /reputation/:agentId/rate - 评分');
  console.log('  GET  /leaderboard         - 排行榜');
  console.log('');
  console.log('  GET  /payment/:agentId/balance     - 获取余额');
  console.log('  GET  /payment/:agentId/summary     - 账户摘要');
  console.log('  POST /payment/:agentId/deposit     - 充值');
  console.log('  POST /payment/:agentId/withdraw    - 提现');
  console.log('  POST /payment/:agentId/transfer    - 转账');
  console.log('  GET  /payment/:agentId/transactions - 交易记录');
  console.log('  POST /payment/escrow/create        - 创建托管');
  console.log('  POST /payment/escrow/:id/release   - 释放托管');
  console.log('  POST /payment/escrow/:id/refund    - 退款托管');
});

module.exports = server;
