/**
 * SpatialGrid - 空间网格
 * 
 * 用于高效的碰撞检测和范围查询
 */

class SpatialGrid {
    constructor(cellSize = 10) {
        this.cellSize = cellSize;
        this.cells = new Map();  // "x,y" -> Set of objects
        this.objects = new Map(); // objectId -> { object, cellKey }
    }

    /**
     * 获取格子键
     */
    getCellKey(x, z) {
        const cx = Math.floor(x / this.cellSize);
        const cz = Math.floor(z / this.cellSize);
        return `${cx},${cz}`;
    }

    /**
     * 添加对象
     */
    add(object, objectId) {
        if (!object.position) {
            console.warn('[SpatialGrid] Object has no position:', objectId);
            return;
        }

        const key = this.getCellKey(object.position.x, object.position.z);
        
        // 添加到格子
        if (!this.cells.has(key)) {
            this.cells.set(key, new Set());
        }
        this.cells.get(key).add(object);

        // 保存引用
        this.objects.set(objectId, { object, cellKey: key });
    }

    /**
     * 移除对象
     */
    remove(objectId) {
        const entry = this.objects.get(objectId);
        if (!entry) return;

        const { object, cellKey } = entry;
        const cell = this.cells.get(cellKey);
        if (cell) {
            cell.delete(object);
            if (cell.size === 0) {
                this.cells.delete(cellKey);
            }
        }

        this.objects.delete(objectId);
    }

    /**
     * 更新对象位置
     */
    update(objectId, newPosition) {
        const entry = this.objects.get(objectId);
        if (!entry) return;

        const newKey = this.getCellKey(newPosition.x, newPosition.z);
        
        // 如果格子没变，不需要更新
        if (newKey === entry.cellKey) {
            entry.object.position = newPosition;
            return;
        }

        // 从旧格子移除
        const oldCell = this.cells.get(entry.cellKey);
        if (oldCell) {
            oldCell.delete(entry.object);
            if (oldCell.size === 0) {
                this.cells.delete(entry.cellKey);
            }
        }

        // 添加到新格子
        if (!this.cells.has(newKey)) {
            this.cells.set(newKey, new Set());
        }
        this.cells.get(newKey).add(entry.object);

        // 更新引用
        entry.cellKey = newKey;
        entry.object.position = newPosition;
    }

    /**
     * 获取范围内的所有对象
     */
    getInRadius(x, z, radius) {
        const results = [];
        const cellRadius = Math.ceil(radius / this.cellSize);
        const centerKey = this.getCellKey(x, z);
        const [cx, cz] = centerKey.split(',').map(Number);

        for (let dx = -cellRadius; dx <= cellRadius; dx++) {
            for (let dz = -cellRadius; dz <= cellRadius; dz++) {
                const key = `${cx + dx},${cz + dz}`;
                const cell = this.cells.get(key);
                if (!cell) continue;

                for (const obj of cell) {
                    if (!obj.position) continue;
                    const dist = Math.hypot(obj.position.x - x, obj.position.z - z);
                    if (dist <= radius) {
                        results.push({ object: obj, distance: dist });
                    }
                }
            }
        }

        // 按距离排序
        results.sort((a, b) => a.distance - b.distance);
        return results;
    }

    /**
     * 获取最近的对象
     */
    getNearest(x, z, radius = Infinity, filter = null) {
        const candidates = this.getInRadius(x, z, radius);
        
        if (filter) {
            const filtered = candidates.filter(c => filter(c.object));
            return filtered.length > 0 ? filtered[0] : null;
        }

        return candidates.length > 0 ? candidates[0] : null;
    }

    /**
     * 获取在扇形范围内的对象
     */
    getInArc(x, z, radius, startAngle, endAngle) {
        const candidates = this.getInRadius(x, z, radius);
        return candidates.filter(c => {
            if (!c.object.position) return false;
            const angle = Math.atan2(
                c.object.position.z - z,
                c.object.position.x - x
            );
            return this.isAngleInArc(angle, startAngle, endAngle);
        });
    }

    /**
     * 检查角度是否在弧度内
     */
    isAngleInArc(angle, start, end) {
        // 标准化角度
        while (angle < 0) angle += Math.PI * 2;
        while (start < 0) start += Math.PI * 2;
        while (end < 0) end += Math.PI * 2;

        if (start <= end) {
            return angle >= start && angle <= end;
        } else {
            return angle >= start || angle <= end;
        }
    }

    /**
     * 清空
     */
    clear() {
        this.cells.clear();
        this.objects.clear();
    }

    /**
     * 获取统计信息
     */
    getStats() {
        let objectCount = 0;
        for (const cell of this.cells.values()) {
            objectCount += cell.size;
        }
        return {
            cellCount: this.cells.size,
            objectCount,
            avgPerCell: this.cells.size > 0 ? (objectCount / this.cells.size).toFixed(2) : 0
        };
    }
}

export { SpatialGrid };
