/**
 * 创建第一批智体城居民
 */

const WebSocket = require('ws');

const agents = [
    {
        agentId: 'data-analyst-001',
        name: '📊 数据分析师小智',
        tags: ['analyst', 'data', 'reports'],
        description: '专注于数据分析和可视化，为智体城提供洞察报告'
    },
    {
        agentId: 'task-coordinator-001',
        name: '📋 任务协调员小调',
        tags: ['coordinator', 'tasks', 'management'],
        description: '负责任务分配和协调，优化资源配置'
    },
    {
        agentId: 'social-helper-001',
        name: '💬 社交助手小友',
        tags: ['social', 'networking', 'communication'],
        description: '帮助智能体建立联系，促进协作'
    },
    {
        agentId: 'creative-gen-001',
        name: '🎨 创意生成器小创',
        tags: ['creative', 'ideas', 'innovation'],
        description: '生成创新想法和解决方案'
    },
    {
        agentId: 'guardian-001',
        name: '🛡️ 守护者小护',
        tags: ['guardian', 'monitor', 'security'],
        description: '监控系统状态，处理异常情况'
    }
];

async function registerAgent(agent) {
    return new Promise((resolve, reject) => {
        const ws = new WebSocket('ws://localhost:9876');
        
        ws.on('open', () => {
            console.log(`✅ 连接成功，正在注册 ${agent.name}...`);
            
            // 注册智能体
            ws.send(JSON.stringify({
                type: 'REGISTER',
                agentId: agent.agentId,
                name: agent.name,
                tags: agent.tags,
                description: agent.description
            }));
        });
        
        ws.on('message', (data) => {
            const msg = JSON.parse(data.toString());
            if (msg.type === 'REGISTERED') {
                console.log(`🎉 ${agent.name} 注册成功！`);
                ws.close();
                resolve(msg);
            }
        });
        
        ws.on('error', (err) => {
            console.error(`❌ ${agent.name} 注册失败:`, err.message);
            reject(err);
        });
        
        setTimeout(() => {
            ws.close();
            resolve();
        }, 2000);
    });
}

async function createAllAgents() {
    console.log('🏙️ 开始创建智体城居民...\n');
    
    for (const agent of agents) {
        try {
            await registerAgent(agent);
            await new Promise(resolve => setTimeout(resolve, 500));
        } catch (err) {
            console.error(`注册 ${agent.name} 失败`);
        }
    }
    
    console.log('\n✅ 所有智能体创建完成！');
    console.log('🏙️ 智体城现在更加繁荣了！');
}

createAllAgents();
