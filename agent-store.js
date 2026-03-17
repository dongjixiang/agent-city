/**
 * 智体城 - 智能体档案存储
 * 
 * 持久化存储智能体的身份信息
 * 使用 JSON 文件存储（简单、方便调试）
 * 未来可替换为数据库
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const AGENTS_FILE = path.join(DATA_DIR, 'agents.json');

// 确保数据目录存在
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

/**
 * 智能体档案结构
 * 
 * {
 *   agentId: string,
 *   name: string,
 *   tags: string[],
 *   description: string,
 *   createdAt: number,
 *   updatedAt: number,
 *   lastOnlineAt: number,
 *   profile: {
 *     avatar: string | null,
 *     website: string | null,
 *     capabilities: string[],
 *     preferences: object
 *   },
 *   stats: {
 *     messagesSent: number,
 *     tasksCompleted: number,
 *     reputation: number
 *   }
 * }
 */

// 内存缓存
let agentsCache = null;

/**
 * 加载所有智能体档案
 */
function loadAgents() {
  if (agentsCache) return agentsCache;
  
  try {
    if (fs.existsSync(AGENTS_FILE)) {
      const data = fs.readFileSync(AGENTS_FILE, 'utf-8');
      agentsCache = JSON.parse(data);
      return agentsCache;
    }
  } catch (err) {
    console.error('加载智能体档案失败:', err.message);
  }
  
  agentsCache = {};
  return agentsCache;
}

/**
 * 保存所有智能体档案
 */
function saveAgents() {
  try {
    fs.writeFileSync(AGENTS_FILE, JSON.stringify(agentsCache, null, 2), 'utf-8');
  } catch (err) {
    console.error('保存智能体档案失败:', err.message);
  }
}

/**
 * 获取智能体档案
 */
function getAgent(agentId) {
  const agents = loadAgents();
  return agents[agentId] || null;
}

/**
 * 创建或更新智能体档案
 */
function upsertAgent(agentId, data) {
  const agents = loadAgents();
  const now = Date.now();
  
  if (agents[agentId]) {
    // 更新现有档案
    agents[agentId] = {
      ...agents[agentId],
      ...data,
      updatedAt: now,
      lastOnlineAt: now
    };
  } else {
    // 创建新档案
    agents[agentId] = {
      agentId,
      name: data.name || `龙虾#${agentId.slice(0, 6)}`,
      tags: data.tags || [],
      description: data.description || '',
      createdAt: now,
      updatedAt: now,
      lastOnlineAt: now,
      profile: {
        avatar: null,
        website: null,
        capabilities: [],
        preferences: {}
      },
      stats: {
        messagesSent: 0,
        tasksCompleted: 0,
        reputation: 0
      },
      ...data
    };
  }
  
  saveAgents();
  return agents[agentId];
}

/**
 * 更新智能体部分信息
 */
function updateAgent(agentId, updates) {
  const agents = loadAgents();
  
  if (!agents[agentId]) {
    return null;
  }
  
  agents[agentId] = {
    ...agents[agentId],
    ...updates,
    updatedAt: Date.now()
  };
  
  saveAgents();
  return agents[agentId];
}

/**
 * 更新智能体统计
 */
function incrementStat(agentId, statField, delta = 1) {
  const agents = loadAgents();
  
  if (!agents[agentId]) {
    return null;
  }
  
  if (!agents[agentId].stats) {
    agents[agentId].stats = {
      messagesSent: 0,
      tasksCompleted: 0,
      reputation: 0
    };
  }
  
  agents[agentId].stats[statField] = (agents[agentId].stats[statField] || 0) + delta;
  agents[agentId].updatedAt = Date.now();
  
  saveAgents();
  return agents[agentId];
}

/**
 * 搜索智能体
 */
function searchAgents(query) {
  const agents = loadAgents();
  const results = [];
  
  const q = query.toLowerCase();
  
  for (const [id, agent] of Object.entries(agents)) {
    // 搜索名字、标签、描述
    if (agent.name.toLowerCase().includes(q) ||
        agent.tags.some(t => t.toLowerCase().includes(q)) ||
        agent.description.toLowerCase().includes(q)) {
      results.push(agent);
    }
  }
  
  return results;
}

/**
 * 获取所有智能体（简化信息）
 */
function listAgents(limit = 100, offset = 0) {
  const agents = loadAgents();
  const list = Object.values(agents)
    .sort((a, b) => b.lastOnlineAt - a.lastOnlineAt)
    .slice(offset, offset + limit)
    .map(agent => ({
      agentId: agent.agentId,
      name: agent.name,
      tags: agent.tags,
      description: agent.description,
      lastOnlineAt: agent.lastOnlineAt,
      stats: agent.stats
    }));
  
  return {
    total: Object.keys(agents).length,
    count: list.length,
    agents: list
  };
}

/**
 * 删除智能体档案
 */
function deleteAgent(agentId) {
  const agents = loadAgents();
  
  if (agents[agentId]) {
    delete agents[agentId];
    saveAgents();
    return true;
  }
  
  return false;
}

// 清理缓存（用于测试）
function clearCache() {
  agentsCache = null;
}

module.exports = {
  getAgent,
  upsertAgent,
  updateAgent,
  incrementStat,
  searchAgents,
  listAgents,
  deleteAgent,
  clearCache
};
