/**
 * Integration Tests - 集成测试
 *
 * 测试前后端集成的关键功能
 */

const http = require('http');

// 测试配置
const HTTP_URL = 'http://localhost:9877';
const WS_URL = 'ws://localhost:9876';

// HTTP 请求助手
function httpRequest(path, method = 'GET', data = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, HTTP_URL);
        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname,
            method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, data: JSON.parse(body) });
                } catch {
                    resolve({ status: res.statusCode, data: body });
                }
            });
        });

        req.on('error', reject);
        req.setTimeout(5000, () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });

        if (data) {
            req.write(JSON.stringify(data));
        }
        req.end();
    });
}

// 测试用例
const tests = [
    {
        name: 'HTTP - GET /api/health',
        fn: async () => {
            const res = await httpRequest('/api/health');
            if (res.status !== 200) throw new Error(`Status: ${res.status}`);
            return res.data;
        }
    },
    {
        name: 'HTTP - GET /api/agents',
        fn: async () => {
            const res = await httpRequest('/api/agents');
            if (res.status !== 200) throw new Error(`Status: ${res.status}`);
            return res.data;
        }
    },
    {
        name: 'HTTP - GET /api/world/state',
        fn: async () => {
            const res = await httpRequest('/api/world/state');
            if (res.status !== 200) throw new Error(`Status: ${res.status}`);
            return res.data;
        }
    },
    {
        name: 'HTTP - POST /api/agents (create)',
        fn: async () => {
            const agentData = {
                name: 'TestAgent_' + Date.now(),
                type: 'test'
            };
            const res = await httpRequest('/api/agents', 'POST', agentData);
            if (res.status !== 200 && res.status !== 201) throw new Error(`Status: ${res.status}`);
            return res.data;
        }
    }
];

// 运行测试
async function runIntegrationTests() {
    console.log('==============================');
    console.log(' Agent City Integration Tests');
    console.log('==============================\n');

    let passed = 0;
    let failed = 0;

    for (const test of tests) {
        process.stdout.write(`Testing: ${test.name}... `);

        try {
            const result = await test.fn();
            console.log('✓');
            console.log('  Result:', JSON.stringify(result).substring(0, 100));
            passed++;
        } catch (err) {
            console.log('✗');
            console.log('  Error:', err.message);
            failed++;
        }

        console.log();
    }

    console.log('==============================');
    console.log(` Results: ${passed} passed, ${failed} failed`);
    console.log('==============================\n');

    return { passed, failed };
}

// WebSocket 简单测试
async function testWebSocket() {
    console.log('\nWebSocket Test (manual):');
    console.log('  Connect to: ws://localhost:9876?agentId=test');
    console.log('  Send: { "type": "PING" }');
    console.log('  Expected: { "type": "PONG" }');
}

runIntegrationTests()
    .then(async (results) => {
        await testWebSocket();
        process.exit(results.failed > 0 ? 1 : 0);
    })
    .catch(err => {
        console.error('Test error:', err);
        process.exit(1);
    });
