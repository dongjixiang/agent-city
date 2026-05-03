const fs = require('fs');

function searchDir(dir, pattern) {
    const files = fs.readdirSync(dir, { withFileTypes: true });
    for (const f of files) {
        const path = dir + '/' + f.name;
        if (f.isDirectory()) {
            if (!f.name.startsWith('.') && f.name !== 'node_modules') {
                searchDir(path, pattern);
            }
        } else if (f.name.endsWith('.js')) {
            const c = fs.readFileSync(path, 'utf8');
            if (c.includes(pattern)) {
                console.log(path);
                const idx = c.indexOf(pattern);
                console.log(c.substring(Math.max(0, idx - 50), idx + 100));
                console.log('---');
            }
        }
    }
}

searchDir('C:/Users/swede/.openclaw/workspace-arch/agent-city/server', 'context is not defined');
searchDir('C:/Users/swede/.openclaw/workspace-arch/agent-city/server/ai', 'context');