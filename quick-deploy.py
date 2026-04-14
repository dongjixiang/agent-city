#!/usr/bin/env python3
"""Quick deploy script using paramiko"""
import paramiko
import os
import glob
import shutil
from stat import S_ISDIR

# Server config
HOST = '47.77.238.56'
PORT = 22
USER = 'root'
PASSWORD = 'Kuqi@1234'
REMOTE_PATH = '/root/agent-city'
LOCAL_PATH = r'C:\Users\swede\.openclaw\workspace-arch\agent-city'

# Files to exclude from sync
EXCLUDE_DIRS = {'node_modules', '.git', '__pycache__', 'logs', 'data'}
EXCLUDE_PATTERNS = {'.log', '.json'}

def should_exclude(path):
    """Check if file should be excluded"""
    parts = path.split(os.sep)
    for part in parts:
        if part in EXCLUDE_DIRS:
            return True
        if any(part.endswith(p) for p in EXCLUDE_PATTERNS):
            return True
    return False

def sync_directory(sftp, local_dir, remote_dir):
    """Sync local directory to remote"""
    for root, dirs, files in os.walk(local_dir):
        # Filter out excluded directories
        dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]
        
        rel_path = os.path.relpath(root, local_dir)
        if rel_path == '.':
            remote_current = remote_dir
        else:
            remote_current = os.path.join(remote_dir, rel_path)
        
        # Create remote directory if needed
        try:
            sftp.stat(remote_current)
        except:
            try:
                sftp.mkdir(remote_current)
                print(f'  Created: {remote_current}')
            except:
                pass
        
        # Upload files
        for file in files:
            if should_exclude(file):
                continue
            local_file = os.path.join(root, file)
            remote_file = os.path.join(remote_current, file)
            
            try:
                sftp.put(local_file, remote_file)
                print(f'  Uploaded: {rel_path}/{file}')
            except Exception as e:
                print(f'  Error uploading {file}: {e}')

def main():
    print('=' * 50)
    print('Agent City Quick Deploy')
    print('=' * 50)
    
    # Connect to server
    print(f'\n[1/3] Connecting to {HOST}...')
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(HOST, port=PORT, username=USER, password=PASSWORD, timeout=10)
        print('  Connected!')
    except Exception as e:
        print(f'  Connection failed: {e}')
        return
    
    # Sync client directory
    print(f'\n[2/3] Syncing client files...')
    try:
        sftp = client.open_sftp()
        client_dir = os.path.join(LOCAL_PATH, 'client')
        remote_client_dir = os.path.join(REMOTE_PATH, 'client')
        
        # Create remote client dir if needed
        try:
            sftp.stat(remote_client_dir)
        except:
            sftp.mkdir(remote_client_dir)
        
        sync_directory(sftp, client_dir, remote_client_dir)
        sftp.close()
        print('  Client sync complete!')
    except Exception as e:
        print(f'  Sync error: {e}')
    
    # Restart server
    print(f'\n[3/3] Restarting server...')
    try:
        # Kill existing node processes
        stdin, stdout, stderr = client.exec_command('pkill -f "node" 2>/dev/null; sleep 1; cd /root/agent-city && nohup node server/index.js > /tmp/server.log 2>&1 &')
        print('  Server restarted!')
        
        # Check if running
        stdin, stdout, stderr = client.exec_command('ps aux | grep node | grep -v grep')
        output = stdout.read().decode()
        if 'node' in output:
            print('  Server is running!')
        else:
            print('  Warning: Server may not be running')
    except Exception as e:
        print(f'  Restart error: {e}')
    
    client.close()
    
    print('\n' + '=' * 50)
    print('Deploy complete!')
    print('=' * 50)

if __name__ == '__main__':
    main()
