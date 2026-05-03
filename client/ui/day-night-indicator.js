/**
 * DayNightIndicator - Displays time and phase in top-left corner
 *
 * @module ui/day-night-indicator
 */

class DayNightIndicator {
    constructor() {
        this.phases = [
            { name: '深夜', icon: '🌙', start: 21, end: 5, color: '#1a237e', bg: 'rgba(26,35,126,0.8)' },
            { name: '黎明', icon: '🌅', start: 5, end: 6, color: '#ff7043', bg: 'rgba(255,112,67,0.8)' },
            { name: '清晨', icon: '🌄', start: 6, end: 7, color: '#ffa726', bg: 'rgba(255,167,38,0.8)' },
            { name: '早晨', icon: '🌤️', start: 7, end: 9, color: '#87ceeb', bg: 'rgba(135,206,235,0.8)' },
            { name: '上午', icon: '☀️', start: 9, end: 12, color: '#ffeb3b', bg: 'rgba(255,235,59,0.8)' },
            { name: '中午', icon: '🌞', start: 12, end: 17, color: '#4fc3f7', bg: 'rgba(79,195,247,0.8)' },
            { name: '下午', icon: '🌇', start: 17, end: 19, color: '#ff9800', bg: 'rgba(255,152,0,0.8)' },
            { name: '傍晚', icon: '🌆', start: 19, end: 21, color: '#e65100', bg: 'rgba(230,81,0,0.8)' }
        ];
        
        this.createIndicator();
        this.update();
        
        // Update every second
        setInterval(() => this.update(), 1000);
    }
    
    createIndicator() {
        const existing = document.getElementById('day-night-top');
        if (existing) existing.remove();
        
        this.element = document.createElement('div');
        this.element.id = 'day-night-top';
        this.element.innerHTML = `
            <style>
                #day-night-top {
                    position: fixed;
                    top: 10px;
                    left: 10px;
                    background: rgba(26, 26, 46, 0.9);
                    border-radius: 10px;
                    padding: 10px 15px;
                    color: white;
                    z-index: 100;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.3);
                    border: 1px solid rgba(255,255,255,0.1);
                    font-family: 'Microsoft YaHei', sans-serif;
                }
                #day-night-top .icon { font-size: 24px; }
                #day-night-top .info { display: flex; flex-direction: column; }
                #day-night-top .phase { font-size: 14px; font-weight: bold; }
                #day-night-top .time { font-size: 12px; color: #aaa; }
                #day-night-top .weather { font-size: 12px; color: #87ceeb; margin-top: 2px; }
                #day-night-top .progress-bar {
                    width: 80px;
                    height: 4px;
                    background: rgba(255,255,255,0.2);
                    border-radius: 2px;
                    margin-top: 5px;
                    overflow: hidden;
                }
                #day-night-top .progress-fill {
                    height: 100%;
                    border-radius: 2px;
                    transition: width 1s;
                }
            </style>
            <span class="icon" id="dnt-icon">☀️</span>
            <div class="info">
                <span class="phase" id="dnt-phase">中午</span>
                <span class="time" id="dnt-time">12:00</span>
                <span class="weather" id="dnt-weather">晴天</span>
                <div class="progress-bar">
                    <div class="progress-fill" id="dnt-progress" style="width: 50%; background: #ffeb3b;"></div>
                </div>
            </div>
        `;
        document.body.appendChild(this.element);
        console.log('[DayNight] Indicator created at top-left');
    }
    
    getCurrentPhase(hour) {
        for (const phase of this.phases) {
            if (phase.start < phase.end) {
                if (hour >= phase.start && hour < phase.end) {
                    return phase;
                }
            } else {
                // Handle wrap-around (e.g., 21-5)
                if (hour >= phase.start || hour < phase.end) {
                    return phase;
                }
            }
        }
        return this.phases[4]; // Default to noon
    }
    
    getCurrentWeather() {
        if (window.getCurrentWeather) {
            const weather = window.getCurrentWeather();
            const weatherNames = {
                sunny: '晴天',
                cloudy: '多云',
                rainy: '雨天',
                snowy: '雪天'
            };
            return weatherNames[weather] || '未知';
        }
        return '未知';
    }
    
    update() {
        // 使用daynight-system的虚拟时间
        const virtualHour = window.virtualHour ?? 6;
        const hour = Math.floor(virtualHour);
        const minutes = Math.floor((virtualHour % 1) * 60);
        
        const phase = this.getCurrentPhase(hour);
        const timeStr = `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        const weather = this.getCurrentWeather();
        
        const icon = document.getElementById('dnt-icon');
        const phaseEl = document.getElementById('dnt-phase');
        const timeEl = document.getElementById('dnt-time');
        const weatherEl = document.getElementById('dnt-weather');
        const progressEl = document.getElementById('dnt-progress');
        
        if (icon) icon.textContent = phase.icon;
        if (phaseEl) {
            phaseEl.textContent = phase.name;
            phaseEl.style.color = phase.color;
        }
        if (timeEl) timeEl.textContent = timeStr;
        if (weatherEl) weatherEl.textContent = weather;
        if (progressEl) {
            const progress = (virtualHour / 24) * 100;
            progressEl.style.width = `${progress}%`;
            progressEl.style.background = phase.color;
        }
    }
}

// ========== 环境控制面板 ==========
class EnvironmentControl {
    constructor() {
        this.weatherTypes = ['sunny', 'cloudy', 'rainy', 'snowy'];
        this.isVisible = false;
        this.createToggleButton();
        this.createControlPanel();
    }

    createToggleButton() {
        const existing = document.getElementById('env-toggle-btn');
        if (existing) existing.remove();

        const btn = document.createElement('div');
        btn.id = 'env-toggle-btn';
        btn.innerHTML = `
            <style>
                #env-toggle-btn {
                    position: fixed;
                    bottom: 20px;
                    left: 20px;
                    width: 44px;
                    height: 44px;
                    border-radius: 50%;
                    background: rgba(26, 26, 46, 0.92);
                    border: 1px solid rgba(78, 205, 196, 0.4);
                    color: #4ecdc4;
                    z-index: 998;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    font-size: 20px;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.3);
                    transition: all 0.3s;
                    font-family: 'Microsoft YaHei', sans-serif;
                }
                #env-toggle-btn:hover {
                    background: rgba(78, 205, 196, 0.2);
                    transform: scale(1.1);
                }
                #env-toggle-btn.panel-open {
                    opacity: 0.5;
                }
            </style>
            <span id="env-toggle-icon">🌍</span>
        `;
        btn.addEventListener('click', () => this.toggle());
        document.body.appendChild(btn);
        console.log('[EnvControl] Toggle button created');
    }

    createControlPanel() {
        const existing = document.getElementById('env-control-panel');
        if (existing) existing.remove();

        this.element = document.createElement('div');
        this.element.id = 'env-control-panel';
        this.element.innerHTML = `
            <style>
                #env-control-panel {
                    position: fixed;
                    bottom: 80px;
                    left: 20px;
                    background: rgba(26, 26, 46, 0.92);
                    border-radius: 12px;
                    padding: 12px;
                    color: white;
                    z-index: 999;
                    display: none;
                    flex-direction: column;
                    gap: 10px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.4);
                    border: 1px solid rgba(78, 205, 196, 0.25);
                    font-family: 'Microsoft YaHei', sans-serif;
                    min-width: 160px;
                    animation: slideUp 0.3s ease;
                }
                #env-control-panel.visible {
                    display: flex;
                }
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                #env-control-panel .ctrl-title {
                    font-size: 12px;
                    color: #4ecdc4;
                    font-weight: bold;
                    text-align: center;
                    margin-bottom: 4px;
                }
                #env-control-panel .ctrl-row {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }
                #env-control-panel .ctrl-label {
                    font-size: 11px;
                    color: #aaa;
                    width: 36px;
                }
                #env-control-panel .ctrl-btn {
                    flex: 1;
                    padding: 6px 8px;
                    border-radius: 6px;
                    border: none;
                    cursor: pointer;
                    font-size: 12px;
                    transition: all 0.2s;
                    font-family: 'Microsoft YaHei', sans-serif;
                }
                #env-control-panel .ctrl-btn:hover {
                    opacity: 0.85;
                    transform: scale(1.02);
                }
                #env-control-panel .weather-btn {
                    background: rgba(78, 205, 196, 0.2);
                    color: #4ecdc4;
                    border: 1px solid rgba(78, 205, 196, 0.3);
                }
                #env-control-panel .weather-btn.active {
                    background: #4ecdc4;
                    color: #1a1a2e;
                }
                #env-control-panel .time-btn {
                    background: rgba(255, 152, 0, 0.2);
                    color: #ff9800;
                    border: 1px solid rgba(255, 152, 0, 0.3);
                }
                #env-control-panel .time-btn.active {
                    background: #ff9800;
                    color: #1a1a2e;
                }
                #env-control-panel .time-btn.night {
                    background: rgba(156, 39, 176, 0.2);
                    color: #9c27b0;
                    border: 1px solid rgba(156, 39, 176, 0.3);
                }
                #env-control-panel .time-btn.night.active {
                    background: #9c27b0;
                    color: white;
                }
                #env-control-panel .slider-container {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                #env-control-panel input[type="range"] {
                    flex: 1;
                    height: 4px;
                    -webkit-appearance: none;
                    background: rgba(255,255,255,0.2);
                    border-radius: 2px;
                    outline: none;
                }
                #env-control-panel input[type="range"]::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    width: 14px;
                    height: 14px;
                    border-radius: 50%;
                    background: #ff9800;
                    cursor: pointer;
                }
                #env-control-panel .slider-val {
                    font-size: 11px;
                    color: #ff9800;
                    min-width: 36px;
                    text-align: right;
                }
                #env-control-panel .close-hint {
                    font-size: 10px;
                    color: #666;
                    text-align: center;
                    margin-top: 4px;
                }
            </style>
            <div class="ctrl-title">🌍 环境控制</div>
            <div class="ctrl-row">
                <span class="ctrl-label">天气</span>
                <button class="ctrl-btn weather-btn active" id="btn-weather-sunny" onclick="window.envControl?.setWeather('sunny')">☀️</button>
                <button class="ctrl-btn weather-btn" id="btn-weather-cloudy" onclick="window.envControl?.setWeather('cloudy')">☁️</button>
                <button class="ctrl-btn weather-btn" id="btn-weather-rainy" onclick="window.envControl?.setWeather('rainy')">🌧️</button>
                <button class="ctrl-btn weather-btn" id="btn-weather-snowy" onclick="window.envControl?.setWeather('snowy')">❄️</button>
            </div>
            <div class="ctrl-row">
                <span class="ctrl-label">时间</span>
                <button class="ctrl-btn time-btn active" id="btn-time-day" onclick="window.envControl?.setTime(10)">白昼</button>
                <button class="ctrl-btn time-btn night" id="btn-time-night" onclick="window.envControl?.setTime(22)">夜晚</button>
            </div>
            <div class="ctrl-row slider-container">
                <span class="ctrl-label">时刻</span>
                <input type="range" id="time-slider" min="0" max="24" step="0.5" value="10" oninput="window.envControl?.setTimeSlider(this.value)">
                <span class="slider-val" id="time-slider-val">10:00</span>
            </div>
            <div class="close-hint">点击 🌐 隐藏面板</div>
        `;
        document.body.appendChild(this.element);
        window.envControl = this;
        console.log('[EnvControl] Control panel created');
    }

    toggle() {
        this.isVisible = !this.isVisible;
        const panel = document.getElementById('env-control-panel');
        const toggleBtn = document.getElementById('env-toggle-btn');
        const icon = document.getElementById('env-toggle-icon');

        if (panel) panel.classList.toggle('visible', this.isVisible);
        if (toggleBtn) toggleBtn.classList.toggle('panel-open', this.isVisible);
        if (icon) icon.textContent = this.isVisible ? '✖️' : '🌍';
    }

    setWeather(type) {
        if (window.setWeather) {
            window.setWeather(type);
            this.updateWeatherUI(type);
        }
    }

    updateWeatherUI(type) {
        this.weatherTypes.forEach(t => {
            const btn = document.getElementById(`btn-weather-${t}`);
            if (btn) btn.classList.toggle('active', t === type);
        });
    }

    setTime(hour) {
        if (window.app?.systems?.dayNight) {
            window.app.systems.dayNight.setTime(hour);
            this.updateTimeUI(hour);
        }
    }

    setTimeSlider(value) {
        const hour = parseFloat(value);
        this.setTime(hour);
    }

    updateTimeUI(hour) {
        const slider = document.getElementById('time-slider');
        const sliderVal = document.getElementById('time-slider-val');
        if (slider) slider.value = hour;
        if (sliderVal) {
            const h = Math.floor(hour);
            const m = Math.floor((hour % 1) * 60);
            sliderVal.textContent = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
        }
        const isNight = hour >= 21 || hour < 6;
        const dayBtn = document.getElementById('btn-time-day');
        const nightBtn = document.getElementById('btn-time-night');
        if (dayBtn) dayBtn.classList.toggle('active', !isNight);
        if (nightBtn) nightBtn.classList.toggle('active', isNight);
    }
}

// Auto-init when DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new DayNightIndicator();
        new EnvironmentControl();
    });
} else {
    new DayNightIndicator();
    new EnvironmentControl();
}

export { DayNightIndicator, EnvironmentControl };
