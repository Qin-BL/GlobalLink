import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddUser, setShowAddUser] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);
  const navigate = useNavigate();

  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    phone: '',
    password: '',
    role: 'user',
    is_active: true
  });

  useEffect(() => {
    checkAuth();
    fetchData();
  }, []);

  const checkAuth = () => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      navigate('/admin/login');
      return;
    }
  };

  const getAuthHeaders = () => {
    const token = localStorage.getItem('admin_token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // 获取用户列表
      const usersResponse = await fetch('/api/v1/admin/users', {
        headers: getAuthHeaders()
      });
      
      // 获取统计信息
      const statsResponse = await fetch('/api/v1/admin/users/stats', {
        headers: getAuthHeaders()
      });

      if (usersResponse.ok && statsResponse.ok) {
        const usersData = await usersResponse.json();
        const statsData = await statsResponse.json();
        
        setUsers(usersData);
        setStats(statsData);
      } else {
        if (usersResponse.status === 401 || statsResponse.status === 401) {
          localStorage.removeItem('admin_token');
          navigate('/admin/login');
          return;
        }
        setError('获取数据失败');
      }
    } catch (err) {
      setError('网络错误');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_refresh_token');
    localStorage.removeItem('admin_user');
    navigate('/admin/login');
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/v1/admin/users', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(newUser)
      });

      if (response.ok) {
        setShowAddUser(false);
        setNewUser({
          username: '',
          email: '',
          phone: '',
          password: '',
          role: 'user',
          is_active: true
        });
        fetchData(); // 刷新数据
      } else {
        const data = await response.json();
        setError(data.detail || '添加用户失败');
      }
    } catch (err) {
      setError('网络错误');
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      const response = await fetch(`/api/v1/admin/users/${userId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (response.ok) {
        setShowDeleteConfirm(false);
        setUserToDelete(null);
        fetchData(); // 刷新数据
      } else {
        const data = await response.json();
        setError(data.detail || '删除用户失败');
      }
    } catch (err) {
      setError('网络错误');
    }
  };

  const handleDeleteAllUsers = async () => {
    try {
      const response = await fetch('/api/v1/admin/users/all', {
        method: 'DELETE',
        headers: getAuthHeaders(),
        body: JSON.stringify({ confirm: true })
      });

      if (response.ok) {
        setShowDeleteAllConfirm(false);
        fetchData(); // 刷新数据
      } else {
        const data = await response.json();
        setError(data.detail || '删除所有用户失败');
      }
    } catch (err) {
      setError('网络错误');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '从未登录';
    return new Date(dateString).toLocaleString('zh-CN');
  };

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="loading">加载中...</div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <div className="admin-header-content">
          <h1>GlobalLink 管理后台</h1>
          <div className="admin-header-actions">
            <span className="admin-user">管理员</span>
            <button onClick={handleLogout} className="logout-btn">退出登录</button>
          </div>
        </div>
      </header>

      <main className="admin-main">
        {error && (
          <div className="error-message">
            {error}
            <button onClick={() => setError('')} className="close-error">×</button>
          </div>
        )}

        {/* 统计卡片 */}
        <div className="stats-grid">
          <div className="stat-card">
            <h3>总用户数</h3>
            <div className="stat-number">{stats.total_users || 0}</div>
          </div>
          <div className="stat-card">
            <h3>活跃用户</h3>
            <div className="stat-number">{stats.active_users || 0}</div>
          </div>
          <div className="stat-card">
            <h3>管理员</h3>
            <div className="stat-number">{stats.admin_users || 0}</div>
          </div>
          <div className="stat-card">
            <h3>普通用户</h3>
            <div className="stat-number">{stats.regular_users || 0}</div>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="admin-actions">
          <button 
            onClick={() => setShowAddUser(true)} 
            className="btn btn-primary"
          >
            添加用户
          </button>
          <button 
            onClick={() => setShowDeleteAllConfirm(true)} 
            className="btn btn-danger"
          >
            删除所有用户
          </button>
          <button 
            onClick={fetchData} 
            className="btn btn-secondary"
          >
            刷新数据
          </button>
        </div>

        {/* 用户列表 */}
        <div className="users-section">
          <h2>用户列表</h2>
          <div className="users-table-container">
            <table className="users-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>用户名</th>
                  <th>邮箱</th>
                  <th>手机号</th>
                  <th>角色</th>
                  <th>状态</th>
                  <th>注册时间</th>
                  <th>最后登录</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id}>
                    <td>{user.id}</td>
                    <td>{user.username}</td>
                    <td>{user.email || '-'}</td>
                    <td>{user.phone || '-'}</td>
                    <td>
                      <span className={`role-badge ${user.role}`}>
                        {user.role === 'admin' ? '管理员' : '用户'}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${user.is_active ? 'active' : 'inactive'}`}>
                        {user.is_active ? '活跃' : '禁用'}
                      </span>
                    </td>
                    <td>{formatDate(user.created_at)}</td>
                    <td>{formatDate(user.last_login)}</td>
                    <td>
                      <button 
                        onClick={() => {
                          setUserToDelete(user);
                          setShowDeleteConfirm(true);
                        }}
                        className="btn btn-danger btn-sm"
                        disabled={user.role === 'admin'}
                      >
                        删除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* 添加用户模态框 */}
      {showAddUser && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>添加用户</h3>
              <button onClick={() => setShowAddUser(false)} className="close-btn">×</button>
            </div>
            <form onSubmit={handleAddUser} className="modal-form">
              <div className="form-group">
                <label>用户名</label>
                <input
                  type="text"
                  value={newUser.username}
                  onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>邮箱</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>手机号</label>
                <input
                  type="tel"
                  value={newUser.phone}
                  onChange={(e) => setNewUser({...newUser, phone: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>密码</label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>角色</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                >
                  <option value="user">用户</option>
                  <option value="admin">管理员</option>
                </select>
              </div>
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={newUser.is_active}
                    onChange={(e) => setNewUser({...newUser, is_active: e.target.checked})}
                  />
                  激活用户
                </label>
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowAddUser(false)} className="btn btn-secondary">
                  取消
                </button>
                <button type="submit" className="btn btn-primary">
                  添加
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 删除用户确认模态框 */}
      {showDeleteConfirm && userToDelete && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>确认删除</h3>
              <button onClick={() => setShowDeleteConfirm(false)} className="close-btn">×</button>
            </div>
            <div className="modal-content">
              <p>确定要删除用户 <strong>{userToDelete.username}</strong> 吗？</p>
              <p className="warning">此操作不可撤销！</p>
            </div>
            <div className="modal-actions">
              <button onClick={() => setShowDeleteConfirm(false)} className="btn btn-secondary">
                取消
              </button>
              <button onClick={() => handleDeleteUser(userToDelete.id)} className="btn btn-danger">
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 删除所有用户确认模态框 */}
      {showDeleteAllConfirm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>危险操作</h3>
              <button onClick={() => setShowDeleteAllConfirm(false)} className="close-btn">×</button>
            </div>
            <div className="modal-content">
              <p><strong>警告：</strong>您即将删除所有非管理员用户！</p>
              <p>此操作将删除所有普通用户及其相关数据，包括：</p>
              <ul>
                <li>用户账号信息</li>
                <li>学习进度记录</li>
                <li>会员记录</li>
                <li>奖励记录</li>
              </ul>
              <p className="warning">此操作不可撤销，请谨慎操作！</p>
            </div>
            <div className="modal-actions">
              <button onClick={() => setShowDeleteAllConfirm(false)} className="btn btn-secondary">
                取消
              </button>
              <button onClick={handleDeleteAllUsers} className="btn btn-danger">
                确认删除所有用户
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;