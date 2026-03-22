/**
 * Day-Night Indicator - Displays in top-left corner
 * Shows current phase and time based on 8 phases
 */
class DayNightIndicator {
  constructor() {
    this.phases = [
      { name: '深夜', icon: '🌙', start: 21, end: 5, color: '#1a237e', bg: 'rgba(26, 35, 126, 0.8)' },
      { name: '黎明前', icon: '🌆', start: 5, end: 6, color: '#ff7043', bg: 'rgba(255, 112, 67, 0.8)' },
      { name: '日出', icon: '🌅', start: 6, end: 7, color: '#ffa726', bg: 'rgba(255, 167, 38, 0.8)' },
      { name: '早晨', icon: '🌤️', start: 7, end: 9, color: '#87ceeb', bg: 'rgba(135, 206, 235, 0.8)' },
      { name: '上午', icon: '☀️', start: 9, end: 12, color: '#ffeb3b', bg: 'rgba(255, 235, 59, 0.8)' },
      { name: '下午', icon: '🌞', start: 12, end: 17, color: '#4fc3f7', bg: 'rgba(79, 195, 247, 0.8)' },
      { name: '傍晚', icon: '🌇', start: 17, end: 19, color: '#ff9800', bg: 'rgba(255, 152, 0, 0.8)' },
      { name: '黄昏', icon: '🌆', start: 19, end: 21, color: '#e65100', bg: 'rgba(230, 81, 0, 0.8)' }
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
          position: fixed; top: 60px; left: 10px;
          background: rgba(26, 26, 46, 0.9);
          border-radius: 10px; padding: 10px 15px;
          color: white; z-index: 100;
          display: flex; align-items: center; gap: 10px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.3);
          border: 1px solid rgba(255,255,255,0.1);
          font-family: 'Microsoft YaHei', sans-serif;
        }
        #day-night-top .icon { font-size: 24px; }
        #day-night-top .info { display: flex; flex-direction: column; }
        #day-night-top .phase { font-size: 14px; font-weight: bold; }
        #day-night-top .time { font-size: 12px; color: #aaa; }
        #day-night-top .progress-bar {
          width: 80px; height: 4px; background: rgba(255,255,255,0.2);
          border-radius: 2px; margin-top: 5px; overflow: hidden;
        }
        #day-night-top .progress-fill {
          height: 100%; border-radius: 2px; transition: width 1s;
        }
      </style>
      <span class="icon" id="dnt-icon">☀️</span>
      <div class="info">
        <span class="phase" id="dnt-phase">白天</span>
        <span class="time" id="dnt-time">12:00</span>
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
        // Handles wrap-around (e.g., 21-5)
        if (hour >= phase.start || hour < phase.end) {
          return phase;
        }
      }
    }
    return this.phases[4]; // Default to 上午
  }

  getPhaseProgress(hour, phase) {
    if (phase.start < phase.end) {
      return (hour - phase.start) / (phase.end - phase.start);
    } else {
      // Handle wrap-around
      if (hour >= phase.start) {
        return (hour - phase.start) / (24 - phase.start + phase.end);
      } else {
        return (hour + 24 - phase.start) / (24 - phase.start + phase.end);
      }
    }
  }

  update() {
    // Virtual time: 10 minutes = 24 virtual hours
    const cycleMs = 10 * 60 * 1000;
    const virtualHour = ((Date.now() % cycleMs) / cycleMs) * 24;
    const hour = Math.floor(virtualHour);
    const minutes = Math.floor((virtualHour - hour) * 60);
    const timeStr = `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

    const phase = this.getCurrentPhase(hour);
    const progress = this.getPhaseProgress(hour, phase);

    const icon = document.getElementById('dnt-icon');
    const phaseEl = document.getElementById('dnt-phase');
    const timeEl = document.getElementById('dnt-time');
    const progressEl = document.getElementById('dnt-progress');

    if (icon) icon.textContent = phase.icon;
    if (phaseEl) {
      phaseEl.textContent = phase.name;
      phaseEl.style.color = phase.color;
    }
    if (timeEl) timeEl.textContent = timeStr;
    if (progressEl) {
      progressEl.style.width = (progress * 100) + '%';
      progressEl.style.background = phase.color;
    }

    // Broadcast to other components
    window.currentDayPhase = {
      phase: phase.name,
      icon: phase.icon,
      progress: progress,
      hour: hour,
      minute: minutes,
      color: phase.color
    };
  }
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new DayNightIndicator());
} else {
  new DayNightIndicator();
}
