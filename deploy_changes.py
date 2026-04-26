import paramiko
import os
import time

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
    
    # Files to upload (the ones we changed)
    files_to_upload = [
        'server/handlers/ws-handler.js',
    ]
    
    for file_path in files_to_upload:
        local_path = os.path.join(local_dir, file_path)
        remote_path = f'/root/agent-city/{file_path}'
        
        if os.path.exists(local_path):
            print(f'Uploading {file_path}...')
            sftp.put(local_path, remote_path)
            print(f'  Uploaded to {remote_path}')
        else:
            print(f'  File not found: {local_path}')
    
    sftp.close()
    time.sleep(1)
    
    # Kill existing servers
    print('Killing existing servers...')
    client.exec_command('pkill -f "node server/index.js" 2>/dev/null')
    client.exec_command('pkill -f "node server.js" 2>/dev/null')
    time.sleep(2)
    
    # Start server/index.js
    print('Starting server/index.js...')
    client.exec_command('cd /root/agent-city && nohup node server/index.js > /tmp/server.log 2>&1 &')
    time.sleep(3)
    
    # Check status
    stdin, stdout, stderr = client.exec_command('netstat -tlnp 2>/dev/null | grep -E "987|999"')
    print('Ports:')
    print(stdout.read().decode('utf-8', errors='ignore'))
    
    stdin, stdout, stderr = client.exec_command('tail -15 /tmp/server.log')
    print('Server log:')
    print(stdout.read().decode('utf-8', errors='ignore'))
    
finally:
    client.close()
    
print("Done!")
