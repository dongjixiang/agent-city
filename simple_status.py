import paramiko
import urllib.request

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('47.77.238.56', 22, 'root', 'Kuqi@1234', timeout=10)

# Check ports
stdin, stdout, stderr = client.exec_command('netstat -tlnp 2>/dev/null | grep 987')
out = stdout.read().decode('utf-8', errors='ignore')
print('Ports:', out)

# Check server log tail
stdin, stdout, stderr = client.exec_command('tail -10 /tmp/server.log')
out = stdout.read().decode('utf-8', errors='ignore')
print('Server log:', out)

client.close()

# Check 3D client
try:
    req = urllib.request.urlopen('http://47.77.238.56:9998/', timeout=5)
    content = req.read(200).decode('utf-8', errors='ignore')
    print('3D client response:', content[:100])
except Exception as e:
    print('3D client check failed:', e)
