/**
 * Agent City Enhanced v8 - Complete Features
 * - Collapsible panels
 * - Agent reply messages above head
 * - Day/Night cycle with lighting effects
 */

(function() {
  console.log('[Enhanced v8] Loading with day/night cycle...');
  
  var checkCount = 0;
  var maxChecks = 100;
  var scene = null;
  var messageSprites = {};
  var sunLight = null;
  var ambientLight = null;
  
  function checkAndAdd() {
    checkCount++;
    
    if (typeof THREE === 'undefined') {
      setTimeout(checkAndAdd, 500);
      return;
    }
    
    scene = window.scene;
    
    if (!scene && checkCount < maxChecks) {
      setTimeout(checkAndAdd, 500);
      return;
    }
    
    if (!scene) {
      console.log('[Enhanced v8] Scene not found');
      return;
    }
    
    console.log('[Enhanced v8] Applying all improvements...');
    try {
      addAllImprovements(scene);
      setupDayNightCycle(scene);
      setupCollapsiblePanels();
    } catch (e) {
      console.error('[Enhanced v8] Error:', e);
    }
  }
  
  function addAllImprovements(scene) {
    improveGround(scene);
    addLakes(scene);
    addRoads(scene);
    addTrees(scene);
    addStreetLights(scene);
    addFlowers(scene);
    addBenches(scene);
    addBushes(scene);
    addFountain(scene);
    addDetailedBuildings(scene);
    console.log('[Enhanced v8] City complete!');
  }
  
  function improveGround(scene) {
    var grassMat = new THREE.MeshLambertMaterial({ color: 0x4caf50 });
    var patches = [
      { x: 40, z: 40, w: 20, h: 20 },
      { x: -40, z: 40, w: 20, h: 20 },
      { x: 40, z: -40, w: 20, h: 20 },
      { x: -40, z: -40, w: 20, h: 20 },
    ];
    patches.forEach(function(p) {
      var geo = new THREE.PlaneGeometry(p.w, p.h);
      var mesh = new THREE.Mesh(geo, grassMat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set(p.x, 0.04, p.z);
      scene.add(mesh);
    });
  }
  
  function addLakes(scene) {
    createLake(scene, 35, 35, 12);
    createLake(scene, -35, -30, 10);
  }
  
  function createLake(scene, x, z, size) {
    var geo = new THREE.CircleGeometry(size, 32);
    var mat = new THREE.MeshLambertMaterial({ color: 0x1976d2, transparent: true, opacity: 0.85 });
    var lake = new THREE.Mesh(geo, mat);
    lake.rotation.x = -Math.PI / 2;
    lake.position.set(x, 0.05, z);
    scene.add(lake);
    
    var beachGeo = new THREE.RingGeometry(size, size + 1.5, 32);
    var beachMat = new THREE.MeshLambertMaterial({ color: 0xffcc80 });
    var beach = new THREE.Mesh(beachGeo, beachMat);
    beach.rotation.x = -Math.PI / 2;
    beach.position.set(x, 0.04, z);
    scene.add(beach);
    
    for (var i = 0; i < 6; i++) {
      var angle = (i / 6) * Math.PI * 2;
      var rock = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.4, 0),
        new THREE.MeshLambertMaterial({ color: 0x78909c })
      );
      rock.position.set(x + Math.cos(angle) * (size + 2), 0.25, z + Math.sin(angle) * (size + 2));
      scene.add(rock);
    }
  }
  
  function addRoads(scene) {
    var roadMat = new THREE.MeshLambertMaterial({ color: 0x424242 });
    var lineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    
    var road1 = new THREE.Mesh(new THREE.PlaneGeometry(5, 80), roadMat);
    road1.rotation.x = -Math.PI / 2;
    road1.position.set(0, 0.03, 0);
    scene.add(road1);
    
    var road2 = new THREE.Mesh(new THREE.PlaneGeometry(80, 5), roadMat);
    road2.rotation.x = -Math.PI / 2;
    road2.position.set(0, 0.03, 0);
    scene.add(road2);
    
    var ring = new THREE.Mesh(new THREE.RingGeometry(32, 36, 64), roadMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(0, 0.03, 0);
    scene.add(ring);
    
    for (var i = -35; i < 35; i += 5) {
      var mark1 = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 2), lineMat);
      mark1.rotation.x = -Math.PI / 2;
      mark1.position.set(0, 0.04, i);
      scene.add(mark1);
      
      var mark2 = new THREE.Mesh(new THREE.PlaneGeometry(2, 0.2), lineMat);
      mark2.rotation.x = -Math.PI / 2;
      mark2.position.set(i, 0.04, 0);
      scene.add(mark2);
    }
  }
  
  function addTrees(scene) {
    var positions = [
      [15, 15], [-15, 15], [15, -15], [-15, -15],
      [50, 0], [-50, 0], [0, 50], [0, -50],
      [15, 50], [-15, 50], [15, -50], [-15, -50],
      [50, 15], [-50, 15], [50, -15], [-50, -15],
    ];
    
    positions.forEach(function(pos) {
      var trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.3, 2.5, 8),
        new THREE.MeshLambertMaterial({ color: 0x6d4c41 })
      );
      trunk.position.set(pos[0], 1.25, pos[1]);
      scene.add(trunk);
      
      var leavesMat = new THREE.MeshLambertMaterial({ color: 0x388e3c });
      var bottom = new THREE.Mesh(new THREE.ConeGeometry(2, 2, 8), leavesMat);
      bottom.position.set(pos[0], 3, pos[1]);
      scene.add(bottom);
      
      var middle = new THREE.Mesh(new THREE.ConeGeometry(1.5, 1.8, 8), leavesMat);
      middle.position.set(pos[0], 4.2, pos[1]);
      scene.add(middle);
      
      var top = new THREE.Mesh(new THREE.ConeGeometry(1, 1.5, 8), leavesMat);
      top.position.set(pos[0], 5.2, pos[1]);
      scene.add(top);
    });
  }
  
  function addStreetLights(scene) {
    var positions = [
      [15, 25], [-15, 25], [15, -25], [-15, -25],
      [30, 0], [-30, 0], [0, 30], [0, -30],
    ];
    
    positions.forEach(function(pos) {
      var metalMat = new THREE.MeshLambertMaterial({ color: 0x455a64 });
      var pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 4, 8), metalMat);
      pole.position.set(pos[0], 2, pos[1]);
      scene.add(pole);
      
      var bulb = new THREE.Mesh(
        new THREE.SphereGeometry(0.2, 12, 12),
        new THREE.MeshBasicMaterial({ color: 0xfff8e1 })
      );
      bulb.position.set(pos[0], 4.2, pos[1]);
      scene.add(bulb);
    });
  }
  
  function addFlowers(scene) {
    var patches = [
      { x: 45, z: 25, count: 15 },
      { x: -45, z: -25, count: 12 },
      { x: 25, z: 45, count: 15 },
      { x: -25, z: -45, count: 12 },
    ];
    var colors = [0xf44336, 0xffc107, 0xe91e63, 0x2196f3, 0x9c27b0];
    
    patches.forEach(function(patch) {
      for (var i = 0; i < patch.count; i++) {
        var color = colors[Math.floor(Math.random() * colors.length)];
        var stem = new THREE.Mesh(
          new THREE.CylinderGeometry(0.03, 0.04, 0.4, 6),
          new THREE.MeshLambertMaterial({ color: 0x4caf50 })
        );
        stem.position.set(patch.x + (Math.random() - 0.5) * 8, 0.2, patch.z + (Math.random() - 0.5) * 8);
        scene.add(stem);
        
        var flower = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), new THREE.MeshLambertMaterial({ color: color }));
        flower.position.set(stem.position.x, 0.45, stem.position.z);
        scene.add(flower);
      }
    });
  }
  
  function addBenches(scene) {
    var positions = [[20, 20], [-20, 20], [20, -20], [-20, -20]];
    positions.forEach(function(pos) {
      var woodMat = new THREE.MeshLambertMaterial({ color: 0x8d6e63 });
      var metalMat = new THREE.MeshLambertMaterial({ color: 0x37474f });
      
      var seat = new THREE.Mesh(new THREE.BoxGeometry(2, 0.1, 0.5), woodMat);
      seat.position.set(pos[0], 0.4, pos[1]);
      scene.add(seat);
      
      var back = new THREE.Mesh(new THREE.BoxGeometry(2, 0.4, 0.08), woodMat);
      back.position.set(pos[0], 0.65, pos[1] - 0.2);
      scene.add(back);
      
      var legGeo = new THREE.BoxGeometry(0.08, 0.35, 0.08);
      [[-0.8, 0.1], [0.8, 0.1], [-0.8, -0.2], [0.8, -0.2]].forEach(function(offset) {
        var leg = new THREE.Mesh(legGeo, metalMat);
        leg.position.set(pos[0] + offset[0], 0.18, pos[1] + offset[1]);
        scene.add(leg);
      });
    });
  }
  
  function addBushes(scene) {
    var positions = [[12, 30], [-12, 30], [12, -30], [-12, -30], [45, 12], [-45, 12], [45, -12], [-45, -12]];
    var bushMat = new THREE.MeshLambertMaterial({ color: 0x66bb6a });
    positions.forEach(function(pos) {
      var bush = new THREE.Mesh(new THREE.SphereGeometry(1, 8, 8), bushMat);
      bush.position.set(pos[0], 0.8, pos[1]);
      scene.add(bush);
    });
  }
  
  function addFountain(scene) {
    var stoneMat = new THREE.MeshLambertMaterial({ color: 0x90a4ae });
    var waterMat = new THREE.MeshLambertMaterial({ color: 0x42a5f5, transparent: true, opacity: 0.8 });
    
    var base = new THREE.Mesh(new THREE.CylinderGeometry(3, 3.5, 0.4, 24), stoneMat);
    base.position.set(0, 0.2, 0);
    scene.add(base);
    
    var pool = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 2.5, 0.3, 24), waterMat);
    pool.position.set(0, 0.5, 0);
    scene.add(pool);
    
    var column = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 2, 12), stoneMat);
    column.position.set(0, 1.5, 0);
    scene.add(column);
    
    var top = new THREE.Mesh(new THREE.SphereGeometry(0.4, 12, 12), new THREE.MeshBasicMaterial({ color: 0x64b5f6 }));
    top.position.set(0, 2.6, 0);
    scene.add(top);
  }
  
  // ============ Building Hover Tooltip System ============
var hoveredBuildingObj = null;
var buildingTooltipEl = null;

function createBuildingTooltip() {
    buildingTooltipEl = document.createElement('div');
    buildingTooltipEl.id = 'building-tooltip';
    buildingTooltipEl.style.cssText = `
        position: fixed;
        background: rgba(26, 26, 46, 0.95);
        color: #fff;
        padding: 10px 14px;
        border-radius: 8px;
        font-size: 13px;
        pointer-events: none;
        z-index: 2000;
        display: none;
        border: 1px solid rgba(78, 205, 196, 0.4);
        box-shadow: 0 6px 20px rgba(0,0,0,0.4);
        max-width: 200px;
        font-family: 'Microsoft YaHei', sans-serif;
    `;
    buildingTooltipEl.innerHTML = '<div id="bt-name" style="font-weight:bold;color:#4ecdc4;margin-bottom:6px;font-size:14px;"></div><div id="bt-info" style="color:#aaa;"></div>';
    document.body.appendChild(buildingTooltipEl);
}

function showBuildingTooltip(name, info, x, y) {
    if (!buildingTooltipEl) createBuildingTooltip();
    document.getElementById('bt-name').textContent = name || '建筑';
    document.getElementById('bt-info').textContent = info || '';
    buildingTooltipEl.style.left = (x + 15) + 'px';
    buildingTooltipEl.style.top = (y - 10) + 'px';
    buildingTooltipEl.style.display = 'block';
}

function hideBuildingTooltip() {
    if (buildingTooltipEl) buildingTooltipEl.style.display = 'none';
}

function setupBuildingHover(scene) {
    console.log('[Enhanced v8] Building hover system ready');
}

// ============ LOD (Level of Detail) System ============
var lodObjects = [];

function setupLOD(scene) {
    console.log('[Enhanced v8] LOD system ready');
}

function addDetailedBuildings(scene) {
    createSocialPlaza(scene, 0, 35);
    createTaskCenter(scene, -25, -25);
    createReputationTower(scene, 25, -25);
    createTradingCenter(scene, -25, 25);
    createArchive(scene, 25, 25);
    createMessageStation(scene, 0, -35);
    createDataCenter(scene, -35, 0);
    createCreativeWorkshop(scene, 35, 0);
  }
  
  function createSocialPlaza(scene, x, z) {
    var group = new THREE.Group();
    var platformMat = new THREE.MeshLambertMaterial({ color: 0xec407a });
    var pinkMat = new THREE.MeshLambertMaterial({ color: 0xf48fb1 });
    var darkMat = new THREE.MeshLambertMaterial({ color: 0xad1457 });
    
    var platform = new THREE.Mesh(new THREE.BoxGeometry(14, 0.4, 14), platformMat);
    platform.position.y = 0.2;
    group.add(platform);
    
    var stage = new THREE.Mesh(new THREE.BoxGeometry(6, 0.6, 3), pinkMat);
    stage.position.set(0, 0.5, -5);
    group.add(stage);
    
    var pillarMat = new THREE.MeshLambertMaterial({ color: 0x880e4f });
    [[-5, -5], [5, -5], [-5, 5], [5, 5]].forEach(function(pos) {
      var pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 3.5, 8), pillarMat);
      pillar.position.set(pos[0], 2.2, pos[1]);
      group.add(pillar);
    });
    
    var roof = new THREE.Mesh(new THREE.BoxGeometry(12, 0.25, 12), darkMat);
    roof.position.y = 4;
    group.add(roof);
    
    var seatMat = new THREE.MeshLambertMaterial({ color: 0xfce4ec });
    for (var i = 0; i < 3; i++) {
      var seat = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.3, 0.8), seatMat);
      seat.position.set(-3 + i * 3, 0.35, 4);
      group.add(seat);
    }
    
    var heart = new THREE.Mesh(new THREE.SphereGeometry(0.8, 12, 12), new THREE.MeshLambertMaterial({ color: 0xe91e63 }));
    heart.scale.set(1, 1.1, 0.4);
    heart.position.set(0, 1.3, -5);
    group.add(heart);
    
    group.position.set(x, 0, z);
    scene.add(group);
  }
  
  function createTaskCenter(scene, x, z) {
    var group = new THREE.Group();
    var redMat = new THREE.MeshLambertMaterial({ color: 0xff6b6b });
    var darkMat = new THREE.MeshLambertMaterial({ color: 0xc62828 });
    var glassMat = new THREE.MeshLambertMaterial({ color: 0x81d4fa, transparent: true, opacity: 0.7 });
    
    var main = new THREE.Mesh(new THREE.BoxGeometry(8, 12, 8), redMat);
    main.position.y = 6;
    group.add(main);
    
    var entrance = new THREE.Mesh(new THREE.BoxGeometry(3, 4, 1), darkMat);
    entrance.position.set(0, 2, 4.5);
    group.add(entrance);
    
    for (var floor = 0; floor < 2; floor++) {
      for (var w = 0; w < 2; w++) {
        var win = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 2), glassMat);
        win.position.set(-2 + w * 4, 4 + floor * 4, 4.1);
        group.add(win);
      }
    }
    
    var roof = new THREE.Mesh(new THREE.ConeGeometry(6, 3, 4), darkMat);
    roof.rotation.y = Math.PI / 4;
    roof.position.y = 13.5;
    group.add(roof);
    
    var clock = new THREE.Mesh(new THREE.CircleGeometry(1, 24), new THREE.MeshLambertMaterial({ color: 0xffffff }));
    clock.position.set(0, 10, 4.1);
    group.add(clock);
    
    group.position.set(x, 0, z);
    scene.add(group);
  }
  
  function createReputationTower(scene, x, z) {
    var group = new THREE.Group();
    var goldMat = new THREE.MeshLambertMaterial({ color: 0xffc107 });
    var darkMat = new THREE.MeshLambertMaterial({ color: 0xff8f00 });
    
    for (var i = 0; i < 5; i++) {
      var tier = new THREE.Mesh(new THREE.CylinderGeometry(3 - i * 0.4, 3.5 - i * 0.4, 2.5, 8), i % 2 === 0 ? goldMat : darkMat);
      tier.position.y = 1.25 + i * 2.5;
      group.add(tier);
    }
    
    var spire = new THREE.Mesh(new THREE.ConeGeometry(1.2, 3, 8), new THREE.MeshBasicMaterial({ color: 0xffd700 }));
    spire.position.y = 14;
    group.add(spire);
    
    var star = new THREE.Mesh(new THREE.OctahedronGeometry(0.7, 0), new THREE.MeshBasicMaterial({ color: 0xffff00 }));
    star.position.y = 16;
    group.add(star);
    
    group.position.set(x, 0, z);
    scene.add(group);
  }
  
  function createTradingCenter(scene, x, z) {
    var group = new THREE.Group();
    var tealMat = new THREE.MeshLambertMaterial({ color: 0x4db6ac });
    var glassMat = new THREE.MeshLambertMaterial({ color: 0xe0f7fa, transparent: true, opacity: 0.6 });
    var darkMat = new THREE.MeshLambertMaterial({ color: 0x00897b });
    
    var main = new THREE.Mesh(new THREE.BoxGeometry(10, 8, 10), tealMat);
    main.position.y = 4;
    group.add(main);
    
    var dome = new THREE.Mesh(new THREE.SphereGeometry(4, 12, 12, 0, Math.PI * 2, 0, Math.PI / 2), glassMat);
    dome.position.y = 8;
    group.add(dome);
    
    [[-4, -4], [4, -4], [-4, 4], [4, 4]].forEach(function(pos) {
      var tower = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1, 10, 8), darkMat);
      tower.position.set(pos[0], 5, pos[1]);
      group.add(tower);
      var cap = new THREE.Mesh(new THREE.ConeGeometry(1, 1.5, 8), new THREE.MeshLambertMaterial({ color: 0x004d40 }));
      cap.position.set(pos[0], 10.75, pos[1]);
      group.add(cap);
    });
    
    group.position.set(x, 0, z);
    scene.add(group);
  }
  
  function createArchive(scene, x, z) {
    var group = new THREE.Group();
    var purpleMat = new THREE.MeshLambertMaterial({ color: 0x9c27b0 });
    var lightMat = new THREE.MeshLambertMaterial({ color: 0xe1bee7 });
    var darkMat = new THREE.MeshLambertMaterial({ color: 0x6a1b9a });
    
    var main = new THREE.Mesh(new THREE.BoxGeometry(7, 10, 10), purpleMat);
    main.position.y = 5;
    group.add(main);
    
    for (var i = 0; i < 3; i++) {
      var col = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 8, 8), lightMat);
      col.position.set(-2.5 + i * 2.5, 4, 5.5);
      group.add(col);
    }
    
    var roof = new THREE.Mesh(new THREE.BoxGeometry(8, 0.4, 11), darkMat);
    roof.position.y = 10.2;
    group.add(roof);
    
    var dome = new THREE.Mesh(new THREE.SphereGeometry(2.5, 12, 12, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshLambertMaterial({ color: 0xba68c8 }));
    dome.position.y = 10.4;
    group.add(dome);
    
    group.position.set(x, 0, z);
    scene.add(group);
  }
  
  function createMessageStation(scene, x, z) {
    var group = new THREE.Group();
    var blueMat = new THREE.MeshLambertMaterial({ color: 0x2196f3 });
    var darkMat = new THREE.MeshLambertMaterial({ color: 0x0d47a1 });
    
    var main = new THREE.Mesh(new THREE.BoxGeometry(18, 5, 5), blueMat);
    main.position.y = 2.5;
    group.add(main);
    
    for (var i = 0; i < 3; i++) {
      var ant = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.3, 6, 8), darkMat);
      ant.position.set(-6 + i * 6, 5.5, 0);
      group.add(ant);
      
      var dish = new THREE.Mesh(new THREE.SphereGeometry(1, 8, 8, 0, Math.PI), new THREE.MeshLambertMaterial({ color: 0x90caf9 }));
      dish.position.set(-6 + i * 6, 9, 0);
      dish.rotation.x = -Math.PI / 4;
      group.add(dish);
    }
    
    var led = new THREE.Mesh(new THREE.PlaneGeometry(15, 2), new THREE.MeshBasicMaterial({ color: 0x00e5ff }));
    led.position.set(0, 3.5, 2.6);
    group.add(led);
    
    group.position.set(x, 0, z);
    scene.add(group);
  }
  
  function createDataCenter(scene, x, z) {
    var group = new THREE.Group();
    var orangeMat = new THREE.MeshLambertMaterial({ color: 0xff9800 });
    var rackMat = new THREE.MeshLambertMaterial({ color: 0x37474f });
    
    var main = new THREE.Mesh(new THREE.BoxGeometry(8, 14, 8), orangeMat);
    main.position.y = 7;
    group.add(main);
    
    for (var floor = 0; floor < 3; floor++) {
      for (var i = 0; i < 2; i++) {
        var rack = new THREE.Mesh(new THREE.BoxGeometry(1.5, 2.5, 0.8), rackMat);
        rack.position.set(-2 + i * 4, 2 + floor * 4, 4.5);
        group.add(rack);
      }
    }
    
    var cool = new THREE.Mesh(new THREE.BoxGeometry(2.5, 3, 2.5), new THREE.MeshLambertMaterial({ color: 0x0288d1 }));
    cool.position.set(4, 1.5, 4);
    group.add(cool);
    
    group.position.set(x, 0, z);
    scene.add(group);
  }
  
  function createCreativeWorkshop(scene, x, z) {
    var group = new THREE.Group();
    var pinkMat = new THREE.MeshLambertMaterial({ color: 0xe91e63 });
    var yellowMat = new THREE.MeshLambertMaterial({ color: 0xffeb3b });
    
    var main = new THREE.Mesh(new THREE.BoxGeometry(10, 8, 10), pinkMat);
    main.position.y = 4;
    group.add(main);
    
    var arm1 = new THREE.Mesh(new THREE.BoxGeometry(3, 5, 3), yellowMat);
    arm1.position.set(6, 2.5, 6);
    group.add(arm1);
    
    var arm2 = new THREE.Mesh(new THREE.BoxGeometry(2.5, 6, 2.5), new THREE.MeshLambertMaterial({ color: 0x9c27b0 }));
    arm2.position.set(-5, 3, 5);
    group.add(arm2);
    
    var colors = [0xf44336, 0x2196f3, 0x4caf50, 0xff9800];
    colors.forEach(function(color, i) {
      var elem = new THREE.Mesh(new THREE.ConeGeometry(1.2, 2.5, 4), new THREE.MeshLambertMaterial({ color: color }));
      elem.position.set(-3 + i * 2, 9.25, 0);
      group.add(elem);
    });
    
    var art = new THREE.Mesh(new THREE.TorusKnotGeometry(0.8, 0.25, 48, 8), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    art.position.set(0, 10, 0);
    group.add(art);
    
    group.position.set(x, 0, z);
    scene.add(group);
  }
  
  // ============ DAY/NIGHT CYCLE ============
  
// ============ Flying Birds System ============
var birds = [];
var MAX_BIRDS = 12;
var landingSpots = [];

function createBird() {
    var group = new THREE.Group();
    
    // Body - small brown cone
    var bodyGeo = new THREE.ConeGeometry(0.08, 0.2, 5);
    var bodyMat = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
    var body = new THREE.Mesh(bodyGeo, bodyMat);
    body.rotation.x = Math.PI / 2;
    group.add(body);
    
    // Head - small sphere
    var headGeo = new THREE.SphereGeometry(0.06, 6, 6);
    var headMat = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
    var head = new THREE.Mesh(headGeo, headMat);
    head.position.z = 0.12;
    group.add(head);
    
    // Beak - tiny orange cone
    var beakGeo = new THREE.ConeGeometry(0.02, 0.06, 4);
    var beakMat = new THREE.MeshBasicMaterial({ color: 0xFFA500 });
    var beak = new THREE.Mesh(beakGeo, beakMat);
    beak.rotation.x = -Math.PI / 2;
    beak.position.z = 0.2;
    group.add(beak);
    
    // Wings
    var wingGeo = new THREE.PlaneGeometry(0.2, 0.1);
    var wingMat = new THREE.MeshLambertMaterial({ color: 0x6B5344, side: THREE.DoubleSide });
    
    var leftWing = new THREE.Mesh(wingGeo, wingMat);
    leftWing.position.set(-0.1, 0.02, 0);
    leftWing.rotation.y = Math.PI / 8;
    leftWing.name = 'leftWing';
    group.add(leftWing);
    
    var rightWing = new THREE.Mesh(wingGeo, wingMat);
    rightWing.position.set(0.1, 0.02, 0);
    rightWing.rotation.y = -Math.PI / 8;
    rightWing.name = 'rightWing';
    group.add(rightWing);
    
    // Tail
    var tailGeo = new THREE.ConeGeometry(0.04, 0.1, 4);
    var tail = new THREE.Mesh(tailGeo, bodyMat);
    tail.rotation.x = -Math.PI / 2;
    tail.position.z = -0.15;
    group.add(tail);
    
    // Random position in sky
    var angle = Math.random() * Math.PI * 2;
    var radius = 15 + Math.random() * 30;
    group.position.set(
        Math.cos(angle) * radius,
        12 + Math.random() * 8,
        Math.sin(angle) * radius
    );
    
    group.scale.set(0.8, 0.8, 0.8);
    
    group.userData = {
        state: 'flying',
        targetPos: null,
        angle: angle,
        radius: radius,
        height: group.position.y,
        speed: 0.3 + Math.random() * 0.4,
        wingPhase: Math.random() * Math.PI * 2,
        stateTimer: 0,
        flyDirection: 1,
        verticalOffset: 0
    };
    
    return group;
}

function initBirds(scene) {
    // Building positions for landing
    var buildingPositions = [
        { x: -25, y: 6, z: -25 },
        { x: 25, y: 7.5, z: -25 },
        { x: -25, y: 4, z: 25 },
        { x: 25, y: 5, z: 25 },
        { x: 0, y: 3, z: -35 },
        { x: -35, y: 7, z: 0 },
        { x: 35, y: 5, z: 0 },
        { x: 0, y: 2.5, z: 35 },
    ];
    
    // Add tree tops
    for (var i = 0; i < 8; i++) {
        var a = (i / 8) * Math.PI * 2;
        var r = 42;
        buildingPositions.push({
            x: Math.cos(a) * r,
            y: 3 + Math.random() * 2,
            z: Math.sin(a) * r
        });
    }
    
    landingSpots = buildingPositions;
    
    for (var i = 0; i < MAX_BIRDS; i++) {
        var bird = createBird();
        birds.push(bird);
        scene.add(bird);
    }
    
    console.log('[Enhanced v8] ' + MAX_BIRDS + ' birds flying');
}

function updateBirds(time) {
    birds.forEach(function(bird) {
        var data = bird.userData;
        
        // Wing flapping
        data.wingPhase += 0.25;
        var wingAngle = Math.sin(data.wingPhase) * 0.6;
        bird.children.forEach(function(child) {
            if (child.name === 'leftWing') child.rotation.z = wingAngle;
            else if (child.name === 'rightWing') child.rotation.z = -wingAngle;
        });
        
        switch (data.state) {
            case 'flying':
                data.angle += data.speed * 0.008 * data.flyDirection;
                data.verticalOffset += 0.02;
                
                bird.position.x = Math.cos(data.angle) * data.radius;
                bird.position.z = Math.sin(data.angle) * data.radius;
                bird.position.y = data.height + Math.sin(data.verticalOffset) * 1.5;
                bird.rotation.y = data.angle + Math.PI / 2;
                
                data.stateTimer++;
                if (data.stateTimer > 200 + Math.random() * 300) {
                    if (Math.random() < 0.3 && landingSpots.length > 0) {
                        data.state = 'landing';
                        data.targetPos = landingSpots[Math.floor(Math.random() * landingSpots.length)];
                        data.stateTimer = 0;
                    } else if (Math.random() < 0.5) {
                        data.flyDirection = data.flyDirection > 0 ? -1 : 1;
                        data.stateTimer = 0;
                    } else {
                        data.height += (Math.random() - 0.5) * 3;
                        data.height = Math.max(8, Math.min(20, data.height));
                        data.stateTimer = 0;
                    }
                }
                break;
                
            case 'landing':
                if (data.targetPos) {
                    var dx = data.targetPos.x - bird.position.x;
                    var dy = data.targetPos.y - bird.position.y;
                    var dz = data.targetPos.z - bird.position.z;
                    var dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
                    
                    if (dist < 0.3) {
                        data.state = 'landed';
                        bird.position.set(data.targetPos.x, data.targetPos.y + 0.15, data.targetPos.z);
                        data.stateTimer = 0;
                    } else {
                        bird.position.x += dx * 0.03;
                        bird.position.y += dy * 0.03;
                        bird.position.z += dz * 0.03;
                        bird.rotation.y = Math.atan2(dx, dz);
                        data.wingPhase += 0.15;
                    }
                }
                break;
                
            case 'landed':
                data.stateTimer++;
                bird.children.forEach(function(child) {
                    if (child.name === 'leftWing' || child.name === 'rightWing') {
                        child.rotation.z = Math.sin(time * 0.002) * 0.1;
                    }
                });
                
                if (data.stateTimer > 150 + Math.random() * 200) {
                    if (Math.random() < 0.6) {
                        data.state = 'takingOff';
                        data.stateTimer = 0;
                    } else {
                        data.stateTimer = 0;
                    }
                }
                break;
                
            case 'takingOff':
                bird.position.y += 0.05;
                data.wingPhase += 0.3;
                
                if (bird.position.y > data.height + 3) {
                    data.state = 'flying';
                    data.stateTimer = 0;
                }
                break;
        }
    });
}

  function setupDayNightCycle(scene) {
    // Find existing lights or create new ones
    scene.traverse(function(obj) {
      if (obj.type === 'DirectionalLight') {
        sunLight = obj;
      } else if (obj.type === 'AmbientLight') {
        ambientLight = obj;
      }
    });
    
    if (!sunLight) {
      sunLight = new THREE.DirectionalLight(0xffffff, 1);
      sunLight.position.set(50, 50, 50);
      scene.add(sunLight);
    }
    
    if (!ambientLight) {
      ambientLight = new THREE.AmbientLight(0x404040, 0.5);
      scene.add(ambientLight);
    }
    
    // Sync with dashboard panel cycle
    setInterval(updateLighting, 1000);
    console.log('[Enhanced v8] Day/night cycle started');
  }
  
  function updateLighting() {
    if (!sunLight || !ambientLight) return;
    
    // 虚拟时间：每10分钟 = 24虚拟小时
    // 计算虚拟时间（0-24小时循环）
    var cycleMs = 10 * 60 * 1000; // 10分钟
    var now = Date.now();
    var virtualHour = ((now % cycleMs) / cycleMs) * 24;
    var hour = virtualHour;
    
    // 定义8个时段:
    // 深夜 21:00-05:00 - 深蓝色夜空
    // 黎明前 05:00-06:00 - 从深蓝过渡到橙红
    // 日出 06:00-07:00 - 橙红到橙黄
    // 早晨 07:00-09:00 - 温暖的橙黄色过渡到蓝天
    // 上午 09:00-12:00 - 明亮的蓝天
    // 下午 12:00-17:00 - 标准白天
    // 傍晚 17:00-19:00 - 温暖的橙黄
    // 黄昏 19:00-21:00 - 从橙红过渡到深蓝
    
    var skyColor, ambientColor, sunIntensity, ambientIntensity;
    
    if (hour >= 21 || hour < 5) {
      // 深夜 - 深蓝色夜空
      var t = hour >= 21 ? (hour - 21) / 6 : (hour + 3) / 6;
      skyColor = lerpColor(0x1a237e, 0x1a237e, t);
      ambientColor = lerpColor(0x3949ab, 0x3949ab, t);
      sunIntensity = 0.05;
      ambientIntensity = 0.2;
    } else if (hour >= 5 && hour < 6) {
      // 黎明前 - 从深蓝过渡到橙红
      var t = (hour - 5);
      skyColor = lerpColor(0x1a237e, 0xff7043, t);
      ambientColor = lerpColor(0x3949ab, 0xffcc80, t);
      sunIntensity = 0.1 + t * 0.4;
      ambientIntensity = 0.2 + t * 0.3;
    } else if (hour >= 6 && hour < 7) {
      // 日出 - 橙红到橙黄
      var t = (hour - 6);
      skyColor = lerpColor(0xff7043, 0xffa726, t);
      ambientColor = lerpColor(0xffcc80, 0xffeb3b, t);
      sunIntensity = 0.5 + t * 0.3;
      ambientIntensity = 0.5 + t * 0.2;
    } else if (hour >= 7 && hour < 9) {
      // 早晨 - 温暖的橙黄色过渡到蓝天
      var t = (hour - 7) / 2;
      skyColor = lerpColor(0xffa726, 0x87ceeb, t);
      ambientColor = lerpColor(0xffeb3b, 0xffffff, t);
      sunIntensity = 0.8 + t * 0.2;
      ambientIntensity = 0.7 + t * 0.1;
    } else if (hour >= 9 && hour < 12) {
      // 上午 - 明亮的蓝天
      skyColor = 0x87ceeb;
      ambientColor = 0xffffff;
      sunIntensity = 1.0;
      ambientIntensity = 0.8;
    } else if (hour >= 12 && hour < 17) {
      // 下午 - 标准白天
      skyColor = 0x87ceeb;
      ambientColor = 0xffffff;
      sunIntensity = 1.0;
      ambientIntensity = 0.8;
    } else if (hour >= 17 && hour < 19) {
      // 傍晚 - 温暖的橙黄
      var t = (hour - 17) / 2;
      skyColor = lerpColor(0x87ceeb, 0xffa726, t);
      ambientColor = lerpColor(0xffffff, 0xffcc80, t);
      sunIntensity = 1.0 - t * 0.3;
      ambientIntensity = 0.8 - t * 0.2;
    } else {
      // 黄昏 19:00-21:00 - 从橙红过渡到深蓝
      var t = (hour - 19) / 2;
      skyColor = lerpColor(0xffa726, 0x1a237e, t);
      ambientColor = lerpColor(0xffcc80, 0x3949ab, t);
      sunIntensity = 0.7 - t * 0.65;
      ambientIntensity = 0.6 - t * 0.4;
    }
    
    // 应用颜色
    if (scene.background) {
      scene.background.setHex(skyColor);
    }
    
    sunLight.intensity = sunIntensity;
    ambientLight.intensity = ambientIntensity;
    ambientLight.color.setHex(ambientColor);
    
    // 太阳位置根据虚拟时间变化
    var sunAngle = ((hour - 6) / 24) * Math.PI * 2;
    sunLight.position.x = Math.cos(sunAngle) * 50;
    sunLight.position.y = Math.max(5, Math.sin(sunAngle) * 80);
    
    // 更新雾的颜色
    if (scene.fog) {
      scene.fog.color.setHex(skyColor);
    }
  }
  
  // 颜色插值函数
  function lerpColor(c1, c2, t) {
    var r1 = (c1 >> 16) & 0xff;
    var g1 = (c1 >> 8) & 0xff;
    var b1 = c1 & 0xff;
    var r2 = (c2 >> 16) & 0xff;
    var g2 = (c2 >> 8) & 0xff;
    var b2 = c2 & 0xff;
    var r = Math.round(r1 + (r2 - r1) * t);
    var g = Math.round(g1 + (g2 - g1) * t);
    var b = Math.round(b1 + (b2 - b1) * t);
    return (r << 16) | (g << 8) | b;
  }
  
  // ============ UI IMPROVEMENTS ============
  
  function setupCollapsiblePanels() {
    // Info panel toggle is already in HTML inline
    // Don't reset window.dashboardPanel - let dashboard-panel.js manage it
    console.log('[Enhanced v8] Collapsible panels ready');
  }
  
  // Global function to show message above agent
  window.showAgentMessage = function(agentId, message) {
    if (!scene || !message) return;
    
    var agentMesh = null;
    scene.traverse(function(obj) {
      if (obj.userData && obj.userData.agentId === agentId) {
        agentMesh = obj;
      }
    });
    
    if (!agentMesh) {
      console.log('[Enhanced v8] Agent not found:', agentId);
      return;
    }
    
    if (messageSprites[agentId]) {
      scene.remove(messageSprites[agentId]);
    }
    
    var canvas = document.createElement('canvas');
    var context = canvas.getContext('2d');
    canvas.width = 512;
    canvas.height = 96;
    
    context.fillStyle = 'rgba(0, 0, 0, 0.8)';
    context.beginPath();
    context.roundRect(0, 0, canvas.width, canvas.height, 16);
    context.fill();
    
    context.fillStyle = '#ffffff';
    context.font = 'bold 28px Arial, sans-serif';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    
    var displayText = message;
    if (displayText.length > 35) {
      displayText = displayText.substring(0, 32) + '...';
    }
    context.fillText(displayText, canvas.width / 2, canvas.height / 2);
    
    var texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    
    var material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
    var sprite = new THREE.Sprite(material);
    sprite.scale.set(6, 1.2, 1);
    
    var pos = new THREE.Vector3();
    agentMesh.getWorldPosition(pos);
    sprite.position.set(pos.x, pos.y + 3.5, pos.z);
    
    scene.add(sprite);
    messageSprites[agentId] = sprite;
    
    setTimeout(function() {
      if (messageSprites[agentId] === sprite) {
        scene.remove(sprite);
        delete messageSprites[agentId];
        material.dispose();
        texture.dispose();
      }
    }, 5000);
    
    console.log('[Enhanced v8] Message displayed above agent:', agentId);
  };
  
  setTimeout(checkAndAdd, 2000);
})();
