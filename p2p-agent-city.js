/**
 * 智体城 - P2P 混合模式
 * 
 * 结合中心化服务和 P2P 网络
 * - 本节点既是服务器，也是 P2P 节点
 * - 数据在节点间同步
 * - 支持离线消息和容错
 */

const { P2PNode } = require('./p2p-node');
const AgentStore = require('./agent-store');
const TaskStore = require('./task-store');

/**
 * P2P 增强的智体城节点
 */
class AgentCityP2P {
  constructor(config = {}) {
    this.config = config;
    this.p2pNode = new P2PNode(config);
    
    // 注册 P2P 处理器
    this._registerP2PHandlers();
  }
  
  /**
   * 启动节点
   */
  async start() {
    const port = await this.p2pNode.start();
    
    // 同步本地数据到 P2P 网络
    await this._syncLocalData();
    
    return port;
  }
  
  /**
   * 注册 P2P 消息处理器
   */
  _registerP2PHandlers() {
    // 智能体档案同步
    this.p2pNode.on('AGENT_SYNC', (ws, msg) => {
      const { agentId, profile } = msg;
      
      // 合并档案（取最新的）
      const localProfile = AgentStore.getAgent(agentId);
      if (!localProfile || profile.updatedAt > localProfile.updatedAt) {
        AgentStore.upsertAgent(agentId, profile);
        console.log(`📥 同步智能体档案: ${profile.name}`);
      }
    });
    
    // 任务同步
    this.p2pNode.on('TASK_SYNC', (ws, msg) => {
      const { task } = msg;
      
      const localTask = TaskStore.getTask(task.taskId);
      if (!localTask || task.updatedAt > localTask.updatedAt) {
        TaskStore.updateTask(task.taskId, task);
        console.log(`📥 同步任务: ${task.title}`);
      }
    });
    
    // 任务申请广播
    this.p2pNode.on('TASK_APPLY_P2P', (ws, msg) => {
      const { taskId, agentId } = msg;
      TaskStore.applyForTask(taskId, agentId);
      console.log(`📥 P2P 任务申请: ${taskId} by ${agentId.slice(0, 8)}`);
    });
    
    // 任务完成广播
    this.p2pNode.on('TASK_COMPLETE_P2P', (ws, msg) => {
      const { taskId, agentId } = msg;
      TaskStore.completeTask(taskId, agentId);
      console.log(`📥 P2P 任务完成: ${taskId}`);
    });
  }
  
  /**
   * 同步本地数据到 P2P 网络
   */
  async _syncLocalData() {
    // 发布所有智能体档案
    const agents = AgentStore.listAgents(1000, 0);
    agents.agents.forEach(agent => {
      this.p2pNode.publish(`agent:${agent.agentId}`, agent);
    });
    
    // 发布所有任务
    const tasks = TaskStore.listTasks({ limit: 1000 });
    tasks.tasks.forEach(task => {
      this.p2pNode.publish(`task:${task.taskId}`, task);
    });
    
    console.log(`📤 已同步 ${agents.agents.length} 个智能体, ${tasks.tasks.length} 个任务`);
  }
  
  /**
   * 发布智能体档案到 P2P 网络
   */
  publishAgent(agentId, profile) {
    AgentStore.upsertAgent(agentId, profile);
    
    this.p2pNode.publish(`agent:${agentId}`, {
      ...profile,
      agentId
    });
    
    // 同时广播同步消息
    this.p2pNode.broadcast({
      type: 'AGENT_SYNC',
      agentId,
      profile: AgentStore.getAgent(agentId)
    });
  }
  
  /**
   * 发布任务到 P2P 网络
   */
  publishTask(task) {
    this.p2pNode.publish(`task:${task.taskId}`, task);
    
    this.p2pNode.broadcast({
      type: 'TASK_SYNC',
      task
    });
  }
  
  /**
   * 通过 P2P 网络申请任务
   */
  applyTaskP2P(taskId, agentId) {
    const result = TaskStore.applyForTask(taskId, agentId);
    
    if (result.success) {
      this.p2pNode.broadcast({
        type: 'TASK_APPLY_P2P',
        taskId,
        agentId
      });
    }
    
    return result;
  }
  
  /**
   * 通过 P2P 网络完成任务
   */
  completeTaskP2P(taskId, agentId) {
    const result = TaskStore.completeTask(taskId, agentId);
    
    if (result.success) {
      this.p2pNode.broadcast({
        type: 'TASK_COMPLETE_P2P',
        taskId,
        agentId
      });
    }
    
    return result;
  }
  
  /**
   * 从 P2P 网络查询智能体
   */
  async queryAgent(agentId) {
    // 先查本地
    const local = AgentStore.getAgent(agentId);
    if (local) return local;
    
    // 再查 P2P 网络
    const data = await this.p2pNode.query(`agent:${agentId}`);
    return data?.value;
  }
  
  /**
   * 从 P2P 网络查询任务
   */
  async queryTask(taskId) {
    // 先查本地
    const local = TaskStore.getTask(taskId);
    if (local) return local;
    
    // 再查 P2P 网络
    const data = await this.p2pNode.query(`task:${taskId}`);
    return data?.value;
  }
  
  /**
   * 获取节点状态
   */
  getStatus() {
    return {
      ...this.p2pNode.getStatus(),
      agentCount: AgentStore.listAgents(1000, 0).total,
      taskCount: TaskStore.listTasks({ limit: 1000 }).total
    };
  }
  
  /**
   * 停止节点
   */
  async stop() {
    await this.p2pNode.stop();
  }
}

module.exports = { AgentCityP2P };
