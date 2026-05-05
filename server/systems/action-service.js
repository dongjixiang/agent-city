/**
 * ActionService - AI动作描述服务
 * 
 * 负责将AI决策动作转换为可读描述
 */

class ActionService {
    /**
     * 根据动作类型生成描述
     */
    getDescription(action, params) {
        switch (action) {
            case 'move_to':
                if (params && params.x !== undefined && params.z !== undefined) {
                    return `移动到 (${params.x.toFixed(1)}, ${params.z.toFixed(1)})`;
                }
                return '移动';
            case 'sendMessage':
            case 'speak':
                return params?.content ? `说: ${params.content}` : '说话';
            case 'broadcast':
                return params?.content ? `广播: ${params.content}` : '广播';
            case 'rest':
                return '休息';
            case 'explore':
                return '探索';
            case 'think':
            case 'thought':
                return params?.content ? `思考: ${params.content}` : '思考';
            case 'stay':
            case 'wait':
                return '原地停留';
            case 'goTo':
            case 'move_to':
                if (params?.target) return `前往 ${params.target}`;
                if (params?.x !== undefined && params?.z !== undefined) {
                    return `前往 (${params.x.toFixed(1)}, ${params.z.toFixed(1)})`;
                }
                return '前往';
            case 'respond':
                return params?.content ? `回复: ${params.content}` : '回复';
            case 'skip':
                return '跳过';
            default:
                return `执行: ${action}`;
        }
    }
}

module.exports = new ActionService();
