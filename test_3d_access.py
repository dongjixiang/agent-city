import paramiko
import urllib.request

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('47.77.238.56', 22, 'root', 'Kuqi@1234', timeout=10)

# Check firewall status
stdin, stdout, stderr = client.exec_command('iptables -L -n 2>/dev/null | head -30')
print('iptables:', stdout.read().decode('utf-8', errors='ignore'))

# Check if ports are actually reachable externally
stdin, stdout, stderr = client.exec_command('ss -tlnp 2>/dev/null')
print('ss:', stdout.read().decode('utf-8', errors='ignore'))

# Check 3d log for errors
stdin, stdout, stderr = client.exec_command('cat /tmp/3d.log 2>/dev/null')
print('3d log:', stdout.read().decode('utf-8', errors='ignore'))

client.close()
