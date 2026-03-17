/**
 * 声誉系统路由扩展
 * 
 * 这个文件需要手动合并到 http-server.js 的 routes 对象中
 */

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
}
