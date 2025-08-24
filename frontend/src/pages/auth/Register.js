import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, Typography, message, Row, Col } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, SafetyOutlined } from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { register } from '../../redux/authSlice';
import axios from 'axios';

const { Title } = Typography;

const Register = () => {
  const [form] = Form.useForm();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { loading, isAuthenticated } = useSelector(state => state.auth);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [referralCode, setReferralCode] = useState('');
  const [sendingCode, setSendingCode] = useState(false);
  const [countdown, setCountdown] = useState(0);
  
  // 从登录页面传递过来的邮箱
  useEffect(() => {
    if (location.state?.email) {
      form.setFieldsValue({ email: location.state.email });
      message.info('检测到您输入的邮箱未注册，请完成注册');
    }
  }, [location.state, form]);

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

  // 倒计时逻辑
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  // 发送验证码
  const sendVerificationCode = async () => {
    try {
      const email = form.getFieldValue('email');
      if (!email) {
        message.error('请先输入邮箱');
        return;
      }
      
      setSendingCode(true);
      const response = await axios.post('/api/v1/auth/send-verification-code', { email });
      
      if (response.status === 200) {
        message.success('验证码已发送，请查收邮件');
        setCountdown(60); // 60秒倒计时
      }
    } catch (error) {
      message.error(typeof error.response?.data?.detail === 'string' ? error.response?.data?.detail : '发送验证码失败，请稍后再试');
    } finally {
      setSendingCode(false);
    }
  };

  const onFinish = async (values) => {
    if (values.password !== values.confirmPassword) {
      message.error('两次输入的密码不一致');
      return;
    }
    
    if (!values.email_verification_code) {
      message.error('请输入邮箱验证码');
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
            name="email_verification_code"
            rules={[{ required: true, message: '请输入邮箱验证码' }]}
          >
            <Row gutter={8}>
              <Col span={16}>
                <Input
                  prefix={<SafetyOutlined />}
                  placeholder="邮箱验证码"
                  size="large"
                />
              </Col>
              <Col span={8}>
                <Button
                  size="large"
                  onClick={sendVerificationCode}
                  disabled={countdown > 0}
                  loading={sendingCode}
                  block
                >
                  {countdown > 0 ? `${countdown}秒后重发` : '获取验证码'}
                </Button>
              </Col>
            </Row>
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