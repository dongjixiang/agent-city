import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('47.77.238.56', 22, 'root', 'Kuqi@1234', timeout=10)

stdin, stdout, stderr = client.exec_command('grep -n "eventDispatcher" /root/agent-city/server/index.js')
out = stdout.read().decode('utf-8', errors='ignore')
print('index.js eventDispatcher references:')
print(out)

# Check the actual import and setStores call
stdin, stdout, stderr = client.exec_command('grep -n "eventDispatcher\|setStores" /root/agent-city/server/index.js')
out = stdout.read().decode('utf-8', errors='ignore')
print('index.js eventDispatcher/setStores:')
print(out)

client.close()
