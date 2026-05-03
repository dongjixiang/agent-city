path = 'C:/Users/swede/.openclaw/workspace-arch/agent-city/server/event-dispatcher.js'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

old_block = """        // 检查是否在冷却中（探索和 AI 思考分别控制）
        const cooldownData = this.agentCooldowns.get(agentId);
        const inCooldown = cooldownData && Date.now() < cooldownData.endTime;
        const cooldownSecs = cooldownData ? Math.ceil((cooldownData.endTime - Date.now())/1000) : 0;
        
        console.log(`[EventDispatcher] ${agentId} tick: pendingDecision=${state.pendingDecision}, inCooldown=${inCooldown}, cooldownRemaining=${cooldownSecs}s`);
        
        if (inCooldown) {
            console.log(`[EventDispatcher] ${agentId} 探索冷却中，跳过 (剩余 ${cooldownSecs}s)`);
        } else {
            // 不在冷却中，执行探索（不受 pendingDecision 影响）
            await this.triggerDefaultExplore(agentId);
            console.log(`[EventDispatcher] triggerDefaultExplore completed for ${agentId}`);
            
            // 重置冷却时间
            const cooldownMs = this.exploreCooldown;
            this.agentCooldowns.set(agentId, { endTime: Date.now() + cooldownMs });
            console.log(`[EventDispatcher] ${agentId} 探索冷却开始: ${cooldownMs/1000}秒`);
        }
        
        // 只有不在冷却中且不在等待决策时才触发 AI 思考
        if (!inCooldown && !state.pendingDecision) {
            const event = {
                agentId: agentId,
                type: 'PERIODIC_SNAPSHOT',
                data: {},
                priority: 1
            };
            this.dispatchEvent(agentId, event).catch(() => {});
        } else if (!inCooldown && state.pendingDecision) {
            console.log(`[EventDispatcher] ${agentId} 等待决策中，跳过 AI 思考`);
        } else {
            console.log(`[EventDispatcher] ${agentId} 冷却中，跳过探索和 AI 思考`);
        }"""

new_block = """        // 检查是否在冷却中（探索和 AI 思考分别控制）
        const cooldownData = this.agentCooldowns.get(agentId);
        const inCooldown = cooldownData && Date.now() < cooldownData.endTime;
        const cooldownSecs = cooldownData ? Math.ceil((cooldownData.endTime - Date.now())/1000) : 0;
        
        console.log(`[EventDispatcher] ${agentId} tick: pendingDecision=${state.pendingDecision}, inCooldown=${inCooldown}, cooldownRemaining=${cooldownSecs}s`);
        
        if (inCooldown) {
            console.log(`[EventDispatcher] ${agentId} 探索冷却中，跳过 (剩余 ${cooldownSecs}s)`);
        } else {
            // 检查是否正在探索中（state.walking）
            const isWalking = state.agentData?.state === 'walking';
            if (isWalking) {
                console.log(`[EventDispatcher] ${agentId} 正在探索中，跳过`);
            } else {
                // 不在冷却中且不在探索中，执行探索
                this.triggerDefaultExplore(agentId).catch(e => console.error('Explore error:', e.message));
                console.log(`[EventDispatcher] ${agentId} 探索冷却开始: 30秒`);
                this.agentCooldowns.set(agentId, { endTime: Date.now() + this.exploreCooldown });
            }
        }
        
        // 只有不在冷却中且不在等待决策时才触发 AI 思考
        if (!inCooldown && !state.pendingDecision) {
            const event = {
                agentId: agentId,
                type: 'PERIODIC_SNAPSHOT',
                data: {},
                priority: 1
            };
            this.dispatchEvent(agentId, event).catch(() => {});
        } else if (!inCooldown && state.pendingDecision) {
            console.log(`[EventDispatcher] ${agentId} 等待决策中，跳过 AI 思考`);
        } else {
            console.log(`[EventDispatcher] ${agentId} 冷却中，跳过探索和 AI 思考`);
        }"""

if old_block in content:
    content = content.replace(old_block, new_block)
    print('[OK] Block replaced')
else:
    print('[WARN] Old block not found')

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Done')