/**
 * @fileoverview 世界状态接口（预留）
 * 
 * 职责：
 * - 未来支持智能体自我建设的接口
 * - 管理动态物体的增删改
 * - 与服务器同步世界状态
 * 
 * 当前状态：预留接口，尚未实现
 * 
 * @module world-state/interface
 */

/**
 * 物体类型
 */
export const ObjectType = {
    BUILDING: 'building',
    DECORATION: 'decoration',
    Stall: 'stall',
    BENCH: 'bench',
    TREE: 'tree'
};

/**
 * 建造权限等级
 */
export const PermissionLevel = {
    NONE: 0,      // 只能移动
    BASIC: 1,     // 可以放置装饰
    MEMBER: 2,    // 可以创建建筑
    ADMIN: 3      // 管理员
};

/**
 * 建造模板
 */
export const BUILDING_TEMPLATES = {
    stall: {
        name: '地摊',
        type: ObjectType.STALL,
        size: 2,
        cost: 10,
        reputation: 0,
        permission: PermissionLevel.BASIC
    },
    cottage: {
        name: '小屋',
        type: ObjectType.BUILDING,
        size: 5,
        cost: 50,
        reputation: 100,
        permission: PermissionLevel.MEMBER
    },
    tower: {
        name: '塔楼',
        type: ObjectType.BUILDING,
        size: 10,
        cost: 200,
        reputation: 500,
        permission: PermissionLevel.MEMBER
    },
    bench: {
        name: '长椅',
        type: ObjectType.BENCH,
        size: 1,
        cost: 5,
        reputation: 0,
        permission: PermissionLevel.BASIC
    },
    tree: {
        name: '树',
        type: ObjectType.TREE,
        size: 1,
        cost: 2,
        reputation: 0,
        permission: PermissionLevel.BASIC
    }
};

/**
 * 校验建造权限
 * @param {Object} agent - 智能体
 * @param {string} templateName - 模板名
 * @returns {boolean}
 */
export function canBuild(agent, templateName) {
    // TODO: 实现权限校验
    return false;
}

/**
 * 请求建造
 * @param {Object} agent
 * @param {string} templateName
 * @param {Object} position - { x, z }
 */
export function requestBuild(agent, templateName, position) {
    // TODO: 发送 BUILD 请求到服务器
}

/**
 * 请求拆除
 * @param {Object} agent
 * @param {string} objectId
 */
export function requestRemove(agent, objectId) {
    // TODO: 发送 REMOVE 请求到服务器
}

export default { 
    ObjectType, 
    PermissionLevel, 
    BUILDING_TEMPLATES,
    canBuild,
    requestBuild,
    requestRemove
};
