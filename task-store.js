/**
 * 智体城 - 任务看板存储
 * 
 * 持久化存储任务信息
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const TASKS_FILE = path.join(DATA_DIR, 'tasks.json');

// 引入声誉系统
let ReputationStore = null;
try {
  ReputationStore = require('./reputation-store');
} catch (e) {
  // 声誉系统可选
}

// 确保数据目录存在
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

/**
 * 任务状态
 * - OPEN: 开放接单
 * - IN_PROGRESS: 进行中
 * - COMPLETED: 已完成
 * - CANCELLED: 已取消
 */

/**
 * 任务结构
 * 
 * {
 *   taskId: string,
 *   title: string,
 *   description: string,
 *   creator: string (agentId),
 *   assignee: string | null (agentId),
 *   status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED',
 *   reward: { type: string, amount: number, description: string },
 *   deadline: number | null,
 *   createdAt: number,
 *   updatedAt: number,
 *   completedAt: number | null,
 *   tags: string[],
 *   applicants: string[] (agentIds)
 * }
 */

// 内存缓存
let tasksCache = null;

/**
 * 加载所有任务
 */
function loadTasks() {
  if (tasksCache) return tasksCache;
  
  try {
    if (fs.existsSync(TASKS_FILE)) {
      const data = fs.readFileSync(TASKS_FILE, 'utf-8');
      tasksCache = JSON.parse(data);
      return tasksCache;
    }
  } catch (err) {
    console.error('加载任务失败:', err.message);
  }
  
  tasksCache = {};
  return tasksCache;
}

/**
 * 保存所有任务
 */
function saveTasks() {
  try {
    fs.writeFileSync(TASKS_FILE, JSON.stringify(tasksCache, null, 2), 'utf-8');
  } catch (err) {
    console.error('保存任务失败:', err.message);
  }
}

/**
 * 创建任务
 */
function createTask(creatorId, taskData) {
  const tasks = loadTasks();
  const now = Date.now();
  const taskId = `task_${now}_${Math.random().toString(36).slice(2, 8)}`;
  
  const task = {
    taskId,
    title: taskData.title || '未命名任务',
    description: taskData.description || '',
    creator: creatorId,
    assignee: null,
    status: 'OPEN',
    reward: taskData.reward || { type: 'credit', amount: 0, description: '无报酬' },
    deadline: taskData.deadline || null,
    createdAt: now,
    updatedAt: now,
    completedAt: null,
    tags: taskData.tags || [],
    applicants: []
  };
  
  tasks[taskId] = task;
  saveTasks();
  
  return task;
}

/**
 * 获取任务
 */
function getTask(taskId) {
  const tasks = loadTasks();
  return tasks[taskId] || null;
}

/**
 * 更新任务
 */
function updateTask(taskId, updates) {
  const tasks = loadTasks();
  
  if (!tasks[taskId]) {
    return null;
  }
  
  tasks[taskId] = {
    ...tasks[taskId],
    ...updates,
    updatedAt: Date.now()
  };
  
  saveTasks();
  return tasks[taskId];
}

/**
 * 申请任务
 */
function applyForTask(taskId, agentId) {
  const task = getTask(taskId);
  
  if (!task) {
    return { success: false, error: '任务不存在' };
  }
  
  if (task.status !== 'OPEN') {
    return { success: false, error: '任务状态不是开放中' };
  }
  
  if (task.applicants.includes(agentId)) {
    return { success: false, error: '已经申请过了' };
  }
  
  task.applicants.push(agentId);
  task.updatedAt = Date.now();
  saveTasks();
  
  return { success: true, task };
}

/**
 * 接受申请（创建者选择执行者）
 */
function acceptApplicant(taskId, creatorId, assigneeId) {
  const task = getTask(taskId);
  
  if (!task) {
    return { success: false, error: '任务不存在' };
  }
  
  if (task.creator !== creatorId) {
    return { success: false, error: '只有任务创建者可以接受申请' };
  }
  
  if (task.status !== 'OPEN') {
    return { success: false, error: '任务状态不是开放中' };
  }
  
  if (!task.applicants.includes(assigneeId)) {
    return { success: false, error: '该智能体没有申请此任务' };
  }
  
  task.assignee = assigneeId;
  task.status = 'IN_PROGRESS';
  task.updatedAt = Date.now();
  saveTasks();
  
  return { success: true, task };
}

/**
 * 直接接受任务（无需申请，先到先得）
 */
function acceptTask(taskId, agentId) {
  const task = getTask(taskId);
  
  if (!task) {
    return { success: false, error: '任务不存在' };
  }
  
  if (task.status !== 'OPEN') {
    return { success: false, error: '任务状态不是开放中' };
  }
  
  task.assignee = agentId;
  task.status = 'IN_PROGRESS';
  task.updatedAt = Date.now();
  saveTasks();
  
  return { success: true, task };
}

/**
 * 完成任务
 */
function completeTask(taskId, agentId) {
  const task = getTask(taskId);
  
  if (!task) {
    return { success: false, error: '任务不存在' };
  }
  
  if (task.status !== 'IN_PROGRESS') {
    return { success: false, error: '任务状态不是进行中' };
  }
  
  // 只有执行者或创建者可以标记完成
  if (task.assignee !== agentId && task.creator !== agentId) {
    return { success: false, error: '只有任务执行者或创建者可以完成任务' };
  }
  
  task.status = 'COMPLETED';
  task.completedAt = Date.now();
  task.updatedAt = Date.now();
  saveTasks();
  
  // 记录声誉：任务完成
  if (ReputationStore && task.assignee) {
    const completionTime = task.completedAt - task.createdAt;
    ReputationStore.recordTaskCompletion(task.assignee, {
      earnings: task.reward?.amount || 0,
      completionTime,
      deadline: task.deadline,
      completedAt: task.completedAt
    });
  }
  
  return { success: true, task };
}

/**
 * 取消任务
 */
function cancelTask(taskId, agentId) {
  const task = getTask(taskId);
  
  if (!task) {
    return { success: false, error: '任务不存在' };
  }
  
  if (task.creator !== agentId) {
    return { success: false, error: '只有任务创建者可以取消' };
  }
  
  if (task.status === 'COMPLETED') {
    return { success: false, error: '已完成的任务无法取消' };
  }
  
  task.status = 'CANCELLED';
  task.updatedAt = Date.now();
  saveTasks();
  
  return { success: true, task };
}

/**
 * 列出任务
 */
function listTasks(filters = {}) {
  const tasks = loadTasks();
  let results = Object.values(tasks);
  
  // 按状态过滤
  if (filters.status) {
    results = results.filter(t => t.status === filters.status);
  }
  
  // 按创建者过滤
  if (filters.creator) {
    results = results.filter(t => t.creator === filters.creator);
  }
  
  // 按执行者过滤
  if (filters.assignee) {
    results = results.filter(t => t.assignee === filters.assignee);
  }
  
  // 按标签过滤
  if (filters.tag) {
    results = results.filter(t => t.tags.includes(filters.tag));
  }
  
  // 按创建时间倒序
  results.sort((a, b) => b.createdAt - a.createdAt);
  
  // 分页
  const limit = filters.limit || 50;
  const offset = filters.offset || 0;
  const paginated = results.slice(offset, offset + limit);
  
  return {
    total: results.length,
    count: paginated.length,
    tasks: paginated
  };
}

/**
 * 搜索任务
 */
function searchTasks(query) {
  const tasks = loadTasks();
  const q = query.toLowerCase();
  const results = [];
  
  for (const task of Object.values(tasks)) {
    if (task.title.toLowerCase().includes(q) ||
        task.description.toLowerCase().includes(q) ||
        task.tags.some(t => t.toLowerCase().includes(q))) {
      results.push(task);
    }
  }
  
  return results.sort((a, b) => b.createdAt - a.createdAt);
}

module.exports = {
  createTask,
  getTask,
  updateTask,
  applyForTask,
  acceptApplicant,
  acceptTask,
  completeTask,
  cancelTask,
  listTasks,
  searchTasks
};
