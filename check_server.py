import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('47.77.238.56', 22, 'root', 'Kuqi@1234', timeout=10)

stdin, stdout, stderr = client.exec_command('netstat -tlnp 2>/dev/null')
output = stdout.read().decode()
for line in output.split('\n'):
    if '987' in line or '999' in line:
        print(line)

# Also check if serve-3d is running
stdin, stdout, stderr = client.exec_command('ps aux | grep serve-3d | grep -v grep')
print(stdout.read().decode())

# Check recent server log
stdin, stdout, stderr = client.exec_command('tail -20 /tmp/server.log')
print('--- server log ---')
print(stdout.read().decode())

client.close()
