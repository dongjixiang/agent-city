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
    
    # Check if there's a backup anywhere
    stdin, stdout, stderr = client.exec_command('find /root/agent-city -name "*.bak" -o -name "*.backup" -o -name "connection.js.orig" 2>/dev/null | head -20')
    out = stdout.read().decode('utf-8', errors='ignore')
    sys.stdout.buffer.write(f'Backups found:\n{out}\n'.encode('utf-8'))
    
    # Check if there's an agent-city-deploy.tar.gz that contains original files
    stdin, stdout, stderr = client.exec_command('ls -la /root/agent-city/*.tar.gz /root/agent-city/*.zip 2>/dev/null')
    out = stdout.read().decode('utf-8', errors='ignore')
    sys.stdout.buffer.write(f'Archives:\n{out}\n'.encode('utf-8'))
    
    # Check if there's a src/ somewhere else
    stdin, stdout, stderr = client.exec_command('find /root -name "connection.js" -path "*/websocket/*" 2>/dev/null | head -10')
    out = stdout.read().decode('utf-8', errors='ignore')
    sys.stdout.buffer.write(f'connection.js files:\n{out}\n'.encode('utf-8'))
    
finally:
    client.close()
