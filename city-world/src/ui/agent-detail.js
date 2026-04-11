/**
 * 智能体详情面板
 */

class AgentDetailPanel {
    constructor() {
        this.panel = null;
        this.currentAgent = null;
        this.createPanel();
    }

    createPanel() {
        this.panel = document.createElement('div');
        this.panel.id = 'agent-detail-panel';
        this.panel.style.display = 'none';
        this.panel.innerHTML = `
            <style>
                #agent-detail-panel {
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    width: 400px;
                    background: rgba(26, 26, 46, 0.95);
                    border-radius: 20px;
                    padding: 30px;
                    color: white;
                    z-index: 2000;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);
                    border: 2px solid rgba(255, 255, 255, 0.1);
                }
                
                .panel-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                    padding-bottom: 15px;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                }
                
                .agent-name {
                    font-size: 28px;
                    font-weight: bold;
                    color: #4ecdc4;
                }
                
                .close-button {
                    background: rgba(255, 255, 255, 0.1);
                    border: none;
                    color: white;
                    width: 30px;
                    height: 30px;
                    border-radius: 50%;
                    cursor: pointer;
                    font-size: 18px;
                    transition: all 0.3s ease;
                }
                
                .close-button:hover {
                    background: rgba(255, 255, 255, 0.2);
                }
                
                .info-section {
                    margin: 20px 0;
                }
                
                .info-row {
                    display: flex;
                    justify-content: space-between;
                    padding: 10px 0;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
                }
                
                .info-label {
                    color: #888;
                    font-size: 14px;
                }
                
                .info-value {
                    color: white;
                    font-size: 14px;
                    font-weight: bold;
                }
                
                .tags-container {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                    margin-top: 10px;
                }
                
                .tag {
                    background: rgba(78, 205, 196, 0.2);
                    color: #4ecdc4;
                    padding: 5px 12px;
                    border-radius: 15px;
                    font-size: 12px;
                    border: 1px solid rgba(78, 205, 196, 0.3);
                }
                
                .status-badge {
                    display: inline-block;
                    padding: 5px 15px;
                    border-radius: 20px;
                    font-size: 12px;
                    font-weight: bold;
                    margin-top: 10px;
                }
                
                .status-online {
                    background: rgba(16, 185, 129, 0.2);
                    color: #10b981;
                    border: 1px solid rgba(16, 185, 129, 0.3);
                }
                
                .description {
                    margin-top: 15px;
                    padding: 15px;
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 10px;
                    font-size: 14px;
                    line-height: 1.6;
                    color: #ccc;
                }
            </style>
            
            <div class="panel-header">
                <div class="agent-name" id="detail-name">智能体名称</div>
                <button class="close-button" onclick="document.getElementById('agent-detail-panel').style.display='none'">✕</button>
            </div>
            
            <div class="info-section">
                <div class="info-row">
                    <span class="info-label">🆔 智能体ID</span>
                    <span class="info-value" id="detail-id">-</span>
                </div>
                <div class="info-row">
                    <span class="info-label">📍 当前状态</span>
                    <span class="info-value"><span class="status-badge status-online" id="detail-status">在线</span></span>
                </div>
                <div class="info-row">
                    <span class="info-label">💬 发送消息</span>
                    <span class="info-value" id="detail-messages">0</span>
                </div>
                <div class="info-row">
                    <span class="info-label">⭐ 声誉值</span>
                    <span class="info-value" id="detail-reputation">0</span>
                </div>
            </div>
            
            <div class="info-section">
                <div class="info-label">🏷️ 标签</div>
                <div class="tags-container" id="detail-tags">
                    <!-- 动态填充 -->
                </div>
            </div>
            
            <div class="description" id="detail-description">
                <!-- 动态填充 -->
            </div>
        `;
        
        document.body.appendChild(this.panel);
    }

    show(agent) {
        this.currentAgent = agent;
        
        // 填充数据
        document.getElementById('detail-name').textContent = agent.name || '未知智能体';
        document.getElementById('detail-id').textContent = agent.agentId || '-';
        document.getElementById('detail-messages').textContent = agent.stats?.messagesSent || 0;
        document.getElementById('detail-reputation').textContent = agent.stats?.reputation || 0;
        
        // 标签
        const tagsContainer = document.getElementById('detail-tags');
        if (agent.tags && agent.tags.length > 0) {
            tagsContainer.innerHTML = agent.tags.map(tag => 
                `<span class="tag">#${tag}</span>`
            ).join('');
        } else {
            tagsContainer.innerHTML = '<span class="tag">#无标签</span>';
        }
        
        // 描述
        document.getElementById('detail-description').textContent = 
            agent.description || '暂无描述';
        
        // 显示面板
        this.panel.style.display = 'block';
    }

    hide() {
        this.panel.style.display = 'none';
    }
}

window.AgentDetailPanel = AgentDetailPanel;
