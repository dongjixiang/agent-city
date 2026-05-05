/**
 * World Builder - Agent City
 * Ocean at south, Urban SE, Suburban NW
 * 建筑数据从服务器 /api/world/buildings 动态获取
 */

import * as THREE from 'three';

import { createBaseGround } from '../objects/terrain/ground.js';
import { createHill } from '../objects/terrain/hill.js';
import { createRiver, createLake, createBeach, createOcean, createOceanBeach } from '../objects/terrain/river.js';
import { createRoad, createPath } from '../objects/terrain/road.js';
import { createSimpleBridge, createLightBridge, createArchBridge, createGlassBridge } from '../objects/terrain/bridge.js';
import { createTree, createPineTree, createPalmTree, createFruitTree } from '../objects/decorations/tree.js';
import { createBench, createLamp } from '../objects/decorations/bench.js';
import { createFarmlandArea } from '../objects/decorations/farm.js';
import { createFlowerField } from '../objects/decorations/flowers.js';
import { LotusLamp } from '../objects/decorations/lotus-lamp.js';
import { createBuilding, createDomeBuilding, createTower, createGlassBuilding, createSuburbanHouse, createUrbanBuilding, createLibraryBuilding, createWorkshopBuilding, createMessageStationBuilding, createArtGalleryBuilding, createArchiveBuilding, createTaskCenterBuilding, createDataCenterBuilding, createReputationTower, createSkillAcademyBuilding, createDiverseUrbanBuilding, createCivicCenterNorth, createCivicCenterWing, createPlazaFountain, createFlagpole, createPlazaTiles } from '../objects/buildings/minecraft-buildings.js';
import { createLabel } from '../objects/buildings/label.js';

// 服务器API地址
const WORLD_API = 'http://127.0.0.1:9877';

// 建筑类型到渲染函数的映射
const BUILDING_RENDERERS = {
    skillAcademy: (data) => createSkillAcademyBuilding(data.position.x, data.position.z),
    library: (data) => createLibraryBuilding(data.position.x, data.position.z),
    workshop: (data) => createWorkshopBuilding(data.position.x, data.position.z),
    messageStation: (data) => createMessageStationBuilding(data.position.x, data.position.z),
    artGallery: (data) => createArtGalleryBuilding(data.position.x, data.position.z),
    archive: (data) => createArchiveBuilding(data.position.x, data.position.z),
    taskCenter: (data) => createTaskCenterBuilding(data.position.x, data.position.z),
    dataCenter: (data) => createDataCenterBuilding(data.position.x, data.position.z),
    reputationTower: (data) => createReputationTower(data.position.x, data.position.z),
    civicCenter: (data) => {
        const facing = data.facing || 'north';
        if (facing === 'east') return createCivicCenterWing(data.position.x, data.position.z, true);
        if (facing === 'west') return createCivicCenterWing(data.position.x, data.position.z, false);
        return createCivicCenterNorth(data.position.x, data.position.z);
    },
    suburbanHouse: (data) => createSuburbanHouse(data.position.x, data.position.z, 0xdeb887),
    diverseUrban: (data) => createDiverseUrbanBuilding(data.position.x, data.position.z),
    fountain: (data) => createPlazaFountain(data.position.x, data.position.z),
    flagpole: (data) => createFlagpole(data.position.x, data.position.z)
};

function rand(min, max) { return min + Math.random() * (max - min); }

export const LANDMARKS = {
    FOUNTAIN: { x: 55, z: 35, name: 'Central Fountain' },
    TOWN_HALL: { x: 50, z: 20, name: 'Town Hall' },
    SKILL_ACADEMY: { x: -45, z: -50, name: 'Skill Academy' },
    LIBRARY: { x: 65, z: 5, name: 'Library' },
    WORKSHOP: { x: 70, z: 25, name: 'Creative Workshop' },
    GALLERY: { x: 75, z: 45, name: 'Art Gallery' },
    ARCHIVE: { x: 60, z: 55, name: 'Archive' },
    MESSAGE_STATION: { x: 55, z: 10, name: 'Message Station' },
    REPUTATION_TOWER: { x: 45, z: 60, name: 'Reputation Tower' },
    DATA_CENTER: { x: 35, z: 50, name: 'Data Center' },
    TASK_CENTER: { x: 65, z: 65, name: 'Task Center' },
};

export class WorldBuilder {
    constructor() {
        this.scene = null;
        this.lotusLamp = null;
        this.serverBuildings = []; // 从服务器加载的建筑数据
    }
    
    init(scene) {
        this.scene = scene;
    }
    
    /**
     * 从服务器加载建筑数据
     */
    async loadFromServer() {
        try {
            console.log('[WorldBuilder] Loading buildings from server...');
            
            const response = await fetch(`${WORLD_API}/api/world/buildings`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const result = await response.json();
            // 服务器返回 result.data 是数组，直接使用
            if (result.success && Array.isArray(result.data)) {
                this.serverBuildings = result.data;
                console.log(`[WorldBuilder] Loaded ${this.serverBuildings.length} buildings from server`);
                return true;
            }
            return false;
        } catch (error) {
            console.warn('[WorldBuilder] Failed to load from server:', error.message);
            return false;
        }
    }
    
    build() {
        console.log('[WorldBuilder] Building world...');
        this.buildTerrain();
        this.buildWater();
        this.buildBridges();
        this.buildRoads();
        this.buildBuildings();
        this.buildParks();
        this.buildLamps();
        this.buildLotusLamp();
        console.log('[WorldBuilder] World built successfully!');
    }
    
    /**
     * 从服务器获取世界数据
     */
    async fetchWorldData() {
        try {
            console.log('[WorldBuilder] Fetching world data from server...');
            const response = await fetch(`${WORLD_API}/api/world/state`);
            if (response.ok) {
                const result = await response.json();
                console.log('[WorldBuilder] World data fetched successfully');
                return result.data;
            }
        } catch (error) {
            console.warn('[WorldBuilder] Failed to fetch world data:', error.message);
        }
        return null;
    }
    
    /**
     * 从服务器获取建筑数据
     */
    async fetchBuildings() {
        try {
            console.log('[WorldBuilder] Fetching buildings from server...');
            const response = await fetch(`${WORLD_API}/api/world/buildings`);
            if (response.ok) {
                const result = await response.json();
                if (result.success && result.data) {
                    console.log(`[WorldBuilder] Fetched ${result.data.length} buildings from server`);
                    return result.data;
                }
            }
        } catch (error) {
            console.warn('[WorldBuilder] Failed to fetch buildings:', error.message);
        }
        return [];
    }
    
    buildTerrain() {
        const ground = createBaseGround();
        this.scene.add(ground);
        
        // North mountains (at north edge, west higher than east)
        // Far west (highest)
        this.scene.add(createHill(-73, -92, 28, 32, 0x3d6a3d));
        this.scene.add(createHill(-53, -90, 24, 28, 0x4a7a4a));
        this.scene.add(createHill(-33, -92, 22, 24, 0x5a8a5a));
        
        // Center-west (high)
        this.scene.add(createHill(-13, -90, 20, 22, 0x5a9a5a));
        this.scene.add(createHill(25, -92, 18, 20, 0x5a8a5a));
        
        // Center (medium)
        this.scene.add(createHill(40, -90, 16, 16, 0x6a9a6a));
        this.scene.add(createHill(60, -88, 14, 12, 0x7a9a7a));
        
        // East (lower)
        this.scene.add(createHill(80, -85, 12, 8, 0x8a9a8a));
        this.scene.add(createHill(90, -82, 10, 6, 0x9a9a8a));
        
        console.log('[WorldBuilder] Terrain built');
    }
    
    buildWater() {
        // ===== OCEAN AT SOUTH =====
        this.scene.add(createOcean(90, 200, 10));
        
        // Ocean beach (north of ocean)
        this.scene.add(createOceanBeach(-60, 87.5, 70, 5));
        
        // ===== NORTH LAKE (center-north) =====
        this.scene.add(createLake({
            x: 10, z: -75, radiusX: 55, radiusZ: 22,
            organicPoints: [
                { angle: 0, factor: 1.0 },
                { angle: 60, factor: 0.95 },
                { angle: 120, factor: 1.05 },
                { angle: 180, factor: 0.9 },
                { angle: 240, factor: 1.0 },
                { angle: 300, factor: 1.05 },
            ],
        }));
        
        
        // ===== RIVERS (flowing from lake toward south/ocean) =====
        // Main river (from lake, flowing south to ocean)
        const mainRiver = [
            { x: -10, z: -55 },
            { x: -10, z: -20 },
            { x: -12, z: 0 },
            { x: -15, z: 20 },
            { x: -18, z: 40 },
            { x: -20, z: 55 },
            { x: -20, z: 91 },
        ];
        this.scene.add(createRiver(mainRiver, 8));
        
       
        console.log('[WorldBuilder] Water system built');
    }
    
    buildBridges() {
        // Bridges over river (river is at x=-10 to x=-20, z=-55 to z=91)
        // E-W roads cross the river at different z positions
        this.scene.add(createSimpleBridge(-20, 5, -5, 5));
        this.scene.add(createSimpleBridge(-22, 35, -7, 35));
        this.scene.add(createSimpleBridge(-25, 65, -10, 65));
        
        // Additional bridges for other E-W roads
        //this.scene.add(createArchBridge(-18, 15, -2, 15));
        //this.scene.add(createSimpleBridge(-20, 50, -5, 50));
        //this.scene.add(createGlassBridge(-22, 75, -7, 75));
        
        console.log('[WorldBuilder] Bridges built');
    }
    
    buildRoads() {
        // ===== SUBURBAN ROADS (NW quadrant, winding) =====
        const suburbanRoads = [
            { x: -50, z: -55 }, { x: -50, z: -45 },
            { x: -40, z: -55 }, { x: -40, z: -45 },
            { x: -55, z: -40 }, { x: -55, z: -30 },
            { x: -45, z: -35 }, { x: -45, z: -25 },
            { x: -55, z: -20 }, { x: -55, z: -10 },
            { x: -45, z: -15 }, { x: -45, z: -5 },
            { x: -55, z: 0 }, { x: -55, z: 10 },
            { x: -45, z: 5 }, { x: -45, z: 15 },
            { x: -50, z: 20 }, { x: -50, z: 30 },
            { x: -40, z: 25 }, { x: -40, z: 35 },
        ];
        createRoad(suburbanRoads, 3).forEach(m => this.scene.add(m));
        
        // ===== URBAN GRID (simple N-S and E-W only, square around plaza) =====
        // Plaza center at (40, 35), plaza area is x=25~55, z=20~50
        // N-S vertical roads at x=15, x=40, x=65
        const nsRoad1 = [
            { x: 15, z: -10 }, { x: 15, z: 35 },
        ];
        createRoad(nsRoad1, 4).forEach(m => this.scene.add(m));
        
        const nsRoad2 = [
            { x: 15, z: 37 }, { x: 15, z: 80 },
        ];
        createRoad(nsRoad2, 4).forEach(m => this.scene.add(m));
        
        const nsRoad3 = [
            { x: 40, z: -10 }, { x: 40, z: 5 },
        ];
        createRoad(nsRoad3, 4).forEach(m => this.scene.add(m));
        
        const nsRoad4 = [
            { x: 40, z: 65 }, { x: 40, z: 80 },
        ];
        createRoad(nsRoad4, 4).forEach(m => this.scene.add(m));
        
        const nsRoad5 = [
            { x: 65, z: -10 }, { x: 65, z: 35 },
        ];
        createRoad(nsRoad5, 4).forEach(m => this.scene.add(m));
        
        const nsRoad6 = [
            { x: 65, z: 37 }, { x: 65, z: 80 },
        ];
        createRoad(nsRoad6, 4).forEach(m => this.scene.add(m));
        
        // E-W horizontal roads at z=5, z=35, z=65
        const ewRoad1 = [
            { x: -10, z: 5 }, { x: 85, z: 5 },
        ];
        createRoad(ewRoad1, 4).forEach(m => this.scene.add(m));
        
        const ewRoad2 = [
            { x: -10, z: 35 }, { x: 17, z: 35 },
        ];
        createRoad(ewRoad2, 4).forEach(m => this.scene.add(m));
        
        const ewRoad3 = [
            { x: 63, z: 35 }, { x: 85, z: 35 },
        ];
        createRoad(ewRoad3, 4).forEach(m => this.scene.add(m));
        
        const ewRoad4 = [
            { x: -10, z: 65 }, { x: 85, z: 65 },
        ];
        createRoad(ewRoad4, 4).forEach(m => this.scene.add(m));
        
        // ===== SCENIC AVENUE ALONG OCEAN BEACH =====
        const scenicAvenue = [
            { x: -40, z: 87.5 }, { x: -20, z: 87.5 }, { x: 0, z: 87.5 },
            { x: 20, z: 87.5 }, { x: 40, z: 87.5 }, { x: 60, z: 87.5 },
            { x: 70, z: 87.5 }, { x: 100, z: 87.5 },
        ];
        createRoad(scenicAvenue, 5).forEach(m => this.scene.add(m));
        
        // Walking paths
        const paths = [
            { x: -30, z: -45 }, { x: -30, z: -35 },
            { x: -40, z: -30 }, { x: -40, z: -20 },
            { x: -35, z: -10 }, { x: -35, z: 0 },
        ];
        paths.forEach(p => {
            this.scene.add(createPath([p, { x: p.x + 5, z: p.z + 12 }], 1.5));
        });
        
        console.log('[WorldBuilder] Roads built');
    }
    
    /**
     * 根据建筑类型获取渲染函数
     */
    getBuildingRenderer(type) {
        const renderers = {
            skillAcademy: (data) => {
                const b = createSkillAcademyBuilding(data.position.x, data.position.z);
                b.add(createLabel(data.name || '技能学院', { height: 22, fontSize: 24, color: '#ffd700' }));
                return b;
            },
            library: (data) => {
                const b = createLibraryBuilding(data.position.x, data.position.z);
                b.add(createLabel(data.name || '图书馆', { height: 18, fontSize: 28, color: '#ffd700' }));
                return b;
            },
            workshop: (data) => {
                const b = createWorkshopBuilding(data.position.x, data.position.z);
                b.add(createLabel(data.name || '工坊', { height: 14, fontSize: 28, color: '#ffd700' }));
                return b;
            },
            messageStation: (data) => {
                const b = createMessageStationBuilding(data.position.x, data.position.z);
                b.add(createLabel(data.name || '消息驿站', { height: 22, fontSize: 24, color: '#ffd700' }));
                return b;
            },
            artGallery: (data) => {
                const b = createArtGalleryBuilding(data.position.x, data.position.z);
                b.add(createLabel(data.name || '艺术展厅', { height: 14, fontSize: 28, color: '#87ceeb' }));
                return b;
            },
            archive: (data) => {
                const b = createArchiveBuilding(data.position.x, data.position.z);
                b.add(createLabel(data.name || '档案馆', { height: 20, fontSize: 28, color: '#ffd700' }));
                return b;
            },
            taskCenter: (data) => {
                const b = createTaskCenterBuilding(data.position.x, data.position.z);
                b.add(createLabel(data.name || '任务中心', { height: 18, fontSize: 28, color: '#ffffff' }));
                return b;
            },
            dataCenter: (data) => {
                const b = createDataCenterBuilding(data.position.x, data.position.z);
                b.add(createLabel(data.name || '数据中心', { height: 16, fontSize: 24, color: '#90EE90' }));
                return b;
            },
            reputationTower: (data) => {
                const b = createReputationTower(data.position.x, data.position.z);
                b.add(createLabel(data.name || '声誉塔', { height: 38, fontSize: 28, color: '#ffd700' }));
                return b;
            },
            civicCenter: (data) => {
                // 根据 facing 方向选择不同的渲染函数
                const facing = data.facing || 'north';
                let b;
                if (facing === 'east') {
                    b = createCivicCenterWing(data.position.x, data.position.z, true);
                } else if (facing === 'west') {
                    b = createCivicCenterWing(data.position.x, data.position.z, false);
                } else {
                    b = createCivicCenterNorth(data.position.x, data.position.z);
                }
                b.add(createLabel(data.name || '市民中心', { height: 14, fontSize: 24, color: '#ffd700' }));
                return b;
            },
            suburbanHouse: (data) => {
                return createSuburbanHouse(data.position.x, data.position.z, 0xdeb887);
            },
            diverseUrban: (data) => {
                return createDiverseUrbanBuilding(data.position.x, data.position.z);
            },
            fountain: (data) => {
                return createPlazaFountain(data.position.x, data.position.z);
            },
            flagpole: (data) => {
                return createFlagpole(data.position.x, data.position.z);
            }
        };
        return renderers[type] || null;
    }
    
    /**
     * 从服务器数据渲染建筑
     */
    renderBuildingsFromServer() {
        if (!this.serverBuildings || this.serverBuildings.length === 0) {
            console.warn('[WorldBuilder] No server buildings data, skipping dynamic render');
            return;
        }
        
        let rendered = 0;
        for (const building of this.serverBuildings) {
            const renderer = this.getBuildingRenderer(building.type);
            if (renderer) {
                const mesh = renderer(building);
                this.scene.add(mesh);
                rendered++;
            } else {
                console.warn(`[WorldBuilder] No renderer for building type: ${building.type}`);
            }
        }
        console.log(`[WorldBuilder] Rendered ${rendered} buildings from server`);
    }
    
    buildBuildings() {
        // 尝试从服务器加载建筑数据
        if (this.serverBuildings.length === 0) {
            // 如果没有预加载，先尝试加载
            this.loadFromServer().then(loaded => {
                if (loaded) {
                    this.renderBuildingsFromServer();
                } else {
                    // 备用：使用硬编码的建筑数据
                    console.log('[WorldBuilder] Using fallback buildings');
                    this.renderFallbackBuildings();
                }
            });
        } else {
            this.renderBuildingsFromServer();
        }
        
        // 渲染非建筑元素（农田、花田、果树等）
        this.renderNonBuildingElements();
        
        console.log('[WorldBuilder] Buildings built');
    }
    
    /**
     * 备用建筑渲染（当服务器不可用时）
     */
    renderFallbackBuildings() {
        // 技能学院
        const skillAcademy = createSkillAcademyBuilding(-30, -35);
        skillAcademy.add(createLabel('技能学院', { height: 22, fontSize: 24, color: '#ffd700' }));
        this.scene.add(skillAcademy);
        
        // 郊区别墅 (NW)
        const nwHouses = [
            { x: -57, z: -56 }, { x: -55, z: -40 }, { x: -57, z: -25 },
            { x: -53, z: -12 }, { x: -50, z: 5 }, { x: -46, z: -50 },
            { x: -48, z: -30 }, { x: -44, z: -13 }, { x: -46, z: 20 }
        ];
        nwHouses.forEach((h, i) => {
            const house = createSuburbanHouse(h.x, h.z, 0xdeb887);
            house.add(createLabel(`别墅${i+1}`, { height: 10, fontSize: 12, color: '#ffd700' }));
            this.scene.add(house);
        });
        
        // 湖东别墅
        const lakeEastHouses = [
            { x: 62, z: -45 }, { x: 65, z: -55 }, { x: 60, z: -65 },
            { x: 55, z: -75 }, { x: 40, z: -45 }
        ];
        lakeEastHouses.forEach((h, i) => {
            const house = createSuburbanHouse(h.x, h.z, 0xd2b48c);
            house.add(createLabel(`湖边别墅${i+1}`, { height: 10, fontSize: 12, color: '#ffd700' }));
            this.scene.add(house);
        });
        
        // 图书馆
        const library = createLibraryBuilding(0, 50);
        library.add(createLabel('图书馆', { height: 18, fontSize: 28, color: '#ffd700' }));
        this.scene.add(library);
        
        // 工坊
        const workshop = createWorkshopBuilding(27, 74);
        workshop.add(createLabel('工坊', { height: 14, fontSize: 28, color: '#ffd700' }));
        this.scene.add(workshop);
        
        // 消息驿站
        const messageStation = createMessageStationBuilding(78, 50);
        messageStation.add(createLabel('消息驿站', { height: 22, fontSize: 24, color: '#ffd700' }));
        this.scene.add(messageStation);
        
        // 艺术展厅
        const artGallery = createArtGalleryBuilding(0, 75);
        artGallery.add(createLabel('艺术展厅', { height: 14, fontSize: 28, color: '#87ceeb' }));
        this.scene.add(artGallery);
        
        // 档案馆
        const archive = createArchiveBuilding(50, 72);
        archive.add(createLabel('档案馆', { height: 20, fontSize: 28, color: '#ffd700' }));
        this.scene.add(archive);
        
        // 任务中心
        const taskCenter = createTaskCenterBuilding(74, 72);
        taskCenter.add(createLabel('任务中心', { height: 18, fontSize: 28, color: '#ffffff' }));
        this.scene.add(taskCenter);
        
        // 数据中心
        const dataCenter = createDataCenterBuilding(0, 20);
        dataCenter.add(createLabel('数据中心', { height: 16, fontSize: 24, color: '#90EE90' }));
        this.scene.add(dataCenter);
        
        // 声誉塔
        const repTower = createReputationTower(-75, 72);
        repTower.add(createLabel('声誉塔', { height: 38, fontSize: 28, color: '#ffd700' }));
        this.scene.add(repTower);
        
        // 城市建筑
        const urbanBuildings = [
            { x: 5, z: -2 }, { x: 80, z: 28 }, { x: 22, z: -2 },
            { x: 47, z: -2 }, { x: 72, z: 28 }, { x: 32, z: -2 },
            { x: 58, z: -2 }, { x: 73, z: -2 }, { x: 79, z: 10 }, { x: 71, z: 10 }
        ];
        urbanBuildings.forEach(b => {
            this.scene.add(createDiverseUrbanBuilding(b.x, b.z));
        });
        
        // 市民广场
        this.scene.add(createPlazaTiles(40, 36, 28, 30));
        
        // 市民中心
        const civicNorth = createCivicCenterNorth(40, 23);
        civicNorth.add(createLabel('市民中心', { height: 14, fontSize: 24, color: '#ffd700' }));
        this.scene.add(civicNorth);
        
        const civicEast = createCivicCenterWing(25, 42, true);
        civicEast.add(createLabel('市民中心', { height: 12, fontSize: 18, color: '#ffd700' }));
        this.scene.add(civicEast);
        
        const civicWest = createCivicCenterWing(55, 42, false);
        civicWest.add(createLabel('市民中心', { height: 12, fontSize: 18, color: '#ffd700' }));
        this.scene.add(civicWest);
        
        // 喷泉和旗杆
        this.scene.add(createPlazaFountain(40, 40));
        this.scene.add(createFlagpole(30, 23));
        this.scene.add(createFlagpole(50, 23));
    }
    
    /**
     * 渲染非建筑元素（农田、花田、果树等）
     */
    renderNonBuildingElements() {
        const fruitTypes = ['apple', 'pear', 'peach'];
        
        // 果树
        for (let i = 0; i < 12; i++) {
            const fx = 30 + Math.random() * 40;
            const fz = -80 + Math.random() * 40;
            this.scene.add(createFruitTree(fx, fz, fruitTypes[i % 3], 0.8 + Math.random() * 0.4));
        }
        for (let i = 0; i < 15; i++) {
            const fx = -65 + Math.random() * 25;
            const fz = -65 + Math.random() * 90;
            this.scene.add(createFruitTree(fx, fz, fruitTypes[i % 3], 0.8 + Math.random() * 0.4));
        }
        
        // 花田
        this.scene.add(createFlowerField(45, -95, 50, 60, 400));
    }
    
    /**
     * 异步构建建筑 - 从服务器获取数据
     */
    async buildBuildingsAsync() {
        console.log('[WorldBuilder] Fetching buildings from server...');
        const serverBuildings = await this.fetchBuildings();
        
        if (serverBuildings.length > 0) {
            console.log(`[WorldBuilder] Building ${serverBuildings.length} buildings from server data`);
            
            for (const buildingData of serverBuildings) {
                await this.renderBuildingFromServer(buildingData);
            }
        } else {
            console.log('[WorldBuilder] No server data, using fallback buildings');
            this.buildBuildingsFallback();
        }
        
        // 添加广场设施（不在服务器数据中）
        this.scene.add(createPlazaTiles(40, 36, 28, 30));
        this.scene.add(createPlazaFountain(40, 40));
        this.scene.add(createFlagpole(30, 23));
        this.scene.add(createFlagpole(50, 23));
        
        console.log('[WorldBuilder] Buildings built (async)');
    }
    
    /**
     * 从服务器数据渲染建筑
     */
    async renderBuildingFromServer(data) {
        const { id, type, position, name, size } = data;
        const x = position?.x || 0;
        const z = position?.z || 0;
        
        // 获取渲染器
        const renderer = BUILDING_RENDERERS[type];
        if (!renderer) {
            console.warn(`[WorldBuilder] No renderer for building type: ${type}`);
            return;
        }
        
        try {
            const mesh = renderer(data);
            if (mesh && name) {
                mesh.add(createLabel(name, { height: (size?.height || 10) + 2, fontSize: 16, color: '#ffd700' }));
            }
            this.scene.add(mesh);
        } catch (error) {
            console.error(`[WorldBuilder] Failed to render building ${id}:`, error.message);
        }
    }
    
    /**
     * 备用建筑渲染（当服务器不可用时）
     */
    buildBuildingsFallback() {
        // ===== SKILL ACADEMY =====
        const skillAcademy = createSkillAcademyBuilding(-30, -35);
        skillAcademy.add(createLabel('技能学院', { height: 22, fontSize: 24, color: '#ffd700' }));
        this.scene.add(skillAcademy);
        
        // ===== SUBURBAN HOUSES (NW quadrant) =====
        const nwHouses = [
            { x: -57, z: -56 }, { x: -55, z: -40 }, { x: -57, z: -25 },
            { x: -53, z: -12 }, { x: -50, z: 5 }, { x: -46, z: -50 },
            { x: -48, z: -30 }, { x: -44, z: -13 }, { x: -46, z: 20 }
        ];
        nwHouses.forEach((h, i) => {
            const house = createSuburbanHouse(h.x, h.z, 0xdeb887);
            house.add(createLabel(`别墅${i+1}`, { height: 10, fontSize: 12, color: '#ffd700' }));
            this.scene.add(house);
        });
        
        // ===== SUBURBAN HOUSES (east side of lake) =====
        const lakeEastHouses = [
            { x: 62, z: -45 }, { x: 65, z: -55 }, { x: 60, z: -65 },
            { x: 55, z: -75 }, { x: 40, z: -45 }
        ];
        lakeEastHouses.forEach((h, i) => {
            const house = createSuburbanHouse(h.x, h.z, 0xd2b48c);
            house.add(createLabel(`湖边别墅${i+1}`, { height: 10, fontSize: 12, color: '#ffd700' }));
            this.scene.add(house);
        });
        
        // ===== LIBRARY =====
        const library = createLibraryBuilding(0, 50);
        library.add(createLabel('图书馆', { height: 18, fontSize: 28, color: '#ffd700' }));
        this.scene.add(library);
        
        // ===== WORKSHOP =====
        const workshop = createWorkshopBuilding(27, 74);
        workshop.add(createLabel('工坊', { height: 14, fontSize: 28, color: '#ffd700' }));
        this.scene.add(workshop);
        
        // ===== MESSAGE STATION =====
        const messageStation = createMessageStationBuilding(78, 50);
        messageStation.add(createLabel('消息驿站', { height: 22, fontSize: 24, color: '#ffd700' }));
        this.scene.add(messageStation);
        
        // ===== ART GALLERY =====
        const artGallery = createArtGalleryBuilding(0, 75);
        artGallery.add(createLabel('艺术展厅', { height: 14, fontSize: 28, color: '#87ceeb' }));
        this.scene.add(artGallery);
        
        // ===== ARCHIVE =====
        const archive = createArchiveBuilding(50, 72);
        archive.add(createLabel('档案馆', { height: 20, fontSize: 28, color: '#ffd700' }));
        this.scene.add(archive);
        
        // ===== TASK CENTER =====
        const taskCenter = createTaskCenterBuilding(74, 72);
        taskCenter.add(createLabel('任务中心', { height: 18, fontSize: 28, color: '#ffffff' }));
        this.scene.add(taskCenter);
        
        // ===== DATA CENTER =====
        const dataCenter = createDataCenterBuilding(0, 20);
        dataCenter.add(createLabel('数据中心', { height: 16, fontSize: 24, color: '#90EE90' }));
        this.scene.add(dataCenter);
        
        // ===== REPUTATION TOWER =====
        const repTower = createReputationTower(-75, 72);
        repTower.add(createLabel('声誉塔', { height: 38, fontSize: 28, color: '#ffd700' }));
        this.scene.add(repTower);
        
        // ===== URBAN BUILDINGS =====
        const urbanBuildings = [
            { x: 5, z: -2 }, { x: 80, z: 28 }, { x: 22, z: -2 },
            { x: 47, z: -2 }, { x: 72, z: 28 }, { x: 32, z: -2 },
            { x: 58, z: -2 }, { x: 73, z: -2 }, { x: 79, z: 10 }, { x: 71, z: 10 }
        ];
        urbanBuildings.forEach(b => {
            const building = createDiverseUrbanBuilding(b.x, b.z);
            this.scene.add(building);
        });
        
        // ===== CIVIC CENTERS =====
        const civicNorth = createCivicCenterNorth(40, 23);
        civicNorth.add(createLabel('市民中心', { height: 14, fontSize: 24, color: '#ffd700' }));
        this.scene.add(civicNorth);
        
        const civicEast = createCivicCenterWing(25, 42, true);
        civicEast.add(createLabel('市民中心', { height: 12, fontSize: 18, color: '#ffd700' }));
        this.scene.add(civicEast);
        
        const civicWest = createCivicCenterWing(55, 42, false);
        civicWest.add(createLabel('市民中心', { height: 12, fontSize: 18, color: '#ffd700' }));
        this.scene.add(civicWest);
        
        console.log('[WorldBuilder] Fallback buildings built');
    }
    
    buildParks() {
        // ===== MOUNTAIN PINE TREES =====
        // Far west (highest, most trees)
        for (let i = 0; i < 12; i++) {
            this.scene.add(createPineTree(rand(-90, -50), rand(-98, -85), rand(2, 3.5)));
        }
        
        // Center-west (high)
        for (let i = 0; i < 10; i++) {
            this.scene.add(createPineTree(rand(-50, -10), rand(-98, -85), rand(1.8, 3)));
        }
        
        // Center (medium)
        for (let i = 0; i < 8; i++) {
            this.scene.add(createPineTree(rand(-5, 40), rand(-98, -85), rand(1.5, 2.5)));
        }
        
        // East (lower, fewer trees)
        for (let i = 0; i < 6; i++) {
            this.scene.add(createPineTree(rand(45, 80), rand(-95, -80), rand(1, 2)));
        }
        
        // ===== RIVERSIDE TREES =====
        for (let i = 0; i < 15; i++) {
            this.scene.add(createTree(rand(-55, 65), rand(-55, 55), 'willow', rand(0.9, 1.3)));
        }
        
        // ===== LAKE TREES =====
        for (let i = 0; i < 8; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = 25 + Math.random() * 12;
            this.scene.add(createTree(10 + Math.cos(angle) * dist, -55 + Math.sin(angle) * dist * 0.5, 'willow', rand(0.9, 1.2)));
        }
        
        // ===== SCENIC AVENUE PALM TREES (along z=84, on both sides of road) =====
        // Avenue at z=87.5, width 5, north edge at z=85
        // Palm trees at z=84 (north side, not on road) and z=91 (south side, not on road)
        for (let x = -60; x <= 80; x += 10) {
            this.scene.add(createPalmTree(x + rand(-2, 2), 84, rand(1.8, 2.5)));
            this.scene.add(createPalmTree(x + rand(-2, 2), 91, rand(1.8, 2.5)));
        }
        
        // ===== BEACH PALM FOREST (z=80~85, x=-40~-80, near lake, not in ocean) =====
        for (let i = 0; i < 25; i++) {
            const x = rand(-80, -40);
            const z = rand(80, 85);
            this.scene.add(createPalmTree(x, z, rand(1.5, 2.5)));
        }
        
        // ===== PLAZA TREES (around fountain) =====
        this.scene.add(createTree(48, 28, 'maple', 1.2));
        this.scene.add(createTree(62, 28, 'maple', 1.2));
        this.scene.add(createTree(48, 38, 'maple', 1.2));
        this.scene.add(createTree(62, 38, 'maple', 1.2));
        
        // ===== BENCHES =====
        this.scene.add(createBench(-40, -45));
        this.scene.add(createBench(-50, -15));
        this.scene.add(createBench(50, 5));
        this.scene.add(createBench(68, 35));
        
        // Citizen plaza benches (around Town Hall at 40, 35)
        this.scene.add(createBench(32, 30));
        this.scene.add(createBench(48, 30));
        this.scene.add(createBench(32, 40));
        this.scene.add(createBench(48, 40));
        this.scene.add(createBench(36, 35));
        this.scene.add(createBench(44, 35));
        
        // ===== FARMLAND (X:-95~-70, Z:-60~0) =====
        this.scene.add(createFarmlandArea());
        
        console.log('[WorldBuilder] Parks built');
    }
    
    buildLamps() {
        // Main roads: N-S at x=15, x=40, x=65; E-W at z=5, z=35, z=65
        // Lamps placed along roads at regular intervals (every 15 units)
        
        // ===== N-S Road lamps (x=15, x=40, x=65) =====
        const nsRoadXLamps = [15, 40, 65];
        const nsLampPositions = [];
        
        // N-S roads from z=-10 to z=80
        for (const x of nsRoadXLamps) {
            for (let z = -10; z <= 80; z += 15) {
                // Skip z positions where E-W roads cross
                if (Math.abs(z - 5) < 5 || Math.abs(z - 35) < 5 || Math.abs(z - 65) < 5) continue;
                nsLampPositions.push({ x: x + 3, z }); // offset to one side of road
                nsLampPositions.push({ x: x - 3, z }); // other side
            }
        }
        
        // ===== E-W Road lamps (z=5, z=35, z=65) =====
        const ewRoadZLamps = [5, 35, 65];
        const ewLampPositions = [];
        
        for (const z of ewRoadZLamps) {
            for (let x = -10; x <= 85; x += 15) {
                // Skip x positions where N-S roads cross
                if (Math.abs(x - 15) < 5 || Math.abs(x - 40) < 5 || Math.abs(x - 65) < 5) continue;
                ewLampPositions.push({ x, z: z + 3 });
                ewLampPositions.push({ x, z: z - 3 });
            }
        }
        
        // ===== Suburban lamps (NW quadrant, along winding roads) =====
        const suburbanLamps = [
            // Along x=-50 road
            { x: -47, z: -55 }, { x: -47, z: -45 }, { x: -47, z: -35 }, { x: -47, z: -25 },
            { x: -53, z: -55 }, { x: -53, z: -45 }, { x: -53, z: -35 }, { x: -53, z: -25 },
            // Along x=-55 road
            { x: -52, z: -40 }, { x: -52, z: -30 }, { x: -52, z: -20 }, { x: -52, z: -10 },
            { x: -58, z: -40 }, { x: -58, z: -30 }, { x: -58, z: -20 }, { x: -58, z: -10 },
            // Along z=-40 road
            { x: -45, z: -37 }, { x: -35, z: -37 },
            { x: -45, z: -43 }, { x: -35, z: -43 },
        ];
        
        // ===== Plaza lamps (around Town Hall at 40, 35) =====
        const plazaLamps = [
            { x: 28, z: 30 }, { x: 52, z: 30 },
            { x: 28, z: 40 }, { x: 52, z: 40 },
            { x: 28, z: 50 }, { x: 52, z: 50 },
            { x: 35, z: 25 }, { x: 45, z: 25 },
            { x: 35, z: 55 }, { x: 45, z: 55 },
        ];
        
        // Add all lamps and track them
        this.lamps = [];
        const addLamp = (x, z) => {
            const lamp = createLamp(x, z);
            this.scene.add(lamp);
            this.lamps.push(lamp);
        };
        
        nsLampPositions.forEach(pos => addLamp(pos.x, pos.z));
        ewLampPositions.forEach(pos => addLamp(pos.x, pos.z));
        suburbanLamps.forEach(pos => addLamp(pos.x, pos.z));
        plazaLamps.forEach(pos => addLamp(pos.x, pos.z));
        
        console.log(`[WorldBuilder] Lamps built: ${this.lamps.length}`);
    }
    
    /**
     * 创建莲花灯 - 放在艺术展厅水池中央
     */
    buildLotusLamp() {
        // 艺术展厅位置 (0, 75)，水池中央
        this.lotusLamp = new LotusLamp(0, 75);
        this.scene.add(this.lotusLamp.group);
        console.log('[WorldBuilder] Lotus lamp built');
    }
}

let _builder = null;
let _scene = null;

export const worldBuilder = {
    init(scene) {
        _scene = scene;
    },
    build() {
        if (!_builder) {
            _builder = new WorldBuilder();
            _builder.init(_scene);
        }
        _builder.build();
    },
    getLamps() {
        return _builder ? _builder.lamps : [];
    },
    getLotusLamp() {
        return _builder ? _builder.lotusLamp : null;
    }
};

export default { WorldBuilder, worldBuilder, LANDMARKS };
