import re

ws_path = 'C:/Users/swede/.openclaw/workspace-arch/agent-city/server/handlers/ws-handler.js'
with open(ws_path, 'r', encoding='utf-8') as f:
    conn = f.read()

# Add UPDATE_AGENT_CONFIG handler before default case
if "case 'UPDATE_AGENT_CONFIG'" not in conn:
    old_case = """                case 'LIST':
                    await this.handleList(ws, clientId, payload);
                    break;

                default:"""
    new_case = """                case 'LIST':
                    await this.handleList(ws, clientId, payload);
                    break;

                case 'UPDATE_AGENT_CONFIG':
                    if (payload.agentId && payload.config) {
                      console.log('[WSHandler] UPDATE_AGENT_CONFIG:', payload.agentId, payload.config);
                      this.eventDispatcher?.handleUpdateAgentConfig(payload.agentId, payload.config);
                    }
                    break;

                default:"""
    if old_case in conn:
        conn = conn.replace(old_case, new_case)
        with open(ws_path, 'w', encoding='utf-8') as f:
            f.write(conn)
        print('[OK] Added UPDATE_AGENT_CONFIG handler')
    else:
        print('[WARN] Pattern not found')
else:
    print('[INFO] UPDATE_AGENT_CONFIG handler already exists')

print('Done')