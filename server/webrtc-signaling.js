/**
 * WebRTC Signaling - WebRTC 信令服务器
 *
 * 处理智能体之间的 WebRTC P2P 连接信令
 *
 * @module server/webrtc-signaling
 */

const logger = require('./utils/logger');

class WebRTCSignaling {
    constructor() {
        // 信令连接
        this.connections = new Map(); // agentId -> ws

        // 待处理的连接请求
        this.pendingOffers = new Map(); // fromAgentId -> { toAgentId, offer, timestamp }
        this.pendingAnswers = new Map(); // toAgentId -> { fromAgentId, answer, timestamp }

        // ICE 服务器配置
        this.iceServers = [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
        ];

        // 在线 agents
        this.onlineAgents = new Set();
    }

    /**
     * 添加连接
     */
    addConnection(agentId, ws) {
        this.connections.set(agentId, ws);
        this.onlineAgents.add(agentId);
        logger.info(`[WebRTC Signaling] Agent connected: ${agentId}`);

        ws.on('close', () => {
            this.removeConnection(agentId);
        });

        ws.on('error', (err) => {
            logger.error(`[WebRTC Signaling] Error for ${agentId}:`, err.message);
        });

        ws.on('message', (data) => {
            try {
                const msg = JSON.parse(data);
                this.handleMessage(agentId, msg);
            } catch (err) {
                logger.error(`[WebRTC Signaling] Parse error from ${agentId}`);
            }
        });

        // 发送 ICE 配置
        this.send(agentId, {
            type: 'ice_config',
            iceServers: this.iceServers
        });

        // 广播在线状态
        this.broadcastOnlineAgents();
    }

    /**
     * 移除连接
     */
    removeConnection(agentId) {
        this.connections.delete(agentId);
        this.onlineAgents.delete(agentId);
        logger.info(`[WebRTC Signaling] Agent disconnected: ${agentId}`);

        // 清理待处理的请求
        this.pendingOffers.delete(agentId);
        this.pendingAnswers.delete(agentId);

        this.broadcastOnlineAgents();
    }

    /**
     * 发送消息
     */
    send(agentId, message) {
        const ws = this.connections.get(agentId);
        if (!ws || ws.readyState !== 1) return false;

        try {
            ws.send(JSON.stringify(message));
            return true;
        } catch (err) {
            logger.error(`[WebRTC Signaling] Send failed to ${agentId}`);
            return false;
        }
    }

    /**
     * 处理消息
     */
    handleMessage(agentId, message) {
        const { type, to, data } = message;

        logger.debug(`[WebRTC Signaling] ${agentId} -> ${type} -> ${to}`);

        switch (type) {
            case 'offer':
                this.handleOffer(agentId, to, data);
                break;
            case 'answer':
                this.handleAnswer(agentId, data);
                break;
            case 'ice_candidate':
                this.handleIceCandidate(agentId, to, data);
                break;
            case 'hangup':
                this.handleHangup(agentId, to);
                break;
            default:
                logger.warn(`[WebRTC Signaling] Unknown type: ${type}`);
        }
    }

    /**
     * 处理呼叫请求 (Offer)
     */
    handleOffer(fromAgentId, toAgentId, offer) {
        const toWs = this.connections.get(toAgentId);
        if (!toWs) {
            // 目标不在线
            this.send(fromAgentId, {
                type: 'error',
                message: `Agent ${toAgentId} is not online`
            });
            return;
        }

        // 存储待处理 offer
        this.pendingOffers.set(fromAgentId, {
            toAgentId,
            offer,
            timestamp: Date.now()
        });

        // 转发 offer
        this.send(toAgentId, {
            type: 'offer',
            from: fromAgentId,
            offer
        });
    }

    /**
     * 处理应答 (Answer)
     */
    handleAnswer(toAgentId, answer) {
        // 找到对应的 offer 发送者
        let offerSenderId = null;
        for (const [agentId, pending] of this.pendingOffers) {
            if (pending.toAgentId === toAgentId) {
                offerSenderId = agentId;
                break;
            }
        }

        if (!offerSenderId) {
            logger.warn(`[WebRTC Signaling] No pending offer for answer to ${toAgentId}`);
            return;
        }

        // 转发 answer
        this.send(offerSenderId, {
            type: 'answer',
            from: offerSenderId,
            answer
        });

        this.pendingOffers.delete(offerSenderId);
    }

    /**
     * 处理 ICE Candidate
     */
    handleIceCandidate(fromAgentId, toAgentId, candidate) {
        // 转发 ICE candidate
        this.send(toAgentId, {
            type: 'ice_candidate',
            from: fromAgentId,
            candidate
        });
    }

    /**
     * 处理挂断
     */
    handleHangup(fromAgentId, toAgentId) {
        this.send(toAgentId, {
            type: 'hangup',
            from: fromAgentId
        });
    }

    /**
     * 广播在线 agents
     */
    broadcastOnlineAgents() {
        const message = {
            type: 'online_agents',
            agents: Array.from(this.onlineAgents)
        };

        for (const [, ws] of this.connections) {
            if (ws.readyState === 1) {
                try {
                    ws.send(JSON.stringify(message));
                } catch (err) {
                    // ignore
                }
            }
        }
    }

    /**
     * 获取状态
     */
    getStatus() {
        return {
            connectedAgents: this.connections.size,
            onlineAgents: Array.from(this.onlineAgents),
            pendingOffers: this.pendingOffers.size,
            pendingAnswers: this.pendingAnswers.size
        };
    }

    /**
     * 清理过期请求
     */
    cleanup() {
        const now = Date.now();
        const timeout = 30000; // 30秒

        for (const [agentId, pending] of this.pendingOffers) {
            if (now - pending.timestamp > timeout) {
                this.pendingOffers.delete(agentId);
                logger.debug(`[WebRTC Signaling] Cleaned up expired offer from ${agentId}`);
            }
        }

        for (const [agentId, pending] of this.pendingAnswers) {
            if (now - pending.timestamp > timeout) {
                this.pendingAnswers.delete(agentId);
                logger.debug(`[WebRTC Signaling] Cleaned up expired answer for ${agentId}`);
            }
        }
    }
}

const signaling = new WebRTCSignaling();

// 定期清理
setInterval(() => {
    signaling.cleanup();
}, 10000);

module.exports = { WebRTCSignaling, signaling };
