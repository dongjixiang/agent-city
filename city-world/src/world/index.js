/**
 * World Objects - 世界对象模块
 *
 * 统一导出所有 WorldObject 子类
 * 对应 DESIGN.md Section 3.1 WorldObject Class Hierarchy
 */

// ============ 地形 ============
export { TerrainObject, Ground, Lake, Road } from './terrain/terrain-object.js';

// ============ 装饰物 ============
export { DecorationObject, Flower, Tree, Lamp, Bench, Bush, Rock } from './decoration/decoration-object.js';

// ============ 设施 ============
export { FacilityObject, Fountain } from './facility/facility-object.js';

// ============ 建筑 ============
export {
    BuildingObject,
    TaskCenter,
    ReputationTower,
    TradingCenter,
    Archive,
    MessageStation,
    DataCenter,
    CreativeWorkshop,
    SkillAcademy
} from './building-types/building-object.js';
