/**
 * WorldDataClient - 从服务器获取世界数据
 * 
 * 用于3D客户端从服务器加载世界数据进行渲染
 * 
 * @module client/core/world-data-client
 */

const WORLD_API_BASE = 'http://127.0.0.1:9877';

class WorldDataClient {
    constructor() {
        this.terrain = null;
        this.buildings = [];
        this.decorations = [];
        this.roads = [];
        this.bridges = [];
        this.water = [];
        this.landmarks = {};
        this.spawnPoints = [];
        this.isLoaded = false;
    }

    /**
     * 从服务器加载世界数据
     */
    async load() {
        try {
            console.log('[WorldDataClient] Loading world data from server...');
            
            const [terrainRes, buildingsRes, summaryRes] = await Promise.all([
                fetch(`${WORLD_API_BASE}/api/world/terrain`),
                fetch(`${WORLD_API_BASE}/api/world/buildings`),
                fetch(`${WORLD_API_BASE}/api/world/summary`)
            ]);

            if (terrainRes.ok) {
                const terrainData = await terrainRes.json();
                if (terrainData.success) {
                    this.terrain = terrainData.data;
                }
            }

            if (buildingsRes.ok) {
                const buildingsData = await buildingsRes.json();
                if (buildingsData.success) {
                    this.buildings = buildingsData.data.buildings || [];
                }
            }

            console.log('[WorldDataClient] Loaded:', {
                terrain: !!this.terrain,
                buildings: this.buildings.length
            });

            this.isLoaded = true;
            return true;
        } catch (error) {
            console.warn('[WorldDataClient] Failed to load from server, using fallback:', error.message);
            return false;
        }
    }

    /**
     * 获取地形数据
     */
    getTerrain() {
        return this.terrain;
    }

    /**
     * 获取建筑数据
     */
    getBuildings() {
        return this.buildings;
    }

    /**
     * 获取道路数据
     */
    getRoads() {
        return this.roads;
    }

    /**
     * 获取桥梁数据
     */
    getBridges() {
        return this.bridges;
    }

    /**
     * 获取地标
     */
    getLandmarks() {
        return this.landmarks;
    }

    /**
     * 获取生成点
     */
    getSpawnPoints() {
        return this.spawnPoints;
    }

    /**
     * 检查服务器是否可用
     */
    async checkServer() {
        try {
            const res = await fetch(`${WORLD_API_BASE}/api/world/state`, { 
                method: 'GET',
                timeout: 3000 
            });
            return res.ok;
        } catch {
            return false;
        }
    }
}

// 全局单例
const worldDataClient = new WorldDataClient();

export { WorldDataClient, worldDataClient };
