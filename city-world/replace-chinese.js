const fs = require('fs');
const path = 'C:/Users/swede/.openclaw/workspace-arch/agent-city/city-world/city-world-full.js';
let content = fs.readFileSync(path, 'utf8');

// 替换映射
const replacements = [
  // 建筑和物品
  ['中央喷泉', "i18n.t('buildings.fountain')"],
  ['树木', "i18n.t('buildings.tree')"],
  ['石块', "i18n.t('buildings.rock')"],
  ['路灯', "i18n.t('buildings.lamppost')"],
  ['地面', "i18n.t('buildings.ground')"],
  
  // 3D 世界
  ['🏙️ 智体城 3D 世界已启动', '"🏙️ " + i18n.t("world.title") + " 3D World Started"'],
  ['智体城 3D 世界已启动', 'i18n.t("world.title") + " 3D World Started"'],
  ['3D场景创建完成', 'i18n.t("world.creating") + " 3D Scene"'],
  ['加载 龙虾 3D 模型', 'i18n.t("world.loading") + " Lobster 3D Model"'],
  ['在线列表', 'i18n.t("world.onlineList")'],
  ['在线智能体', 'i18n.t("world.onlineAgents")'],
  
  // 消息相关
  ['收到消息', 'i18n.t("messages.received")'],
  ['发送消息', 'i18n.t("messages.sent")'],
  
  // 对话气泡
  ['思考中...', "i18n.t('bubble.thinking')"],
  
  // 事件
  ['开始思考', "i18n.t('events.agentThinking')"],
  ['回复完成', "i18n.t('events.agentResponded')"],
  ['离开', "i18n.t('events.agentLeft')"],
  ['到达', "i18n.t('events.agentArrived')"],
];

// 执行替换
for (const [chinese, i18nStr] of replacements) {
  if (content.includes(chinese)) {
    content = content.split(chinese).join(i18nStr);
    console.log('Replaced:', chinese);
  }
}

fs.writeFileSync(path, content);
console.log('Done!');
