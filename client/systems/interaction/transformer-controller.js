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
            // 攻击键
            punch: false,      // J - 重拳（机器人形态）
            shieldBash: false, // K - 盾牌冲击（机器人形态）
            ram: false,       // L - 冲撞（汽车形态）
            boost: false     // ; - 加速冲击（汽车形态）
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
            // 攻击键
            case 'KeyJ': // 重拳
                if (!this.keys.punch) {
                    this.keys.punch = true;
                    this._performAttack('punch');
                }
                break;
            case 'KeyK': // 盾牌冲击
                if (!this.keys.shieldBash) {
                    this.keys.shieldBash = true;
                    this._performAttack('shieldBash');
                }
                break;
            case 'KeyL': // 冲撞
                if (!this.keys.ram) {
                    this.keys.ram = true;
                    this._performAttack('ram');
                }
                break;
            case 'Semicolon': // 加速冲击
                if (!this.keys.boost) {
                    this.keys.boost = true;
                    this._performAttack('boost');
                }
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
            // 攻击键
            case 'KeyJ':
                this.keys.punch = false;
                break;
            case 'KeyK':
                this.keys.shieldBash = false;
                break;
            case 'KeyL':
                this.keys.ram = false;
                break;
            case 'Semicolon':
                this.keys.boost = false;
                break;
        }
    };
    
    /**
     * 执行攻击
     */
    _performAttack(attackType) {
        const transformer = this.transformerBehaviors?.transformer;
        if (!transformer) return;
        
        const isRobot = transformer.state.isTransformed;
        
        // 检查形态是否匹配
        if ((attackType === 'punch' || attackType === 'shieldBash') && !isRobot) {
            console.log(`[TransformerController] ${attackType} 只在机器人形态可用！`);
            return;
        }
        if ((attackType === 'ram' || attackType === 'boost') && isRobot) {
            console.log(`[TransformerController] ${attackType} 只在汽车形态可用！`);
            return;
        }
        
        const result = transformer.performAttack(attackType);
        if (result) {
            console.log(`[TransformerController] ${attackType} 攻击成功！`);
        }
    }

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
        transformer.state.waitTimer = 0;
        
        // 自动攻击敌人
        this._autoAttackEnemy();
        
        // 更新面板
        this._updateTransformerPanel();
    }

    /**
     * 显示控制提示
     */
    _showControlHint() {
        this._hideControlHint();
        
        const transformer = this.transformerBehaviors?.transformer;
        const healthPercent = transformer ? (transformer.health / transformer.maxHealth * 100).toFixed(0) : 100;
        const isRobot = transformer?.state?.isTransformed;
        
        const hint = document.createElement('div');
        hint.id = 'transformer-control-hint';
        hint.innerHTML = `
            <style>
                #transformer-control-hint {
                    position: fixed;
                    left: 20px;
                    bottom: 100px;
                    background: linear-gradient(135deg, rgba(40, 20, 20, 0.95), rgba(60, 20, 20, 0.95));
                    border-radius: 16px;
                    padding: 16px 20px;
                    z-index: 999;
                    border: 2px solid rgba(204, 0, 0, 0.6);
                    box-shadow: 0 4px 30px rgba(204, 0, 0, 0.3);
                    font-family: 'Microsoft YaHei', sans-serif;
                    color: white;
                    animation: tfSlideIn 0.3s ease;
                    min-width: 280px;
                }
                @keyframes tfSlideIn {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                #transformer-control-hint .header {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    margin-bottom: 12px;
                    padding-bottom: 10px;
                    border-bottom: 1px solid rgba(204, 0, 0, 0.4);
                }
                #transformer-control-hint .title {
                    font-size: 16px;
                    font-weight: bold;
                    color: #ff6666;
                }
                #transformer-control-hint .morph-state {
                    font-size: 11px;
                    color: #aaa;
                    background: rgba(204, 0, 0, 0.3);
                    padding: 2px 8px;
                    border-radius: 10px;
                }
                #transformer-control-hint .health-section { margin-bottom: 12px; }
                #transformer-control-hint .health-label {
                    display: flex;
                    justify-content: space-between;
                    font-size: 12px;
                    margin-bottom: 4px;
                }
                #transformer-control-hint .health-bar {
                    height: 16px;
                    background: rgba(0, 0, 0, 0.5);
                    border-radius: 8px;
                    overflow: hidden;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }
                #transformer-control-hint .health-fill {
                    height: 100%;
                    background: linear-gradient(90deg, #44aa44, #66cc66);
                    border-radius: 8px;
                    transition: width 0.3s ease;
                }
                #transformer-control-hint .skills-section { margin-top: 10px; }
                #transformer-control-hint .skills-title {
                    font-size: 11px;
                    color: #888;
                    margin-bottom: 8px;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }
                #transformer-control-hint .skills-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 8px;
                }
                #transformer-control-hint .skill-item {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    padding: 10px 6px;
                    background: rgba(0, 0, 0, 0.3);
                    border-radius: 10px;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    position: relative;
                    overflow: hidden;
                }
                #transformer-control-hint .skill-item.on-cooldown { opacity: 0.6; }
                #transformer-control-hint .skill-icon { font-size: 28px; margin-bottom: 4px; }
                #transformer-control-hint .skill-name { font-size: 11px; color: #ccc; }
                #transformer-control-hint .skill-key { font-size: 10px; color: #888; margin-top: 2px; }
                #transformer-control-hint .skill-cooldown {
                    position: absolute;
                    top: 0; left: 0; width: 100%; height: 100%;
                    background: rgba(0, 0, 0, 0.7);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 16px;
                    font-weight: bold;
                    color: #fff;
                    opacity: 0;
                    pointer-events: none;
                }
                #transformer-control-hint .skill-item.on-cooldown .skill-cooldown { opacity: 1; }
                #transformer-control-hint .cooldown-bar {
                    position: absolute;
                    bottom: 0; left: 0;
                    height: 3px;
                    background: #ff6b6b;
                    transition: width 0.1s linear;
                }
                #transformer-control-hint .skill-damage { font-size: 9px; color: #ff6b6b; margin-top: 2px; }
                #transformer-control-hint .controls-info {
                    margin-top: 12px;
                    padding-top: 10px;
                    border-top: 1px solid rgba(204, 0, 0, 0.3);
                    font-size: 11px;
                    color: #666;
                    display: flex;
                    gap: 10px;
                    justify-content: center;
                }
                #transformer-control-hint .exit-hint {
                    margin-top: 10px;
                    text-align: center;
                    font-size: 10px;
                    color: #555;
                }
            </style>
            
            <div class="header">
                <div class="title">🤖 汽车机器人</div>
                <div class="morph-state" id="tf-morph-state">🤖 机器人</div>
            </div>
            
            <div class="health-section">
                <div class="health-label">
                    <span>❤️ HP</span>
                    <span id="tf-health-text">${transformer?.health || 150} / ${transformer?.maxHealth || 150}</span>
                </div>
                <div class="health-bar">
                    <div class="health-fill" id="tf-health-fill" style="width: ${healthPercent}%"></div>
                </div>
            </div>
            
            <div class="skills-section">
                <div class="skills-title">⚔️ 技能</div>
                <div class="skills-grid" id="tf-skills-grid"></div>
            </div>
            
            <div class="controls-info">
                <span>移动: W A S D</span>
                <span>变形: 空格</span>
            </div>
            
            <div class="exit-hint">点击空白处或 ESC 退出</div>
        `;
        document.body.appendChild(hint);
        
        this._initTransformerSkillIcons();
        
        window.addEventListener('keydown', this.onEscKey);
    }
    
    _initTransformerSkillIcons() {
        const grid = document.getElementById('tf-skills-grid');
        if (!grid) return;
        
        const transformer = this.transformerBehaviors?.transformer;
        if (!transformer) return;
        
        const isRobot = transformer.state.isTransformed;
        
        const robotSkills = [
            { key: 'J', name: '重拳', icon: '👊', damage: 20, cooldown: 1.2, action: 'punch' },
            { key: 'K', name: '盾牌冲击', icon: '🛡️', damage: 30, cooldown: 2.0, action: 'shieldBash' }
        ];
        const carSkills = [
            { key: 'O', name: '冲撞', icon: '🚗', damage: 45, cooldown: 2.5, action: 'ram' },
            { key: 'L', name: '加速冲击', icon: '⚡', damage: 60, cooldown: 4.0, action: 'boost' }
        ];
        
        const skills = isRobot ? robotSkills : carSkills;
        grid.innerHTML = '';
        
        skills.forEach(skill => {
            const item = document.createElement('div');
            item.className = 'skill-item';
            item.id = `tf-skill-${skill.action}`;
            item.innerHTML = `
                <div class="skill-icon">${skill.icon}</div>
                <div class="skill-name">${skill.name}</div>
                <div class="skill-key">${skill.key}</div>
                <div class="skill-damage">-${skill.damage}</div>
                <div class="skill-cooldown"></div>
                <div class="cooldown-bar"></div>
            `;
            grid.appendChild(item);
        });
    }
    
    _updateTransformerSkillCooldowns() {
        const transformer = this.transformerBehaviors?.transformer;
        if (!transformer) return;
        
        const isRobot = transformer.state.isTransformed;
        const robotActions = ['punch', 'shieldBash'];
        const carActions = ['ram', 'boost'];
        const actions = isRobot ? robotActions : carActions;
        const now = Date.now();
        
        actions.forEach(action => {
            const actionData = transformer.attackActions[action];
            if (!actionData) return;
            const item = document.getElementById(`tf-skill-${action}`);
            if (!item) return;
            
            const elapsed = (now - actionData.lastUsed) / 1000;
            const remaining = actionData.cooldown - elapsed;
            const cooldownEl = item.querySelector('.skill-cooldown');
            const barEl = item.querySelector('.cooldown-bar');
            
            if (remaining > 0) {
                item.classList.add('on-cooldown');
                cooldownEl.textContent = remaining.toFixed(1) + 's';
                barEl.style.width = ((1 - remaining / actionData.cooldown) * 100) + '%';
            } else {
                item.classList.remove('on-cooldown');
                cooldownEl.textContent = '';
                barEl.style.width = '100%';
            }
        });
    }
    
    _updateTransformerHealthDisplay() {
        const transformer = this.transformerBehaviors?.transformer;
        if (!transformer) return;
        
        const healthText = document.getElementById('tf-health-text');
        const healthFill = document.getElementById('tf-health-fill');
        const morphState = document.getElementById('tf-morph-state');
        
        if (healthText) healthText.textContent = `${transformer.health} / ${transformer.maxHealth}`;
        if (healthFill) {
            const percent = Math.max(0, transformer.health / transformer.maxHealth * 100);
            healthFill.style.width = percent + '%';
            if (percent < 30) healthFill.style.background = 'linear-gradient(90deg, #ff0000, #ff4444)';
            else if (percent < 60) healthFill.style.background = 'linear-gradient(90deg, #ff8800, #ffaa44)';
            else healthFill.style.background = 'linear-gradient(90deg, #44aa44, #66cc66)';
        }
        if (morphState) morphState.textContent = transformer.state.isTransformed ? '🤖 机器人' : '🚗 汽车';
    }
    
    _updateTransformerPanel() {
        this._updateTransformerSkillCooldowns();
        this._updateTransformerHealthDisplay();
    }
    
    _autoAttackEnemy() {
        const transformer = this.transformerBehaviors?.transformer;
        if (!transformer || transformer.isDead) return;
        
        const enemy = window.gameSystems?.tankTransformer;
        if (!enemy || enemy.isDead) return;
        
        const dx = enemy.position.x - transformer.state.x;
        const dz = enemy.position.z - transformer.state.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        
        const attackRange = transformer.state.isTransformed ? 5 : 25;
        
        if (dist <= attackRange) {
            const targetAngle = Math.atan2(dx, dz);
            transformer.group.rotation.y = -targetAngle + Math.PI;
            
            if (transformer.state.isTransformed) {
                transformer.performAttack('shieldBash', enemy) || transformer.performAttack('punch', enemy);
            } else {
                transformer.performAttack('boost', enemy) || transformer.performAttack('ram', enemy);
            }
        }
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