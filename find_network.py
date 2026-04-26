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
    
    # Search for network or connection function
    stdin, stdout, stderr = client.exec_command(
        'grep -n "connectWebSocket\\|connectServer\\|setupConnection\\|initNetwork" /root/agent-city/city-world/city-world-full.js 2>/dev/null | head -20'
    )
    out = stdout.read().decode('utf-8', errors='ignore')
    sys.stdout.buffer.write(f'Network init:\n{out}\n'.encode('utf-8'))
    
    # Search for message type handling (case statement or if-else for message types)
    stdin, stdout, stderr = client.exec_command(
        'grep -n "type.*MESSAGE\\|type.*REGISTER\\|type.*MOVE\\|msg.type\\|message.type" /root/agent-city/city-world/city-world-full.js 2>/dev/null | head -20'
    )
    out = stdout.read().decode('utf-8', errors='ignore')
    sys.stdout.buffer.write(f'Message type handling:\n{out}\n'.encode('utf-8'))
    
    # Get total line count and search middle section
    stdin, stdout, stderr = client.exec_command('wc -l /root/agent-city/city-world/city-world-full.js')
    out = stdout.read().decode('utf-8', errors='ignore')
    sys.stdout.buffer.write(f'Total lines: {out}\n'.encode('utf-8'))
    
finally:
    client.close()
