import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('47.77.238.56', 22, 'root', 'Kuqi@1234', timeout=10)

# Check what files are in city-world directory
stdin, stdout, stderr = client.exec_command('ls -la /root/agent-city/city-world/')
print(stdout.read().decode('utf-8', errors='ignore'))

# Check if 9999 serves the right content
stdin, stdout, stderr = client.exec_command('curl -s http://localhost:9999/ | head -10')
print('9999 content:', stdout.read().decode('utf-8', errors='ignore')[:200])

# Check what's running on 9999
stdin, stdout, stderr = client.exec_command('ps aux | grep python | grep -v grep')
print('Python processes:', stdout.read().decode('utf-8', errors='ignore'))

client.close()
