import paramiko
import time

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('47.77.238.56', 22, 'root', 'Kuqi@1234', timeout=10)

# Kill existing server
client.exec_command('pkill -f "node server/index.js" 2>/dev/null')
time.sleep(1)

# Restart server
client.exec_command('cd /root/agent-city && nohup node server/index.js > /tmp/server.log 2>&1 &')
time.sleep(3)

# Check status
stdin, stdout, stderr = client.exec_command('netstat -tlnp 2>/dev/null | grep -E "987|999"')
print(stdout.read().decode('utf-8', errors='ignore'))

# Check server log
stdin, stdout, stderr = client.exec_command('tail -10 /tmp/server.log')
print('--- server log ---')
print(stdout.read().decode('utf-8', errors='ignore'))

client.close()
print("Done!")
