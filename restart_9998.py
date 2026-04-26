import paramiko
import time

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('47.77.238.56', 22, 'root', 'Kuqi@1234', timeout=10)

# Kill 9998
client.exec_command('pkill -f "http.server 9998"')
time.sleep(1)

# Start 9998 with output captured
transport = client.get_transport()
channel = transport.open_session()
channel.exec_command('cd /root/agent-city/client && python3 -m http.server 9998 2>&1 &')
time.sleep(2)

# Check if it's running
stdin, stdout, stderr = client.exec_command('pgrep -f "http.server 9998"')
pid = stdout.read().decode('utf-8', errors='ignore').strip()
print('9998 PID:', pid)

client.close()
