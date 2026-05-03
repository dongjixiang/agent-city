import re

path = 'C:/Users/swede/.openclaw/workspace-arch/agent-city/server/event-dispatcher.js'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

print('File size:', len(content))

# 1. Change snapshotInterval from 5 minutes to read from config with default
old_interval = "this.snapshotInterval = 5 * 60 * 1000; // 5分钟"
new_interval = "this.snapshotInterval = (this.config?.thinking?.interval || 10) * 1000; // from config, default 10s"
if old_interval in content:
    content = content.replace(old_interval, new_interval)
    print('[OK] Changed snapshotInterval')
else:
    print('[WARN] snapshotInterval line not found')

# 2. Add exploreCooldown to config
old_thinking = "# 智能体思考配置"
new_thinking = """# 智能体思考配置
    this.exploreCooldown = (this.config?.thinking?.exploreCooldown || 30) * 1000; // 默认30s
    this.agentCooldowns = new Map(); // agentId -> cooldown timer data"""
if old_thinking in content:
    content = content.replace(old_thinking, new_thinking)
    print('[OK] Added exploreCooldown')
else:
    print('[WARN] thinking config line not found')

# 3. Modify sendPeriodicSnapshot to use cooldown
old_snapshot_end = """        // 先执行一次探索动作（不需要等待 AI）
        await this.triggerDefaultExplore(agentId);
        
        console.log(`[EventDispatcher] triggerDefaultExplore completed for ${agentId}`);
        
        // 构建事件并发送给 AI"""
new_snapshot_end = """        // 检查是否在冷却中
        const cooldownData = this.agentCooldowns.get(agentId);
        if (cooldownData && Date.now() < cooldownData.endTime) {
            console.log(`[EventDispatcher] ${agentId} 探索冷却中，跳过 (剩余 ${Math.ceil((cooldownData.endTime - Date.now())/1000)}s)`);
        } else {
            // 执行探索动作（不需要等待 AI）
            await this.triggerDefaultExplore(agentId);
            console.log(`[EventDispatcher] triggerDefaultExplore completed for ${agentId}`);
            
            // 设置冷却时间
            const cooldownMs = this.exploreCooldown;
            this.agentCooldowns.set(agentId, { endTime: Date.now() + cooldownMs });
            console.log(`[EventDispatcher] ${agentId} 探索冷却开始: ${cooldownMs/1000}秒`);
        }
        
        // 构建事件并发送给 AI"""

if old_snapshot_end in content:
    content = content.replace(old_snapshot_end, new_snapshot_end)
    print('[OK] Modified sendPeriodicSnapshot')
else:
    print('[WARN] sendPeriodicSnapshot end block not found')

# 4. Update connection.js to handle UPDATE_AGENT_CONFIG
conn_path = 'C:/Users/swede/.openclaw/workspace-arch/agent-city/server/connection.js'
with open(conn_path, 'r', encoding='utf-8') as f:
    conn = f.read()

# Add UPDATE_AGENT_CONFIG handler
if "case 'UPDATE_AGENT_CONFIG'" not in conn:
    old_case = "case 'AGENT_IN_CONVERSATION':"
    new_case = """case 'UPDATE_AGENT_CONFIG':
            if (data.agentId && data.config) {
              console.log('[Connection] UPDATE_AGENT_CONFIG:', data.agentId, data.config);
              this.eventDispatcher?.handleUpdateAgentConfig(data.agentId, data.config);
            }
            break;
            
        case 'AGENT_IN_CONVERSATION':"""
    if old_case in conn:
        conn = conn.replace(old_case, new_case)
        with open(conn_path, 'w', encoding='utf-8') as f:
            f.write(conn)
        print('[OK] Added UPDATE_AGENT_CONFIG handler')
    else:
        print('[WARN] AGENT_IN_CONVERSATION case not found')
else:
    print('[INFO] UPDATE_AGENT_CONFIG handler already exists')

# 5. Add handleUpdateAgentConfig to event-dispatcher
if 'handleUpdateAgentConfig' not in content:
    insert_before = 'async sendPeriodicSnapshot(agentId) {'
    new_func = '''    /**
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
            
            if (config.thinkInterval !== undefined) {
                this.snapshotInterval = config.thinkInterval;
                console.log('[EventDispatcher] Updated snapshotInterval to:', config.thinkInterval);
                this.stopSnapshotTimer(agentId);
                this.startSnapshotTimer(agentId);
            }
            
            if (config.exploreCooldown !== undefined) {
                this.exploreCooldown = config.exploreCooldown * 1000;
                console.log('[EventDispatcher] Updated exploreCooldown to:', config.exploreCooldown);
            }
            
            await this.agentStore.update(agentId, agent);
            
        } catch (e) {
            console.error('[EventDispatcher] handleUpdateAgentConfig error:', e.message);
        }
    }
    
    '''
    if insert_before in content:
        content = content.replace(insert_before, new_func + insert_before)
        print('[OK] Added handleUpdateAgentConfig')
    else:
        print('[WARN] sendPeriodicSnapshot not found for insertion')
else:
    print('[INFO] handleUpdateAgentConfig already exists')

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print('File saved')