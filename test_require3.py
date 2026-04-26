import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('47.77.238.56', 22, 'root', 'Kuqi@1234', timeout=10)

# Test require from server directory
cmd = 'cd /root/agent-city/server && node -e "const m = require(\"./stores/memory-store\"); console.log(Object.keys(m))"'
stdin, stdout, stderr = client.exec_command(cmd)
out = stdout.read().decode('utf-8', errors='ignore')
err = stderr.read().decode('utf-8', errors='ignore')
print('stdout:', out)
print('stderr:', err[:200] if err else '')

client.close()
