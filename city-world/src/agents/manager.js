/**
 * @fileoverview 智能体管理器
 * 
 * 职责：
 * - 智能体的添加/移除
 * - 智能体状态管理
 * - 智能体列表维护
 * 
 * 导出：
 * - addAgent(agentData)
 * - removeAgent(agentId)
 * - getAgent(agentId)
 * - getAllAgents()
 * 
 * @module agents/manager
 */

// 智能体 Map
const agents = new Map();

/**
 * 添加智能体到场景
 * @param {Object} agentData - { agentId, name, position, type }
 * @returns {THREE.Group} 智能体 mesh
 */
export function addAgent(agentData) {
    // TODO: 实现
}

/**
 * 从场景移除智能体
 * @param {string} agentId
 */
export function removeAgent(agentId) {
    // TODO: 实现
}

/**
 * 获取智能体
 * @param {string} agentId
 * @returns {Object|null}
 */
export function getAgent(agentId) {
    return agents.get(agentId) || null;
}

/**
 * 获取所有在线智能体
 * @returns {Array}
 */
export function getAllAgents() {
    return Array.from(agents.values());
}

/**
 * 更新智能体位置
 * @param {string} agentId
 * @param {Object} position - { x, z }
 */
export function updateAgentPosition(agentId, position) {
    // TODO: 实现
}

export default { addAgent, removeAgent, getAgent, getAllAgents, updateAgentPosition };
