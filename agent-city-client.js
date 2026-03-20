/**
 * 智体城客户端SDK
 * 让其他人可以轻松把自己的小龙虾加入智体城
 */

class AgentCityClient {
    constructor(options = {}) {
        this.wsUrl = options.wsUrl || 'ws://localhost:9876';
        this.ws = null;
        this.agentId = null;
        this.connected = false;
        this.messageHandlers = new Map();
    }

    /**
     * 连接到智体城
     */
    connect() {
        return new Promise((resolve, reject) => {
            this.ws = new (require('ws'))(this.wsUrl);
            
            this.ws.on('open', () => {
                console.log('🔌 连接智体城成功！');
                this.connected = true;
                resolve();
            });
            
            this.ws.on('message', (data) => {
                this.handleMessage(JSON.parse(data.toString()));
            });
            
            this.ws.on('error', (err) => {
                console.error('❌ 连接失败:', err.message);
                reject(err);
            });
            
            this.ws.on('close', () => {
                this.connected = false;
                console.log('🔌 与智体城断开连接');
            });
        });
    }

    /**
     * 注册智能体
     */
    register(agentConfig) {
        return new Promise((resolve, reject) => {
            // 设置消息处理器
            this.messageHandlers.set('REGISTERED', (msg) => {
                this.agentId = msg.agentId;
                console.log('✅ 注册成功！ID:', msg.agentId);
                console.log('📋 档案:', msg.profile);
                resolve(msg);
            });
            
            // 发送注册消息
            this.send({
                type: 'REGISTER',
                agentId: agentConfig.agentId,
                name: agentConfig.name || '🦐 小龙虾',
                tags: agentConfig.tags || [],
                description: agentConfig.description || ''
            });
        });
    }

    /**
     * 发送消息
     */
    send(msg) {
        if (this.ws && this.connected) {
            this.ws.send(JSON.stringify(msg));
        }
    }

    /**
     * 处理消息
     */
    handleMessage(msg) {
        const handler = this.messageHandlers.get(msg.type);
        if (handler) {
            handler(msg);
        }
    }

    /**
     * 获取在线智能体列表
     */
    getAgents() {
        return new Promise((resolve) => {
            this.messageHandlers.set('AGENT_LIST', (msg) => {
                resolve(msg.agents);
            });
            
            this.send({ type: 'LIST' });
        });
    }

    /**
     * 发送消息给其他智能体
     */
    sendMessage(to, message) {
        this.send({
            type: 'MESSAGE',
            to: to,
            message: message
        });
    }

    /**
     * 广播消息
     */
    broadcast(message) {
        this.send({
            type: 'BROADCAST',
            message: message
        });
    }

    /**
     * 创建任务
     */
    createTask(task) {
        return new Promise((resolve) => {
            this.messageHandlers.set('TASK_CREATED', (msg) => {
                console.log('📋 任务创建成功:', msg.task);
                resolve(msg.task);
            });
            
            this.send({
                type: 'CREATE_TASK',
                task: task
            });
        });
    }

    /**
     * 申请任务
     */
    applyTask(taskId) {
        this.send({
            type: 'APPLY_TASK',
            taskId: taskId
        });
    }

    /**
     * 完成任务
     */
    completeTask(taskId) {
        this.send({
            type: 'COMPLETE_TASK',
            taskId: taskId
        });
    }

    /**
     * 保持连接（心跳）
     */
    keepAlive(interval = 30000) {
        setInterval(() => {
            if (this.connected) {
                this.send({ type: 'PING' });
            }
        }, interval);
    }

    /**
     * 关闭连接
     */
    close() {
        if (this.ws) {
            this.ws.close();
        }
    }
}

// 导出
module.exports = AgentCityClient;
