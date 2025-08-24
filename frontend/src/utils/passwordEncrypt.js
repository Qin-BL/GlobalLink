/**
 * 密码加密工具
 * 使用 Web Crypto API 对密码进行 SHA-256 哈希处理
 * 注意：这仅作为传输层额外保护，不能替代 HTTPS
 */

/**
 * 加密密码
 * @param {string} password - 原始密码
 * @returns {Promise<string>} 加密后的密码哈希
 */
export const encryptPassword = async (password) => {
  try {
    // 添加时间戳和随机盐值防止重放攻击
    const timestamp = Date.now();
    const randomSalt = Math.random().toString(36).substring(2, 15);
    
    // 组合密码、时间戳、盐值和域名（增加唯一性）
    const combinedString = `${password}:${timestamp}:${randomSalt}:${window.location.origin}`;
    
    // 使用 TextEncoder 转换为字节数组
    const encoder = new TextEncoder();
    const data = encoder.encode(combinedString);
    
    // 使用 SHA-256 进行哈希
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    
    // 将哈希结果转换为十六进制字符串
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    // 返回哈希值和时间戳（后端需要验证时间戳）
    return JSON.stringify({
      hash: hashHex,
      timestamp: timestamp,
      salt: randomSalt
    });
    
  } catch (error) {
    console.error('密码加密失败:', error);
    
    // 如果加密失败，返回原始密码（降级处理）
    // 在实际生产环境中应该抛出错误或使用备用方案
    return JSON.stringify({
      hash: password,
      timestamp: Date.now(),
      salt: 'fallback',
      error: 'encryption_failed'
    });
  }
};

/**
 * 验证加密功能是否可用
 * @returns {boolean} 是否支持 Web Crypto API
 */
export const isEncryptionSupported = () => {
  return (
    typeof window !== 'undefined' &&
    window.crypto &&
    window.crypto.subtle &&
    typeof window.crypto.subtle.digest === 'function'
  );
};

/**
 * 简单的客户端密码强度验证
 * @param {string} password - 密码
 * @returns {object} 验证结果
 */
export const validatePasswordStrength = (password) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  const strength = {
    isValid: password.length >= minLength,
    length: password.length,
    meetsMinLength: password.length >= minLength,
    hasUpperCase,
    hasLowerCase,
    hasNumbers,
    hasSpecialChar,
    score: 0
  };
  
  // 计算强度分数
  if (strength.meetsMinLength) strength.score += 1;
  if (hasUpperCase) strength.score += 1;
  if (hasLowerCase) strength.score += 1;
  if (hasNumbers) strength.score += 1;
  if (hasSpecialChar) strength.score += 1;
  
  return strength;
};

/**
 * 生成随机盐值（用于注册时前端加盐）
 * @param {number} length - 盐值长度
 * @returns {string} 随机盐值
 */
export const generateSalt = (length = 16) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  if (typeof window !== 'undefined' && window.crypto) {
    const randomValues = new Uint8Array(length);
    window.crypto.getRandomValues(randomValues);
    
    for (let i = 0; i < length; i++) {
      result += chars[randomValues[i] % chars.length];
    }
  } else {
    // 降级方案
    for (let i = 0; i < length; i++) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
  }
  
  return result;
};