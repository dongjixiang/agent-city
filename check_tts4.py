# -*- coding: utf-8 -*-
import codecs

with codecs.open('C:/Users/swede/.openclaw/workspace-arch/agent-city/client/main.js', 'r', 'utf-8') as f:
    lines = f.readlines()

print('Lines 625-645:')
for i in range(624, 645):
    if i < len(lines):
        print(f'{i+1}: {repr(lines[i])}')