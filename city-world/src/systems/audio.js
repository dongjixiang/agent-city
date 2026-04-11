/**
 * @fileoverview 音频系统（语音+环境音乐）
 * 
 * 职责：
 * - 语音合成（TTS）
 * - 环境音乐（白天/傍晚/夜晚）
 * - 音量控制
 * 
 * 使用方式：
 *   import { initVoice, initAmbientSounds } from './systems/audio.js';
 *   initVoice();
 *   initAmbientSounds();
 *   speak('Hello', agentId);
 * 
 * 导出：
 * - window.speakText
 * - window.toggleVoiceSystem
 * - window.toggleSound
 * 
 * @module systems/audio
 */

// 状态
let audioContext = null;
let masterGain = null;
let speechSynth = null;
let currentUtterance = null;
let voiceEnabled = true;
let selectedVoice = null;

// 音乐节点
let currentTimePeriod = null;
let musicNodes = {
    day: null,
    evening: null,
    night: null
};

/**
 * 初始化语音合成
 */
export function initVoice() {
    if ('speechSynthesis' in window) {
        speechSynth = window.speechSynthesis;
        loadVoices();
        console.log('[Voice] TTS initialized');
    } else {
        console.log('[Voice] TTS not supported');
    }
}

/**
 * 加载可用语音
 */
function loadVoices() {
    if (!speechSynth) return;

    const loadAvailableVoices = () => {
        const voices = speechSynth.getVoices();
        if (voices.length > 0) {
            // 优先选中文语音
            selectedVoice = voices.find(v => v.lang.includes('zh')) 
                || voices.find(v => v.lang.includes('CN'))
                || voices[0];
            console.log('[Voice] Selected voice:', selectedVoice?.name);
        }
    };

    // 尝试立即获取
    loadAvailableVoices();

    // 如果为空，稍后再试
    if (!selectedVoice) {
        speechSynth.onvoiceschanged = () => {
            loadAvailableVoices();
        };
    }
}

/**
 * 语音合成
 * @param {string} text - 要说的文本
 * @param {string} agentId - 说话者ID（可选）
 */
export function speak(text, agentId) {
    if (!voiceEnabled || !speechSynth) return;

    // 停止之前的语音
    if (currentUtterance) {
        speechSynth.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    
    if (selectedVoice) {
        utterance.voice = selectedVoice;
    }
    
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    currentUtterance = utterance;
    speechSynth.speak(utterance);

    console.log('[Voice] Speaking:', text.substring(0, 50));
}

/**
 * 停止当前语音
 */
export function stopSpeech() {
    if (speechSynth) {
        speechSynth.cancel();
        currentUtterance = null;
    }
}

/**
 * 切换语音系统
 */
export function toggleVoiceSystem() {
    voiceEnabled = !voiceEnabled;
    
    if (!voiceEnabled && speechSynth) {
        speechSynth.cancel();
    }
    
    console.log('[Voice] Voice system:', voiceEnabled ? 'ON' : 'OFF');
}

/**
 * 切换音效
 */
export function toggleSound() {
    if (!masterGain) return;
    
    const currentVolume = masterGain.gain.value;
    if (currentVolume > 0) {
        masterGain.gain.value = 0;
        console.log('[Audio] Sound: OFF');
    } else {
        masterGain.gain.value = 0.3;
        console.log('[Audio] Sound: ON');
    }
}

// 挂载到 window（兼容旧代码）
window.speakText = speak;
window.toggleVoiceSystem = toggleVoiceSystem;
window.toggleSound = toggleSound;

export default { 
    initVoice, 
    initAmbientSounds, 
    speak, 
    stopSpeech, 
    toggleVoiceSystem, 
    toggleSound 
};
