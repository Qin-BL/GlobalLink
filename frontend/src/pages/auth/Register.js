import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, Typography, message } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { register } from '../../redux/authSlice';

const { Title } = Typography;

const Register = () => {
  const [form] = Form.useForm();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { loading, isAuthenticated } = useSelector(state => state.auth);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [referralCode, setReferralCode] = useState('');

  // 从URL中获取推广码
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const ref = queryParams.get('ref');
    if (ref) {
      setReferralCode(ref);
    }
  }, [location]);

  // 如果已经登录，重定向到首页
  useEffect(() => {
    if (isAuthenticated && formSubmitted) {
      message.success('注册成功');
      navigate('/');
    }
  }, [isAuthenticated, navigate, formSubmitted]);

  const onFinish = async (values) => {
    if (values.password !== values.confirmPassword) {
      message.error('两次输入的密码不一致');
      return;
    }
    
    setFormSubmitted(true);
    const { confirmPassword, ...registerData } = values;
    
    // 如果有推广码，添加到注册数据中
    if (referralCode) {
      registerData.referral_code = referralCode;
    }
    
    await dispatch(register(registerData));
  };

  return (
    <div className="register-container">
      <Card className="register-card">
        <Title level={2} className="text-center">注册</Title>
        {referralCode && (
          <div style={{ marginBottom: '16px', color: '#1890ff', textAlign: 'center' }}>
            您正在通过推广码 <strong>{referralCode}</strong> 注册
          </div>
        )}
        <Form
          form={form}
          name="register"
          onFinish={onFinish}
          layout="vertical"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input 
              prefix={<UserOutlined />} 
              placeholder="用户名" 
              size="large" 
            />
          </Form.Item>

          <Form.Item
            name="email"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' }
            ]}
          >
            <Input 
              prefix={<MailOutlined />} 
              placeholder="邮箱" 
              size="large" 
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 6, message: '密码长度不能少于6个字符' }
            ]}
          >
            <Input.Password 
              prefix={<LockOutlined />} 
              placeholder="密码" 
              size="large" 
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            rules={[
              { required: true, message: '请确认密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'));
                },
              }),
            ]}
          >
            <Input.Password 
              prefix={<LockOutlined />} 
              placeholder="确认密码" 
              size="large" 
            />
          </Form.Item>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              size="large" 
              block
              loading={loading}
            >
              注册
            </Button>
          </Form.Item>

          <div className="text-center">
            <span>已有账号？</span>
            <Link to="/login">立即登录</Link>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default Register;