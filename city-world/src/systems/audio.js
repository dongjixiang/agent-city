/**
 * @fileoverview 音频系统（语音+音效）
 * 
 * 职责：
 * - 语音合成（TTS）
 * - 环境音乐（白天/傍晚/夜晚）
 * - 天气音效（雨声、雷声、风声）
 * 
 * 导出：
 * - window.speakText
 * - window.toggleVoiceSystem
 * - window.toggleSound
 * 
 * @module systems/audio
 */

// 音频上下文
let audioContext = null;
let isVoiceEnabled = true;
let isSoundEnabled = true;

/**
 * 初始化音频上下文
 */
export function initAudioContext() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioContext;
}

/**
 * 语音合成
 * @param {string} text - 要说的文本
 * @param {string} agentId - 说话者ID
 */
export function speakText(text, agentId) {
    if (!isVoiceEnabled) return;
    
    // TODO: 实现 TTS
    console.log(`[Audio] Speaking: ${text.substring(0, 30)}...`);
}

/**
 * 切换语音系统
 */
export function toggleVoiceSystem() {
    isVoiceEnabled = !isVoiceEnabled;
    console.log(`[Audio] Voice system: ${isVoiceEnabled ? 'ON' : 'OFF'}`);
}

/**
 * 切换音效
 */
export function toggleSound() {
    isSoundEnabled = !isSoundEnabled;
    console.log(`[Audio] Sound: ${isSoundEnabled ? 'ON' : 'OFF'}`);
}

/**
 * 播放环境音乐
 * @param {string} period - day/evening/night
 */
export function playAmbientMusic(period) {
    // TODO: 实现环境音乐播放
}

// 挂载到 window
window.initAudioContext = initAudioContext;
window.speakText = speakText;
window.toggleVoiceSystem = toggleVoiceSystem;
window.toggleSound = toggleSound;

export default { initAudioContext, speakText, toggleVoiceSystem, toggleSound, playAmbientMusic };
