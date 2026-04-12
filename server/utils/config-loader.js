/**
 * ConfigLoader - 配置加载器
 * 
 * 支持：
 * - YAML 配置
 * - 环境变量覆盖
 * - 多环境配置
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

class ConfigLoader {
    constructor() {
        this.configs = new Map();
        this.env = process.env.NODE_ENV || 'development';
    }

    /**
     * 加载配置目录
     */
    async load(dir = '../config') {
        const configDir = path.resolve(dir);
        
        if (!fs.existsSync(configDir)) {
            console.warn(`[Config] 配置目录不存在: ${configDir}`);
            return this;
        }

        const files = fs.readdirSync(configDir);
        
        for (const file of files) {
            if (!file.endsWith('.yaml') && !file.endsWith('.yml') && !file.endsWith('.json')) {
                continue;
            }

            const filePath = `${configDir}/${file}`;
            const name = file.replace(/\.(yaml|yml|json)$/, '');
            
            try {
                const data = this.loadFile(filePath);
                
                // 加载环境特定配置
                const envFile = `${configDir}/${name}.${this.env}.${file.split('.').pop()}`;
                let envData = {};
                if (fs.existsSync(envFile)) {
                    envData = this.loadFile(envFile);
                }
                
                // 合并配置
                const merged = this.merge(data, envData);
                
                // 环境变量覆盖
                const envOverride = this.getEnvOverrides(name);
                const final = this.merge(merged, envOverride);
                
                this.configs.set(name, final);
                
            } catch (err) {
                console.error(`[Config] 加载配置文件失败: ${file}`, err);
            }
        }

        console.log(`[Config] 加载了 ${this.configs.size} 个配置文件 (env: ${this.env})`);
        return this;
    }

    /**
     * 加载单个文件
     */
    loadFile(filePath) {
        const content = fs.readFileSync(filePath, 'utf8');
        
        if (filePath.endsWith('.json')) {
            return JSON.parse(content);
        }
        
        return yaml.load(content);
    }

    /**
     * 合并对象
     */
    merge(base, override) {
        const result = { ...base };
        
        for (const key in override) {
            if (typeof override[key] === 'object' && !Array.isArray(override[key]) && typeof result[key] === 'object') {
                result[key] = this.merge(result[key], override[key]);
            } else {
                result[key] = override[key];
            }
        }
        
        return result;
    }

    /**
     * 获取环境变量覆盖
     */
    getEnvOverrides(prefix) {
        const result = {};
        const prefixUpper = prefix.toUpperCase().replace(/-/g, '_');
        
        for (const key in process.env) {
            if (key.startsWith(`${prefixUpper}_`)) {
                const configKey = key
                    .substring(prefixUpper.length + 1)
                    .toLowerCase()
                    .replace(/_/g, '-');
                
                result[configKey] = process.env[key];
            }
        }
        
        return result;
    }

    /**
     * 获取配置
     */
    get(name) {
        return this.configs.get(name);
    }

    /**
     * 获取配置值（支持点号路径）
     * path 格式: 'configName.key.subkey'
     * 例如: 'server.host', 'agents.default.needs.energy'
     */
    getValue(path, defaultValue = undefined) {
        const parts = path.split('.');
        
        // 第一个部分是配置名（如 'server', 'agents'）
        const configName = parts[0];
        let current = this.configs.get(configName);
        
        if (current === undefined) {
            return defaultValue;
        }
        
        // 特殊情况：如果路径是 'server.host' 但配置中实际是 'server.server.host'
        // 需要检查并跳过中间层
        if (parts.length >= 2 && current[configName] !== undefined && current[parts[1]] === undefined) {
            current = current[configName];
        }
        
        // 遍历剩余路径
        for (let i = 1; i < parts.length; i++) {
            const part = parts[i];
            if (typeof current === 'object' && current !== null) {
                current = current[part];
            } else {
                return defaultValue;
            }
            
            if (current === undefined) {
                return defaultValue;
            }
        }

        return current;
    }

    /**
     * 检查配置是否存在
     */
    has(name) {
        return this.configs.has(name);
    }

    /**
     * 获取所有配置名
     */
    keys() {
        return Array.from(this.configs.keys());
    }
}

// 创建全局实例
const config = new ConfigLoader();

module.exports = config;
