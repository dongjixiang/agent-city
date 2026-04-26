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
    
    # Pull latest
    stdin, stdout, stderr = client.exec_command('cd /root/agent-city && git pull')
    print(stdout.read().decode())
    
    # Kill serve-3d.js
    stdin, stdout, stderr = client.exec_command('pkill -f "node serve-3d.js" 2>/dev/null; sleep 1')
    stdout.read()
    
    # Start serve-3d.js
    stdin, stdout, stderr = client.exec_command(
        'cd /root/agent-city && nohup node serve-3d.js > /tmp/serve-3d.log 2>&1 &'
    )
    stdout.read()
    
    time.sleep(2)
    
    # Check ports
    stdin, stdout, stderr = client.exec_command('netstat -tlnp | grep -E "9999|9876|9877"')
    print("\n=== Ports ===")
    print(stdout.read().decode())
    
    # Check log
    stdin, stdout, stderr = client.exec_command('tail -5 /tmp/serve-3d.log')
    print("\n=== serve-3d.log ===")
    print(stdout.read().decode())
    
finally:
    client.close()
