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
    
    # Search for connection setup and message handling
    stdin, stdout, stderr = client.exec_command(
        'grep -n "WebSocket\\|onmessage\\|onopen\\|onclose\\|AGENT_MOVED\\|AGENT_REGISTERED\\|agent:moved" /root/agent-city/city-world/city-world-full.js 2>/dev/null | head -30'
    )
    out = stdout.read().decode('utf-8', errors='ignore')
    sys.stdout.buffer.write(f'WebSocket/Message handling:\n{out}\n'.encode('utf-8'))
    
    # Search for where events are emitted or handled
    stdin, stdout, stderr = client.exec_command(
        'grep -n "eventBus\\|Events\\|emit\\|on(" /root/agent-city/city-world/city-world-full.js 2>/dev/null | head -30'
    )
    out = stdout.read().decode('utf-8', errors='ignore')
    sys.stdout.buffer.write(f'Event handling:\n{out}\n'.encode('utf-8'))
    
finally:
    client.close()
