/**
 * HeadDisplay - 智能体头顶显示
 * 
 * 对应 DESIGN.md Section 8.2 WorldWindow
 * 在智能体头顶显示消息、思考气泡、状态
 */

import * as THREE from 'three';
import { eventBus, Events } from '../../core/event-bus.js';

class HeadDisplay {
    constructor(scene) {
        this.scene = scene;
        this.displays = new Map();  // agentId -> { group, nameText, messageText, thoughtBubble }
        this.canvasTexture = null;
        this.initTexture();
    }

    /**
     * 初始化画布纹理
     */
    initTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 128;
        this.canvasTexture = new THREE.CanvasTexture(canvas);
        this.canvasTexture.needsUpdate = true;
    }

    /**
     * 为智能体创建头顶显示
     */
    createForAgent(agent) {
        const group = new THREE.Group();
        group.name = `headDisplay_${agent.id}`;

        // 名字标签背景
        const nameBgGeometry = new THREE.PlaneGeometry(3, 0.6);
        const nameBgMaterial = new THREE.MeshBasicMaterial({
            color: agent.color || 0xff6b6b,
            transparent: true,
            opacity: 0.9,
            side: THREE.DoubleSide
        });
        const nameBg = new THREE.Mesh(nameBgGeometry, nameBgMaterial);
        nameBg.position.y = 2.5;
        nameBg.rotation.x = -0.2;
        group.add(nameBg);

        // 名字文字（使用 HTML 覆盖层更灵活，这里用简单几何体）
        const nameText = this.createTextSprite(agent.name, {
            fontSize: 28,
            color: '#ffffff',
            backgroundColor: null
        });
        nameText.position.y = 2.5;
        nameText.position.z = 0.01;
        group.add(nameText);

        // 消息气泡
        const messageBg = new THREE.Group();
        messageBg.position.y = 3.2;
        messageBg.visible = false;

        const msgBgGeometry = new THREE.PlaneGeometry(4, 1);
        const msgBgMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.95,
            side: THREE.DoubleSide
        });
        const msgBg = new THREE.Mesh(msgBgGeometry, msgBgMaterial);
        msgBg.rotation.x = -0.1;
        messageBg.add(msgBg);

        // 消息文字
        const msgText = this.createTextSprite('', {
            fontSize: 24,
            color: '#333333'
        });
        msgText.position.z = 0.01;
        messageBg.add(msgText);

        group.add(messageBg);

        // 思考气泡（虚线圆）
        const thoughtBubble = new THREE.Group();
        thoughtBubble.position.y = 3.5;
        thoughtBubble.visible = false;

        const bubbleGeometry = new THREE.SphereGeometry(0.5, 16, 16);
        const bubbleMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffcc,
            transparent: true,
            opacity: 0.8
        });
        const bubble = new THREE.Mesh(bubbleGeometry, bubbleMaterial);
        bubble.scale.set(2, 1.5, 1);
        thoughtBubble.add(bubble);

        group.add(thoughtBubble);

        // 保存引用
        this.displays.set(agent.id, {
            group,
            nameText,
            messageBg,
            msgText,
            thoughtBubble,
            agent
        });

        this.scene.add(group);
        return group;
    }

    /**
     * 创建文字精灵
     */
    createTextSprite(text, options = {}) {
        const {
            fontSize = 32,
            color = '#ffffff',
            backgroundColor = 'rgba(0,0,0,0.5)'
        } = options;

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = 512;
        canvas.height = 128;

        // 绘制背景
        if (backgroundColor) {
            ctx.fillStyle = backgroundColor;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        // 绘制文字
        ctx.fillStyle = color;
        ctx.font = `bold ${fontSize}px "Microsoft YaHei", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // 自动换行
        const maxWidth = 480;
        const lines = this.wrapText(ctx, text, maxWidth);
        const lineHeight = fontSize * 1.2;
        const startY = 64 - (lines.length - 1) * lineHeight / 2;

        lines.forEach((line, i) => {
            ctx.fillText(line, 256, startY + i * lineHeight);
        });

        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;

        const material = new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
            depthTest: false
        });
        const sprite = new THREE.Sprite(material);
        sprite.scale.set(3, 0.75, 1);

        return sprite;
    }

    /**
     * 文字自动换行
     */
    wrapText(ctx, text, maxWidth) {
        const words = text.split('');
        const lines = [];
        let currentLine = '';

        for (const char of words) {
            const testLine = currentLine + char;
            const metrics = ctx.measureText(testLine);
            if (metrics.width > maxWidth && currentLine.length > 0) {
                lines.push(currentLine);
                currentLine = char;
            } else {
                currentLine = testLine;
            }
        }
        if (currentLine.length > 0) {
            lines.push(currentLine);
        }

        return lines.length > 0 ? lines : [''];
    }

    /**
     * 显示消息
     * @param {string} agentId - 智能体ID
     * @param {string} message - 消息内容
     * @param {string} emotion - 情绪 (happy/sad/angry/neutral)
     */
    showMessage(agentId, message, emotion = 'neutral') {
        const display = this.displays.get(agentId);
        if (!display) return;

        // 设置消息背景颜色
        const colors = {
            happy: 0x90EE90,
            sad: 0x87CEEB,
            angry: 0xFFB6C1,
            neutral: 0xFFFFFF
        };
        display.messageBg.children[0].material.color.setHex(colors[emotion] || colors.neutral);

        // 更新文字
        display.msgText.material.map.dispose();
        display.msgText.material.map = this.createTextSprite(message, {
            fontSize: 24,
            color: '#333333'
        }).material.map;
        display.msgText.material.needsUpdate = true;

        // 显示
        display.messageBg.visible = true;
        display.thoughtBubble.visible = false;

        // 3秒后自动隐藏
        if (this._messageTimeouts) {
            clearTimeout(this._messageTimeouts[agentId]);
        } else {
            this._messageTimeouts = {};
        }
        this._messageTimeouts[agentId] = setTimeout(() => {
            this.hideMessage(agentId);
        }, 3000);
    }

    /**
     * 隐藏消息
     */
    hideMessage(agentId) {
        const display = this.displays.get(agentId);
        if (display) {
            display.messageBg.visible = false;
        }
    }

    /**
     * 显示思考气泡
     * @param {string} agentId - 智能体ID
     * @param {string} thought - 思考内容
     */
    showThoughtBubble(agentId, thought) {
        const display = this.displays.get(agentId);
        if (!display) return;

        display.thoughtBubble.visible = true;
        display.messageBg.visible = false;

        // 5秒后自动隐藏
        setTimeout(() => {
            display.thoughtBubble.visible = false;
        }, 5000);
    }

    /**
     * 隐藏思考气泡
     */
    hideThoughtBubble(agentId) {
        const display = this.displays.get(agentId);
        if (display) {
            display.thoughtBubble.visible = false;
        }
    }

    /**
     * 更新智能体位置
     */
    updatePosition(agentId, position) {
        const display = this.displays.get(agentId);
        if (display && display.group) {
            display.group.position.set(position.x, 0, position.z);
        }
    }

    /**
     * 更新所有显示的位置（跟随智能体）
     */
    updateAllPositions() {
        for (const [agentId, display] of this.displays) {
            if (display.agent && display.agent.position) {
                display.group.position.set(
                    display.agent.position.x,
                    0,
                    display.agent.position.z
                );
            }
        }
    }

    /**
     * 移除智能体显示
     */
    removeForAgent(agentId) {
        const display = this.displays.get(agentId);
        if (display) {
            this.scene.remove(display.group);
            display.group.traverse(child => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                    if (child.material.map) child.material.map.dispose();
                    child.material.dispose();
                }
            });
            this.displays.delete(agentId);
        }
    }

    /**
     * 设置名字颜色
     */
    setAgentColor(agentId, color) {
        const display = this.displays.get(agentId);
        if (display && display.group.children[0]) {
            display.group.children[0].material.color.set(color);
        }
    }

    /**
     * 显示/隐藏所有显示
     */
    setVisible(visible) {
        for (const display of this.displays.values()) {
            display.group.visible = visible;
        }
    }

    /**
     * 销毁
     */
    dispose() {
        for (const agentId of this.displays.keys()) {
            this.removeForAgent(agentId);
        }
        if (this._messageTimeouts) {
            Object.values(this._messageTimeouts).forEach(t => clearTimeout(t));
        }
    }
}

export { HeadDisplay };
