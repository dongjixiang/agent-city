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
    sftp = client.open_sftp()
    
    # Check if there are backup files for src/
    stdin, stdout, stderr = client.exec_command('ls /root/agent-city/city-world/src/ 2>/dev/null')
    out = stdout.read().decode('utf-8', errors='ignore')
    sys.stdout.buffer.write(f'Src contents: {out}\n'.encode('utf-8'))
    
    # Check if there's a backup anywhere
    stdin, stdout, stderr = client.exec_command('find /root/agent-city -name "connection.js.bak" -o -name "main.js.bak" 2>/dev/null | head -5')
    out = stdout.read().decode('utf-8', errors='ignore')
    sys.stdout.buffer.write(f'Backups: {out}\n'.encode('utf-8'))
    
    # Check the size of city-world-full.js
    stdin, stdout, stderr = client.exec_command('wc -l /root/agent-city/city-world/city-world-full.js 2>/dev/null')
    out = stdout.read().decode('utf-8', errors='ignore')
    sys.stdout.buffer.write(f'city-world-full.js lines: {out}\n'.encode('utf-8'))
    
    # Search for the relevant sections in city-world-full.js
    # Look for the Events object in connection.js section
    stdin, stdout, stderr = client.exec_command('grep -n "WS_AGENT_CONNECTED\|WS_POSITION_UPDATE" /root/agent-city/city-world/city-world-full.js 2>/dev/null | head -5')
    out = stdout.read().decode('utf-8', errors='ignore')
    sys.stdout.buffer.write(f'Events in full.js: {out}\n'.encode('utf-8'))
    
    # Look for showSpeechBubble
    stdin, stdout, stderr = client.exec_command('grep -n "showSpeechBubble\|showThoughtBubble" /root/agent-city/city-world/city-world-full.js 2>/dev/null | head -5')
    out = stdout.read().decode('utf-8', errors='ignore')
    sys.stdout.buffer.write(f'Speech functions: {out}\n'.encode('utf-8'))
    
    sftp.close()
    
finally:
    client.close()
