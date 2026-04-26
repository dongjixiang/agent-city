import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('47.77.238.56', 22, 'root', 'Kuqi@1234', timeout=10)

# Check if eventDispatcher integration is in ws-handler
stdin, stdout, stderr = client.exec_command('grep -c "eventDispatcher\|AGENT_DECISION\|agentToClientMap" /root/agent-city/server/handlers/ws-handler.js')
out = stdout.read().decode('utf-8', errors='ignore').strip()
print('eventDispatcher/AGENT_DECISION references:', out)

# Check if event-dispatcher.js exists
stdin, stdout, stderr = client.exec_command('ls -la /root/agent-city/server/event-dispatcher.js')
out = stdout.read().decode('utf-8', errors='ignore')
print('event-dispatcher.js:', out[:100])

# Check server log for any errors
stdin, stdout, stderr = client.exec_command('grep -i "error\|Error\|ERR" /tmp/server.log | tail -5')
out = stdout.read().decode('utf-8', errors='ignore')
print('Errors in log:', out[:200])

client.close()
