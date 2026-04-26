import paramiko
import sys

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('47.77.238.56', 22, 'root', 'Kuqi@1234', timeout=10)

# Check server's connection.js for AGENT_MOVED handling
stdin, stdout, stderr = client.exec_command('grep -n "AGENT_MOVED\|WS_AGENT" /root/agent-city/city-world/src/websocket/connection.js 2>/dev/null')
out = stdout.read().decode('utf-8', errors='ignore')
sys.stdout.buffer.write(out.encode('utf-8'))
sys.stdout.buffer.write(b'\n')

# Check server's main.js for event handling
stdin, stdout, stderr = client.exec_command('grep -n "AGENT_MOVED\|WS_AGENT" /root/agent-city/city-world/src/main.js 2>/dev/null')
out = stdout.read().decode('utf-8', errors='ignore')
sys.stdout.buffer.write(out.encode('utf-8'))

client.close()
