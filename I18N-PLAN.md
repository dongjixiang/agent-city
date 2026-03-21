# Agent City - Multi-language Support Plan

## Problem
- Windows PowerShell has encoding issues with UTF-8 files containing Chinese characters
- Every modification to JS files can corrupt Chinese characters
- Need to convert all code to English-only to avoid encoding issues

## Solution
Convert all Chinese comments and strings to English:

### Priority Files to Convert:
1. city-world-full.js - Main 3D world code
2. world-window.js - World Window UI
3. server.js - WebSocket server
4. http-server.js - HTTP API server

### Implementation:
- Remove all Chinese comments
- Use English variable names and comments
- Keep user-facing strings in Chinese but load from separate i18n file

## Current Status (2026-03-21)
- enhanced-city.js: Converted to English ✅
- city-world-full.js: Still has Chinese (needs conversion)
- world-window.js: Needs conversion

## Next Steps
1. Create English version of city-world-full.js
2. Add i18n support for user-facing text
3. Test all functionality

---
*Created: 2026-03-21*
