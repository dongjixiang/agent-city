import paramiko
import sys

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('47.77.238.56', 22, 'root', 'Kuqi@1234', timeout=10)

# Check today's access log
stdin, stdout, stderr = client.exec_command('grep "25/Apr" /tmp/3d_9998.log 2>/dev/null | tail -20')
print('=== Today log ===')
for line in stdout.read().decode('utf-8', errors='replace').split('\n'):
    try:
        print(line)
    except:
        pass

# Check main.js first 20 lines
stdin, stdout, stderr = client.exec_command('head -20 /root/agent-city/client/main.js')
print('=== main.js head ===')
for line in stdout.read().decode('utf-8', errors='replace').split('\n'):
    try:
        print(line)
    except:
        pass

client.close()
