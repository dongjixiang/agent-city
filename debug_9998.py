import paramiko
import sys

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('47.77.238.56', 22, 'root', 'Kuqi@1234', timeout=10)

# Check 9998 log
stdin, stdout, stderr = client.exec_command('cat /tmp/3d_9998.log 2>/dev/null | tail -20')
print('=== 9998 log ===')
for line in stdout.read().decode('utf-8', errors='replace').split('\n'):
    print(line)

# Check index.html
stdin, stdout, stderr = client.exec_command('head -30 /root/agent-city/client/index.html')
print('=== index.html ===')
for line in stdout.read().decode('utf-8', errors='replace').split('\n'):
    print(line)

client.close()
