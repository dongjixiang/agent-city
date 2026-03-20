/**
 * 任务可视化系统
 * 在3D场景中显示任务标记
 */

class TaskVisualization {
    constructor(scene) {
        this.scene = scene;
        this.taskMarkers = new Map();
    }

    // 创建任务标记
    createTaskMarker(task) {
        const group = new THREE.Group();
        
        // 根据任务类型选择颜色
        let color = 0x4ecdc4;
        if (task.status === 'completed') {
            color = 0x10b981; // 绿色 - 已完成
        } else if (task.status === 'in_progress') {
            color = 0xf59e0b; // 黄色 - 进行中
        } else if (task.status === 'open') {
            color = 0x3b82f6; // 蓝色 - 开放
        }
        
        // 创建任务图标（圆柱体底座）
        const baseGeom = new THREE.CylinderGeometry(0.5, 0.5, 0.2, 16);
        const baseMat = new THREE.MeshStandardMaterial({ 
            color: color,
            emissive: color,
            emissiveIntensity: 0.3
        });
        const base = new THREE.Mesh(baseGeom, baseMat);
        base.position.y = 0.1;
        group.add(base);
        
        // 创建发光柱
        const pillarGeom = new THREE.CylinderGeometry(0.2, 0.2, 3, 16);
        const pillarMat = new THREE.MeshStandardMaterial({ 
            color: color,
            emissive: color,
            emissiveIntensity: 0.5,
            transparent: true,
            opacity: 0.6
        });
        const pillar = new THREE.Mesh(pillarGeom, pillarMat);
        pillar.position.y = 1.5;
        group.add(pillar);
        
        // 创建顶部发光球
        const topGeom = new THREE.SphereGeometry(0.4, 16, 16);
        const topMat = new THREE.MeshBasicMaterial({ 
            color: color
        });
        const top = new THREE.Mesh(topGeom, topMat);
        top.position.y = 3.2;
        group.add(top);
        
        // 创建名字标签
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.roundRect(0, 0, 256, 64, 10);
        ctx.fill();
        
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(task.title || '任务', 128, 32);
        
        const texture = new THREE.CanvasTexture(canvas);
        const spriteMat = new THREE.SpriteMaterial({ map: texture });
        const sprite = new THREE.Sprite(spriteMat);
        sprite.scale.set(2, 0.5, 1);
        sprite.position.y = 4;
        group.add(sprite);
        
        // 随机位置（在任务中心附近）
        const angle = Math.random() * Math.PI * 2;
        const radius = 3 + Math.random() * 5;
        group.position.set(
            Math.cos(angle) * radius - 25,
            0,
            Math.sin(angle) * radius - 25
        );
        
        group.userData.taskId = task.id;
        
        this.scene.add(group);
        this.taskMarkers.set(task.id, group);
        
        return group;
    }
    
    // 更新任务状态
    updateTaskStatus(taskId, status) {
        const marker = this.taskMarkers.get(taskId);
        if (marker) {
            // 更新颜色
            let color = 0x4ecdc4;
            if (status === 'completed') {
                color = 0x10b981;
            } else if (status === 'in_progress') {
                color = 0xf59e0b;
            } else if (status === 'open') {
                color = 0x3b82f6;
            }
            
            marker.children.forEach(child => {
                if (child.material) {
                    child.material.color.setHex(color);
                    if (child.material.emissive) {
                        child.material.emissive.setHex(color);
                    }
                }
            });
        }
    }
    
    // 移除任务标记
    removeTaskMarker(taskId) {
        const marker = this.taskMarkers.get(taskId);
        if (marker) {
            this.scene.remove(marker);
            this.taskMarkers.delete(taskId);
        }
    }
    
    // 动画效果
    animate(time) {
        this.taskMarkers.forEach((marker, id) => {
            // 上下浮动
            marker.position.y = Math.sin(time * 0.003 + id) * 0.1;
            
            // 旋转发光球
            const top = marker.children[2];
            if (top) {
                top.rotation.y += 0.01;
            }
        });
    }
}

// 导出
window.TaskVisualization = TaskVisualization;
