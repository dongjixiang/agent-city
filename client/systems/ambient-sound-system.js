/**
 * AmbientSoundSystem - 鐜闊虫晥绯荤粺
 *
 * 绠＄悊鍩庡競鑳屾櫙闊虫晥锛堥笩楦ｃ€佹按澹般€侀澹扮瓑锛? *
 * @module systems/ambient-sound-system
 */

import * as THREE from 'three';

class AmbientSoundSystem {
    constructor() {
        this.audioContext = null;
        this.masterGain = null;
        this.isEnabled = true;
        this.volume = 0.3; // 涓婚煶閲?
        // 鐜闊抽厤缃?        this.sounds = {
            birds: { gain: null, nodes: [], frequency: 0 },
            wind: { gain: null, nodes: [], frequency: 0 },
            water: { gain: null, nodes: [], frequency: 0 },
            night: { gain: null, nodes: [], frequency: 0 },
            music: { gain: null, nodes: [], gainNode: null }
        };

        this.isInitialized = false;
        this.currentTimeOfDay = 'day'; // day, evening, night
        this._musicInterval = null;
    }

    /**
     * 鍒濆鍖栭煶棰戜笂涓嬫枃锛堥渶瑕佺敤鎴蜂氦浜掑悗鎵嶈兘璋冪敤锛?     */
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
     * 寮€濮嬫挱鏀剧幆澧冮煶锛堥渶瑕佺敤鎴蜂氦浜掕Е鍙戯級
     */
    async start() {
        if (!this.isInitialized) {
            this.init();
        }

        if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }

        // 鍚姩鎵€鏈夌幆澧冮煶
        this.startBirds();
        this.startWind();
        this.startMusic();

        console.log('[AmbientSound] Started ambient sounds');
    }

    /**
     * 鍋滄鎵€鏈夌幆澧冮煶
     */
    stop() {
        for (const soundName in this.sounds) {
            this.stopSound(soundName);
        }
        this.stopMusic();
    }

    /**
     * 鍋滄鐗瑰畾澹伴煶
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
     * 鎾斁楦熼福澹帮紙浣跨敤鎸崱鍣ㄦā鎷燂級
     */
    startBirds() {
        if (!this.audioContext || !this.isEnabled) return;
        
        this.stopSound('birds');
        
        const gain = this.audioContext.createGain();
        gain.gain.value = 0;
        gain.connect(this.masterGain);
        
        this.sounds.birds.gain = gain;
        this.sounds.birds.nodes = [];
        
        // 闅忔満鐢熸垚楦熼福
        const scheduleBirdSong = () => {
            if (!this.isEnabled) return;
            
            const now = this.audioContext.currentTime;
            
            // 鐢熸垚鍑犲０楦熷彨
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
            
            // 5-15绉掑悗鍐嶆鎾斁
            const nextDelay = 5000 + Math.random() * 10000;
            setTimeout(scheduleBirdSong, nextDelay);
        };
        
        // 寤惰繜寮€濮?        setTimeout(scheduleBirdSong, 2000);
    }

    /**
     * 鎾斁椋庡０锛堜娇鐢ㄥ櫔闊虫ā鎷燂級
     */
    startWind() {
        if (!this.audioContext || !this.isEnabled) return;
        
        this.stopSound('wind');
        
        // 鍒涘缓鍣煶鑺傜偣
        const bufferSize = 2 * this.audioContext.sampleRate;
        const noiseBuffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }
        
        const whiteNoise = this.audioContext.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;
        
        // 鍒涘缓婊ゆ尝鍣ㄦā鎷熼澹?        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 400;
        filter.Q.value = 1;
        
        // 鍒涘缓澧炵泭鎺у埗
        const gain = this.audioContext.createGain();
        gain.gain.value = 0.05;
        
        whiteNoise.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        
        whiteNoise.start();
        
        this.sounds.wind.nodes = [whiteNoise, filter];
        this.sounds.wind.gain = gain;
        
        // 闅忔椂闂村彉鍖栭澹板己搴?        const modulateWind = () => {
            if (!this.isEnabled || !this.sounds.wind.gain) return;
            
            const time = Date.now() * 0.001;
            const volume = 0.03 + Math.sin(time * 0.2) * 0.02;
            this.sounds.wind.gain.gain.value = volume;
            
            setTimeout(modulateWind, 1000);
        };
        
        setTimeout(modulateWind, 1000);
    }

    /**
     * 鏍规嵁鏃堕棿鏇存柊闊虫晥锛堢櫧澶?澶滄櫄锛?     */
    updateForTimeOfDay(timeOfDay) {
        if (this.currentTimeOfDay === timeOfDay) return;
        
        this.currentTimeOfDay = timeOfDay;
        
        if (timeOfDay === 'night') {
            // 澶滄櫄鍑忓皯楦熼福锛屽鍔犺櫕楦?            this.stopSound('birds');
            this.startNightSounds();
        } else if (timeOfDay === 'evening') {
            // 鍌嶆櫄娣峰悎澹伴煶
            this.stopSound('night');
        } else {
            // 鐧藉ぉ姝ｅ父楦熼福
            this.stopSound('night');
            this.startBirds();
        }
    }

    /**
     * 鎾斁澶滈棿铏福
     */
    startNightSounds() {
        if (!this.audioContext || !this.isEnabled) return;
        
        this.stopSound('night');
        
        const gain = this.audioContext.createGain();
        gain.gain.value = 0.08;
        gain.connect(this.masterGain);
        
        // 鍒涘缓澶氫釜楂橀鎸崱鍣ㄦā鎷熻櫕楦?        for (let i = 0; i < 5; i++) {
            const osc = this.audioContext.createOscillator();
            osc.type = 'sine';
            osc.frequency.value = 3000 + i * 500 + Math.random() * 200;
            
            // 璋冨埗铏福
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
     * 鎾斁杞诲揩鑳屾櫙闊充箰锛堝悎鎴?pad锛?     */
    startMusic() {
        if (!this.audioContext || !this.isEnabled) return;
        this.stopMusic();

        // 闊充箰闊抽噺鍜屼富闊抽噺鍒嗗紑锛堣儗鏅煶涔愰煶閲忔洿灏忥級
        const musicGain = this.audioContext.createGain();
        musicGain.gain.value = 0;
        musicGain.connect(this.masterGain);
        this.sounds.music.gainNode = musicGain;

        // 鑳屾櫙闊充箰鍜屽鸡杩涜锛堥檷鍗婇煶閬垮厤鎵版皯锛?        const chordSeq = [
            [261.63, 329.63, 392.00],  // C4, E4, G4
            [220.00, 261.63, 329.63],  // A3, C4, E4 (Am)
            [174.61, 220.00, 261.63],  // F3, A3, C4 (F)
            [196.00, 246.94, 293.66],  // G3, B3, D4 (G)
        ];
        let chordIdx = 0;

        const playChord = () => {
            if (!this.isEnabled || !this.sounds.music.gainNode) return;
            const now = this.audioContext.currentTime;
            const chord = chordSeq[chordIdx];

            // 娣″嚭鏃у拰寮?            this.sounds.music.gainNode.gain.setTargetAtTime(0, now, 1.5);

            // 鍒涘缓鏂板拰寮︼紙3涓寮︽尝鍙犲姞锛?            const osc1 = this.audioContext.createOscillator();
            const osc2 = this.audioContext.createOscillator();
            const osc3 = this.audioContext.createOscillator();
            const chordGain = this.audioContext.createGain();

            osc1.type = osc2.type = osc3.type = 'sine';
            osc1.frequency.value = chord[0];
            osc2.frequency.value = chord[1];
            osc3.frequency.value = chord[2];

            // 杞绘煍闊抽噺
            chordGain.gain.setValueAtTime(0, now);
            chordGain.gain.linearRampToValueAtTime(0.25, now + 2);  // 2绉掓贰鍏?            chordGain.gain.setValueAtTime(0.25, now + 8);
            chordGain.gain.linearRampToValueAtTime(0, now + 10);    // 2绉掓贰鍑?
            osc1.connect(chordGain);
            osc2.connect(chordGain);
            osc3.connect(chordGain);
            chordGain.connect(this.sounds.music.gainNode);

            osc1.start(now);
            osc2.start(now);
            osc3.start(now);
            osc1.stop(now + 11);
            osc2.stop(now + 11);
            osc3.stop(now + 11);

            chordIdx = (chordIdx + 1) % chordSeq.length;
        };

        // 绔嬪嵆鎾斁绗竴缁勶紝鐒跺悗姣?0绉掑垏鎹?        playChord();
        this._musicInterval = setInterval(playChord, 10000);
    }

    /**
     * 鍋滄鑳屾櫙闊充箰
     */
    stopMusic() {
        if (this._musicInterval) {
            clearInterval(this._musicInterval);
            this._musicInterval = null;
        }
        if (this.sounds.music.gainNode) {
            try {
                this.sounds.music.gainNode.disconnect();
            } catch (e) {}
            this.sounds.music.gainNode = null;
        }
    }

    /**
     * 鑾峰彇 masterGain锛堜緵鍏朵粬绯荤粺澶嶇敤锛屽寮曟搸闊虫晥锛?     */
    getMasterGain() {
        return this.masterGain;
    }

    /**
     * 鑾峰彇 audioContext锛堜緵鍏朵粬绯荤粺澶嶇敤锛?     */
    getAudioContext() {
        return this.audioContext;
    }

    /**
     * 璁剧疆闊抽噺
     */
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        if (this.masterGain) {
            this.masterGain.gain.value = this.volume;
        }
    }

    /**
     * 鍚敤/绂佺敤
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
 * 鑾峰彇鐜闊崇郴缁熷疄渚? */
function getAmbientSoundSystem() {
    if (!ambientSoundSystem) {
        ambientSoundSystem = new AmbientSoundSystem();
    }
    return ambientSoundSystem;
}

export { AmbientSoundSystem, getAmbientSoundSystem };
