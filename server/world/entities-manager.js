/**
 * EntitiesManager - 实体状态管理（变形金刚、狗、牛等）
 * 
 * 负责：
 * - 变形金刚状态（位置、形态、血量）
 * - 动物状态（位置、方向、边界）
 * - 碰撞边界验证
 */

const EntityTypes = {
  TANK: 'tank',
  DOG: 'dog',
  COW: 'cow'
};

class EntitiesManager {
  constructor(worldState) {
    this.worldState = worldState;
    
    // 实体存储: entityId -> entity data
    this.entities = new Map();
    
    // 初始化默认实体
    this.initDefaults();
  }
  
  /**
   * 初始化默认实体
   */
  initDefaults() {
    // 变形金刚
    this.entities.set('tank001', {
      entityId: 'tank001',
      type: EntityTypes.TANK,
      name: '坦克变形金刚',
      position: { x: 30, z: 30 },
      rotation: 0,
      form: 'tank',          // tank / robot
      health: 200,
      maxHealth: 200,
      isDead: false,
      isMoving: false,
      isTransformed: false,
      // 巡逻路线
      patrolRoute: [
        { x: 30, z: 30 },
        { x: 35, z: 30 },
        { x: 35, z: 35 },
        { x: 30, z: 35 }
      ],
      patrolIndex: 0,
      speed: 0.15,
      // 边界（相对于位置）
      bounds: {
        minX: -1.5, maxX: 1.5,
        minZ: -2.5, maxZ: 2.5
      }
    });
    
    // 狗 - 位置与 client/main.js 同步
    const dogPositions = [
      { x: -50, z: -30 },
      { x: -55, z: -45 },
      { x: -40, z: 0 },
      { x: 55, z: -50 },
      { x: 45, z: -60 }
    ];
    dogPositions.forEach((pos, i) => {
      this.entities.set(`dog_${i}`, {
        entityId: `dog_${i}`,
        type: EntityTypes.DOG,
        name: `狗 ${i + 1}`,
        position: { x: pos.x, z: pos.z },
        rotation: 0,
        direction: Math.random() * Math.PI * 2,
        speed: 0.5,
        // 边界（在家附近活动范围）
        bounds: {
          boundX1: pos.x - 8,
          boundX2: pos.x + 8,
          boundZ1: pos.z - 8,
          boundZ2: pos.z + 8
        },
        homeX: pos.x,
        homeZ: pos.z
      });
    });
    
    // 牛 - 位置与 client/main.js 同步
    const cowPositions = [
      { x: -85, z: -40 },
      { x: -78, z: -50 },
      { x: -88, z: -20 },
      { x: -72, z: -35 }
    ];
    cowPositions.forEach((pos, i) => {
      this.entities.set(`cow_${i}`, {
        entityId: `cow_${i}`,
        type: EntityTypes.COW,
        name: `牛 ${i + 1}`,
        position: { x: pos.x, z: pos.z },
        rotation: 0,
        direction: Math.random() * Math.PI * 2,
        speed: 0.3,
        bounds: {
          boundX1: pos.x - 10,
          boundX2: pos.x + 10,
          boundZ1: pos.z - 10,
          boundZ2: pos.z + 10
        },
        homeX: pos.x,
        homeZ: pos.z
      });
    });
    
    console.log(`[EntitiesManager] 初始化了 ${this.entities.size} 个实体`);
  }
  
  /**
   * 获取实体
   */
  getEntity(entityId) {
    return this.entities.get(entityId);
  }
  
  /**
   * 获取所有实体
   */
  getAllEntities() {
    return Array.from(this.entities.values());
  }
  
  /**
   * 按类型获取实体
   */
  getByType(type) {
    return Array.from(this.entities.values()).filter(e => e.type === type);
  }
  
  /**
   * 验证移动是否在边界内
   */
  validateMove(entityId, newPosition) {
    const entity = this.entities.get(entityId);
    if (!entity) {
      return { valid: false, reason: 'Entity not found' };
    }
    
    const { x, z } = newPosition;
    
    // 1. 检查世界边界
    if (!this.worldState.terrain.isInBounds(x, z)) {
      return { valid: false, reason: 'Out of world bounds' };
    }
    
    // 2. 检查地形是否可通行（变形金刚需要可通行地面）
    if (entity.type === EntityTypes.TANK) {
      if (!this.worldState.terrain.isWalkable(x, z)) {
        return { valid: false, reason: 'Terrain not walkable for tank' };
      }
    }
    
    // 3. 检查实体类型特定边界
    if (entity.bounds) {
      if (entity.type === EntityTypes.TANK) {
        // 坦克边界框（相对于位置）
        const { minX, maxX, minZ, maxZ } = entity.bounds;
        if (x + minX < -this.worldState.meta.width / 2 ||
            x + maxX > this.worldState.meta.width / 2 ||
            z + minZ < -this.worldState.meta.height / 2 ||
            z + maxZ > this.worldState.meta.height / 2) {
          return { valid: false, reason: 'Out of entity bounds' };
        }
      } else if (entity.bounds.boundX1 !== undefined) {
        // 动物的移动范围边界
        if (x < entity.bounds.boundX1 || x > entity.bounds.boundX2 ||
            z < entity.bounds.boundZ1 || z > entity.bounds.boundZ2) {
          return { valid: false, reason: 'Out of animal roaming bounds' };
        }
      }
    }
    
    // 4. 检查建筑碰撞（针对坦克）
    if (entity.type === EntityTypes.TANK) {
      const building = this.worldState.buildings.getBuildingAtPoint(x, z);
      if (building) {
        return { valid: false, reason: `Blocked by building ${building.id}` };
      }
    }
    
    return { valid: true };
  }
  
  /**
   * 更新实体位置
   */
  updatePosition(entityId, position, rotation) {
    const entity = this.entities.get(entityId);
    if (!entity) {
      return { success: false, reason: 'Entity not found' };
    }
    
    // 验证移动
    const validation = this.validateMove(entityId, position);
    if (!validation.valid) {
      return { success: false, reason: validation.reason };
    }
    
    entity.position = { ...position };
    if (rotation !== undefined) {
      entity.rotation = rotation;
    }
    
    return { success: true, position: entity.position };
  }
  
  /**
   * 更新变形金刚形态
   */
  updateTankForm(entityId, form) {
    const entity = this.entities.get(entityId);
    if (!entity || entity.type !== EntityTypes.TANK) {
      return { success: false, reason: 'Not a tank entity' };
    }
    entity.form = form;
    entity.isTransformed = (form === 'robot');
    return { success: true, form };
  }
  
  /**
   * 坦克受到伤害
   */
  damageTank(entityId, amount) {
    const entity = this.entities.get(entityId);
    if (!entity || entity.type !== EntityTypes.TANK) {
      return { success: false, reason: 'Not a tank entity' };
    }
    
    if (entity.isDead) {
      return { success: false, reason: 'Tank is already dead' };
    }
    
    entity.health -= amount;
    if (entity.health <= 0) {
      entity.health = 0;
      entity.isDead = true;
    }
    
    return { success: true, health: entity.health, isDead: entity.isDead };
  }
  
  /**
   * 获取状态（用于同步到客户端）
   */
  getState() {
    return this.getAllEntities().map(e => ({
      entityId: e.entityId,
      type: e.type,
      name: e.name,
      position: e.position,
      rotation: e.rotation,
      // 类型特定字段
      ...(e.type === EntityTypes.TANK && {
        form: e.form,
        health: e.health,
        maxHealth: e.maxHealth,
        isDead: e.isDead,
        isMoving: e.isMoving,
        isTransformed: e.isTransformed
      }),
      ...(e.type === EntityTypes.DOG && {
        direction: e.direction,
        speed: e.speed
      }),
      ...(e.type === EntityTypes.COW && {
        direction: e.direction,
        speed: e.speed
      })
    }));
  }
  
  /**
   * 获取实体状态快照（用于 WebSocket 广播）
   */
  getSnapshot() {
    return {
      version: '1.0',
      timestamp: Date.now(),
      entities: this.getState()
    };
  }
}

module.exports = { EntitiesManager, EntityTypes };
