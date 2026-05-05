import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('47.77.238.56', 22, 'root', 'Kuqi@1234', timeout=10)

# Kill 9999
client.exec_command('pkill -f "http.server 9999"')
print('Sent kill to 9999')

import time
time.sleep(1)

# Check ports
stdin, stdout, stderr = client.exec_command('netstat -tlnp 2>/dev/null')
output = stdout.read().decode('utf-8', errors='ignore')
print('=== Active ports ===')
for line in output.split('\n'):
    if '987' in line or '999' in line:
        print(line)

client.close()
print('Done')
