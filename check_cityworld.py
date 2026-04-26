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
    
    # Check what 3D world is currently serving - which index.html
    stdin, stdout, stderr = client.exec_command('curl -s http://localhost:9999/ 2>/dev/null | head -5')
    out = stdout.read().decode('utf-8', errors='ignore')
    sys.stdout.buffer.write(f'3D world index.html head:\n{out}\n'.encode('utf-8'))
    
    # Check if city-world/src/main.js has the changes I uploaded (should have showSpeechBubble)
    stdin, stdout, stderr = client.exec_command('grep -c "showSpeechBubble" /root/agent-city/city-world/src/main.js 2>/dev/null')
    out = stdout.read().decode('utf-8', errors='ignore').strip()
    sys.stdout.buffer.write(f'ShowSpeechBubble in src/main.js: {out}\n'.encode('utf-8'))
    
    # Check if city-world-full.js has showSpeechBubble
    stdin, stdout, stderr = client.exec_command('grep -c "showSpeechBubble" /root/agent-city/city-world/city-world-full.js 2>/dev/null')
    out = stdout.read().decode('utf-8', errors='ignore').strip()
    sys.stdout.buffer.write(f'ShowSpeechBubble in full.js: {out}\n'.encode('utf-8'))
    
    # Check what city-world-full.js handles for events
    stdin, stdout, stderr = client.exec_command('grep -c "AGENT_MOVED\|AGENT_STATE\|AGENT_SPEAK" /root/agent-city/city-world/city-world-full.js 2>/dev/null')
    out = stdout.read().decode('utf-8', errors='ignore').strip()
    sys.stdout.buffer.write(f'AGENT events in full.js: {out}\n'.encode('utf-8'))
    
finally:
    client.close()
