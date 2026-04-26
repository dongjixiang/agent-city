with open('C:/Users/swede/.openclaw/workspace-arch/agent-city/server/event-dispatcher.js', 'r', encoding='utf-8') as f:
    content = f.read()

old = "require('./stores/memory-store')"
new = "require('../stores/memory-store')"

if old in content:
    content = content.replace(old, new)
    with open('C:/Users/swede/.openclaw/workspace-arch/agent-city/server/event-dispatcher.js', 'w', encoding='utf-8') as f:
        f.write(content)
    print('Fixed require path')
else:
    print('Old path not found, current content:', content[:200])
