import paramiko
import time

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('47.77.238.56', 22, 'root', 'Kuqi@1234', timeout=10)

# Kill existing services
client.exec_command('pkill -f "node server.js" 2>/dev/null')
client.exec_command('pkill -f "node server/index.js" 2>/dev/null')
client.exec_command('pkill -f "serve-3d" 2>/dev/null')
client.exec_command('pkill -f "python.*9999" 2>/dev/null')
time.sleep(1)

# Start full server (HTTP API on 9877 + WebSocket on 9876)
client.exec_command('cd /root/agent-city && nohup node server/index.js > /tmp/server.log 2>&1 &')
time.sleep(3)

# Start serve-3d for 3D world on port 9999
client.exec_command('cd /root/agent-city/city-world && nohup python3 -m http.server 9999 > /tmp/3d.log 2>&1 &')
time.sleep(2)

# Check all ports
stdin, stdout, stderr = client.exec_command('netstat -tlnp 2>/dev/null')
output = stdout.read().decode('utf-8', errors='ignore')
print('All listening ports:')
for line in output.split('\n'):
    if '987' in line or '999' in line:
        print(line)

# Check server log
stdin, stdout, stderr = client.exec_command('tail -15 /tmp/server.log')
print('\n--- server log ---')
print(stdout.read().decode('utf-8', errors='ignore'))

client.close()
print("\nDone!")
