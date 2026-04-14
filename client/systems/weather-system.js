/**
 * @fileoverview 天气系统
 * 
 * 职责：
 * - 天气状态管理（sunny/cloudy/rainy/snowy）
 * - 雨滴和雪花粒子效果
 * - 天气变化广播
 * 
 * 使用方式：
 *   import { initWeather } from './systems/weather.js';
 *   initWeather(scene);
 * 
 * 导出：
 * - window.getCurrentWeather
 * - window.setWeather
 * - window.toggleWeather
 * - window.updateWeatherParticles
 * 
 * @module systems/weather
 */

import * as THREE from 'three';

// 天气类型
export const WeatherType = {
    SUNNY: 'sunny',
    CLOUDY: 'cloudy',
    RAINY: 'rainy',
    SNOWY: 'snowy'
};

let camera = null;

// 天气配置
const weatherConfigs = {
    sunny: { skyColor: 0x87ceeb, fogColor: 0x87ceeb, particleColor: null },
    cloudy: { skyColor: 0x778899, fogColor: 0x667788, particleColor: null },
    rainy: { skyColor: 0x334455, fogColor: 0x334455, particleColor: 0x6688aa },
    snowy: { skyColor: 0x8899aa, fogColor: 0x8899aa, particleColor: 0xffffff }
};

// 状态
let currentWeather = WeatherType.SUNNY;
let weatherTransitioning = false;
let weatherAlpha = 1;
let scene = null;  // Three.js scene reference

// 粒子对象
let raindrops = null;
let snowflakes = null;
let weatherParticles = null;

// 云朵对象
let clouds = null;

// 音频相关
let weatherAudioContext = null;
let weatherGainNode = null;
let currentWeatherSound = null;

/**
 * 初始化天气系统
 * @param {THREE.Scene} scene - Three.js 场景
 * @param {Object} options - 配置选项
 */
export function initWeather(sceneRef, options = {}) {
    console.log('[Weather] Initializing weather system...');
    scene = sceneRef;
    camera = options.camera || null;

    createWeatherParticles(scene);
    initWeatherSounds();

    // 应用初始天气
    setWeather(WeatherType.SUNNY);
    
    // 启动天气自动变化（每30-60秒变化一次）
    setInterval(() => {
        toggleWeather();
    }, 30000 + Math.random() * 30000);

    console.log('[Weather] Weather system ready');
}

/**
 * 创建天气粒子
 * @param {THREE.Scene} scene
 */
function createWeatherParticles(scene) {
    // 雨滴粒子 - 大幅增加密度
    const rainCount = 8000;
    const rainPos = new Float32Array(rainCount * 3);

    for (let i = 0; i < rainCount; i++) {
        // 扩大范围覆盖整个城市区域
        rainPos[i * 3] = Math.random() * 200 - 100;
        rainPos[i * 3 + 1] = Math.random() * 100 + 20;
        rainPos[i * 3 + 2] = Math.random() * 200 - 100;
    }

    const rainGeo = new THREE.BufferGeometry();
    rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPos, 3));

    const rainMat = new THREE.PointsMaterial({
        color: 0x6688aa,
        size: 0.25,
        transparent: true,
        opacity: 0.5,
        sizeAttenuation: true
    });

    raindrops = new THREE.Points(rainGeo, rainMat);
    raindrops.visible = false;
    raindrops.name = 'rain';
    scene.add(raindrops);

    // 雪花粒子 - 大幅增加密度
    const snowCount = 4000;
    const snowPos = new Float32Array(snowCount * 3);

    for (let i = 0; i < snowCount; i++) {
        snowPos[i * 3] = Math.random() * 200 - 100;
        snowPos[i * 3 + 1] = Math.random() * 100 + 20;
        snowPos[i * 3 + 2] = Math.random() * 200 - 100;
    }

    const snowGeo = new THREE.BufferGeometry();
    snowGeo.setAttribute('position', new THREE.BufferAttribute(snowPos, 3));

    const snowMat = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.35,
        transparent: true,
        opacity: 0.8,
        sizeAttenuation: true
    });

    snowflakes = new THREE.Points(snowGeo, snowMat);
    snowflakes.visible = false;
    snowflakes.name = 'snow';
    scene.add(snowflakes);

    // 创建云朵
    clouds = createClouds(scene);

    weatherParticles = { rain: raindrops, snow: snowflakes };

    console.log('[Weather] Weather particles created');
}

/**
 * 创建云朵
 * @param {THREE.Scene} scene
 */
function createClouds(scene) {
    const cloudGroup = new THREE.Group();
    cloudGroup.name = 'clouds';
    cloudGroup.visible = false;
    
    // 多云时少量云朵，雨雪天更多更密
    // 晴天无云
    const cloudPositions = [
        // 中心区域
        { x: 0, y: 120, z: 0, s: 1.5 },
        { x: 50, y: 125, z: 30, s: 2 },
        { x: -50, y: 120, z: -30, s: 1.8 },
        { x: 30, y: 130, z: -50, s: 2.2 },
        { x: -30, y: 125, z: 50, s: 1.6 },
        // 边缘区域
        { x: 80, y: 115, z: 60, s: 2.5 },
        { x: -80, y: 120, z: 40, s: 2 },
        { x: 60, y: 130, z: -70, s: 1.8 },
        { x: -60, y: 115, z: -60, s: 2.2 },
        // 远距离
        { x: 100, y: 125, z: 0, s: 2 },
        { x: -100, y: 120, z: 20, s: 2.5 },
        { x: 0, y: 135, z: 90, s: 1.8 },
        { x: 20, y: 115, z: -90, s: 2 },
    ];
    
    cloudPositions.forEach((pos) => {
        const cloud = createSingleCloud();
        cloud.position.set(pos.x, pos.y, pos.z);
        cloud.scale.setScalar(pos.s);
        cloudGroup.add(cloud);
    });
    
    scene.add(cloudGroup);
    return cloudGroup;
}

/**
 * 创建单朵云（使用扁平化椭圆球体，更自然）
 */
function createSingleCloud() {
    const cloud = new THREE.Group();
    
    // 云的整体形状更扁平宽大
    const cloudMat = new THREE.MeshLambertMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.85,
        depthWrite: false,
        side: THREE.DoubleSide
    });
    
    // 使用椭球体创建更自然的云形
    // 底层 - 扁平椭圆
    const baseGeo = new THREE.SphereGeometry(10, 12, 8);
    baseGeo.scale(2, 0.5, 1.5);
    const base = new THREE.Mesh(baseGeo, cloudMat);
    cloud.add(base);
    
    // 中层 - 左侧
    const leftGeo = new THREE.SphereGeometry(7, 10, 7);
    leftGeo.scale(1.5, 0.6, 1.2);
    const left = new THREE.Mesh(leftGeo, cloudMat);
    left.position.set(-8, 1, 2);
    cloud.add(left);
    
    // 中层 - 右侧
    const rightGeo = new THREE.SphereGeometry(6, 10, 7);
    rightGeo.scale(1.3, 0.5, 1.1);
    const right = new THREE.Mesh(rightGeo, cloudMat);
    right.position.set(7, 0.5, -2);
    cloud.add(right);
    
    // 顶层 - 中心隆起
    const topGeo = new THREE.SphereGeometry(5, 10, 8);
    topGeo.scale(1.2, 0.7, 1);
    const top = new THREE.Mesh(topGeo, cloudMat);
    top.position.set(-2, 2.5, 0);
    cloud.add(top);
    
    // 前部凸起
    const frontGeo = new THREE.SphereGeometry(4, 8, 6);
    frontGeo.scale(1, 0.4, 0.8);
    const front = new THREE.Mesh(frontGeo, cloudMat);
    front.position.set(4, 1.5, 5);
    cloud.add(front);
    
    return cloud;
}

/**
 * 初始化天气音效
 */
function initWeatherSounds() {
    try {
        weatherAudioContext = new (window.AudioContext || window.webkitAudioContext)();
        weatherGainNode = weatherAudioContext.createGain();
        weatherGainNode.gain.value = 0.15;
        weatherGainNode.connect(weatherAudioContext.destination);

        console.log('[Weather Sound] Initialized');
    } catch (e) {
        console.error('[Weather Sound] Init failed:', e);
    }
}

/**
 * 获取当前天气
 */
export function getCurrentWeather() {
    return currentWeather;
}

/**
 * 设置天气
 * @param {string} weather - WeatherType
 */
export function setWeather(weather) {
    if (Object.values(WeatherType).indexOf(weather) < 0) {
        console.warn('[Weather] Unknown weather type:', weather);
        return;
    }

    currentWeather = weather;
    weatherTransitioning = false;
    weatherAlpha = 1;

    console.log('[Weather] Weather set to:', weather);

    // 更新云朵可见性
    // 晴天：无云
    // 多云：少量云
    // 雨天/雪天：云较密
    if (clouds) {
        clouds.visible = (weather !== WeatherType.SUNNY);
        // 多云时云朵较淡，雨雪时更明显
        clouds.traverse((obj) => {
            if (obj.material) {
                obj.material.opacity = (weather === WeatherType.CLOUDY) ? 0.6 : 0.85;
            }
        });
    }

    // 更新粒子
    if (weatherParticles) {
        updateWeatherParticles(1);
    }

    // 切换天气音效
    if (weatherAudioContext) {
        playWeatherSound(weather);
    }
}

/**
 * 切换天气
 */
export function toggleWeather() {
    const weathers = Object.values(WeatherType);
    const idx = weathers.indexOf(currentWeather);
    const nextIdx = (idx + 1) % weathers.length;
    console.log('[Weather] Toggling weather from', currentWeather, 'to', weathers[nextIdx]);
    setWeather(weathers[nextIdx]);
}

/**
 * 更新天气粒子
 * @param {number} deltaTime - 时间增量
 */
export function updateWeatherParticles(deltaTime) {
    if (!weatherParticles) return;

    const now = Date.now();

    // 计算 dt
    if (!window._weatherLastTime) window._weatherLastTime = now;
    let dt = (now - window._weatherLastTime) / 1000;
    window._weatherLastTime = now;
    if (dt > 0.1) dt = 0.016;

    // 获取相机位置作为粒子系统的中心
    let offsetX = 0, offsetZ = 0;
    if (camera) {
        offsetX = camera.position.x;
        offsetZ = camera.position.z;
    }

    // 更新雨滴
    if (currentWeather === WeatherType.RAINY || (weatherTransitioning && currentWeather === WeatherType.RAINY)) {
        if (!raindrops.visible) {
            raindrops.visible = true;
        }

        const positions = raindrops.geometry.attributes.position.array;
        const wind = Math.sin(now * 0.0005) * 2;

        for (let i = 0; i < positions.length / 3; i++) {
            positions[i * 3 + 1] -= (15 + Math.random() * 5) * dt;
            positions[i * 3] += (2 + wind) * dt;

            // 粒子落到地面后，在相机附近重新生成
            if (positions[i * 3 + 1] < camera?.position.y - 10 || positions[i * 3 + 1] < 0) {
                positions[i * 3 + 1] = (camera?.position.y || 50) + 50 + Math.random() * 30;
                positions[i * 3] = offsetX + Math.random() * 200 - 100;
                positions[i * 3 + 2] = offsetZ + Math.random() * 200 - 100;
            }
        }

        raindrops.geometry.attributes.position.needsUpdate = true;
    } else {
        if (raindrops.visible) {
            raindrops.visible = false;
        }
    }

    // 更新雪花
    if (currentWeather === WeatherType.SNOWY || (weatherTransitioning && currentWeather === WeatherType.SNOWY)) {
        if (!snowflakes.visible) {
            snowflakes.visible = true;
        }

        const positions = snowflakes.geometry.attributes.position.array;

        for (let i = 0; i < positions.length / 3; i++) {
            positions[i * 3 + 1] -= (2 + Math.random() * 2) * dt;
            positions[i * 3] += Math.sin(now * 0.001 + i) * 1.5 * dt;

            // 粒子落到地面后，在相机附近重新生成
            if (positions[i * 3 + 1] < camera?.position.y - 10 || positions[i * 3 + 1] < 0) {
                positions[i * 3 + 1] = (camera?.position.y || 50) + 50 + Math.random() * 30;
                positions[i * 3] = offsetX + Math.random() * 200 - 100;
                positions[i * 3 + 2] = offsetZ + Math.random() * 200 - 100;
            }
        }

        snowflakes.geometry.attributes.position.needsUpdate = true;
    } else {
        if (snowflakes.visible) {
            snowflakes.visible = false;
        }
    }
    
    // 更新云朵飘动
    updateCloudDrift(dt);
}

/**
 * 更新云朵飘动动画
 */
function updateCloudDrift(dt) {
    if (!clouds) return;
    
    const time = Date.now() * 0.0001; // 缓慢的飘动速度
    
    clouds.children.forEach((cloud, index) => {
        // 每个云有不同的飘动速度和方向
        const speed = 0.5 + (index % 3) * 0.3;
        const dir = index % 4;
        
        // 轻微的水平飘动
        if (dir === 0) {
            cloud.position.x += Math.sin(time + index) * speed * dt;
        } else if (dir === 1) {
            cloud.position.x -= Math.sin(time + index) * speed * dt;
        } else if (dir === 2) {
            cloud.position.z += Math.cos(time + index) * speed * dt;
        } else {
            cloud.position.z -= Math.cos(time + index) * speed * dt;
        }
        
        // 保持云在合理范围内（如果飘太远就重置）
        if (cloud.position.x > 150) cloud.position.x = -150;
        if (cloud.position.x < -150) cloud.position.x = 150;
        if (cloud.position.z > 150) cloud.position.z = -150;
        if (cloud.position.z < -150) cloud.position.z = 150;
        
        // 轻微的上下浮动
        cloud.position.y += Math.sin(time * 2 + index * 0.5) * 0.02 * dt;
    });
}

/**
 * 播放天气音效
 * @param {string} weather
 */
function playWeatherSound(weather) {
    // TODO: 实现天气音效播放
    console.log('[Weather Sound] Playing:', weather);
}

// 挂载到 window（兼容旧代码）
window.getCurrentWeather = getCurrentWeather;
window.setWeather = setWeather;
window.toggleWeather = toggleWeather;
window.updateWeatherParticles = updateWeatherParticles;

export default {
    WeatherType,
    initWeather,
    getCurrentWeather,
    setWeather,
    toggleWeather,
    updateWeatherParticles
};


// WeatherSystem wrapper class
export class WeatherSystem { start() { this.scene = this._scene; } init(scene, options) { this._scene = scene; initWeather(scene, options); } update(deltaTime) { updateWeatherParticles(deltaTime); } getCurrent() { return getCurrentWeather(); } toggle() { toggleWeather(); } setCamera(cam) { camera = cam; } }
