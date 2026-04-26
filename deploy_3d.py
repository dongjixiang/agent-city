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
    
    # Files to upload (client-side changes)
    files_to_upload = [
        ('client/websocket/connection.js', 'city-world/src/websocket/connection.js'),
        ('client/main.js', 'city-world/src/main.js'),
    ]
    
    for local_path, remote_path in files_to_upload:
        full_local = os.path.join(local_dir, local_path)
        full_remote = f'/root/agent-city/{remote_path}'
        
        if os.path.exists(full_local):
            print(f'Uploading {local_path} -> {remote_path}...')
            sftp.put(full_local, full_remote)
            print(f'  Uploaded to {full_remote}')
        else:
            print(f'  File not found: {full_local}')
    
    sftp.close()
    
finally:
    client.close()
    
print("Done! No restart needed - 3D server serves static files.")
