import paramiko
import sys

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('47.77.238.56', 22, 'root', 'Kuqi@1234', timeout=10)

# Check what index.html loads
stdin, stdout, stderr = client.exec_command('cat /root/agent-city/city-world/index.html 2>/dev/null')
out = stdout.read().decode('utf-8', errors='ignore')
sys.stdout.buffer.write(out.encode('utf-8'))

client.close()
