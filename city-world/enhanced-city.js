/**
 * Agent City Enhanced v8 - Complete Features
 * - Collapsible panels
 * - Agent reply messages above head
 * - Day/Night cycle with lighting effects
 * - Voice synthesis (TTS)
 */

(function() {
  console.log('[Enhanced v8] Loading with day/night cycle...');
  
  var checkCount = 0;
  var maxChecks = 100;
  var scene = null;
  var messageSprites = {};
  var sunLight = null;
  var ambientLight = null;
  var stars = null;
  var starPositions = null;
  var starBaseSizes = null;
  var sunMesh = null; // 太阳3D模型
  var moonMesh = null; // 月亮3D模型
  
  // ============ 语音合成系统 ============
  var speechSynth = window.speechSynthesis;
  var currentUtterance = null;
  var voiceEnabled = false; // 合并开关：语音和环境音
  var selectedVoice = null;
  
  // ============ 柔和音乐化环境音效系统 ============
  var audioContext = null;
  var masterGain = null;
  var currentTimePeriod = 'day';
  var musicNodes = {};
  
  // 初始化音乐音效系统
  function initAmbientSounds() {
    try {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      masterGain = audioContext.createGain();
      masterGain.connect(audioContext.destination);
      masterGain.gain.value = 0;
      
      // 创建各类环境音乐
      createAmbientMusic();
      
      console.log('[Ambient] 环境音乐系统已初始化');
    } catch (e) {
      console.log('[Ambient] 音乐系统不支持:', e);
    }
  }
  
  // 创建环境音乐
  function createAmbientMusic() {
    if (!audioContext) return;
    
    // 白天的轻快音乐（阳光感）
    createDayMusic();
    
    // 傍晚的温暖音乐
    createEveningMusic();
    
    // 夜晚的催眠音乐（冥想感）
    createNightMusic();
  }
  
  // 白天轻快音乐 - 使用柔和的和弦
  function createDayMusic() {
    // C大调和弦的高音区 - 更柔和
    var frequencies = [523.25, 659.25, 783.99]; // C5, E5, G5 - 更高更轻柔
    
    frequencies.forEach(function(freq) {
      var osc = audioContext.createOscillator();
      var gain = audioContext.createGain();
      var filter = audioContext.createBiquadFilter();
      
      osc.type = 'sine';
      osc.frequency.value = freq;
      
      // 添加轻微的颤音
      var lfo = audioContext.createOscillator();
      var lfoGain = audioContext.createGain();
      lfo.type = 'sine';
      lfo.frequency.value = 0.2;
      lfoGain.gain.value = 3;
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      
      // 低通滤波器让声音更柔和
      filter.type = 'lowpass';
      filter.frequency.value = 1500;
      
      gain.gain.value = 0;
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(masterGain);
      
      osc.start();
      lfo.start();
      
      if (!musicNodes.day) musicNodes.day = [];
      musicNodes.day.push({ osc: osc, gain: gain, lfo: lfo, filter: filter });
    });
  }
  
  // 傍晚温暖音乐 - 带有怀旧感
  function createEveningMusic() {
    // Am和弦的高音区 - 更柔和
    var frequencies = [440.00, 523.25, 659.25]; // A4, C5, E5 - 更高更轻柔
    
    frequencies.forEach(function(freq) {
      var osc = audioContext.createOscillator();
      var gain = audioContext.createGain();
      var lfo = audioContext.createOscillator();
      var lfoGain = audioContext.createGain();
      var filter = audioContext.createBiquadFilter();
      
      osc.type = 'sine';
      osc.frequency.value = freq;
      
      lfo.type = 'sine';
      lfo.frequency.value = 0.15;
      lfoGain.gain.value = 2;
      
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      
      // 低通滤波
      filter.type = 'lowpass';
      filter.frequency.value = 1200;
      
      gain.gain.value = 0;
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(masterGain);
      
      osc.start();
      lfo.start();
      
      if (!musicNodes.evening) musicNodes.evening = [];
      musicNodes.evening.push({ osc: osc, gain: gain, lfo: lfo, filter: filter });
    });
  }
  
  // 夜晚催眠音乐 - 低沉缓慢
  function createNightMusic() {
    // 极低沉的 Pad - 使用八度和弦（更轻柔）
    var frequencies = [130.81, 146.83, 164.81]; // C3, D3, E3 - 更柔和的频率
    
    frequencies.forEach(function(freq) {
      var osc = audioContext.createOscillator();
      var gain = audioContext.createGain();
      var lfo = audioContext.createOscillator();
      var lfoGain = audioContext.createGain();
      
      osc.type = 'sine';
      osc.frequency.value = freq;
      
      // 非常缓慢的颤音
      lfo.type = 'sine';
      lfo.frequency.value = 0.08;
      lfoGain.gain.value = 2;
      
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      
      gain.gain.value = 0;
      osc.connect(gain);
      gain.connect(masterGain);
      
      osc.start();
      lfo.start();
      
      if (!musicNodes.night) musicNodes.night = [];
      musicNodes.night.push({ osc: osc, gain: gain, lfo: lfo });
    });
    
    // 添加非常轻柔的蝉鸣
    createCricketForNight();
    
    // 添加非常轻柔的风声
    createWindForNight();
  }
  
  // 夜晚的轻柔蝉鸣
  function createCricketForNight() {
    if (!audioContext) return;
    
    var osc = audioContext.createOscillator();
    var gain = audioContext.createGain();
    var filter = audioContext.createBiquadFilter();
    
    osc.type = 'sine';
    osc.frequency.value = 3500; // 较高频率
    
    filter.type = 'bandpass';
    filter.frequency.value = 3500;
    filter.Q.value = 10;
    
    gain.gain.value = 0;
    
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);
    
    osc.start();
    
    // 随机轻微的蝉鸣
    function chirp() {
      if (currentTimePeriod !== 'night') {
        setTimeout(chirp, 2000);
        return;
      }
      
      var now = audioContext.currentTime;
      // 极轻的音量
      gain.gain.setValueAtTime(0.003, now);
      // 随机频率微调
      osc.frequency.setValueAtTime(3400 + Math.random() * 200, now);
      
      setTimeout(chirp, 1500 + Math.random() * 4000);
    }
    
    chirp();
    musicNodes.nightCricket = { osc: osc, gain: gain, filter: filter };
  }
  
  // 夜晚的轻柔风声
  function createWindForNight() {
    if (!audioContext) return;
    
    // 生成粉红噪音
    var bufferSize = audioContext.sampleRate * 2;
    var buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
    var data = buffer.getChannelData(0);
    
    var b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (var i = 0; i < bufferSize; i++) {
      var white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }
    
    var source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    
    var filter = audioContext.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 300;
    
    var gain = audioContext.createGain();
    gain.gain.value = 0;
    
    source.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);
    source.start();
    
    // 随机调节风声
    function modulateWind() {
      if (currentTimePeriod !== 'night') {
        setTimeout(modulateWind, 500);
        return;
      }
      
      var now = audioContext.currentTime;
      // 非常轻的风声
      gain.gain.linearRampToValueAtTime(0.008 + Math.random() * 0.005, now + 0.5);
      
      setTimeout(modulateWind, 2000 + Math.random() * 3000);
    }
    
    modulateWind();
    musicNodes.nightWind = { source: source, gain: gain, filter: filter };
  }
  
  // 更新时间段的环境音乐
  function updateAmbientForPeriod(period) {
    currentTimePeriod = period;
    
    if (!audioContext || !masterGain) return;
    
    var now = audioContext.currentTime;
    var targetVolume = voiceEnabled ? 0.2 : 0;
    masterGain.gain.linearRampToValueAtTime(targetVolume, now + 2);
    
    // 先关闭所有音乐
    ['day', 'evening', 'night'].forEach(function(p) {
      if (musicNodes[p]) {
        musicNodes[p].forEach(function(node) {
          node.gain.gain.linearRampToValueAtTime(0, now + 1.5);
        });
      }
    });
    
    // 关闭夜晚的特殊音效
    if (musicNodes.nightCricket) {
      musicNodes.nightCricket.gain.gain.linearRampToValueAtTime(0, now + 1.5);
    }
    if (musicNodes.nightWind) {
      musicNodes.nightWind.gain.gain.linearRampToValueAtTime(0, now + 1.5);
    }
    
    // 根据时段开启对应音乐
    setTimeout(function() {
      var fadeInTime = now + 1.5;
      
      if (period === 'day' && musicNodes.day) {
        musicNodes.day.forEach(function(node) {
          node.gain.gain.linearRampToValueAtTime(0.06, fadeInTime + 1);
        });
      } else if (period === 'evening' && musicNodes.evening) {
        musicNodes.evening.forEach(function(node) {
          node.gain.gain.linearRampToValueAtTime(0.08, fadeInTime + 1);
        });
      } else if (period === 'night' && musicNodes.night) {
        musicNodes.night.forEach(function(node) {
          node.gain.gain.linearRampToValueAtTime(0.08, fadeInTime + 1);
        });
        // 夜晚开启轻柔蝉鸣
        if (musicNodes.nightCricket) {
          musicNodes.nightCricket.gain.gain.linearRampToValueAtTime(0.004, fadeInTime + 2);
        }
        // 夜晚开启轻柔风声
        if (musicNodes.nightWind) {
          musicNodes.nightWind.gain.gain.linearRampToValueAtTime(0.01, fadeInTime + 2);
        }
      }
    }, 1000);
    
    console.log('[Ambient] 环境音乐已切换到:', period);
  }
  
  // 初始化语音
  function initVoice() {
    if (!speechSynth) {
      console.log('[Voice] 浏览器不支持语音合成');
      return;
    }
    
    // 等待声音加载
    function loadVoices() {
      var voices = speechSynth.getVoices();
      console.log('[Voice] 可用声音数量:', voices.length);
      
      // 优先选择中文声音
      var zhVoice = voices.find(function(v) { 
        return v.lang.includes('zh') && v.name.includes('Female'); 
      });
      if (!zhVoice) {
        zhVoice = voices.find(function(v) { return v.lang.includes('zh'); });
      }
      if (!zhVoice) {
        zhVoice = voices[0];
      }
      
      if (zhVoice) {
        selectedVoice = zhVoice;
        console.log('[Voice] 选择声音:', zhVoice.name);
      }
    }
    
    // Chrome 需要等待
    if (speechSynth.onvoiceschanged !== undefined) {
      speechSynth.onvoiceschanged = loadVoices;
    }
    loadVoices();
  }
  
  // 说话
  function speak(text, agentId) {
    if (!speechSynth || !voiceEnabled || !text) return;
    
    // 停止之前的语音
    if (speechSynth.speaking) {
      speechSynth.cancel();
    }
    
    // 创建新的语音
    var utterance = new SpeechSynthesisUtterance(text);
    
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
    utterance.lang = 'zh-CN';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    
    // 根据智能体调整音调
    if (agentId && agentId.includes('xiao')) {
      utterance.pitch = 1.1; // 小吉声音稍高
    }
    
    // 开始播放
    speechSynth.speak(utterance);
    console.log('[Voice] 播放:', text.substring(0, 30) + '...');
  }
  
  // 切换语音开关（合并语音和环境音）
  function toggleVoiceSystem() {
    voiceEnabled = !voiceEnabled;
    
    if (voiceEnabled) {
      // 确保 AudioContext 正在运行（如果需要）
      if (speechSynth && speechSynth.paused) {
        speechSynth.resume();
      }
      // 旧的 ambient 音效已禁用，使用天气音效系统
      // 开启环境音 - 已禁用
      if (weatherAudioContext && weatherAudioContext.state === 'suspended') {
        weatherAudioContext.resume();
      }
    } else {
      // 停止所有语音
      if (speechSynth) {
        speechSynth.cancel();
      }
      // 关闭天气音效
      if (weatherGainNode) {
        weatherGainNode.gain.value = 0;
      }
    }
    
    console.log('[Voice] 语音系统:', voiceEnabled ? '开启' : '关闭');
    return voiceEnabled;
  }
  
  // 暴露给全局，让其他脚本可以调用
  window.speakText = speak;
  window.toggleVoiceSystem = toggleVoiceSystem;
  
  // 停止语音
  function stopSpeech() {
    if (speechSynth) {
      speechSynth.cancel();
    }
  }
  
  // 切换语音开关
  function toggleVoice() {
    voiceEnabled = !voiceEnabled;
    console.log('[Voice] 语音:', voiceEnabled ? '开启' : '关闭');
    
    // 更新 UI 提示
    var voiceBtn = document.getElementById('voice-toggle-btn');
    if (voiceBtn) {
      voiceBtn.textContent = voiceEnabled ? '🔊' : '🔇';
      voiceBtn.style.background = voiceEnabled ? 'rgba(78, 205, 196, 0.9)' : 'rgba(128, 128, 128, 0.9)';
    }
    
    if (!voiceEnabled) {
      stopSpeech();
    }
    
    return voiceEnabled;
  }
  
  // 创建语音切换按钮
  function createVoiceButton() {
    var btn = document.createElement('div');
    btn.id = 'voice-toggle-btn';
    btn.textContent = '🔇';
    btn.title = '点击开启语音';
    btn.style.cssText = 'position:fixed;bottom:140px;right:20px;width:50px;height:50px;background:rgba(128,128,128,0.9);border-radius:50%;color:white;font-size:24px;text-align:center;line-height:50px;cursor:pointer;z-index:1001;box-shadow:0 5px 20px rgba(0,0,0,0.5);border:2px solid rgba(255,255,255,0.3);transition:all 0.3s ease;';
    btn.onclick = function() {
      var enabled = toggleVoiceSystem();
      this.title = enabled ? '点击关闭语音' : '点击开启语音';
      this.textContent = enabled ? '🔊' : '🔇';
      this.style.background = enabled ? 'rgba(78,205,196,0.9)' : 'rgba(128,128,128,0.9)';
    };
    document.body.appendChild(btn);
    console.log('[Voice] 语音按钮已创建');
  }
  
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
      initVoice();
      // initWeatherSounds(); // 天气音效已临时禁用
      createVoiceButton();
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
    setupBuildingHover(scene);
    setupLOD(scene);
    initBirds(scene);
    //loadExternalModel(scene);
    console.log('[Enhanced v8] City complete!');
  }
  
  // ============ 加载外部 GLB 模型 ============
  function loadExternalModel(scene) {
    console.log('[Model] Starting to load external model...');
    
    // 使用动态导入加载 GLTFLoader
    import('https://unpkg.com/three@0.150.0/examples/jsm/loaders/GLTFLoader.js')
      .then(function(module) {
        console.log('[Model] Module keys:', Object.keys(module));
        // 尝试不同的导入方式
        var GLTFLoader = module.GLTFLoader || module.default;
        console.log('[Model] GLTFLoader:', typeof GLTFLoader);
        
        if (!GLTFLoader) {
          console.error('[Model] GLTFLoader not found in module');
          return;
        }
        
        var loader = new GLTFLoader();
        var modelPath = 'mn.glb?v=' + Date.now();
        console.log('[Model] Loading:', modelPath);
        
        loader.load(
          modelPath,
          function(gltf) {
            console.log('[Model] Loaded successfully!');
            var model = gltf.scene;
            
            // 设置模型位置
            model.position.set(0, 0, 0);
            
            // 调整模型大小
            var box = new THREE.Box3().setFromObject(model);
            var size = box.getSize(new THREE.Vector3());
            var maxDim = Math.max(size.x, size.y, size.z);
            console.log('[Model] Model size:', size.x.toFixed(1), size.y.toFixed(1), size.z.toFixed(1), 'max:', maxDim.toFixed(1));
            
            if (maxDim > 50) {
              var scale = 50 / maxDim;
              model.scale.setScalar(scale);
              console.log('[Model] Scaled by:', scale.toFixed(2));
            }
            
            model.traverse(function(child) {
              if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
              }
            });
            
            scene.add(model);
            console.log('[Model] Added to scene at (0,0,0)');
          },
          function(progress) {
            if (progress.total > 0) {
              console.log('[Model] Progress:', (progress.loaded / progress.total * 100).toFixed(1) + '%');
            }
          },
          function(error) {
            console.error('[Model] Load error:', error);
          }
        );
      })
      .catch(function(err) {
        console.error('[Model] Failed to load GLTFLoader:', err);
      });
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

// Expose for external animation loop
window.updateBirds = updateBirds;
window.lastBirdTime = null; // 上次更新时间（用于计算 deltaTime）

function updateBirds(time) {
    // 计算真实时间差
    var deltaTime = window.lastBirdTime ? (time - window.lastBirdTime) / 16.67 : 1;
    window.lastBirdTime = time;
    
    // 限制 deltaTime 防止跳帧太大
    if (deltaTime > 3) deltaTime = 1;
    
    birds.forEach(function(bird) {
        var data = bird.userData;
        
        // Wing flapping（使用 deltaTime）
        data.wingPhase += 0.25 * deltaTime;
        var wingAngle = Math.sin(data.wingPhase) * 0.6;
        bird.children.forEach(function(child) {
            if (child.name === 'leftWing') child.rotation.z = wingAngle;
            else if (child.name === 'rightWing') child.rotation.z = -wingAngle;
        });
        
        switch (data.state) {
            case 'flying':
                data.angle += data.speed * 0.008 * data.flyDirection * deltaTime;
                data.verticalOffset += 0.02 * deltaTime;
                
                bird.position.x = Math.cos(data.angle) * data.radius;
                bird.position.z = Math.sin(data.angle) * data.radius;
                bird.position.y = data.height + Math.sin(data.verticalOffset) * 1.5;
                bird.rotation.y = data.angle + Math.PI / 2;
                
                data.stateTimer += deltaTime;
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
                        bird.position.x += dx * 0.03 * deltaTime;
                        bird.position.y += dy * 0.03 * deltaTime;
                        bird.position.z += dz * 0.03 * deltaTime;
                        bird.rotation.y = Math.atan2(dx, dz);
                        data.wingPhase += 0.15 * deltaTime;
                    }
                }
                break;
                
            case 'landed':
                data.stateTimer += deltaTime;
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
                bird.position.y += 0.05 * deltaTime;
                data.wingPhase += 0.3 * deltaTime;
                
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
    
    // 创建太阳
    createSunAndMoon(scene);
    
    // 创建天气粒子系统
    console.log('[Weather] About to call createWeatherSystem, scene:', !!scene);
    createWeatherSystem(scene);
    
    // Sync with dashboard panel cycle
    setInterval(updateLighting, 1000);
    
    // 天气变化定时器（每30-60秒变化一次）
    setInterval(updateWeather, 30000 + Math.random() * 30000);
    
    // Create stars
    createStars(scene);
    
    console.log('[Enhanced v8] Day/night cycle started');
  }
  
  // ========== 天气系统 ==========
  var currentWeather = 'sunny'; // sunny, cloudy, rainy, snowy
  var weatherParticles = null;
  var raindrops = [];
  var snowflakes = [];
  var weatherTransitioning = false;
  var targetWeather = 'sunny';
  var weatherAlpha = 0; // 0-1 过渡
  var weatherAudioContext = null;
  var weatherGainNode = null;
  var currentWeatherSound = null;
  
  // 暴露到 window 对象供其他组件使用
  window.getCurrentWeather = function() { return currentWeather; };
  window.setWeather = function(w) {
    if (['sunny', 'cloudy', 'rainy', 'snowy'].indexOf(w) >= 0) {
      currentWeather = w;
      weatherTransitioning = false;
      weatherAlpha = 1;
      console.log('[Enhanced v8] Weather set to:', w, 'particles:', !!weatherParticles);
      // 手动触发一次粒子更新
      if (weatherParticles) {
        updateWeatherParticles(1);
      }
      // 切换天气音效
      if (weatherAudioContext) {
        playWeatherSound(w);
      }
    }
  };
  window.toggleWeather = function() {
    var weathers = ['sunny', 'cloudy', 'rainy', 'snowy'];
    var idx = weathers.indexOf(currentWeather);
    idx = (idx + 1) % weathers.length;
    window.setWeather(weathers[idx]);
  };
  
  // 暴露天气更新函数到全局
  window.updateWeatherParticles = updateWeatherParticles;
  
  // ========== 天气音效系统 ==========
  function initWeatherSounds() {
    try {
      weatherAudioContext = new (window.AudioContext || window.webkitAudioContext)();
      weatherGainNode = weatherAudioContext.createGain();
      weatherGainNode.gain.value = 0.15; // 音量较小
      weatherGainNode.connect(weatherAudioContext.destination);
      
      console.log('[Weather Sound] Initialized, context ready');
      
      // 根据当前天气播放音效
      playWeatherSound(currentWeather);
    } catch (e) {
      console.error('[Weather Sound] Init failed:', e);
    }
  }
  
  function playWeatherSound(weather) {
    if (!weatherAudioContext || !weatherGainNode) return;
    
    // 停止之前的音效
    stopCurrentWeatherSound();
    
    console.log('[Weather Sound] Playing:', weather);
    
    if (weather === 'rainy') {
      playRainSound();
    } else if (weather === 'snowy') {
      playSnowSound();
    } else if (weather === 'cloudy') {
      playCloudySound();
    } else {
      playSunnySound();
    }
  }
  
  function stopCurrentWeatherSound() {
    if (currentWeatherSound) {
      try {
        currentWeatherSound.forEach(function(node) {
          if (node.stop) node.stop();
          if (node.disconnect) node.disconnect();
        });
      } catch (e) {}
      currentWeatherSound = null;
    }
  }
  
  // 雨天 - 柔和的雨声（使用滤波后的噪音）
  function playRainSound() {
    if (!weatherAudioContext) return;
    
    var nodes = [];
    
    // 创建蓝噪音源（使用多个频率的叠加）
    var bufferSize = 4096;
    var rainNode = weatherAudioContext.createScriptProcessor(bufferSize, 1, 1);
    var rainFilter = weatherAudioContext.createBiquadFilter();
    var rainGain = weatherAudioContext.createGain();
    
    rainFilter.type = 'lowpass';
    rainFilter.frequency.value = 1200;
    rainGain.gain.value = 0.08; // 非常轻柔
    
    // 生成滤波后的噪音
    rainNode.onaudioprocess = function(e) {
      var output = e.outputBuffer.getChannelData(0);
      var prev = 0;
      for (var i = 0; i < bufferSize; i++) {
        // 褐噪音（比白噪音更柔和）
        var white = Math.random() * 2 - 1;
        prev = (prev + (0.02 * white)) / 1.02;
        output[i] = prev * 3.5;
      }
    };
    
    rainNode.connect(rainFilter);
    rainFilter.connect(rainGain);
    rainGain.connect(weatherGainNode);
    
    nodes.push(rainNode);
    nodes.push(rainFilter);
    nodes.push(rainGain);
    
    currentWeatherSound = nodes;
  }
  
  // 雪天 - 柔和的风声
  function playSnowSound() {
    if (!weatherAudioContext) return;
    
    var nodes = [];
    var bufferSize = 4096;
    var windNode = weatherAudioContext.createScriptProcessor(bufferSize, 1, 1);
    var windFilter = weatherAudioContext.createBiquadFilter();
    var windGain = weatherAudioContext.createGain();
    
    windFilter.type = 'lowpass';
    windFilter.frequency.value = 500;
    windGain.gain.value = 0.05; // 非常轻柔
    
    windNode.onaudioprocess = function(e) {
      var output = e.outputBuffer.getChannelData(0);
      var prev = 0;
      for (var i = 0; i < bufferSize; i++) {
        var white = Math.random() * 2 - 1;
        prev = (prev + (0.01 * white)) / 1.01;
        output[i] = prev * 4;
      }
    };
    
    windNode.connect(windFilter);
    windFilter.connect(windGain);
    windGain.connect(weatherGainNode);
    
    nodes.push(windNode);
    nodes.push(windFilter);
    nodes.push(windGain);
    
    currentWeatherSound = nodes;
  }
  
  // 多云 - 轻柔的风声
  function playCloudySound() {
    if (!weatherAudioContext) return;
    
    var nodes = [];
    var bufferSize = 4096;
    var windNode = weatherAudioContext.createScriptProcessor(bufferSize, 1, 1);
    var windFilter = weatherAudioContext.createBiquadFilter();
    var windGain = weatherAudioContext.createGain();
    
    windFilter.type = 'lowpass';
    windFilter.frequency.value = 400;
    windGain.gain.value = 0.03; // 非常轻柔
    
    windNode.onaudioprocess = function(e) {
      var output = e.outputBuffer.getChannelData(0);
      var prev = 0;
      for (var i = 0; i < bufferSize; i++) {
        var white = Math.random() * 2 - 1;
        prev = (prev + (0.008 * white)) / 1.008;
        output[i] = prev * 3;
      }
    };
    
    windNode.connect(windFilter);
    windFilter.connect(windGain);
    windGain.connect(weatherGainNode);
    
    nodes.push(windNode);
    nodes.push(windFilter);
    nodes.push(windGain);
    
    currentWeatherSound = nodes;
  }
  
  // 晴天 - 几乎无声
  function playSunnySound() {
    currentWeatherSound = null;
  }
  
  var weatherConfigs = {
    sunny: {
      skyColor: 0x87ceeb,
      fogColor: 0x87ceeb,
      sunIntensity: 1.0,
      ambientMod: 1.0,
      particleCount: 0,
      particleColor: 0xffffff
    },
    cloudy: {
      skyColor: 0x708090,
      fogColor: 0x778899,
      sunIntensity: 0.6,
      ambientMod: 0.8,
      particleCount: 0,
      particleColor: 0x999999
    },
    rainy: {
      skyColor: 0x4a5568,
      fogColor: 0x5a6577,
      sunIntensity: 0.3,
      ambientMod: 0.6,
      particleCount: 800,
      particleColor: 0x8899aa
    },
    snowy: {
      skyColor: 0xb0c4de,
      fogColor: 0xc8d6e5,
      sunIntensity: 0.5,
      ambientMod: 0.7,
      particleCount: 600,
      particleColor: 0xffffff
    }
  };
  
  function createWeatherSystem(scene) {
    console.log('[Weather] Creating weather system...');
    
    // 雨滴粒子
    var rainGeo = new THREE.BufferGeometry();
    var rainCount = 800;
    var rainPos = new Float32Array(rainCount * 3);
    
    for (var i = 0; i < rainCount; i++) {
      rainPos[i * 3] = Math.random() * 60 - 30;
      rainPos[i * 3 + 1] = Math.random() * 40 + 10;
      rainPos[i * 3 + 2] = Math.random() * 60 - 30;
    }
    
    rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPos, 3));
    
    var rainMat = new THREE.PointsMaterial({
      color: 0x6688aa,
      size: 0.3,
      transparent: true,
      opacity: 0.6,
      sizeAttenuation: true
    });
    
    raindrops = new THREE.Points(rainGeo, rainMat);
    raindrops.visible = false;
    raindrops.name = 'rain';
    scene.add(raindrops);
    
    // 雪花粒子
    var snowGeo = new THREE.BufferGeometry();
    var snowCount = 600;
    var snowPos = new Float32Array(snowCount * 3);
    
    for (var i = 0; i < snowCount; i++) {
      snowPos[i * 3] = Math.random() * 60 - 30;
      snowPos[i * 3 + 1] = Math.random() * 40 + 10;
      snowPos[i * 3 + 2] = Math.random() * 60 - 30;
    }
    
    snowGeo.setAttribute('position', new THREE.BufferAttribute(snowPos, 3));
    
    var snowMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.4,
      transparent: true,
      opacity: 0.85,
      sizeAttenuation: true
    });
    
    snowflakes = new THREE.Points(snowGeo, snowMat);
    snowflakes.visible = false;
    snowflakes.name = 'snow';
    scene.add(snowflakes);
    
    weatherParticles = { rain: raindrops, snow: snowflakes };
    console.log('[Enhanced v8] Weather system created');
  }
  
  function updateWeather() {
    if (weatherTransitioning) return;
    
    var weathers = ['sunny', 'cloudy', 'rainy', 'snowy'];
    var weights = [0.35, 0.30, 0.20, 0.15]; // 概率权重
    
    // 根据权重随机选择
    var r = Math.random();
    var cumWeight = 0;
    var newWeather = 'sunny';
    
    for (var i = 0; i < weathers.length; i++) {
      cumWeight += weights[i];
      if (r <= cumWeight) {
        newWeather = weathers[i];
        break;
      }
    }
    
    if (newWeather !== currentWeather) {
      targetWeather = newWeather;
      weatherTransitioning = true;
      weatherAlpha = 0;
      
      // 过渡时间 3 秒
      setTimeout(function() {
        currentWeather = targetWeather;
        weatherTransitioning = false;
        weatherAlpha = 1;
        console.log('[Enhanced v8] Weather changed to:', currentWeather);
      }, 3000);
    }
  }
  
  function updateWeatherParticles(deltaTime) {
    console.log('[Weather] updateWeatherParticles called, weatherParticles:', !!weatherParticles);
    if (!weatherParticles) {
      console.log('[Weather] Particles not initialized');
      return;
    }
    
    var now = Date.now();
    if (!window._weatherLastTime) window._weatherLastTime = now;
    var dt = (now - window._weatherLastTime) / 1000;
    window._weatherLastTime = now;
    if (dt > 0.1) dt = 0.016;
    
    // 每60帧打印一次日志
    window._weatherFrameCount = (window._weatherFrameCount || 0) + 1;
    if (window._weatherFrameCount % 60 === 0) {
      console.log('[Weather] Updating dt:', dt.toFixed(4), 'rainy:', currentWeather === 'rainy', 'pos y:', raindrops.geometry.attributes.position.array[1].toFixed(2));
    }
    
    // 更新雨滴
    if (currentWeather === 'rainy' || (weatherTransitioning && targetWeather === 'rainy')) {
      if (!raindrops.visible) {
        raindrops.visible = true;
      }
      var positions = raindrops.geometry.attributes.position.array;
      var wind = Math.sin(now * 0.0005) * 2;
      
      for (var i = 0; i < positions.length / 3; i++) {
        // 雨滴下落：每秒15-20单位
        positions[i * 3 + 1] -= (15 + Math.random() * 5) * dt;
        positions[i * 3] += (2 + wind) * dt;
        
        if (positions[i * 3 + 1] < 0) {
          positions[i * 3 + 1] = 35 + Math.random() * 15;
          positions[i * 3] = Math.random() * 60 - 30;
          positions[i * 3 + 2] = Math.random() * 60 - 30;
        }
      }
      raindrops.geometry.attributes.position.needsUpdate = true;
    } else {
      if (raindrops.visible) {
        raindrops.visible = false;
      }
    }
    
    // 更新雪花
    if (currentWeather === 'snowy' || (weatherTransitioning && targetWeather === 'snowy')) {
      if (!snowflakes.visible) {
        snowflakes.visible = true;
      }
      var positions = snowflakes.geometry.attributes.position.array;
      
      for (var i = 0; i < positions.length / 3; i++) {
        // 雪花飘落：每秒2-4单位
        positions[i * 3 + 1] -= (2 + Math.random() * 2) * dt;
        positions[i * 3] += Math.sin(now * 0.001 + i) * 1.5 * dt;
        
        if (positions[i * 3 + 1] < 0) {
          positions[i * 3 + 1] = 35 + Math.random() * 15;
          positions[i * 3] = Math.random() * 60 - 30;
          positions[i * 3 + 2] = Math.random() * 60 - 30;
        }
      }
      snowflakes.geometry.attributes.position.needsUpdate = true;
    } else {
      if (snowflakes.visible) {
        snowflakes.visible = false;
      }
    }
  }
  
  function getWeatherSkyColor(baseSkyColor) {
    // 天气对日夜颜色的影响：只在白天/傍晚时明显，夜间天气效果减弱
    var weatherMod = weatherConfigs[currentWeather];
    var baseColor = new THREE.Color(baseSkyColor);
    
    // 计算夜间强度
    var cycleMs = 10 * 60 * 1000;
    var virtualHour = ((Date.now() % cycleMs) / cycleMs) * 24;
    var nightFactor = 0;
    if (virtualHour >= 21 || virtualHour < 5) {
      nightFactor = 1.0;
    } else if (virtualHour >= 19 && virtualHour < 21) {
      nightFactor = (virtualHour - 19) / 2 * 0.8;
    } else if (virtualHour >= 5 && virtualHour < 6) {
      nightFactor = 1.0 - (virtualHour - 5) * 0.9;
    }
    
    // 夜间时天气影响减弱（夜晚总是暗的）
    var weatherInfluence = 1 - nightFactor * 0.7;
    
    if (weatherTransitioning) {
      weatherAlpha = Math.min(1, weatherAlpha + 0.01);
      weatherMod = weatherConfigs[targetWeather];
    }
    
    var weatherColor = new THREE.Color(weatherMod.skyColor);
    var result = baseColor.clone();
    
    // 根据天气影响力混合
    result.lerp(weatherColor, weatherInfluence * 0.5);
    
    // 夜间整体变暗
    if (nightFactor > 0) {
      result.multiplyScalar(1 - nightFactor * 0.5);
    }
    
    return result.getHex();
  }
  
  function getWeatherFogColor(baseFogColor) {
    return getWeatherSkyColor(baseFogColor);
  }
  
  function getWeatherSunIntensity(baseIntensity) {
    // 天气影响光照强度
    var weatherMod = weatherConfigs[currentWeather];
    var mod = weatherMod.sunIntensity;
    
    if (weatherTransitioning) {
      weatherAlpha = Math.min(1, weatherAlpha + 0.01);
      mod = weatherConfigs[targetWeather].sunIntensity;
    }
    
    return baseIntensity * mod;
  }
  
  function createStars(scene) {
    var starCount = 800;
    var positions = new Float32Array(starCount * 3);
    var sizes = new Float32Array(starCount);
    starBaseSizes = new Float32Array(starCount);
    
    for (var i = 0; i < starCount; i++) {
      // 分布在天空穹顶
      var theta = Math.random() * Math.PI * 2;
      var phi = Math.acos(Math.random() * 0.8 + 0.2); // 主要在上半球
      var radius = 200 + Math.random() * 100;
      
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.cos(phi) + 50; // 抬高避免被地面遮挡
      positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
      
      sizes[i] = Math.random() * 3 + 1;
      starBaseSizes[i] = sizes[i];
    }
    
    starPositions = positions;
    
    var geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    
    var material = new THREE.ShaderMaterial({
      uniforms: {
        color: { value: new THREE.Color(0xffffff) },
        opacity: { value: 0.0 }
      },
      vertexShader: [
        'attribute float size;',
        'varying float vSize;',
        'void main() {',
        '  vSize = size;',
        '  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);',
        '  gl_PointSize = size * (300.0 / -mvPosition.z);',
        '  gl_Position = projectionMatrix * mvPosition;',
        '}'
      ].join('\n'),
      fragmentShader: [
        'uniform vec3 color;',
        'uniform float opacity;',
        'varying float vSize;',
        'void main() {',
        '  float dist = length(gl_PointCoord - vec2(0.5));',
        '  if (dist > 0.5) discard;',
        '  float alpha = 1.0 - smoothstep(0.0, 0.5, dist);',
        '  gl_FragColor = vec4(color, alpha * opacity);',
        '}'
      ].join('\n'),
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    
    stars = new THREE.Points(geometry, material);
    scene.add(stars);
    console.log('[Enhanced v8] Stars created: ' + starCount);
  }
  
  function updateStars(nightIntensity) {
    if (!stars || !stars.material) return;
    
    // nightIntensity: 0 = 白天, 1 = 深夜
    var opacity = nightIntensity * 0.9;
    stars.material.uniforms.opacity.value = opacity;
    
    // 闪烁效果
    if (nightIntensity > 0.3 && starPositions) {
      var positions = stars.geometry.attributes.position.array;
      var sizes = stars.geometry.attributes.size.array;
      var time = Date.now() * 0.001;
      
      for (var i = 0; i < sizes.length; i++) {
        // 不同的闪烁频率
        var twinkle = Math.sin(time * (0.5 + (i % 10) * 0.2) + i) * 0.5 + 0.5;
        sizes[i] = starBaseSizes[i] * (0.7 + twinkle * 0.6);
      }
      stars.geometry.attributes.size.needsUpdate = true;
    }
  }
  
  // 创建太阳和月亮
  function createSunAndMoon(scene) {
    // 太阳 - 使用 MeshBasicMaterial 不需要 emissive
    var sunGeometry = new THREE.SphereGeometry(5, 32, 32);
    var sunMaterial = new THREE.MeshBasicMaterial({
      color: 0xffdd00
    });
    sunMesh = new THREE.Mesh(sunGeometry, sunMaterial);
    sunMesh.position.set(80, 60, 0);
    scene.add(sunMesh);
    
    // 月亮
    var moonGeometry = new THREE.SphereGeometry(3, 32, 32);
    var moonMaterial = new THREE.MeshBasicMaterial({
      color: 0xeeeeee
    });
    moonMesh = new THREE.Mesh(moonGeometry, moonMaterial);
    moonMesh.position.set(-80, 60, 0);
    scene.add(moonMesh);
    
    console.log('[Enhanced v8] Sun and moon created');
  }
  
  // 更新太阳和月亮位置
  function updateSunAndMoon() {
    if (!sunMesh || !moonMesh) return;
    
    // 虚拟时间：每10分钟 = 24虚拟小时
    var cycleMs = 10 * 60 * 1000;
    var now = Date.now();
    var virtualHour = ((now % cycleMs) / cycleMs) * 24;
    
    // 太阳角度：6点在地平线，12点在天顶，18点在地平线
    var sunAngle = ((virtualHour - 6) / 12) * Math.PI; // 6:00 = 0, 12:00 = PI/2, 18:00 = PI
    var sunRadius = 100;
    var sunX = Math.cos(sunAngle) * sunRadius;
    var sunY = Math.sin(sunAngle) * sunRadius;
    
    // 月亮角度：与太阳相差 12 小时
    var moonAngle = sunAngle + Math.PI; // 正好与太阳相对
    var moonX = Math.cos(moonAngle) * sunRadius;
    var moonY = Math.sin(moonAngle) * sunRadius;
    
    // 只显示在地平线以上的
    if (sunY > 0) {
      sunMesh.position.set(sunX, sunY, 0);
      sunMesh.visible = true;
    } else {
      sunMesh.visible = false;
    }
    
    if (moonY > 0) {
      moonMesh.position.set(moonX, moonY, 0);
      moonMesh.visible = true;
    } else {
      moonMesh.visible = false;
    }
  }
  
  function updateLighting() {
    if (!sunLight || !ambientLight) return;
    
    // 更新太阳和月亮位置
    updateSunAndMoon();
    
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
    
    // 应用天气效果到颜色
    var weatherSkyColor = getWeatherSkyColor(skyColor);
    var weatherFogColor = getWeatherFogColor(skyColor);
    var weatherSunIntensity = getWeatherSunIntensity(sunIntensity);
    
    // 应用颜色
    if (scene.background) {
      scene.background.setHex(weatherSkyColor);
    }
    
    sunLight.intensity = weatherSunIntensity;
    ambientLight.intensity = ambientIntensity;
    ambientLight.color.setHex(ambientColor);
    
    // 太阳位置根据虚拟时间变化
    var sunAngle = ((hour - 6) / 24) * Math.PI * 2;
    sunLight.position.x = Math.cos(sunAngle) * 50;
    sunLight.position.y = Math.max(5, Math.sin(sunAngle) * 80);
    
    // 更新雾的颜色（应用天气效果）
    if (scene.fog) {
      scene.fog.color.setHex(weatherFogColor);
    }
    
    // 计算夜间强度并更新星星
    var nightIntensity = 0;
    if (hour >= 21 || hour < 5) {
      nightIntensity = 1.0;
    } else if (hour >= 19 && hour < 21) {
      nightIntensity = (hour - 19) / 2 * 0.8;
    } else if (hour >= 5 && hour < 6) {
      nightIntensity = 1.0 - (hour - 5) * 0.9;
    } else if (hour >= 6 && hour < 7) {
      nightIntensity = 0.1 * (1 - (hour - 6));
    }
    updateStars(nightIntensity);
    
    // 根据时间段更新环境音效
    var period = 'day';
    if (hour >= 21 || hour < 5) {
      period = 'night';
    } else if (hour >= 17 && hour < 21) {
      period = 'evening';
    }
    // 旧的 ambient 音效已禁用，使用天气音效系统
    // updateAmbientForPeriod(period);
  }
  
  // ============ 环境音效系统 ============
  var audioContext = null;
  var ambientGainNode = null;
  var ambientOscillator = null;
  var ambientFilter = null;
  var soundEnabled = true;
  
  // 初始化音频上下文
  function initAudioContext() {
    try {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      ambientGainNode = audioContext.createGain();
      ambientGainNode.connect(audioContext.destination);
      ambientGainNode.gain.value = 0.03; // 默认音量较小
      
      ambientFilter = audioContext.createBiquadFilter();
      ambientFilter.type = 'lowpass';
      ambientFilter.frequency.value = 400;
      ambientFilter.connect(ambientGainNode);
      
      // 创建环境音（使用噪音）
      var bufferSize = 2 * audioContext.sampleRate;
      var noiseBuffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
      var output = noiseBuffer.getChannelData(0);
      for (var i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      
      var whiteNoise = audioContext.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;
      whiteNoise.connect(ambientFilter);
      whiteNoise.start();
      
      ambientOscillator = whiteNoise;
      console.log('[Audio] 环境音效初始化成功');
    } catch (e) {
      console.log('[Audio] 浏览器不支持 Web Audio API');
    }
  }
  
  // 根据时段更新环境音效
  function updateAmbientSound(period) {
    if (!audioContext || !soundEnabled) return;
    
    // 确保音频上下文在运行
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }
    
    switch (period) {
      case 'night':
        // 深夜：低沉、安静
        ambientGainNode.gain.setTargetAtTime(0.015, audioContext.currentTime, 2);
        ambientFilter.frequency.setTargetAtTime(200, audioContext.currentTime, 2);
        break;
      case 'evening':
        // 傍晚：温暖、柔和
        ambientGainNode.gain.setTargetAtTime(0.025, audioContext.currentTime, 2);
        ambientFilter.frequency.setTargetAtTime(350, audioContext.currentTime, 2);
        break;
      case 'day':
      default:
        // 白天：正常环境音
        ambientGainNode.gain.setTargetAtTime(0.03, audioContext.currentTime, 2);
        ambientFilter.frequency.setTargetAtTime(400, audioContext.currentTime, 2);
        break;
    }
    console.log('[Audio] 环境音效切换为:', period);
  }
  
  // 切换音效开关
  function toggleSound() {
    soundEnabled = !soundEnabled;
    if (audioContext) {
      if (soundEnabled) {
        ambientGainNode.gain.setTargetAtTime(0.03, audioContext.currentTime, 0.5);
      } else {
        ambientGainNode.gain.setTargetAtTime(0, audioContext.currentTime, 0.5);
      }
    }
    console.log('[Audio] 音效:', soundEnabled ? '开启' : '关闭');
    return soundEnabled;
  }
  
  // 页面加载时初始化音频（需要用户交互后才能播放）
  document.addEventListener('click', function initAudioOnClick() {
    if (!audioContext) {
      initAudioContext();
    }
    document.removeEventListener('click', initAudioOnClick);
  }, { once: true });
  
  // 暴露给全局
  window.toggleSound = toggleSound;
  window.initAudioContext = initAudioContext;
  
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
  // 存储消息精灵和动画数据
  window.messageSpriteData = window.messageSpriteData || {};
  
  window.showAgentMessage = function(agentId, message) {
    if (!scene || !message) return;
    
    // 去重：如果这条消息刚刚显示过，就不再显示
    var msgKey = agentId + '::' + message;
    var now = Date.now();
    if (window._msgShowHistory === undefined) window._msgShowHistory = {};
    if (window._msgShowHistory[msgKey] && (now - window._msgShowHistory[msgKey]) < 3000) {
      console.log('[Enhanced] Message deduplicated:', msgKey.substring(0, 50));
      return; // 3秒内的重复消息忽略
    }
    window._msgShowHistory[msgKey] = now;
    console.log('[Voice] Speaking:', message.substring(0, 30));
    
    // 播放语音（如果启用）
    if (typeof window.speakText === 'function') {
      window.speakText(message, agentId);
    }
    
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
    
    // 清除旧的消息精灵和动画
    if (window.messageSpriteData[agentId]) {
      var oldData = window.messageSpriteData[agentId];
      if (oldData.sprite && oldData.sprite.parent) {
        scene.remove(oldData.sprite);
      }
      if (oldData.texture) oldData.texture.dispose();
      if (oldData.material) oldData.material.dispose();
      if (oldData.canvas) oldData.canvas = null;
      if (oldData.animationTimer) clearInterval(oldData.animationTimer);
    }
    
    var canvas = document.createElement('canvas');
    var context = canvas.getContext('2d');
    
    var displayText = message;
    var textLength = displayText.length * 18; // 估算文字宽度
    var canvasWidth = Math.max(512, textLength + 100);
    canvas.width = canvasWidth;
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
    texture.minFilter = THREE.LinearFilter;
    
    var material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
    var sprite = new THREE.Sprite(material);
    sprite.scale.set(6, 1.2, 1);
    
    var pos = new THREE.Vector3();
    agentMesh.getWorldPosition(pos);
    sprite.position.set(pos.x, pos.y + 3.5, pos.z);
    
    scene.add(sprite);
    
    var scrollData = {
      sprite: sprite,
      texture: texture,
      material: material,
      canvas: canvas,
      context: context,
      text: displayText,
      canvasWidth: canvasWidth,
      offset: 0,
      animationTimer: null
    };
    window.messageSpriteData[agentId] = scrollData;
    
    // 如果文字过长，启动滚动动画
    if (textLength > 400) {
      var scrollSpeed = 1.5; // 滚动速度
      scrollData.animationTimer = setInterval(function() {
        if (!window.messageSpriteData[agentId] || window.messageSpriteData[agentId].sprite !== sprite) {
          clearInterval(scrollData.animationTimer);
          return;
        }
        
        scrollData.offset += scrollSpeed;
        var maxOffset = scrollData.canvasWidth - 300;
        if (scrollData.offset > maxOffset) {
          scrollData.offset = 0; // 重置
        }
        
        // 重绘
        var ctx = scrollData.context;
        ctx.clearRect(0, 0, scrollData.canvasWidth, 96);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.beginPath();
        ctx.roundRect(0, 0, scrollData.canvasWidth, 96, 16);
        ctx.fill();
        
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 28px Arial, sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        
        // 显示区域裁剪
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(10, 10, 492, 76, 10);
        ctx.clip();
        ctx.fillText(scrollData.text, 20 - scrollData.offset, 48);
        ctx.restore();
        
        scrollData.texture.needsUpdate = true;
      }, 50);
    } else {
      // 短文字直接显示，不滚动，居中显示
      context.textAlign = 'center';
      context.fillText(displayText, canvasWidth / 2, 48);
      scrollData.texture.needsUpdate = true;
    }
    
    setTimeout(function() {
      if (window.messageSpriteData[agentId] && window.messageSpriteData[agentId].sprite === sprite) {
        scene.remove(sprite);
        if (scrollData.animationTimer) clearInterval(scrollData.animationTimer);
        delete window.messageSpriteData[agentId];
        material.dispose();
        texture.dispose();
      }
    }, 6000);
    
    console.log('[Enhanced v8] Message displayed above agent:', agentId);
  };
  
  setTimeout(checkAndAdd, 2000);
})();
