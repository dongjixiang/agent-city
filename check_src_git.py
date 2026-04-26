import paramiko
import sys

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('47.77.238.56', 22, 'root', 'Kuqi@1234', timeout=10)

# Check if city-world/src/ was in git originally
stdin, stdout, stderr = client.exec_command('cd /root/agent-city && git log --oneline --diff-filter=A -- city-world/src/ 2>/dev/null | head -5')
out = stdout.read().decode('utf-8', errors='ignore')
sys.stdout.buffer.write(f'Git log for city-world/src/:\n{out}\n'.encode('utf-8'))

# Check if src/ was ever committed
stdin, stdout, stderr = client.exec_command('cd /root/agent-city && git ls-files city-world/src/ 2>/dev/null | head -5')
out = stdout.read().decode('utf-8', errors='ignore')
sys.stdout.buffer.write(f'Git tracked files in city-world/src/:\n{out}\n'.encode('utf-8'))

# Restore src/ to what it was before my overwrite (from git HEAD or backup)
# First check if there's a backup
stdin, stdout, stderr = client.exec_command('ls /root/agent-city/city-world/src/*.bak 2>/dev/null || echo "no baks"')
out = stdout.read().decode('utf-8', errors='ignore')
sys.stdout.buffer.write(f'Src backups:\n{out}\n'.encode('utf-8'))

client.close()
