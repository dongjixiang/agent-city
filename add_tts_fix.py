# -*- coding: utf-8 -*-
import sys

with open('C:/Users/swede/.openclaw/workspace-arch/agent-city/client/main.js', 'r', encoding='utf-8', errors='replace') as f:
    lines = f.readlines()

print(f'Total lines: {len(lines)}')

# Find the line with "this.speechBubbles.set(agentId, bubble);"
for i, line in enumerate(lines):
    if 'this.speechBubbles.set(agentId, bubble);' in line:
        print(f'Found at line {i+1}: {line.rstrip()}')
        # Check if TTS is already added after
        if i+1 < len(lines) and 'voiceSystem.speak' in lines[i+1]:
            print('TTS already present after this line')
        else:
            # Insert TTS call after this line
            tts_lines = [
                '        // TTS speak for agent speech\n',
                '        if (this.voiceSystem && content) {\n',
                '            this.voiceSystem.speak(agentId, content);\n',
                '        }\n'
            ]
            for j, tline in enumerate(tts_lines):
                lines.insert(i+1+j, tline)
            print(f'Inserted {len(tts_lines)} TTS lines after line {i+1}')
        break

# Save
with open('C:/Users/swede/.openclaw/workspace-arch/agent-city/client/main.js', 'w', encoding='utf-8') as f:
    f.writelines(lines)

print('File saved')

# Verify
with open('C:/Users/swede/.openclaw/workspace-arch/agent-city/client/main.js', 'r', encoding='utf-8', errors='replace') as f:
    content = f.read()
print(f'verify - voiceSystem.speak count: {content.count("this.voiceSystem.speak")}')