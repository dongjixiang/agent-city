import paramiko
import sys

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('47.77.238.56', 22, 'root', 'Kuqi@1234', timeout=10)

# Check index.html on server to see what scripts it loads
stdin, stdout, stderr = client.exec_command('head -50 /root/agent-city/city-world/index.html 2>/dev/null')
out = stdout.read().decode('utf-8', errors='ignore')
sys.stdout.buffer.write(out.encode('utf-8'))
sys.stdout.buffer.write(b'\n')

# Check src directory
stdin, stdout, stderr = client.exec_command('ls -la /root/agent-city/city-world/src/ 2>/dev/null')
out = stdout.read().decode('utf-8', errors='ignore')
sys.stdout.buffer.write(out.encode('utf-8'))

client.close()
