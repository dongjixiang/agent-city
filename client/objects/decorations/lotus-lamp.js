/**
 * Lotus Lamp - 莲花灯
 * 放在艺术展厅的水池中央，夜间自动亮起
 */
import * as THREE from 'three';

export class LotusLamp {
    constructor(x, z) {
        this.group = new THREE.Group();
        this.x = x || 0;
        this.z = z || 75; // 艺术展厅位置
        this.isLit = false;
        this.lights = [];
        
        this.create();
    }
    
    create() {
        // 底座 - 圆柱石台
        const baseGeo = new THREE.CylinderGeometry(1.5, 1.8, 1, 8);
        const baseMat = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.3, roughness: 0.7 });
        const base = new THREE.Mesh(baseGeo, baseMat);
        base.position.y = 0.5;
        this.group.add(base);
        
        // 莲花花瓣底座
        const petalBaseGeo = new THREE.CylinderGeometry(1.2, 1.5, 0.3, 12);
        const petalBaseMat = new THREE.MeshStandardMaterial({ color: 0x8B4513, metalness: 0.2, roughness: 0.6 });
        const petalBase = new THREE.Mesh(petalBaseGeo, petalBaseMat);
        petalBase.position.y = 1.15;
        this.group.add(petalBase);
        
        // 莲花瓣 - 分层张开
        const petalColors = [0xff6b8a, 0xffb6c1, 0xffc0cb, 0xffd1dc]; // 粉色渐变
        const petalMat = new THREE.MeshStandardMaterial({ 
            color: 0xff69b4, 
            emissive: 0xff69b4,
            emissiveIntensity: 0,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.9
        });
        
        // 花瓣层数
        const layers = [
            { count: 8, radius: 1.0, height: 1.5, angle: 15, petals: 5 },
            { count: 10, radius: 1.3, height: 1.8, angle: 25, petals: 6 },
            { count: 12, radius: 1.6, height: 2.1, angle: 35, petals: 7 },
        ];
        
        this.petalMeshes = [];
        
        layers.forEach((layer, layerIndex) => {
            for (let i = 0; i < layer.count; i++) {
                const angle = (i / layer.count) * Math.PI * 2;
                const petal = this.createPetal(petalMat, layer.radius, layer.petals, layer.angle);
                petal.position.x = Math.cos(angle) * (layer.radius * 0.3);
                petal.position.z = Math.sin(angle) * (layer.radius * 0.3);
                petal.position.y = layer.height;
                petal.rotation.z = (layer.angle * Math.PI) / 180;
                petal.rotation.y = angle;
                this.group.add(petal);
                this.petalMeshes.push(petal);
            }
        });
        
        // 中心莲蓬（光源）
        const centerGeo = new THREE.SphereGeometry(0.4, 16, 16);
        const centerMat = new THREE.MeshStandardMaterial({ 
            color: 0xffff00, 
            emissive: 0xffff00,
            emissiveIntensity: 0 
        });
        this.centerMesh = new THREE.Mesh(centerGeo, centerMat);
        this.centerMesh.position.y = 2.3;
        this.group.add(this.centerMesh);
        
        // 点光源 - 从莲蓬发出暖光
        this.mainLight = new THREE.PointLight(0xffaa44, 0, 15);
        this.mainLight.position.y = 2.5;
        this.group.add(this.mainLight);
        
        // 环境光（柔和的粉色光晕）
        this.ambientLight = new THREE.PointLight(0xff69b4, 0, 8);
        this.ambientLight.position.y = 2.0;
        this.group.add(this.ambientLight);
        
        this.lights.push(this.mainLight, this.ambientLight);
        
        // 设置位置
        this.group.position.set(this.x, 0, this.z);
        
        console.log('[LotusLamp] Created lotus lamp at', this.x, this.z);
    }
    
    createPetal(mat, length, width, bendAngle) {
        const shape = new THREE.Shape();
        shape.moveTo(0, 0);
        shape.bezierCurveTo(width * 0.5, length * 0.3, width * 0.6, length * 0.7, 0, length);
        shape.bezierCurveTo(-width * 0.6, length * 0.7, -width * 0.5, length * 0.3, 0, 0);
        
        const extrudeSettings = {
            steps: 1,
            depth: 0.05,
            bevelEnabled: true,
            bevelThickness: 0.02,
            bevelSize: 0.02,
            bevelSegments: 2
        };
        
        const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        const mesh = new THREE.Mesh(geo, mat.clone());
        return mesh;
    }
    
    // 根据夜间程度设置亮度（0-1）
    setIntensity(intensity) {
        intensity = Math.max(0, Math.min(1, intensity));
        
        if (this.mainLight) {
            this.mainLight.intensity = intensity * 2.0;
        }
        if (this.ambientLight) {
            this.ambientLight.intensity = intensity * 1.0;
        }
        if (this.centerMesh) {
            this.centerMesh.material.emissiveIntensity = intensity;
        }
        
        this.petalMeshes.forEach(petal => {
            petal.material.emissiveIntensity = intensity * 0.5;
        });
        
        this.isLit = intensity > 0.1;
    }
    
    getPosition() {
        return { x: this.x, y: 0, z: this.z };
    }
}

export default LotusLamp;
