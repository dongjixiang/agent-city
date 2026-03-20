/**
 * 鼠标点击处理器
 * 需要在city-world-full.js之后加载
 */

// 添加全局点击事件监听
window.addEventListener('click', function(event) {
    // 如果没有raycaster或mouse，说明还没初始化
    if (typeof raycaster === 'undefined' || typeof mouse === 'undefined') {
        return;
    }
    
    // 计算鼠标位置
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
    // 更新射线
    raycaster.setFromCamera(mouse, camera);
    
    // 检测与智能体的交叉
    const agentMeshes = [];
    if (typeof agents !== 'undefined') {
        agents.forEach((data) => {
            agentMeshes.push(data.mesh);
        });
    }
    
    const intersects = raycaster.intersectObjects(agentMeshes, true);
    
    if (intersects.length > 0) {
        // 找到被点击的智能体
        let clickedMesh = intersects[0].object;
        
        // 向上查找父级，直到找到智能体的group
        while (clickedMesh.parent && !clickedMesh.userData.agentId) {
            clickedMesh = clickedMesh.parent;
        }
        
        if (clickedMesh.userData.agentId) {
            const agentData = agents.get(clickedMesh.userData.agentId);
            if (agentData && typeof agentDetailPanel !== 'undefined') {
                console.log('👆 点击了智能体:', agentData.data.name);
                agentDetailPanel.show(agentData.data);
            }
        }
    }
});
