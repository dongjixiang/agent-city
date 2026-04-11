/**
 * Validation - 验证工具
 */

/**
 * 验证结果
 */
class ValidationResult {
    constructor(valid = true, errors = []) {
        this.valid = valid;
        this.errors = errors;
    }
    
    addError(field, message) {
        this.valid = false;
        this.errors.push({ field, message });
    }
    
    static success() {
        return new ValidationResult(true, []);
    }
    
    static failure(errors) {
        return new ValidationResult(false, errors);
    }
}

/**
 * 验证规则
 */
const Rules = {
    // 必填
    required(value) {
        if (value === undefined || value === null || value === '') {
            return '此字段为必填项';
        }
        return null;
    },
    
    // 最小长度
    minLength(min) {
        return (value) => {
            if (!value) return null;
            if (typeof value === 'string' && value.length < min) {
                return `长度不能少于 ${min} 个字符`;
            }
            if (Array.isArray(value) && value.length < min) {
                return `至少需要 ${min} 个元素`;
            }
            return null;
        };
    },
    
    // 最大长度
    maxLength(max) {
        return (value) => {
            if (!value) return null;
            if (typeof value === 'string' && value.length > max) {
                return `长度不能超过 ${max} 个字符`;
            }
            if (Array.isArray(value) && value.length > max) {
                return `最多 ${max} 个元素`;
            }
            return null;
        };
    },
    
    // 字符串长度范围
    lengthBetween(min, max) {
        return (value) => {
            if (!value) return null;
            if (typeof value === 'string') {
                if (value.length < min) return `长度不能少于 ${min} 个字符`;
                if (value.length > max) return `长度不能超过 ${max} 个字符`;
            }
            return null;
        };
    },
    
    // 最小值
    min(min) {
        return (value) => {
            if (value === undefined || value === null) return null;
            if (typeof value === 'number' && value < min) {
                return `值不能小于 ${min}`;
            }
            return null;
        };
    },
    
    // 最大值
    max(max) {
        return (value) => {
            if (value === undefined || value === null) return null;
            if (typeof value === 'number' && value > max) {
                return `值不能大于 ${max}`;
            }
            return null;
        };
    },
    
    // 范围
    between(min, max) {
        return (value) => {
            if (value === undefined || value === null) return null;
            if (typeof value === 'number') {
                if (value < min) return `值不能小于 ${min}`;
                if (value > max) return `值不能大于 ${max}`;
            }
            return null;
        };
    },
    
    // 邮箱
    email(value) {
        if (!value) return null;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
            return '请输入有效的邮箱地址';
        }
        return null;
    },
    
    // URL
    url(value) {
        if (!value) return null;
        try {
            new URL(value);
            return null;
        } catch {
            return '请输入有效的 URL';
        }
    },
    
    // 枚举
    enum(enumValues) {
        return (value) => {
            if (!value) return null;
            if (!enumValues.includes(value)) {
                return `必须是以下值之一: ${enumValues.join(', ')}`;
            }
            return null;
        };
    },
    
    // 正则
    pattern(regex, message = '格式不正确') {
        return (value) => {
            if (!value) return null;
            if (!regex.test(value)) {
                return message;
            }
            return null;
        };
    },
    
    // 自定义函数
    custom(fn) {
        return (value) => {
            try {
                return fn(value);
            } catch (e) {
                return e.message || '验证失败';
            }
        };
    }
};

// 预定义验证器
const Validators = {
    // 用户名
    username: [
        Rules.required,
        Rules.minLength(2),
        Rules.maxLength(20),
        Rules.pattern(/^[a-zA-Z0-9_\u4e00-\u9fa5]+$/, '只能包含字母、数字、下划线和中文')
    ],
    
    // 邮箱
    email: [
        Rules.required,
        Rules.email
    ],
    
    // 密码
    password: [
        Rules.required,
        Rules.minLength(6),
        Rules.maxLength(32)
    ],
    
    // Agent ID
    agentId: [
        Rules.required,
        Rules.pattern(/^[a-zA-Z0-9_-]+$/, 'ID 格式不正确')
    ],
    
    // 坐标
    position: [
        Rules.required,
        (value) => {
            if (typeof value !== 'object') return '坐标必须是对象';
            if (typeof value.x !== 'number' || typeof value.z !== 'number') {
                return '坐标格式不正确';
            }
            if (Math.abs(value.x) > 100 || Math.abs(value.z) > 100) {
                return '坐标超出范围';
            }
            return null;
        }
    ],
    
    // 消息内容
    message: [
        Rules.required,
        Rules.maxLength(1000)
    ],
    
    // 颜色
    color: [
        Rules.pattern(/^#[0-9a-fA-F]{6}$/, '颜色格式不正确')
    ]
};

/**
 * 验证对象
 */
function validate(data, rules) {
    const result = new ValidationResult();
    
    for (const [field, fieldRules] of Object.entries(rules)) {
        const value = data[field];
        
        for (const rule of fieldRules) {
            const error = typeof rule === 'function' ? rule(value) : rule;
            if (error) {
                result.addError(field, error);
                break;
            }
        }
    }
    
    return result;
}

/**
 * 验证单个值
 */
function validateValue(value, rules) {
    for (const rule of rules) {
        const error = typeof rule === 'function' ? rule(value) : rule;
        if (error) {
            return { valid: false, error };
        }
    }
    return { valid: true };
}

/**
 * 清理字符串
 */
function sanitizeString(str) {
    if (typeof str !== 'string') return '';
    return str.trim().replace(/[<>]/g, '');
}

/**
 * 清理对象
 */
function sanitizeObject(obj) {
    if (typeof obj === 'string') return sanitizeString(obj);
    if (Array.isArray(obj)) return obj.map(sanitizeObject);
    if (typeof obj === 'object' && obj !== null) {
        const result = {};
        for (const [key, value] of Object.entries(obj)) {
            result[sanitizeString(key)] = sanitizeObject(value);
        }
        return result;
    }
    return obj;
}

module.exports = {
    ValidationResult,
    Rules,
    Validators,
    validate,
    validateValue,
    sanitizeString,
    sanitizeObject
};
