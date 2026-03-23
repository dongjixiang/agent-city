/**
 * 国际化支持 - 中英文
 */
const i18n = {
  // 当前语言
  currentLang: 'zh',
  
  // 语言配置
  zh: {
    // 日夜阶段
    phases: {
      deepNight: '深夜',
      beforeDawn: '黎明前',
      sunrise: '日出',
      morning: '早晨',
      forenoon: '上午',
      afternoon: '下午',
      evening: '傍晚',
      dusk: '黄昏'
    },
    // 监控面板
    monitor: {
      title: '智体城实时监控',
      onlineAgents: '在线智能体',
      totalMessages: '消息总数',
      todayMessages: '今日消息',
      avgResponse: '平均响应',
      activeUsers: '活跃用户',
      collapse: '收起',
      expand: '展开'
    },
    // 世界之窗
    worldWindow: {
      title: '世界之窗',
      placeholder: '输入消息...',
      send: '发送',
      selectAgent: '选择智能体'
    },
    // 状态
    status: {
      connected: '已连接',
      disconnected: '未连接',
      connecting: '连接中...',
      online: '在线',
      offline: '离线'
    },
    // 消息
    messages: {
      thinking: '思考中...',
      received: '收到消息',
      sent: '发送消息'
    },
    // 喷泉
    fountain: {
      name: '中央喷泉',
      description: '智能体交流的地方'
    }
  },
  
  en: {
    // 日夜阶段
    phases: {
      deepNight: 'Deep Night',
      beforeDawn: 'Before Dawn',
      sunrise: 'Sunrise',
      morning: 'Morning',
      forenoon: 'Forenoon',
      afternoon: 'Afternoon',
      evening: 'Evening',
      dusk: 'Dusk'
    },
    // 监控面板
    monitor: {
      title: 'Agent City Monitor',
      onlineAgents: 'Online Agents',
      totalMessages: 'Total Messages',
      todayMessages: 'Today',
      avgResponse: 'Avg Response',
      activeUsers: 'Active Users',
      collapse: 'Collapse',
      expand: 'Expand'
    },
    // 世界之窗
    worldWindow: {
      title: 'World Window',
      placeholder: 'Type a message...',
      send: 'Send',
      selectAgent: 'Select Agent'
    },
    // 状态
    status: {
      connected: 'Connected',
      disconnected: 'Disconnected',
      connecting: 'Connecting...',
      online: 'Online',
      offline: 'Offline'
    },
    // 消息
    messages: {
      thinking: 'Thinking...',
      received: 'Received',
      sent: 'Sent'
    },
    // 喷泉
    fountain: {
      name: 'Central Fountain',
      description: 'Where agents gather'
    }
  },
  
  // 获取翻译
  t(key) {
    const keys = key.split('.');
    let value = this[this.currentLang];
    for (const k of keys) {
      value = value?.[k];
    }
    return value || key;
  },
  
  // 设置语言
  setLang(lang) {
    if (this[lang]) {
      this.currentLang = lang;
      this.savePreference();
      return true;
    }
    return false;
  },
  
  // 获取当前语言
  getLang() {
    return this.currentLang;
  },
  
  // 检测浏览器语言
  detectBrowserLang() {
    const browserLang = navigator.language || navigator.userLanguage || 'zh';
    if (browserLang.startsWith('en')) {
      return 'en';
    }
    return 'zh';
  },
  
  // 从 localStorage 加载偏好
  loadPreference() {
    try {
      const saved = localStorage.getItem('i18n-lang');
      if (saved && this[saved]) {
        this.currentLang = saved;
      } else {
        // 使用浏览器语言
        this.currentLang = this.detectBrowserLang();
      }
    } catch (e) {
      this.currentLang = 'zh';
    }
  },
  
  // 保存偏好
  savePreference() {
    try {
      localStorage.setItem('i18n-lang', this.currentLang);
    } catch (e) {
      // ignore
    }
  },
  
  // 初始化
  init() {
    this.loadPreference();
    return this;
  }
};

// 初始化并导出
i18n.init();

// 如果是模块环境，导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = i18n;
}
