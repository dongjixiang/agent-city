import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('47.77.238.56', 22, 'root', 'Kuqi@1234', timeout=10)

# Check processes
stdin, stdout, stderr = client.exec_command('ps aux | grep -E "python|node" | grep -v grep')
print('=== Processes ===')
print(stdout.read().decode('utf-8', errors='ignore'))

# Check what's on each port
stdin, stdout, stderr = client.exec_command('ls -la /root/agent-city/city-world/')
print('=== city-world ===')
print(stdout.read().decode('utf-8', errors='ignore'))

# Check the 9998 and 9999 services
stdin, stdout, stderr = client.exec_command('tail -5 /tmp/3d.log 2>/dev/null; echo "---"; tail -5 /tmp/9998.log 2>/dev/null')
print('=== 3D logs ===')
print(stdout.read().decode('utf-8', errors='ignore'))

client.close()
