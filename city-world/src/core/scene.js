/**
 * @fileoverview Three.js 场景创建和管理
 * 
 * 职责：
 * - 创建 THREE.Scene 实例
 * - 设置雾效、大气
 * - 提供场景重置/清理方法
 * 
 * 导出：
 * - window.scene: 全局共享的场景实例
 * 
 * @module core/scene
 */

/**
 * 创建场景
 * @param {Object} options - 配置选项
 * @returns {THREE.Scene}
 */
export function createScene(options = {}) {
    const scene = new THREE.Scene();
    
    // 背景色
    scene.background = new THREE.Color(options.backgroundColor || 0x1a1a2e);
    
    // 雾效
    if (options.fog) {
        scene.fog = new THREE.Fog(
            options.fog.color || 0x1a1a2e,
            options.fog.near || 1,
            options.fog.far || 1000
        );
    }
    
    // 窗口调整大小处理
    window.addEventListener('resize', () => {
        // 通知 renderer 更新
    });
    
    return scene;
}

/**
 * 重置场景（清除所有对象）
 * @param {THREE.Scene} scene 
 */
export function resetScene(scene) {
    while (scene.children.length > 0) {
        const child = scene.children[0];
        scene.remove(child);
        
        // 释放几何体和材质
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
            if (Array.isArray(child.material)) {
                child.material.forEach(m => m.dispose());
            } else {
                child.material.dispose();
            }
        }
    }
}

export default { createScene, resetScene };
