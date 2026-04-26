import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('47.77.238.56', 22, 'root', 'Kuqi@1234', timeout=10)

# Check full server log
stdin, stdout, stderr = client.exec_command('tail -50 /tmp/server.log')
print(stdout.read().decode('utf-8', errors='ignore'))

# Check if there's any AI service running
stdin, stdout, stderr = client.exec_command('ps aux | grep -i "ai\|brain\|decision" | grep -v grep')
print('AI processes:', stdout.read().decode('utf-8', errors='ignore'))

client.close()
