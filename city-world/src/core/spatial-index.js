/**
 * SpatialIndex - 空间索引
 *
 * 使用八叉树（Octree）实现高效的三维空间查询
 * 替代扁平化的 SpatialGrid，支持更复杂的范围查询
 *
 * 设计目标：
 * - 快速查找指定半径内的所有对象
 * - 支持 3D 空间查询（智能体在不同高度时）
 * - 高效的插入/删除/更新
 *
 * @module core/spatial-index
 */

import * as THREE from 'three';

const MAX_OBJECTS = 8;      // 叶子节点最大对象数
const MAX_DEPTH = 6;        // 最大深度

/**
 * 八叉树节点
 */
class OctreeNode {
    constructor(bounds, depth = 0) {
        // bounds: { minX, maxX, minY, maxY, minZ, maxZ }
        this.bounds = bounds;
        this.depth = depth;
        this.objects = [];           // 存储 { object, position: {x,y,z} }
        this.children = null;         // 8 个子节点，或 null
    }

    /**
     * 划分节点为 8 个子节点
     */
    subdivide() {
        const { minX, maxX, minY, maxY, minZ, maxZ } = this.bounds;
        const midX = (minX + maxX) / 2;
        const midY = (minY + maxY) / 2;
        const midZ = (minZ + maxZ) / 2;

        this.children = [
            // 下层 4 个 (y = minY)
            { minX, maxX: midX, minY, maxY: midY, minZ, maxZ: midZ },   // 0: -x, -y, -z
            { minX: midX, maxX, minY, maxY: midY, minZ, maxZ: midZ },   // 1: +x, -y, -z
            { minX, maxX: midX, minY, maxY: midY, minZ: midZ, maxZ },   // 2: -x, -y, +z
            { minX: midX, maxX, minY, maxY: midY, minZ: midZ, maxZ },   // 3: +x, -y, +z
            // 上层 4 个 (y = midY)
            { minX, maxX: midX, minY: midY, maxY, minZ, maxZ: midZ },   // 4: -x, +y, -z
            { minX: midX, maxX, minY: midY, maxY, minZ, maxZ: midZ },   // 5: +x, +y, -z
            { minX, maxX: midX, minY: midY, maxY, minZ: midZ, maxZ },   // 6: -x, +y, +z
            { minX: midX, maxX, minY: midY, maxY, minZ: midZ, maxZ },   // 7: +x, +y, +z
        ].map(b => new OctreeNode(b, this.depth + 1));
    }

    /**
     * 检查点是否在边界内
     */
    containsPoint(x, y, z) {
        const { minX, maxX, minY, maxY, minZ, maxZ } = this.bounds;
        return x >= minX && x <= maxX && y >= minY && y <= maxY && z >= minZ && z <= maxZ;
    }

    /**
     * 检查球体是否与节点相交
     */
    intersectsSphere(cx, cy, cz, radius) {
        const { minX, maxX, minY, maxY, minZ, maxZ } = this.bounds;

        // 找到球心到立方体最近点
        const closestX = Math.max(minX, Math.min(cx, maxX));
        const closestY = Math.max(minY, Math.min(cy, maxY));
        const closestZ = Math.max(minZ, Math.min(cz, maxZ));

        const dx = cx - closestX;
        const dy = cy - closestY;
        const dz = cz - closestZ;

        return (dx * dx + dy * dy + dz * dz) <= radius * radius;
    }

    /**
     * 获取点所在的子节点索引 (0-7)
     */
    getChildIndex(x, y, z) {
        const { minX, maxX, minY, maxY, minZ, maxZ } = this.bounds;
        const midX = (minX + maxX) / 2;
        const midY = (minY + maxY) / 2;
        const midZ = (minZ + maxZ) / 2;

        let index = 0;
        if (x >= midX) index |= 1;
        if (y >= midY) index |= 2;
        if (z >= midZ) index |= 4;
        return index;
    }
}


/**
 * SpatialIndex - 八叉树空间索引
 *
 * 用法：
 *   const index = new SpatialIndex({ minX: -100, maxX: 100, minY: 0, maxY: 50, minZ: -100, maxZ: 100 });
 *   index.insert(myObject, { x: 10, y: 0, z: 20 });
 *   const nearby = index.queryRadius(10, 0, 20, 15); // 查找 (10,0,20) 半径 15 内的对象
 */
class SpatialIndex {
    /**
     * @param {Object} worldBounds - 世界边界
     * @param {number} worldBounds.minX
     * @param {number} worldBounds.maxX
     * @param {number} worldBounds.minY - 通常为 0
     * @param {number} worldBounds.maxY - 最高海拔（如飞行高度）
     * @param {number} worldBounds.minZ
     * @param {number} worldBounds.maxZ
     */
    constructor(worldBounds = { minX: -100, maxX: 100, minY: 0, maxY: 60, minZ: -100, maxZ: 100 }) {
        this.worldBounds = worldBounds;
        this.root = new OctreeNode(worldBounds, 0);
        this.objectNodes = new Map(); // objectId -> OctreeNode
    }

    /**
     * 插入对象
     * @param {Object} object - 任何有 .position 的对象，或传入 {x,y,z}
     * @param {Object|string} positionOrObject - 位置或对象本身
     * @param {string} objectId - 对象 ID（用于删除/更新）
     */
    insert(object, positionOrObject, objectId = null) {
        const id = objectId || object.id || object;
        const pos = positionOrObject.position || positionOrObject;

        // 移除旧位置（如果存在）
        this.remove(id);

        this.insertIntoNode(this.root, id, object, pos);
    }

    insertIntoNode(node, id, object, position) {
        // 如果有子节点，尝试插入子节点
        if (node.children) {
            const index = node.getChildIndex(position.x, position.y, position.z);
            const child = node.children[index];

            if (child.containsPoint(position.x, position.y, position.z)) {
                this.insertIntoNode(child, id, object, position);
                this.objectNodes.set(id, node); // 记录所属节点
                return;
            }
            // 跨子节点边界，放到当前节点
        }

        // 放当前节点
        node.objects.push({ id, object, position });

        // 超过容量且未达最大深度，则细分
        if (node.objects.length > MAX_OBJECTS && node.depth < MAX_DEPTH && !node.children) {
            node.subdivide();

            // 将现有对象重新分配到子节点
            const oldObjects = node.objects;
            node.objects = [];

            for (const entry of oldObjects) {
                const idx = node.getChildIndex(entry.position.x, entry.position.y, entry.position.z);
                const child = node.children[idx];
                if (child.containsPoint(entry.position.x, entry.position.y, entry.position.z)) {
                    this.insertIntoNode(child, entry.id, entry.object, entry.position);
                } else {
                    node.objects.push(entry); // 放回父节点
                }
            }
        }

        this.objectNodes.set(id, node);
    }

    /**
     * 移除对象
     * @param {string} objectId
     */
    remove(objectId) {
        const node = this.objectNodes.get(objectId);
        if (node) {
            node.objects = node.objects.filter(e => e.id !== objectId);
            this.objectNodes.delete(objectId);
        }
    }

    /**
     * 更新对象位置
     * @param {string} objectId
     * @param {Object} newPosition - { x, y, z }
     */
    update(objectId, newPosition) {
        const node = this.objectNodes.get(objectId);
        if (!node) return;

        // 检查是否需要移动到其他节点
        if (!node.containsPoint(newPosition.x, newPosition.y, newPosition.z) ||
            (node.children && !node.children[node.getChildIndex(newPosition.x, newPosition.y, newPosition.z)]
                .containsPoint(newPosition.x, newPosition.y, newPosition.z))) {
            // 重新插入
            const entry = node.objects.find(e => e.id === objectId);
            if (entry) {
                const object = entry.object;
                this.remove(objectId);
                this.insert(object, newPosition, objectId);
            }
        } else if (node.children) {
            // 在子节点间移动
            const entry = node.objects.find(e => e.id === objectId);
            if (entry) {
                entry.position = newPosition;
                const childIndex = node.getChildIndex(newPosition.x, newPosition.y, newPosition.z);
                const targetChild = node.children[childIndex];

                if (targetChild.containsPoint(newPosition.x, newPosition.y, newPosition.z)) {
                    // 从当前节点移除，加入子节点
                    node.objects = node.objects.filter(e => e.id !== objectId);
                    this.insertIntoNode(targetChild, objectId, entry.object, newPosition);
                }
            }
        } else {
            // 更新位置
            const entry = node.objects.find(e => e.id === objectId);
            if (entry) entry.position = newPosition;
        }
    }

    /**
     * 球形范围查询
     * @param {number} cx - 中心 X
     * @param {number} cy - 中心 Y
     * @param {number} cz - 中心 Z
     * @param {number} radius - 半径
     * @param {Function} filter - 可选过滤器 (object) => boolean
     * @returns {Array} [{ object, distance, position }]
     */
    queryRadius(cx, cy, cz, radius, filter = null) {
        const results = [];
        this.queryNodeRadius(this.root, cx, cy, cz, radius, results, filter);

        // 按距离排序
        results.sort((a, b) => a.distance - b.distance);
        return results;
    }

    queryNodeRadius(node, cx, cy, cz, radius, results, filter) {
        // 节点球体不相交，跳过
        if (!node.intersectsSphere(cx, cy, cz, radius)) return;

        // 检查本节点中的对象
        for (const entry of node.objects) {
            const { x, y, z } = entry.position;
            const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2 + (z - cz) ** 2);
            if (dist <= radius) {
                if (!filter || filter(entry.object)) {
                    results.push({ object: entry.object, distance: dist, position: { ...entry.position } });
                }
            }
        }

        // 递归子节点
        if (node.children) {
            for (const child of node.children) {
                this.queryNodeRadius(child, cx, cy, cz, radius, results, filter);
            }
        }
    }

    /**
     * 矩形范围查询
     * @param {Object} bounds - { minX, maxX, minY, maxY, minZ, maxZ }
     * @param {Function} filter
     * @returns {Array}
     */
    queryBounds(bounds, filter = null) {
        const results = [];
        this.queryNodeBounds(this.root, bounds, results, filter);
        return results;
    }

    queryNodeBounds(node, bounds, results, filter) {
        // 不相交
        if (!this.boundsIntersect(node.bounds, bounds)) return;

        for (const entry of node.objects) {
            const { x, y, z } = entry.position;
            if (x >= bounds.minX && x <= bounds.maxX &&
                y >= bounds.minY && y <= bounds.maxY &&
                z >= bounds.minZ && z <= bounds.maxZ) {
                if (!filter || filter(entry.object)) {
                    results.push({ object: entry.object, position: { ...entry.position } });
                }
            }
        }

        if (node.children) {
            for (const child of node.children) {
                this.queryNodeBounds(child, bounds, results, filter);
            }
        }
    }

    boundsIntersect(a, b) {
        return !(a.maxX < b.minX || a.minX > b.maxX ||
                 a.maxY < b.minY || a.minY > b.maxY ||
                 a.maxZ < b.minZ || a.minZ > b.maxZ);
    }

    /**
     * 最近邻查询
     * @param {number} x
     * @param {number} y
     * @param {number} z
     * @param {number} maxRadius - 最大搜索半径
     * @param {Function} filter
     * @returns {Object|null}
     */
    getNearest(x, y, z, maxRadius = Infinity, filter = null) {
        const results = this.queryRadius(x, y, z, maxRadius, filter);
        return results.length > 0 ? results[0] : null;
    }

    /**
     * 获取统计信息
     */
    getStats() {
        let totalObjects = 0;
        let leafNodes = 0;
        let totalNodes = 0;

        const traverse = (node) => {
            totalNodes++;
            if (node.children) {
                node.children.forEach(traverse);
            } else {
                leafNodes++;
                totalObjects += node.objects.length;
            }
        };

        traverse(this.root);

        return {
            totalNodes,
            leafNodes,
            totalObjects,
            maxDepth: MAX_DEPTH
        };
    }

    /**
     * 清空
     */
    clear() {
        this.root = new OctreeNode(this.worldBounds, 0);
        this.objectNodes.clear();
    }
}

export { SpatialIndex };
