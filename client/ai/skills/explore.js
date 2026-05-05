/**
 * ExploreSkill - 探索技能
 *
 * 随机探索智体城
 *
 * @module ai/skills/explore
 */

import { Skill } from './skill.js';

class ExploreSkill extends Skill {
    constructor() {
        super('explore', '随机探索智体城', [
            { name: 'range', type: 'number', required: false, default: 50, description: '探索范围' }
        ]);
    }

    onExecute(agent, params) {
        const range = params.range || 50;

        // 随机目标位置
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * range;
        const x = Math.cos(angle) * distance;
        const z = Math.sin(angle) * distance;

        agent.setTarget(x, z);
        agent.state = 'moving';

        return {
            success: true,
            message: `${agent.name} 开始探索新区域...`
        };
    }
}

export { ExploreSkill };
export default ExploreSkill;
