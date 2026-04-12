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

// 天气配置
const weatherConfigs = {
    sunny: { skyColor: 0x87ceeb, fogColor: 0x87ceeb, particleColor: null },
    cloudy: { skyColor: 0x666666, fogColor: 0x555555, particleColor: null },
    rainy: { skyColor: 0x334455, fogColor: 0x334455, particleColor: 0x6688aa },
    snowy: { skyColor: 0x8899aa, fogColor: 0x8899aa, particleColor: 0xffffff }
};

// 状态
let currentWeather = WeatherType.SUNNY;
let weatherTransitioning = false;
let weatherAlpha = 1;

// 粒子对象
let raindrops = null;
let snowflakes = null;
let weatherParticles = null;

// 音频相关
let weatherAudioContext = null;
let weatherGainNode = null;
let currentWeatherSound = null;

/**
 * 初始化天气系统
 * @param {THREE.Scene} scene - Three.js 场景
 * @param {Object} options - 配置选项
 */
export function initWeather(scene, options = {}) {
    console.log('[Weather] Initializing weather system...');

    createWeatherParticles(scene);
    initWeatherSounds();

    // 默认天气
    setWeather(WeatherType.SUNNY);

    console.log('[Weather] Weather system ready');
}

/**
 * 创建天气粒子
 * @param {THREE.Scene} scene
 */
function createWeatherParticles(scene) {
    // 雨滴粒子
    const rainCount = 800;
    const rainPos = new Float32Array(rainCount * 3);

    for (let i = 0; i < rainCount; i++) {
        rainPos[i * 3] = Math.random() * 60 - 30;
        rainPos[i * 3 + 1] = Math.random() * 40 + 10;
        rainPos[i * 3 + 2] = Math.random() * 60 - 30;
    }

    const rainGeo = new THREE.BufferGeometry();
    rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPos, 3));

    const rainMat = new THREE.PointsMaterial({
        color: 0x6688aa,
        size: 0.3,
        transparent: true,
        opacity: 0.6,
        sizeAttenuation: true
    });

    raindrops = new THREE.Points(rainGeo, rainMat);
    raindrops.visible = false;
    raindrops.name = 'rain';
    scene.add(raindrops);

    // 雪花粒子
    const snowCount = 600;
    const snowPos = new Float32Array(snowCount * 3);

    for (let i = 0; i < snowCount; i++) {
        snowPos[i * 3] = Math.random() * 60 - 30;
        snowPos[i * 3 + 1] = Math.random() * 40 + 10;
        snowPos[i * 3 + 2] = Math.random() * 60 - 30;
    }

    const snowGeo = new THREE.BufferGeometry();
    snowGeo.setAttribute('position', new THREE.BufferAttribute(snowPos, 3));

    const snowMat = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.4,
        transparent: true,
        opacity: 0.85,
        sizeAttenuation: true
    });

    snowflakes = new THREE.Points(snowGeo, snowMat);
    snowflakes.visible = false;
    snowflakes.name = 'snow';
    scene.add(snowflakes);

    weatherParticles = { rain: raindrops, snow: snowflakes };

    console.log('[Weather] Weather particles created');
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

            if (positions[i * 3 + 1] < 0) {
                positions[i * 3 + 1] = 35 + Math.random() * 15;
                positions[i * 3] = Math.random() * 60 - 30;
                positions[i * 3 + 2] = Math.random() * 60 - 30;
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

            if (positions[i * 3 + 1] < 0) {
                positions[i * 3 + 1] = 35 + Math.random() * 15;
                positions[i * 3] = Math.random() * 60 - 30;
                positions[i * 3 + 2] = Math.random() * 60 - 30;
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
