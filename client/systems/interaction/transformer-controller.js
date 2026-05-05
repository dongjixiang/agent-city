/**
 * TransformerController - 变形金刚控制模式
 *
 * 当点击变形金刚后进入控制模式，用户可以用键盘控制变形金刚移动
 *
 * @module systems/interaction/transformer-controller
 */

import * as THREE from 'three';
import { eventBus, Events } from '../../core/event-bus.js';
import { isValidWalkPosition } from '../../core/entity-validator.js';
import { getAmbientSoundSystem } from '../ambient-sound-system.js';

class TransformerController {
    constructor(transformerBehaviors) {
        this.transformerBehaviors = transformerBehaviors;
        this.isActive = false;
        this.keys = {
            forward: false,   // W or ↑
            backward: false,  // S or ↓
            left: false,      // A or ←
            right: false,     // D or →
            transform: false, // Space
        };
        this.moveSpeed = 5.0;    // 前进/后退速度
        this.turnSpeed = 2.0;   // 转向速度 (rad/s)
        this.transformCooldown = 0; // 变形冷却时间

        // ========== 引擎音效系统 ==========
        this._audioCtx = null;
        this._engineOsc = null;
        this._engineGain = null;
        this._noiseSource = null;
        this._engineRunning = false;
    }

    /** 初始化 Web Audio 引擎音效 */
    _initEngineSound() {
        if (this._audioCtx) return;
        try {
            const ambient = getAmbientSoundSystem();
            let ctx = null;
            let dest = null;

            // 优先复用 ambient 的 AudioContext（确保同 context）
            if (ambient.isInitialized) {
                ctx = ambient.getAudioContext();
                const mg = ambient.getMasterGain();
                if (ctx && mg && mg.context === ctx) {
                    dest = mg;
                    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
                }
            }

            // 无法复用 ambient，创建独立的 AudioContext
            if (!ctx) {
                ctx = new (window.AudioContext || window.webkitAudioContext)();
                dest = ctx.destination;
            }

            this._audioCtx = ctx;

            // ========== 创建音频节点 ==========
            // 主引擎振荡器（锯齿波 = 引擎轰鸣）
            this._engineOsc = ctx.createOscillator();
            this._engineOsc.type = 'sawtooth';
            this._engineOsc.frequency.setValueAtTime(60, ctx.currentTime);

            // 引擎音量
            this._engineGain = ctx.createGain();
            this._engineGain.gain.setValueAtTime(0, ctx.currentTime);

            // 低通滤波（让声音更低沉）
            const filter = ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(300, ctx.currentTime);

            // 白噪音（排气声）
            const bufferSize = ctx.sampleRate * 2;
            const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const noiseData = noiseBuffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) noiseData[i] = Math.random() * 2 - 1;

            this._noiseSource = ctx.createBufferSource();
            this._noiseSource.buffer = noiseBuffer;
            this._noiseSource.loop = true;

            const noiseGain = ctx.createGain();
            noiseGain.gain.setValueAtTime(0, ctx.currentTime);

            // ========== 连接节点链 ==========
            // 振荡器 → 滤波 → 引擎音量 → 目标（masterGain 或 destination）
            this._engineOsc.connect(filter);
            filter.connect(this._engineGain);
            this._engineGain.connect(dest);

            // 噪音 → 噪音音量 → 引擎音量 → 目标
            this._noiseSource.connect(noiseGain);
            noiseGain.connect(this._engineGain);

            // 启动
            this._engineOsc.start();
            this._noiseSource.start();

            // 存储引用用于音量调节
            this._noiseGain = noiseGain;
            this._filter = filter;
            console.log('[TransformerController] 引擎音效已初始化');
        } catch (e) {
            console.warn('[TransformerController] 引擎音效初始化失败:', e.message);
            this._audioCtx = null;
        }
    }

    /** 启动引擎音效（激活时调用） */
    _startEngineSound() {
        if (!this._audioCtx || this._engineRunning) return;
        this._engineRunning = true;
        // 从静音淡入
        this._engineGain.gain.setTargetAtTime(0.08, this._audioCtx.currentTime, 0.1);
    }

    /** 停止引擎音效 */
    _stopEngineSound() {
        if (!this._audioCtx || !this._engineRunning) return;
        this._engineRunning = false;
        this._engineGain.gain.setTargetAtTime(0, this._audioCtx.currentTime, 0.2);
    }

    /** 更新引擎音效（每帧调用，dx/dz不为零时触发） */
    _updateEngineSound(dx, dz, deltaTime) {
        if (!this._audioCtx || !this._engineRunning || !this._noiseGain) return;
        const speed = Math.sqrt(dx * dx + dz * dz) / deltaTime; // 单位/秒
        const t = this._audioCtx.currentTime;

        // 频率：60Hz（静止）~ 180Hz（高速）
        const freq = 60 + Math.min(speed * 4, 120);
        this._engineOsc.frequency.setTargetAtTime(freq, t, 0.05);

        // 噪音音量随速度增加
        const noiseVol = Math.min(speed * 0.003, 0.06);
        this._noiseGain.gain.setTargetAtTime(noiseVol, t, 0.05);
    }

    /**
     * 激活控制模式
     */
    activate() {
        if (this.isActive) return;
        this.isActive = true;
        window.addEventListener('keydown', this.onKeyDown);
        window.addEventListener('keyup', this.onKeyUp);
        eventBus.on('clickOutside', this.deactivate);

        // 初始化并启动引擎音效
        this._initEngineSound();
        this._startEngineSound();

        // 设置变形金刚为被控制状态
        if (this.transformerBehaviors?.transformer) {
            this.transformerBehaviors.transformer.state.isControlled = true;
        }

        console.log('[TransformerController] 控制模式已激活');
        this._showControlHint();
    }

    /**
     * 取消激活控制模式
     */
    deactivate = () => {
        if (!this.isActive) return;
        this.isActive = false;
        window.removeEventListener('keydown', this.onKeyDown);
        window.removeEventListener('keyup', this.onKeyUp);
        eventBus.off('clickOutside', this.deactivate);

        // 停止引擎音效
        this._stopEngineSound();

        // 取消变形金刚被控制状态
        if (this.transformerBehaviors?.transformer) {
            this.transformerBehaviors.transformer.state.isControlled = false;
        }
        
        this._hideControlHint();
        console.log('[TransformerController] 控制模式已取消');
    };

    /**
     * 键盘按下处理
     */
    onKeyDown = (e) => {
        if (!this.isActive) return;
        
        switch (e.code) {
            case 'KeyW':
            case 'ArrowUp':
                this.keys.forward = true;
                break;
            case 'KeyS':
            case 'ArrowDown':
                this.keys.backward = true;
                break;
            case 'KeyA':
            case 'ArrowLeft':
                this.keys.left = true;
                break;
            case 'KeyD':
            case 'ArrowRight':
                this.keys.right = true;
                break;
            case 'Space':
                if (this.transformCooldown <= 0) {
                    this.keys.transform = true;
                }
                e.preventDefault();
                break;
        }
    };

    /**
     * 键盘松开处理
     */
    onKeyUp = (e) => {
        switch (e.code) {
            case 'KeyW':
            case 'ArrowUp':
                this.keys.forward = false;
                break;
            case 'KeyS':
            case 'ArrowDown':
                this.keys.backward = false;
                break;
            case 'KeyA':
            case 'ArrowLeft':
                this.keys.left = false;
                break;
            case 'KeyD':
            case 'ArrowRight':
                this.keys.right = false;
                break;
            case 'Space':
                this.keys.transform = false;
                break;
        }
    };

    /**
     * 更新控制（每帧调用）
     */
    update(deltaTime) {
        if (!this.isActive) return;

        const transformer = this.transformerBehaviors?.transformer;
        if (!transformer) return;

        // 更新变形冷却
        if (this.transformCooldown > 0) {
            this.transformCooldown -= deltaTime;
        }

        // 处理变形（控制模式下可以直接触发变形）
        if (this.keys.transform && this.transformCooldown <= 0) {
            // 直接触发变形，不依赖定时器逻辑
            if (!transformer.state.isTransforming) {
                transformer._startTransform();
                this.transformCooldown = 1.0; // 1秒冷却
            }
            this.keys.transform = false;
        }

        // 处理移动
        const group = transformer.group;
        if (!group) return;

        // 转向
        if (this.keys.left) {
            group.rotation.y += this.turnSpeed * deltaTime;
        }
        if (this.keys.right) {
            group.rotation.y -= this.turnSpeed * deltaTime;
        }

        // 前进/后退
        const direction = new THREE.Vector3(0, 0, 1);
        direction.applyQuaternion(group.quaternion);
        
        // 速度：机器人形态较慢，汽车形态较快
        const speed = transformer.state.isTransformed ? this.moveSpeed : this.moveSpeed * 1.5;

        // 计算目标位置并验证
        let dx = 0, dz = 0;
        if (this.keys.forward) {
            dx = direction.x * speed * deltaTime;
            dz = direction.z * speed * deltaTime;
        }
        if (this.keys.backward) {
            dx = -direction.x * speed * deltaTime * 0.6;
            dz = -direction.z * speed * deltaTime * 0.6;
        }

        // 边界验证（目标位置而非当前位置）
        if (dx !== 0 || dz !== 0) {
            const newX = group.position.x + dx;
            const newZ = group.position.z + dz;
            const valid = isValidWalkPosition(newX, newZ);
            if (!valid.valid) {
                console.log('[Transformer] 阻止移动到 (' + newX.toFixed(1) + ',' + newZ.toFixed(1) + ') 原因:', valid.reason);
                dx = 0; dz = 0;
            }
        }

        // 应用移动
        group.position.x += dx;
        group.position.z += dz;

        // 更新引擎音效
        this._updateEngineSound(dx, dz, deltaTime);

        // 更新目标位置为当前位置（停止巡逻）
        transformer.state.targetX = group.position.x;
        transformer.state.targetZ = group.position.z;
        transformer.state.waitTimer = 0; // 立即更新
    }

    /**
     * 显示控制提示
     */
    _showControlHint() {
        this._hideControlHint(); // 先移除旧的
        
        const hint = document.createElement('div');
        hint.id = 'transformer-control-hint';
        hint.innerHTML = `
            <style>
                #transformer-control-hint {
                    position: fixed;
                    left: 20px;
                    bottom: 100px;
                    background: rgba(26, 26, 46, 0.92);
                    border-radius: 12px;
                    padding: 16px 20px;
                    z-index: 999;
                    border: 1px solid rgba(204, 0, 0, 0.4);
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
                    font-family: 'Microsoft YaHei', sans-serif;
                    color: white;
                    animation: slideIn 0.3s ease;
                    min-width: 200px;
                }
                @keyframes slideIn {
                    from { opacity: 0; transform: translateX(-20px); }
                    to { opacity: 1; transform: translateX(0); }
                }
                #transformer-control-hint .title {
                    color: #CC0000;
                    font-size: 14px;
                    font-weight: bold;
                    margin-bottom: 12px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                #transformer-control-hint .key-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin: 8px 0;
                    font-size: 13px;
                }
                #transformer-control-hint .key {
                    background: rgba(255, 255, 255, 0.15);
                    padding: 4px 10px;
                    border-radius: 6px;
                    font-family: monospace;
                    font-size: 12px;
                    min-width: 50px;
                    text-align: center;
                    border: 1px solid rgba(255, 255, 255, 0.2);
                }
                #transformer-control-hint .action {
                    color: #aaa;
                }
                #transformer-control-hint .exit-hint {
                    margin-top: 12px;
                    padding-top: 10px;
                    border-top: 1px solid rgba(255,255,255,0.1);
                    font-size: 11px;
                    color: #666;
                    text-align: center;
                }
            </style>
            <div class="title">🤖 变形金刚控制</div>
            <div class="key-row">
                <span class="action">前进</span>
                <span class="key">W / ↑</span>
            </div>
            <div class="key-row">
                <span class="action">后退</span>
                <span class="key">S / ↓</span>
            </div>
            <div class="key-row">
                <span class="action">向左</span>
                <span class="key">A / ←</span>
            </div>
            <div class="key-row">
                <span class="action">向右</span>
                <span class="key">D / →</span>
            </div>
            <div class="key-row">
                <span class="action">变形</span>
                <span class="key">Space</span>
            </div>
            <div class="exit-hint">按 Esc 或点击空白处退出控制</div>
        `;
        document.body.appendChild(hint);

        // Esc 退出
        window.addEventListener('keydown', this.onEscKey);
    }

    /**
     * 隐藏控制提示
     */
    _hideControlHint() {
        const hint = document.getElementById('transformer-control-hint');
        if (hint) hint.remove();
        window.removeEventListener('keydown', this.onEscKey);
    }

    /**
     * Esc 键退出
     */
    onEscKey = (e) => {
        if (e.code === 'Escape') {
            this.deactivate();
        }
    };
}

export { TransformerController };