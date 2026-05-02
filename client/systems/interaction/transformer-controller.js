/**
 * TransformerController - 变形金刚控制模式
 *
 * 当点击变形金刚后进入控制模式，用户可以用键盘控制变形金刚移动
 *
 * @module systems/interaction/transformer-controller
 */

import * as THREE from 'three';
import { eventBus, Events } from '../../core/event-bus.js';

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

        if (this.keys.forward) {
            group.position.x += direction.x * speed * deltaTime;
            group.position.z += direction.z * speed * deltaTime;
        }
        if (this.keys.backward) {
            group.position.x -= direction.x * speed * deltaTime * 0.6;
            group.position.z -= direction.z * speed * deltaTime * 0.6;
        }

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