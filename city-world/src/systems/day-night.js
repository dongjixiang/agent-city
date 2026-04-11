/**
 * @fileoverview 昼夜循环系统
 * 
 * 职责：
 * - 跟踪时间
 * - 控制天亮/天黑过渡
 * - 调整灯光和氛围
 * 
 * 导出：
 * - window.currentDayPhase
 * 
 * @module systems/day-night
 */

import * as THREE from 'three';

export const DayPhase = {
    DAWN: 'dawn',
    DAY: 'day',
    EVENING: 'evening',
    NIGHT: 'night'
};

let currentPhase = DayPhase.DAY;
let sunMesh = null;
let moonMesh = null;

/**
 * 设置当前时段
 */
export function setDayPhase(phase) {
    currentPhase = phase;
    window.currentDayPhase = phase;
    applyPhaseEffects(phase);
}

/**
 * 应用时段效果（灯光、颜色）
 */
function applyPhaseEffects(phase) {
    // TODO: 实现昼夜效果
}

/**
 * 设置太阳位置
 * @param {number} angle - 太阳角度 (0-360)
 */
export function setSunAngle(angle) {
    // TODO: 实现太阳位置控制
}

/**
 * 获取当前时段
 */
export function getCurrentPhase() {
    return currentPhase;
}

// 挂载到 window
window.currentDayPhase = currentPhase;

export default { DayPhase, setDayPhase, getCurrentPhase, setSunAngle };
