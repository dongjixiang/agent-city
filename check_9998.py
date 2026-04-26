import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('47.77.238.56', 22, 'root', 'Kuqi@1234', timeout=10)

stdin, stdout, stderr = client.exec_command('cat /tmp/3d_9998.log 2>/dev/null | tail -10')
print('=== 9998 log ===')
print(stdout.read().decode('utf-8', errors='ignore'))

stdin, stdout, stderr = client.exec_command('ls -la /root/agent-city/client/')
print('=== client folder ===')
print(stdout.read().decode('utf-8', errors='ignore'))

client.close()
