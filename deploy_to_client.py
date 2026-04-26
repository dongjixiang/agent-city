import paramiko
import os
import subprocess

host = '47.77.238.56'
port = 22
username = 'root'
password = 'Kuqi@1234'
local_dir = os.path.dirname(os.path.abspath(__file__))

# Deploy client/ to /root/agent-city/client/ on server (served by 9998)
client_dir = os.path.join(local_dir, 'client')

# Get list of files to upload
file_list = []
for root, dirs, files in os.walk(client_dir):
    for file in files:
        if file.endswith('.map') or file.endswith('.ts') or file.endswith('.tsx'):
            continue
        local_path = os.path.join(root, file)
        rel_path = os.path.relpath(local_path, client_dir)
        file_list.append(rel_path)

print(f'Uploading {len(file_list)} files to /root/agent-city/client/...')

# Use rsync
cmd = f'''
sshpass -p "{password}" rsync -avz --files-from=- -0 \
    --exclude='node_modules' --exclude='*.map' --exclude='*.ts' --exclude='*.tsx' \
    --exclude='.git' \
    "{client_dir}/" \
    {username}@{host}:/root/agent-city/client/
'''

proc = subprocess.Popen(cmd, shell=True, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
stdout, stderr = proc.communicate(input='\0'.join(file_list))
print('Rsync stdout:', stdout)
if stderr:
    print('Rsync stderr:', stderr[:500])
print('Done!')
