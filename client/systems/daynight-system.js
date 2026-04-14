/**
 * DayNightSystem - 昼夜系统
 * 
 * 控制游戏内时间流逝和日夜循环
 * 对应 DESIGN.md Section 5.4 日夜系统
 */

import * as THREE from 'three';
import { eventBus, Events } from '../core/event-bus.js';

/**
 * 线性插值颜色
 */
function lerpColor(color1, color2, t) {
    const c1 = new THREE.Color(color1);
    const c2 = new THREE.Color(color2);
    c1.lerp(c2, Math.max(0, Math.min(1, t)));
    return c1.getHex();
}

class DayNightSystem {
    constructor() {
        // 10 real minutes = 24 virtual hours
        this.timeScale = 144;
        
        // 根据实际当前时间计算虚拟时间
        // 把当前10分钟窗口映射到虚拟24小时
        const now = new Date();
        const minute = now.getMinutes();
        const second = now.getSeconds();
        
        // 计算当前10分钟窗口内过了多少秒
        const secondsInBlock = (minute % 10) * 60 + second;
        const blockTotalSeconds = 10 * 60; // 10分钟 = 600秒
        
        // 在10分钟窗口内的比例映射到24小时
        // 0秒 → 0:00, 300秒 → 12:00, 600秒 → 24:00
        this.currentHour = (secondsInBlock / blockTotalSeconds) * 24;
        this.dayNumber = 1;
        
        this.phases = {
            night: { start: 21, end: 5, sky: 0x1a237e, ambient: 0x3949ab, sunIntensity: 0.05, ambientIntensity: 0.2 },
            dawn: { start: 5, end: 6, sky: 0xff7043, ambient: 0xffcc80, sunIntensity: 0.5, ambientIntensity: 0.5 },
            sunrise: { start: 6, end: 7, sky: 0xffa726, ambient: 0xffeb3b, sunIntensity: 0.8, ambientIntensity: 0.7 },
            morning: { start: 7, end: 9, sky: 0x87ceeb, ambient: 0xffffff, sunIntensity: 1.0, ambientIntensity: 0.8 },
            forenoon: { start: 9, end: 12, sky: 0x87ceeb, ambient: 0xffffff, sunIntensity: 1.0, ambientIntensity: 0.8 },
            afternoon: { start: 12, end: 17, sky: 0x87ceeb, ambient: 0xffffff, sunIntensity: 1.0, ambientIntensity: 0.8 },
            evening: { start: 17, end: 19, sky: 0xffa726, ambient: 0xffcc80, sunIntensity: 0.7, ambientIntensity: 0.6 },
            dusk: { start: 19, end: 21, sky: 0xffa726, ambient: 0x3949ab, sunIntensity: 0.05, ambientIntensity: 0.2 }
        };
        
        // 建筑窗户灯光数组
        this.buildingLights = [];

        this.lighting = null;
        this.sky = null;
        this.isRunning = false;
    }

    /**
     * 初始化
     */
    init(scene, lighting) {
        this.scene = scene;
        
        // 如果没有提供 lighting 对象，尝试从场景中找到现有灯光
        if (lighting) {
            this.lighting = lighting;
        } else {
            // 从场景中查找灯光
            this.ambientLight = null;
            this.directionalLight = null;
            scene.traverse((obj) => {
                if (obj.type === 'AmbientLight' && !this.ambientLight) {
                    this.ambientLight = obj;
                } else if (obj.type === 'DirectionalLight' && !this.directionalLight) {
                    this.directionalLight = obj;
                }
            });
        }
        
        this.createSky();
        this.createBuildingLights(scene);
        this.updateForHour(this.currentHour);
        return this;
    }

    /**
     * 创建建筑窗户灯光
     */
    createBuildingLights(scene) {
        // 在主要建筑位置创建窗户灯光
        const lightPositions = [
            // 城市中心建筑群
            { x: 0, y: 8, z: 50, intensity: 1.0 },   // 图书馆
            { x: 27, y: 6, z: 74, intensity: 0.8 },  //  workshop
            { x: 0, y: 10, z: 75, intensity: 1.0 },  // 美术馆
            { x: 50, y: 8, z: 72, intensity: 0.9 },   // 档案馆
            { x: 74, y: 10, z: 72, intensity: 1.0 }, // 任务中心
            // 标志建筑
            { x: 40, y: 20, z: 35, intensity: 1.2 },  // 市政中心
            { x: 30, y: 15, z: 35, intensity: 0.8 }, // 市政北翼
            { x: 50, y: 15, z: 35, intensity: 0.8 }, // 市政南翼
            // 郊区建筑
            { x: -30, y: 6, z: -35, intensity: 0.7 }, // 技能学院
            { x: -50, y: 5, z: -50, intensity: 0.6 }, // 郊区
        ];
        
        lightPositions.forEach(pos => {
            // 创建点光源模拟窗户灯光
            const light = new THREE.PointLight(0xffaa44, 0, 15);
            light.position.set(pos.x, pos.y, pos.z);
            scene.add(light);
            
            // 创建窗户发光平面
            const windowGeo = new THREE.PlaneGeometry(2, 3);
            const windowMat = new THREE.MeshBasicMaterial({
                color: 0xffdd88,
                transparent: true,
                opacity: 0,
                side: THREE.DoubleSide
            });
            const windowMesh = new THREE.Mesh(windowGeo, windowMat);
            windowMesh.position.set(pos.x, pos.y, pos.z);
            windowMesh.rotation.y = Math.random() * Math.PI * 2;
            scene.add(windowMesh);
            
            this.buildingLights.push({
                light: light,
                material: windowMat,
                baseIntensity: pos.intensity
            });
        });
        
        console.log('[DayNight] Building lights created:', this.buildingLights.length);
    }
    
    /**
     * 创建天空
     */
    createSky() {
        // 简单天空球
        const skyGeo = new THREE.SphereGeometry(500, 32, 32);
        const skyMat = new THREE.MeshBasicMaterial({
            color: this.getPhaseColor('morning'),
            side: THREE.BackSide,
            depthWrite: false  // 确保天空始终在后面
        });
        this.sky = new THREE.Mesh(skyGeo, skyMat);
        this.scene.add(this.sky);
        console.log('[DayNight] Sky created, position:', this.sky.position);
        
        // 创建太阳
        const sunGeo = new THREE.SphereGeometry(8, 32, 32);
        const sunMat = new THREE.MeshBasicMaterial({ color: 0xffdd00 });
        this.sunMesh = new THREE.Mesh(sunGeo, sunMat);
        this.scene.add(this.sunMesh);
        
        // 创建月亮
        const moonGeo = new THREE.SphereGeometry(5, 32, 32);
        const moonMat = new THREE.MeshBasicMaterial({ color: 0xeeeeee });
        this.moonMesh = new THREE.Mesh(moonGeo, moonMat);
        this.scene.add(this.moonMesh);
        
        // 创建星空
        this.createStars();
    }
    
    /**
     * 创建星空
     */
    createStars() {
        const starCount = 500;
        const starPositions = new Float32Array(starCount * 3);
        
        for (let i = 0; i < starCount; i++) {
            // 分布在上半球
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI * 0.5;
            const r = 400 + Math.random() * 50;
            
            starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
            starPositions[i * 3 + 1] = r * Math.cos(phi) + 50;
            starPositions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
        }
        
        const starGeo = new THREE.BufferGeometry();
        starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
        
        const starMat = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 2,
            sizeAttenuation: true
        });
        
        this.stars = new THREE.Points(starGeo, starMat);
        this.scene.add(this.stars);
        console.log('[DayNight] Stars created');
    }
    
    /**
     * 更新太阳和月亮位置
     */
    updateSunAndMoon() {
        if (!this.sunMesh || !this.moonMesh) return;
        
        const radius = 200;
        
        // 太阳角度：6点在地平线，12点在天顶，18点在地平线
        const sunAngle = ((this.currentHour - 6) / 12) * Math.PI;
        const sunX = Math.cos(sunAngle) * radius;
        const sunY = Math.sin(sunAngle) * radius;
        
        // 月亮与太阳相差12小时
        const moonAngle = sunAngle + Math.PI;
        const moonX = Math.cos(moonAngle) * radius;
        const moonY = Math.sin(moonAngle) * radius;
        
        // 只显示在地平线以上的
        if (sunY > 0) {
            this.sunMesh.position.set(sunX, sunY, 0);
            this.sunMesh.visible = true;
        } else {
            this.sunMesh.visible = false;
        }
        
        if (moonY > 0) {
            this.moonMesh.position.set(moonX, moonY, 0);
            this.moonMesh.visible = true;
        } else {
            this.moonMesh.visible = false;
        }
        
        // 更新方向光位置（模拟太阳位置）
        if (this.directionalLight) {
            this.directionalLight.position.x = Math.cos(sunAngle) * 50;
            this.directionalLight.position.y = Math.max(5, Math.sin(sunAngle) * 80);
        }
        
        // 星空：夜间可见，白天隐藏
        if (this.stars) {
            this.stars.visible = (sunY <= 0);
        }
    }

    /**
     * 更新（每帧）
     */
    update(deltaTime) {
        if (!this.isRunning) return;

        // 增加游戏时间
        this.currentHour += (deltaTime * this.timeScale) / 3600;
        
        // 超过24小时
        if (this.currentHour >= 24) {
            this.currentHour -= 24;
            this.dayNumber++;
            eventBus.emit('day:new', { dayNumber: this.dayNumber });
        }

        // 每帧都更新颜色（实现平滑渐变）
        this.applySmoothColors();
        
        // 检查阶段变化（用于事件通知）
        const newPhase = this.getCurrentPhase();
        if (this._lastPhase !== newPhase) {
            this._lastPhase = newPhase;
            eventBus.emit(Events.DAY_NIGHT_CHANGE, { phase: newPhase, hour: this.currentHour });
        }
        
        // 更新太阳和月亮位置
        this.updateSunAndMoon();
        
        // 暴露虚拟时间给UI
        window.virtualHour = this.currentHour;
        window.dayNumber = this.dayNumber;
    }
    
    /**
     * 平滑应用颜色（每帧调用）
     */
    applySmoothColors() {
        const colors = this.calculateColorsForHour(this.currentHour);

        // 更新天空
        if (this.sky) {
            this.sky.material.color.setHex(colors.skyColor);
        }

        // 更新场景背景
        if (this.scene && this.scene.background) {
            this.scene.background.setHex(colors.skyColor);
        }

        // 更新灯光
        if (this.ambientLight) {
            this.ambientLight.color.setHex(colors.ambientColor);
            this.ambientLight.intensity = colors.ambientIntensity;
        }
        if (this.directionalLight) {
            this.directionalLight.intensity = colors.sunIntensity;
        }
        
        // 更新建筑灯光（夜间亮起，白天熄灭）
        this.updateBuildingLights();
    }
    
    /**
     * 更新建筑灯光
     */
    updateBuildingLights() {
        if (this.buildingLights.length === 0) return;
        
        // 计算建筑灯光强度：夜间(21-5点)全亮，黄昏/黎明渐变，白天熄灭
        let lightIntensity;
        if (this.currentHour >= 21 || this.currentHour < 5) {
            // 深夜：全亮
            lightIntensity = 1.0;
        } else if (this.currentHour >= 19 && this.currentHour < 21) {
            // 黄昏：渐变
            lightIntensity = (this.currentHour - 19) / 2;
        } else if (this.currentHour >= 5 && this.currentHour < 7) {
            // 黎明：渐灭
            lightIntensity = 1 - (this.currentHour - 5) / 2;
        } else {
            // 白天：熄灭
            lightIntensity = 0;
        }
        
        this.buildingLights.forEach(item => {
            item.light.intensity = item.baseIntensity * lightIntensity * 0.8;
            item.material.opacity = lightIntensity * 0.9;
        });
    }

    /**
     * 获取当前阶段
     */
    getCurrentPhase() {
        if (this.currentHour >= 21 || this.currentHour < 5) return 'night';
        if (this.currentHour >= 5 && this.currentHour < 6) return 'dawn';
        if (this.currentHour >= 6 && this.currentHour < 7) return 'sunrise';
        if (this.currentHour >= 7 && this.currentHour < 9) return 'morning';
        if (this.currentHour >= 9 && this.currentHour < 12) return 'forenoon';
        if (this.currentHour >= 12 && this.currentHour < 17) return 'afternoon';
        if (this.currentHour >= 17 && this.currentHour < 19) return 'evening';
        if (this.currentHour >= 19 && this.currentHour < 21) return 'dusk';
        return 'night';
    }
    
    /**
     * 获取虚拟小时 (0-23.99)
     */
    getVirtualHour() {
        return this.currentHour;
    }

    /**
     * 获取阶段颜色
     */
    getPhaseColor(phase) {
        return this.phases[phase]?.sky || 0x87ceeb;
    }

    /**
     * 计算当前小时的颜色（带插值）
     */
    calculateColorsForHour(hour) {
        let skyColor, ambientColor, sunIntensity, ambientIntensity;
        
        if (hour >= 21 || hour < 5) {
            // 深夜 - 深蓝色
            const t = hour >= 21 ? (hour - 21) / 6 : (hour + 3) / 6;
            skyColor = lerpColor(0x1a237e, 0x1a237e, t);
            ambientColor = lerpColor(0x3949ab, 0x3949ab, t);
            sunIntensity = 0.05;
            ambientIntensity = 0.2;
        } else if (hour >= 5 && hour < 6) {
            // 黎明 - 深蓝过渡到橙红
            const t = (hour - 5);
            skyColor = lerpColor(0x1a237e, 0xff7043, t);
            ambientColor = lerpColor(0x3949ab, 0xffcc80, t);
            sunIntensity = 0.1 + t * 0.4;
            ambientIntensity = 0.2 + t * 0.3;
        } else if (hour >= 6 && hour < 7) {
            // 日出 - 橙红到橙黄
            const t = (hour - 6);
            skyColor = lerpColor(0xff7043, 0xffa726, t);
            ambientColor = lerpColor(0xffcc80, 0xffeb3b, t);
            sunIntensity = 0.5 + t * 0.3;
            ambientIntensity = 0.5 + t * 0.2;
        } else if (hour >= 7 && hour < 9) {
            // 早晨 - 橙黄过渡到蓝色
            const t = (hour - 7) / 2;
            skyColor = lerpColor(0xffa726, 0x87ceeb, t);
            ambientColor = lerpColor(0xffeb3b, 0xffffff, t);
            sunIntensity = 0.8 + t * 0.2;
            ambientIntensity = 0.7 + t * 0.1;
        } else if (hour >= 9 && hour < 12) {
            // 上午 - 蓝色
            skyColor = 0x87ceeb;
            ambientColor = 0xffffff;
            sunIntensity = 1.0;
            ambientIntensity = 0.8;
        } else if (hour >= 12 && hour < 17) {
            // 下午 - 蓝色
            skyColor = 0x87ceeb;
            ambientColor = 0xffffff;
            sunIntensity = 1.0;
            ambientIntensity = 0.8;
        } else if (hour >= 17 && hour < 19) {
            // 傍晚 - 蓝色过渡到橙色
            const t = (hour - 17) / 2;
            skyColor = lerpColor(0x87ceeb, 0xffa726, t);
            ambientColor = lerpColor(0xffffff, 0xffcc80, t);
            sunIntensity = 1.0 - t * 0.3;
            ambientIntensity = 0.8 - t * 0.2;
        } else {
            // 黄昏 19:00-21:00 - 橙色过渡到深蓝
            const t = (hour - 19) / 2;
            skyColor = lerpColor(0xffa726, 0x1a237e, t);
            ambientColor = lerpColor(0xffcc80, 0x3949ab, t);
            sunIntensity = 0.7 - t * 0.65;
            ambientIntensity = 0.6 - t * 0.4;
        }
        
        return { skyColor, ambientColor, sunIntensity, ambientIntensity };
    }

    /**
     * 更新阶段（仅用于日志记录）
     */
    updateForPhase(phase) {
        console.log(`[DayNight] Phase changed to ${phase} (${this.currentHour.toFixed(1)}h)`);
    }

    /**
     * 更新到指定小时
     */
    updateForHour(hour) {
        this.currentHour = hour;
        const phase = this.getCurrentPhase();
        this.updateForPhase(phase);
    }

    /**
     * 获取时间字符串
     */
    getTimeString() {
        const hour = Math.floor(this.currentHour);
        const minute = Math.floor((this.currentHour % 1) * 60);
        return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    }

    /**
     * 获取昼夜描述
     */
    getPhaseDescription() {
        const phase = this.getCurrentPhase();
        const descriptions = {
            night: '🌙 深夜 - 万家灯火',
            dawn: '🌅 黎明 - 朝霞满天',
            sunrise: '🌄 日出 - 旭日东升',
            morning: '☀️ 早晨 - 温暖橙黄',
            forenoon: '🌤️ 上午 - 蓝天白云',
            afternoon: '☀️ 下午 - 阳光明媚',
            evening: '🌆 傍晚 - 夕阳西下',
            dusk: '🌃 黄昏 - 暮色渐浓'
        };
        return descriptions[phase] || descriptions.morning;
    }

    /**
     * 开始
     */
    start() {
        this.isRunning = true;
    }

    /**
     * 暂停
     */
    pause() {
        this.isRunning = false;
    }

    /**
     * 设置时间倍率
     */
    setTimeScale(scale) {
        this.timeScale = scale;
    }

    /**
     * 设置具体时间
     */
    setTime(hour) {
        this.currentHour = hour;
        const phase = this.getCurrentPhase();
        this.updateForPhase(phase);
    }

    /**
     * 获取状态
     */
    getStatus() {
        return {
            hour: this.currentHour,
            timeString: this.getTimeString(),
            phase: this.getCurrentPhase(),
            description: this.getPhaseDescription(),
            dayNumber: this.dayNumber
        };
    }

    /**
     * 销毁
     */
    dispose() {
        if (this.sky) {
            this.scene.remove(this.sky);
            this.sky.geometry.dispose();
            this.sky.material.dispose();
        }
    }
}

const dayNightSystem = new DayNightSystem();

export { DayNightSystem, dayNightSystem };
