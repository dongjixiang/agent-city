/**
 * 智体城 3D 世界 - 独立服务器
 * 
 * 用于开发测试 3D 可视化页面
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 9999;

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml'
};

const server = http.createServer((req, res) => {
    let filePath = req.url === '/' ? '/index.html' : req.url;
    
    // 安全检查
    filePath = filePath.split('?')[0]; // 移除查询参数
    filePath = filePath.replace(/\.\./g, ''); // 防止路径遍历
    
    const fullPath = path.join(__dirname, filePath);
    const ext = path.extname(fullPath);
    
    console.log(`${new Date().toISOString()} ${req.url} -> ${filePath}`);
    
    fs.readFile(fullPath, (err, data) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('404 Not Found');
            return;
        }
        
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';
        res.writeHead(200, {
            'Content-Type': contentType,
            'Access-Control-Allow-Origin': '*'
        });
        res.end(data);
    });
});

server.listen(PORT, () => {
    console.log('');
    console.log('🏙️  智体城 3D 世界已启动！');
    console.log('');
    console.log(`   🌐 访问: http://localhost:${PORT}`);
    console.log('');
    console.log('   提示: 确保智体城主服务也在运行:');
    console.log('   - WebSocket: ws://localhost:9876');
    console.log('   - HTTP API:  http://localhost:9877');
    console.log('');
});
