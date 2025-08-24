import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Layout, Menu, Button, Avatar, Dropdown, Space, Badge, message } from 'antd';
import { UserOutlined, BellOutlined, LogoutOutlined, GlobalOutlined, BookOutlined, CrownOutlined, TeamOutlined, GiftOutlined } from '@ant-design/icons';
import { logout } from '../../redux/authSlice';

const { Header } = Layout;

const AppHeader = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { isAuthenticated, user, loading } = useSelector(state => state.auth);
  const [current, setCurrent] = useState('');
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    // 根据当前路径设置活动菜单项
    const path = location.pathname.split('/')[1] || 'courses';
    setCurrent(path);
  }, [location]);

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      const result = await dispatch(logout());
      if (result.error) {
        message.error(typeof result.error === 'string' ? result.error : result.error.message || '登出失败');
      } else {
        message.success('登出成功');
        navigate('/login');
      }
    } catch (error) {
      message.error('登出过程中发生错误');
    } finally {
      setLoggingOut(false);
    }
  };

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人资料',
      onClick: () => navigate('/profile')
    },
    {
      key: 'referral',
      icon: <TeamOutlined />,
      label: '推广返利',
      onClick: () => navigate('/referral')
    },
    {
      key: 'rewards',
      icon: <GiftOutlined />,
      label: '奖励金',
      onClick: () => navigate('/rewards')
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: loggingOut ? '登出中...' : '退出登录',
      onClick: handleLogout,
      disabled: loggingOut
    }
  ];

  const menuItems = [
    {
      key: 'courses',
      icon: <BookOutlined />,
      label: '课程'
    },
    {
      key: 'membership',
      icon: <CrownOutlined />,
      label: '会员'
    }
  ];

  return (
    <Header className="app-header">
      <div className="logo">
        <Link to="/">
          <GlobalOutlined /> GlobalLink
        </Link>
      </div>
      {isAuthenticated ? (
        <>
          <Menu
            theme="dark"
            mode="horizontal"
            selectedKeys={[current]}
            items={menuItems}
            onClick={e => navigate(`/${e.key}`)}
            style={{ flex: 1 }}
          />
          <div className="header-actions">
            <Badge count={0} dot>
              <Button
                type="text"
                icon={<BellOutlined />}
                style={{ color: 'white' }}
              />
            </Badge>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Space>
                <Avatar icon={<UserOutlined />} />
                <span style={{ color: 'white' }}>{user?.username || '用户'}</span>
              </Space>
            </Dropdown>
          </div>
        </>
      ) : (
        <div className="auth-buttons">
          <Button type="link" onClick={() => navigate('/login')}>登录</Button>
          <Button type="primary" onClick={() => navigate('/register')}>注册</Button>
        </div>
      )}
    </Header>
  );
};

export default AppHeader;