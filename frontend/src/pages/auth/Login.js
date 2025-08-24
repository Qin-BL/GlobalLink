import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../../redux/authSlice';

const { Title } = Typography;

const Login = () => {
  const [form] = Form.useForm();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, isAuthenticated } = useSelector(state => state.auth);
  const [formSubmitted, setFormSubmitted] = useState(false);

  // 如果已经登录，重定向到首页
  React.useEffect(() => {
    if (isAuthenticated && formSubmitted) {
      message.success('登录成功');
      navigate('/');
    }
  }, [isAuthenticated, navigate, formSubmitted]);

  const onFinish = async (values) => {
    setFormSubmitted(true);
    const result = await dispatch(login(values));
    
    if (result.error) {
      // 确保错误消息是字符串
      const errorMessage = typeof result.error.message === 'string' ? result.error.message : JSON.stringify(result.error.message);
      
      // 如果登录失败且HTTP状态码为401且错误信息包含"用户不存在"，则跳转到注册页面
      if (result.error.status === 401 && errorMessage.includes('用户不存在')) {
        console.log('用户不存在，跳转到注册页面');
        navigate('/register', { state: { email: values.username } });
      } else {
        // 显示其他错误
        message.error(errorMessage || '登录失败，请重试');
      }
    }
  };

  return (
    <div className="login-container">
      <Card className="login-card">
        <Title level={2} className="text-center">登录</Title>
        <Form
          form={form}
          name="login"
          onFinish={onFinish}
          layout="vertical"
        >
          <Form.Item
            name="username"
            rules={[
              { required: true, message: '请输入用户名/邮箱/手机号' }
            ]}
          >
            <Input 
              prefix={<UserOutlined />} 
              placeholder="用户名/邮箱/手机号" 
              size="large" 
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password 
              prefix={<LockOutlined />} 
              placeholder="密码" 
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
              登录
            </Button>
          </Form.Item>

          <div className="text-center">
            <span>还没有账号？</span>
            <Link to="/register">立即注册</Link>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default Login;