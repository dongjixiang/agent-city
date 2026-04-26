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
    
    # Key files to upload
    key_files = [
        ('client/main.js', '/root/agent-city/client/main.js'),
        ('client/websocket/connection.js', '/root/agent-city/client/websocket/connection.js'),
    ]
    
    for local_path, remote_path in key_files:
        full_local = os.path.join(local_dir, local_path)
        if os.path.exists(full_local):
            size = os.path.getsize(full_local)
            print(f'Uploading {local_path} ({size} bytes) -> {remote_path}')
            sftp.put(full_local, remote_path)
            print(f'  Done')
        else:
            print(f'  Not found: {full_local}')
    
    # Also check if main.js was updated
    stdin, stdout, stderr = client.exec_command('ls -la /root/agent-city/client/main.js', timeout=5)
    print('Server main.js:', stdout.read().decode().strip())
    
    sftp.close()
    
finally:
    client.close()
    
print("Done!")
