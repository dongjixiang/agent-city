import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('47.77.238.56', 22, 'root', 'Kuqi@1234', timeout=10)

# Upload fixed event-dispatcher.js
sftp = client.open_sftp()
sftp.put('C:/Users/swede/.openclaw/workspace-arch/agent-city/server/event-dispatcher.js', '/root/agent-city/server/event-dispatcher.js')
print('Uploaded fixed event-dispatcher.js')
sftp.close()

# Kill existing server
try:
    stdin, stdout, stderr = client.exec_command('pkill -9 -f "node server/index.js"')
    stdout.read()
    stderr.read()
except:
    pass

import time
time.sleep(1)

# Start new server
stdin, stdout, stderr = client.exec_command('cd /root/agent-city && nohup node server/index.js > /tmp/server.log 2>&1 &')
time.sleep(3)

# Check
stdin, stdout, stderr = client.exec_command('netstat -tlnp 2>/dev/null | grep 987')
out = stdout.read().decode('utf-8', errors='ignore')
print('Ports:', out)

stdin, stdout, stderr = client.exec_command('tail -10 /tmp/server.log')
out = stdout.read().decode('utf-8', errors='ignore')
print('Log:', out)

client.close()
print("Done!")
