import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('47.77.238.56', 22, 'root', 'Kuqi@1234', timeout=10)

# Check actual file locations
stdin, stdout, stderr = client.exec_command('find /root/agent-city -name "memory-store.js" 2>/dev/null')
out = stdout.read().decode('utf-8', errors='ignore')
print('memory-store.js locations:', out)

# Check stores directory
stdin, stdout, stderr = client.exec_command('ls -la /root/agent-city/stores/')
out = stdout.read().decode('utf-8', errors='ignore')
print('Stores dir:', out)

# Check server/stores directory
stdin, stdout, stderr = client.exec_command('ls -la /root/agent-city/server/stores/ 2>/dev/null || echo "not found"')
out = stdout.read().decode('utf-8', errors='ignore')
print('Server/stores dir:', out)

# Check if memory-store.js in stores/ exports correctly
stdin, stdout, stderr = client.exec_command('cd /root/agent-city && node -e "const m = require(\'./stores/memory-store\'); console.log(typeof m.memoryStore)"')
out = stdout.read().decode('utf-8', errors='ignore')
err = stderr.read().decode('utf-8', errors='ignore')
print('Require from root stdout:', out)
print('Require from root stderr:', err[:200] if err else '')

client.close()
