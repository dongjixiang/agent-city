/**
 * @fileoverview 昼夜循环系统
 * 
 * 职责：
 * - 跟踪时间（dawn/day/evening/night）
 * - 控制太阳/月亮位置
 * - 调整灯光和氛围
 * - 创建星星
 * 
 * 使用方式：
 *   import { setupDayNightCycle } from './systems/day-night.js';
 *   setupDayNightCycle(scene);
 * 
 * 导出：
 * - window.currentDayPhase
 * 
 * @module systems/day-night
 */

import * as THREE from 'three';

// 时段类型
export const DayPhase = {
    DAWN: 'dawn',
    DAY: 'day',
    EVENING: 'evening',
    NIGHT: 'night'
};

// 时段配置
const PHASE_CONFIGS = {
    [DayPhase.DAWN]: {
        skyColor: 0xffa07a,
        fogColor: 0xffa07a,
        sunIntensity: 0.6,
        ambientIntensity: 0.4,
        ambientColor: 0xffccaa
    },
    [DayPhase.DAY]: {
        skyColor: 0x87ceeb,
        fogColor: 0x87ceeb,
        sunIntensity: 1.0,
        ambientIntensity: 0.5,
        ambientColor: 0xffffff
    },
    [DayPhase.EVENING]: {
        skyColor: 0xff6b6b,
        fogColor: 0xff6b6b,
        sunIntensity: 0.7,
        ambientIntensity: 0.3,
        ambientColor: 0xffaa66
    },
    [DayPhase.NIGHT]: {
        skyColor: 0x1a1a3e,
        fogColor: 0x1a1a3e,
        sunIntensity: 0.2,
        ambientIntensity: 0.2,
        ambientColor: 0x334466
    }
};

// 状态
let currentPhase = DayPhase.DAY;
let sunLight = null;
let ambientLight = null;
let sunMesh = null;
let moonMesh = null;
let stars = null;
let scene = null;
let clock = null;

// 时间配置
const DAY_DURATION = 120; // 一天多少秒
const PHASE_THRESHOLDS = {
    [DayPhase.DAWN]: 0.0,    // 0-6点
    [DayPhase.DAY]: 0.25,    // 6-18点  
    [DayPhase.EVENING]: 0.75, // 18-21点
    [DayPhase.NIGHT]: 0.875   // 21-24点
};

/**
 * 初始化昼夜循环
 * @param {THREE.Scene} sceneParam
 */
export function setupDayNightCycle(sceneParam) {
    scene = sceneParam;
    clock = new THREE.Clock();

    // 查找或创建灯光
    scene.traverse((obj) => {
        if (obj.type === 'DirectionalLight' && obj !== sunLight) {
            sunLight = obj;
        } else if (obj.type === 'AmbientLight' && obj !== ambientLight) {
            ambientLight = obj;
        }
    });

    // 创建默认灯光
    if (!sunLight) {
        sunLight = new THREE.DirectionalLight(0xffffff, 1);
        sunLight.position.set(50, 50, 50);
        scene.add(sunLight);
    }

    if (!ambientLight) {
        ambientLight = new THREE.AmbientLight(0x404040, 0.5);
        scene.add(ambientLight);
    }

    // 创建太阳和月亮
    createSunAndMoon();

    // 创建星星
    createStars();

    // 开始更新循环
    setInterval(updateLighting, 1000);

    // 设置初始时段
    setDayPhase(DayPhase.DAY);

    console.log('[DayNight] Day/night cycle started');
}

/**
 * 创建太阳和月亮
 */
function createSunAndMoon() {
    // 太阳
    const sunGeo = new THREE.SphereGeometry(5, 16, 16);
    const sunMat = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    sunMesh = new THREE.Mesh(sunGeo, sunMat);
    sunMesh.position.set(100, 80, 0);
    scene.add(sunMesh);

    // 月亮
    const moonGeo = new THREE.SphereGeometry(3, 16, 16);
    const moonMat = new THREE.MeshBasicMaterial({ color: 0xeeeeee });
    moonMesh = new THREE.Mesh(moonGeo, moonMat);
    moonMesh.position.set(-100, 80, 0);
    scene.add(moonMesh);
}

/**
 * 创建星星
 */
function createStars() {
    const starCount = 500;
    const positions = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(Math.random() * 2 - 1);
        const r = 200 + Math.random() * 100;

        positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = Math.abs(r * Math.cos(phi)); // 只在上半球
        positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }

    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const starMat = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.5,
        sizeAttenuation: true
    });

    stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);
}

/**
 * 更新灯光（每秒调用）
 */
function updateLighting() {
    if (!clock) return;

    const elapsed = clock.getElapsedTime();
    const dayProgress = (elapsed % DAY_DURATION) / DAY_DURATION;

    // 根据时间确定时段
    let newPhase;
    if (dayProgress < PHASE_THRESHOLDS[DayPhase.DAWN] + 0.125) {
        newPhase = DayPhase.DAWN;
    } else if (dayProgress < PHASE_THRESHOLDS[DayPhase.EVENING]) {
        newPhase = DayPhase.DAY;
    } else if (dayProgress < PHASE_THRESHOLDS[DayPhase.NIGHT]) {
        newPhase = DayPhase.EVENING;
    } else {
        newPhase = DayPhase.NIGHT;
    }

    // 时段变化时更新
    if (newPhase !== currentPhase) {
        setDayPhase(newPhase);
    }

    // 更新太阳/月亮位置
    const sunAngle = dayProgress * Math.PI * 2 - Math.PI / 2;
    const sunRadius = 100;
    sunMesh.position.x = Math.cos(sunAngle) * sunRadius;
    sunMesh.position.y = Math.sin(sunAngle) * sunRadius;
    sunMesh.visible = currentPhase !== DayPhase.NIGHT;

    // 月亮相对于太阳
    moonMesh.position.x = -sunMesh.position.x;
    moonMesh.position.y = -sunMesh.position.y + 20;
    moonMesh.visible = currentPhase === DayPhase.NIGHT || currentPhase === DayPhase.DAWN;

    // 星星在夜间可见
    if (stars) {
        stars.visible = currentPhase === DayPhase.NIGHT;
    }

    // 更新太阳光方向
    if (sunLight) {
        sunLight.position.copy(sunMesh.position);
        sunLight.target.position.set(0, 0, 0);
    }
}

/**
 * 设置时段
 * @param {string} phase
 */
export function setDayPhase(phase) {
    currentPhase = phase;
    window.currentDayPhase = phase;

    const config = PHASE_CONFIGS[phase];
    if (!config) return;

    // 应用配置
    if (scene) {
        scene.background = new THREE.Color(config.skyColor);
        if (scene.fog) {
            scene.fog.color.setHex(config.fogColor);
        }
    }

    if (sunLight) {
        sunLight.intensity = config.sunIntensity;
    }

    if (ambientLight) {
        ambientLight.intensity = config.ambientIntensity;
        ambientLight.color.setHex(config.ambientColor);
    }

    console.log('[DayNight] Phase changed to:', phase);
}

/**
 * 获取当前时段
 */
export function getCurrentPhase() {
    return currentPhase;
}

// 挂载到 window
window.currentDayPhase = currentPhase;

export default { DayPhase, setupDayNightCycle, setDayPhase, getCurrentPhase };
