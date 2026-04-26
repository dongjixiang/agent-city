import paramiko
import os

host = '47.77.238.56'
port = 22
username = 'root'
password = 'Kuqi@1234'
local_dir = os.path.dirname(os.path.abspath(__file__))

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    client.connect(host, port=port, username=username, password=password, timeout=10)
    sftp = client.open_sftp()
    
    # First, restore the files I wrongly overwrote from git on the server
    print('Checking if server files need restore from git...')
    
    # Restore files from git on the server
    stdin, stdout, stderr = client.exec_command('cd /root/agent-city && git checkout -- city-world/src/websocket/connection.js city-world/src/main.js 2>/dev/null')
    out = stdout.read().decode('utf-8', errors='ignore')
    err = stderr.read().decode('utf-8', errors='ignore')
    print('Restore stdout:', out)
    print('Restore stderr:', err)
    
    # Check git status on server
    stdin, stdout, stderr = client.exec_command('cd /root/agent-city && git status --short 2>/dev/null')
    out = stdout.read().decode('utf-8', errors='ignore')
    print('Git status:', out)
    
    sftp.close()
    
finally:
    client.close()
    
print("Done!")
