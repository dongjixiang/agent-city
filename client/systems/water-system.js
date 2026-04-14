/**
 * WaterSystem - 水面波纹动画效果
 * 
 * @module systems/water-system
 */

import * as THREE from 'three';

class WaterSystem {
    constructor() {
        this.waterMeshes = [];
        this.time = 0;
    }
    
    /**
     * 初始化
     */
    init(scene) {
        this.scene = scene;
        this.findWaterMeshes();
        console.log('[WaterSystem] Found', this.waterMeshes.length, 'water meshes');
    }
    
    /**
     * 查找场景中的水面
     */
    findWaterMeshes() {
        if (!this.scene) return;
        
        this.scene.traverse((obj) => {
            if (obj.isMesh) {
                // 识别水面：颜色接近蓝色/青色
                const color = obj.material?.color;
                if (color) {
                    const r = color.r, g = color.g, b = color.b;
                    // 如果蓝色分量明显高于红绿，则是水面
                    if (b > r * 1.2 && b > g * 1.2) {
                        this.waterMeshes.push(obj);
                        // 保存原始属性
                        obj.userData.originalColor = color.clone();
                        obj.userData.originalOpacity = obj.material.opacity;
                        obj.userData.originalEmissive = obj.material.emissive ? obj.material.emissive.clone() : new THREE.Color(0);
                    }
                }
            }
        });
    }
    
    /**
     * 更新水面动画（每帧调用）
     */
    update(deltaTime) {
        this.time += deltaTime;
        
        this.waterMeshes.forEach((mesh, index) => {
            const mat = mesh.material;
            if (!mat) return;
            
            // 波纹效果：颜色和透明度轻微波动
            const wave = Math.sin(this.time * 2 + index * 0.5) * 0.02;
            const wave2 = Math.sin(this.time * 3 + index * 0.8) * 0.03;
            
            // 轻微的颜色波动
            if (mat.color && mesh.userData.originalColor) {
                const orig = mesh.userData.originalColor;
                mat.color.r = orig.r + wave;
                mat.color.g = orig.g + wave;
                mat.color.b = orig.b + wave2;
            }
            
            // 透明度的轻微波动
            if (mat.opacity !== undefined && mesh.userData.originalOpacity !== undefined) {
                mat.opacity = mesh.userData.originalOpacity + Math.sin(this.time * 1.5 + index) * 0.05;
            }
        });
    }
}

export const waterSystem = new WaterSystem();
export { WaterSystem };
