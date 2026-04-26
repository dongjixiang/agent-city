import paramiko
import sys

host = '47.77.238.56'
port = 22
username = 'root'
password = 'Kuqi@1234'

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    client.connect(host, port=port, username=username, password=password, timeout=10)
    
    # Search for connection to server URL (9876 or server address)
    stdin, stdout, stderr = client.exec_command(
        'grep -n "9876\\|ws://\\|WebSocket(" /root/agent-city/city-world/city-world-full.js 2>/dev/null | head -20'
    )
    out = stdout.read().decode('utf-8', errors='ignore')
    sys.stdout.buffer.write(f'Server connection:\n{out}\n'.encode('utf-8'))
    
    # Get the last 500 lines to see if network code is at the end
    stdin, stdout, stderr = client.exec_command(
        'tail -500 /root/agent-city/city-world/city-world-full.js 2>/dev/null | head -100'
    )
    out = stdout.read().decode('utf-8', errors='ignore')
    sys.stdout.buffer.write(f'Last lines (first 100 of last 500):\n{out}\n'.encode('utf-8'))
    
finally:
    client.close()
