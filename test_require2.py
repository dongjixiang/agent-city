import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('47.77.238.56', 22, 'root', 'Kuqi@1234', timeout=10)

# Test require from server directory
stdin, stdout, stderr = client.exec_command('cd /root/agent-city/server && node -e "const {memoryStore} = require(\'./stores/memory-store\'); console.log(typeof memoryStore)"')
out = stdout.read().decode('utf-8', errors='ignore')
err = stderr.read().decode('utf-8', errors='ignore')
print('Require from server/ stdout:', out)
print('Require from server/ stderr:', err[:200] if err else '')

# Check if memoryStore in stores/index.js exports it
stdin, stdout, stderr = client.exec_command('cat /root/agent-city/server/stores/index.js')
out = stdout.read().decode('utf-8', errors='ignore')
print('stores/index.js:', out[:500])

client.close()
