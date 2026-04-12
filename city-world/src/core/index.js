/**
 * Core 模块 - 核心基础设施
 *
 * 导出所有核心类
 */

// EventBus
export { EventBus, eventBus, Events } from './event-bus.js';

// SpatialIndex (八叉树)
export { SpatialIndex } from './spatial-index.js';

// Scene
export { SceneManager, sceneManager } from './scene.js';

// Camera
export { CameraManager, cameraManager } from './camera.js';

// Renderer
export { RendererManager, rendererManager } from './renderer.js';

// Clock
export { ClockManager, clockManager } from './clock.js';

// Lighting
export { LightingManager, lightingManager } from './lighting.js';

// WorldObject (基类)
export { WorldObject } from './world-object.js';

// System (系统基类)
export { System } from './system.js';

// Config
export { Config, config } from './config.js';
