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
    
    # Check current server status
    stdin, stdout, stderr = client.exec_command('netstat -tlnp 2>/dev/null | grep -E "987|999"')
    out = stdout.read().decode('utf-8', errors='ignore')
    sys.stdout.buffer.write(f'Ports:\n{out}\n'.encode('utf-8'))
    
    # Check server log
    stdin, stdout, stderr = client.exec_command('tail -20 /tmp/server.log')
    out = stdout.read().decode('utf-8', errors='ignore')
    sys.stdout.buffer.write(f'Server log:\n{out}\n'.encode('utf-8'))
    
    # Check if there's a build or deploy process for client/
    stdin, stdout, stderr = client.exec_command('ls /root/agent-city/city-world/src/websocket/ 2>/dev/null')
    out = stdout.read().decode('utf-8', errors='ignore')
    sys.stdout.buffer.write(f'Src websocket:\n{out}\n'.encode('utf-8'))
    
finally:
    client.close()
