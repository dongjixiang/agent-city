/**
 * Logger - 日志工具
 * 
 * 支持：
 * - 多级别 (debug, info, warn, error)
 * - 文件输出
 * - 控制台输出
 * - 按日期/大小轮转
 */

const fs = require('fs');
const path = require('path');

class Logger {
    constructor(options = {}) {
        this.level = options.level || 'info';
        this.levels = {
            debug: 0,
            info: 1,
            warn: 2,
            error: 3
        };
        
        this.console = options.console !== false;
        this.file = options.file;
        this.maxSize = options.maxSize || 10 * 1024 * 1024; // 10MB
        this.maxFiles = options.maxFiles || 5;
        
        if (this.file) {
            this._ensureDir();
        }
    }

    _ensureDir() {
        const dir = path.dirname(this.file);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    }

    _shouldLog(level) {
        return this.levels[level] >= this.levels[this.level];
    }

    _formatMessage(level, message, meta = {}) {
        const timestamp = new Date().toISOString();
        const metaStr = Object.keys(meta).length > 0 
            ? ' ' + JSON.stringify(meta) 
            : '';
        return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}\n`;
    }

    _write(msg) {
        if (this.console) {
            console.log(msg.trim());
        }
        
        if (this.file) {
            try {
                // 检查文件大小
                if (fs.existsSync(this.file)) {
                    const stats = fs.statSync(this.file);
                    if (stats.size >= this.maxSize) {
                        this._rotate();
                    }
                }
                fs.appendFileSync(this.file, msg);
            } catch (err) {
                console.error('Logger write error:', err);
            }
        }
    }

    _rotate() {
        try {
            // 删除最老的文件
            const oldest = `${this.file}.${this.maxFiles}`;
            if (fs.existsSync(oldest)) {
                fs.unlinkSync(oldest);
            }
            
            // 轮转现有文件
            for (let i = this.maxFiles - 1; i >= 1; i--) {
                const src = i === 1 ? this.file : `${this.file}.${i}`;
                const dst = `${this.file}.${i + 1}`;
                if (fs.existsSync(src)) {
                    fs.renameSync(src, dst);
                }
            }
        } catch (err) {
            console.error('Logger rotate error:', err);
        }
    }

    debug(message, meta) {
        if (this._shouldLog('debug')) {
            this._write(this._formatMessage('debug', message, meta));
        }
    }

    info(message, meta) {
        if (this._shouldLog('info')) {
            this._write(this._formatMessage('info', message, meta));
        }
    }

    warn(message, meta) {
        if (this._shouldLog('warn')) {
            this._write(this._formatMessage('warn', message, meta));
        }
    }

    error(message, meta) {
        if (this._shouldLog('error')) {
            this._write(this._formatMessage('error', message, meta));
        }
    }

    // 便捷方法
    log(message, meta) {
        this.info(message, meta);
    }
}

// 创建全局 logger 实例
const logger = new Logger({
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE,
    console: true
});

module.exports = logger;
module.exports.Logger = Logger;
