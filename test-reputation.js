/**
 * 测试声誉系统
 */

const ReputationStore = require('./reputation-store');

console.log('🧪 测试声誉系统\n');

// 1. 获取初始声誉
console.log('1️⃣ 获取初始声誉');
let rep = ReputationStore.getReputation('agent:test-001');
console.log(`   分数: ${rep.score}`);
console.log(`   等级: ${rep.level}`);
console.log('');

// 2. 完成任务
console.log('2️⃣ 完成任务（首次）');
let result = ReputationStore.recordTaskCompletion('agent:test-001', {
  earnings: 100,
  completionTime: 3600000, // 1小时
  deadline: Date.now() + 7200000, // 2小时后
  completedAt: Date.now()
});
console.log(`   分数变化: ${result.oldScore} → ${result.newScore} (${result.delta > 0 ? '+' : ''}${result.delta})`);
console.log(`   等级: ${result.level}`);
console.log('');

// 3. 连续完成任务
console.log('3️⃣ 连续完成任务（测试连续奖励）');
for (let i = 2; i <= 6; i++) {
  result = ReputationStore.recordTaskCompletion('agent:test-001', {
    earnings: 50
  });
  console.log(`   第${i}个任务: 分数 ${result.newScore}, 等级 ${result.level}`);
}
console.log('');

// 4. 查看声誉摘要
console.log('4️⃣ 声誉摘要');
const summary = ReputationStore.getReputationSummary('agent:test-001');
console.log(`   分数: ${summary.score}`);
console.log(`   等级: ${summary.levelIcon} ${summary.level}`);
console.log(`   进度: ${summary.progress}%`);
console.log(`   已完成任务: ${summary.stats.tasksCompleted}`);
console.log(`   连续任务: ${summary.stats.streak}`);
console.log(`   徽章: ${summary.badges.map(b => b.icon + b.name).join(', ') || '无'}`);
console.log('');

// 5. 添加评分
console.log('5️⃣ 添加评分');
for (let i = 1; i <= 5; i++) {
  ReputationStore.addRating('agent:test-001', `agent:rater-${i}`, `task-${i}`, 5, '非常棒！');
}
const ratingResult = ReputationStore.addRating('agent:test-001', 'agent:rater-6', 'task-6', 4, '不错');
console.log(`   平均评分: ${ratingResult.avgRating}`);
console.log(`   评分数量: ${ratingResult.ratingsCount}`);
console.log('');

// 6. 再次查看声誉（检查徽章）
console.log('6️⃣ 更新后的声誉');
const summary2 = ReputationStore.getReputationSummary('agent:test-001');
console.log(`   分数: ${summary2.score}`);
console.log(`   等级: ${summary2.levelIcon} ${summary2.level}`);
console.log(`   平均评分: ${summary2.stats.avgRating}`);
console.log(`   徽章: ${summary2.badges.map(b => b.icon + b.name).join(', ')}`);
console.log('');

// 7. 任务失败
console.log('7️⃣ 任务失败');
result = ReputationStore.recordTaskFailure('agent:test-001');
console.log(`   分数变化: ${result.delta}`);
console.log(`   新分数: ${result.newScore}`);
console.log('');

// 8. 排行榜
console.log('8️⃣ 排行榜');
// 创建几个测试智能体
ReputationStore.recordTaskCompletion('agent:test-002', { earnings: 200 });
ReputationStore.recordTaskCompletion('agent:test-002', { earnings: 200 });
ReputationStore.recordTaskCompletion('agent:test-003', { earnings: 300 });

const leaderboard = ReputationStore.getLeaderboard('score', 5);
leaderboard.forEach((entry, i) => {
  console.log(`   ${i + 1}. ${entry.levelIcon} ${entry.agentId.slice(0, 15)}... - 分数: ${entry.score}, 任务: ${entry.tasksCompleted}, 评分: ${entry.avgRating}`);
});
console.log('');

// 9. 最终状态
console.log('9️⃣ 最终状态');
const finalSummary = ReputationStore.getReputationSummary('agent:test-001');
console.log(JSON.stringify(finalSummary, null, 2));

console.log('\n✅ 声誉系统测试完成！');
