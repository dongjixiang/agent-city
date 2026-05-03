const fs = require('fs');
const path = 'C:/Users/swede/.openclaw/workspace-arch/agent-city/server/event-dispatcher.js';
let content = fs.readFileSync(path, 'utf8');

// 1. Add handleUpdateAgentConfig function after handleAgentConversation
const handleAgentConvMatch = content.match(/handleAgentConversation\(agentId, inConversation\)[\s\S]{1,500}?\n    \}/);
if (handleAgentConvMatch) {
    console.log('Found handleAgentConversation block');
    const newFunc = `

    /**
     * 处理智能体配置更新
     */
    async handleUpdateAgentConfig(agentId, config) {
        if (!this.agentStore) return;
        
        try {
            const agent = await this.agentStore.get(agentId);
            if (!agent) {
                console.log('[EventDispatcher] handleUpdateAgentConfig: agent not found:', agentId);
                return;
            }
            
            // 更新配置
            if (config.thinkInterval !== undefined) {
                agent.thinkInterval = config.thinkInterval;
                console.log('[EventDispatcher] Updated thinkInterval to:', config.thinkInterval);
            }
            
            if (config.exploreCooldown !== undefined) {
                agent.exploreCooldown = config.exploreCooldown;
                console.log('[EventDispatcher] Updated exploreCooldown to:', config.exploreCooldown);
            }
            
            await this.agentStore.update(agentId, agent);
            
        } catch (e) {
            console.error('[EventDispatcher] handleUpdateAgentConfig error:', e.message);
        }
    }
`;
    content = content.replace(handleAgentConvMatch[0], handleAgentConvMatch[0] + newFunc);
    console.log('✓ Added handleUpdateAgentConfig');
} else {
    console.log('⚠ handleAgentConversation block not found');
}

// 2. Add setExploreCooldown function and modify triggerAIResponse
// Find the old triggerDefaultExplore call at end of triggerAIResponse
const oldExploreCall = `// 无论 AI 响应内容如何，探索不能停
            this.triggerDefaultExplore(agentId);`;
const newExploreCall = `// 延迟触发探索（使用智能体各自的冷却时间配置）
            const cooldown = agent.exploreCooldown || this.config?.thinking?.exploreCooldown || 30; // 默认30秒
            
            console.log('[EventDispatcher] AI响应完成，' + cooldown + '秒后触发探索');
            
            // 设置探索冷却计时器
            this.setExploreCooldown(agentId, cooldown);`;

if (content.includes(oldExploreCall)) {
    content = content.replace(oldExploreCall, newExploreCall);
    console.log('✓ Modified triggerAIResponse');
} else {
    console.log('⚠ Old explore call pattern not found');
}

// 3. Add setExploreCooldown function before triggerDefaultExplore
const triggerDefaultExploreMatch = content.match(/async triggerDefaultExplore\(agentId\)[\s\S]{1,200}?\n    \}/);
if (triggerDefaultExploreMatch) {
    const newSetCooldown = `    /**
     * 设置探索冷却计时器
     */
    setExploreCooldown(agentId, delaySeconds) {
        if (!this.agentStore) return;
        
        // 获取当前数据
        const data = this.agentData.get(agentId);
        if (!data) return;
        
        // 清除之前的探索计时器
        if (data.exploreTimeout) {
            clearTimeout(data.exploreTimeout);
        }
        
        // 设置新的计时器
        data.exploreTimeout = setTimeout(async () => {
            console.log('[EventDispatcher] ' + agentId + ' 探索冷却结束，触发探索');
            await this.triggerDefaultExplore(agentId);
            data.exploreTimeout = null;
        }, delaySeconds * 1000);
        
        console.log('[EventDispatcher] ' + agentId + ' 探索冷却计时器已设置: ' + delaySeconds + '秒');
    }
    
`;
    content = content.replace(triggerDefaultExploreMatch[0], newSetCooldown + triggerDefaultExploreMatch[0]);
    console.log('✓ Added setExploreCooldown function');
} else {
    console.log('⚠ triggerDefaultExplore block not found');
}

fs.writeFileSync(path, content, 'utf8');
console.log('File saved');

/*
// Verify
const newContent = fs.readFileSync(path, 'utf8');
console.log('setExploreCooldown found:', newContent.includes('setExploreCooldown'));
console.log('handleUpdateAgentConfig found:', newContent.includes('handleUpdateAgentConfig'));
*/