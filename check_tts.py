import codecs

with codecs.open('C:/Users/swede/.openclaw/workspace-arch/agent-city/client/main.js', 'r', 'utf-8') as f:
    lines = f.readlines()

# Find the showSpeechBubble function and show its content
in_function = False
brace_count = 0
start_line = 0

for i, line in enumerate(lines):
    if 'showSpeechBubble' in line and 'function' in line:
        in_function = True
        start_line = i + 1
        print(f"Found showSpeechBubble at line {i+1}")
    
    if in_function:
        if '{' in line:
            brace_count += line.count('{')
        if '}' in line:
            brace_count -= line.count('}')
        
        # Print relevant lines (around where TTS should be)
        if 'Creating new speech bubble' in line or 'Before TTS' in line or 'voiceSystem.speak' in line:
            print(f"Line {i+1}: {line.rstrip()}")
        
        # Stop when we've closed the function
        if brace_count == 0 and start_line > 0:
            break

# Check around line 595-650
print("\n\nLines 595-650:")
for i in range(594, 650):
    if i < len(lines):
        print(f"{i+1}: {lines[i].rstrip()}")