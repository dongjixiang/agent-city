/**
 * PromptBuilder - 提示词构建器
 * 
 * 负责为智能体构建完整的决策提示词
 */

class PromptBuilder {
  constructor() {
    // 技能列表
    this.SKILLS = {
      goTo: { desc: '移动到坐标', params: '{ x: number, z: number }' },
      sendMessage: { desc: '发私信给智能体', params: '{ to: string, content: string }' },
      broadcast: { desc: '广播消息给所有人', params: '{ content: string }' },
      think: { desc: '显示思考气泡', params: '{ content: string }' },
      stay: { desc: '原地停留', params: '{}' },
      respond: { desc: '回复用户消息', params: '{ content: string }' }
    };
  }

  /**
   * 构建完整的决策提示词
   */
  build(eventType, context, trigger) {
    const self = context.self || {};
    const nearby = context.nearby || {};
    const city = context.city || {};

    const personaSection = this.buildPersona(self);
    const selfSection = this.buildSelfSection(self);
    const nearbySection = this.buildNearbySection(nearby);
    const citySection = this.buildCitySection(city);
    const taskSection = this.buildTaskSection(eventType, trigger);
    const decisionSection = this.buildDecisionSection();

    return `${personaSection}

${selfSection}

${nearbySection}

${citySection}

${taskSection}

${decisionSection}`;
  }

  /**
   * 构建人物设定
   */
  buildPersona(self) {
    return `你是智体城中的智能体 ${self.name || '小吉'}。

你是一个热情、好奇、务实、喜欢帮助别人的智能体。你喜欢和人们交流，也喜欢探索智体城的各个角落。`;
  }

  /**
   * 构建自身状态
   */
  buildSelfSection(self) {
    return `【你的当前状态】
位置：(${self.position?.x || 0}, ${self.position?.z || 0})
状态：${this.translateState(self.state)}
心情：${this.translateMood(self.mood)}
能量：${self.energy || 100}/100
声誉：${self.reputation || 0}
技能：${(self.skills || Object.keys(this.SKILLS)).join(', ')}`;
  }

  /**
   * 构建周边环境
   */
  buildNearbySection(nearby) {
    let section = '【周围环境】\n';

    // 智能体
    if (nearby.agents && nearby.agents.length > 0) {
      section += '\n附近的智能体：\n';
      for (const agent of nearby.agents) {
        section += `- ${agent.name} (距离${agent.distance}米, ${this.translateState(agent.state)})\n`;
      }
    } else {
      section += '\n附近没有其他智能体。\n';
    }

    // 建筑
    if (nearby.buildings && nearby.buildings.length > 0) {
      section += '\n附近的建筑：\n';
      for (const building of nearby.buildings) {
        section += `- ${building.type} (${building.description || ''}, 距离${building.distance}米)\n`;
      }
    }

    return section;
  }

  /**
   * 构建城市状态
   */
  buildCitySection(city) {
    return `【城市状态】
天气：${this.translateWeather(city.weather)}，${city.temperature || 20}°C
时间：${this.translateTimeOfDay(city.timeOfDay)}
在线智能体：${city.onlineAgentCount || 0}人`;
  }

  /**
   * 根据事件类型构建任务
   */
  buildTaskSection(eventType, trigger) {
    switch (eventType) {
      case 'USER_MESSAGE':
        return this.buildUserMessageTask(trigger);
      case 'PERIODIC_SNAPSHOT':
        return this.buildIdleTask();
      case 'WEATHER_CHANGE':
        return this.buildWeatherTask(trigger);
      case 'AGENT_ENTER':
        return this.buildAgentEnterTask(trigger);
      case 'AGENT_LEAVE':
        return this.buildAgentLeaveTask(trigger);
      case 'BROADCAST':
        return this.buildBroadcastTask(trigger);
      case 'MEMORY_SUMMARY':
        return this.buildMemoryTask(trigger);
      default:
        return this.buildIdleTask();
    }
  }

  /**
   * 用户消息任务
   */
  buildUserMessageTask(trigger) {
    const msg = trigger.message || {};
    return `【当前任务：回复用户消息】
用户对你说：${msg.content || ''}
请回复用户的消息。`;
  }

  /**
   * 空闲任务（定期快照）
   */
  buildIdleTask() {
    return `【当前任务：自由活动】
这是系统定期推送的环境信息。
请根据当前情况决定下一步要做什么。可以去探索、和别人打招呼、或者就在原地休息。`;
  }

  /**
   * 天气变化任务
   */
  buildWeatherTask(trigger) {
    const weather = trigger.weatherChange || {};
    return `【当前任务：应对天气变化】
天气发生了变化：${this.translateWeather(weather.weather)}
请决定如何应对这种天气变化。`;
  }

  /**
   * 新智能体上线任务
   */
  buildAgentEnterTask(trigger) {
    const newAgent = trigger.newAgent || {};
    return `【当前任务：新成员加入】
${newAgent.name || '一位新智能体'}加入了智体城！
请决定是否要打招呼或者做其他事情。`;
  }

  /**
   * 智能体离开任务
   */
  buildAgentLeaveTask(trigger) {
    const leftAgent = trigger.leftAgent || {};
    return `【当前任务：成员离开】
${leftAgent.name || '一位智能体'}离开了智体城。
你可以继续做自己的事情。`;
  }

  /**
   * 广播消息任务
   */
  buildBroadcastTask(trigger) {
    const broadcast = trigger.broadcast || {};
    return `【当前任务：听到广播】
${broadcast.fromName || '有人'}广播：${broadcast.content || ''}
请决定是否要回应或者做其他事情。`;
  }

  /**
   * 记忆摘要任务
   */
  buildMemoryTask(trigger) {
    const memory = trigger.memory || {};
    return `【当前任务：基于记忆行动】
这是你的长期记忆摘要：
${memory.summary || '暂无记忆'}

请基于记忆做出合适的行动。`;
  }

  /**
   * 构建决策规则
   */
  buildDecisionSection() {
    const skillList = Object.entries(this.SKILLS)
      .map(([name, info]) => `- ${name}(${info.params}) - ${info.desc}`)
      .join('\n');

    return `【决策要求】
请基于以上信息，决定你接下来要做什么。

返回 JSON 格式：
{
  "action": "动作名称",
  "params": { /* 动作参数 */ },
  "reasoning": "你的思考过程（10字以内）"
}

可用动作：
${skillList}

只返回 JSON，不要其他内容。`;
  }

  /**
   * 翻译状态
   */
  translateState(state) {
    const map = {
      'idle': '空闲',
      'walking': '行走中',
      'talking': '交谈中',
      'thinking': '思考中',
      'resting': '休息中',
      'working': '工作中'
    };
    return map[state] || state || '空闲';
  }

  /**
   * 翻译心情
   */
  translateMood(mood) {
    const map = {
      'happy': '开心',
      'neutral': '平静',
      'sad': '难过',
      'excited': '兴奋',
      'bored': '无聊',
      'curious': '好奇'
    };
    return map[mood] || mood || '平静';
  }

  /**
   * 翻译天气
   */
  translateWeather(weather) {
    const map = {
      'sunny': '晴朗',
      'cloudy': '多云',
      'rainy': '雨天',
      'snowy': '下雪',
      'foggy': '有雾',
      'windy': '大风'
    };
    return map[weather] || weather || '晴朗';
  }

  /**
   * 翻译时段
   */
  translateTimeOfDay(time) {
    const map = {
      'morning': '早晨',
      'afternoon': '下午',
      'evening': '傍晚',
      'night': '夜晚'
    };
    return map[time] || time || '早晨';
  }
}

module.exports = PromptBuilder;
