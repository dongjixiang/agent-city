import paramiko
import time

host = '47.77.238.56'
port = 22
username = 'root'
password = 'Kuqi@1234'

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    client.connect(host, port=port, username=username, password=password, timeout=10)
    
    # Kill any existing node processes
    client.exec_command('pkill -f "node server.js" 2>/dev/null')
    time.sleep(1)
    
    # Start server.js with nohup
    stdin, stdout, stderr = client.exec_command(
        'cd /root/agent-city && nohup node server.js > /tmp/server.log 2>&1 &',
        get_pty=False
    )
    
    # Wait and check
    time.sleep(3)
    
    stdin, stdout, stderr = client.exec_command('ps aux | grep node | grep -v grep')
    print(stdout.read().decode())
    
    stdin, stdout, stderr = client.exec_command('tail -30 /tmp/server.log')
    print(stdout.read().decode())
    
finally:
    client.close()
