import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('47.77.238.56', 22, 'root', 'Kuqi@1234', timeout=10)

# Check both locations
stdin, stdout, stderr = client.exec_command('ls -la /root/agent-city/stores/ 2>/dev/null || echo "NOT FOUND"')
out = stdout.read().decode('utf-8', errors='ignore')
print('/root/agent-city/stores/:', out)

stdin, stdout, stderr = client.exec_command('ls -la /root/agent-city/server/stores/')
out = stdout.read().decode('utf-8', errors='ignore')
print('/root/agent-city/server/stores/:', out)

# Check if there are node_modules in the way
stdin, stdout, stderr = client.exec_command('ls /root/agent-city/server/node_modules/stores 2>/dev/null || echo "no stores in node_modules"')
out = stdout.read().decode('utf-8', errors='ignore')
print('node_modules/stores:', out)

client.close()
