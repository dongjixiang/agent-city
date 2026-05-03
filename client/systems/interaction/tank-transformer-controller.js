/**
 * 坦克变形金刚控制器
 * 处理 WASD + Space 键盘控制，O 发射炮弹，空格变形
 */

import * as THREE from 'three';
import { eventBus, Events } from '../../core/event-bus.js';

export class TankTransformerController {
    constructor(tankTransformer) {
        this.tankTransformer = tankTransformer;
        this.isActive = false;
        this.keys = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            shoot: false,
            transform: false
        };
        this.moveSpeed = 5.0;    // 前进/后退速度
        this.turnSpeed = 2.0;   // 转向速度 (rad/s)
        this.transformCooldown = 0; // 变形冷却时间
        
        this.onKeyDown = this.onKeyDown.bind(this);
        this.onKeyUp = this.onKeyUp.bind(this);
        this.onClickOutside = this.onClickOutside.bind(this);
    }
    
    activate() {
        if (this.isActive) return;
        this.isActive = true;
        this._ignoreNextClick = true; // 忽略接下来的点击事件（防止 showControlBar 触发 deactivate）
        
        // 通知坦克进入受控状态，停止自主移动
        this.tankTransformer.activateControl();
        
        window.addEventListener('keydown', this.onKeyDown);
        window.addEventListener('keyup', this.onKeyUp);
        document.addEventListener('click', this.onClickOutside);
        
        console.log('[TankTransformerController] 控制模式已激活');
        console.log('[TankTransformerController] tankTransformer.isControlled:', this.tankTransformer.isControlled);
        this._showControlHint();
        
        // 重置忽略标志 - 延迟确保 showControlBar 完全完成
        setTimeout(() => { this._ignoreNextClick = false; }, 500);
    }
    
    deactivate = () => {
        if (!this.isActive) return;
        this.isActive = false;
        
        // 通知坦克恢复自主状态
        this.tankTransformer.deactivateControl();
        
        window.removeEventListener('keydown', this.onKeyDown);
        window.removeEventListener('keyup', this.onKeyUp);
        document.removeEventListener('click', this.onClickOutside);
        
        this._hideControlHint();
        console.log('[TankTransformerController] 控制模式已取消');
    };
    
    onClickOutside(e) {
        // 如果需要忽略这次点击，不关闭
        if (this._ignoreNextClick) return;
        
        // 如果点击的是提示面板本身，不关闭
        if (e.target.closest('#tank-control-hint')) return;
        // 如果点击的是控制条，不关闭
        if (e.target.closest('#camera-control-bar')) return;
        
        this.deactivate();
    }
    
    onKeyDown(e) {
        if (!this.isActive) return;
        
        console.log('[TankTransformerController] 按键:', e.code);
        
        switch (e.code) {
            case 'KeyW':
            case 'ArrowUp':
                this.keys.forward = true;
                console.log('[TankTransformerController] W pressed');
                break;
            case 'KeyS':
            case 'ArrowDown':
                this.keys.backward = true;
                console.log('[TankTransformerController] S pressed');
                break;
            case 'KeyA':
            case 'ArrowLeft':
                this.keys.left = true;
                console.log('[TankTransformerController] A pressed');
                break;
            case 'KeyD':
            case 'ArrowRight':
                this.keys.right = true;
                console.log('[TankTransformerController] D pressed');
                break;
            case 'Space':
                if (this.transformCooldown <= 0) {
                    this.keys.transform = true;
                    console.log('[TankTransformerController] Space transform pressed');
                }
                e.preventDefault();
                break;
            case 'KeyO':
                this.keys.shoot = true;
                console.log('[TankTransformerController] O pressed');
                e.preventDefault();
                break;
        }
    }
    
    onKeyUp(e) {
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
            case 'KeyO':
                this.keys.shoot = false;
                break;
        }
    }
    
    update(deltaTime) {
        if (!this.isActive) return;

        const tank = this.tankTransformer;
        if (!tank) return;

        // 更新变形冷却
        if (this.transformCooldown > 0) {
            this.transformCooldown -= deltaTime;
        }

        // 处理变形（空格键）
        if (this.keys.transform && this.transformCooldown <= 0) {
            if (!tank.state.isTransforming) {
                console.log('[TankTransformerController] 触发变形！');
                tank.transform();
                this.transformCooldown = 1.0;
            }
            this.keys.transform = false;
        }

        // 处理转向
        if (this.keys.left) {
            tank.rotation += this.turnSpeed * deltaTime;
        }
        if (this.keys.right) {
            tank.rotation -= this.turnSpeed * deltaTime;
        }

        // 处理移动 - 使用 tank.rotation 直接计算
        const mesh = tank.mesh;
        if (!mesh) return;
        
        // 速度：机器人形态较慢，坦克形态较快
        const speed = tank.isTransformed ? this.moveSpeed * 1.5 : this.moveSpeed;

        // 前进方向基于 tank.rotation
        // 当 tank.rotation = 0 时，面向 +Z 方向
        const sin = Math.sin(tank.rotation);
        const cos = Math.cos(tank.rotation);
        
        if (this.keys.forward) {
            tank.position.x += sin * speed * deltaTime;
            tank.position.z += cos * speed * deltaTime;
        }
        if (this.keys.backward) {
            tank.position.x -= sin * speed * deltaTime * 0.6;
            tank.position.z -= cos * speed * deltaTime * 0.6;
        }

        // 射击（O键，只在坦克形态）
        if (this.keys.shoot && tank.isTransformed) {
            tank.shoot();
        }

        // 更新 mesh 位置和旋转
        mesh.position.x = tank.position.x;
        mesh.position.z = tank.position.z;
        mesh.rotation.y = tank.rotation;
    }
    
    /**
     * 显示控制提示
     */
    _showControlHint() {
        this._hideControlHint();
        
        const hint = document.createElement('div');
        hint.id = 'tank-control-hint';
        hint.innerHTML = `
            <style>
                #tank-control-hint {
                    position: fixed;
                    left: 20px;
                    bottom: 100px;
                    background: rgba(26, 26, 46, 0.92);
                    border-radius: 12px;
                    padding: 16px 20px;
                    z-index: 999;
                    border: 1px solid rgba(45, 90, 39, 0.6);
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
                #tank-control-hint .title {
                    color: #4a7c4e;
                    font-size: 14px;
                    font-weight: bold;
                    margin-bottom: 12px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                #tank-control-hint .key-row {
                    display: flex;
                    justify-content: space-between;
                    margin: 6px 0;
                    font-size: 13px;
                }
                #tank-control-hint .key {
                    background: rgba(74, 124, 78, 0.3);
                    padding: 4px 10px;
                    border-radius: 4px;
                    font-weight: bold;
                    color: #7cb87c;
                    min-width: 50px;
                    text-align: center;
                }
                #tank-control-hint .action {
                    color: #ccc;
                }
                #tank-control-hint .exit-hint {
                    margin-top: 12px;
                    padding-top: 10px;
                    border-top: 1px solid rgba(255,255,255,0.1);
                    font-size: 11px;
                    color: #888;
                    text-align: center;
                }
            </style>
            <div class="title">🔧 坦克变形金刚</div>
            <div class="key-row">
                <span class="action">前进</span>
                <span class="key">W / ↑</span>
            </div>
            <div class="key-row">
                <span class="action">后退</span>
                <span class="key">S / ↓</span>
            </div>
            <div class="key-row">
                <span class="action">左转</span>
                <span class="key">A / ←</span>
            </div>
            <div class="key-row">
                <span class="action">右转</span>
                <span class="key">D / →</span>
            </div>
            <div class="key-row">
                <span class="action">变形</span>
                <span class="key">空格</span>
            </div>
            <div class="key-row">
                <span class="action">开炮</span>
                <span class="key">O</span>
            </div>
            <div class="exit-hint">点击空白处或 ESC 退出</div>
        `;
        document.body.appendChild(hint);
    }
    
    /**
     * 隐藏控制提示
     */
    _hideControlHint() {
        const hint = document.getElementById('tank-control-hint');
        if (hint) {
            hint.remove();
        }
    }
}
