import codecs
import re

# Read the file
with codecs.open('C:/Users/swede/.openclaw/workspace-arch/agent-city/city-world/city-world-full.js', 'r', 'utf-8') as f:
    content = f.read()

# Find the pattern
pattern = r'// ============ 龙虾动画 ============'
match = re.search(pattern, content)
if match:
    print(f'Found at position {match.start()}')
    print(f'Context: {repr(content[match.start()-50:match.end()+50])}')
else:
    print('Pattern not found, looking for 龙虾动画')
    if '龙虾动画' in content:
        idx = content.index('龙虾动画')
        print(f'Found 龙虾动画 at {idx}')
        print(f'Context: {repr(content[idx-50:idx+50])}')
    else:
        print('Not found at all')
        # Check what text is actually there around line 3503
        lines = content.split('\n')
        print(f'Lines 3500-3505:')
        for i in range(3499, 3505):
            print(f'{i+1}: {repr(lines[i])}')