import paramiko
import os

host = '47.77.238.56'
port = 22
username = 'root'
password = 'Kuqi@1234'
local_dir = 'C:/Users/swede/.openclaw/workspace-arch/agent-city'

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    client.connect(host, port=port, username=username, password=password, timeout=10)
    sftp = client.open_sftp()
    
    # Upload key server files
    files = [
        ('server/event-dispatcher.js', 'server/event-dispatcher.js'),
        ('server/handlers/ws-handler.js', 'server/handlers/ws-handler.js'),
        ('server/index.js', 'server/index.js'),
        ('server/stores/memory-store.js', 'server/stores/memory-store.js'),
    ]
    
    for local_path, remote_path in files:
        full_local = os.path.join(local_dir, local_path)
        remote_full = f'/root/agent-city/{remote_path}'
        if os.path.exists(full_local):
            sftp.put(full_local, remote_full)
            print(f'Uploaded {local_path}')
        else:
            print(f'NOT FOUND: {full_local}')
    
    sftp.close()
    import time
    time.sleep(1)
    
    # Kill server
    stdin, stdout, stderr = client.exec_command('pkill -9 -f "node server/index.js" 2>/dev/null; sleep 1')
    stdout.read()
    stderr.read()
    
    # Start server
    stdin, stdout, stderr = client.exec_command('cd /root/agent-city && nohup node server/index.js > /tmp/server.log 2>&1 &')
    time.sleep(3)
    
    # Check
    stdin, stdout, stderr = client.exec_command('netstat -tlnp 2>/dev/null | grep 987')
    out = stdout.read().decode('utf-8', errors='ignore')
    print('Ports:', out)
    
    stdin, stdout, stderr = client.exec_command('tail -15 /tmp/server.log')
    out = stdout.read().decode('utf-8', errors='ignore')
    print('Log:', out[:500])
    
finally:
    client.close()

print("Done!")
