import re

# Read the file
with open('C:/Users/swede/.openclaw/workspace-arch/agent-city/client/main.js', 'r', encoding='utf-8') as f:
    content = f.read()

print('File size:', len(content))
print('exploreCooldown found:', 'exploreCooldown' in content)
print('cooldown-value found:', 'cooldown-value' in content)

# Find where think interval selector ends
pattern = r"agent\.thinkInterval === 60 \? 'selected' : ''\) \+ '>60秒<' \+ '</select>' \+ '</div>'"
match = re.search(pattern, content)
if match:
    print('Found think interval selector ending at:', match.start())
else:
    print('Pattern not found, searching alternative...')
    # Try simpler search
    if "'>60秒</option>" in content:
        print("Found 60秒 option")
    if '</select>' in content:
        print("Found select end")