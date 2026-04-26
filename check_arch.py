import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('47.77.238.56', 22, 'root', 'Kuqi@1234', timeout=10)

# Check server log for any AI activity
stdin, stdout, stderr = client.exec_command('tail -100 /tmp/server.log 2>/dev/null')
print(stdout.read().decode('utf-8', errors='ignore'))

client.close()
