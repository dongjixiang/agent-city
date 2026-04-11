/**
 * MathUtils - 数学工具
 * 
 * 常用的数学函数和工具
 */

/**
 * 限制值在范围内
 */
function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

/**
 * 线性插值
 */
function lerp(a, b, t) {
    return a + (b - a) * t;
}

/**
 * 平滑插值
 */
function smoothstep(edge0, edge1, x) {
    const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
    return t * t * (3 - 2 * t);
}

/**
 * 弧度转角度
 */
function radToDeg(rad) {
    return rad * (180 / Math.PI);
}

/**
 * 角度转弧度
 */
function degToRad(deg) {
    return deg * (Math.PI / 180);
}

/**
 * 2D距离
 */
function distance2D(x1, z1, x2, z2) {
    const dx = x2 - x1;
    const dz = z2 - z1;
    return Math.sqrt(dx * dx + dz * dz);
}

/**
 * 3D距离
 */
function distance3D(x1, y1, z1, x2, y2, z2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const dz = z2 - z1;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * 2D距离（快捷函数）
 */
const dist2D = distance2D;
const dist = distance2D;

/**
 * 随机整数
 */
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * 随机浮点数
 */
function randomFloat(min, max) {
    return Math.random() * (max - min) + min;
}

/**
 * 随机布尔值
 */
function randomBool(probability = 0.5) {
    return Math.random() < probability;
}

/**
 * 从数组随机选择
 */
function randomChoice(array) {
    return array[Math.floor(Math.random() * array.length)];
}

/**
 * 打乱数组
 */
function shuffle(array) {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}

/**
 * 角度标准化到 [0, 360)
 */
function normalizeAngle(angle) {
    while (angle < 0) angle += 360;
    while (angle >= 360) angle -= 360;
    return angle;
}

/**
 * 弧度标准化到 [0, 2π)
 */
function normalizeRadian(radian) {
    while (radian < 0) radian += Math.PI * 2;
    while (radian >= Math.PI * 2) radian -= Math.PI * 2;
    return radian;
}

/**
 * 获取方向向量
 */
function getDirection(fromX, fromZ, toX, toZ) {
    const dx = toX - fromX;
    const dz = toZ - fromZ;
    const len = Math.sqrt(dx * dx + dz * dz);
    if (len === 0) return { x: 0, z: 0 };
    return { x: dx / len, z: dz / len };
}

/**
 * 获取角度（从北顺时针）
 */
function getAngle(fromX, fromZ, toX, toZ) {
    const dx = toX - fromX;
    const dz = toZ - fromZ;
    return Math.atan2(dx, dz); // 从 Z 轴（北）计算
}

/**
 * 循环保留小数
 */
function toFixed(value, decimals) {
    return Number(value.toFixed(decimals));
}

/**
 * 格式化数字（带千分位）
 */
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * 计算点到线段的最短距离
 */
function pointToSegmentDistance(px, pz, x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dz = z2 - z1;
    const lenSq = dx * dx + dz * dz;

    if (lenSq === 0) {
        return distance2D(px, pz, x1, y1);
    }

    let t = ((px - x1) * dx + (pz - z1) * dz) / lenSq;
    t = clamp(t, 0, 1);

    const closestX = x1 + t * dx;
    const closestZ = z1 + t * dz;

    return distance2D(px, pz, closestX, closestZ);
}

/**
 * 向量加法
 */
function vec2Add(a, b) {
    return { x: a.x + b.x, z: a.z + b.z };
}

/**
 * 向量减法
 */
function vec2Sub(a, b) {
    return { x: a.x - b.x, z: a.z - b.z };
}

/**
 * 向量缩放
 */
function vec2Scale(v, s) {
    return { x: v.x * s, z: v.z * s };
}

/**
 * 向量长度
 */
function vec2Length(v) {
    return Math.sqrt(v.x * v.x + v.z * v.z);
}

/**
 * 向量归一化
 */
function vec2Normalize(v) {
    const len = vec2Length(v);
    if (len === 0) return { x: 0, z: 0 };
    return { x: v.x / len, z: v.z / len };
}

/**
 * 点是否在矩形内
 */
function pointInRect(px, pz, rx, rz, rw, rh) {
    return px >= rx && px <= rx + rw && pz >= rz && pz <= rz + rh;
}

/**
 * 点是否在圆内
 */
function pointInCircle(px, pz, cx, cz, r) {
    return distance2D(px, pz, cx, cz) <= r;
}

export {
    clamp,
    lerp,
    smoothstep,
    radToDeg,
    degToRad,
    distance2D,
    distance3D,
    dist2D,
    dist,
    randomInt,
    randomFloat,
    randomBool,
    randomChoice,
    shuffle,
    normalizeAngle,
    normalizeRadian,
    getDirection,
    getAngle,
    toFixed,
    formatNumber,
    pointToSegmentDistance,
    vec2Add,
    vec2Sub,
    vec2Scale,
    vec2Length,
    vec2Normalize,
    pointInRect,
    pointInCircle
};
