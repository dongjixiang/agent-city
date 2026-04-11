/**
 * LightingManager - 灯光管理器
 * 
 * 负责灯光创建和日夜循环灯光切换
 */

import * as THREE from 'three';

class LightingManager {
    constructor() {
        this.lights = {};
        this.initialized = false;

        // 灯光配置
        this.lightConfigs = {
            ambient: {
                dawn: { color: 0xFFE4B5, intensity: 0.3 },
                day: { color: 0xFFFFFF, intensity: 0.4 },
                evening: { color: 0xFFA07A, intensity: 0.35 },
                night: { color: 0x4A4A6A, intensity: 0.15 }
            },
            sun: {
                dawn: { color: 0xFFD700, intensity: 0.8, position: new THREE.Vector3(50, 10, 50) },
                day: { color: 0xFFFFE0, intensity: 1.0, position: new THREE.Vector3(0, 100, 0) },
                evening: { color: 0xFF6B6B, intensity: 0.6, position: new THREE.Vector3(-50, 10, 50) },
                night: { color: 0x6666FF, intensity: 0.1, position: new THREE.Vector3(-50, 50, -50) }
            },
            fill: {
                dawn: { color: 0x87CEEB, intensity: 0.2 },
                day: { color: 0x87CEEB, intensity: 0.3 },
                evening: { color: 0xFFA07A, intensity: 0.25 },
                night: { color: 0x4A4A6A, intensity: 0.1 }
            }
        };

        // 当前阶段
        this.currentPhase = 'day';

        // 回调
        this.onPhaseChange = null;
    }

    /**
     * 初始化灯光
     */
    init(scene) {
        if (this.initialized) {
            console.warn('[Lighting] Already initialized');
            return;
        }

        this.scene = scene;
        if (!scene) {
            console.error('[Lighting] Scene is required');
            return;
        }

        // 创建环境光
        this.createAmbientLight();

        // 创建主光源
        this.createSunLight();

        // 创建补光
        this.createFillLight();

        // 创建半球光（天空/地面）
        this.createHemisphereLight();

        this.initialized = true;
        console.log('[Lighting] Initialized');

        // 应用初始灯光
        this.setPhase('day');
    }

    /**
     * 创建环境光
     */
    createAmbientLight() {
        const ambient = new THREE.AmbientLight(0xFFFFFF, 0.4);
        ambient.name = 'ambientLight';
        this.scene.add(ambient);
        this.lights.ambient = ambient;
    }

    /**
     * 创建主光源
     */
    createSunLight() {
        const sun = new THREE.DirectionalLight(0xFFFFE0, 1.0);
        sun.name = 'sunLight';
        
        // 阴影配置
        sun.castShadow = true;
        sun.shadow.mapSize.width = 2048;
        sun.shadow.mapSize.height = 2048;
        sun.shadow.camera.near = 0.5;
        sun.shadow.camera.far = 500;
        sun.shadow.camera.left = -100;
        sun.shadow.camera.right = 100;
        sun.shadow.camera.top = 100;
        sun.shadow.camera.bottom = -100;
        sun.shadow.bias = -0.0001;

        this.scene.add(sun);
        this.lights.sun = sun;
    }

    /**
     * 创建补光
     */
    createFillLight() {
        const fill = new THREE.DirectionalLight(0x87CEEB, 0.3);
        fill.name = 'fillLight';
        fill.position.set(-50, 50, -50);
        this.scene.add(fill);
        this.lights.fill = fill;
    }

    /**
     * 创建半球光
     */
    createHemisphereLight() {
        const hemi = new THREE.HemisphereLight(0x87CEEB, 0x3d5c3d, 0.3);
        hemi.name = 'hemisphereLight';
        this.scene.add(hemi);
        this.lights.hemisphere = hemi;
    }

    /**
     * 设置日夜阶段
     */
    setPhase(phase) {
        this.currentPhase = phase;

        const configs = this.lightConfigs;
        let ambientConfig, sunConfig, fillConfig;

        switch (phase) {
            case 'dawn':
                ambientConfig = configs.ambient.dawn;
                sunConfig = configs.sun.dawn;
                fillConfig = configs.fill.dawn;
                break;
            case 'evening':
                ambientConfig = configs.ambient.evening;
                sunConfig = configs.sun.evening;
                fillConfig = configs.fill.evening;
                break;
            case 'night':
                ambientConfig = configs.ambient.night;
                sunConfig = configs.sun.night;
                fillConfig = configs.fill.night;
                break;
            default: // day
                ambientConfig = configs.ambient.day;
                sunConfig = configs.sun.day;
                fillConfig = configs.fill.day;
        }

        // 应用配置
        if (this.lights.ambient) {
            this.lights.ambient.color.setHex(ambientConfig.color);
            this.lights.ambient.intensity = ambientConfig.intensity;
        }

        if (this.lights.sun) {
            this.lights.sun.color.setHex(sunConfig.color);
            this.lights.sun.intensity = sunConfig.intensity;
            if (sunConfig.position) {
                this.lights.sun.position.copy(sunConfig.position);
            }
        }

        if (this.lights.fill) {
            this.lights.fill.color.setHex(fillConfig.color);
            this.lights.fill.intensity = fillConfig.intensity;
        }

        // 更新半球光
        if (this.lights.hemisphere) {
            switch (phase) {
                case 'night':
                    this.lights.hemisphere.color.setHex(0x2A2A4A);
                    this.lights.hemisphere.groundColor.setHex(0x1A1A2A);
                    this.lights.hemisphere.intensity = 0.15;
                    break;
                case 'evening':
                    this.lights.hemisphere.color.setHex(0xFFA07A);
                    this.lights.hemisphere.groundColor.setHex(0x3D5C3D);
                    this.lights.hemisphere.intensity = 0.25;
                    break;
                case 'dawn':
                    this.lights.hemisphere.color.setHex(0xFFE4B5);
                    this.lights.hemisphere.groundColor.setHex(0x4A5C3D);
                    this.lights.hemisphere.intensity = 0.25;
                    break;
                default: // day
                    this.lights.hemisphere.color.setHex(0x87CEEB);
                    this.lights.hemisphere.groundColor.setHex(0x3d5c3d);
                    this.lights.hemisphere.intensity = 0.3;
            }
        }

        console.log(`[Lighting] Phase: ${phase}`);

        if (this.onPhaseChange) {
            this.onPhaseChange(phase);
        }
    }

    /**
     * 获取当前阶段
     */
    getPhase() {
        return this.currentPhase;
    }

    /**
     * 获取阴影
     */
    getShadow() {
        return this.lights.sun?.shadow;
    }

    /**
     * 设置阴影启用
     */
    setShadows(enabled) {
        if (this.lights.sun) {
            this.lights.sun.castShadow = enabled;
        }
    }

    /**
     * 设置阴影强度
     */
    setShadowIntensity(intensity) {
        if (this.lights.sun) {
            this.lights.sun.shadow.bias = -0.0001 * intensity;
        }
    }

    /**
     * 获取所有灯光
     */
    getLights() {
        return this.lights;
    }

    /**
     * 设置阶段变化回调
     */
    setOnPhaseChange(callback) {
        this.onPhaseChange = callback;
    }

    /**
     * 销毁
     */
    dispose() {
        for (const light of Object.values(this.lights)) {
            if (light) {
                this.scene?.remove(light);
                if (light.dispose) light.dispose();
            }
        }
        this.lights = {};
        this.initialized = false;
    }
}

// 导出单例
const lightingManager = new LightingManager();

export default lightingManager;
export { LightingManager };
