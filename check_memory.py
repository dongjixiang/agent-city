import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('47.77.238.56', 22, 'root', 'Kuqi@1234', timeout=10)

# Check the stores directory structure
stdin, stdout, stderr = client.exec_command('ls -la /root/agent-city/stores/ 2>/dev/null || ls -la /root/agent-city/server/stores/')
out = stdout.read().decode('utf-8', errors='ignore')
print('Stores dir:', out)

# Try to require memory-store from node
stdin, stdout, stderr = client.exec_command('cd /root/agent-city && node -e "const {memoryStore} = require(\'./stores/memory-store\'); console.log(typeof memoryStore)"')
out = stdout.read().decode('utf-8', errors='ignore')
err = stderr.read().decode('utf-8', errors='ignore')
print('Require test stdout:', out)
print('Require test stderr:', err)

client.close()
