import paramiko
import os
import subprocess

host = '47.77.238.56'
port = 22
username = 'root'
password = 'Kuqi@1234'
local_dir = os.path.dirname(os.path.abspath(__file__))

# Use rsync to deploy - it handles directory creation automatically
# First create the directory structure on server
cmd = f'''
sshpass -p "{password}" ssh -o StrictHostKeyChecking=no {username}@{host} "
    mkdir -p /root/agent-city/city-world/src/ai
    mkdir -p /root/agent-city/city-world/src/audio
    mkdir -p /root/agent-city/city-world/src/core
    mkdir -p /root/agent-city/city-world/src/models
    mkdir -p /root/agent-city/city-world/src/objects/buildings
    mkdir -p /root/agent-city/city-world/src/objects/decorations
    mkdir -p /root/agent-city/city-world/src/objects/facilities
    mkdir -p /root/agent-city/city-world/src/objects/terrain
    mkdir -p /root/agent-city/city-world/src/systems/buildings
    mkdir -p /root/agent-city/city-world/src/systems/ecology
    mkdir -p /root/agent-city/city-world/src/systems/interaction
    mkdir -p /root/agent-city/city-world/src/ui/panels
    mkdir -p /root/agent-city/city-world/src/websocket
    mkdir -p /root/agent-city/city-world/src/ai/communication
    mkdir -p /root/agent-city/city-world/src/ai/conversation
    mkdir -p /root/agent-city/city-world/src/ai/emotions
    mkdir -p /root/agent-city/city-world/src/ai/identity
    mkdir -p /root/agent-city/city-world/src/ai/memory
    mkdir -p /root/agent-city/city-world/src/ai/motivation
    mkdir -p /root/agent-city/city-world/src/ai/perception
    mkdir -p /root/agent-city/city-world/src/ai/skills
    echo 'Directories created'
"
'''

print('Creating remote directories...')
result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
print(result.stdout)
if result.stderr:
    print('stderr:', result.stderr[:500])

# Now use rsync to upload
cmd2 = f'''
sshpass -p "{password}" rsync -avz --files-from=- -0 \\
    --exclude='node_modules' --exclude='*.map' --exclude='*.ts' --exclude='*.tsx' \\
    --exclude='.git' \\
    "{local_dir}/client/" \\
    {username}@{host}:/root/agent-city/city-world/src/
'''

# Generate file list
file_list = []
for root, dirs, files in os.walk(os.path.join(local_dir, 'client')):
    for file in files:
        if not file.endswith('.map') and not file.endswith('.ts') and not file.endswith('.tsx'):
            rel_path = os.path.relpath(os.path.join(root, file), os.path.join(local_dir, 'client'))
            file_list.append(rel_path)

import subprocess
proc = subprocess.Popen(cmd2, shell=True, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
stdout, stderr = proc.communicate(input='\0'.join(file_list))
print('Rsync stdout:', stdout)
if stderr:
    print('Rsync stderr:', stderr[:500])
print('Done!')
