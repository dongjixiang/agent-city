import re

# Fix connection.js path issue - UPDATE_AGENT_CONFIG goes to ws-handler.js
ws_path = 'C:/Users/swede/.openclaw/workspace-arch/agent-city/server/handlers/ws-handler.js'
with open(ws_path, 'r', encoding='utf-8') as f:
    conn = f.read()

# Add UPDATE_AGENT_CONFIG handler
if "case 'UPDATE_AGENT_CONFIG'" not in conn:
    old_case = "case 'AGENT_IN_CONVERSATION':"
    new_case = """case 'UPDATE_AGENT_CONFIG':
            if (data.agentId && data.config) {
              console.log('[WSHandler] UPDATE_AGENT_CONFIG:', data.agentId, data.config);
              this.eventDispatcher?.handleUpdateAgentConfig(data.agentId, data.config);
            }
            break;
            
        case 'AGENT_IN_CONVERSATION':"""
    if old_case in conn:
        conn = conn.replace(old_case, new_case)
        with open(ws_path, 'w', encoding='utf-8') as f:
            f.write(conn)
        print('[OK] Added UPDATE_AGENT_CONFIG handler to ws-handler.js')
    else:
        print('[WARN] AGENT_IN_CONVERSATION case not found in ws-handler.js')
else:
    print('[INFO] UPDATE_AGENT_CONFIG handler already exists in ws-handler.js')

# Check event-dispatcher for handleUpdateAgentConfig
ed_path = 'C:/Users/swede/.openclaw/workspace-arch/agent-city/server/event-dispatcher.js'
with open(ed_path, 'r', encoding='utf-8') as f:
    ed = f.read()

if 'handleUpdateAgentConfig' not in ed:
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
    if insert_before in ed:
        ed = ed.replace(insert_before, new_func + insert_before)
        with open(ed_path, 'w', encoding='utf-8') as f:
            f.write(ed)
        print('[OK] Added handleUpdateAgentConfig')
    else:
        print('[WARN] sendPeriodicSnapshot not found for insertion')
else:
    print('[INFO] handleUpdateAgentConfig already exists')

print('Done')