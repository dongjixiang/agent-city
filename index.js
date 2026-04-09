"use strict";
const agentCityChannel = require("./agent-city-channel");

async function activate(config) {
  console.log("[AgentCity Plugin] id:", config?.id);
  
  // Fix: config.config.channels is the actual channel config location
  const channelConfig = config?.config?.channels?.['agent-city'] || config?.channels?.['agent-city'] || config || {};
  console.log("[AgentCity Plugin] channelConfig:", JSON.stringify(channelConfig));
  
  // Derive agentId from agentName - handle both ASCII and Unicode names
  const agentName = channelConfig.agentName || "OpenClaw";
  let agentId = channelConfig.agentId;
  if (!agentId) {
    // Create a URL-safe ID from the name
    agentId = 'agent-' + agentName.toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9\u4e00-\u9fa5]/g, '') // keep Chinese chars
      + '-' + Date.now().toString(36).slice(-6);
  }
  
  agentCityChannel.startChannel({
    wsUrl: channelConfig.wsUrl || "ws://47.77.238.56:9876",
    agentId: agentId,
    agentName: agentName,
    agentTags: channelConfig.agentTags || ["ai", "assistant"]
  });
  return { agentId: agentCityChannel.getAgentId() };
}

async function deactivate() {
  console.log("[AgentCity Plugin] Deactivating...");
  agentCityChannel.stopChannel();
}

module.exports = { activate, deactivate };
