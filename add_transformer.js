const fs = require('fs');
const path = 'C:/Users/swede/.openclaw/workspace-arch/agent-city/city-world/city-world-full.js';

let content = fs.readFileSync(path, 'utf8');
const oldText = '    // 龙虾动画';
const newText = `    // ============ 变形金刚 NPC ============
    let transformerNPC = null;
    let transformerState = {
        x: 40, z: 35, targetX: 40, targetZ: 35,
        speed: 3.0, isTransformed: true,
        transformTimer: 0, transformInterval: 8000,
        walkPhase: 0, waitTimer: 0, waitDuration: 2000,
    };
    const TRANSFORMER_PATROL_ROUTE = [
        { x: 40, z: 35 }, { x: 40, z: 65 }, { x: 65, z: 65 },
        { x: 65, z: 35 }, { x: 65, z: 5 }, { x: 15, z: 5 },
        { x: 15, z: 35 }, { x: -10, z: 35 }, { x: -10, z: 65 },
        { x: -50, z: 65 }, { x: -50, z: 35 }, { x: -10, z: 35 },
        { x: 40, z: 35 },
    ];

    function createTransformerMesh() {
        const group = new THREE.Group();
        const redMat = new THREE.MeshStandardMaterial({ color: 0xCC0000, metalness: 0.8, roughness: 0.3 });
        const blueMat = new THREE.MeshStandardMaterial({ color: 0x0033AA, metalness: 0.8, roughness: 0.3 });
        const silverMat = new THREE.MeshStandardMaterial({ color: 0xCCCCCC, metalness: 0.9, roughness: 0.2 });

        const torso = new THREE.Mesh(new THREE.BoxGeometry(1.8, 2.5, 1.0), redMat);
        torso.position.y = 3.5;
        group.add(torso);

        const head = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.0, 0.8), silverMat);
        head.position.y = 5.3;
        group.add(head);

        const eyeMat = new THREE.MeshBasicMaterial({ color: 0x00FFFF });
        const leftEye = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.15, 0.1), eyeMat);
        leftEye.position.set(-0.25, 5.4, 0.4);
        group.add(leftEye);
        const rightEye = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.15, 0.1), eyeMat);
        rightEye.position.set(0.25, 5.4, 0.4);
        group.add(rightEye);

        const antenna = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.6, 0.1), silverMat);
        antenna.position.set(0, 6.0, 0);
        group.add(antenna);

        const leftShoulder = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.6, 0.8), blueMat);
        leftShoulder.position.set(-1.3, 4.5, 0);
        group.add(leftShoulder);
        const rightShoulder = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.6, 0.8), blueMat);
        rightShoulder.position.set(1.3, 4.5, 0);
        group.add(rightShoulder);

        const leftArm = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.8, 0.5), redMat);
        leftArm.position.set(-1.3, 3.0, 0);
        group.add(leftArm);
        const rightArm = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.8, 0.5), redMat);
        rightArm.position.set(1.3, 3.0, 0);
        group.add(rightArm);

        const leftFist = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.4), silverMat);
        leftFist.position.set(-1.3, 1.8, 0);
        group.add(leftFist);
        const rightFist = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.4), silverMat);
        rightFist.position.set(1.3, 1.8, 0);
        group.add(rightFist);

        const leftThigh = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.5, 0.6), blueMat);
        leftThigh.position.set(-0.5, 1.5, 0);
        group.add(leftThigh);
        const rightThigh = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.5, 0.6), blueMat);
        rightThigh.position.set(0.5, 1.5, 0);
        group.add(rightThigh);

        const leftCalf = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.2, 0.5), silverMat);
        leftCalf.position.set(-0.5, 0.0, 0);
        group.add(leftCalf);
        const rightCalf = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.2, 0.5), silverMat);
        rightCalf.position.set(0.5, 0.0, 0);
        group.add(rightCalf);

        const coreMat = new THREE.MeshBasicMaterial({ color: 0xFF6600 });
        const core = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.2), coreMat);
        core.position.set(0, 3.8, 0.5);
        group.add(core);

        group.userData.bones = { leftArm, rightArm, leftThigh, rightThigh, leftCalf, rightCalf };
        return group;
    }

    function initTransformer() {
        transformerNPC = createTransformerMesh();
        transformerNPC.position.set(transformerState.x, 0, transformerState.z);
        scene.add(transformerNPC);
        const firstTarget = TRANSFORMER_PATROL_ROUTE[0];
        transformerState.targetX = firstTarget.x;
        transformerState.targetZ = firstTarget.z;
        console.log('[Transformer] 变形金刚已加入城市巡逻！');
    }

    function updateTransformer(dt) {
        if (!transformerNPC) return;
        const state = transformerState;
        state.transformTimer += dt * 1000;

        if (state.transformTimer >= state.transformInterval) {
            state.transformTimer = 0;
            state.isTransformed = !state.isTransformed;
            transformerNPC.scale.set(
                state.isTransformed ? 1.0 : 0.8,
                state.isTransformed ? 1.0 : 0.8,
                state.isTransformed ? 1.0 : 0.8
            );
            console.log('[Transformer] 变形！形态:', state.isTransformed ? '机器人' : '载具');
        }

        const dx = state.targetX - transformerNPC.position.x;
        const dz = state.targetZ - transformerNPC.position.z;
        const dist = Math.sqrt(dx * dx + dz * dz);

        if (dist < 0.5) {
            state.waitTimer += dt * 1000;
            if (state.waitTimer >= state.waitDuration) {
                state.waitTimer = 0;
                let currentIdx = 0;
                for (let i = 0; i < TRANSFORMER_PATROL_ROUTE.length; i++) {
                    const p = TRANSFORMER_PATROL_ROUTE[i];
                    if (Math.abs(p.x - state.targetX) < 1 && Math.abs(p.z - state.targetZ) < 1) {
                        currentIdx = i;
                        break;
                    }
                }
                const nextIdx = (currentIdx + 1) % TRANSFORMER_PATROL_ROUTE.length;
                const next = TRANSFORMER_PATROL_ROUTE[nextIdx];
                state.targetX = next.x;
                state.targetZ = next.z;
            }
        } else {
            const speed = state.speed;
            transformerNPC.position.x += (dx / dist) * speed * dt;
            transformerNPC.position.z += (dz / dist) * speed * dt;
            transformerNPC.rotation.y = Math.atan2(dx, dz);
            state.walkPhase += dt * 6;
            const swing = Math.sin(state.walkPhase) * 0.3;
            if (state.isTransformed && transformerNPC.userData.bones) {
                const bones = transformerNPC.userData.bones;
                if (bones.leftThigh) bones.leftThigh.rotation.x = -swing;
                if (bones.rightThigh) bones.rightThigh.rotation.x = swing;
                if (bones.leftArm) bones.leftArm.rotation.x = swing * 0.7;
                if (bones.rightArm) bones.rightArm.rotation.x = -swing * 0.7;
            }
        }
        transformerNPC.position.y = Math.sin(Date.now() * 0.003) * 0.05;
    }

    // ============ 龙虾动画 ============`;

if (!content.includes(oldText)) {
    console.log('ERROR: oldText not found in file');
    console.log('Looking for:', oldText);
    process.exit(1);
}

content = content.replace(oldText, newText);
fs.writeFileSync(path, content, 'utf8');
console.log('Done! Transformer NPC added.');