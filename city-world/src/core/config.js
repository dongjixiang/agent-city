/**
 * Config - 配置管理系统
 * 
 * 提供集中式配置管理
 * 对应 DESIGN.md Section 9.2 配置管理系统
 * 
 * 设计原则：
 * 1. 配置与代码分离
 * 2. 支持默认值
 * 3. 支持配置覆盖
 * 4. 支持分类配置
 */

class Config {
    constructor() {
        this._config = new Map();
        this._defaults = new Map();
        this._loaded = false;
    }

    /**
     * 设置默认值
     * @param {string|Object} key
     * @param {*} value
     */
    setDefault(key, value) {
        if (typeof key === 'object') {
            // 批量设置
            for (const [k, v] of Object.entries(key)) {
                this._defaults.set(k, v);
            }
        } else {
            this._defaults.set(key, value);
        }
    }

    /**
     * 设置配置值
     * @param {string} key
     * @param {*} value
     */
    set(key, value) {
        this._config.set(key, value);
    }

    /**
     * 获取配置值
     * @param {string} key
     * @param {*} defaultValue - 如果不存在返回此值
     * @returns {*}
     */
    get(key, defaultValue = undefined) {
        if (this._config.has(key)) {
            return this._config.get(key);
        }
        if (this._defaults.has(key)) {
            return this._defaults.get(key);
        }
        return defaultValue;
    }

    /**
     * 获取嵌套配置 (点号分隔)
     * @param {string} path - 如 'buildings.taskCenter.position.x'
     * @param {*} defaultValue
     * @returns {*}
     */
    getPath(path, defaultValue = undefined) {
        const parts = path.split('.');
        let current = this.get(parts[0]);
        
        for (let i = 1; i < parts.length; i++) {
            if (current == null || typeof current !== 'object') {
                return defaultValue;
            }
            current = current[parts[i]];
        }
        
        return current !== undefined ? current : defaultValue;
    }

    /**
     * 设置嵌套配置
     * @param {string} path
     * @param {*} value
     */
    setPath(path, value) {
        const parts = path.split('.');
        let current = this._config;
        
        for (let i = 0; i < parts.length - 1; i++) {
            if (typeof current[parts[i]] !== 'object') {
                current[parts[i]] = {};
            }
            current = current[parts[i]];
        }
        
        current[parts[parts.length - 1]] = value;
    }

    /**
     * 检查是否存在
     * @param {string} key
     * @returns {boolean}
     */
    has(key) {
        return this._config.has(key) || this._defaults.has(key);
    }

    /**
     * 删除配置
     * @param {string} key
     */
    delete(key) {
        this._config.delete(key);
    }

    /**
     * 获取所有配置
     * @returns {Object}
     */
    getAll() {
        const result = {};
        
        // 合并默认值
        for (const [key, value] of this._defaults) {
            result[key] = value;
        }
        
        // 覆盖配置
        for (const [key, value] of this._config) {
            result[key] = value;
        }
        
        return result;
    }

    /**
     * 加载配置
     * @param {Object|Config} config
     */
    load(config) {
        if (config instanceof Config) {
            // 合并另一个 Config
            for (const [key, value] of config._config) {
                this._config.set(key, value);
            }
        } else if (typeof config === 'object') {
            // 批量设置
            for (const [key, value] of Object.entries(config)) {
                this._config.set(key, value);
            }
        }
        this._loaded = true;
    }

    /**
     * 重置到默认值
     * @param {string} key - 可选，只重置特定key
     */
    reset(key = null) {
        if (key) {
            this._config.delete(key);
        } else {
            this._config.clear();
        }
    }

    /**
     * 是否已加载
     */
    isLoaded() {
        return this._loaded;
    }
}

// 全局配置单例
const config = new Config();

// ============ 默认配置 ============

// 世界配置
config.setDefault('world', {
    groundSize: 100,
    boundaryMargin: 2,
    maxAgents: 50,
    defaultWeather: 'clear'
});

// 地形配置
config.setDefault('terrain', {
    groundColor: 0x2a2a4a,
    gridColor: 0x444466,
    gridDivisions: 20,
    waterLevel: -10,
    showGrid: true
});

// 相机配置
config.setDefault('camera', {
    fov: 60,
    near: 0.1,
    far: 1000,
    orbitPosition: { x: 0, y: 50, z: 50 },
    followDistance: 8,
    followHeight: 4,
    firstPersonHeight: 1.5
});

// 灯光配置
config.setDefault('lighting', {
    ambientColor: 0x404060,
    ambientIntensity: 0.4,
    sunColor: 0xffffcc,
    sunIntensity: 1.0,
    fogColor: 0x1a1a2e,
    fogNear: 50,
    fogFar: 150
});

// 建筑配置 (DESIGN.md Section 5.1.9)
config.setDefault('buildings', {
    taskCenter: {
        name: '任务中心',
        position: { x: -25, z: -25 },
        color: 0x3498db,
        size: { width: 16, height: 15, depth: 16 }
    },
    reputationTower: {
        name: '声誉塔',
        position: { x: 25, z: -25 },
        color: 0xf1c40f,
        size: { width: 10, height: 33, depth: 10 }
    },
    tradingCenter: {
        name: '交易中心',
        position: { x: -25, z: 25 },
        color: 0x27ae60,
        size: { width: 15, height: 13, depth: 14 }
    },
    archive: {
        name: '档案馆',
        position: { x: 25, z: 25 },
        color: 0x8b4513,
        size: { width: 14, height: 13, depth: 14 }
    },
    messageStation: {
        name: '消息站',
        position: { x: 0, z: -35 },
        color: 0x9b59b6,
        size: { width: 10, height: 21, depth: 10 }
    },
    dataCenter: {
        name: '数据中心',
        position: { x: -35, z: 0 },
        color: 0x34495e,
        size: { width: 14, height: 8, depth: 10 }
    },
    creativeWorkshop: {
        name: '创意工坊',
        position: { x: 35, z: 0 },
        color: 0xe67e22,
        size: { width: 12, height: 15, depth: 15 }
    },
    skillAcademy: {
        name: '技能学院',
        position: { x: 0, z: 35 },
        color: 0x2980b9,
        size: { width: 10, height: 14, depth: 8 }
    }
});

// 地标配置
config.setDefault('landmarks', {
    fountain: {
        name: '中央喷泉',
        position: { x: 0, z: 0 },
        interactionRadius: 5
    }
});

// 装饰物生成配置
config.setDefault('decorations', {
    flowers: { count: 30, minRadius: 10, maxRadius: 50 },
    trees: { count: 20, minRadius: 15, maxRadius: 50 },
    lamps: { count: 15, radius: 20 },
    benches: { count: 10, minRadius: 15, maxRadius: 25 },
    bushes: { count: 15, minRadius: 10, maxRadius: 50 },
    rocks: { count: 12, range: 100 },
    fountains: { 
        count: 3, 
        positions: [
            { x: 0, z: 0 },
            { x: -40, z: -40 },
            { x: 40, z: 40 }
        ]
    }
});

// 生态配置
config.setDefault('ecology', {
    birds: {
        count: 12,
        minFlightRadius: 15,
        maxFlightRadius: 30,
        flightHeight: { min: 12, max: 20 },
        minSpeed: 0.3,
        maxSpeed: 0.5
    },
    butterflies: {
        count: 20,
        range: { x: 80, z: 80 },
        height: { min: 1, max: 4 }
    }
});

// 天气配置
config.setDefault('weather', {
    clear: { particleCount: 0 },
    rainy: { particleCount: 500, fallSpeed: 0.5 },
    snowy: { particleCount: 300, fallSpeed: 0.2 }
});

// 昼夜配置
config.setDefault('dayNight', {
    timeScale: 60, // 1秒 = 1分钟游戏时间
    startHour: 6,
    phases: {
        night: { start: 21, end: 6, ambientIntensity: 0.1 },
        dawn: { start: 6, end: 8, ambientIntensity: 0.4 },
        morning: { start: 8, end: 12, ambientIntensity: 0.7 },
        noon: { start: 12, end: 14, ambientIntensity: 1.0 },
        afternoon: { start: 14, end: 18, ambientIntensity: 0.8 },
        evening: { start: 18, end: 21, ambientIntensity: 0.4 }
    }
});

// 导出
export { Config, config };
export default config;
