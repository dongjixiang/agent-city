/**
 * 欢迎提示和操作指南
 */

class WelcomeOverlay {
    constructor() {
        this.overlay = null;
        this.createOverlay();
    }

    createOverlay() {
        this.overlay = document.createElement('div');
        this.overlay.id = 'welcome-overlay';
        this.overlay.innerHTML = `
            <style>
                #welcome-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.85);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 1000;
                    animation: fadeIn 0.5s ease;
                }
                
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                
                .welcome-content {
                    background: linear-gradient(135deg, rgba(99, 102, 241, 0.95), rgba(139, 92, 246, 0.95));
                    border-radius: 20px;
                    padding: 40px;
                    max-width: 600px;
                    color: white;
                    text-align: center;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
                    animation: slideUp 0.5s ease;
                }
                
                @keyframes slideUp {
                    from { transform: translateY(30px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                
                .welcome-title {
                    font-size: 48px;
                    font-weight: bold;
                    margin-bottom: 20px;
                    text-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
                }
                
                .welcome-subtitle {
                    font-size: 24px;
                    margin-bottom: 30px;
                    opacity: 0.9;
                }
                
                .welcome-features {
                    text-align: left;
                    margin: 30px 0;
                    padding: 20px;
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 15px;
                }
                
                .feature-item {
                    margin: 15px 0;
                    font-size: 18px;
                    display: flex;
                    align-items: center;
                    gap: 15px;
                }
                
                .feature-icon {
                    font-size: 24px;
                }
                
                .welcome-controls {
                    margin: 30px 0;
                    padding: 20px;
                    background: rgba(0, 0, 0, 0.2);
                    border-radius: 15px;
                }
                
                .control-item {
                    margin: 10px 0;
                    font-size: 16px;
                    color: #e0e0e0;
                }
                
                .start-button {
                    background: white;
                    color: #6366f1;
                    border: none;
                    padding: 15px 40px;
                    font-size: 20px;
                    font-weight: bold;
                    border-radius: 30px;
                    cursor: pointer;
                    margin-top: 20px;
                    transition: all 0.3s ease;
                    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
                }
                
                .start-button:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
                }
                
                .stats-preview {
                    display: flex;
                    justify-content: space-around;
                    margin: 20px 0;
                    padding: 15px;
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 10px;
                }
                
                .stat-item {
                    text-align: center;
                }
                
                .stat-number {
                    font-size: 32px;
                    font-weight: bold;
                    color: #4ecdc4;
                }
                
                .stat-label {
                    font-size: 14px;
                    opacity: 0.8;
                }
            
                /* Mobile Responsive */
                @media (max-width: 768px) {
                    .welcome-content {
                        max-width: 90vw !important;
                        padding: 25px 20px !important;
                        margin: 15px !important;
                        border-radius: 15px !important;
                    }
                    .welcome-content h2 {
                        font-size: 20px !important;
                        margin-bottom: 15px !important;
                    }
                    .welcome-content p {
                        font-size: 14px !important;
                        line-height: 1.5 !important;
                        margin-bottom: 12px !important;
                    }
                    .feature-list {
                        flex-direction: column !important;
                        gap: 10px !important;
                    }
                    .feature-item {
                        font-size: 13px !important;
                        padding: 10px 15px !important;
                    }
                    .start-button {
                        font-size: 16px !important;
                        padding: 12px 30px !important;
                        margin-top: 15px !important;
                    }
                    .agent-city-icon {
                        font-size: 50px !important;
                    }
                    .stats-preview {
                        flex-direction: column !important;
                        gap: 15px !important;
                    }
                }
                @media (max-width: 400px) {
                    .welcome-content {
                        padding: 20px 15px !important;
                    }
                    .welcome-content h2 {
                        font-size: 18px !important;
                    }
                }

            </style>
            
            <div class="welcome-content">
                <div class="welcome-title">🏙️ 智体城</div>
                <div class="welcome-subtitle">一个真正"活"的智能体社会</div>
                
                <div class="stats-preview">
                    <div class="stat-item">
                        <div class="stat-number">15</div>
                        <div class="stat-label">智能体在线</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-number">8</div>
                        <div class="stat-label">功能建筑</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-number">6</div>
                        <div class="stat-label">专业团队</div>
                    </div>
                </div>
                
                <div class="welcome-features">
                    <div class="feature-item">
                        <span class="feature-icon">🤖</span>
                        <span>每个智能体都有真实工作和职责</span>
                    </div>
                    <div class="feature-item">
                        <span class="feature-icon">🚶</span>
                        <span>智能体自主移动和交互</span>
                    </div>
                    <div class="feature-item">
                        <span class="feature-icon">📊</span>
                        <span>实时数据监控和分析</span>
                    </div>
                    <div class="feature-item">
                        <span class="feature-icon">🎨</span>
                        <span>丰富多彩的3D可视化</span>
                    </div>
                </div>
                
                <div class="welcome-controls">
                    <div class="control-item">🖱️ 鼠标拖动 - 旋转视角</div>
                    <div class="control-item">🔍 滚轮滚动 - 缩放场景</div>
                    <div class="control-item">👆 点击智能体 - 查看详情</div>
                </div>
                
                <button class="start-button" onclick="document.getElementById('welcome-overlay').style.display='none'">
                    开始探索 →
                </button>
            </div>
        `;
        
        document.body.appendChild(this.overlay);
        
        // 10秒后自动关闭
        setTimeout(() => {
            if (this.overlay) {
                this.overlay.style.opacity = '0';
                setTimeout(() => {
                    this.overlay.style.display = 'none';
                }, 500);
            }
        }, 10000);
    }
}

window.WelcomeOverlay = WelcomeOverlay;
