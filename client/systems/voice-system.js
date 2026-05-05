/**
 * VoiceSystem - 智能体语音合成系统
 *
 * 使用浏览器 Web Speech API 实现 TTS
 *
 * @module systems/voice-system
 */

import { eventBus, Events } from '../core/event-bus.js';

class VoiceSystem {
    constructor() {
        this.speechSynthesis = window.speechSynthesis;
        this.isEnabled = true;
        this.volume = 0.8; // 音量 0-1
        
        console.log('[VoiceSystem] Initializing...', this.speechSynthesis ? 'Web Speech API available' : 'Web Speech API NOT available');
        
        // 不同智能体可以有不同语音设置
        this.voiceConfigs = {
            'xiaoji1977': { rate: 0.95, pitch: 1.1, voice: null }, // 小吉 - 稍快稍高
            'transformer': { rate: 0.85, pitch: 0.8, voice: null }, // 变形金刚 - 低沉
            'default': { rate: 1.0, pitch: 1.0, voice: null }
        };
        
        this.currentSpeeches = new Map(); // agentId -> Speech utterance
        
        // 加载可用语音
        this.availableVoices = [];
        this.loadVoices();
        
        // 监听智能体说话事件
        eventBus.on(Events.AGENT_SPEAK, this.onAgentSpeak.bind(this));
        
        // 当 WebSocket 收到说话消息时也触发 TTS
        this.setupWSListener();
        
        // 监听气泡显示事件
        this.setupBubbleListener();
    }
    
    /**
     * 加载可用语音列表
     */
    loadVoices() {
        // 立即获取一次
        this.availableVoices = this.speechSynthesis.getVoices();
        console.log('[VoiceSystem] Initial voices loaded:', this.availableVoices.length);
        
        if (this.availableVoices.length > 0) {
            this.matchVoices();
        }
        
        // 如果支持 voiceschanged 事件，监听它
        if (this.speechSynthesis.onvoiceschanged !== undefined) {
            this.speechSynthesis.onvoiceschanged = () => {
                this.availableVoices = this.speechSynthesis.getVoices();
                console.log('[VoiceSystem] Voices changed, now:', this.availableVoices.length);
                this.matchVoices();
            };
        } else {
            // Safari/Firefox 可能不支持，需要轮询
            console.log('[VoiceSystem] onvoiceschanged not supported, polling...');
            const pollVoices = setInterval(() => {
                const voices = this.speechSynthesis.getVoices();
                if (voices.length > 0) {
                    this.availableVoices = voices;
                    this.matchVoices();
                    clearInterval(pollVoices);
                    console.log('[VoiceSystem] Polled voices:', voices.length);
                }
            }, 200);
            
            // 10秒后停止轮询
            setTimeout(() => clearInterval(pollVoices), 10000);
        }
    }
    
    /**
     * 为不同智能体匹配合适的语音
     */
    matchVoices() {
        const zhVoices = this.availableVoices.filter(v => 
            v.lang.includes('zh') || v.lang.includes('CN')
        );
        const enVoices = this.availableVoices.filter(v => 
            v.lang.includes('en')
        );
        
        // 小吉用中文语音
        if (zhVoices.length > 0) {
            this.voiceConfigs['xiaoji1977'].voice = zhVoices[0];
        }
        
        // 变形金刚用英文低沉语音
        if (enVoices.length > 0) {
            const lowVoice = enVoices.find(v => 
                v.name.toLowerCase().includes('male') || 
                v.name.toLowerCase().includes('deep')
            );
            this.voiceConfigs['transformer'].voice = lowVoice || enVoices[0];
        }
    }
    
    /**
     * 监听说话事件
     */
    onAgentSpeak(data) {
        if (!this.isEnabled || !data.message) return;
        
        const agentId = data.agentId || 'default';
        this.speak(agentId, data.message);
    }
    
    /**
     * 设置 WebSocket 监听
     */
    setupWSListener() {
        // 监听 window 上的 showAgentMessage 调用
        const originalFn = window.showAgentMessage;
        window.showAgentMessage = (agentId, message) => {
            // 调用原函数显示气泡
            if (originalFn) originalFn(agentId, message);
            
            // 同时触发 TTS
            if (this.isEnabled && message) {
                this.speak(agentId, message);
            }
        };
    }
    
    /**
     * 设置气泡显示监听
     */
    setupBubbleListener() {
        // 拦截 showAgentMessageBubble 函数
        const originalShowBubble = window.showAgentMessageBubble;
        window.showAgentMessageBubble = (agentId, message) => {
            // 调用原函数显示气泡
            if (originalShowBubble) {
                originalShowBubble(agentId, message);
            } else {
                // 备用：直接创建气泡
                console.log('[VoiceSystem] Bubble:', agentId, message);
            }
            
            // 同时触发 TTS
            if (this.isEnabled && message && message.trim()) {
                console.log('[VoiceSystem] Triggering TTS for:', agentId, '-', message.substring(0, 50));
                this.speak(agentId, message);
            }
        };
        
        // 也监听 world-window 中的消息显示
        window.addEventListener('message', (e) => {
            if (e.data && e.data.type === 'AGENT_MESSAGE' && e.data.message) {
                if (this.isEnabled && e.data.message.trim()) {
                    this.speak(e.data.agentId || 'default', e.data.message);
                }
            }
        });
    }
    
    /**
     * 说话
     */
    speak(agentId, text) {
        console.log('[VoiceSystem.speak] called with agentId:', agentId, 'text:', text ? text.substring(0,30) : 'null');
        
        if (!this.speechSynthesis) {
            console.log('[VoiceSystem.speak] ERROR: speechSynthesis not available');
            return;
        }
        
        if (!text || text.length === 0) {
            console.log('[VoiceSystem.speak] ERROR: empty text');
            return;
        }
        
        // 确保音频上下文可用
        if (this.speechSynthesis.paused) {
            this.speechSynthesis.resume();
        }
        
        // 停止之前的语音
        this.speechSynthesis.cancel();
        
        // 创建新的语音 utterance
        const utterance = new SpeechSynthesisUtterance(text);
        
        // 获取语音配置
        const config = this.voiceConfigs[agentId] || this.voiceConfigs['default'];
        console.log('[VoiceSystem.speak] config for', agentId, ':', config);
        console.log('[VoiceSystem.speak] available voices:', this.availableVoices.length);
        
        // 尝试匹配中文语音
        if (agentId === 'xiaoji1977' || agentId === 'default') {
            const zhVoice = this.availableVoices.find(v => v.lang.includes('zh') || v.lang.includes('CN'));
            if (zhVoice) {
                utterance.voice = zhVoice;
                console.log('[VoiceSystem.speak] Using Chinese voice:', zhVoice.name);
            } else {
                console.log('[VoiceSystem.speak] No Chinese voice found, using default');
            }
        }
        
        utterance.rate = config.rate;
        utterance.pitch = config.pitch;
        utterance.volume = this.volume;
        
        console.log('[VoiceSystem.speak] Speaking with rate:', utterance.rate, 'pitch:', utterance.pitch, 'volume:', utterance.volume);
        
        // 错误处理
        utterance.onerror = (e) => {
            console.log('[VoiceSystem] Speech error:', e.error);
        };
        
        utterance.onend = () => {
            console.log('[VoiceSystem] Speech complete');
        };
        
        utterance.onstart = () => {
            console.log('[VoiceSystem] Speech started');
        };
        
        // 开始说话
        this.speechSynthesis.speak(utterance);
        
        console.log('[VoiceSystem.speak] speak() completed, speaking:', this.speechSynthesis.speaking);
    }
    
    /**
     * 停止说话
     */
    stop(agentId = null) {
        if (!this.speechSynthesis) return;
        
        if (agentId) {
            // 停止特定智能体的语音
            this.speechSynthesis.cancel();
            this.currentSpeeches.delete(agentId);
        } else {
            // 停止所有语音
            this.speechSynthesis.cancel();
            this.currentSpeeches.clear();
        }
    }
    
    /**
     * 启用/禁用
     */
    setEnabled(enabled) {
        this.isEnabled = enabled;
        if (!enabled) {
            this.stop();
        }
    }
    
    /**
     * 设置音量
     */
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
    }
}

let voiceSystem = null;

/**
 * 获取语音系统实例
 */
function getVoiceSystem() {
    if (!voiceSystem) {
        voiceSystem = new VoiceSystem();
    }
    return voiceSystem;
}

export { VoiceSystem, getVoiceSystem };