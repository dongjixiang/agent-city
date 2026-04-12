/**
 * BaseStore - Store 基类
 * 
 * 提供通用的数据存储功能
 */

const logger = require('../utils/logger');
const { generateId } = require('../utils/crypto');

class BaseStore {
    constructor(name) {
        this.name = name;
        this.data = new Map(); // 内存存储
        this.indexes = new Map(); // 索引
    }

    async init() {
        // 可被子类覆盖
    }

    /**
     * 生成 ID
     */
    generateId(prefix = '') {
        return generateId(prefix);
    }

    /**
     * 设置索引
     */
    setIndex(field, unique = false) {
        this.indexes.set(field, {
            unique,
            map: new Map()
        });
    }

    /**
     * 更新索引
     */
    updateIndex(id, data, oldData = null) {
        for (const [field, index] of this.indexes) {
            const oldValue = oldData?.[field];
            const newValue = data[field];

            // 移除旧索引
            if (oldValue !== undefined) {
                const set = index.map.get(oldValue);
                if (set) {
                    set.delete(id);
                    if (set.size === 0) {
                        index.map.delete(oldValue);
                    }
                }
            }

            // 添加新索引
            if (newValue !== undefined) {
                if (!index.map.has(newValue)) {
                    index.map.set(newValue, new Set());
                }
                index.map.get(newValue).add(id);
            }
        }
    }

    /**
     * 根据索引查找
     */
    findByIndex(field, value) {
        const index = this.indexes.get(field);
        if (!index) return null;

        const set = index.map.get(value);
        if (!set) return null;

        if (index.unique) {
            const id = Array.from(set)[0];
            return this.data.get(id);
        }

        return Array.from(set).map(id => this.data.get(id));
    }

    /**
     * 创建
     */
    async create(id, data) {
        if (this.data.has(id)) {
            throw new Error(`${this.name}: ${id} already exists`);
        }

        const record = {
            id,
            ...data,
            createdAt: Date.now(),
            updatedAt: Date.now()
        };

        this.data.set(id, record);
        this.updateIndex(id, record);

        logger.debug(`[${this.name}] Created`, { id });
        return record;
    }

    /**
     * 获取
     */
    async get(id) {
        return this.data.get(id) || null;
    }

    /**
     * 更新
     */
    async update(id, data) {
        const existing = this.data.get(id);
        if (!existing) {
            throw new Error(`${this.name}: ${id} not found`);
        }

        const updated = {
            ...existing,
            ...data,
            id: existing.id, // 防止 ID 被修改
            createdAt: existing.createdAt, // 防止创建时间被修改
            updatedAt: Date.now()
        };

        this.data.set(id, updated);
        this.updateIndex(id, updated, existing);

        logger.debug(`[${this.name}] Updated`, { id });
        return updated;
    }

    /**
     * 删除
     */
    async delete(id) {
        const existing = this.data.get(id);
        if (!existing) {
            return false;
        }

        this.updateIndex(id, {}, existing);
        this.data.delete(id);

        logger.debug(`[${this.name}] Deleted`, { id });
        return true;
    }

    /**
     * 检查是否存在
     */
    async exists(id) {
        return this.data.has(id);
    }

    /**
     * 获取所有
     */
    async getAll() {
        return Array.from(this.data.values());
    }

    /**
     * 获取数量
     */
    async count() {
        return this.data.size;
    }

    /**
     * 清空
     */
    async clear() {
        this.data.clear();
        for (const index of this.indexes.values()) {
            index.map.clear();
        }
        logger.info(`[${this.name}] Cleared`);
    }

    /**
     * 批量创建
     */
    async bulkCreate(items) {
        const results = [];
        for (const item of items) {
            const id = item.id || this.generateId();
            const record = await this.create(id, item);
            results.push(record);
        }
        return results;
    }

    /**
     * 条件查询
     */
    async find(filter) {
        const results = [];
        for (const record of this.data.values()) {
            let match = true;
            for (const [key, value] of Object.entries(filter)) {
                if (record[key] !== value) {
                    match = false;
                    break;
                }
            }
            if (match) {
                results.push(record);
            }
        }
        return results;
    }

    /**
     * 分页查询
     */
    async paginate(page = 1, pageSize = 20, filter = {}) {
        let items = await this.find(filter);
        
        const total = items.length;
        const totalPages = Math.ceil(total / pageSize);
        
        const start = (page - 1) * pageSize;
        items = items.slice(start, start + pageSize);

        return {
            items,
            page,
            pageSize,
            total,
            totalPages
        };
    }

    /**
     * 导出所有数据
     */
    async export() {
        return JSON.stringify(Array.from(this.data.values()), null, 2);
    }

    /**
     * 导入数据
     */
    async import(json) {
        const items = JSON.parse(json);
        await this.clear();
        for (const item of items) {
            await this.create(item.id, item);
        }
        logger.info(`[${this.name}] Imported ${items.length} items`);
    }
}

module.exports = BaseStore;
