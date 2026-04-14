#!/usr/bin/env python3
"""Simple deploy using paramiko"""
import paramiko
import os

HOST = '47.77.238.56'
PORT = 22
USER = 'root'
PASSWORD = 'Kuqi@1234'
REMOTE_BASE = '/root/agent-city'

def mkdir_p(sftp, path):
    """Create directory recursively"""
    dirs = []
    while path and path != '/':
        dirs.append(path)
        path = os.path.dirname(path)
    dirs.reverse()
    for d in dirs:
        try:
            sftp.stat(d)
        except:
            try:
                sftp.mkdir(d)
                print(f'  Created dir: {d}')
            except:
                pass

def deploy():
    print('Connecting...')
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(HOST, port=PORT, username=USER, password=PASSWORD, timeout=10)
    
    sftp = client.open_sftp()
    
    # Key files to upload
    files = [
        ('client/systems/daynight-system.js', 'client/systems/daynight-system.js'),
        ('client/systems/weather-system.js', 'client/systems/weather-system.js'),
        ('client/systems/world-builder.js', 'client/systems/world-builder.js'),
        ('client/systems/water-system.js', 'client/systems/water-system.js'),
        ('client/systems/ecology/cow.js', 'client/systems/ecology/cow.js'),
        ('client/systems/ecology/dog.js', 'client/systems/ecology/dog.js'),
        ('client/main.js', 'client/main.js'),
        ('client/objects/decorations/bench.js', 'client/objects/decorations/bench.js'),
        ('client/objects/terrain/road.js', 'client/objects/terrain/road.js'),
    ]
    
    for local_path, remote_path in files:
        full_local = os.path.join(r'C:\Users\swede\.openclaw\workspace-arch\agent-city', local_path)
        full_remote = os.path.join(REMOTE_BASE, remote_path)
        
        # Create remote directory if needed
        remote_dir = os.path.dirname(full_remote)
        mkdir_p(sftp, remote_dir)
        
        print(f'Uploading {local_path}...')
        sftp.put(full_local, full_remote)
        print(f'  Done!')
    
    sftp.close()
    client.close()
    print('Deploy complete!')

if __name__ == '__main__':
    deploy()
