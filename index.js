"use strict";
const agentCityChannel = require("./agent-city-channel");

async function activate(config) {
  console.log("[AgentCity Plugin] id:", config?.id);
  
  // Fix: config is directly at config.channels, not config.config.channels
  const channelConfig = config?.channels?.['agent-city'] || {};
  console.log("[AgentCity Plugin] channelConfig:", JSON.stringify(channelConfig));
  
  agentCityChannel.startChannel({
    wsUrl: channelConfig.wsUrl || "ws://47.77.238.56:9876",
    agentName: channelConfig.agentName || "小吉",
    agentTags: channelConfig.agentTags || ["ai", "assistant", "小吉"]
  });
  return { agentId: agentCityChannel.getAgentId() };
}

async function deactivate() {
  console.log("[AgentCity Plugin] Deactivating...");
  agentCityChannel.stopChannel();
}

module.exports = { activate, deactivate };