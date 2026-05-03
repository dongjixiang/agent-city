/**
 * AmbientSoundSystem - 环境音效系统
 *
 * 管理城市背景音效（鸟鸣、水声、风声等）
 *
 * @module systems/ambient-sound-system
 */

import * as THREE from 'three';

class AmbientSoundSystem {
    constructor() {
        this.audioContext = null;
        this.masterGain = null;
        this.isEnabled = true;
        this.volume = 0.3; // 主音量
        
        // 环境音配置
        this.sounds = {
            birds: { gain: null, nodes: [], frequency: 0 },
            wind: { gain: null, nodes: [], frequency: 0 },
            water: { gain: null, nodes: [], frequency: 0 },
            night: { gain: null, nodes: [], frequency: 0 }
        };
        
        this.isInitialized = false;
        this.currentTimeOfDay = 'day'; // day, evening, night
    }

    /**
     * 初始化音频上下文（需要用户交互后才能调用）
     */
    init() {
        if (this.isInitialized) return;
        
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.audioContext.createGain();
            this.masterGain.connect(this.audioContext.destination);
            this.masterGain.gain.value = this.volume;
            
            this.isInitialized = true;
            console.log('[AmbientSound] Audio system initialized');
        } catch (e) {
            console.error('[AmbientSound] Failed to initialize audio:', e);
        }
    }

    /**
     * 开始播放环境音（需要用户交互触发）
     */
    async start() {
        if (!this.isInitialized) {
            this.init();
        }
        
        if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }
        
        // 启动所有环境音
        this.startBirds();
        this.startWind();
        
        console.log('[AmbientSound] Started ambient sounds');
    }

    /**
     * 停止所有环境音
     */
    stop() {
        for (const soundName in this.sounds) {
            this.stopSound(soundName);
        }
    }

    /**
     * 停止特定声音
     */
    stopSound(soundName) {
        const sound = this.sounds[soundName];
        if (!sound || !sound.nodes) return;
        
        sound.nodes.forEach(node => {
            try {
                if (node.stop) node.stop();
                if (node.disconnect) node.disconnect();
            } catch (e) {}
        });
        sound.nodes = [];
        
        if (sound.gain) {
            try {
                sound.gain.disconnect();
            } catch (e) {}
            sound.gain = null;
        }
    }

    /**
     * 播放鸟鸣声（使用振荡器模拟）
     */
    startBirds() {
        if (!this.audioContext || !this.isEnabled) return;
        
        this.stopSound('birds');
        
        const gain = this.audioContext.createGain();
        gain.gain.value = 0;
        gain.connect(this.masterGain);
        
        this.sounds.birds.gain = gain;
        this.sounds.birds.nodes = [];
        
        // 随机生成鸟鸣
        const scheduleBirdSong = () => {
            if (!this.isEnabled) return;
            
            const now = this.audioContext.currentTime;
            
            // 生成几声鸟叫
            for (let i = 0; i < 3; i++) {
                const osc = this.audioContext.createOscillator();
                const oscGain = this.audioContext.createGain();
                
                osc.type = 'sine';
                osc.frequency.value = 2000 + Math.random() * 2000; // 2-4kHz
                
                oscGain.gain.setValueAtTime(0, now + i * 0.3);
                oscGain.gain.linearRampToValueAtTime(0.1, now + i * 0.3 + 0.05);
                oscGain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.3 + 0.2);
                
                osc.connect(oscGain);
                oscGain.connect(gain);
                
                osc.start(now + i * 0.3);
                osc.stop(now + i * 0.3 + 0.25);
                
                this.sounds.birds.nodes.push(osc);
            }
            
            // 5-15秒后再次播放
            const nextDelay = 5000 + Math.random() * 10000;
            setTimeout(scheduleBirdSong, nextDelay);
        };
        
        // 延迟开始
        setTimeout(scheduleBirdSong, 2000);
    }

    /**
     * 播放风声（使用噪音模拟）
     */
    startWind() {
        if (!this.audioContext || !this.isEnabled) return;
        
        this.stopSound('wind');
        
        // 创建噪音节点
        const bufferSize = 2 * this.audioContext.sampleRate;
        const noiseBuffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }
        
        const whiteNoise = this.audioContext.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;
        
        // 创建滤波器模拟风声
        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 400;
        filter.Q.value = 1;
        
        // 创建增益控制
        const gain = this.audioContext.createGain();
        gain.gain.value = 0.05;
        
        whiteNoise.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        
        whiteNoise.start();
        
        this.sounds.wind.nodes = [whiteNoise, filter];
        this.sounds.wind.gain = gain;
        
        // 随时间变化风声强度
        const modulateWind = () => {
            if (!this.isEnabled || !this.sounds.wind.gain) return;
            
            const time = Date.now() * 0.001;
            const volume = 0.03 + Math.sin(time * 0.2) * 0.02;
            this.sounds.wind.gain.gain.value = volume;
            
            setTimeout(modulateWind, 1000);
        };
        
        setTimeout(modulateWind, 1000);
    }

    /**
     * 根据时间更新音效（白天/夜晚）
     */
    updateForTimeOfDay(timeOfDay) {
        if (this.currentTimeOfDay === timeOfDay) return;
        
        this.currentTimeOfDay = timeOfDay;
        
        if (timeOfDay === 'night') {
            // 夜晚减少鸟鸣，增加虫鸣
            this.stopSound('birds');
            this.startNightSounds();
        } else if (timeOfDay === 'evening') {
            // 傍晚混合声音
            this.stopSound('night');
        } else {
            // 白天正常鸟鸣
            this.stopSound('night');
            this.startBirds();
        }
    }

    /**
     * 播放夜间虫鸣
     */
    startNightSounds() {
        if (!this.audioContext || !this.isEnabled) return;
        
        this.stopSound('night');
        
        const gain = this.audioContext.createGain();
        gain.gain.value = 0.08;
        gain.connect(this.masterGain);
        
        // 创建多个高频振荡器模拟虫鸣
        for (let i = 0; i < 5; i++) {
            const osc = this.audioContext.createOscillator();
            osc.type = 'sine';
            osc.frequency.value = 3000 + i * 500 + Math.random() * 200;
            
            // 调制虫鸣
            const lfo = this.audioContext.createOscillator();
            const lfoGain = this.audioContext.createGain();
            lfo.frequency.value = 5 + Math.random() * 10;
            lfoGain.gain.value = 100;
            
            lfo.connect(lfoGain);
            lfoGain.connect(osc.frequency);
            
            osc.connect(gain);
            
            osc.start();
            lfo.start();
            
            this.sounds.night.nodes.push(osc, lfo);
        }
        
        this.sounds.night.gain = gain;
    }

    /**
     * 设置音量
     */
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        if (this.masterGain) {
            this.masterGain.gain.value = this.volume;
        }
    }

    /**
     * 启用/禁用
     */
    setEnabled(enabled) {
        this.isEnabled = enabled;
        if (!enabled) {
            this.stop();
        } else {
            this.start();
        }
    }
}

let ambientSoundSystem = null;

/**
 * 获取环境音系统实例
 */
function getAmbientSoundSystem() {
    if (!ambientSoundSystem) {
        ambientSoundSystem = new AmbientSoundSystem();
    }
    return ambientSoundSystem;
}

export { AmbientSoundSystem, getAmbientSoundSystem };