/**
 * WorldState 测试脚本
 */

const { WorldState } = require('./index');

// 创建世界状态
const world = new WorldState();

console.log('\n========== 世界状态测试 ==========\n');

// 1. 测试获取世界状态
console.log('1. 获取世界状态:');
const state = world.getState();
console.log(`   - 世界名称: ${state.meta.name}`);
console.log(`   - 世界大小: ${state.meta.width}x${state.meta.height}`);
console.log(`   - 建筑数量: ${state.buildings.length}`);
console.log(`   - 时间: ${state.time.formattedTime} (${state.time.description})`);
console.log(`   - 天气: ${state.weather.name}`);

// 2. 测试智能体注册
console.log('\n2. 测试智能体注册:');
const regResult = world.agents.registerAgent('test_agent', { x: 100, z: 100 });
console.log(`   - 注册结果: ${regResult.success ? '成功' : '失败'}`);

// 3. 测试移动验证
console.log('\n3. 测试移动验证:');
const validMove = world.validateAgentMove('test_agent', { x: 110, z: 110 });
console.log(`   - 有效移动 (100,100 -> 110,110): ${validMove.valid ? '允许' : '拒绝'}`);

// 4. 测试建筑碰撞
console.log('\n4. 测试建筑碰撞:');
const collideMove = world.validateAgentMove('test_agent', { x: 100, z: 100 }); // 可能在建筑内部
console.log(`   - 移动到 (100, 100): ${collideMove.valid ? '允许' : '拒绝'} - ${collideMove.reason || ''}`);

// 5. 测试边界外移动
console.log('\n5. 测试边界外移动:');
const outOfBounds = world.validateAgentMove('test_agent', { x: -10, z: -10 });
console.log(`   - 移动到 (-10, -10): ${outOfBounds.valid ? '允许' : '拒绝'} - ${outOfBounds.reason || ''}`);

// 6. 测试获取范围内建筑
console.log('\n6. 测试获取范围内的建筑:');
const nearbyBuildings = world.getBuildingsInArea(100, 100, 100);
console.log(`   - 中心点 (100,100) 半径100内的建筑:`);
nearbyBuildings.forEach(b => {
    console.log(`     - ${b.name} (${b.type}) - 距离: ${b.distance.toFixed(1)}`);
});

// 7. 测试时间系统
console.log('\n7. 测试时间系统:');
console.log(`   - 当前时间: ${world.timeSystem.getFormattedTime()}`);
console.log(`   - 光照等级: ${(world.timeSystem.getLightLevel() * 100).toFixed(0)}%`);
console.log(`   - 天空颜色: #${world.timeSystem.getSkyColor().toString(16)}`);

// 8. 测试天气系统
console.log('\n8. 测试天气系统:');
console.log(`   - 当前天气: ${world.weatherSystem.getName()}`);
const visualParams = world.weatherSystem.getVisualParams();
console.log(`   - 雾密度: ${visualParams.fog.density}`);
console.log(`   - 环境光: ${visualParams.ambient.intensity}`);

// 9. 测试世界状态序列化
console.log('\n9. 测试世界状态序列化:');
const fullState = world.getState();
console.log(`   - JSON 大小: ${JSON.stringify(fullState).length} 字符`);
console.log(`   - 版本: ${fullState.version}`);

console.log('\n========== 测试完成 ==========\n');
