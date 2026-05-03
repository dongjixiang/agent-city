import re

path = 'C:/Users/swede/.openclaw/workspace-arch/agent-city/client/main.js'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

print('File size:', len(content))

# 1. Find and print the agent detail panel section
# Look for think interval select dropdown
idx = content.find("'>60秒</option>")
if idx > 0:
    print('\nFound 60秒 at index:', idx)
    print('Context (500 chars after):')
    print(content[idx:idx+500])
else:
    print('\n60秒 option not found')
    
# Find the end of the select for think interval
idx2 = content.find("</select>", idx if idx > 0 else 0)
if idx2 > 0:
    print('\nFound </select> at:', idx2)
    print('Context (200 chars after select):')
    print(content[idx2:idx2+200])