const fs = require('fs');
const path = 'C:/Users/swede/.openclaw/workspace-arch/agent-city/client/main.js';
let content = fs.readFileSync(path, 'utf8');

// 1. Add setupAudio method call after scene is created
const sceneCreatedMarker = "console.log('[App] Scene initialized');";
if (content.includes(sceneCreatedMarker)) {
    // Check if we already added the call
    if (!content.includes('setupAudio();')) {
        const newLine = `console.log('[App] Scene initialized');
        
        // 设置音频系统（在用户交互后启动）
        this.setupAudio();`;
        content = content.replace(sceneCreatedMarker, newLine);
        console.log('✓ setupAudio call added');
    } else {
        console.log('✓ setupAudio call already exists');
    }
} else {
    console.log('⚠ sceneCreatedMarker not found, searching...');
    const idx = content.indexOf('Scene initialized');
    console.log('  Found "Scene initialized" at:', idx);
}

// 2. Add setupAudio method to the App class (before animate method)
const animateMarker = '    animate() {';
if (content.includes(animateMarker)) {
    if (!content.includes('setupAudio() {')) {
        const setupAudioMethod = `
    /**
     * 设置音频系统（需要在用户交互后调用）
     */
    setupAudio() {
        // 创建音频启动按钮（点击页面任意位置启动音频）
        const startAudioHandler = () => {
            this.voiceSystem = getVoiceSystem();
            this.ambientSound = getAmbientSoundSystem();
            
            // 启动环境音
            this.ambientSound.start();
            
            console.log('[App] Audio systems started');
            
            // 移除一次性监听器
            document.removeEventListener('click', startAudioHandler);
            document.removeEventListener('keydown', startAudioHandler);
        };
        
        // 用户首次交互后启动音频（浏览器策略要求）
        document.addEventListener('click', startAudioHandler, { once: true });
        document.addEventListener('keydown', startAudioHandler, { once: true });
        
        console.log('[App] Audio system waiting for user interaction...');
    }

`;
        content = content.replace(animateMarker, setupAudioMethod + animateMarker);
        console.log('✓ setupAudio method added');
    }
} else {
    console.log('⚠ animateMarker not found');
}

fs.writeFileSync(path, content, 'utf8');
console.log('Done!');