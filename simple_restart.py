import paramiko

host = '47.77.238.56'
port = 22
username = 'root'
password = 'Kuqi@1234'

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    client.connect(host, port=port, username=username, password=password, timeout=10)
    
    # Kill 9998
    stdin, stdout, stderr = client.exec_command('pkill -f "http.server 9998"')
    out = stdout.read().decode('utf-8', errors='ignore')
    err = stderr.read().decode('utf-8', errors='ignore')
    print(f'Kill: out={out} err={err[:100] if err else ""}')
    
    # Start 9998
    stdin, stdout, stderr = client.exec_command(
        'cd /root/agent-city/client && nohup python3 -m http.server 9998 > /tmp/3d_9998.log 2>&1 &'
    )
    out = stdout.read().decode('utf-8', errors='ignore')
    print(f'Start: {out}')
    
    import time
    time.sleep(2)
    
    # Check
    stdin, stdout, stderr = client.exec_command('netstat -tlnp 2>/dev/null | grep 999')
    out = stdout.read().decode('utf-8', errors='ignore')
    print(f'Ports: {out}')
    
finally:
    client.close()
