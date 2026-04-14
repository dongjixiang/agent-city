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
    
    // 创建多个云朵分布在天空
    const cloudPositions = [
        { x: -80, y: 60, z: -60 },
        { x: 60, y: 70, z: -40 },
        { x: -40, y: 55, z: 50 },
        { x: 90, y: 65, z: 30 },
        { x: 0, y: 75, z: -80 },
        { x: -70, y: 68, z: 20 },
        { x: 50, y: 58, z: 70 },
        { x: 30, y: 72, z: -20 },
        { x: -30, y: 62, z: -50 },
        { x: 80, y: 78, z: -60 }
    ];
    
    cloudPositions.forEach((pos, index) => {
        const cloud = createSingleCloud();
        cloud.position.set(pos.x, pos.y, pos.z);
        cloud.scale.setScalar(1.5 + Math.random() * 1);
        cloudGroup.add(cloud);
    });
    
    scene.add(cloudGroup);
    return cloudGroup;
}

/**
 * 创建单朵云（由多个球体组成）
 */
function createSingleCloud() {
    const cloud = new THREE.Group();
    
    // 云的材质
    const cloudMat = new THREE.MeshLambertMaterial({
        color: 0xeeeeee,
        transparent: true,
        opacity: 0.9,
        depthWrite: false
    });
    
    // 中心大球
    const centerGeo = new THREE.SphereGeometry(8, 8, 8);
    const center = new THREE.Mesh(centerGeo, cloudMat);
    cloud.add(center);
    
    // 周围小球
    const puffPositions = [
        { x: 8, y: 2, z: 0, s: 5 },
        { x: -8, y: 1, z: 2, s: 6 },
        { x: 4, y: 4, z: 5, s: 5 },
        { x: -5, y: 3, z: -4, s: 4 },
        { x: 2, y: -1, z: -6, s: 5 },
        { x: -3, y: -2, z: 5, s: 4 },
        { x: 10, y: 0, z: 3, s: 4 },
        { x: -10, y: 2, z: -2, s: 3 }
    ];
    
    puffPositions.forEach(puff => {
        const geo = new THREE.SphereGeometry(puff.s, 7, 7);
        const mesh = new THREE.Mesh(geo, cloudMat);
        mesh.position.set(puff.x, puff.y, puff.z);
        cloud.add(mesh);
    });
    
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
    if (clouds) {
        clouds.visible = (weather === WeatherType.CLOUDY);
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
