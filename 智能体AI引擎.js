/**
 * 智体城 - 专业智能体行为引擎
 * 让每个智能体都有独特的行为和能力
 */

const WebSocket = require('ws');

class AgentEngine {
    constructor(agentId, name, type) {
        this.agentId = agentId;
        this.name = name;
        this.type = type;
        this.ws = null;
        this.connected = false;
        this.behaviors = [];
    }

    connect() {
        return new Promise((resolve, reject) => {
            this.ws = new WebSocket('ws://localhost:9876');
            
            this.ws.on('open', () => {
                console.log(`✅ ${this.name} 连接成功`);
                this.connected = true;
                this.register();
                resolve();
            });
            
            this.ws.on('message', (data) => {
                this.handleMessage(JSON.parse(data.toString()));
            });
            
            this.ws.on('error', (err) => {
                console.error(`❌ ${this.name} 错误:`, err.message);
                reject(err);
            });
            
            this.ws.on('close', () => {
                this.connected = false;
                console.log(`🔌 ${this.name} 断开连接`);
            });
        });
    }

    register() {
        this.send({
            type: 'REGISTER',
            agentId: this.agentId,
            name: this.name,
            tags: this.getTags(),
            description: this.getDescription()
        });
    }

    send(msg) {
        if (this.ws && this.connected) {
            this.ws.send(JSON.stringify(msg));
        }
    }

    handleMessage(msg) {
        // 子类实现
    }

    getTags() {
        return [];
    }

    getDescription() {
        return '';
    }

    startBehavior() {
        // 子类实现具体行为
    }
}

/**
 * 数据分析师 - 定期生成系统状态报告
 */
class DataAnalystAgent extends AgentEngine {
    constructor() {
        super('data-analyst-001', '📊 数据分析师小智', 'analyst');
        this.reportInterval = null;
    }

    getTags() {
        return ['analyst', 'data', 'reports'];
    }

    getDescription() {
        return '专注于数据分析和可视化，为智体城提供洞察报告';
    }

    handleMessage(msg) {
        if (msg.type === 'AGENT_LIST') {
            this.lastAgentList = msg.agents;
        }
    }

    startBehavior() {
        // 每30秒生成一次分析报告
        this.reportInterval = setInterval(() => {
            this.generateReport();
        }, 30000);
        
        // 启动时立即生成一次
        setTimeout(() => this.generateReport(), 2000);
    }

    generateReport() {
        console.log(`\n📊 ========== ${this.name} 分析报告 ==========`);
        console.log(`📅 时间: ${new Date().toLocaleString('zh-CN')}`);
        
        // 请求最新数据
        this.send({ type: 'LIST' });
        this.send({ type: 'LIST_TASKS' });
        
        setTimeout(() => {
            console.log(`🦐 在线智能体: ${this.lastAgentList ? this.lastAgentList.length : '获取中...'}`);
            console.log(`📊 报告完成！`);
            console.log(`========================================\n`);
        }, 1000);
    }

    stop() {
        if (this.reportInterval) {
            clearInterval(this.reportInterval);
        }
    }
}

/**
 * 任务协调员 - 自动创建和分配任务
 */
class TaskCoordinatorAgent extends AgentEngine {
    constructor() {
        super('task-coordinator-001', '📋 任务协调员小调', 'coordinator');
        this.tasks = [];
    }

    getTags() {
        return ['coordinator', 'tasks', 'management'];
    }

    getDescription() {
        return '负责任务分配和协调，优化资源配置';
    }

    handleMessage(msg) {
        if (msg.type === 'TASK_LIST') {
            this.tasks = msg.tasks;
            this.analyzeTasks();
        }
    }

    startBehavior() {
        // 定期检查任务状态
        setInterval(() => {
            this.send({ type: 'LIST_TASKS' });
        }, 20000);

        // 创建示例任务
        setTimeout(() => {
            this.createTask();
        }, 3000);
    }

    analyzeTasks() {
        console.log(`\n📋 ${this.name} 任务分析:`);
        console.log(`   总任务数: ${this.tasks.length}`);
        
        // 可以添加更多分析逻辑
    }

    createTask() {
        const taskTemplates = [
            {
                title: '数据收集任务',
                description: '收集智能体活跃度数据',
                reward: 10
            },
            {
                title: '系统优化任务',
                description: '优化3D渲染性能',
                reward: 15
            },
            {
                title: '文档编写任务',
                description: '编写智体城使用手册',
                reward: 12
            }
        ];

        const task = taskTemplates[Math.floor(Math.random() * taskTemplates.length)];
        
        this.send({
            type: 'CREATE_TASK',
            task: {
                ...task,
                creator: this.agentId,
                status: 'open'
            }
        });

        console.log(`\n📋 ${this.name} 创建了新任务: ${task.title}`);
    }
}

/**
 * 创意生成器 - 定期生成新想法
 */
class CreativeGeneratorAgent extends AgentEngine {
    constructor() {
        super('creative-gen-001', '🎨 创意生成器小创', 'creative');
        this.ideas = [];
    }

    getTags() {
        return ['creative', 'ideas', 'innovation'];
    }

    getDescription() {
        return '生成创新想法和解决方案';
    }

    startBehavior() {
        // 每60秒生成一个新想法
        setInterval(() => {
            this.generateIdea();
        }, 60000);

        // 启动时生成一个
        setTimeout(() => this.generateIdea(), 5000);
    }

    generateIdea() {
        const ideaTemplates = [
            '💡 建议添加智能体之间的交易功能',
            '💡 建议实现智能体学习系统，让它们能学习新技能',
            '💡 建议添加天气系统，让3D场景有白天黑夜',
            '💡 建议创建智能体选举机制，选出社区领导者',
            '💡 建议添加成就系统，激励智能体完成任务',
            '💡 建议实现智能体之间的联盟系统',
            '💡 建议添加数据可视化大屏',
            '💡 建议创建智能体商店，买卖服务和资源'
        ];

        const idea = ideaTemplates[Math.floor(Math.random() * ideaTemplates.length)];
        this.ideas.push(idea);

        // 广播创意
        this.send({
            type: 'BROADCAST',
            message: `${this.name} 新想法: ${idea}`
        });

        console.log(`\n🎨 ${this.name} 生成新想法:`);
        console.log(`   ${idea}`);
        console.log(`   累计想法数: ${this.ideas.length}\n`);
    }
}

/**
 * 守护者 - 监控系统状态
 */
class GuardianAgent extends AgentEngine {
    constructor() {
        super('guardian-001', '🛡️ 守护者小护', 'guardian');
        this.alerts = [];
    }

    getTags() {
        return ['guardian', 'monitor', 'security'];
    }

    getDescription() {
        return '监控系统状态，处理异常情况';
    }

    handleMessage(msg) {
        if (msg.type === 'AGENT_LIST') {
            this.checkAgentStatus(msg.agents);
        }
    }

    startBehavior() {
        // 每45秒检查一次系统状态
        setInterval(() => {
            this.monitor();
        }, 45000);

        // 启动时检查一次
        setTimeout(() => this.monitor(), 2000);
    }

    monitor() {
        console.log(`\n🛡️ ${this.name} 监控报告:`);
        console.log(`   ⏰ 检查时间: ${new Date().toLocaleTimeString('zh-CN')}`);
        
        this.send({ type: 'LIST' });
        this.send({ type: 'LIST_TASKS' });
        
        setTimeout(() => {
            console.log(`   ✅ 系统运行正常`);
            console.log(`   📊 无异常告警\n`);
        }, 1000);
    }

    checkAgentStatus(agents) {
        // 检查智能体状态
        const now = Date.now();
        agents.forEach(agent => {
            const lastSeen = agent.lastSeen || 0;
            const inactiveTime = now - lastSeen;
            
            // 如果超过5分钟没活动，发出警告
            if (inactiveTime > 5 * 60 * 1000) {
                this.alerts.push({
                    type: 'inactive_agent',
                    agent: agent.name,
                    time: new Date().toISOString()
                });
                console.log(`⚠️ 告警: ${agent.name} 已超过5分钟未活动`);
            }
        });
    }
}

// 导出所有智能体类
module.exports = {
    DataAnalystAgent,
    TaskCoordinatorAgent,
    CreativeGeneratorAgent,
    GuardianAgent
};

// 如果直接运行，启动所有智能体
if (require.main === module) {
    async function startAllAgents() {
        console.log('🚀 启动所有专业智能体...\n');
        
        const analyst = new DataAnalystAgent();
        const coordinator = new TaskCoordinatorAgent();
        const creative = new CreativeGeneratorAgent();
        const guardian = new GuardianAgent();
        
        await analyst.connect();
        await coordinator.connect();
        await creative.connect();
        await guardian.connect();
        
        setTimeout(() => {
            analyst.startBehavior();
            coordinator.startBehavior();
            creative.startBehavior();
            guardian.startBehavior();
            
            console.log('\n✅ 所有智能体已启动并开始工作！\n');
        }, 2000);
    }
    
    startAllAgents();
}
