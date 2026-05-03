# -*- coding: utf-8 -*-
import codecs

with codecs.open('C:/Users/swede/.openclaw/workspace-arch/agent-city/client/main.js', 'r', 'utf-8') as f:
    lines = f.readlines()

# Line 632 is where we set the speech bubble
# Need to add TTS call right after line 632 (this.speechBubbles.set(agentId, bubble);)
# But BEFORE the return statement at line 637

# Insert TTS after line 632
tts_code = '''        // TTS for agent speech
        if (this.voiceSystem && content) {
          this.voiceSystem.speak(agentId, content);
        }'''

# Line 632 is index 631, insert after it
lines.insert(632, tts_code)

print('Inserted TTS code after line 632')

# Write back
with codecs.open('C:/Users/swede/.openclaw/workspace-arch/agent-city/client/main.js', 'w', 'utf-8') as f:
    f.writelines(lines)

print('File saved')

# Verify
with codecs.open('C:/Users/swede/.openclaw/workspace-arch/agent-city/client/main.js', 'r', 'utf-8') as f:
    content = f.read()
    
if 'TTS for agent speech' in content:
    print('TTS code successfully added')
else:
    print('ERROR: TTS code not found')