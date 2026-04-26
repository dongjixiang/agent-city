import paramiko
import sys

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('47.77.238.56', 22, 'root', 'Kuqi@1234', timeout=10)

# Verify REST handler in ws-handler
stdin, stdout, stderr = client.exec_command('grep -c "handleRest\|WS_AGENT_MOVED" /root/agent-city/server/handlers/ws-handler.js 2>/dev/null')
out = stdout.read().decode('utf-8', errors='ignore').strip()
sys.stdout.buffer.write(f'ws-handler REST handler count: {out}\n'.encode('utf-8'))

# Verify connection.js events
stdin, stdout, stderr = client.exec_command('grep -c "WS_AGENT_MOVED" /root/agent-city/city-world/src/websocket/connection.js 2>/dev/null')
out = stdout.read().decode('utf-8', errors='ignore').strip()
sys.stdout.buffer.write(f'connection.js WS_AGENT_MOVED count: {out}\n'.encode('utf-8'))

# Verify main.js handlers
stdin, stdout, stderr = client.exec_command('grep -c "WS_AGENT_MOVED\|showSpeechBubble" /root/agent-city/city-world/src/main.js 2>/dev/null')
out = stdout.read().decode('utf-8', errors='ignore').strip()
sys.stdout.buffer.write(f'main.js event handlers count: {out}\n'.encode('utf-8'))

client.close()
