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
    
    group.position.set(x, 0, z);
    scene.add(group);
  }
  
  function createTaskCenter(scene, x, z) {
    var group = new THREE.Group();
    var redMat = new THREE.MeshLambertMaterial({ color: 0xff6b6b });
    var darkMat = new THREE.MeshLambertMaterial({ color: 0xc62828 });
    
    var main = new THREE.Mesh(new THREE.BoxGeometry(8, 12, 8), redMat);
    main.position.y = 6;
    group.add(main);
    
    var entrance = new THREE.Mesh(new THREE.BoxGeometry(3, 4, 1), darkMat);
    entrance.position.set(0, 2, 4.5);
    group.add(entrance);
    
    var roof = new THREE.Mesh(new THREE.ConeGeometry(6, 3, 4), darkMat);
    roof.rotation.y = Math.PI / 4;
    roof.position.y = 13.5;
    group.add(roof);
    
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
    });
    
    group.position.set(x, 0, z);
    scene.add(group);
  }
  
  function createArchive(scene, x, z) {
    var group = new THREE.Group();
    var purpleMat = new THREE.MeshLambertMaterial({ color: 0x9c27b0 });
    var darkMat = new THREE.MeshLambertMaterial({ color: 0x6a1b9a });
    
    var main = new THREE.Mesh(new THREE.BoxGeometry(7, 10, 10), purpleMat);
    main.position.y = 5;
    group.add(main);
    
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
    }
    
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
    
    group.position.set(x, 0, z);
    scene.add(group);
  }
  
  // ============ DAY/NIGHT CYCLE ============
  
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
    if (!window.currentDayPhase || !sunLight || !ambientLight) return;
    
    var phase = window.currentDayPhase.phase;
    var progress = window.currentDayPhase.progress;
    
    // Interpolate between colors based on phase
    var skyColors = {
      '清晨': { sky: 0xff9e80, ambient: 0xffd54f },
      '白天': { sky: 0x87ceeb, ambient: 0xffffff },
      '黄昏': { sky: 0xff7043, ambient: 0xff8a65 },
      '夜晚': { sky: 0x1a237e, ambient: 0x5c6bc0 }
    };
    
    var intensities = {
      '清晨': { sun: 0.8, ambient: 0.6 },
      '白天': { sun: 1.0, ambient: 0.8 },
      '黄昏': { sun: 0.6, ambient: 0.4 },
      '夜晚': { sun: 0.1, ambient: 0.2 }
    };
    
    var colors = skyColors[phase.name] || skyColors['白天'];
    var ints = intensities[phase.name] || intensities['白天'];
    
    // Update scene background if possible
    if (scene.background) {
      scene.background.setHex(colors.sky);
    }
    
    // Update lights
    sunLight.intensity = ints.sun;
    ambientLight.intensity = ints.ambient;
    ambientLight.color.setHex(colors.ambient);
    
    // Move sun position
    var angle = (window.currentDayPhase.index / 4) * Math.PI * 2 + progress * Math.PI / 2;
    sunLight.position.x = Math.cos(angle) * 50;
    sunLight.position.y = Math.sin(angle) * 50 + 25;
    
    // Update fog
    if (scene.fog) {
      scene.fog.color.setHex(colors.sky);
    }
  }
  
  // ============ UI IMPROVEMENTS ============
  
  function setupCollapsiblePanels() {
    // Info panel toggle is already in HTML inline
    // Just set up dashboard panel reference
    window.dashboardPanel = null;
    
    // Wait for dashboard to be created
    setTimeout(function() {
      if (window.DashboardPanel && window.dashboard) {
        window.dashboardPanel = window.dashboard;
      }
    }, 2000);
    
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
