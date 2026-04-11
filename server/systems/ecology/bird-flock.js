/**
 * BirdFlock - 鸟群系统 (Boids 算法)
 * 
 * 实现 Boids 聚群算法：
 * - 分离：避免与邻居太近
 * - 对齐：与邻居方向一致
 * - 聚合：向邻居中心移动
 */

const logger = require('../../utils/logger');

class BirdFlock {
    constructor(options = {}) {
        this.id = options.id || `flock_${Date.now()}`;
        this.position = options.position || { x: 0, z: 0 }; // 鸟群中心位置
        this.birds = [];
        this.maxBirds = options.maxBirds || 20;
        this.flightHeight = options.flightHeight || 15;

        // Boids 参数
        this.separation = options.separation || 1.5;
        this.alignment = options.alignment || 1.0;
        this.cohesion = options.cohesion || 1.0;
        this.viewRadius = options.viewRadius || 5;
        this.maxSpeed = options.maxSpeed || 0.5;
        this.maxForce = options.maxForce || 0.1;

        // 目标点（吸引鸟群）
        this.targetPoint = null;
        this.roostPoint = null; // 栖息点

        this.lastUpdate = Date.now();
    }

    /**
     * 添加鸟
     */
    addBird(bird) {
        if (this.birds.length >= this.maxBirds) {
            return false;
        }

        this.birds.push({
            id: bird.id || `bird_${Date.now()}_${Math.random()}`,
            position: bird.position || { ...this.position },
            velocity: bird.velocity || { x: 0, z: 0 },
            acceleration: { x: 0, z: 0 }
        });

        return true;
    }

    /**
     * 移除鸟
     */
    removeBird(birdId) {
        this.birds = this.birds.filter(b => b.id !== birdId);
    }

    /**
     * 设置目标点（吸引鸟群）
     */
    setTargetPoint(point) {
        this.targetPoint = point;
    }

    /**
     * 设置栖息点
     */
    setRoostPoint(point) {
        this.roostPoint = point;
    }

    /**
     * 更新鸟群
     */
    update(deltaTime) {
        const now = Date.now();
        const dt = deltaTime || (now - this.lastUpdate) / 1000;
        this.lastUpdate = now;

        // 限制 deltaTime 避免跳跃
        const cappedDt = Math.min(dt, 0.1);

        for (const bird of this.birds) {
            // 计算 Boids 力
            const separationForce = this.separate(bird);
            const alignmentForce = this.align(bird);
            const cohesionForce = this.cohere(bird);
            const targetForce = this.seekTarget(bird);

            // 应用力
            bird.acceleration.x = separationForce.x * this.separation +
                                  alignmentForce.x * this.alignment +
                                  cohesionForce.x * this.cohesion +
                                  targetForce.x;
            bird.acceleration.z = separationForce.z * this.separation +
                                  alignmentForce.z * this.alignment +
                                  cohesionForce.z * this.cohesion +
                                  targetForce.z;

            // 更新速度和位置
            bird.velocity.x += bird.acceleration.x * cappedDt;
            bird.velocity.z += bird.acceleration.z * cappedDt;

            // 限制速度
            const speed = Math.sqrt(bird.velocity.x ** 2 + bird.velocity.z ** 2);
            if (speed > this.maxSpeed) {
                bird.velocity.x = (bird.velocity.x / speed) * this.maxSpeed;
                bird.velocity.z = (bird.velocity.z / speed) * this.maxSpeed;
            }

            // 更新位置
            bird.position.x += bird.velocity.x * cappedDt;
            bird.position.z += bird.velocity.z * cappedDt;

            // 世界边界（简单反弹）
            const bounds = 100;
            if (Math.abs(bird.position.x) > bounds) {
                bird.velocity.x *= -0.5;
                bird.position.x = Math.sign(bird.position.x) * bounds;
            }
            if (Math.abs(bird.position.z) > bounds) {
                bird.velocity.z *= -0.5;
                bird.position.z = Math.sign(bird.position.z) * bounds;
            }
        }

        // 更新鸟群中心
        this.updateCenter();

        return this.birds;
    }

    /**
     * 分离：避免与邻居太近
     */
    separate(bird) {
        const steer = { x: 0, z: 0 };
        let count = 0;

        for (const other of this.birds) {
            if (other.id === bird.id) continue;

            const d = this.distance(bird.position, other.position);
            if (d > 0 && d < this.separation) {
                const diff = {
                    x: bird.position.x - other.position.x,
                    z: bird.position.z - other.position.z
                };
                // 距离越近，力越大
                const weight = 1 / (d * d);
                steer.x += diff.x * weight;
                steer.z += diff.z * weight;
                count++;
            }
        }

        if (count > 0) {
            steer.x /= count;
            steer.z /= count;
        }

        return this.limitMagnitude(steer, this.maxForce);
    }

    /**
     * 对齐：与邻居方向一致
     */
    align(bird) {
        const sum = { x: 0, z: 0 };
        let count = 0;

        for (const other of this.birds) {
            if (other.id === bird.id) continue;

            const d = this.distance(bird.position, other.position);
            if (d > 0 && d < this.viewRadius) {
                sum.x += other.velocity.x;
                sum.z += other.velocity.z;
                count++;
            }
        }

        if (count > 0) {
            sum.x /= count;
            sum.z /= count;

            // 限制速度
            const mag = Math.sqrt(sum.x ** 2 + sum.z ** 2);
            if (mag > 0) {
                sum.x = (sum.x / mag) * this.maxSpeed - bird.velocity.x;
                sum.z = (sum.z / mag) * this.maxSpeed - bird.velocity.z;
            }
        }

        return this.limitMagnitude(sum, this.maxForce);
    }

    /**
     * 聚合：向邻居中心移动
     */
    cohere(bird) {
        const sum = { x: 0, z: 0 };
        let count = 0;

        for (const other of this.birds) {
            if (other.id === bird.id) continue;

            const d = this.distance(bird.position, other.position);
            if (d > 0 && d < this.viewRadius) {
                sum.x += other.position.x;
                sum.z += other.position.z;
                count++;
            }
        }

        if (count > 0) {
            sum.x /= count;
            sum.z /= count;

            // 转向邻居中心
            return this.seek(bird, sum);
        }

        return { x: 0, z: 0 };
    }

    /**
     * 寻找目标点
     */
    seekTarget(bird) {
        if (!this.targetPoint) {
            return { x: 0, z: 0 };
        }
        return this.seek(bird, this.targetPoint);
    }

    /**
     * 寻找
     */
    seek(bird, target) {
        const desired = {
            x: target.x - bird.position.x,
            z: target.z - bird.position.z
        };

        const d = Math.sqrt(desired.x ** 2 + desired.z ** 2);
        if (d < 1) {
            return { x: 0, z: 0 };
        }

        const normalized = {
            x: (desired.x / d) * this.maxSpeed,
            z: (desired.z / d) * this.maxSpeed
        };

        return {
            x: normalized.x - bird.velocity.x,
            z: normalized.z - bird.velocity.z
        };
    }

    /**
     * 限制向量大小
     */
    limitMagnitude(vec, max) {
        const mag = Math.sqrt(vec.x ** 2 + vec.z ** 2);
        if (mag > max) {
            return {
                x: (vec.x / mag) * max,
                z: (vec.z / mag) * max
            };
        }
        return vec;
    }

    /**
     * 计算距离
     */
    distance(p1, p2) {
        const dx = p1.x - p2.x;
        const dz = p1.z - p2.z;
        return Math.sqrt(dx * dx + dz * dz);
    }

    /**
     * 更新鸟群中心
     */
    updateCenter() {
        if (this.birds.length === 0) return;

        let sumX = 0, sumZ = 0;
        for (const bird of this.birds) {
            sumX += bird.position.x;
            sumZ += bird.position.z;
        }

        this.position.x = sumX / this.birds.length;
        this.position.z = sumZ / this.birds.length;
    }

    /**
     * 获取状态
     */
    getState() {
        return {
            id: this.id,
            position: this.position,
            birdCount: this.birds.length,
            targetPoint: this.targetPoint,
            birds: this.birds.map(b => ({
                id: b.id,
                position: b.position,
                velocity: b.velocity
            }))
        };
    }

    /**
     * 飞向某点（吸引）
     */
    flyTo(point) {
        this.targetPoint = point;
    }

    /**
     * 散开
     */
    scatter() {
        this.targetPoint = null;
        for (const bird of this.birds) {
            // 随机方向
            const angle = Math.random() * Math.PI * 2;
            bird.velocity.x = Math.cos(angle) * this.maxSpeed;
            bird.velocity.z = Math.sin(angle) * this.maxSpeed;
        }
    }
}

module.exports = BirdFlock;
