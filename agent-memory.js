/**
 * 智体城 - 智能体记忆系统 (持久化版本)
 * 
 * 每个智能体有独立的记忆存储：
 * - 对话记录（最近20条）
 * - 访问过的地点
 * - 成就徽章
 * - 统计信息
 * - 身份信息
 * 
 * 使用 JSON 文件存储在 data/memories/ 目录下
 */

const fs = require('fs');
const path = require('path');

const MEMORY_DIR = path.join(__dirname, 'data', 'memories');

// 确保记忆目录存在
if (!fs.existsSync(MEMORY_DIR)) {
  fs.mkdirSync(MEMORY_DIR, { recursive: true });
}

// 内存缓存 - 减少频繁读写
const memoryCache = new Map(); // agentId -> memory object
const cacheDirty = new Set();  // 记录哪些记忆被修改需要保存

// 定期保存脏数据到磁盘
const SAVE_INTERVAL = 30000; // 30秒
let saveTimer = null;

/**
 * 获取记忆文件路径
 */
function getMemoryFilePath(agentId) {
  // 使用安全的文件名
  const safeId = agentId.replace(/[^a-zA-Z0-9_-]/g, '_');
  return path.join(MEMORY_DIR, `${safeId}.json`);
}

/**
 * 加载智能体记忆
 */
function loadMemory(agentId) {
  if (memoryCache.has(agentId)) {
    return memoryCache.get(agentId);
  }

  const filePath = getMemoryFilePath(agentId);
  
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf-8');
      const memory = JSON.parse(data);
      memoryCache.set(agentId, memory);
      return memory;
    }
  } catch (err) {
    console.error(`加载记忆失败 [${agentId}]:`, err.message);
  }

  // 返回默认记忆结构
  const defaultMemory = {
    agentId: agentId,
    identity: {
      name: `龙虾#${agentId.slice(0, 6)}`,
      description: '',
      traits: []  // 性格特征
    },
    conversations: [],   // { with: agentId, withName, content, time }
    places: [],          // { name, x, z, visits, firstVisit, lastVisit }
    achievements: [],    // ['achievement_id', ...]
    relationships: {},    // { agentId: { name, intimacy, lastInteract } }
    stats: {
      messagesSent: 0,
      messagesReceived: 0,
      tasksCompleted: 0,
      placesVisited: 0,
      conversationsHad: 0,
      achievementsEarned: 0
    },
    preferences: {},    // 个性化设置
    createdAt: Date.now(),
    lastActive: Date.now(),
    lastSaved: Date.now()
  };

  memoryCache.set(agentId, defaultMemory);
  return defaultMemory;
}

/**
 * 保存单个智能体记忆到磁盘
 */
function saveMemory(agentId) {
  const memory = memoryCache.get(agentId);
  if (!memory) return false;

  const filePath = getMemoryFilePath(agentId);
  
  try {
    memory.lastSaved = Date.now();
    fs.writeFileSync(filePath, JSON.stringify(memory, null, 2), 'utf-8');
    cacheDirty.delete(agentId);
    return true;
  } catch (err) {
    console.error(`保存记忆失败 [${agentId}]:`, err.message);
    return false;
  }
}

/**
 * 标记记忆为已修改，等待批量保存
 */
function markDirty(agentId) {
  cacheDirty.add(agentId);
}

/**
 * 保存所有脏数据
 */
function saveAllDirty() {
  const dirtyAgents = Array.from(cacheDirty);
  let saved = 0;
  
  for (const agentId of dirtyAgents) {
    if (saveMemory(agentId)) {
      saved++;
    }
  }
  
  if (saved > 0) {
    console.log(`💾 已保存 ${saved} 个智能体的记忆`);
  }
  
  return saved;
}

/**
 * 获取智能体记忆（带缓存）
 */
function getMemory(agentId) {
  const memory = loadMemory(agentId);
  memory.lastActive = Date.now();
  markDirty(agentId);
  return memory;
}

/**
 * 添加对话到记忆
 */
function addConversation(agentId, withAgentId, withAgentName, content) {
  const memory = loadMemory(agentId);
  
  memory.conversations.push({
    with: withAgentId,
    withName: withAgentName,
    content: content,
    time: Date.now()
  });
  
  memory.stats.conversationsHad++;
  memory.lastActive = Date.now();
  
  // 只保留最近20条对话
  if (memory.conversations.length > 20) {
    memory.conversations = memory.conversations.slice(-20);
  }
  
  // 更新关系亲密值
  updateRelationship(agentId, withAgentId, withAgentName);
  
  markDirty(agentId);
  return memory;
}

/**
 * 更新与某智能体的关系
 */
function updateRelationship(agentId, otherId, otherName) {
  const memory = loadMemory(agentId);
  
  if (!memory.relationships[otherId]) {
    memory.relationships[otherId] = {
      name: otherName,
      intimacy: 0,    // 亲密度 0-100
      lastInteract: Date.now()
    };
  }
  
  const rel = memory.relationships[otherId];
  rel.name = otherName;
  rel.lastInteract = Date.now();
  rel.intimacy = Math.min(100, rel.intimacy + 1);  // 每次互动增加1点亲密度
  
  markDirty(agentId);
}

/**
 * 添加访问地点到记忆
 */
function addPlace(agentId, placeName, x, z) {
  const memory = loadMemory(agentId);
  
  const existing = memory.places.find(p => p.name === placeName);
  if (existing) {
    existing.visits++;
    existing.lastVisit = Date.now();
  } else {
    memory.places.push({
      name: placeName,
      x: x,
      z: z,
      visits: 1,
      firstVisit: Date.now(),
      lastVisit: Date.now()
    });
    memory.stats.placesVisited++;
  }
  
  memory.lastActive = Date.now();
  markDirty(agentId);
  return memory;
}

/**
 * 添加成就
 */
function addAchievement(agentId, achievementId) {
  const memory = loadMemory(agentId);
  
  if (!memory.achievements.includes(achievementId)) {
    memory.achievements.push(achievementId);
    memory.stats.achievementsEarned = memory.achievements.length;
    memory.lastActive = Date.now();
    markDirty(agentId);
  }
  
  return memory;
}

/**
 * 更新统计
 */
function incrementStat(agentId, statField, delta = 1) {
  const memory = loadMemory(agentId);
  
  if (memory.stats[statField] !== undefined) {
    memory.stats[statField] += delta;
    memory.lastActive = Date.now();
    markDirty(agentId);
  }
  
  return memory;
}

/**
 * 更新身份信息
 */
function updateIdentity(agentId, data) {
  const memory = loadMemory(agentId);
  
  memory.identity = {
    ...memory.identity,
    ...data,
    updatedAt: Date.now()
  };
  
  memory.lastActive = Date.now();
  markDirty(agentId);
  return memory;
}

/**
 * 获取记忆摘要（用于 AI 上下文）
 */
function getMemorySummary(agentId) {
  const memory = loadMemory(agentId);
  
  // 构建简洁的记忆摘要
  const summary = {
    name: memory.identity.name,
    recent_conversations: memory.conversations.slice(-3).map(c => ({
      with: c.withName || c.with,
      preview: c.content.slice(0, 50) + (c.content.length > 50 ? '...' : ''),
      time: c.time
    })),
    places: memory.places.slice(-5).map(p => ({
      name: p.name,
      visits: p.visits
    })),
    achievements: memory.achievements.slice(-5),
    relationships: Object.values(memory.relationships)
      .sort((a, b) => b.intimacy - a.intimacy)
      .slice(0, 5)
      .map(r => ({
        name: r.name,
        intimacy: r.intimacy
      })),
    stats: memory.stats
  };
  
  return summary;
}

/**
 * 清除所有记忆（用于测试或重置）
 */
function clearMemory(agentId) {
  memoryCache.delete(agentId);
  cacheDirty.delete(agentId);
  
  const filePath = getMemoryFilePath(agentId);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

/**
 * 启动定期保存
 */
function startAutoSave() {
  if (saveTimer) return;
  
  saveTimer = setInterval(() => {
    saveAllDirty();
  }, SAVE_INTERVAL);
  
  console.log(`🧠 记忆自动保存已启动 (间隔 ${SAVE_INTERVAL/1000}秒)`);
}

/**
 * 停止自动保存并保存所有数据
 */
function stopAutoSave() {
  if (saveTimer) {
    clearInterval(saveTimer);
    saveTimer = null;
  }
  saveAllDirty();
  console.log('🧠 记忆系统已关闭');
}

/**
 * 获取所有有记忆的智能体ID列表
 */
function getAllMemoryAgentIds() {
  try {
    const files = fs.readdirSync(MEMORY_DIR);
    return files
      .filter(f => f.endsWith('.json'))
      .map(f => f.replace('.json', ''));
  } catch (err) {
    return [];
  }
}

// 启动时加载所有已有记忆到缓存
function preloadAllMemories() {
  try {
    const files = fs.readdirSync(MEMORY_DIR);
    let loaded = 0;
    
    for (const file of files) {
      if (file.endsWith('.json')) {
        const agentId = file.replace('.json', '');
        loadMemory(agentId);
        loaded++;
      }
    }
    
    if (loaded > 0) {
      console.log(`🧠 已预加载 ${loaded} 个智能体的记忆`);
    }
  } catch (err) {
    console.error('预加载记忆失败:', err.message);
  }
}

// 导出模块
module.exports = {
  getMemory,
  getMemorySummary,
  addConversation,
  addPlace,
  addAchievement,
  incrementStat,
  updateIdentity,
  updateRelationship,
  saveMemory,
  saveAllDirty,
  clearMemory,
  startAutoSave,
  stopAutoSave,
  preloadAllMemories,
  getAllMemoryAgentIds
};
