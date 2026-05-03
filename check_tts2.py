# -*- coding: utf-8 -*-
import codecs

with codecs.open('C:/Users/swede/.openclaw/workspace-arch/agent-city/client/main.js', 'r', 'utf-8') as f:
    content = f.read()

# Find TTS
if 'TTS' in content:
    idx = content.index('TTS')
    print(f'TTS found at position {idx}')
    print(content[idx-50:idx+150])
else:
    print('TTS not found in file')
    
# Find speechBubbles.set
if 'speechBubbles.set' in content:
    idx = content.index('speechBubbles.set')
    print(f'\nspeechBubbles.set found at position {idx}')
    print(content[idx:idx+200])
else:
    print('\nspeechBubbles.set not found')

# Count lines
lines = content.split('\n')
print(f'\nTotal lines: {len(lines)}')

# Check around line 630
print('\nLines 628-638:')
for i in range(627, 638):
    if i < len(lines):
        print(f'{i+1}: {lines[i]}')