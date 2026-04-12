/**
 * TestClient - 集成测试客户端
 *
 * 用于测试 WebSocket 连接和消息通信
 *
 * @module test-client
 */

const WebSocket = require('ws');

// 测试配置
const TEST_CONFIG = {
    wsUrl: process.env.WS_URL || 'ws://localhost:9876',
    httpUrl: process.env.HTTP_URL || 'http://localhost:9877',
    testAgentId: 'test_agent_' + Date.now(),
    timeout: 10000
};

class TestClient {
    constructor(config = {}) {
        this.config = { ...TEST_CONFIG, ...config };
        this.ws = null;
        this.isConnected = false;
        this.messages = [];
        this.pendingRequests = new Map();
        this.seq = 0;
    }

    /**
     * 连接 WebSocket
     */
    connect() {
        return new Promise((resolve, reject) => {
            console.log(`[Test] Connecting to ${this.config.wsUrl}...`);

            this.ws = new WebSocket(this.config.wsUrl + `?agentId=${this.config.testAgentId}`);

            const timeout = setTimeout(() => {
                reject(new Error('Connection timeout'));
            }, this.config.timeout);

            this.ws.on('open', () => {
                clearTimeout(timeout);
                this.isConnected = true;
                console.log('[Test] Connected!');
                resolve();
            });

            this.ws.on('message', (data) => {
                try {
                    const msg = JSON.parse(data);
                    this.handleMessage(msg);
                } catch (err) {
                    console.error('[Test] Failed to parse message:', err.message);
                }
            });

            this.ws.on('error', (err) => {
                clearTimeout(timeout);
                console.error('[Test] Connection error:', err.message);
                reject(err);
            });

            this.ws.on('close', () => {
                this.isConnected = false;
                console.log('[Test] Disconnected');
            });
        });
    }

    /**
     * 断开连接
     */
    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }

    /**
     * 发送消息
     */
    send(message) {
        return new Promise((resolve, reject) => {
            if (!this.isConnected) {
                reject(new Error('Not connected'));
                return;
            }

            const msgId = `test_${++this.seq}`;
            const payload = { ...message, msgId };

            // 设置超时
            const timeout = setTimeout(() => {
                this.pendingRequests.delete(msgId);
                reject(new Error(`Request timeout: ${msgId}`));
            }, this.config.timeout);

            this.pendingRequests.set(msgId, { resolve, reject, timeout });

            this.ws.send(JSON.stringify(payload));
        });
    }

    /**
     * 处理收到的消息
     */
    handleMessage(msg) {
        console.log('[Test] Received:', JSON.stringify(msg).substring(0, 100));

        // 检查是否有待处理的请求
        if (msg.msgId && this.pendingRequests.has(msg.msgId)) {
            const pending = this.pendingRequests.get(msg.msgId);
            clearTimeout(pending.timeout);
            this.pendingRequests.delete(msg.msgId);

            if (msg.type === 'ERROR') {
                pending.reject(new Error(msg.message));
            } else {
                pending.resolve(msg);
            }
        }

        this.messages.push(msg);
    }

    /**
     * 测试：发送聊天消息
     */
    async testChat(message) {
        return this.send({
            type: 'CHAT',
            content: message,
            from: this.config.testAgentId
        });
    }

    /**
     * 测试：获取状态
     */
    async testGetStatus() {
        return this.send({
            type: 'GET_STATUS'
        });
    }

    /**
     * 测试：移动
     */
    async testMove(x, z) {
        return this.send({
            type: 'MOVE',
            agentId: this.config.testAgentId,
            position: { x, z }
        });
    }

    /**
     * 测试：获取智能体列表
     */
    async testGetAgents() {
        return this.send({
            type: 'GET_AGENTS'
        });
    }

    /**
     * 测试：ping
     */
    async testPing() {
        return this.send({
            type: 'PING',
            timestamp: Date.now()
        });
    }
}

/**
 * 运行测试套件
 */
async function runTests() {
    const client = new TestClient();
    const results = { passed: 0, failed: 0, tests: [] };

    try {
        // 连接
        console.log('\n=== Test: Connection ===');
        try {
            await client.connect();
            results.passed++;
            results.tests.push({ name: 'Connection', passed: true });
        } catch (err) {
            results.failed++;
            results.tests.push({ name: 'Connection', passed: false, error: err.message });
            throw err;
        }

        // Ping
        console.log('\n=== Test: Ping ===');
        try {
            const pong = await client.testPing();
            console.log('[Test] Pong received:', JSON.stringify(pong).substring(0, 100));
            results.passed++;
            results.tests.push({ name: 'Ping', passed: true });
        } catch (err) {
            results.failed++;
            results.tests.push({ name: 'Ping', passed: false, error: err.message });
        }

        // Get Status
        console.log('\n=== Test: Get Status ===');
        try {
            const status = await client.testGetStatus();
            console.log('[Test] Status:', JSON.stringify(status).substring(0, 200));
            results.passed++;
            results.tests.push({ name: 'GetStatus', passed: true });
        } catch (err) {
            results.failed++;
            results.tests.push({ name: 'GetStatus', passed: false, error: err.message });
        }

        // Get Agents
        console.log('\n=== Test: Get Agents ===');
        try {
            const agents = await client.testGetAgents();
            console.log('[Test] Agents:', JSON.stringify(agents).substring(0, 200));
            results.passed++;
            results.tests.push({ name: 'GetAgents', passed: true });
        } catch (err) {
            results.failed++;
            results.tests.push({ name: 'GetAgents', passed: false, error: err.message });
        }

        // Move
        console.log('\n=== Test: Move ===');
        try {
            const move = await client.testMove(10, -5);
            console.log('[Test] Move result:', JSON.stringify(move).substring(0, 100));
            results.passed++;
            results.tests.push({ name: 'Move', passed: true });
        } catch (err) {
            results.failed++;
            results.tests.push({ name: 'Move', passed: false, error: err.message });
        }

        // Chat
        console.log('\n=== Test: Chat ===');
        try {
            const chat = await client.testChat('Hello, Agent City!');
            console.log('[Test] Chat result:', JSON.stringify(chat).substring(0, 100));
            results.passed++;
            results.tests.push({ name: 'Chat', passed: true });
        } catch (err) {
            results.failed++;
            results.tests.push({ name: 'Chat', passed: false, error: err.message });
        }

    } catch (err) {
        console.error('[Test] Test suite error:', err.message);
    } finally {
        client.disconnect();
    }

    // 打印结果
    console.log('\n==============================');
    console.log(' Test Results');
    console.log('==============================');
    console.log(` Passed: ${results.passed}`);
    console.log(` Failed: ${results.failed}`);
    console.log('------------------------------');
    for (const test of results.tests) {
        const status = test.passed ? '✓' : '✗';
        console.log(` ${status} ${test.name}${test.error ? ' - ' + test.error : ''}`);
    }
    console.log('==============================\n');

    return results;
}

// 如果直接运行此文件
if (require.main === module) {
    runTests()
        .then(results => {
            process.exit(results.failed > 0 ? 1 : 0);
        })
        .catch(err => {
            console.error('[Test] Fatal error:', err);
            process.exit(1);
        });
}

module.exports = { TestClient, runTests };
