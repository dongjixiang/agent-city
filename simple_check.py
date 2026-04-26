import paramiko
import socket

socket.setdefaulttimeout(10)

host = '47.77.238.56'
port = 22
username = 'root'
password = 'Kuqi@1234'

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    client.connect(host, port=port, username=username, password=password, timeout=10)
    print("Connected!")
    
    # Quick check REST handler
    stdin, stdout, stderr = client.exec_command('grep -c "handleRest" /root/agent-city/server/handlers/ws-handler.js', timeout=5)
    print(f"handleRest count: {stdout.read().decode().strip()}")
    
    client.close()
    print("Done!")
except Exception as e:
    print(f"Error: {e}")
