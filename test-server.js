/**
 * Quick Server Test - 快速服务器测试
 *
 * 测试服务器是否能正常启动和响应
 */

const http = require('http');
const WebSocket = require('ws');

const BASE_URL = process.env.TEST_URL || 'http://localhost:9877';
const WS_URL = process.env.TEST_WS || 'ws://localhost:9876';

let testsPassed = 0;
let testsFailed = 0;

async function httpRequest(path, options = {}) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, BASE_URL);
        const reqOptions = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname,
            method: options.method || 'GET',
            headers: options.headers || {}
        };

        const req = http.request(reqOptions, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, data: JSON.parse(data) });
                } catch {
                    resolve({ status: res.statusCode, data });
                }
            });
        });

        req.on('error', reject);
        req.setTimeout(5000, () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });

        if (options.body) {
            req.write(JSON.stringify(options.body));
        }
        req.end();
    });
}

async function test(name, fn) {
    process.stdout.write(`Testing: ${name}... `);
    try {
        await fn();
        console.log('✓');
        testsPassed++;
    } catch (err) {
        console.log(`✗ (${err.message})`);
        testsFailed++;
    }
}

async function run() {
    console.log('===========================================');
    console.log('  Agent City Server Quick Test');
    console.log('===========================================\n');

    // HTTP Tests
    console.log('--- HTTP Tests ---');

    await test('GET /api/health', async () => {
        const res = await httpRequest('/api/health');
        if (res.status !== 200) throw new Error(`Status ${res.status}`);
    });

    await test('GET /api/agents', async () => {
        const res = await httpRequest('/api/agents');
        if (res.status !== 200) throw new Error(`Status ${res.status}`);
    });

    await test('GET /api/world/time', async () => {
        const res = await httpRequest('/api/world/time');
        if (res.status !== 200) throw new Error(`Status ${res.status}`);
    });

    await test('POST /api/agents (create)', async () => {
        const res = await httpRequest('/api/agents', {
            method: 'POST',
            body: {
                name: 'TestAgent_' + Date.now(),
                type: 'lobster'
            }
        });
        if (res.status !== 200 && res.status !== 201) throw new Error(`Status ${res.status}`);
    });

    // WebSocket Tests
    console.log('\n--- WebSocket Tests ---');

    await test('WebSocket connect', async () => {
        await new Promise((resolve, reject) => {
            const ws = new WebSocket(WS_URL + '?agentId=test_client');

            ws.on('open', () => {
                ws.close();
                resolve();
            });

            ws.on('error', (err) => {
                reject(err);
            });

            setTimeout(() => {
                ws.close();
                reject(new Error('Connection timeout'));
            }, 5000);
        });
    });

    await test('WebSocket PING', async () => {
        await new Promise((resolve, reject) => {
            const ws = new WebSocket(WS_URL + '?agentId=test_client');

            ws.on('open', () => {
                ws.send(JSON.stringify({ type: 'PING', timestamp: Date.now() }));
            });

            ws.on('message', (data) => {
                try {
                    const msg = JSON.parse(data);
                    if (msg.type === 'PONG') {
                        ws.close();
                        resolve();
                    }
                } catch {
                    // ignore
                }
            });

            ws.on('error', (err) => {
                reject(err);
            });

            setTimeout(() => {
                ws.close();
                reject(new Error('PING timeout'));
            }, 5000);
        });
    });

    // Summary
    console.log('\n===========================================');
    console.log(` Results: ${testsPassed} passed, ${testsFailed} failed`);
    console.log('===========================================\n');

    process.exit(testsFailed > 0 ? 1 : 0);
}

run().catch(err => {
    console.error('Test error:', err);
    process.exit(1);
});
