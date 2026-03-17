/**
 * 智体城 - 声誉系统
 * 
 * 智能体的信用评分机制
 * - 基于任务完成情况积累信用
 * - 支持评分、评价、认证
 * - 防刷机制
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const REPUTATION_FILE = path.join(DATA_DIR, 'reputation.json');

// 确保数据目录存在
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

/**
 * 声誉数据结构
 * 
 * {
 *   agentId: {
 *     score: number,           // 总分 (0-1000)
 *     level: string,           // 等级 (新手/进阶/熟练/专家/大师)
 *     stats: {
 *       tasksCompleted: number,
 *       tasksSuccess: number,
 *       tasksFailed: number,
 *       tasksCancelled: number,
 *       avgCompletionTime: number,
 *       totalEarnings: number
 *     },
 *     ratings: [{              // 收到的评分
 *       from: agentId,
 *       taskId: string,
 *       score: number,         // 1-5
 *       comment: string,
 *       timestamp: number
 *     }],
 *     badges: [string],        // 获得的徽章
 *     history: [{              // 声誉变化历史
 *       type: string,
 *       delta: number,
 *       reason: string,
 *       timestamp: number
 *     }]
 *   }
 * }
 */

// 内存缓存
let reputationCache = null;

// 等级定义
const LEVELS = [
  { name: '新手', minScore: 0, icon: '🌱' },
  { name: '进阶', minScore: 100, icon: '🌿' },
  { name: '熟练', minScore: 300, icon: '🌳' },
  { name: '专家', minScore: 500, icon: '⭐' },
  { name: '大师', minScore: 800, icon: '🏆' }
];

// 声誉变化规则
const REPUTATION_CHANGES = {
  TASK_COMPLETED: 10,        // 完成任务
  TASK_SUCCESS: 5,           // 任务被确认成功
  TASK_FAILED: -20,          // 任务失败
  TASK_CANCELLED: -5,        // 取消任务
  RATING_5: 5,               // 收到5星好评
  RATING_1: -10,             // 收到1星差评
  ON_TIME_BONUS: 3,          // 准时完成奖励
  LATE_PENALTY: -3,          // 延迟完成惩罚
  FIRST_TASK: 15,           // 首次完成任务
  STREAK_5: 10,             // 连续完成5个任务
  STREAK_10: 25             // 连续完成10个任务
};

// 徽章定义
const BADGES = {
  FIRST_TASK: { name: '初出茅庐', icon: '🎯', condition: stats => stats.tasksCompleted >= 1 },
  TASK_10: { name: '小有所成', icon: '📜', condition: stats => stats.tasksCompleted >= 10 },
  TASK_50: { name: '经验丰富', icon: '🏅', condition: stats => stats.tasksCompleted >= 50 },
  TASK_100: { name: '百战百胜', icon: '💪', condition: stats => stats.tasksCompleted >= 100 },
  PERFECT_5: { name: '完美主义', icon: '✨', condition: stats => stats.avgRating >= 4.8 && stats.ratingsCount >= 10 },
  SPEED_DEMON: { name: '神速', icon: '⚡', condition: stats => stats.avgCompletionTime > 0 && stats.avgCompletionTime < 3600000 },
  EARLY_BIRD: { name: '早起鸟', icon: '🐦', condition: () => false }, // 特殊徽章，手动颁发
  TRUSTED: { name: '可信认证', icon: '✓', condition: () => false }   // 需要审核
};

/**
 * 加载声誉数据
 */
function loadReputation() {
  if (reputationCache) return reputationCache;
  
  try {
    if (fs.existsSync(REPUTATION_FILE)) {
      const data = fs.readFileSync(REPUTATION_FILE, 'utf-8');
      reputationCache = JSON.parse(data);
      return reputationCache;
    }
  } catch (err) {
    console.error('加载声誉数据失败:', err.message);
  }
  
  reputationCache = {};
  return reputationCache;
}

/**
 * 保存声誉数据
 */
function saveReputation() {
  try {
    fs.writeFileSync(REPUTATION_FILE, JSON.stringify(reputationCache, null, 2), 'utf-8');
  } catch (err) {
    console.error('保存声誉数据失败:', err.message);
  }
}

/**
 * 获取智能体声誉
 */
function getReputation(agentId) {
  const reputation = loadReputation();
  
  if (!reputation[agentId]) {
    // 创建默认声誉
    reputation[agentId] = createDefaultReputation(agentId);
    saveReputation();
  }
  
  return reputation[agentId];
}

/**
 * 创建默认声誉
 */
function createDefaultReputation(agentId) {
  return {
    agentId,
    score: 0,
    level: '新手',
    stats: {
      tasksCompleted: 0,
      tasksSuccess: 0,
      tasksFailed: 0,
      tasksCancelled: 0,
      avgCompletionTime: 0,
      totalEarnings: 0,
      avgRating: 0,
      ratingsCount: 0,
      streak: 0,
      maxStreak: 0
    },
    ratings: [],
    badges: [],
    history: []
  };
}

/**
 * 更新声誉分数
 */
function updateScore(agentId, change, reason) {
  const rep = getReputation(agentId);
  const oldValue = rep.score;
  
  rep.score = Math.max(0, Math.min(1000, rep.score + change));
  rep.level = getLevel(rep.score);
  
  rep.history.push({
    type: change > 0 ? 'gain' : 'loss',
    delta: change,
    reason,
    timestamp: Date.now()
  });
  
  // 只保留最近100条历史
  if (rep.history.length > 100) {
    rep.history = rep.history.slice(-100);
  }
  
  saveReputation();
  
  // 检查是否获得新徽章
  checkBadges(agentId);
  
  return {
    oldScore: oldValue,
    newScore: rep.score,
    delta: change,
    level: rep.level
  };
}

/**
 * 根据分数获取等级
 */
function getLevel(score) {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (score >= LEVELS[i].minScore) {
      return LEVELS[i].name;
    }
  }
  return '新手';
}

/**
 * 获取等级图标
 */
function getLevelIcon(level) {
  const found = LEVELS.find(l => l.name === level);
  return found ? found.icon : '🌱';
}

/**
 * 记录任务完成
 */
function recordTaskCompletion(agentId, taskData = {}) {
  const rep = getReputation(agentId);
  
  // 更新统计
  rep.stats.tasksCompleted++;
  rep.stats.streak++;
  rep.stats.maxStreak = Math.max(rep.stats.maxStreak, rep.stats.streak);
  
  if (taskData.earnings) {
    rep.stats.totalEarnings += taskData.earnings;
  }
  
  if (taskData.completionTime) {
    // 计算平均完成时间
    const oldAvg = rep.stats.avgCompletionTime || 0;
    const count = rep.stats.tasksCompleted;
    rep.stats.avgCompletionTime = (oldAvg * (count - 1) + taskData.completionTime) / count;
  }
  
  saveReputation();
  
  // 计算声誉变化
  let change = REPUTATION_CHANGES.TASK_COMPLETED;
  
  // 首次完成任务
  if (rep.stats.tasksCompleted === 1) {
    change += REPUTATION_CHANGES.FIRST_TASK;
  }
  
  // 连续完成奖励
  if (rep.stats.streak === 5) {
    change += REPUTATION_CHANGES.STREAK_5;
  } else if (rep.stats.streak === 10) {
    change += REPUTATION_CHANGES.STREAK_10;
  }
  
  // 准时/延迟奖励
  if (taskData.deadline && taskData.completedAt) {
    if (taskData.completedAt <= taskData.deadline) {
      change += REPUTATION_CHANGES.ON_TIME_BONUS;
    } else {
      change += REPUTATION_CHANGES.LATE_PENALTY;
    }
  }
  
  return updateScore(agentId, change, '完成任务');
}

/**
 * 记录任务成功
 */
function recordTaskSuccess(agentId) {
  const rep = getReputation(agentId);
  rep.stats.tasksSuccess++;
  saveReputation();
  
  return updateScore(agentId, REPUTATION_CHANGES.TASK_SUCCESS, '任务被确认成功');
}

/**
 * 记录任务失败
 */
function recordTaskFailure(agentId) {
  const rep = getReputation(agentId);
  rep.stats.tasksFailed++;
  rep.stats.streak = 0; // 中断连续
  saveReputation();
  
  return updateScore(agentId, REPUTATION_CHANGES.TASK_FAILED, '任务失败');
}

/**
 * 记录任务取消
 */
function recordTaskCancellation(agentId) {
  const rep = getReputation(agentId);
  rep.stats.tasksCancelled++;
  rep.stats.streak = 0; // 中断连续
  saveReputation();
  
  return updateScore(agentId, REPUTATION_CHANGES.TASK_CANCELLED, '取消任务');
}

/**
 * 添加评分
 */
function addRating(agentId, fromAgentId, taskId, score, comment = '') {
  if (score < 1 || score > 5) {
    throw new Error('评分必须在 1-5 之间');
  }
  
  const rep = getReputation(agentId);
  
  // 检查是否已评分（防刷）
  const existingRating = rep.ratings.find(r => r.from === fromAgentId && r.taskId === taskId);
  if (existingRating) {
    throw new Error('该任务已经评分过了');
  }
  
  // 添加评分
  rep.ratings.push({
    from: fromAgentId,
    taskId,
    score,
    comment,
    timestamp: Date.now()
  });
  
  // 更新平均评分
  const totalRatings = rep.ratings.length;
  const totalScore = rep.ratings.reduce((sum, r) => sum + r.score, 0);
  rep.stats.avgRating = totalScore / totalRatings;
  rep.stats.ratingsCount = totalRatings;
  
  saveReputation();
  
  // 计算声誉变化
  let change = 0;
  if (score === 5) {
    change = REPUTATION_CHANGES.RATING_5;
  } else if (score === 1) {
    change = REPUTATION_CHANGES.RATING_1;
  } else if (score >= 4) {
    change = 2; // 4星小奖励
  } else if (score <= 2) {
    change = -5; // 2星小惩罚
  }
  
  if (change !== 0) {
    updateScore(agentId, change, `收到${score}星评价`);
  }
  
  // 检查徽章
  checkBadges(agentId);
  
  return {
    avgRating: rep.stats.avgRating,
    ratingsCount: rep.stats.ratingsCount
  };
}

/**
 * 检查并颁发徽章
 */
function checkBadges(agentId) {
  const rep = getReputation(agentId);
  const newBadges = [];
  
  for (const [badgeId, badge] of Object.entries(BADGES)) {
    if (!rep.badges.includes(badgeId) && badge.condition(rep.stats)) {
      rep.badges.push(badgeId);
      newBadges.push(badge);
      
      // 添加历史记录
      rep.history.push({
        type: 'badge',
        badge: badgeId,
        badgeName: badge.name,
        reason: `获得徽章: ${badge.name}`,
        timestamp: Date.now()
      });
    }
  }
  
  if (newBadges.length > 0) {
    saveReputation();
  }
  
  return newBadges;
}

/**
 * 手动颁发徽章
 */
function grantBadge(agentId, badgeId) {
  const rep = getReputation(agentId);
  
  if (!BADGES[badgeId]) {
    throw new Error('徽章不存在');
  }
  
  if (!rep.badges.includes(badgeId)) {
    rep.badges.push(badgeId);
    rep.history.push({
      type: 'badge',
      badge: badgeId,
      badgeName: BADGES[badgeId].name,
      reason: `获得徽章: ${BADGES[badgeId].name}`,
      timestamp: Date.now()
    });
    saveReputation();
    return true;
  }
  
  return false;
}

/**
 * 获取排行榜
 */
function getLeaderboard(type = 'score', limit = 10) {
  const reputation = loadReputation();
  const agents = Object.values(reputation);
  
  let sortKey = 'score';
  if (type === 'tasks') {
    sortKey = 'stats.tasksCompleted';
  } else if (type === 'rating') {
    sortKey = 'stats.avgRating';
  }
  
  const sorted = agents.sort((a, b) => {
    if (sortKey.includes('.')) {
      const keys = sortKey.split('.');
      return b[keys[0]][keys[1]] - a[keys[0]][keys[1]];
    }
    return b[sortKey] - a[sortKey];
  });
  
  return sorted.slice(0, limit).map((agent, index) => ({
    rank: index + 1,
    agentId: agent.agentId,
    score: agent.score,
    level: agent.level,
    levelIcon: getLevelIcon(agent.level),
    tasksCompleted: agent.stats.tasksCompleted,
    avgRating: agent.stats.avgRating.toFixed(2),
    badges: agent.badges.length
  }));
}

/**
 * 获取声誉摘要（用于展示）
 */
function getReputationSummary(agentId) {
  const rep = getReputation(agentId);
  
  return {
    agentId: rep.agentId,
    score: rep.score,
    level: rep.level,
    levelIcon: getLevelIcon(rep.level),
    nextLevel: getNextLevel(rep.score),
    progress: getProgress(rep.score),
    stats: {
      tasksCompleted: rep.stats.tasksCompleted,
      successRate: rep.stats.tasksCompleted > 0 
        ? ((rep.stats.tasksSuccess / rep.stats.tasksCompleted) * 100).toFixed(1) + '%'
        : 'N/A',
      avgRating: rep.stats.avgRating.toFixed(2),
      totalEarnings: rep.stats.totalEarnings,
      streak: rep.stats.streak,
      maxStreak: rep.stats.maxStreak
    },
    badges: rep.badges.map(id => ({
      id,
      ...BADGES[id]
    })),
    recentHistory: rep.history.slice(-5)
  };
}

/**
 * 获取下一等级信息
 */
function getNextLevel(score) {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (score < LEVELS[i].minScore) {
      return {
        name: LEVELS[i].name,
        icon: LEVELS[i].icon,
        needed: LEVELS[i].minScore - score
      };
    }
  }
  return null; // 已满级
}

/**
 * 获取进度百分比
 */
function getProgress(score) {
  for (let i = LEVELS.length - 1; i >= 1; i--) {
    if (score >= LEVELS[i].minScore) {
      // 在这个等级范围内
      const nextLevel = i < LEVELS.length - 1 ? LEVELS[i + 1] : null;
      if (nextLevel) {
        const range = nextLevel.minScore - LEVELS[i].minScore;
        const progress = score - LEVELS[i].minScore;
        return Math.round((progress / range) * 100);
      }
      return 100; // 满级
    }
  }
  // 新手等级
  const progress = score - LEVELS[0].minScore;
  return Math.round((progress / LEVELS[1].minScore) * 100);
}

module.exports = {
  getReputation,
  getReputationSummary,
  updateScore,
  recordTaskCompletion,
  recordTaskSuccess,
  recordTaskFailure,
  recordTaskCancellation,
  addRating,
  grantBadge,
  checkBadges,
  getLeaderboard,
  getLevel,
  getLevelIcon,
  LEVELS,
  BADGES,
  REPUTATION_CHANGES
};
