import paramiko
import sys

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('47.77.238.56', 22, 'root', 'Kuqi@1234', timeout=10)

stdin, stdout, stderr = client.exec_command('ls -la /root/agent-city/client/')
print('=== client folder ===')
for line in stdout.read().decode('utf-8', errors='ignore').split('\n'):
    print(line)

stdin, stdout, stderr = client.exec_command('ls -la /root/agent-city/client/src/ 2>/dev/null || echo "no src folder"')
print('=== client/src ===')
for line in stdout.read().decode('utf-8', errors='ignore').split('\n'):
    print(line)

client.close()
