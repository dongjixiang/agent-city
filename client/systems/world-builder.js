/**
 * World Builder - Agent City
 * Ocean at south, Urban SE, Suburban NW
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
import { createBuilding, createDomeBuilding, createTower, createGlassBuilding, createSuburbanHouse, createUrbanBuilding, createLibraryBuilding, createWorkshopBuilding, createMessageStationBuilding, createArtGalleryBuilding, createArchiveBuilding, createTaskCenterBuilding, createDataCenterBuilding, createReputationTower, createSkillAcademyBuilding, createDiverseUrbanBuilding, createCivicCenterNorth, createCivicCenterWing, createPlazaFountain, createFlagpole, createPlazaTiles } from '../objects/buildings/minecraft-buildings.js';
import { createLabel } from '../objects/buildings/label.js';

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
    }
    
    init(scene) {
        this.scene = scene;
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
        console.log('[WorldBuilder] World built successfully!');
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
            { x: 15, z: -10 }, { x: 15, z: 20 },
        ];
        createRoad(nsRoad1, 4).forEach(m => this.scene.add(m));
        
        const nsRoad2 = [
            { x: 15, z: 50 }, { x: 15, z: 80 },
        ];
        createRoad(nsRoad2, 4).forEach(m => this.scene.add(m));
        
        const nsRoad3 = [
            { x: 40, z: -10 }, { x: 40, z: 20 },
        ];
        createRoad(nsRoad3, 4).forEach(m => this.scene.add(m));
        
        const nsRoad4 = [
            { x: 40, z: 50 }, { x: 40, z: 80 },
        ];
        createRoad(nsRoad4, 4).forEach(m => this.scene.add(m));
        
        const nsRoad5 = [
            { x: 65, z: -10 }, { x: 65, z: 20 },
        ];
        createRoad(nsRoad5, 4).forEach(m => this.scene.add(m));
        
        const nsRoad6 = [
            { x: 65, z: 50 }, { x: 65, z: 80 },
        ];
        createRoad(nsRoad6, 4).forEach(m => this.scene.add(m));
        
        // E-W horizontal roads at z=5, z=35, z=65
        const ewRoad1 = [
            { x: -10, z: 5 }, { x: 85, z: 5 },
        ];
        createRoad(ewRoad1, 4).forEach(m => this.scene.add(m));
        
        const ewRoad2 = [
            { x: -10, z: 35 }, { x: 25, z: 35 },
        ];
        createRoad(ewRoad2, 4).forEach(m => this.scene.add(m));
        
        const ewRoad3 = [
            { x: 55, z: 35 }, { x: 85, z: 35 },
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
    
    buildBuildings() {
        // ===== SKILL ACADEMY (NW) =====
        this.scene.add(createTower(-45, -50, 12, 0x8b4513));
        this.scene.add(createSuburbanHouse(-52, -55, 0xdeb887));
        this.scene.add(createSuburbanHouse(-38, -55, 0xd2b48c));
        
        // ===== SUBURBAN HOUSES (east side of lake) =====
        // Scattered along east lake shore
        const lakeEastNewHouses = [
            { x: 62, z: -45, color: 0xdeb887 },   // 湖东北角
            { x: 65, z: -55, color: 0xd2b48c },   // 东岸北段
            { x: 60, z: -65, color: 0xf5deb3 },   // 东岸中段（临湖）
            { x: 55, z: -75, color: 0xe6e6fa },   // 东岸南段（临湖）
            { x: 40, z: -45, color: 0xffa07a },   // 东南深入区
            { x: 32, z: -50, color: 0xd2691e },   // 东南翼
            { x: 50, z: -50, color: 0xf5f5dc },  // 东侧远端
        ];
        lakeEastNewHouses.forEach(h => this.scene.add(createSuburbanHouse(h.x, h.z, h.color)));
        
        // ===== FRUIT TREES around east side houses =====
        const eastFruitTypes = ['apple', 'pear', 'peach'];
        for (let i = 0; i < 12; i++) {
            const fx = rand(30, 70);
            const fz = rand(-80, -40);
            const fruitType = eastFruitTypes[i % 3];
            this.scene.add(createFruitTree(fx, fz, fruitType, rand(0.8, 1.2)));
        }
        
        // ===== FLOWER FIELD (covering east suburban village) =====
        // X: 45~95, Z: -95~-35, 400 flowers
        this.scene.add(createFlowerField(45, -95, 50, 60, 400));
        
        // NW quadrant (x: -65 to -40, z: -65 to 25)
        const nwHouses = [
            { x: rand(-62, -52), z: rand(-62, -50), color: 0xdeb887 },
            { x: rand(-60, -50), z: rand(-45, -35), color: 0xd2b48c },
            { x: rand(-62, -52), z: rand(-30, -20), color: 0xf5deb3 },
            { x: rand(-58, -48), z: rand(-15, -5), color: 0xe6e6fa },
            { x: rand(-55, -45), z: rand(5, 15), color: 0xffa07a },
            { x: rand(-50, -42), z: rand(-55, -45), color: 0xd2691e },
            { x: rand(-52, -44), z: rand(-35, -25), color: 0xdeb887 },
            { x: rand(-48, -40), z: rand(-18, -8), color: 0xf5f5dc },
            { x: rand(-55, -45), z: rand(0, 10), color: 0xffd700 },
            { x: rand(-50, -42), z: rand(15, 25), color: 0xd2b48c },
        ];
        nwHouses.forEach(h => this.scene.add(createSuburbanHouse(h.x, h.z, h.color)));
        
        // ===== FRUIT TREES around NW suburban houses =====
        // NW area: x: -65 to -40, z: -65 to 25
        const fruitTypes = ['apple', 'pear', 'peach'];
        for (let i = 0; i < 15; i++) {
            const fx = rand(-65, -40);
            const fz = rand(-65, 25);
            const fruitType = fruitTypes[i % 3];
            this.scene.add(createFruitTree(fx, fz, fruitType, rand(0.8, 1.2)));
        }
        
        // ===== SKILL ACADEMY (NW) - Tower school with clock =====
        const skillAcademy = createSkillAcademyBuilding(-30, -35);
        skillAcademy.add(createLabel('技能学院', { height: 22, fontSize: 24, color: '#ffd700' }));
        this.scene.add(skillAcademy);
        
        // ===== URBAN FUNCTIONAL BUILDINGS (optimized, off roads) =====
        // Roads: N-S at x=15,40,65; E-W at z=5,35,65
        // Plaza area: x=25~55, z=20~50
        
        // Library (classic monument style)
        const library = createLibraryBuilding(0, 50);
        library.add(createLabel('图书馆', { height: 18, fontSize: 28, color: '#ffd700' }));
        this.scene.add(library);
        
        // Workshop (industrial with chimney)
        const workshop = createWorkshopBuilding(27, 74);
        workshop.add(createLabel('工坊', { height: 14, fontSize: 28, color: '#ffd700' }));
        this.scene.add(workshop);
        
        // Message Station (communication tower)
        const messageStation = createMessageStationBuilding(78, 50);
        messageStation.add(createLabel('消息驿站', { height: 22, fontSize: 24, color: '#ffd700' }));
        this.scene.add(messageStation);
        
        // Art Gallery (modern glass pavilion)
        const artGallery = createArtGalleryBuilding(0, 75);
        artGallery.add(createLabel('艺术展厅', { height: 14, fontSize: 28, color: '#87ceeb' }));
        this.scene.add(artGallery);
        
        // Archive (monumental stone)
        const archive = createArchiveBuilding(50, 72);
        archive.add(createLabel('档案馆', { height: 20, fontSize: 28, color: '#ffd700' }));
        this.scene.add(archive);
        
        // ===== LANDMARK BUILDINGS (with labels, off roads) =====
        // Task Center (modern office)
        const taskCenter = createTaskCenterBuilding(74, 72);
        taskCenter.add(createLabel('任务中心', { height: 18, fontSize: 28, color: '#ffffff' }));
        this.scene.add(taskCenter);
        this.scene.add(createDiverseUrbanBuilding(79, 10));
        
        // Data Center (tech server)
        const dataCenter = createDataCenterBuilding(0, 20);
        dataCenter.add(createLabel('数据中心', { height: 16, fontSize: 24, color: '#90EE90' }));
        this.scene.add(dataCenter);
        this.scene.add(createDiverseUrbanBuilding(71, 10));
        
        // Reputation Tower (golden landmark)
        const repTower = createReputationTower(-75, 72);
        repTower.add(createLabel('声誉塔', { height: 38, fontSize: 28, color: '#ffd700' }));
        this.scene.add(repTower);
        
        // ===== URBAN BUILDINGS ALONG GRID (off roads) =====
        this.scene.add(createDiverseUrbanBuilding(5, -2));
        this.scene.add(createDiverseUrbanBuilding(80, 28));
        this.scene.add(createDiverseUrbanBuilding(22, -2));
        this.scene.add(createDiverseUrbanBuilding(47, -2));
        this.scene.add(createDiverseUrbanBuilding(72, 28));
        this.scene.add(createDiverseUrbanBuilding(32, -2));
        this.scene.add(createDiverseUrbanBuilding(58, -2));
        this.scene.add(createDiverseUrbanBuilding(73, -2));
        
        // ===== CITIZEN PLAZA (city center at x=40, z=35) =====
        // Plaza ground tiles
        this.scene.add(createPlazaTiles(40, 36, 28, 30));
        
        // Town Hall (white dome, center)
        const townHall = createDomeBuilding(40, 33, 0x4169e1, 8, 18);
        townHall.add(createLabel('市政厅', { height: 28, fontSize: 32, color: '#ffd700' }));
        //this.scene.add(townHall);
        
        // North Civic Center (市民中心A)
        const civicNorth = createCivicCenterNorth(40, 23);
        civicNorth.add(createLabel('市民中心', { height: 14, fontSize: 24, color: '#ffd700' }));
        this.scene.add(civicNorth);
        
        // East Civic Center (市民中心B) - facing right
        const civicEast = createCivicCenterWing(25, 42, true);
        civicEast.add(createLabel('市民中心', { height: 12, fontSize: 18, color: '#ffd700' }));
        this.scene.add(civicEast);
        
        // West Civic Center (市民中心C) - facing left
        const civicWest = createCivicCenterWing(55, 42, false);
        civicWest.add(createLabel('市民中心', { height: 12, fontSize: 18, color: '#ffd700' }));
        this.scene.add(civicWest);
        
        // Plaza fountain (center south, not overlapping)
        const fountain = createPlazaFountain(40, 40);
        this.scene.add(fountain);
        
        // Flagpoles
        this.scene.add(createFlagpole(30, 23));
        this.scene.add(createFlagpole(50, 23));
        
        console.log('[WorldBuilder] Buildings built');
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
        // Urban lamps (SE grid)
        const urbanLamps = [
            { x: 40, z: 0 }, { x: 55, z: 0 }, { x: 70, z: 0 },
            { x: 40, z: 15 }, { x: 55, z: 15 }, { x: 70, z: 15 },
            { x: 40, z: 30 }, { x: 55, z: 30 }, { x: 70, z: 30 },
            { x: 40, z: 45 }, { x: 55, z: 45 }, { x: 70, z: 45 },
            { x: 40, z: 60 }, { x: 55, z: 60 }, { x: 70, z: 60 },
            { x: 47, z: 10 }, { x: 62, z: 10 },
            { x: 47, z: 25 }, { x: 62, z: 25 },
            { x: 47, z: 40 }, { x: 62, z: 40 },
        ];
        urbanLamps.forEach(pos => {
            this.scene.add(createLamp(pos.x, pos.z));
        });
        
        // Suburban lamps (NW)
        const suburbanLamps = [
            { x: -42, z: -48 }, { x: -52, z: -38 },
            { x: -42, z: -28 }, { x: -52, z: -18 },
            { x: -42, z: -8 }, { x: -52, z: 2 },
            { x: -42, z: 12 }, { x: -52, z: 22 },
        ];
        
        // Citizen plaza lamps (around Town Hall at 40, 35)
        const plazaLamps = [
            { x: 30, z: 28 }, { x: 50, z: 28 },
            { x: 30, z: 42 }, { x: 50, z: 42 },
            { x: 30, z: 35 }, { x: 50, z: 35 },
        ];
        suburbanLamps.forEach(pos => {
            this.scene.add(createLamp(pos.x, pos.z));
        });
        
        plazaLamps.forEach(pos => {
            this.scene.add(createLamp(pos.x, pos.z));
        });
        
        console.log('[WorldBuilder] Lamps built');
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
    }
};

export default { WorldBuilder, worldBuilder, LANDMARKS };
