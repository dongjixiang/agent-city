import paramiko
import sys

host = '47.77.238.56'
port = 22
username = 'root'
password = 'Kuqi@1234'

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    client.connect(host, port=port, username=username, password=password, timeout=10)
    
    # Just get the first 50 lines of city-world-full.js
    stdin, stdout, stderr = client.exec_command('head -50 /root/agent-city/city-world/city-world-full.js 2>/dev/null')
    out = stdout.read().decode('utf-8', errors='ignore')
    sys.stdout.buffer.write(out.encode('utf-8'))
    
finally:
    client.close()
