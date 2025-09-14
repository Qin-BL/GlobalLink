import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { encryptPassword, isEncryptionSupported, validatePasswordStrength } from '../../utils/passwordEncrypt';
import './AdminLogin.css';

const AdminLogin = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [passwordStrength, setPasswordStrength] = useState(null);
  const [showPasswordRules, setShowPasswordRules] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // 如果是密码字段，验证密码强度
    if (name === 'password') {
      if (value) {
        const strength = validatePasswordStrength(value);
        setPasswordStrength(strength);
        setShowPasswordRules(true);
      } else {
        setPasswordStrength(null);
        setShowPasswordRules(false);
      }
    }
    
    // 清除错误信息
    if (error) {
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 验证密码强度
      const strength = validatePasswordStrength(formData.password);
      if (!strength.isValid || strength.score < 3) {
        setError('密码强度不足，请使用更复杂的密码');
        setLoading(false);
        return;
      }

      // 检查加密功能是否可用并加密密码
      const encryptionSupported = isEncryptionSupported();
      let encryptedPassword = formData.password;
      if (encryptionSupported) {
        encryptedPassword = await encryptPassword(formData.password);
      }

      // 创建包含加密密码的请求数据
      const requestData = {
        username: formData.username,
        password: encryptedPassword
      };

      const response = await fetch('/api/v1/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      const data = await response.json();

      if (response.ok) {
        // 保存管理员令牌
        localStorage.setItem('admin_token', data.access_token);
        localStorage.setItem('admin_refresh_token', data.refresh_token);
        localStorage.setItem('admin_user', JSON.stringify({ username: formData.username, role: 'admin' }));
        
        // 跳转到管理后台
        navigate('/admin/dashboard');
      } else {
        setError(data.detail || '登录失败');
      }
    } catch (err) {
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };
  
  // 获取密码强度等级的颜色和文本
  const getStrengthIndicator = () => {
    if (!passwordStrength) return { color: '', text: '' };
    
    const { score } = passwordStrength;
    if (score <= 1) return { color: '#c53030', text: '弱' };
    if (score <= 3) return { color: '#ed8936', text: '中' };
    return { color: '#38a169', text: '强' };

  return (
    <div className="admin-login-container">
      <div className="admin-login-card">
        <div className="admin-login-header">
          <h1>管理后台</h1>
          <p>GlobalLink 管理系统</p>
        </div>
        
        <form onSubmit={handleSubmit} className="admin-login-form">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
          
          <div className="form-group">
            <label htmlFor="username">管理员用户名</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              placeholder="请输入管理员用户名"
              disabled={loading}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">密码</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="请输入密码"
              disabled={loading}
            />
            
            {/* 密码强度指示器 */}
            {passwordStrength && (
              <div className="password-strength">
                <div className="strength-indicator">
                  <div 
                    className="strength-bar"
                    style={{
                      backgroundColor: getStrengthIndicator().color,
                      width: `${(passwordStrength.score / 5) * 100}%`
                    }}
                  />
                </div>
                <span 
                  className="strength-text"
                  style={{ color: getStrengthIndicator().color }}
                >
                  密码强度: {getStrengthIndicator().text}
                </span>
              </div>
            )}
            
            {/* 密码规则提示 */}
            {showPasswordRules && (
              <div className="password-rules">
                <p className="rule-title">密码要求：</p>
                <ul className="rule-list">
                  <li className={passwordStrength?.meetsMinLength ? 'rule-met' : 'rule-not-met'}>
                    至少8个字符
                  </li>
                  <li className={passwordStrength?.hasUpperCase ? 'rule-met' : 'rule-not-met'}>
                    包含大写字母
                  </li>
                  <li className={passwordStrength?.hasLowerCase ? 'rule-met' : 'rule-not-met'}>
                    包含小写字母
                  </li>
                  <li className={passwordStrength?.hasNumbers ? 'rule-met' : 'rule-not-met'}>
                    包含数字
                  </li>
                  <li className={passwordStrength?.hasSpecialChar ? 'rule-met' : 'rule-not-met'}>
                    包含特殊字符
                  </li>
                </ul>
              </div>
            )}
          </div>
          
          <button 
            type="submit" 
            className="admin-login-button"
            disabled={loading}
          >
            {loading ? '登录中...' : '登录'}
          </button>
        </form>
        
        <div className="admin-login-footer">
          <p>请使用管理员账号登录</p>
          <a href="/" className="back-to-home">返回首页</a>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;