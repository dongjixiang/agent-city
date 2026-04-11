/**
 * CameraManager - 相机管理器
 * 
 * 负责相机控制，包括 OrbitControls 和视角切换
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

class CameraManager {
    constructor() {
        this.camera = null;
        this.controls = null;
        this.initialized = false;

        // 相机模式
        this.mode = 'orbit'; // 'orbit' | 'firstPerson' | 'follow'
        this.modeSettings = {
            orbit: {
                fov: 60,
                near: 0.1,
                far: 1000,
                position: new THREE.Vector3(0, 50, 50)
            },
            firstPerson: {
                fov: 75,
                near: 0.1,
                far: 1000,
                height: 1.5 // 第一人称视角高度
            },
            follow: {
                fov: 60,
                near: 0.1,
                far: 1000,
                distance: 8,
                height: 4
            }
        };

        // 跟随目标
        this.followTarget = null;
    }

    /**
     * 初始化相机
     */
    init(canvas, settings = {}) {
        if (this.initialized) {
            console.warn('[Camera] Already initialized');
            return this.camera;
        }

        // 获取画布尺寸
        let width = canvas?.clientWidth || window.innerWidth;
        let height = canvas?.clientHeight || window.innerHeight;

        // 创建相机
        const orbitSettings = this.modeSettings.orbit;
        this.camera = new THREE.PerspectiveCamera(
            orbitSettings.fov,
            width / height,
            orbitSettings.near,
            orbitSettings.far
        );
        this.camera.position.copy(orbitSettings.position);

        // 创建控制器
        this.controls = new OrbitControls(this.camera, canvas);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.maxPolarAngle = Math.PI / 2; // 限制俯视角度
        this.controls.minDistance = 5;
        this.controls.maxDistance = 200;

        this.initialized = true;
        console.log('[Camera] Initialized');

        return this.camera;
    }

    /**
     * 获取相机
     */
    getCamera() {
        if (!this.initialized) {
            console.warn('[Camera] Not initialized');
        }
        return this.camera;
    }

    /**
     * 获取控制器
     */
    getControls() {
        return this.controls;
    }

    /**
     * 更新控制器
     */
    update() {
        if (this.controls) {
            this.controls.update();
        }
    }

    /**
     * 切换相机模式
     */
    setMode(mode, target = null) {
        if (!this.camera) return;

        const oldMode = this.mode;
        this.mode = mode;

        switch (mode) {
            case 'orbit':
                this.setOrbitMode();
                break;
            case 'firstPerson':
                this.setFirstPersonMode(target);
                break;
            case 'follow':
                this.setFollowMode(target);
                break;
            default:
                console.warn(`[Camera] Unknown mode: ${mode}`);
                this.mode = oldMode;
        }

        console.log(`[Camera] Mode changed: ${oldMode} -> ${mode}`);
    }

    /**
     * 轨道模式
     */
    setOrbitMode() {
        if (!this.controls) return;

        const settings = this.modeSettings.orbit;
        
        this.camera.fov = settings.fov;
        this.camera.updateProjectionMatrix();
        this.camera.position.copy(settings.position);

        this.controls.enabled = true;
        this.controls.enableRotate = true;
        this.controls.enableZoom = true;
        this.controls.enablePan = true;

        this.followTarget = null;
    }

    /**
     * 第一人称模式
     */
    setFirstPersonMode(target = null) {
        if (!this.camera) return;

        const settings = this.modeSettings.firstPerson;

        this.camera.fov = settings.fov;
        this.camera.updateProjectionMatrix();

        // 设置位置到目标
        if (target) {
            this.camera.position.set(
                target.position.x,
                settings.height,
                target.position.z
            );
        }

        // 第一人称只能水平旋转
        if (this.controls) {
            this.controls.enabled = true;
            this.controls.enableRotate = true;
            this.controls.enableZoom = false;
            this.controls.enablePan = false;
            this.controls.minPolarAngle = Math.PI / 2 - 0.1;
            this.controls.maxPolarAngle = Math.PI / 2 + 0.1;
        }

        this.followTarget = target;
    }

    /**
     * 跟随模式
     */
    setFollowMode(target = null) {
        if (!this.camera) return;

        const settings = this.modeSettings.follow;

        this.camera.fov = settings.fov;
        this.camera.updateProjectionMatrix();

        if (this.controls) {
            this.controls.enabled = true;
            this.controls.enableRotate = false;
            this.controls.enableZoom = true;
            this.controls.enablePan = false;
        }

        this.followTarget = target;
    }

    /**
     * 更新跟随
     */
    updateFollow() {
        if (this.mode !== 'follow' || !this.followTarget) return;

        const settings = this.modeSettings.follow;
        
        // 计算跟随位置
        const targetPos = this.followTarget.position;
        
        // 相机在目标后上方
        this.camera.position.set(
            targetPos.x + settings.distance,
            targetPos.y + settings.height,
            targetPos.z + settings.distance
        );

        // 朝向目标
        this.camera.lookAt(targetPos);
    }

    /**
     * 看向指定点
     */
    lookAt(point) {
        if (!this.camera) return;
        this.camera.lookAt(point);
    }

    /**
     * 设置位置
     */
    setPosition(x, y, z) {
        if (!this.camera) return;
        this.camera.position.set(x, y, z);
    }

    /**
     * 获取位置
     */
    getPosition() {
        return this.camera?.position.clone() || new THREE.Vector3();
    }

    /**
     * 缩放到指定目标
     */
    zoomTo(target, distance = 10) {
        if (!this.camera || !target) return;

        // 计算相机位置（在目标后上方）
        const offset = new THREE.Vector3(distance, distance * 0.5, distance);
        this.camera.position.copy(target.position).add(offset);
        
        if (this.controls) {
            this.controls.target.copy(target.position);
        }
    }

    /**
     * 获取当前模式
     */
    getMode() {
        return this.mode;
    }

    /**
     * 是否启用控制
     */
    setEnabled(enabled) {
        if (this.controls) {
            this.controls.enabled = enabled;
        }
    }

    /**
     * 销毁
     */
    dispose() {
        if (this.controls) {
            this.controls.dispose();
            this.controls = null;
        }
        this.camera = null;
        this.initialized = false;
    }
}

// 导出单例
const cameraManager = new CameraManager();

export default cameraManager;
export { CameraManager };
