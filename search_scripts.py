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
    
    # Search all JS files for the relevant code
    for filename in ['enhanced-city.js', 'world-window.js', 'dashboard-panel.js', 'city-world-full.js']:
        stdin, stdout, stderr = client.exec_command(
            f'grep -l "ws:agent_connected\\|WS_AGENT\\|showSpeechBubble" /root/agent-city/city-world/{filename} 2>/dev/null'
        )
        out = stdout.read().decode('utf-8', errors='ignore').strip()
        if out:
            sys.stdout.buffer.write(f'{filename}: has relevant code\n'.encode('utf-8'))
        else:
            sys.stdout.buffer.write(f'{filename}: no match\n'.encode('utf-8'))
    
    # Check what Events object looks like in enhanced-city.js
    stdin, stdout, stderr = client.exec_command('grep -n "ws:agent_connected\\|WS_AGENT_CONNECTED\\|agent_connected" /root/agent-city/city-world/enhanced-city.js 2>/dev/null | head -10')
    out = stdout.read().decode('utf-8', errors='ignore')
    sys.stdout.buffer.write(f'enhanced-city.js agent events:\n{out}\n'.encode('utf-8'))
    
finally:
    client.close()
