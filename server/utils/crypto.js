/**
 * Crypto - 加密工具
 */

const crypto = require('crypto');

/**
 * 生成随机 ID
 */
function generateId(prefix = '') {
    const timestamp = Date.now().toString(36);
    const random = crypto.randomBytes(4).toString('hex');
    return prefix ? `${prefix}_${timestamp}_${random}` : `${timestamp}_${random}`;
}

/**
 * 生成随机字符串
 */
function generateRandomString(length = 16) {
    return crypto.randomBytes(Math.ceil(length / 2))
        .toString('hex')
        .substring(0, length);
}

/**
 * 简单的哈希
 */
function hash(data, algorithm = 'sha256') {
    return crypto.createHash(algorithm)
        .update(data)
        .digest('hex');
}

/**
 * HMAC 签名
 */
function hmac(data, key, algorithm = 'sha256') {
    return crypto.createHmac(algorithm, key)
        .update(data)
        .digest('hex');
}

/**
 * AES 加密
 */
function encrypt(data, key, algorithm = 'aes-256-cbc') {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, Buffer.from(key, 'hex'), iv);
    
    let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return {
        iv: iv.toString('hex'),
        data: encrypted
    };
}

/**
 * AES 解密
 */
function decrypt(encryptedData, key, iv, algorithm = 'aes-256-cbc') {
    const decipher = crypto.createDecipheriv(
        algorithm,
        Buffer.from(key, 'hex'),
        Buffer.from(iv, 'hex')
    );
    
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return JSON.parse(decrypted);
}

/**
 * 生成 JWT (简化版)
 */
function createJWT(payload, secret, expiresIn = '1h') {
    const header = { alg: 'HS256', typ: 'JWT' };
    
    const now = Math.floor(Date.now() / 1000);
    const exp = now + parseExpiresIn(expiresIn);
    
    const data = {
        ...payload,
        iat: now,
        exp
    };
    
    const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
    const encodedData = Buffer.from(JSON.stringify(data)).toString('base64url');
    
    const signature = hmac(`${encodedHeader}.${encodedData}`, secret);
    
    return `${encodedHeader}.${encodedData}.${signature}`;
}

/**
 * 验证 JWT
 */
function verifyJWT(token, secret) {
    try {
        const [encodedHeader, encodedData, signature] = token.split('.');
        
        const expectedSig = hmac(`${encodedHeader}.${encodedData}`, secret);
        if (signature !== expectedSig) {
            return null;
        }
        
        const data = JSON.parse(Buffer.from(encodedData, 'base64url').toString('utf8'));
        
        if (data.exp && data.exp < Math.floor(Date.now() / 1000)) {
            return null; // 过期
        }
        
        return data;
    } catch {
        return null;
    }
}

/**
 * 解析过期时间
 */
function parseExpiresIn(expiresIn) {
    const units = {
        s: 1,
        m: 60,
        h: 3600,
        d: 86400
    };
    
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (match) {
        return parseInt(match[1]) * units[match[2]];
    }
    return 3600; // 默认 1 小时
}

/**
 * 生成盐
 */
function generateSalt(length = 16) {
    return crypto.randomBytes(length).toString('hex');
}

/**
 * 密码哈希 (使用 PBKDF2)
 */
async function hashPassword(password, salt) {
    return new Promise((resolve, reject) => {
        crypto.pbkdf2(password, salt, 100000, 64, 'sha512', (err, derivedKey) => {
            if (err) reject(err);
            else resolve(derivedKey.toString('hex'));
        });
    });
}

/**
 * 验证密码
 */
async function verifyPassword(password, hash, salt) {
    const newHash = await hashPassword(password, salt);
    return newHash === hash;
}

module.exports = {
    generateId,
    generateRandomString,
    hash,
    hmac,
    encrypt,
    decrypt,
    createJWT,
    verifyJWT,
    generateSalt,
    hashPassword,
    verifyPassword
};
