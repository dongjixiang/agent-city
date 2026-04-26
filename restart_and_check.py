import paramiko
import urllib.request
import time

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('47.77.238.56', 22, 'root', 'Kuqi@1234', timeout=10)

# Kill server
stdin, stdout, stderr = client.exec_command('pkill -f "node server/index.js" 2>/dev/null')
stdout.read()
stderr.read()
time.sleep(2)

# Start server
stdin, stdout, stderr = client.exec_command('cd /root/agent-city && nohup node server/index.js > /tmp/server.log 2>&1 &')
stdout.read()
time.sleep(4)

# Check ports
stdin, stdout, stderr = client.exec_command('netstat -tlnp 2>/dev/null | grep 987')
out = stdout.read().decode('utf-8', errors='ignore')
print('Ports:', out)

# Check server log
stdin, stdout, stderr = client.exec_command('tail -20 /tmp/server.log')
out = stdout.read().decode('utf-8', errors='ignore')
print('Server log:', out)

client.close()

# Check 3D client
try:
    req = urllib.request.urlopen('http://47.77.238.56:9998/main.js', timeout=5)
    content = req.read().decode('utf-8', errors='ignore')
    print('3D main.js has showSpeechBubble:', content.count('showSpeechBubble'))
except Exception as e:
    print('3D client check failed:', e)
