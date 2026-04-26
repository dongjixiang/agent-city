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
    
    # Upload ws-handler.js
    local_ws = 'C:/Users/swede/.openclaw/workspace-arch/agent-city/server/handlers/ws-handler.js'
    remote_ws = '/root/agent-city/server/handlers/ws-handler.js'
    print(f'Uploading ws-handler.js...')
    sftp.put(local_ws, remote_ws)
    print(f'  Uploaded to {remote_ws}')
    
    sftp.close()
    
    # Restart server
    import time
    time.sleep(1)
    
    stdin, stdout, stderr = client.exec_command('pkill -f "node server/index.js" 2>/dev/null')
    stdout.read()
    time.sleep(2)
    
    stdin, stdout, stderr = client.exec_command('cd /root/agent-city && nohup node server/index.js > /tmp/server.log 2>&1 &')
    stdout.read()
    time.sleep(3)
    
    stdin, stdout, stderr = client.exec_command('netstat -tlnp 2>/dev/null | grep -E "987|999"')
    out = stdout.read().decode('utf-8', errors='ignore')
    print('Ports:', out)
    
finally:
    client.close()
    
print("Done!")
