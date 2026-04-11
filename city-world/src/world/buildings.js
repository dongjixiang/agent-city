/**
 * @fileoverview 建筑系统
 * 
 * 职责：
 * - 创建静态建筑（房屋、商店等）
 * - 建筑悬停效果
 * - LOD 细节层次
 * 
 * @module world/buildings
 */

/**
 * 地标位置映射
 */
export const Landmarks = {
    FOUNTAIN: { x: 0, z: 0, name: '中央喷泉' },
    TASK_CENTER: { x: -25, z: -25, name: '任务中心' },
    REPUTATION_TOWER: { x: 25, z: -25, name: '声誉塔' },
    TRADING_CENTER: { x: -25, z: 25, name: '交易中心' },
    ARCHIVE: { x: 25, z: 25, name: '档案馆' },
    MESSAGE_STATION: { x: 0, z: -35, name: '消息站' },
    DATA_CENTER: { x: -35, z: 0, name: '数据中心' },
    CREATIVE_WORKSHOP: { x: 35, z: 0, name: '创意工坊' }
};

/**
 * 创建建筑
 * @param {THREE.Scene} scene
 * @param {Object} options
 */
export function createBuilding(scene, options = {}) {
    // TODO: 实现建筑创建
    // options: { x, z, type, height, color }
}

/**
 * 创建城市（所有建筑）
 * @param {THREE.Scene} scene
 */
export function createCity(scene) {
    // TODO: 实现城市创建
    // 遍历 Landmarks 创建所有地标建筑
}

/**
 * 设置建筑悬停效果
 */
export function setupBuildingHover() {
    // TODO: 实现建筑悬停tooltip
}

export default { Landmarks, createBuilding, createCity, setupBuildingHover };
