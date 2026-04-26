import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('47.77.238.56', 22, 'root', 'Kuqi@1234', timeout=10)

# Simple local test
stdin, stdout, stderr = client.exec_command('curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:9998/')
status = stdout.read().decode('utf-8', errors='ignore').strip()
print('Local status:', status)

# Get HTML
stdin, stdout, stderr = client.exec_command('curl -s http://127.0.0.1:9998/ | head -20')
content = stdout.read().decode('utf-8', errors='replace')
print('HTML:')
print(content)

client.close()
