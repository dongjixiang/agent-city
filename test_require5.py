import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('47.77.238.56', 22, 'root', 'Kuqi@1234', timeout=10)

# Write test script to server's directory
test_script = "const m = require('./stores/memory-store'); console.log('Module keys:', Object.keys(m)); console.log('memoryStore type:', typeof m.memoryStore);"

# Use heredoc to write file
cmd = 'cat > /root/agent-city/server/test_require.js << "ENDJS"\n' + test_script + '\nENDJS'
stdin, stdout, stderr = client.exec_command(cmd)
stdout.read()
stderr.read()

# Run it from the server directory
stdin, stdout, stderr = client.exec_command('cd /root/agent-city/server && node test_require.js')
out = stdout.read().decode('utf-8', errors='ignore')
err = stderr.read().decode('utf-8', errors='ignore')
print('stdout:', out)
print('stderr:', err[:300] if err else '')

client.close()
