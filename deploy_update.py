import paramiko

host = '47.77.238.56'
port = 22
username = 'root'
password = 'Kuqi@1234'

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(host, port=port, username=username, password=password, timeout=10)

# Pull
stdin, stdout, stderr = client.exec_command('cd /root/agent-city && git pull')
out = stdout.read().decode()
err = stderr.read().decode()
print("Pull:", out, err)

# Kill old serve-3d
stdin, stdout, stderr = client.exec_command('pkill -f "node serve-3d.js" 2>/dev/null; echo done')
print("Kill:", stdout.read().decode())

# Start new serve-3d
stdin, stdout, stderr = client.exec_command('cd /root/agent-city && nohup node serve-3d.js > /tmp/serve-3d.log 2>&1 &')
print("Start exit:", stdout.channel.recv_exit_status())

client.close()
print("Done!")
