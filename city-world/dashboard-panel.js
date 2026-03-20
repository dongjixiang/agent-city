/**
 * 智体城 - 实时数据可视化面板
 */

class DashboardPanel {
    constructor() {
        this.panel = null;
        this.stats = {
            agents: 0,
            tasks: 0,
            messages: 0,
            ideas: 0
        };
        this.createPanel();
    }

    createPanel() {
        // 创建面板容器
        this.panel = document.createElement('div');
        this.panel.id = 'dashboard-panel';
        this.panel.innerHTML = `
            <style>
                #dashboard-panel {
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    width: 320px;
                    background: rgba(26, 26, 46, 0.95);
                    border-radius: 15px;
                    padding: 20px;
                    color: white;
                    font-family: 'Microsoft YaHei', sans-serif;
                    z-index: 100;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }
                
                #dashboard-panel h3 {
                    margin: 0 0 15px 0;
                    color: #4ecdc4;
                    font-size: 18px;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                    padding-bottom: 10px;
                }
                
                .stat-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin: 12px 0;
                    padding: 10px;
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 8px;
                }
                
                .stat-label {
                    font-size: 14px;
                    color: #aaa;
                }
                
                .stat-value {
                    font-size: 24px;
                    font-weight: bold;
                    color: #4ecdc4;
                }
                
                .activity-indicator {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin-top: 15px;
                    padding-top: 15px;
                    border-top: 1px solid rgba(255, 255, 255, 0.1);
                }
                
                .pulse-dot {
                    width: 10px;
                    height: 10px;
                    background: #4ecdc4;
                    border-radius: 50%;
                    animation: pulse 2s infinite;
                }
                
                @keyframes pulse {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.5; transform: scale(1.2); }
                }
                
                .recent-activity {
                    font-size: 12px;
                    color: #888;
                    margin-top: 5px;
                }
                
                .mini-chart {
                    margin-top: 15px;
                    padding-top: 15px;
                    border-top: 1px solid rgba(255, 255, 255, 0.1);
                }
                
                .bar-container {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    margin: 8px 0;
                }
                
                .bar-label {
                    width: 80px;
                    font-size: 12px;
                    color: #888;
                }
                
                .bar-track {
                    flex: 1;
                    height: 20px;
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 10px;
                    overflow: hidden;
                }
                
                .bar-fill {
                    height: 100%;
                    border-radius: 10px;
                    transition: width 0.5s ease;
                }
                
                .bar-value {
                    font-size: 12px;
                    color: #fff;
                    padding-left: 10px;
                }
            </style>
            
            <h3>📊 智体城实时监控</h3>
            
            <div class="stat-row">
                <span class="stat-label">🦐 在线智能体</span>
                <span class="stat-value" id="stat-agents">0</span>
            </div>
            
            <div class="stat-row">
                <span class="stat-label">📋 进行中任务</span>
                <span class="stat-value" id="stat-tasks">0</span>
            </div>
            
            <div class="stat-row">
                <span class="stat-label">💬 消息数量</span>
                <span class="stat-value" id="stat-messages">0</span>
            </div>
            
            <div class="stat-row">
                <span class="stat-label">💡 创意数量</span>
                <span class="stat-value" id="stat-ideas">0</span>
            </div>
            
            <div class="activity-indicator">
                <div class="pulse-dot"></div>
                <span>系统运行正常</span>
            </div>
            
            <div class="recent-activity" id="recent-activity">
                最后更新: 刚刚
            </div>
            
            <div class="mini-chart">
                <div class="bar-container">
                    <span class="bar-label">AI助手</span>
                    <div class="bar-track">
                        <div class="bar-fill" id="bar-ai" style="width: 0%; background: #6366f1;"></div>
                    </div>
                </div>
                
                <div class="bar-container">
                    <span class="bar-label">专业团队</span>
                    <div class="bar-track">
                        <div class="bar-fill" id="bar-pro" style="width: 0%; background: #f97316;"></div>
                    </div>
                </div>
                
                <div class="bar-container">
                    <span class="bar-label">观察者</span>
                    <div class="bar-track">
                        <div class="bar-fill" id="bar-observer" style="width: 0%; background: #06b6d4;"></div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(this.panel);
    }

    update(agents, tasks, messages) {
        // 更新统计数字
        const totalAgents = agents ? agents.length : 0;
        this.animateNumber('stat-agents', totalAgents);
        this.animateNumber('stat-tasks', tasks || 0);
        this.animateNumber('stat-messages', messages || 0);
        
        // 更新分类统计
        if (agents) {
            const aiCount = agents.filter(a => a.tags && (a.tags.includes('ai') || a.tags.includes('assistant'))).length;
            const proCount = agents.filter(a => a.tags && (a.tags.includes('analyst') || a.tags.includes('coordinator') || a.tags.includes('creative') || a.tags.includes('guardian'))).length;
            const observerCount = agents.filter(a => a.tags && a.tags.includes('observer')).length;
            
            const maxAgents = Math.max(totalAgents, 1);
            
            this.updateBar('bar-ai', (aiCount / maxAgents) * 100);
            this.updateBar('bar-pro', (proCount / maxAgents) * 100);
            this.updateBar('bar-observer', (observerCount / maxAgents) * 100);
        }
        
        // 更新时间
        document.getElementById('recent-activity').textContent = 
            `最后更新: ${new Date().toLocaleTimeString('zh-CN')}`;
    }

    animateNumber(elementId, targetValue) {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        const currentValue = parseInt(element.textContent) || 0;
        const diff = targetValue - currentValue;
        const steps = 20;
        const stepValue = diff / steps;
        let step = 0;
        
        const interval = setInterval(() => {
            step++;
            const newValue = Math.round(currentValue + stepValue * step);
            element.textContent = newValue;
            
            if (step >= steps) {
                clearInterval(interval);
                element.textContent = targetValue;
            }
        }, 30);
    }

    updateBar(barId, percentage) {
        const bar = document.getElementById(barId);
        if (bar) {
            bar.style.width = `${Math.min(percentage, 100)}%`;
        }
    }

    addIdeas(count) {
        this.animateNumber('stat-ideas', count);
    }
}

// 导出
window.DashboardPanel = DashboardPanel;
