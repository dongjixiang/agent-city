import paramiko
import os

host = '47.77.238.56'
port = 22
username = 'root'
password = 'Kuqi@1234'

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    client.connect(host, port=port, username=username, password=password, timeout=10)
    
    # Restore city-world/src/ from what git had (if any)
    # Since src/ was untracked, we need to check if there's a backup or rebuild from scratch
    
    # First, let's see if we can find the original src files anywhere
    stdin, stdout, stderr = client.exec_command('find /root/agent-city -name "connection.js" -path "*/websocket/*" 2>/dev/null | head -5')
    out = stdout.read().decode('utf-8', errors='ignore')
    print('connection.js files found:', out)
    
    # Check if there's a backup
    stdin, stdout, stderr = client.exec_command('ls /root/agent-city/city-world/src/ 2>/dev/null | head -10')
    out = stdout.read().decode('utf-8', errors='ignore')
    print('Current src contents:', out)
    
    # Check what's in the city-world git history
    stdin, stdout, stderr = client.exec_command('cd /root/agent-city && git show HEAD:city-world-full.js 2>/dev/null | head -5 || echo "not in git"')
    out = stdout.read().decode('utf-8', errors='ignore')
    print('city-world-full.js in git HEAD:', out[:200])
    
finally:
    client.close()
