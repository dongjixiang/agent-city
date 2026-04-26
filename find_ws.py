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
    
    # Search for ws or socket or message
    stdin, stdout, stderr = client.exec_command(
        'grep -n "ws\\." /root/agent-city/city-world/city-world-full.js 2>/dev/null | head -30'
    )
    out = stdout.read().decode('utf-8', errors='ignore')
    sys.stdout.buffer.write(f'ws. patterns:\n{out}\n'.encode('utf-8'))
    
    # Search for send
    stdin, stdout, stderr = client.exec_command(
        'grep -n "wsSend\\|websocket\\|socket" /root/agent-city/city-world/city-world-full.js 2>/dev/null | head -30'
    )
    out = stdout.read().decode('utf-8', errors='ignore')
    sys.stdout.buffer.write(f'socket patterns:\n{out}\n'.encode('utf-8'))
    
    # Check around line 500-600 for connection setup
    stdin, stdout, stderr = client.exec_command(
        'sed -n "500,550p" /root/agent-city/city-world/city-world-full.js 2>/dev/null'
    )
    out = stdout.read().decode('utf-8', errors='ignore')
    sys.stdout.buffer.write(f'Lines 500-550:\n{out}\n'.encode('utf-8'))
    
finally:
    client.close()
