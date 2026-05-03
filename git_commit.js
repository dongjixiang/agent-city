const { execSync } = require('child_process');
const path = 'C:/Users/swede/.openclaw/workspace-arch/agent-city';

try {
    // Stage only the specific files we modified for transformer
    console.log('Staging transformer-related files...');
    const files = [
        'client/systems/camera-system.js',
        'client/systems/interaction/transformer-behaviors.js',
        'client/systems/interaction/transformer-controller.js',
        'client/main.js',
        'server/event-dispatcher.js',
    ];
    
    for (const file of files) {
        try {
            execSync(`git add "${file}"`, { cwd: path, stdio: 'inherit' });
        } catch (e) {}
    }
    
    // Commit with message
    console.log('\nCommitting transformer feature...');
    execSync('git commit -m "feat: 变形金刚 NPC - 机器人/汽车形态切换及控制模式"', { cwd: path, stdio: 'inherit' });
    
    // Push to remote
    console.log('\nPushing to remote...');
    execSync('git push', { cwd: path, stdio: 'inherit' });
    
    console.log('\n✅ Done!');
    
} catch (e) {
    console.error('Error:', e.message);
}