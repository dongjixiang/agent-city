import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('47.77.238.56', 22, 'root', 'Kuqi@1234', timeout=10)

# Kill existing services
client.exec_command('pkill -f "node server.js" 2>/dev/null')
client.exec_command('pkill -f "serve-3d" 2>/dev/null')
client.exec_command('pkill -f "python.*9999" 2>/dev/null')
import time; time.sleep(1)

# Start server.js (WebSocket + HTTP API)
client.exec_command('cd /root/agent-city && nohup node server.js > /tmp/server.log 2>&1 &')
time.sleep(2)

# Start serve-3d for 3D world on port 9999
client.exec_command('cd /root/agent-city && nohup python3 -m http.server 9999 > /tmp/3d.log 2>&1 &')
time.sleep(2)

# Check all ports
stdin, stdout, stderr = client.exec_command('netstat -tlnp 2>/dev/null | grep -E "987|999"')
print(stdout.read().decode())

# Check server log
stdin, stdout, stderr = client.exec_command('tail -10 /tmp/server.log')
print('--- server log ---')
print(stdout.read().decode())

client.close()
print("Done!")
