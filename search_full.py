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
    
    # Search for WebSocket message handling in city-world-full.js
    # Look for where it handles incoming messages
    stdin, stdout, stderr = client.exec_command('grep -n "ws:agent_connected\|ws:agent_disconnected\|AGENT_MOVED\|_handleMessage" /root/agent-city/city-world/city-world-full.js 2>/dev/null | head -20')
    out = stdout.read().decode('utf-8', errors='ignore')
    sys.stdout.buffer.write(f'Message handling in full.js:\n{out}\n'.encode('utf-8'))
    
    # Search for event bus Events object
    stdin, stdout, stderr = client.exec_command('grep -n "WS_CONNECTED\|WS_DISCONNECTED\|ws:connected\|ws:disconnected" /root/agent-city/city-world/city-world-full.js 2>/dev/null | head -20')
    out = stdout.read().decode('utf-8', errors='ignore')
    sys.stdout.buffer.write(f'WS events in full.js:\n{out}\n'.encode('utf-8'))
    
    # Search for bindEvents or similar
    stdin, stdout, stderr = client.exec_command('grep -n "bindEvents\|onresize\|addEventListener" /root/agent-city/city-world/city-world-full.js 2>/dev/null | head -20')
    out = stdout.read().decode('utf-8', errors='ignore')
    sys.stdout.buffer.write(f'Event binding in full.js:\n{out}\n'.encode('utf-8'))
    
finally:
    client.close()
