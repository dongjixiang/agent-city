/**
 * RendererManager - 渲染器管理器
 * 
 * 负责 WebGL 渲染器配置和管理
 */

import * as THREE from 'three';

class RendererManager {
    constructor() {
        this.renderer = null;
        this.canvas = null;
        this.initialized = false;
        this.settings = {
            antialias: true,
            alpha: false,
            powerPreference: 'high-performance',
            shadowMapEnabled: true,
            shadowMapType: THREE.PCFSoftShadowMap
        };
    }

    /**
     * 初始化渲染器
     */
    init(canvas, settings = {}) {
        if (this.initialized) {
            console.warn('[Renderer] Already initialized');
            return this.renderer;
        }

        // 获取或创建画布
        this.canvas = canvas || document.getElementById('canvas');

        if (!this.canvas) {
            console.error('[Renderer] Canvas not found');
            return null;
        }

        // 合并设置
        const finalSettings = { ...this.settings, ...settings };

        // 创建渲染器
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: finalSettings.antialias,
            alpha: finalSettings.alpha,
            powerPreference: finalSettings.powerPreference
        });

        // 设置尺寸
        this.resize();

        // 阴影配置
        this.renderer.shadowMap.enabled = finalSettings.shadowMapEnabled;
        this.renderer.shadowMap.type = finalSettings.shadowMapType;

        // 色调映射
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.0;

        // 输出编码
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;

        // 像素比
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        this.initialized = true;
        console.log('[Renderer] Initialized');

        return this.renderer;
    }

    /**
     * 获取渲染器
     */
    getRenderer() {
        if (!this.initialized) {
            console.warn('[Renderer] Not initialized');
        }
        return this.renderer;
    }

    /**
     * 获取画布
     */
    getCanvas() {
        return this.canvas;
    }

    /**
     * 渲染场景
     */
    render(scene, camera) {
        if (!this.renderer) {
            console.error('[Renderer] Not initialized');
            return;
        }
        this.renderer.render(scene, camera);
    }

    /**
     * 调整尺寸
     */
    resize(width = null, height = null) {
        if (!this.renderer || !this.canvas) return;

        const w = width || window.innerWidth;
        const h = height || window.innerHeight;

        this.renderer.setSize(w, h);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    }

    /**
     * 设置阴影类型
     */
    setShadowMap(type = THREE.PCFSoftShadowMap) {
        if (!this.renderer) return;
        this.renderer.shadowMap.type = type;
    }

    /**
     * 启用/禁用阴影
     */
    setShadows(enabled) {
        if (!this.renderer) return;
        this.renderer.shadowMap.enabled = enabled;
    }

    /**
     * 设置色调映射
     */
    setToneMapping(exposure = 1.0) {
        if (!this.renderer) return;
        this.renderer.toneMappingExposure = exposure;
    }

    /**
     * 清除
     */
    dispose() {
        if (this.renderer) {
            this.renderer.dispose();
            this.renderer = null;
            this.canvas = null;
            this.initialized = false;
        }
    }
}

// 导出单例
const rendererManager = new RendererManager();

export default rendererManager;
export { RendererManager };
