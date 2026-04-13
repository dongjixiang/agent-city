/**
 * Buildings - Optimized 3D buildings with distinct functional styles
 */

import * as THREE from 'three';

// ============ LIBRARY - Classic monument style with columns ============
export function createLibraryBuilding(x, z) {
    const group = new THREE.Group();
    
    // Stone base platform
    const base = new THREE.Mesh(
        new THREE.BoxGeometry(14, 1, 12),
        new THREE.MeshStandardMaterial({ color: 0xd4c4a8 })
    );
    base.position.y = 0.5;
    group.add(base);
    
    // Main building body
    const body = new THREE.Mesh(
        new THREE.BoxGeometry(12, 10, 10),
        new THREE.MeshStandardMaterial({ color: 0xf5f5dc })
    );
    body.position.y = 6;
    group.add(body);
    
    // Columns (front and back)
    const columnMat = new THREE.MeshStandardMaterial({ color: 0xe8dcc8 });
    for (let i = -2; i <= 2; i++) {
        const col = new THREE.Mesh(
            new THREE.CylinderGeometry(0.5, 0.5, 6, 8),
            columnMat
        );
        col.position.set(i * 2.5, 5, 5.2);
        group.add(col);
        
        const colBack = col.clone();
        colBack.position.z = -5.2;
        group.add(colBack);
    }
    
    // Triangle pediment (front)
    const pediment = new THREE.Mesh(
        new THREE.ConeGeometry(8, 3, 3),
        new THREE.MeshStandardMaterial({ color: 0x8b4513 })
    );
    pediment.position.set(0, 11.5, 5);
    pediment.rotation.x = Math.PI;
    group.add(pediment);
    
    // Flat roof
    const roof = new THREE.Mesh(
        new THREE.BoxGeometry(12, 0.5, 10),
        new THREE.MeshStandardMaterial({ color: 0x696969 })
    );
    roof.position.y = 11;
    group.add(roof);
    
    // Dome on top
    const dome = new THREE.Mesh(
        new THREE.SphereGeometry(3, 12, 12, 0, Math.PI * 2, 0, Math.PI / 2),
        new THREE.MeshStandardMaterial({ color: 0x8b4513 })
    );
    dome.position.y = 11.5;
    group.add(dome);
    
    // Steps
    for (let i = 0; i < 3; i++) {
        const step = new THREE.Mesh(
            new THREE.BoxGeometry(10 - i * 1, 0.3, 1),
            new THREE.MeshStandardMaterial({ color: 0xc4b498 })
        );
        step.position.set(0, 0.15 + i * 0.3, 6 + i * 0.5);
        group.add(step);
    }
    
    group.position.set(x, 0, z);
    return group;
}

// ============ WORKSHOP - Industrial with chimney ============
export function createWorkshopBuilding(x, z) {
    const group = new THREE.Group();
    
    // Main factory building
    const body = new THREE.Mesh(
        new THREE.BoxGeometry(14, 8, 10),
        new THREE.MeshStandardMaterial({ color: 0x8b7355 })
    );
    body.position.y = 4;
    group.add(body);
    
    // Sawtooth roof
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x4a4a4a });
    for (let i = 0; i < 3; i++) {
        const roofPanel = new THREE.Mesh(
            new THREE.BoxGeometry(5, 0.3, 10),
            roofMat
        );
        roofPanel.position.set(-2 + i * 5, 8 + i * 1.5, 0);
        roofPanel.rotation.z = 0.3;
        group.add(roofPanel);
    }
    
    // Chimney
    const chimney = new THREE.Mesh(
        new THREE.CylinderGeometry(0.8, 1, 6, 8),
        new THREE.MeshStandardMaterial({ color: 0x654321 })
    );
    chimney.position.set(5, 11, -3);
    group.add(chimney);
    
    // Smoke
    const smokeMat = new THREE.MeshStandardMaterial({ 
        color: 0x888888, 
        transparent: true, 
        opacity: 0.6 
    });
    for (let i = 0; i < 3; i++) {
        const smoke = new THREE.Mesh(
            new THREE.SphereGeometry(0.5 + i * 0.3, 8, 8),
            smokeMat
        );
        smoke.position.set(5, 14 + i * 1, -3);
        group.add(smoke);
    }
    
    // Large door
    const door = new THREE.Mesh(
        new THREE.BoxGeometry(4, 5, 0.3),
        new THREE.MeshStandardMaterial({ color: 0x3d2817 })
    );
    door.position.set(0, 2.5, 5.1);
    group.add(door);
    
    // Windows
    const winMat = new THREE.MeshStandardMaterial({ color: 0x87ceeb });
    for (let side of [-1, 1]) {
        for (let i = 0; i < 2; i++) {
            const win = new THREE.Mesh(
                new THREE.BoxGeometry(2, 2, 0.2),
                winMat
            );
            win.position.set(side * 3, 5, 5.1);
            group.add(win);
        }
    }
    
    // Workshop sign
    const sign = new THREE.Mesh(
        new THREE.BoxGeometry(6, 1, 0.3),
        new THREE.MeshStandardMaterial({ color: 0x5a4030 })
    );
    sign.position.set(0, 9, 5.2);
    group.add(sign);
    
    group.position.set(x, 0, z);
    return group;
}

// ============ MESSAGE STATION - Communication tower ============
export function createMessageStationBuilding(x, z) {
    const group = new THREE.Group();
    
    // Base platform
    const base = new THREE.Mesh(
        new THREE.CylinderGeometry(5, 6, 2, 8),
        new THREE.MeshStandardMaterial({ color: 0x696969 })
    );
    base.position.y = 1;
    group.add(base);
    
    // Main tower body
    const tower = new THREE.Mesh(
        new THREE.CylinderGeometry(2, 3, 12, 8),
        new THREE.MeshStandardMaterial({ color: 0x8b7355 })
    );
    tower.position.y = 7;
    group.add(tower);
    
    // Antenna dishes
    const dishMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.8 });
    for (let i = 0; i < 3; i++) {
        const angle = (i / 3) * Math.PI * 2;
        const dish = new THREE.Mesh(
            new THREE.SphereGeometry(1.5, 8, 8, 0, Math.PI),
            dishMat
        );
        dish.position.set(Math.cos(angle) * 3, 10 + i * 2, Math.sin(angle) * 3);
        dish.rotation.x = Math.PI / 4;
        dish.rotation.y = -angle;
        group.add(dish);
    }
    
    // Top antenna
    const antenna = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.2, 5, 6),
        new THREE.MeshStandardMaterial({ color: 0xff4444 })
    );
    antenna.position.y = 18;
    group.add(antenna);
    
    // Blinking light
    const light = new THREE.Mesh(
        new THREE.SphereGeometry(0.3, 8, 8),
        new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 1 })
    );
    light.position.y = 20.5;
    group.add(light);
    
    group.position.set(x, 0, z);
    return group;
}

// ============ ART GALLERY - Modern glass pavilion ============
export function createArtGalleryBuilding(x, z) {
    const group = new THREE.Group();
    
    // Reflection pool
    const pool = new THREE.Mesh(
        new THREE.BoxGeometry(18, 0.3, 14),
        new THREE.MeshStandardMaterial({ color: 0x4a90a4, transparent: true, opacity: 0.7 })
    );
    pool.position.y = 0.15;
    group.add(pool);
    
    // Main glass building (floating)
    const glassBody = new THREE.Mesh(
        new THREE.BoxGeometry(14, 8, 10),
        new THREE.MeshStandardMaterial({ 
            color: 0xffffff,
            metalness: 0.9,
            roughness: 0.1,
            transparent: true,
            opacity: 0.8
        })
    );
    glassBody.position.y = 5;
    group.add(glassBody);
    
    // Steel frame
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.9 });
    
    // Vertical frames
    for (let x = -5; x <= 5; x += 2.5) {
        const frame = new THREE.Mesh(
            new THREE.BoxGeometry(0.2, 8, 0.2),
            frameMat
        );
        frame.position.set(x, 5, 5);
        group.add(frame);
        
        const frameBack = frame.clone();
        frameBack.position.z = -5;
        group.add(frameBack);
    }
    
    // Horizontal frames
    for (let y = 2; y <= 8; y += 2) {
        const hFrame = new THREE.Mesh(
            new THREE.BoxGeometry(14, 0.15, 0.15),
            frameMat
        );
        hFrame.position.set(0, y, 5);
        group.add(hFrame);
        
        const hFrameBack = hFrame.clone();
        hFrameBack.position.z = -5;
        group.add(hFrameBack);
    }
    
    // Roof overhang
    const roof = new THREE.Mesh(
        new THREE.BoxGeometry(16, 0.5, 12),
        new THREE.MeshStandardMaterial({ color: 0x222222 })
    );
    roof.position.y = 9.5;
    group.add(roof);
    
    // Art sculptures in front
    const sculptureMat = new THREE.MeshStandardMaterial({ color: 0xff6b6b });
    const sculpture1 = new THREE.Mesh(
        new THREE.SphereGeometry(1.5, 12, 12),
        sculptureMat
    );
    sculpture1.position.set(-6, 1.5, 8);
    group.add(sculpture1);
    
    const sculpture2 = new THREE.Mesh(
        new THREE.BoxGeometry(2, 3, 2),
        new THREE.MeshStandardMaterial({ color: 0x4ecdc4 })
    );
    sculpture2.position.set(6, 1.5, 8);
    group.add(sculpture2);
    
    group.position.set(x, 0, z);
    return group;
}

// ============ ARCHIVE - Monumental stone building ============
export function createArchiveBuilding(x, z) {
    const group = new THREE.Group();
    
    // Grand stairs
    for (let i = 0; i < 4; i++) {
        const step = new THREE.Mesh(
            new THREE.BoxGeometry(16 - i * 0.5, 0.5, 1.5),
            new THREE.MeshStandardMaterial({ color: 0xa09080 })
        );
        step.position.set(0, 0.25 + i * 0.5, 6 + i * 1.5);
        group.add(step);
    }
    
    // Main building
    const body = new THREE.Mesh(
        new THREE.BoxGeometry(14, 12, 12),
        new THREE.MeshStandardMaterial({ color: 0xd4c4b4 })
    );
    body.position.y = 7;
    group.add(body);
    
    // Columns
    const colMat = new THREE.MeshStandardMaterial({ color: 0xc8b8a8 });
    for (let i = -2; i <= 2; i++) {
        const col = new THREE.Mesh(
            new THREE.CylinderGeometry(0.6, 0.7, 7, 8),
            colMat
        );
        col.position.set(i * 3, 10.5, 6.5);
        group.add(col);
        
        const colBack = col.clone();
        colBack.position.z = -6.5;
        group.add(colBack);
    }
    
    // Triangle roof
    const roofGeo = new THREE.BufferGeometry();
    const roofVerts = [];
    const roofSize = 8;
    roofVerts.push(-roofSize, 0, 0);
    roofVerts.push(roofSize, 0, 0);
    roofVerts.push(0, roofSize * 0.8, 0);
    roofGeo.setAttribute('position', new THREE.Float32BufferAttribute(roofVerts, 3));
    roofGeo.computeVertexNormals();
    const roof = new THREE.Mesh(
        roofGeo,
        new THREE.MeshStandardMaterial({ color: 0x5a4a3a })
    );
    roof.position.set(0, 14, 6.5);
    group.add(roof);
    
    // Archive text plaque
    const plaque = new THREE.Mesh(
        new THREE.BoxGeometry(4, 1.5, 0.3),
        new THREE.MeshStandardMaterial({ color: 0x8b7355 })
    );
    plaque.position.set(0, 5, 6.8);
    group.add(plaque);
    
    group.position.set(x, 0, z);
    return group;
}

// ============ TASK CENTER - Modern office complex ============
export function createTaskCenterBuilding(x, z) {
    const group = new THREE.Group();
    
    // Main tower
    const tower = new THREE.Mesh(
        new THREE.BoxGeometry(10, 15, 8),
        new THREE.MeshStandardMaterial({ color: 0x4a5568 })
    );
    tower.position.y = 7.5;
    group.add(tower);
    
    // Glass curtain wall
    const glass = new THREE.Mesh(
        new THREE.BoxGeometry(9.5, 14, 7.5),
        new THREE.MeshStandardMaterial({ 
            color: 0x87ceeb, 
            transparent: true, 
            opacity: 0.4,
            metalness: 0.8,
            roughness: 0.2
        })
    );
    glass.position.y = 7.5;
    group.add(glass);
    
    // Window grid
    const winMat = new THREE.MeshStandardMaterial({ color: 0x1a202c });
    for (let row = 0; row < 5; row++) {
        for (let col of [-1, 0, 1]) {
            const win = new THREE.Mesh(
                new THREE.BoxGeometry(2, 1.5, 0.1),
                winMat
            );
            win.position.set(col * 3, 3 + row * 3, 4);
            group.add(win);
        }
    }
    
    // Entrance canopy
    const canopy = new THREE.Mesh(
        new THREE.BoxGeometry(6, 0.3, 4),
        new THREE.MeshStandardMaterial({ color: 0x2d3748 })
    );
    canopy.position.set(0, 2.5, 5.5);
    group.add(canopy);
    
    // Entrance
    const entrance = new THREE.Mesh(
        new THREE.BoxGeometry(3, 3, 0.5),
        new THREE.MeshStandardMaterial({ color: 0x1a1a1a })
    );
    entrance.position.set(0, 1.5, 4.2);
    group.add(entrance);
    
    // Side wing
    const wing = new THREE.Mesh(
        new THREE.BoxGeometry(5, 8, 6),
        new THREE.MeshStandardMaterial({ color: 0x5a6577 })
    );
    wing.position.set(7, 4, 0);
    group.add(wing);
    
    group.position.set(x, 0, z);
    return group;
}

// ============ DATA CENTER - Tech server building ============
export function createDataCenterBuilding(x, z) {
    const group = new THREE.Group();
    
    // Server building
    const server = new THREE.Mesh(
        new THREE.BoxGeometry(14, 8, 10),
        new THREE.MeshStandardMaterial({ color: 0x228b22 })
    );
    server.position.y = 4;
    group.add(server);
    
    // Server racks (LED pattern)
    const ledMat = new THREE.MeshStandardMaterial({ color: 0x00ff00, emissive: 0x00ff00, emissiveIntensity: 0.5 });
    for (let row = 0; row < 4; row++) {
        for (let col = -2; col <= 2; col++) {
            const led = new THREE.Mesh(
                new THREE.BoxGeometry(0.5, 0.3, 0.1),
                ledMat
            );
            led.position.set(col * 2.5, 1 + row * 1.8, 5.05);
            group.add(led);
        }
    }
    
    // Cooling towers
    for (let side of [-4, 4]) {
        const cooler = new THREE.Mesh(
            new THREE.CylinderGeometry(1.5, 2, 10, 8),
            new THREE.MeshStandardMaterial({ color: 0x3a3a3a })
        );
        cooler.position.set(side, 5, -3);
        group.add(cooler);
        
        // Fan on top
        const fan = new THREE.Mesh(
            new THREE.CylinderGeometry(1.2, 1.2, 0.5, 8),
            new THREE.MeshStandardMaterial({ color: 0x555555 })
        );
        fan.position.set(side, 10.5, -3);
        group.add(fan);
    }
    
    // Satellite dish
    const dish = new THREE.Mesh(
        new THREE.SphereGeometry(1, 8, 8, 0, Math.PI),
        new THREE.MeshStandardMaterial({ color: 0xcccccc })
    );
    dish.position.set(0, 10, -5);
    dish.rotation.x = -Math.PI / 3;
    group.add(dish);
    
    // Green roof garden
    const garden = new THREE.Mesh(
        new THREE.BoxGeometry(12, 0.5, 8),
        new THREE.MeshStandardMaterial({ color: 0x32cd32 })
    );
    garden.position.y = 8.25;
    group.add(garden);
    
    group.position.set(x, 0, z);
    return group;
}

// ============ REPUTATION TOWER - Golden landmark tower ============
export function createReputationTower(x, z) {
    const group = new THREE.Group();
    
    // Stone base platform
    const base = new THREE.Mesh(
        new THREE.CylinderGeometry(6, 7, 2, 8),
        new THREE.MeshStandardMaterial({ color: 0xffd700 })
    );
    base.position.y = 1;
    group.add(base);
    
    // First level
    const level1 = new THREE.Mesh(
        new THREE.CylinderGeometry(4, 5, 6, 8),
        new THREE.MeshStandardMaterial({ color: 0xffec8b })
    );
    level1.position.y = 5;
    group.add(level1);
    
    // Second level
    const level2 = new THREE.Mesh(
        new THREE.CylinderGeometry(3, 4, 8, 8),
        new THREE.MeshStandardMaterial({ color: 0xffd700 })
    );
    level2.position.y = 12;
    group.add(level2);
    
    // Third level (main shaft)
    const shaft = new THREE.Mesh(
        new THREE.CylinderGeometry(2, 3, 12, 8),
        new THREE.MeshStandardMaterial({ 
            color: 0xffd700,
            emissive: 0xffaa00,
            emissiveIntensity: 0.3
        })
    );
    shaft.position.y = 22;
    group.add(shaft);
    
    // Crown structure
    const crown = new THREE.Mesh(
        new THREE.CylinderGeometry(3, 2, 4, 8),
        new THREE.MeshStandardMaterial({ color: 0xffd700 })
    );
    crown.position.y = 30;
    group.add(crown);
    
    // Star on top
    const starMat = new THREE.MeshStandardMaterial({ 
        color: 0xffff00,
        emissive: 0xffff00,
        emissiveIntensity: 1
    });
    
    // Spokes
    for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const spoke = new THREE.Mesh(
            new THREE.BoxGeometry(0.3, 0.3, 4),
            starMat
        );
        spoke.position.set(Math.cos(angle) * 2, 33, Math.sin(angle) * 2);
        spoke.rotation.y = -angle;
        group.add(spoke);
    }
    
    // Center sphere
    const center = new THREE.Mesh(
        new THREE.SphereGeometry(1, 12, 12),
        starMat
    );
    center.position.y = 33;
    group.add(center);
    
    // Golden glow ring
    const glowRing = new THREE.Mesh(
        new THREE.TorusGeometry(4, 0.3, 8, 16),
        new THREE.MeshStandardMaterial({ 
            color: 0xffd700,
            emissive: 0xffaa00,
            emissiveIntensity: 0.5
        })
    );
    glowRing.position.y = 28;
    group.add(glowRing);
    
    // Decorative banners
    const bannerMat = new THREE.MeshStandardMaterial({ color: 0xff4444 });
    for (let i = 0; i < 4; i++) {
        const angle = (i / 4) * Math.PI * 2 + Math.PI / 4;
        const banner = new THREE.Mesh(
            new THREE.BoxGeometry(0.3, 3, 0.1),
            bannerMat
        );
        banner.position.set(Math.cos(angle) * 3.5, 6, Math.sin(angle) * 3.5);
        group.add(banner);
    }
    
    group.position.set(x, 0, z);
    return group;
}

// ============ SKILL ACADEMY - Tower school building ============
export function createSkillAcademyBuilding(x, z) {
    const group = new THREE.Group();
    
    // Main tower
    const tower = new THREE.Mesh(
        new THREE.CylinderGeometry(4, 5, 14, 8),
        new THREE.MeshStandardMaterial({ color: 0x8b4513 })
    );
    tower.position.y = 7;
    group.add(tower);
    
    // Book stack layers
    const bookColors = [0xff0000, 0x0000ff, 0x00ff00, 0xffff00, 0xff00ff];
    for (let i = 0; i < 5; i++) {
        const book = new THREE.Mesh(
            new THREE.CylinderGeometry(3 - i * 0.3, 4 - i * 0.3, 2, 8),
            new THREE.MeshStandardMaterial({ color: bookColors[i] })
        );
        book.position.y = 14 + i * 2.5;
        group.add(book);
    }
    
    // Clock on tower
    const clockRing = new THREE.Mesh(
        new THREE.TorusGeometry(1.5, 0.2, 8, 16),
        new THREE.MeshStandardMaterial({ color: 0xffd700 })
    );
    clockRing.position.set(0, 10, 4.1);
    group.add(clockRing);
    
    const clockFace = new THREE.Mesh(
        new THREE.CircleGeometry(1.3, 16),
        new THREE.MeshStandardMaterial({ color: 0xfffff0 })
    );
    clockFace.position.set(0, 10, 4.2);
    group.add(clockFace);
    
    // Clock hands
    const hourHand = new THREE.Mesh(
        new THREE.BoxGeometry(0.1, 0.7, 0.1),
        new THREE.MeshStandardMaterial({ color: 0x333333 })
    );
    hourHand.position.set(0.2, 10, 4.3);
    hourHand.rotation.z = -Math.PI / 4;
    group.add(hourHand);
    
    const minuteHand = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 1, 0.1),
        new THREE.MeshStandardMaterial({ color: 0x333333 })
    );
    minuteHand.position.set(0, 10.3, 4.3);
    minuteHand.rotation.z = Math.PI / 3;
    group.add(minuteHand);
    
    // Wings on sides
    const wingMat = new THREE.MeshStandardMaterial({ color: 0xa0522d });
    
    const leftWing = new THREE.Mesh(
        new THREE.BoxGeometry(6, 5, 8),
        wingMat
    );
    leftWing.position.set(-7, 2.5, 0);
    group.add(leftWing);
    
    const rightWing = new THREE.Mesh(
        new THREE.BoxGeometry(6, 5, 8),
        wingMat
    );
    rightWing.position.set(7, 2.5, 0);
    group.add(rightWing);
    
    // Windows on wings
    const winMat = new THREE.MeshStandardMaterial({ color: 0x87ceeb });
    for (let row = 0; row < 2; row++) {
        for (let col = 0; col < 3; col++) {
            const win = new THREE.Mesh(
                new THREE.BoxGeometry(1, 1.5, 0.2),
                winMat
            );
            win.position.set(-8 + col * 2.5, 2 + row * 2, 4.1);
            group.add(win);
            
            const winRight = win.clone();
            winRight.position.set(6 + col * 2.5, 2 + row * 2, 4.1);
            group.add(winRight);
        }
    }
    
    // Entrance steps
    for (let i = 0; i < 3; i++) {
        const step = new THREE.Mesh(
            new THREE.BoxGeometry(6 - i * 0.5, 0.4, 1),
            new THREE.MeshStandardMaterial({ color: 0x696969 })
        );
        step.position.set(0, 0.2 + i * 0.4, 5 + i * 1);
        group.add(step);
    }
    
    group.position.set(x, 0, z);
    return group;
}

// ============ DIVERSE URBAN RESIDENTIAL - Various colors and styles ============
export function createDiverseUrbanBuilding(x, z) {
    const group = new THREE.Group();
    
    // Random building style
    const style = Math.floor(Math.random() * 4);
    const colors = [
        { body: 0x8b7355, roof: 0x654321 },  // Brown townhouse
        { body: 0xcd853f, roof: 0x8b4513 },  // Peru/warm
        { body: 0x6b8e23, roof: 0x3d5a3d },   // Olive/eco
        { body: 0x4682b4, roof: 0x2f4f4f },   // Steel blue
        { body: 0xb8860b, roof: 0x8b4513 },   // Dark goldenrod
        { body: 0x8fbc8f, roof: 0x556b2f },  // Dark sea green
        { body: 0xcd5c5c, roof: 0x8b0000 },   // Indian red
        { body: 0x5f9ea0, roof: 0x2f4f4f },   // Cadet blue
        { body: 0xdaa520, roof: 0x8b4513 },   // Goldenrod
        { body: 0xbc8f8f, roof: 0x8b7377 },  // Rosy brown
    ];
    const colorSet = colors[Math.floor(Math.random() * colors.length)];
    
    // Height variation
    const height = 6 + Math.random() * 8;
    
    // Building body
    const body = new THREE.Mesh(
        new THREE.BoxGeometry(6, height, 5),
        new THREE.MeshStandardMaterial({ color: colorSet.body })
    );
    body.position.y = height / 2;
    group.add(body);
    
    // Window variation
    const windowColors = [0x87ceeb, 0xadd8e6, 0xb0c4de, 0xafeeee];
    const winColor = windowColors[Math.floor(Math.random() * windowColors.length)];
    const winMat = new THREE.MeshStandardMaterial({ color: winColor });
    
    const winRows = Math.floor(height / 2.5);
    for (let row = 0; row < winRows; row++) {
        for (let col of [-1, 0, 1]) {
            const win = new THREE.Mesh(
                new THREE.BoxGeometry(0.8, 1, 0.1),
                winMat
            );
            win.position.set(col * 1.8, 2 + row * 2.5, 2.55);
            group.add(win);
        }
    }
    
    // Roof style based on random
    if (style === 0) {
        // Flat roof with parapet
        const roof = new THREE.Mesh(
            new THREE.BoxGeometry(6.5, 0.8, 5.5),
            new THREE.MeshStandardMaterial({ color: 0x333333 })
        );
        roof.position.y = height + 0.4;
        group.add(roof);
    } else if (style === 1) {
        // Sloped roof
        const roof = new THREE.Mesh(
            new THREE.BoxGeometry(7, 0.5, 6),
            new THREE.MeshStandardMaterial({ color: colorSet.roof })
        );
        roof.position.y = height + 0.5;
        roof.rotation.z = 0.1;
        group.add(roof);
    } else if (style === 2) {
        // Rounded dome top
        const dome = new THREE.Mesh(
            new THREE.SphereGeometry(3, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2),
            new THREE.MeshStandardMaterial({ color: colorSet.roof })
        );
        dome.position.y = height;
        group.add(dome);
    } else {
        // Terraced roof
        const roof = new THREE.Mesh(
            new THREE.BoxGeometry(6, 0.4, 5),
            new THREE.MeshStandardMaterial({ color: colorSet.roof })
        );
        roof.position.y = height + 0.2;
        group.add(roof);
        
        const topFloor = new THREE.Mesh(
            new THREE.BoxGeometry(5, 2, 4),
            new THREE.MeshStandardMaterial({ color: colorSet.body })
        );
        topFloor.position.y = height - 1;
        group.add(topFloor);
    }
    
    // Entrance variation
    if (style === 1 || style === 2) {
        const entrance = new THREE.Mesh(
            new THREE.BoxGeometry(2, 2.5, 0.3),
            new THREE.MeshStandardMaterial({ color: 0x2f1810 })
        );
        entrance.position.set(0, 1.25, 2.6);
        group.add(entrance);
    }
    
    // Small balcony
    if (Math.random() > 0.5) {
        const balcony = new THREE.Mesh(
            new THREE.BoxGeometry(1.5, 0.1, 1),
            new THREE.MeshStandardMaterial({ color: 0x8b7355 })
        );
        balcony.position.set(1.5, height * 0.6, 2.7);
        group.add(balcony);
    }
    
    // Ground plaza
    const plaza = new THREE.Mesh(
        new THREE.BoxGeometry(8, 0.2, 4),
        new THREE.MeshStandardMaterial({ color: 0x555555 })
    );
    plaza.position.set(0, 0.1, 3);
    group.add(plaza);
    
    group.position.set(x, 0, z);
    return group;
}

// ============ LEGACY FUNCTIONS (kept for compatibility) ============

export function createBuilding(x, z, width, height, color) {
    const group = new THREE.Group();
    
    const body = new THREE.Mesh(
        new THREE.BoxGeometry(width, height, width * 0.8),
        new THREE.MeshStandardMaterial({ color })
    );
    body.position.y = height / 2;
    group.add(body);
    
    const roof = new THREE.Mesh(
        new THREE.ConeGeometry(width * 0.7, height * 0.3, 4),
        new THREE.MeshStandardMaterial({ color: 0xb22222 })
    );
    roof.position.y = height + height * 0.15;
    roof.rotation.y = Math.PI / 4;
    group.add(roof);
    
    group.position.set(x, 0, z);
    return group;
}

export function createDomeBuilding(x, z, domeColor, baseSize, baseHeight) {
    const group = new THREE.Group();
    
    const base = new THREE.Mesh(
        new THREE.CylinderGeometry(baseSize, baseSize, baseHeight, 12),
        new THREE.MeshStandardMaterial({ color: 0xcccccc })
    );
    base.position.y = baseHeight / 2;
    group.add(base);
    
    const dome = new THREE.Mesh(
        new THREE.SphereGeometry(baseSize * 0.8, 12, 12, 0, Math.PI * 2, 0, Math.PI / 2),
        new THREE.MeshStandardMaterial({ color: domeColor })
    );
    dome.position.y = baseHeight;
    group.add(dome);
    
    group.position.set(x, 0, z);
    return group;
}

export function createTower(x, z, height, color, isGolden = false) {
    const group = new THREE.Group();
    const size = 3;
    
    const body = new THREE.Mesh(
        new THREE.CylinderGeometry(size, size * 1.2, height, 8),
        new THREE.MeshStandardMaterial({ 
            color: isGolden ? 0xffd700 : color,
            emissive: isGolden ? 0xffaa00 : 0x000000,
            emissiveIntensity: isGolden ? 0.3 : 0
        })
    );
    body.position.y = height / 2;
    group.add(body);
    
    const top = new THREE.Mesh(
        new THREE.ConeGeometry(size * 0.8, height * 0.3, 8),
        new THREE.MeshStandardMaterial({ 
            color: isGolden ? 0xffd700 : 0xb22222,
            emissive: isGolden ? 0xffaa00 : 0x000000,
            emissiveIntensity: isGolden ? 0.4 : 0
        })
    );
    top.position.y = height + height * 0.15;
    group.add(top);
    
    group.position.set(x, 0, z);
    return group;
}

export function createGlassBuilding(x, z, width, depth) {
    const group = new THREE.Group();
    
    const frame = new THREE.Mesh(
        new THREE.BoxGeometry(width, 8, depth),
        new THREE.MeshStandardMaterial({ 
            color: 0xffffff,
            metalness: 0.8,
            roughness: 0.2
        })
    );
    frame.position.y = 4;
    group.add(frame);
    
    const glass = new THREE.Mesh(
        new THREE.BoxGeometry(width - 0.5, 7, depth - 0.5),
        new THREE.MeshStandardMaterial({
            color: 0x87ceeb,
            transparent: true,
            opacity: 0.4,
            metalness: 0.9,
            roughness: 0.1
        })
    );
    glass.position.y = 4;
    group.add(glass);
    
    group.position.set(x, 0, z);
    return group;
}

export function createSuburbanHouse(x, z, roofColor) {
    const group = new THREE.Group();
    
    const body = new THREE.Mesh(
        new THREE.BoxGeometry(5, 3.5, 4),
        new THREE.MeshStandardMaterial({ color: 0xf5f5dc })
    );
    body.position.y = 1.75;
    group.add(body);
    
    const roof = new THREE.Mesh(
        new THREE.BoxGeometry(6, 1, 5),
        new THREE.MeshStandardMaterial({ color: roofColor })
    );
    roof.position.y = 4;
    roof.rotation.z = 0.15;
    group.add(roof);
    
    const porch = new THREE.Mesh(
        new THREE.BoxGeometry(1.5, 0.3, 2),
        new THREE.MeshStandardMaterial({ color: 0x8b7355 })
    );
    porch.position.set(0, 0.15, 2.5);
    group.add(porch);
    
    const door = new THREE.Mesh(
        new THREE.BoxGeometry(0.8, 1.8, 0.1),
        new THREE.MeshStandardMaterial({ color: 0x654321 })
    );
    door.position.set(0, 0.9, 2.05);
    group.add(door);
    
    const winMat = new THREE.MeshStandardMaterial({ color: 0x87ceeb });
    for (let side of [-1, 1]) {
        const win = new THREE.Mesh(
            new THREE.BoxGeometry(0.8, 0.8, 0.1),
            winMat
        );
        win.position.set(side * 1.5, 2.2, 2.05);
        group.add(win);
    }
    
    const garden = new THREE.Mesh(
        new THREE.BoxGeometry(3, 0.2, 1.5),
        new THREE.MeshStandardMaterial({ color: 0x228b22 })
    );
    garden.position.set(0, 0.1, -2.5);
    group.add(garden);
    
    group.position.set(x, 0, z);
    return group;
}

export function createUrbanBuilding(x, z, color) {
    const group = new THREE.Group();
    
    const tower = new THREE.Mesh(
        new THREE.BoxGeometry(6, 10, 5),
        new THREE.MeshStandardMaterial({ color })
    );
    tower.position.y = 5;
    group.add(tower);
    
    const top = new THREE.Mesh(
        new THREE.BoxGeometry(6.5, 0.8, 5.5),
        new THREE.MeshStandardMaterial({ color: 0x333333 })
    );
    top.position.y = 10.4;
    group.add(top);
    
    const windowMat = new THREE.MeshStandardMaterial({ color: 0x1a1a2e });
    for (let row = 0; row < 4; row++) {
        for (let col of [-1, 0, 1]) {
            const win = new THREE.Mesh(
                new THREE.BoxGeometry(1, 1.2, 0.1),
                windowMat
            );
            win.position.set(col * 1.8, 2 + row * 2.2, 2.55);
            group.add(win);
        }
    }
    
    const entrance = new THREE.Mesh(
        new THREE.BoxGeometry(2, 2.5, 0.3),
        new THREE.MeshStandardMaterial({ color: 0x111111 })
    );
    entrance.position.set(0, 1.25, 2.6);
    group.add(entrance);
    
    const plaza = new THREE.Mesh(
        new THREE.BoxGeometry(8, 0.2, 3),
        new THREE.MeshStandardMaterial({ color: 0x555555 })
    );
    plaza.position.set(0, 0.1, 3.5);
    group.add(plaza);
    
    group.position.set(x, 0, z);
    return group;
}

export function createCottage(x, z, roofColor) {
    return createSuburbanHouse(x, z, roofColor);
}

// ============ CIVIC CENTER NORTH - Grand entrance hall ============
export function createCivicCenterNorth(x, z) {
    const group = new THREE.Group();
    
    // Stone platform base
    const platform = new THREE.Mesh(
        new THREE.BoxGeometry(18, 0.8, 14),
        new THREE.MeshStandardMaterial({ color: 0xa0a0a0 })
    );
    platform.position.y = 0.4;
    group.add(platform);
    
    // Main building body (wide and low)
    const body = new THREE.Mesh(
        new THREE.BoxGeometry(16, 5, 12),
        new THREE.MeshStandardMaterial({ color: 0xf8f8f0 })
    );
    body.position.y = 3.4;
    group.add(body);
    
    // Columned colonnade (front - 6 columns)
    const columnMat = new THREE.MeshStandardMaterial({ color: 0xfafaf5 });
    for (let i = -2.5; i <= 2.5; i++) {
        const col = new THREE.Mesh(
            new THREE.CylinderGeometry(0.45, 0.5, 4, 12),
            columnMat
        );
        col.position.set(i * 2.5, 5.4, 6.5);
        group.add(col);
    }
    
    // Column bases
    for (let i = -2.5; i <= 2.5; i++) {
        const base = new THREE.Mesh(
            new THREE.CylinderGeometry(0.55, 0.6, 0.3, 12),
            new THREE.MeshStandardMaterial({ color: 0xd0d0c0 })
        );
        base.position.set(i * 2.5, 3.55, 6.5);
        group.add(base);
    }
    
    // Column capitals
    for (let i = -2.5; i <= 2.5; i++) {
        const capital = new THREE.Mesh(
            new THREE.BoxGeometry(0.9, 0.3, 0.9),
            new THREE.MeshStandardMaterial({ color: 0xe0e0d0 })
        );
        capital.position.set(i * 2.5, 7.55, 6.5);
        group.add(capital);
    }
    
    // Entablature (beam above columns)
    const entablature = new THREE.Mesh(
        new THREE.BoxGeometry(16, 0.8, 1),
        new THREE.MeshStandardMaterial({ color: 0xe8e8e0 })
    );
    entablature.position.set(0, 7.9, 6.5);
    group.add(entablature);
    
    // Triangular pediment
    const pedimentGeo = new THREE.BufferGeometry();
    const vertices = new Float32Array([
        -8, 0, 0,   // left
        8, 0, 0,    // right
        0, 3, 0     // top
    ]);
    pedimentGeo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    pedimentGeo.computeVertexNormals();
    const pediment = new THREE.Mesh(
        pedimentGeo,
        new THREE.MeshStandardMaterial({ color: 0x4169e1, side: THREE.DoubleSide })
    );
    pediment.position.set(0, 8.3, 6.5);
    group.add(pediment);
    
    // Hip roof (pyramid style, lower)
    const roofBase = new THREE.Mesh(
        new THREE.BoxGeometry(16.5, 0.3, 12.5),
        new THREE.MeshStandardMaterial({ color: 0x2f4f4f })
    );
    roofBase.position.y = 8.6;
    group.add(roofBase);
    
    // Roof dome (small center dome)
    const dome = new THREE.Mesh(
        new THREE.SphereGeometry(1.5, 12, 12, 0, Math.PI * 2, 0, Math.PI / 2),
        new THREE.MeshStandardMaterial({ color: 0x4169e1 })
    );
    dome.position.set(0, 8.6, 0);
    group.add(dome);
    
    // Side wings (extensions)
    const wingMat = new THREE.MeshStandardMaterial({ color: 0xf5f5f0 });
    
    // Left wing
    const wingLeft = new THREE.Mesh(
        new THREE.BoxGeometry(4, 4, 10),
        wingMat
    );
    wingLeft.position.set(-10, 2.8, 0);
    group.add(wingLeft);
    
    // Right wing
    const wingRight = new THREE.Mesh(
        new THREE.BoxGeometry(4, 4, 10),
        wingMat
    );
    wingRight.position.set(10, 2.8, 0);
    group.add(wingRight);
    
    // Steps (grand entrance)
    for (let i = 0; i < 4; i++) {
        const step = new THREE.Mesh(
            new THREE.BoxGeometry(14 - i * 0.5, 0.25, 1),
            new THREE.MeshStandardMaterial({ color: 0xb0b0a0 })
        );
        step.position.set(0, 0.15 + i * 0.25, 8 + i * 0.5);
        group.add(step);
    }
    
    // Decorative urns on roof corners
    const urnMat = new THREE.MeshStandardMaterial({ color: 0xd0d0c0 });
    const urnPositions = [[-7, 8.8, 6], [7, 8.8, 6], [-7, 8.8, -6], [7, 8.8, -6]];
    urnPositions.forEach(pos => {
        const urn = new THREE.Mesh(
            new THREE.SphereGeometry(0.4, 8, 8),
            urnMat
        );
        urn.position.set(...pos);
        group.add(urn);
    });
    
    group.position.set(x, 0, z);
    return group;
}

// ============ CIVIC CENTER WING - East/West wings ============
export function createCivicCenterWing(x, z, facingRight = true) {
    const group = new THREE.Group();
    
    // Stone base
    const base = new THREE.Mesh(
        new THREE.BoxGeometry(10, 0.5, 8),
        new THREE.MeshStandardMaterial({ color: 0xa0a0a0 })
    );
    base.position.y = 0.25;
    group.add(base);
    
    // Main building
    const body = new THREE.Mesh(
        new THREE.BoxGeometry(9, 4, 7),
        new THREE.MeshStandardMaterial({ color: 0xf8f8f0 })
    );
    body.position.y = 2.8;
    group.add(body);
    
    // Colonnade on facing side
    const colCount = 3;
    const colSpacing = 2.5;
    for (let i = 0; i < colCount; i++) {
        const col = new THREE.Mesh(
            new THREE.CylinderGeometry(0.35, 0.4, 3.5, 10),
            new THREE.MeshStandardMaterial({ color: 0xfafaf5 })
        );
        const offsetX = facingRight ? 4.6 : -4.6;
        col.position.set(offsetX, 4.35, -2 + i * colSpacing);
        group.add(col);
    }
    
    // Entablature
    const entablature = new THREE.Mesh(
        new THREE.BoxGeometry(0.6, 0.6, 7),
        new THREE.MeshStandardMaterial({ color: 0xe8e8e0 })
    );
    const entX = facingRight ? 4.6 : -4.6;
    entablature.position.set(entX, 6.1, 0);
    group.add(entablature);
    
    // Flat roof with slight slope
    const roof = new THREE.Mesh(
        new THREE.BoxGeometry(10.5, 0.4, 8),
        new THREE.MeshStandardMaterial({ color: 0x2f4f4f })
    );
    roof.position.y = 6.4;
    group.add(roof);
    
    // Small dome on top
    const dome = new THREE.Mesh(
        new THREE.SphereGeometry(1, 10, 10, 0, Math.PI * 2, 0, Math.PI / 2),
        new THREE.MeshStandardMaterial({ color: 0x4169e1 })
    );
    dome.position.set(0, 6.6, 0);
    group.add(dome);
    
    // Steps
    for (let i = 0; i < 2; i++) {
        const step = new THREE.Mesh(
            new THREE.BoxGeometry(8 - i * 0.3, 0.2, 0.8),
            new THREE.MeshStandardMaterial({ color: 0xb0b0a0 })
        );
        const stepZ = facingRight ? 5 + i * 0.4 : -5 - i * 0.4;
        step.position.set(0, 0.1 + i * 0.2, stepZ);
        group.add(step);
    }
    
    // Decorative windows
    const winMat = new THREE.MeshStandardMaterial({ color: 0x87ceeb, transparent: true, opacity: 0.6 });
    for (let i = -1; i <= 1; i++) {
        const win = new THREE.Mesh(
            new THREE.BoxGeometry(1.2, 1.8, 0.1),
            winMat
        );
        win.position.set(i * 2.5, 3.5, 3.55);
        group.add(win);
    }
    
    group.position.set(x, 0, z);
    return group;
}

// ============ PLAZA FOUNTAIN - Circular plaza fountain ============
export function createPlazaFountain(x, z) {
    const group = new THREE.Group();
    
    // Stone base
    const base = new THREE.Mesh(
        new THREE.CylinderGeometry(5, 5.5, 0.8, 16),
        new THREE.MeshStandardMaterial({ color: 0x888888 })
    );
    base.position.y = 0.4;
    group.add(base);
    
    // Water basin
    const basin = new THREE.Mesh(
        new THREE.CylinderGeometry(4.5, 4.5, 0.5, 16),
        new THREE.MeshStandardMaterial({ color: 0x4169e1, transparent: true, opacity: 0.7 })
    );
    basin.position.y = 0.9;
    group.add(basin);
    
    // Center pillar
    const pillar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.4, 0.5, 3, 8),
        new THREE.MeshStandardMaterial({ color: 0xcccccc })
    );
    pillar.position.y = 2;
    group.add(pillar);
    
    // Top water spout
    const spout = new THREE.Mesh(
        new THREE.SphereGeometry(0.6, 8, 8),
        new THREE.MeshStandardMaterial({ color: 0x4169e1, transparent: true, opacity: 0.8 })
    );
    spout.position.y = 3.5;
    group.add(spout);
    
    // Decorative rim
    const rim = new THREE.Mesh(
        new THREE.TorusGeometry(4.5, 0.2, 8, 16),
        new THREE.MeshStandardMaterial({ color: 0xaaaaaa })
    );
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 1.15;
    group.add(rim);
    
    group.position.set(x, 0, z);
    return group;
}

// ============ FLAGPOLE - Plaza flagpole ============
export function createFlagpole(x, z) {
    const group = new THREE.Group();
    
    // Pole
    const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.12, 8, 8),
        new THREE.MeshStandardMaterial({ color: 0xcccccc })
    );
    pole.position.y = 4;
    group.add(pole);
    
    // Base
    const poleBase = new THREE.Mesh(
        new THREE.CylinderGeometry(0.3, 0.4, 0.5, 8),
        new THREE.MeshStandardMaterial({ color: 0x888888 })
    );
    poleBase.position.y = 0.25;
    group.add(poleBase);
    
    // Flag (red)
    const flagPole = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 0.08, 2),
        new THREE.MeshStandardMaterial({ color: 0xcccccc })
    );
    flagPole.position.set(0.08, 7.5, 1);
    group.add(flagPole);
    
    // Flag fabric
    const flag = new THREE.Mesh(
        new THREE.PlaneGeometry(1.8, 1),
        new THREE.MeshStandardMaterial({ color: 0xdc143c, side: THREE.DoubleSide })
    );
    flag.position.set(0.9, 7.3, 1);
    group.add(flag);
    
    group.position.set(x, 0, z);
    return group;
}

// ============ PLAZA TILES - Ground decoration ============
export function createPlazaTiles(x, z, width, depth) {
    const group = new THREE.Group();
    
    const tiles = new THREE.Mesh(
        new THREE.PlaneGeometry(width, depth),
        new THREE.MeshStandardMaterial({ color: 0xb8b8b8 })
    );
    tiles.rotation.x = -Math.PI / 2;
    tiles.position.y = 0.02;
    group.add(tiles);
    
    // Border
    const borderMat = new THREE.MeshStandardMaterial({ color: 0x888888 });
    const borderN = new THREE.Mesh(new THREE.BoxGeometry(width + 0.5, 0.1, 0.5), borderMat);
    borderN.position.set(0, 0.05, -depth/2 - 0.25);
    group.add(borderN);
    const borderS = borderN.clone();
    borderS.position.z = depth/2 + 0.25;
    group.add(borderS);
    const borderE = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.1, depth), borderMat);
    borderE.position.set(width/2 + 0.25, 0.05, 0);
    group.add(borderE);
    const borderW = borderE.clone();
    borderW.position.x = -width/2 - 0.25;
    group.add(borderW);
    
    group.position.set(x, 0, z);
    return group;
}
