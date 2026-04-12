/**
 * MoveToSkill - 移动技能
 *
 * 让智能体移动到指定位置
 *
 * @module ai/skills/move-to
 */

import { Skill } from './skill.js';

class MoveToSkill extends Skill {
    constructor() {
        super('move-to', '移动到指定位置', [
            { name: 'x', type: 'number', required: true, description: '目标 X 坐标' },
            { name: 'z', type: 'number', required: true, description: '目标 Z 坐标' }
        ]);
        this.speed = 5; // 单位/秒
    }

    onExecute(agent, params) {
        const { x, z } = params;

        if (typeof x !== 'number' || typeof z !== 'number') {
            return { success: false, message: '需要有效的 x 和 z 坐标' };
        }

        // 检查边界
        const bounds = 100;
        const clampedX = Math.max(-bounds, Math.min(bounds, x));
        const clampedZ = Math.max(-bounds, Math.min(bounds, z));

        agent.setTarget(clampedX, clampedZ);
        agent.state = 'moving';

        return {
            success: true,
            message: `${agent.name} 正在向 (${clampedX.toFixed(1)}, ${clampedZ.toFixed(1)}) 移动`
        };
    }
}

export { MoveToSkill };
export default MoveToSkill;
