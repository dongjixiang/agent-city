import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('47.77.238.56', 22, 'root', 'Kuqi@1234', timeout=10)

# Test local curl
stdin, stdout, stderr = client.exec_command('curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:9998/')
print('=== Local curl status ===')
print(stdout.read().decode('utf-8', errors='ignore'))

# Get the HTML content
stdin, stdout, stderr = client.exec_command('curl -s http://127.0.0.1:9998/')
print('=== HTML ===')
content = stdout.read().decode('utf-8', errors='replace')
for line in content.split('\n')[:30]:
    print(line)

# Check main.js size
stdin, stdout, stderr = client.exec_command('wc -l /root/agent-city/client/main.js')
print('=== main.js lines ===')
print(stdout.read().decode('utf-8', errors='ignore'))

client.close()
