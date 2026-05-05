/**
 * BubbleSystem - 气泡渲染系统
 * 
 * 负责智能体的说话气泡和思考气泡渲染
 * 
 * @module client/systems/interaction/bubble-system
 */

import * as THREE from 'three';

const SCROLL_SPEED = 30; // 滚动速度：30像素/秒

/**
 * 创建说话气泡Sprite
 */
function createSpeechBubbleSprite(mesh, offsetY = 2.7) {
    const canvas = document.createElement('canvas');
    canvas.width = 320;
    canvas.height = 48;
    const ctx = canvas.getContext('2d');
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;

    const material = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        depthTest: false
    });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(3, 0.6, 1);
    sprite.position.y = offsetY;
    mesh.add(sprite);

    return { canvas, ctx, texture, sprite };
}

/**
 * 创建思考气泡Sprite
 */
function createThoughtBubbleSprite(mesh, offsetY = 3.0) {
    const canvas = document.createElement('canvas');
    canvas.width = 320;
    canvas.height = 48;
    const ctx = canvas.getContext('2d');
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;

    const material = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        depthTest: false
    });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(3, 0.6, 1);
    sprite.position.y = offsetY;
    mesh.add(sprite);

    return { canvas, ctx, texture, sprite };
}

/**
 * 绘制说话气泡内容
 */
function drawSpeechBubble(ctx, texture, canvas, text, isLongText, scrollX = 0) {
    const textWidth = ctx.measureText(text).width;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // 黑底
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.roundRect(0, 0, canvas.width, canvas.height, 8);
    ctx.fill();
    // 白字
    ctx.fillStyle = '#ffffff';
    ctx.font = '22px Microsoft YaHei, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    
    if (!isLongText) {
        ctx.fillText(text, 10, 24);
    } else {
        const startX = 10 - scrollX;
        ctx.fillText(text, startX, 24);
        if (startX + textWidth < canvas.width) {
            ctx.fillText(text, startX + textWidth + 40, 24);
        }
    }
    texture.needsUpdate = true;
}

/**
 * 绘制思考气泡内容
 */
function drawThoughtBubble(ctx, texture, canvas, text, isLongText, scrollX = 0) {
    const textWidth = ctx.measureText(text).width;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // 黑底，略带灰色
    ctx.fillStyle = 'rgba(30, 30, 30, 0.85)';
    ctx.roundRect(0, 0, canvas.width, canvas.height, 8);
    ctx.fill();
    // 白字，斜体
    ctx.fillStyle = '#cccccc';
    ctx.font = 'italic 20px Microsoft YaHei, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    
    if (!isLongText) {
        ctx.fillText(text, 10, 24);
    } else {
        const startX = 10 - scrollX;
        ctx.fillText(text, startX, 24);
        if (startX + textWidth < canvas.width) {
            ctx.fillText(text, startX + textWidth + 40, 24);
        }
    }
    texture.needsUpdate = true;
}

export class BubbleSystem {
    constructor(scene) {
        this.scene = scene;
        this.speechBubbles = new Map(); // agentId -> speechBubble
        this.thoughtBubbles = new Map(); // agentId -> thoughtBubble
    }

    /**
     * 显示说话气泡
     */
    showSpeechBubble(agent, content) {
        console.log('[BubbleSystem] showSpeechBubble:', agent.id, 'content length:', content ? content.length : 0);
        
        let bubble = this.speechBubbles.get(agent.id);
        if (!bubble) {
            console.log('[BubbleSystem] Creating new speech bubble for:', agent.id);
            bubble = this.createSpeechBubble(agent.mesh);
            this.speechBubbles.set(agent.id, bubble);
        }
        
        bubble.setText(content);
        bubble.show();
    }

    /**
     * 显示思考气泡
     */
    showThoughtBubble(agent, content) {
        let bubble = this.thoughtBubbles.get(agent.id);
        if (!bubble) {
            bubble = this.createThoughtBubble(agent.mesh);
            this.thoughtBubbles.set(agent.id, bubble);
        }
        
        bubble.setText(content);
        bubble.show();
        
        // 5秒后自动隐藏
        bubble.scheduleHide(5000);
    }

    /**
     * 隐藏指定智能体的气泡
     */
    hideBubbles(agentId) {
        const speech = this.speechBubbles.get(agentId);
        if (speech) speech.hide();
        
        const thought = this.thoughtBubbles.get(agentId);
        if (thought) thought.hide();
    }

    /**
     * 隐藏说话气泡
     */
    hideSpeechBubble(agentId) {
        const bubble = this.speechBubbles.get(agentId);
        if (bubble) bubble.hide();
    }

    /**
     * 隐藏思考气泡
     */
    hideThoughtBubble(agentId) {
        const bubble = this.thoughtBubbles.get(agentId);
        if (bubble) bubble.hide();
    }

    /**
     * 创建说话气泡
     */
    createSpeechBubble(mesh) {
        const { canvas, ctx, texture, sprite } = createSpeechBubbleSprite(mesh, 2.7);
        
        let scrollX = 0;
        let text = '';
        let scrollTimer = null;
        let hideTimer = null;
        let scrollStarted = false;
        let scrollComplete = false;
        let totalScrollDistance = 0;
        let creationCount = 0;

        const bubble = {
            sprite,
            
            setText(t) {
                creationCount++;
                console.log(`[BubbleSystem-Speech] set.text #${creationCount}, len: ${t.length}`);
                
                text = t.replace(/\n/g, ' ');
                scrollX = 0;
                scrollStarted = false;
                scrollComplete = false;
                
                if (scrollTimer) clearInterval(scrollTimer);
                if (hideTimer) clearTimeout(hideTimer);
                scrollTimer = null;
                hideTimer = null;
                
                const textWidth = ctx.measureText(text).width;
                const isLongText = textWidth > 300;
                
                if (isLongText) {
                    totalScrollDistance = textWidth + 40;
                }
                
                const charCount = text.length;
                const baseDisplayTime = Math.max(1000, Math.min(120000, charCount * 500));
                
                const draw = () => {
                    drawSpeechBubble(ctx, texture, canvas, text, isLongText, scrollX);
                    if (isLongText && scrollStarted && !scrollComplete) {
                        scrollX += SCROLL_SPEED / 20;
                        if (scrollX >= totalScrollDistance) {
                            scrollComplete = true;
                        }
                    }
                };
                
                draw();
                
                if (isLongText) {
                    scrollStarted = true;
                    const scrollTime = (totalScrollDistance / SCROLL_SPEED) * 1000;
                    hideTimer = setTimeout(() => {
                        if (scrollTimer) clearInterval(scrollTimer);
                        sprite.visible = false;
                    }, Math.max(baseDisplayTime, scrollTime));
                    scrollTimer = setInterval(draw, 50);
                } else {
                    scrollTimer = setInterval(draw, 50);
                    hideTimer = setTimeout(() => {
                        if (scrollTimer) clearInterval(scrollTimer);
                        sprite.visible = false;
                    }, baseDisplayTime);
                }
            },
            
            show() {
                sprite.visible = true;
                this.showTime = Date.now();
            },
            
            hide() {
                sprite.visible = false;
                if (scrollTimer) clearInterval(scrollTimer);
                if (hideTimer) clearTimeout(hideTimer);
                scrollTimer = null;
                hideTimer = null;
            },
            
            get visible() { return sprite.visible; },
            set visible(v) { sprite.visible = v; }
        };
        
        return bubble;
    }

    /**
     * 创建思考气泡
     */
    createThoughtBubble(mesh) {
        const { canvas, ctx, texture, sprite } = createThoughtBubbleSprite(mesh, 3.0);
        
        let scrollX = 0;
        let text = '';
        let scrollTimer = null;
        let hideTimer = null;
        let scrollStarted = false;
        let scrollComplete = false;
        let totalScrollDistance = 0;

        const bubble = {
            sprite,
            
            setText(t) {
                text = t.replace(/\n/g, ' ');
                scrollX = 0;
                scrollStarted = false;
                scrollComplete = false;
                
                if (scrollTimer) clearInterval(scrollTimer);
                
                const textWidth = ctx.measureText(text).width;
                const isLongText = textWidth > 300;
                
                if (isLongText) {
                    totalScrollDistance = textWidth + 40;
                }
                
                const charCount = text.length;
                const baseDisplayTime = Math.max(1000, Math.min(120000, charCount * 500));
                
                const draw = () => {
                    drawThoughtBubble(ctx, texture, canvas, text, isLongText, scrollX);
                    if (isLongText && scrollStarted && !scrollComplete) {
                        scrollX += SCROLL_SPEED / 20;
                        if (scrollX >= totalScrollDistance) {
                            scrollComplete = true;
                        }
                    }
                };
                
                draw();
                
                if (isLongText) {
                    scrollStarted = true;
                    const scrollTime = (totalScrollDistance / SCROLL_SPEED) * 1000;
                    hideTimer = setTimeout(() => {
                        if (scrollTimer) clearInterval(scrollTimer);
                        sprite.visible = false;
                    }, Math.max(baseDisplayTime, scrollTime));
                    scrollTimer = setInterval(draw, 50);
                } else {
                    scrollTimer = setInterval(draw, 50);
                    setTimeout(() => {
                        if (scrollTimer) clearInterval(scrollTimer);
                        sprite.visible = false;
                    }, baseDisplayTime);
                }
            },
            
            show() {
                sprite.visible = true;
                this.showTime = Date.now();
            },
            
            hide() {
                sprite.visible = false;
                if (scrollTimer) clearInterval(scrollTimer);
                if (hideTimer) clearTimeout(hideTimer);
                scrollTimer = null;
                hideTimer = null;
            },
            
            scheduleHide(delayMs) {
                if (hideTimer) clearTimeout(hideTimer);
                hideTimer = setTimeout(() => {
                    this.hide();
                }, delayMs);
            },
            
            get visible() { return sprite.visible; },
            set visible(v) { sprite.visible = v; }
        };
        
        return bubble;
    }

    /**
     * 清理所有气泡
     */
    dispose() {
        for (const [agentId, bubble] of this.speechBubbles) {
            bubble.hide();
        }
        for (const [agentId, bubble] of this.thoughtBubbles) {
            bubble.hide();
        }
        this.speechBubbles.clear();
        this.thoughtBubbles.clear();
    }
}

export default BubbleSystem;
