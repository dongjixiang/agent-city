import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('47.77.238.56', 22, 'root', 'Kuqi@1234', timeout=10)

# Check if REST handler is in ws-handler.js on server
stdin, stdout, stderr = client.exec_command('grep -n "REST\|handleRest" /root/agent-city/server/handlers/ws-handler.js 2>/dev/null | head -10')
print('ws-handler REST check:')
print(stdout.read().decode('utf-8', errors='ignore'))

client.close()
