// Quick test to check if server can start
try {
    console.log('Loading server...');
    const server = require('./server/index.js');
    console.log('Server module loaded successfully');
} catch (err) {
    console.error('Error loading server:', err.message);
    console.error(err.stack);
    process.exit(1);
}
