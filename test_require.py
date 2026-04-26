import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('47.77.238.56', 22, 'root', 'Kuqi@1234', timeout=10)

# Test the require from the server directory
stdin, stdout, stderr = client.exec_command('cd /root/agent-city/server && node -e "const {memoryStore} = require(\'../stores/memory-store\'); console.log(typeof memoryStore)"')
out = stdout.read().decode('utf-8', errors='ignore')
err = stderr.read().decode('utf-8', errors='ignore')
print('Require test stdout:', out)
print('Require test stderr:', err[:200] if err else '')

client.close()
