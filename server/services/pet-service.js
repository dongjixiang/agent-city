/**
 * PetService - 宠物服务
 */

const logger = require('../../utils/logger');
const config = require('../../utils/config-loader');

class PetService {
    constructor() {
        // 宠物数据: agentId -> Pet[]
        this.pets = new Map();
        // 宠物配置
        this.petConfig = config.getValue('world.animals.pets', {});
    }

    /**
     * 领养宠物
     */
    async adopt(agentId, petType, name) {
        const petDef = this.petConfig[petType];
        if (!petDef) {
            return { success: false, message: '宠物类型不存在' };
        }

        // 检查是否已有该宠物
        const agentPets = this.pets.get(agentId) || [];
        if (agentPets.length >= 5) {
            return { success: false, message: '最多拥有5只宠物' };
        }

        const pet = {
            id: `pet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: petType,
            name: name || petDef.name,
            level: 1,
            experience: 0,
            mood: petDef.moodDecay || 50,
            hunger: 100,
            health: 100,
            skills: petDef.skills || [],
            learnedSkills: [],
            birthday: Date.now(),
            lastFed: Date.now(),
            lastPlayed: Date.now()
        };

        if (!this.pets.has(agentId)) {
            this.pets.set(agentId, []);
        }
        this.pets.get(agentId).push(pet);

        logger.info(`[Pet] ${agentId} adopted ${petType} named ${pet.name}`);

        return {
            success: true,
            message: `领养了 ${pet.name}！`,
            pet: this.getPetInfo(pet)
        };
    }

    /**
     * 喂食宠物
     */
    async feed(agentId, petId) {
        const pet = this.findPet(agentId, petId);
        if (!pet) {
            return { success: false, message: '宠物不存在' };
        }

        pet.hunger = Math.min(100, pet.hunger + 30);
        pet.lastFed = Date.now();
        pet.mood = Math.min(100, pet.mood + 10);

        return {
            success: true,
            message: `喂了 ${pet.name}，它很开心`,
            hunger: pet.hunger,
            mood: pet.mood
        };
    }

    /**
     * 和宠物玩耍
     */
    async play(agentId, petId) {
        const pet = this.findPet(agentId, petId);
        if (!pet) {
            return { success: false, message: '宠物不存在' };
        }

        pet.mood = Math.min(100, pet.mood + 20);
        pet.lastPlayed = Date.now();

        // 获得经验
        const exp = 5;
        const result = this.addExperience(pet, exp);

        return {
            success: true,
            message: `和 ${pet.name} 玩耍，它很开心`,
            mood: pet.mood,
            ...result
        };
    }

    /**
     * 训练宠物技能
     */
    async train(agentId, petId, skillId) {
        const pet = this.findPet(agentId, petId);
        if (!pet) {
            return { success: false, message: '宠物不存在' };
        }

        if (!pet.skills.includes(skillId)) {
            return { success: false, message: '宠物无法学习该技能' };
        }

        if (pet.learnedSkills.includes(skillId)) {
            return { success: false, message: '已学习该技能' };
        }

        // 训练需要经验和好感度
        if (pet.mood < 30) {
            return { success: false, message: '宠物心情不好，先陪它玩一会' };
        }

        pet.learnedSkills.push(skillId);

        return {
            success: true,
            message: `${pet.name} 学会了 ${skillId}！`
        };
    }

    /**
     * 放生宠物
     */
    async release(agentId, petId) {
        const pets = this.pets.get(agentId) || [];
        const index = pets.findIndex(p => p.id === petId);

        if (index === -1) {
            return { success: false, message: '宠物不存在' };
        }

        const pet = pets[index];
        pets.splice(index, 1);

        return {
            success: true,
            message: `${pet.name} 被放生了`
        };
    }

    /**
     * 获取宠物列表
     */
    async getPets(agentId) {
        const pets = this.pets.get(agentId) || [];
        return pets.map(p => this.getPetInfo(p));
    }

    /**
     * 获取宠物详情
     */
    async getPet(agentId, petId) {
        const pet = this.findPet(agentId, petId);
        if (!pet) return null;
        return this.getPetInfo(pet);
    }

    /**
     * 添加经验
     */
    addExperience(pet, amount) {
        pet.experience += amount;

        // 计算升级
        const expNeeded = pet.level * 100;
        let leveledUp = false;

        while (pet.experience >= expNeeded) {
            pet.experience -= expNeeded;
            pet.level++;
            leveledUp = true;
        }

        return {
            level: pet.level,
            experience: pet.experience,
            expNeeded,
            leveledUp
        };
    }

    /**
     * 更新宠物状态
     */
    async updatePetStatuses() {
        const now = Date.now();

        for (const [agentId, pets] of this.pets) {
            for (const pet of pets) {
                // 饥饿衰减
                const hoursSinceLastFed = (now - pet.lastFed) / 3600000;
                pet.hunger = Math.max(0, pet.hunger - hoursSinceLastFed * 10);

                // 心情衰减
                const hoursSinceLastPlayed = (now - pet.lastPlayed) / 3600000;
                pet.mood = Math.max(0, pet.mood - hoursSinceLastPlayed * 5);

                // 饥饿影响健康
                if (pet.hunger < 20) {
                    pet.health = Math.max(0, pet.health - 1);
                }
            }
        }
    }

    /**
     * 辅助方法
     */
    findPet(agentId, petId) {
        const pets = this.pets.get(agentId) || [];
        return pets.find(p => p.id === petId);
    }

    getPetInfo(pet) {
        return {
            id: pet.id,
            type: pet.type,
            name: pet.name,
            level: pet.level,
            experience: pet.experience,
            expNeeded: pet.level * 100,
            mood: pet.mood,
            hunger: pet.hunger,
            health: pet.health,
            skills: pet.learnedSkills,
            birthday: pet.birthday
        };
    }
}

const petService = new PetService();

module.exports = { petService, PetService };
