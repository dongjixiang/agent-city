import subprocess
import os
import codecs

os.chdir(r'C:\Users\swede\.openclaw\workspace-arch\agent-city')

# Get the index.html from before recent changes
result = subprocess.run(['git', 'show', 'd6e4ac1:client/index.html'], 
                       capture_output=True)

with open(r'C:\Users\swede\.openclaw\workspace-arch\agent-city\old_index.html', 'wb') as f:
    f.write(result.stdout)

print("Saved old index.html")
