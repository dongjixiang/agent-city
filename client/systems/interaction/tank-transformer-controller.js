/**
 * 坦克变形金刚控制器
 * 处理 WASD + Space 键盘控制，O 发射炮弹，空格变形
 * 攻击: J=拳击, K=利爪斩, L=碾压(坦克)
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
            transform: false,
            // 攻击键
            punch: false,   // J - 拳击
            slash: false,   // K - 利爪斩
            crush: false    // L - 碾压
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
            // ========== 攻击按键 ==========
            case 'KeyJ': // 拳击（机器人形态）
                this.keys.punch = true;
                console.log('[TankTransformerController] J pressed (拳击)');
                e.preventDefault();
                break;
            case 'KeyK': // 利爪斩（机器人形态）
                this.keys.slash = true;
                console.log('[TankTransformerController] K pressed (利爪斩)');
                e.preventDefault();
                break;
            case 'KeyL': // 碾压（坦克形态）
                this.keys.crush = true;
                console.log('[TankTransformerController] L pressed (碾压)');
                e.preventDefault();
                break;
            case 'KeyO': // 射击（坦克形态）
                this.keys.shoot = true;
                console.log('[TankTransformerController] O pressed (射击)');
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
            // ========== 攻击按键 ==========
            case 'KeyJ':
                this.keys.punch = false;
                break;
            case 'KeyK':
                this.keys.slash = false;
                break;
            case 'KeyL':
                this.keys.crush = false;
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

        // ========== 攻击处理 ==========
        // 射击（O键，只在坦克形态）
        if (this.keys.shoot && tank.isTransformed) {
            tank.performAttack('shoot');
            this.keys.shoot = false;
        }
        
        // 碾压（L键，只在坦克形态）
        if (this.keys.crush && tank.isTransformed) {
            tank.performAttack('crush');
            this.keys.crush = false;
        }
        
        // 拳击（J键，只在机器人形态）
        if (this.keys.punch && !tank.isTransformed) {
            tank.performAttack('punch');
            this.keys.punch = false;
        }
        
        // 利爪斩（K键，只在机器人形态）
        if (this.keys.slash && !tank.isTransformed) {
            tank.performAttack('slash');
            this.keys.slash = false;
        }
        
        // ========== 自动攻击敌人 ==========
        this._autoAttackEnemy();
        
        // ========== 更新面板 ==========
        this.updatePanel();

        // 更新 mesh 位置和旋转
        mesh.position.x = tank.position.x;
        mesh.position.z = tank.position.z;
        mesh.rotation.y = tank.rotation;
    }
    
    /**
     * 显示控制面板（带技能图标和血量条）
     */
    _showControlHint() {
        this._hideControlHint();
        
        const tank = this.tankTransformer;
        const healthPercent = (tank.health / tank.maxHealth * 100).toFixed(0);
        
        const panel = document.createElement('div');
        panel.id = 'tank-control-hint';
        panel.innerHTML = `
            <style>
                #tank-control-hint {
                    position: fixed;
                    left: 20px;
                    bottom: 100px;
                    background: linear-gradient(135deg, rgba(30, 20, 40, 0.95), rgba(40, 20, 60, 0.95));
                    border-radius: 16px;
                    padding: 16px 20px;
                    z-index: 999;
                    border: 2px solid rgba(106, 13, 173, 0.6);
                    box-shadow: 0 4px 30px rgba(106, 13, 173, 0.3);
                    font-family: 'Microsoft YaHei', sans-serif;
                    color: white;
                    animation: tankSlideIn 0.3s ease;
                    min-width: 280px;
                }
                @keyframes tankSlideIn {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                #tank-control-hint .header {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    margin-bottom: 12px;
                    padding-bottom: 10px;
                    border-bottom: 1px solid rgba(106, 13, 173, 0.4);
                }
                #tank-control-hint .title {
                    font-size: 16px;
                    font-weight: bold;
                    color: #9a4cff;
                }
                #tank-control-hint .morph-state {
                    font-size: 11px;
                    color: #aaa;
                    background: rgba(106, 13, 173, 0.3);
                    padding: 2px 8px;
                    border-radius: 10px;
                }
                #tank-control-hint .health-section {
                    margin-bottom: 12px;
                }
                #tank-control-hint .health-label {
                    display: flex;
                    justify-content: space-between;
                    font-size: 12px;
                    margin-bottom: 4px;
                }
                #tank-control-hint .health-bar {
                    height: 16px;
                    background: rgba(0, 0, 0, 0.5);
                    border-radius: 8px;
                    overflow: hidden;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }
                #tank-control-hint .health-fill {
                    height: 100%;
                    background: linear-gradient(90deg, #44aa44, #66cc66);
                    border-radius: 8px;
                    transition: width 0.3s ease;
                }
                #tank-control-hint .skills-section {
                    margin-top: 10px;
                }
                #tank-control-hint .skills-title {
                    font-size: 11px;
                    color: #888;
                    margin-bottom: 8px;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }
                #tank-control-hint .skills-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 8px;
                }
                #tank-control-hint .skill-item {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    padding: 10px 6px;
                    background: rgba(0, 0, 0, 0.3);
                    border-radius: 10px;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    transition: all 0.2s ease;
                    position: relative;
                    overflow: hidden;
                }
                #tank-control-hint .skill-item.on-cooldown {
                    opacity: 0.6;
                }
                #tank-control-hint .skill-icon {
                    font-size: 28px;
                    margin-bottom: 4px;
                }
                #tank-control-hint .skill-name {
                    font-size: 11px;
                    color: #ccc;
                }
                #tank-control-hint .skill-key {
                    font-size: 10px;
                    color: #888;
                    margin-top: 2px;
                }
                #tank-control-hint .skill-cooldown {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
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
                #tank-control-hint .skill-item.on-cooldown .skill-cooldown {
                    opacity: 1;
                }
                #tank-control-hint .cooldown-bar {
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    height: 3px;
                    background: #ff6b6b;
                    transition: width 0.1s linear;
                }
                #tank-control-hint .skill-damage {
                    font-size: 9px;
                    color: #ff6b6b;
                    margin-top: 2px;
                }
                #tank-control-hint .controls-info {
                    margin-top: 12px;
                    padding-top: 10px;
                    border-top: 1px solid rgba(106, 13, 173, 0.3);
                    font-size: 11px;
                    color: #666;
                    display: flex;
                    gap: 10px;
                    justify-content: center;
                }
                #tank-control-hint .exit-hint {
                    margin-top: 10px;
                    text-align: center;
                    font-size: 10px;
                    color: #555;
                }
            </style>
            
            <div class="header">
                <div class="title">🔧 坦克机器人</div>
                <div class="morph-state" id="tank-morph-state">🤖 机器人</div>
            </div>
            
            <div class="health-section">
                <div class="health-label">
                    <span>❤️ HP</span>
                    <span id="tank-health-text">${tank.health} / ${tank.maxHealth}</span>
                </div>
                <div class="health-bar">
                    <div class="health-fill" id="tank-health-fill" style="width: ${healthPercent}%"></div>
                </div>
            </div>
            
            <div class="skills-section">
                <div class="skills-title">⚔️ 技能</div>
                <div class="skills-grid" id="tank-skills-grid"></div>
            </div>
            
            <div class="controls-info">
                <span>移动: W A S D</span>
                <span>变形: 空格</span>
            </div>
            
            <div class="exit-hint">点击空白处或 ESC 退出</div>
        `;
        document.body.appendChild(panel);
        
        this._initTankSkillIcons();
    }
    
    /**
     * 初始化坦克技能图标
     */
    _initTankSkillIcons() {
        const grid = document.getElementById('tank-skills-grid');
        if (!grid) return;
        
        const tank = this.tankTransformer;
        const isRobot = !tank.isTransformed;
        
        const robotSkills = [
            { key: 'J', name: '拳击', icon: '👊', damage: 15, cooldown: 1.5, action: 'punch' },
            { key: 'K', name: '利爪斩', icon: '🗡️', damage: 25, cooldown: 2.5, action: 'slash' }
        ];
        const tankSkills = [
            { key: 'O', name: '主炮射击', icon: '💥', damage: 50, cooldown: 3.0, action: 'shoot' },
            { key: 'L', name: '碾压', icon: '💀', damage: 80, cooldown: 5.0, action: 'crush' }
        ];
        
        const skills = isRobot ? robotSkills : tankSkills;
        grid.innerHTML = '';
        
        skills.forEach(skill => {
            const item = document.createElement('div');
            item.className = 'skill-item';
            item.id = `tank-skill-${skill.action}`;
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
    
    /**
     * 更新技能冷却显示
     */
    _updateTankSkillCooldowns() {
        const tank = this.tankTransformer;
        const isRobot = !tank.isTransformed;
        const robotActions = ['punch', 'slash'];
        const tankActions = ['shoot', 'crush'];
        const actions = isRobot ? robotActions : tankActions;
        const now = Date.now();
        
        actions.forEach(action => {
            const actionData = tank.attackActions[action];
            if (!actionData) return;
            const item = document.getElementById(`tank-skill-${action}`);
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
    
    /**
     * 更新血量显示
     */
    _updateTankHealthDisplay() {
        const tank = this.tankTransformer;
        const healthText = document.getElementById('tank-health-text');
        const healthFill = document.getElementById('tank-health-fill');
        const morphState = document.getElementById('tank-morph-state');
        
        if (healthText) healthText.textContent = `${tank.health} / ${tank.maxHealth}`;
        if (healthFill) {
            const percent = Math.max(0, tank.health / tank.maxHealth * 100);
            healthFill.style.width = percent + '%';
            if (percent < 30) healthFill.style.background = 'linear-gradient(90deg, #ff0000, #ff4444)';
            else if (percent < 60) healthFill.style.background = 'linear-gradient(90deg, #ff8800, #ffaa44)';
            else healthFill.style.background = 'linear-gradient(90deg, #44aa44, #66cc66)';
        }
        if (morphState) morphState.textContent = tank.isTransformed ? '🔫 坦克' : '🤖 机器人';
    }
    
    /**
     * 更新控制面板
     */
    updatePanel() {
        this._updateTankSkillCooldowns();
        this._updateTankHealthDisplay();
    }
    
    /**
     * 自动攻击范围内的敌人
     */
    _autoAttackEnemy() {
        const tank = this.tankTransformer;
        if (!tank || tank.isDead) return;
        
        // 获取敌人（汽车变形金刚）
        const enemy = window.gameSystems?.transformer?.transformer;
        if (!enemy || enemy.isDead) return;
        
        // 计算距离
        const dx = enemy.state.x - tank.position.x;
        const dz = enemy.state.z - tank.position.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        
        // 自动攻击范围：近战 5，远程 30
        const attackRange = tank.isTransformed ? 5 : 30;
        
        if (dist <= attackRange) {
            // 朝向敌人
            const targetAngle = Math.atan2(dx, dz);
            tank.rotation = targetAngle;
            
            // 选择攻击方式
            if (tank.isTransformed) {
                // 坦克形态：碾压 > 主炮
                tank.performAttack('crush', enemy) || tank.performAttack('shoot', enemy);
            } else {
                // 机器人形态：利爪斩 > 拳击
                tank.performAttack('slash', enemy) || tank.performAttack('punch', enemy);
            }
        }
    }
    
    /**
     * 隐藏控制提示
     */
    _hideControlHint() {
        const hint = document.getElementById('tank-control-hint');
        if (hint) hint.remove();
    }
}
