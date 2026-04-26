import urllib.request

try:
    req = urllib.request.urlopen('http://47.77.238.56:9998/main.js', timeout=5)
    content = req.read().decode('utf-8', errors='ignore')
    print('showSpeechBubble count:', content.count('showSpeechBubble'))
    print('WS_AGENT_MOVED count:', content.count('WS_AGENT_MOVED'))
    print('handleAgentEvent count:', content.count('handleAgentEvent'))
except Exception as e:
    print('Failed:', e)
