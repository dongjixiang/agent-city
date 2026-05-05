/**
 * WorldRenderer - 智体城世界渲染器
 * 
 * 职责：
 * - 使用服务端 WorldData + 渲染参数构建 3D 场景
 * - 不存储数据，只负责渲染
 * 
 * 渲染参数与 WorldData 分离：
 * - WorldData: 位置、尺寸、类型、ID（服务端）
 * - RenderStyles: 颜色、材质、特效（客户端）
 */

import * as THREE from 'three';

class WorldRenderer {
    constructor(scene, worldLoader) {
        this.scene = scene;
        this.loader = worldLoader;
        
        // 渲染对象存储
        this.buildings = new Map();
        this.decorations = new Map();
        this.roads = new Map();
        this.terrainObjects = new Map();
        
        // 渲染样式定义
        this.styles = this.getRenderStyles();
    }
    
    /**
     * 获取渲染样式（与 WorldData 分离）
     * 这里定义所有颜色、材质、特效
     */
    getRenderStyles() {
        return {
            // 建筑样式
            building: {
                modern: {
                    color: 0x607d8b,
                    emissive: 0x1a1a2e,
                    metalness: 0.7,
                    roughness: 0.3
                },
                glass: {
                    color: 0x88d4f7,
                    emissive: 0x112233,
                    metalness: 0.9,
                    roughness: 0.1,
                    transparent: true,
                    opacity: 0.8
                },
                classic: {
                    color: 0x8b7355,
                    emissive: 0x3d2817,
                    metalness: 0.3,
                    roughness: 0.6
                },
                industrial: {
                    color: 0x555555,
                    emissive: 0x111111,
                    metalness: 0.6,
                    roughness: 0.5
                },
                residential: {
                    color: 0xcc9966,
                    emissive: 0x332211,
                    metalness: 0.2,
                    roughness: 0.7
                }
            },
            
            // 建筑类型默认样式
            buildingType: {
                skyscraper: 'modern',
                office: 'glass',
                house: 'residential',
                apartment: 'residential',
                shop: 'modern',
                factory: 'industrial',
                warehouse: 'industrial',
                tower: 'classic',
                'park设施': 'modern'
            },
            
            // 地形颜色
            terrain: {
                grass: { color: 0x4a7c4e, emissive: 0x1a3d15 },
                road: { color: 0x333333, emissive: 0x111111 },
                water: { color: 0x4a90d9, emissive: 0x1a3d55, transparent: true, opacity: 0.8 },
                mountain: { color: 0x8b7355, emissive: 0x3d2817 }
            },
            
            // 装饰物样式
            tree: {
                oak: { color: 0x228b22, emissive: 0x0a3d0a, trunk: 0x8b4513 },
                pine: { color: 0x2e8b57, emissive: 0x0a3d1a, trunk: 0x654321 },
                willow: { color: 0x90ee90, emissive: 0x3a7d3a, trunk: 0x8b4513 },
                maple: { color: 0xdc143c, emissive: 0x5a0a15, trunk: 0x8b4513 }
            },
            
            flower: {
                rose: { color: 0xff69b4, emissive: 0x7a2040 },
                tulip: { color: 0xffd700, emissive: 0x7a6500 },
                sunflower: { color: 0xffa500, emissive: 0x7a5000 },
                lotus: { color: 0xffc0cb, emissive: 0x7a5055 }
            },
            
            bench: {
                wooden: { color: 0x8b4513, emissive: 0x3d1505, metalness: 0.1, roughness: 0.8 },
                metal: { color: 0x708090, emissive: 0x203040, metalness: 0.8, roughness: 0.3 },
                modern: { color: 0x404040, emissive: 0x101010, metalness: 0.6, roughness: 0.4 }
            },
            
            lamp: {
                classic: { color: 0xb8860b, emissive: 0xffdd00, emissiveIntensity: 0.5, metalness: 0.7, roughness: 0.3 },
                modern: { color: 0x303030, emissive: 0xffffff, emissiveIntensity: 0.3, metalness: 0.8, roughness: 0.2 },
                street: { color: 0x404040, emissive: 0xffffaa, emissiveIntensity: 0.4, metalness: 0.6, roughness: 0.4 }
            },
            
            rock: {
                boulder: { color: 0x696969, emissive: 0x202020, metalness: 0.2, roughness: 0.9 },
                pebble: { color: 0x808080, emissive: 0x101010, metalness: 0.1, roughness: 0.95 },
                cliff: { color: 0x4a4a4a, emissive: 0x151515, metalness: 0.3, roughness: 0.85 }
            },
            
            fountain: {
                modern: { color: 0x87ceeb, emissive: 0x2a5a7a, metalness: 0.5, roughness: 0.3 },
                classic: { color: 0xb0c4de, emissive: 0x3a5a7a, metalness: 0.4, roughness: 0.5 },
                musical: { color: 0x4682b4, emissive: 0x1a3a5a, metalness: 0.6, roughness: 0.2 }
            }
        };
    }
    
    /**
     * 渲染整个世界
     */
    async renderWorld() {
        console.log('[WorldRenderer] 开始渲染世界...');
        
        // 渲染地形
        this.renderTerrain();
        
        // 渲染道路
        this.renderRoads();
        
        // 渲染建筑
        this.renderBuildings();
        
        // 渲染装饰物
        this.renderDecorations();
        
        console.log('[WorldRenderer] 世界渲染完成');
        console.log(`  - 建筑: ${this.buildings.size}`);
        console.log(`  - 装饰物: ${this.decorations.size}`);
    }
    
    /**
     * 渲染地形
     */
    renderTerrain() {
        const terrain = this.loader.terrain;
        if (!terrain) return;
        
        // 渲染地面
        const groundGeo = new THREE.PlaneGeometry(500, 500);
        const groundMat = new THREE.MeshStandardMaterial({
            color: 0x4a7c4e,
            emissive: 0x1a3d15,
            metalness: 0.1,
            roughness: 0.8
        });
        const ground = new THREE.Mesh(groundGeo, groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -0.1;
        ground.receiveShadow = true;
        this.scene.add(ground);
        
        // 渲染山丘
        if (terrain.heightVariations) {
            terrain.heightVariations.forEach((hill, index) => {
                this.renderHill(hill, index);
            });
        }
        
        // 渲染水域
        if (terrain.waterBodies) {
            terrain.waterBodies.forEach((water, index) => {
                this.renderWater(water, index);
            });
        }
    }
    
    /**
     * 渲染山丘
     */
    renderHill(hillData, index) {
        const { position, radius, height } = hillData;
        
        // 使用球体作为山丘
        const hillGeo = new THREE.SphereGeometry(radius, 16, 12);
        const hillMat = new THREE.MeshStandardMaterial({
            color: 0x8b7355,
            emissive: 0x3d2817,
            metalness: 0.1,
            roughness: 0.9
        });
        
        const hill = new THREE.Mesh(hillGeo, hillMat);
        hill.position.set(position.x, height / 2, position.z);
        hill.scale.y = height / radius; // 压扁一点
        hill.castShadow = true;
        hill.receiveShadow = true;
        
        this.scene.add(hill);
        this.terrainObjects.set(`hill_${index}`, hill);
    }
    
    /**
     * 渲染水域
     */
    renderWater(waterData, index) {
        const { position, radiusX, radiusZ, depth } = waterData;
        
        // 使用椭圆平面作为水面
        const waterGeo = new THREE.CircleGeometry(Math.max(radiusX, radiusZ), 32);
        const waterMat = new THREE.MeshStandardMaterial({
            color: 0x4a90d9,
            emissive: 0x1a3d55,
            metalness: 0.3,
            roughness: 0.1,
            transparent: true,
            opacity: 0.8
        });
        
        const water = new THREE.Mesh(waterGeo, waterMat);
        water.rotation.x = -Math.PI / 2;
        water.position.set(position.x, -depth, position.z);
        
        this.scene.add(water);
        this.terrainObjects.set(`water_${index}`, water);
    }
    
    /**
     * 渲染道路
     */
    renderRoads() {
        // 如果 loader 有道路数据
        const worldData = this.loader.worldState;
        if (worldData && worldData.roads) {
            worldData.roads.forEach((road, index) => {
                this.renderRoad(road, index);
            });
        }
    }
    
    /**
     * 渲染单条道路
     */
    renderRoad(roadData, index) {
        const { start, end, width, direction } = roadData;
        
        const length = Math.hypot(end.x - start.x, end.z - start.z);
        
        const roadGeo = new THREE.PlaneGeometry(width, length);
        const roadMat = new THREE.MeshStandardMaterial({
            color: 0x333333,
            emissive: 0x111111,
            metalness: 0.1,
            roughness: 0.9
        });
        
        const road = new THREE.Mesh(roadGeo, roadMat);
        road.rotation.x = -Math.PI / 2;
        road.rotation.z = direction === 'horizontal' ? 0 : Math.PI / 2;
        road.position.set(
            (start.x + end.x) / 2,
            0.01, // 稍微在地面之上
            (start.z + end.z) / 2
        );
        road.receiveShadow = true;
        
        this.scene.add(road);
        this.roads.set(`road_${index}`, road);
    }
    
    /**
     * 渲染所有建筑
     */
    renderBuildings() {
        const buildings = this.loader.getBuildingsForRendering();
        
        buildings.forEach(buildingData => {
            const mesh = this.renderBuilding(buildingData);
            if (mesh) {
                this.buildings.set(buildingData.id, mesh);
            }
        });
    }
    
    /**
     * 渲染单个建筑
     */
    renderBuilding(data) {
        const { id, type, position, size, style } = data;
        
        // 获取渲染样式
        const styleName = this.styles.buildingType[type] || 'modern';
        const styleData = this.styles.building[style] || this.styles.building.modern;
        
        // 创建材质
        const material = new THREE.MeshStandardMaterial({
            color: styleData.color,
            emissive: styleData.emissive,
            metalness: styleData.metalness,
            roughness: styleData.roughness,
            transparent: styleData.transparent || false,
            opacity: styleData.opacity || 1.0
        });
        
        // 根据建筑类型创建几何体
        let geometry;
        switch (type) {
            case 'skyscraper':
                geometry = this.createSkyscraperGeometry(size, style);
                break;
            case 'tower':
                geometry = this.createTowerGeometry(size);
                break;
            default:
                geometry = new THREE.BoxGeometry(size.width, size.height, size.depth);
        }
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(position.x, size.height / 2, position.z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        
        // 添加窗户效果（如果适用）
        if (type === 'skyscraper' || type === 'office') {
            this.addWindows(mesh, size, position);
        }
        
        this.scene.add(mesh);
        return mesh;
    }
    
    /**
     * 创建摩天大楼几何体（带顶部装饰）
     */
    createSkyscraperGeometry(size, style) {
        const { width, height, depth } = size;
        
        // 主要结构
        const mainGeo = new THREE.BoxGeometry(width, height - 10, depth);
        
        // 顶部结构
        const topGeo = new THREE.BoxGeometry(width * 0.6, 10, depth * 0.6);
        
        // 组合
        const group = new THREE.Group();
        
        const mainMesh = new THREE.Mesh(mainGeo);
        mainMesh.position.y = 0;
        group.add(mainMesh);
        
        const topMesh = new THREE.Mesh(topGeo);
        topMesh.position.y = height / 2 - 5;
        group.add(topMesh);
        
        return mainGeo; // 简化处理
    }
    
    /**
     * 创建塔楼几何体
     */
    createTowerGeometry(size) {
        const { width, height, depth } = size;
        
        // 圆柱形塔
        const radius = Math.min(width, depth) / 2;
        return new THREE.CylinderGeometry(radius, radius * 1.2, height, 8);
    }
    
    /**
     * 添加窗户效果
     */
    addWindows(mesh, size, position) {
        // 窗户材质（发光）
        const windowMat = new THREE.MeshBasicMaterial({
            color: 0xffffaa,
            transparent: true,
            opacity: 0.8
        });
        
        // 在建筑前面创建窗户行
        const floors = Math.floor(size.height / 4);
        const windowsPerFloor = Math.floor(size.width / 3);
        
        for (let f = 1; f < floors; f++) {
            for (let w = 0; w < windowsPerFloor; w++) {
                const windowGeo = new THREE.PlaneGeometry(1, 1.5);
                const windowMesh = new THREE.Mesh(windowGeo, windowMat);
                
                windowMesh.position.set(
                    position.x - size.width / 2 + 2 + w * 3,
                    f * 4,
                    position.z + size.depth / 2 + 0.1
                );
                
                this.scene.add(windowMesh);
            }
        }
    }
    
    /**
     * 渲染所有装饰物
     */
    renderDecorations() {
        // 渲染树木
        this.loader.getTrees().forEach(tree => {
            const mesh = this.renderTree(tree);
            if (mesh) this.decorations.set(tree.id, mesh);
        });
        
        // 渲染喷泉
        this.loader.getFountains().forEach(fountain => {
            const mesh = this.renderFountain(fountain);
            if (mesh) this.decorations.set(fountain.id, mesh);
        });
        
        // 渲染其他装饰物（从 worldState 获取）
        const decorations = this.loader.worldState?.decorations || {};
        
        Object.entries(decorations).forEach(([type, items]) => {
            if (Array.isArray(items)) {
                items.forEach(item => {
                    const mesh = this.renderDecoration(item, type);
                    if (mesh) this.decorations.set(item.id, mesh);
                });
            }
        });
    }
    
    /**
     * 渲染树木
     */
    renderTree(data) {
        const { id, type, position, style } = data;
        const treeStyle = this.styles.tree[style] || this.styles.tree.oak;
        
        const group = new THREE.Group();
        
        // 树干
        const trunkGeo = new THREE.CylinderGeometry(0.3, 0.4, 3, 8);
        const trunkMat = new THREE.MeshStandardMaterial({
            color: treeStyle.trunk,
            emissive: 0x1a0a00
        });
        const trunk = new THREE.Mesh(trunkGeo, trunkMat);
        trunk.position.y = 1.5;
        trunk.castShadow = true;
        group.add(trunk);
        
        // 树冠
        const crownGeo = new THREE.SphereGeometry(2, 8, 6);
        const crownMat = new THREE.MeshStandardMaterial({
            color: treeStyle.color,
            emissive: treeStyle.emissive,
            metalness: 0.1,
            roughness: 0.8
        });
        const crown = new THREE.Mesh(crownGeo, crownMat);
        crown.position.y = 4;
        crown.scale.y = 1.2;
        crown.castShadow = true;
        group.add(crown);
        
        group.position.set(position.x, 0, position.z);
        this.scene.add(group);
        
        return group;
    }
    
    /**
     * 渲染喷泉
     */
    renderFountain(data) {
        const { id, type, position, style } = data;
        const fountainStyle = this.styles.fountain[style] || this.styles.fountain.modern;
        
        const group = new THREE.Group();
        
        // 基座
        const baseGeo = new THREE.CylinderGeometry(3, 3.5, 1, 16);
        const baseMat = new THREE.MeshStandardMaterial({
            color: fountainStyle.color,
            emissive: fountainStyle.emissive,
            metalness: fountainStyle.metalness,
            roughness: fountainStyle.roughness
        });
        const base = new THREE.Mesh(baseGeo, baseMat);
        base.position.y = 0.5;
        base.castShadow = true;
        base.receiveShadow = true;
        group.add(base);
        
        // 中央柱
        const pillarGeo = new THREE.CylinderGeometry(0.5, 0.6, 2, 12);
        const pillar = new THREE.Mesh(pillarGeo, baseMat);
        pillar.position.y = 2;
        pillar.castShadow = true;
        group.add(pillar);
        
        // 水喷（简单表示）
        const waterGeo = new THREE.SphereGeometry(0.8, 8, 8);
        const waterMat = new THREE.MeshStandardMaterial({
            color: 0x87ceeb,
            emissive: 0x2a5a7a,
            transparent: true,
            opacity: 0.6
        });
        const water = new THREE.Mesh(waterGeo, waterMat);
        water.position.y = 3;
        group.add(water);
        
        group.position.set(position.x, 0, position.z);
        this.scene.add(group);
        
        return group;
    }
    
    /**
     * 渲染通用装饰物
     */
    renderDecoration(data, type) {
        const { id, position, style, rotation } = data;
        
        switch (type) {
            case 'flower':
                return this.renderFlower(data);
            case 'bench':
                return this.renderBench(data);
            case 'lamp':
                return this.renderLamp(data);
            case 'rock':
                return this.renderRock(data);
            default:
                return null;
        }
    }
    
    /**
     * 渲染花卉
     */
    renderFlower(data) {
        const { id, type, position, style } = data;
        const flowerStyle = this.styles.flower[style] || this.styles.flower.rose;
        
        const flowerGeo = new THREE.SphereGeometry(0.3, 8, 6);
        const flowerMat = new THREE.MeshStandardMaterial({
            color: flowerStyle.color,
            emissive: flowerStyle.emissive,
            metalness: 0.1,
            roughness: 0.6
        });
        
        const flower = new THREE.Mesh(flowerGeo, flowerMat);
        flower.position.set(position.x, 0.4, position.z);
        flower.scale.y = 0.6;
        flower.castShadow = true;
        
        this.scene.add(flower);
        return flower;
    }
    
    /**
     * 渲染长椅
     */
    renderBench(data) {
        const { id, type, position, style, rotation } = data;
        const benchStyle = this.styles.bench[style] || this.styles.bench.wooden;
        
        const benchGeo = new THREE.BoxGeometry(2, 0.6, 0.5);
        const benchMat = new THREE.MeshStandardMaterial({
            color: benchStyle.color,
            emissive: benchStyle.emissive,
            metalness: benchStyle.metalness,
            roughness: benchStyle.roughness
        });
        
        const bench = new THREE.Mesh(benchGeo, benchMat);
        bench.position.set(position.x, 0.4, position.z);
        bench.rotation.y = rotation || 0;
        bench.castShadow = true;
        bench.receiveShadow = true;
        
        this.scene.add(bench);
        return bench;
    }
    
    /**
     * 渲染路灯
     */
    renderLamp(data) {
        const { id, type, position, style, rotation } = data;
        const lampStyle = this.styles.lamp[style] || this.styles.lamp.street;
        
        const group = new THREE.Group();
        
        // 灯柱
        const poleGeo = new THREE.CylinderGeometry(0.1, 0.15, 4, 8);
        const poleMat = new THREE.MeshStandardMaterial({
            color: lampStyle.color,
            metalness: lampStyle.metalness,
            roughness: lampStyle.roughness
        });
        const pole = new THREE.Mesh(poleGeo, poleMat);
        pole.position.y = 2;
        pole.castShadow = true;
        group.add(pole);
        
        // 灯罩
        const lampGeo = new THREE.SphereGeometry(0.3, 8, 8);
        const lampMat = new THREE.MeshStandardMaterial({
            color: lampStyle.color,
            emissive: lampStyle.emissive,
            emissiveIntensity: lampStyle.emissiveIntensity || 0.5
        });
        const lamp = new THREE.Mesh(lampGeo, lampMat);
        lamp.position.y = 4.2;
        group.add(lamp);
        
        group.position.set(position.x, 0, position.z);
        this.scene.add(group);
        
        return group;
    }
    
    /**
     * 渲染岩石
     */
    renderRock(data) {
        const { id, type, position, style } = data;
        const rockStyle = this.styles.rock[style] || this.styles.rock.boulder;
        
        const rockGeo = new THREE.DodecahedronGeometry(0.8, 0);
        const rockMat = new THREE.MeshStandardMaterial({
            color: rockStyle.color,
            emissive: rockStyle.emissive,
            metalness: rockStyle.metalness,
            roughness: rockStyle.roughness
        });
        
        const rock = new THREE.Mesh(rockGeo, rockMat);
        rock.position.set(position.x, 0.3, position.z);
        rock.rotation.set(Math.random(), Math.random(), Math.random());
        rock.castShadow = true;
        
        this.scene.add(rock);
        return rock;
    }
    
    /**
     * 更新天气效果
     */
    updateWeather(weatherState) {
        const params = weatherState?.visualParams;
        if (!params) return;
        
        // 更新雾效果
        if (params.fog) {
            this.scene.fog = new THREE.Fog(params.fog.color, 0, 500);
            this.scene.fog.density = params.fog.density;
        }
        
        // 更新天空颜色
        if (params.sky) {
            this.scene.background = new THREE.Color(params.sky.color);
        }
    }
    
    /**
     * 更新光照（基于时间）
     */
    updateLighting(timeState) {
        if (!timeState) return;
        
        const lightLevel = timeState.lightLevel || 1.0;
        
        // 调整环境光
        const ambient = this.scene.children.find(c => c.type === 'AmbientLight');
        if (ambient) {
            ambient.intensity = lightLevel * 0.6;
        }
    }
    
    /**
     * 清理世界
     */
    dispose() {
        // 清理建筑
        this.buildings.forEach(mesh => {
            if (mesh.geometry) mesh.geometry.dispose();
            if (mesh.material) mesh.material.dispose();
            this.scene.remove(mesh);
        });
        this.buildings.clear();
        
        // 清理装饰物
        this.decorations.forEach(mesh => {
            if (mesh.geometry) mesh.geometry.dispose();
            if (mesh.material) {
                if (Array.isArray(mesh.material)) {
                    mesh.material.forEach(m => m.dispose());
                } else {
                    mesh.material.dispose();
                }
            }
            this.scene.remove(mesh);
        });
        this.decorations.clear();
        
        // 清理道路
        this.roads.forEach(mesh => {
            if (mesh.geometry) mesh.geometry.dispose();
            if (mesh.material) mesh.material.dispose();
            this.scene.remove(mesh);
        });
        this.roads.clear();
        
        // 清理地形
        this.terrainObjects.forEach(mesh => {
            if (mesh.geometry) mesh.geometry.dispose();
            if (mesh.material) mesh.material.dispose();
            this.scene.remove(mesh);
        });
        this.terrainObjects.clear();
        
        console.log('[WorldRenderer] 世界已清理');
    }
}

// 导出
export { WorldRenderer };
// window.WorldRenderer = WorldRenderer; // 已移除，使用 ES Module
