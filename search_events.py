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
    
    # Search for any Events object
    stdin, stdout, stderr = client.exec_command(
        'grep -n "Events\\|ws:message\\|ws:connected" /root/agent-city/city-world/city-world-full.js 2>/dev/null | head -20'
    )
    out = stdout.read().decode('utf-8', errors='ignore')
    sys.stdout.buffer.write(f'Events in full.js:\n{out}\n'.encode('utf-8'))
    
    # Search for connection or websocket handling
    stdin, stdout, stderr = client.exec_command(
        'grep -n "WebSocket\\|connection\\|ws\\." /root/agent-city/city-world/city-world-full.js 2>/dev/null | head -30'
    )
    out = stdout.read().decode('utf-8', errors='ignore')
    sys.stdout.buffer.write(f'WebSocket in full.js:\n{out}\n'.encode('utf-8'))
    
finally:
    client.close()
