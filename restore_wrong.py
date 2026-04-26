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
    sftp = client.open_sftp()
    
    # I wrongly uploaded client files to city-world/src/ - restore from git HEAD
    # Since city-world/src/ was untracked, we need to figure out what was there before
    
    # First, check git status to understand what's tracked
    stdin, stdout, stderr = client.exec_command('cd /root/agent-city && git status --short city-world/')
    out = stdout.read().decode('utf-8', errors='ignore')
    print('Git status city-world/:', out)
    
    # The correct approach: only upload server/ changes, not client/ changes
    # The client/ directory is separate from city-world/src/
    
    # Check what I wrongly overwrote
    stdin, stdout, stderr = client.exec_command('cd /root/agent-city && git diff --name-only')
    out = stdout.read().decode('utf-8', errors='ignore')
    print('Modified files:', out)
    
    # Restore city-world/src/ to what git had
    stdin, stdout, stderr = client.exec_command('cd /root/agent-city && git checkout -- city-world/src/ 2>&1 || echo "No git tracking"')
    out = stdout.read().decode('utf-8', errors='ignore')
    print('Restore result:', out)
    
    sftp.close()
    
finally:
    client.close()
    
print("Done!")
