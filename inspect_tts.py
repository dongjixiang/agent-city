# -*- coding: utf-8 -*-
import sys

with open('C:/Users/swede/.openclaw/workspace-arch/agent-city/client/main.js', 'r', encoding='utf-8', errors='replace') as f:
    lines = f.readlines()

print(f'Total lines: {len(lines)}')

# Find showSpeechBubble function
for i, line in enumerate(lines):
    if 'showSpeechBubble' in line:
        print(f'Line {i+1}: {line.rstrip()}')
        break

# Check lines around 625-640
print('\nLines 625-640:')
for i in range(624, min(640, len(lines))):
    print(f'{i+1}: {repr(lines[i])}')