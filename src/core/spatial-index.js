/**
 * SpatialIndex - 八叉树空间索引
 *
 * 用于快速查询范围内的对象，大幅提升碰撞检测和邻近查询性能
 *
 * @module core/spatial-index
 */

class SpatialIndex {
    constructor(bounds = 100, maxDepth = 6) {
        this.bounds = bounds;
        this.maxDepth = maxDepth;
        this.root = new OctreeNode(0, 0, 0, bounds, 0, maxDepth);
        this.objects = new Map(); // id -> { object, x, y, z }
    }

    /**
     * 插入对象
     */
    insert(object, position, id) {
        const entry = { object, x: position.x, y: position.y, z: position.z };
        this.objects.set(id, entry);
        this.root.insert(entry);
    }

    /**
     * 移除对象
     */
    remove(id) {
        const entry = this.objects.get(id);
        if (entry) {
            this.root.remove(entry);
            this.objects.delete(id);
        }
    }

    /**
     * 更新对象位置
     */
    update(id, newPosition) {
        const entry = this.objects.get(id);
        if (entry) {
            this.root.remove(entry);
            entry.x = newPosition.x;
            entry.y = newPosition.y;
            entry.z = newPosition.z;
            this.root.insert(entry);
        }
    }

    /**
     * 查询半径范围内的对象
     */
    queryRadius(x, y, z, radius) {
        return this.root.queryRadius(x, y, z, radius);
    }

    /**
     * 查询视锥内的对象
     */
    queryFrustum(frustum) {
        return this.root.queryFrustum(frustum);
    }

    /**
     * 获取统计信息
     */
    getStats() {
        return {
            totalObjects: this.objects.size,
            nodeCount: this.root.countNodes()
        };
    }

    /**
     * 清除所有
     */
    clear() {
        this.root = new OctreeNode(0, 0, 0, this.bounds, 0, this.maxDepth);
        this.objects.clear();
    }
}

class OctreeNode {
    constructor(x, y, z, size, depth, maxDepth) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.size = size;
        this.depth = depth;
        this.maxDepth = maxDepth;
        this.entries = [];
        this.children = null; // 8 个子节点
    }

    /**
     * 是否为叶子节点
     */
    isLeaf() {
        return this.depth >= this.maxDepth || !this.children;
    }

    /**
     * 插入条目
     */
    insert(entry) {
        if (this.isLeaf()) {
            this.entries.push(entry);
            if (this.entries.length > 8 && this.depth < this.maxDepth) {
                this.subdivide();
            }
        } else {
            const idx = this._getChildIndex(entry);
            if (idx !== -1) {
                this.children[idx].insert(entry);
            } else {
                this.entries.push(entry);
            }
        }
    }

    /**
     * 移除条目
     */
    remove(entry) {
        const idx = this.entries.indexOf(entry);
        if (idx !== -1) {
            this.entries.splice(idx, 1);
            return true;
        }
        if (this.children) {
            for (const child of this.children) {
                if (child.remove(entry)) return true;
            }
        }
        return false;
    }

    /**
     * 查询半径范围
     */
    queryRadius(x, y, z, radius) {
        const results = [];

        // 检查自身条目
        for (const entry of this.entries) {
            const dx = entry.x - x;
            const dy = entry.y - y;
            const dz = entry.z - z;
            const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
            if (dist <= radius) {
                results.push({
                    object: entry.object,
                    position: { x: entry.x, y: entry.y, z: entry.z },
                    distance: dist
                });
            }
        }

        // 递归子节点
        if (this.children) {
            for (const child of this.children) {
                if (child._intersectsSphere(x, y, z, radius)) {
                    results.push(...child.queryRadius(x, y, z, radius));
                }
            }
        }

        return results;
    }

    /**
     * 与球体是否相交
     */
    _intersectsSphere(x, y, z, radius) {
        const dx = Math.abs(this.x - x);
        const dy = Math.abs(this.y - y);
        const dz = Math.abs(this.z - z);
        return dx < radius + this.size && dy < radius + this.size && dz < radius + this.size;
    }

    /**
     * 获取子节点索引
     */
    _getChildIndex(entry) {
        const half = this.size / 2;
        if (entry.x < this.x || entry.x > this.x + this.size ||
            entry.y < this.y || entry.y > this.y + this.size ||
            entry.z < this.z || entry.z > this.z + this.size) {
            return -1;
        }

        const mx = entry.x < this.x + half ? 0 : 1;
        const my = entry.y < this.y + half ? 0 : 1;
        const mz = entry.z < this.z + half ? 0 : 1;
        return mx * 4 + my * 2 + mz;
    }

    /**
     * 细分节点
     */
    subdivide() {
        const half = this.size / 2;
        this.children = [];
        for (let i = 0; i < 8; i++) {
            const mx = (i & 1) ? half : 0;
            const my = (i & 2) ? half : 0;
            const mz = (i & 4) ? half : 0;
            this.children[i] = new OctreeNode(
                this.x + mx, this.y + my, this.z + mz,
                half, this.depth + 1, this.maxDepth
            );
        }

        // 重新分配条目
        for (const entry of this.entries) {
            const idx = this._getChildIndex(entry);
            if (idx !== -1) {
                this.children[idx].insert(entry);
            }
        }
        this.entries = [];
    }

    /**
     * 统计节点数
     */
    countNodes() {
        let count = 1;
        if (this.children) {
            for (const child of this.children) {
                count += child.countNodes();
            }
        }
        return count;
    }
}

export { SpatialIndex };
