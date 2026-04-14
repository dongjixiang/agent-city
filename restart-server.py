#!/usr/bin/env python3
import paramiko
import time

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('47.77.238.56', username='root', password='Kuqi@1234', timeout=10)

# Kill any existing node processes
print('Killing existing node processes...')
s,o,e = c.exec_command('pkill -9 -f "node.*index" 2>/dev/null; sleep 1')
time.sleep(1)

# Start node server
print('Starting node server...')
s,o,e = c.exec_command('cd /root/agent-city && nohup node server/index.js > /tmp/server.log 2>&1 &')
time.sleep(3)

# Check if running
print('Checking status...')
s,o,e = c.exec_command('ps aux | grep "node.*index" | grep -v grep')
output = o.read().decode()
print('Node processes:', output or 'None')

# Check ports
s,o,e = c.exec_command('ss -tlnp 2>/dev/null | grep -E "987[0-9]"')
output = o.read().decode()
print('Server ports:', output or 'None found')

# Check server log
s,o,e = c.exec_command('tail -20 /tmp/server.log 2>/dev/null')
output = o.read().decode()
print('Server log:', output or 'No log')

c.close()
print('Done!')
