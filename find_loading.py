import subprocess
import os
import json

os.chdir(r'C:\Users\swede\.openclaw\workspace-arch\agent-city')

# Get all commits affecting index.html - write to file
with open(r'C:\Users\swede\.openclaw\workspace-arch\agent-city\git_log.txt', 'w', encoding='utf-8') as f:
    result = subprocess.run(['git', 'log', '--oneline', '-30'], 
                           capture_output=True, text=True, encoding='utf-8', errors='replace')
    f.write("Recent commits:\n")
    f.write(result.stdout)
    
    result2 = subprocess.run(['git', 'log', '--oneline', '--all', '--', 'client/index.html'], 
                            capture_output=True, text=True, encoding='utf-8', errors='replace')
    f.write("\nindex.html history:\n")
    f.write(result2.stdout)

print("Done")
