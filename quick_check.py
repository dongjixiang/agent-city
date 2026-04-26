import paramiko
import sys

host = '47.77.238.56'
port = 22
username = 'root'
password = 'Kuqi@1234'

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    client.connect(host, port=port, username=username, password=password, timeout=10)
    
    # Quick check if my showSpeechBubble code is in src/main.js
    stdin, stdout, stderr = client.exec_command('grep -c "showSpeechBubble" /root/agent-city/city-world/src/main.js 2>/dev/null')
    out = stdout.read().decode('utf-8', errors='ignore').strip()
    print(f'ShowSpeechBubble in src/main.js: {out}')
    
    # Check if my WebSocket events are in src/websocket/connection.js
    stdin, stdout, stderr = client.exec_command('grep -c "WS_AGENT_MOVED" /root/agent-city/city-world/src/websocket/connection.js 2>/dev/null')
    out = stdout.read().decode('utf-8', errors='ignore').strip()
    print(f'WS_AGENT_MOVED in src/websocket/connection.js: {out}')
    
    # Check server ws-handler has REST handler
    stdin, stdout, stderr = client.exec_command('grep -c "handleRest" /root/agent-city/server/handlers/ws-handler.js 2>/dev/null')
    out = stdout.read().decode('utf-8', errors='ignore').strip()
    print(f'handleRest in ws-handler.js: {out}')
    
    # Check server log for errors
    stdin, stdout, stderr = client.exec_command('tail -5 /tmp/server.log 2>/dev/null')
    out = stdout.read().decode('utf-8', errors='ignore')
    print(f'Server log: {out}')
    
finally:
    client.close()
