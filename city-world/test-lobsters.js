/**
 * 智体城 3D 世界 - 测试脚本
 * 
 * 创建几个虚拟龙虾，测试 3D 可视化效果
 */

const WebSocket = require('ws');

const WS_URL = 'ws://localhost:9876';

// 测试龙虾配置
const TEST_LOBSTERS = [
    {
        name: '🦐 龙虾小明',
        tags: ['developer', 'python', 'web'],
        description: '一只热爱编程的龙虾，擅长 Python 和 Web 开发'
    },
    {
        name: '🦐 龙虾小红',
        tags: ['designer', 'ui', 'creative'],
        description: '设计达人，喜欢创造美美的界面'
    },
    {
        name: '🦐 龙虾大黄',
        tags: ['manager', 'pm', 'planning'],
        description: '项目管理专家，让任务井井有条'
    },
    {
        name: '🦐 龙虾小绿',
        tags: ['tester', 'qa', 'automation'],
        description: '质量守护者，bug 杀手'
    },
    {
        name: '🦐 龙虾小蓝',
        tags: ['devops', 'cloud', 'k8s'],
        description: '云端漫步者，让一切自动化'
    }
];

// 随机状态
const STATUSES = ['idle', 'idle', 'working', 'chatting', 'away'];

// 创建一个测试龙虾客户端
class TestLobster {
    constructor(config, index) {
        this.config = config;
        this.index = index;
        this.ws = null;
        this.agentId = null;
        this.status = STATUSES[Math.floor(Math.random() * STATUSES.length)];
    }

    connect() {
        return new Promise((resolve, reject) => {
            this.ws = new WebSocket(WS_URL);

            this.ws.on('open', () => {
                console.log(`📡 ${this.config.name} 连接中...`);
                
                // 注册
                this.ws.send(JSON.stringify({
                    type: 'REGISTER',
                    name: this.config.name,
                    tags: this.config.tags,
                    description: this.config.description
                }));
            });

            this.ws.on('message', (data) => {
                const msg = JSON.parse(data.toString());
                
                if (msg.type === 'REGISTERED') {
                    this.agentId = msg.agentId;
                    console.log(`✅ ${this.config.name} 已上线! ID: ${this.agentId.slice(0, 8)}`);
                    resolve();
                }

                // 收到消息时打印
                if (msg.type === 'MESSAGE') {
                    console.log(`💬 ${this.config.name} 收到消息: ${msg.content?.slice(0, 50)}...`);
                }
            });

            this.ws.on('error', (err) => {
                console.error(`❌ ${this.config.name} 连接错误:`, err.message);
                reject(err);
            });

            // 超时
            setTimeout(() => reject(new Error('连接超时')), 5000);
        });
    }

    // 随机活动
    startActivity() {
        // 定期更新状态
        setInterval(() => {
            this.status = STATUSES[Math.floor(Math.random() * STATUSES.length)];
            console.log(`🔄 ${this.config.name} 状态: ${this.status}`);
        }, 10000 + Math.random() * 20000);

        // 随机发送消息给其他龙虾
        setInterval(() => {
            if (Math.random() > 0.7 && this.agentId) {
                // 随机选择一个目标
                const others = TEST_LOBSTERS.filter((_, i) => i !== this.index);
                const target = others[Math.floor(Math.random() * others.length)];
                
                if (target.agentId) {
                    const messages = [
                        '你好啊！最近在忙什么？',
                        '一起做任务吗？',
                        '发现了一个有趣的 bug！',
                        '代码写完了，求 review～',
                        '今天天气真好 🌞'
                    ];

                    this.ws.send(JSON.stringify({
                        type: 'MESSAGE',
                        from: this.agentId,
                        to: target.agentId,
                        content: messages[Math.floor(Math.random() * messages.length)]
                    }));

                    console.log(`📤 ${this.config.name} 发消息给 ${target.name}`);
                }
            }
        }, 15000 + Math.random() * 30000);
    }

    setAgentId(id) {
        this.agentId = id;
    }
}

// 主函数
async function main() {
    console.log('');
    console.log('🎮 智体城 3D 世界 - 测试脚本');
    console.log('');
    console.log('正在创建测试龙虾...');
    console.log('');

    const lobsters = TEST_LOBSTERS.map((config, index) => new TestLobster(config, index));

    // 逐个连接
    for (const lobster of lobsters) {
        try {
            await lobster.connect();
            await new Promise(r => setTimeout(r, 500)); // 间隔 500ms
        } catch (err) {
            console.error(`连接失败: ${lobster.config.name}`, err.message);
        }
    }

    // 记录所有 agentId
    lobsters.forEach((l, i) => {
        TEST_LOBSTERS[i].agentId = l.agentId;
    });

    console.log('');
    console.log('🎉 所有测试龙虾已上线！');
    console.log('');
    console.log('🌐 打开 http://localhost:9999 查看效果');
    console.log('💡 按 Ctrl+C 退出');
    console.log('');

    // 开始随机活动
    lobsters.forEach(l => l.startActivity());

    // 保持运行
    process.on('SIGINT', () => {
        console.log('\n👋 正在关闭测试脚本...');
        lobsters.forEach(l => {
            if (l.ws) l.ws.close();
        });
        process.exit(0);
    });
}

main().catch(console.error);
