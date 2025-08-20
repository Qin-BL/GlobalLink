import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Row, Col, Card, Typography, Button, Steps, Form, 
  Input, Radio, Divider, Alert, Spin, message, Result, Image
} from 'antd';
import { 
  CreditCardOutlined, BankOutlined, AlipayCircleOutlined, 
  WechatOutlined, CheckCircleOutlined, LockOutlined
} from '@ant-design/icons';
// 使用与Referral.js相同的QRCode库
import QRCode from 'qrcode.react';

// 确保Radio.Group和Radio.Button可用
const { Group: RadioGroup, Button: RadioButton } = Radio;

const { Title, Text, Paragraph } = Typography;
const { Step } = Steps;

const Payment = () => {
  const { planId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const period = queryParams.get('period') || 'monthly';
  
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [planDetails, setPlanDetails] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('wechat');
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentId, setPaymentId] = useState(null);
  const [qrcodeUrl, setQrcodeUrl] = useState('');
  const [checkingPayment, setCheckingPayment] = useState(false);
  const [paymentCheckInterval, setPaymentCheckInterval] = useState(null);
  const [form] = Form.useForm();

  // 从API获取计划详情
  useEffect(() => {
    const fetchPlanDetails = async () => {
      try {
        // 这里应该是实际的API调用
        // 模拟数据
        setTimeout(() => {
          const mockPlans = {
            basic: {
              id: 'basic',
              name: '基础会员',
              monthlyPrice: 39,
              yearlyPrice: 374,
              features: [
                '访问所有基础课程',
                '每月5次课程下载',
                '标准学习工具',
                '社区支持'
              ]
            },
            premium: {
              id: 'premium',
              name: '高级会员',
              monthlyPrice: 99,
              yearlyPrice: 950,
              features: [
                '访问所有课程（包括高级课程）',
                '每月20次课程下载',
                '专家指导',
                '学习路径定制'
              ]
            },
            ultimate: {
              id: 'ultimate',
              name: '旗舰会员',
              monthlyPrice: 199,
              yearlyPrice: 1910,
              features: [
                '无限制访问所有课程',
                '无限制课程下载',
                '优先专家指导',
                '个性化学习路径',
                '证书颁发'
              ]
            }
          };
          
          setPlanDetails(mockPlans[planId] || null);
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('获取计划详情失败:', error);
        message.error('获取计划详情失败');
        setLoading(false);
      }
    };

    if (planId) {
      fetchPlanDetails();
    } else {
      setLoading(false);
      message.error('无效的会员计划');
      navigate('/membership');
    }
  }, [planId, period, navigate]);

  // 处理支付方式选择
  const handlePaymentMethodChange = (e) => {
    setPaymentMethod(e.target.value);
  };

  // 创建订阅并获取支付二维码
  const createSubscription = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // 创建订阅
      const subscribeResponse = await axios.post('/api/v1/membership/subscribe', {
        membership_type: period
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const newPaymentId = subscribeResponse.data.id;
      setPaymentId(newPaymentId);
      
      // 获取支付二维码
      const qrcodeResponse = await axios.get(`/api/v1/membership/payment-qrcode?payment_id=${newPaymentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setQrcodeUrl(qrcodeResponse.data.qrcode_url);
      setLoading(false);
      
      // 开始定期检查支付状态
      startPaymentCheck(newPaymentId);
    } catch (error) {
      console.error('创建订阅失败:', error);
      message.error('创建订阅失败，请重试');
      setLoading(false);
    }
  };

  // 开始定期检查支付状态
  const startPaymentCheck = (paymentId) => {
    // 清除之前的定时器
    if (paymentCheckInterval) {
      clearInterval(paymentCheckInterval);
    }
    
    // 设置新的定时器，每5秒检查一次
    const interval = setInterval(() => {
      checkPaymentStatus(paymentId);
    }, 5000);
    
    setPaymentCheckInterval(interval);
  };

  // 检查支付状态
  const checkPaymentStatus = async (paymentId) => {
    try {
      setCheckingPayment(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.get(`/api/v1/membership/payment-status?payment_id=${paymentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.status === 'completed') {
        // 支付成功
        clearInterval(paymentCheckInterval);
        setPaymentSuccess(true);
        setCurrentStep(2);
        message.success('支付成功！');
      }
      
      setCheckingPayment(false);
    } catch (error) {
      console.error('检查支付状态失败:', error);
      setCheckingPayment(false);
    }
  };

  // 处理表单提交
  const handleSubmit = async (values) => {
    if (paymentMethod === 'wechat' || paymentMethod === 'alipay') {
      // 对于微信和支付宝，创建订阅并获取二维码
      await createSubscription();
    } else {
      // 对于其他支付方式，模拟支付处理
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        setPaymentSuccess(true);
        setCurrentStep(2);
        message.success('支付成功！');
      }, 2000);
    }
  };

  // 处理步骤变化
  const handleNextStep = () => {
    if (currentStep === 0) {
      setCurrentStep(1);
    } else if (currentStep === 1) {
      form.submit();
    }
  };

  const handlePrevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  // 组件卸载时清除定时器
  useEffect(() => {
    return () => {
      if (paymentCheckInterval) {
        clearInterval(paymentCheckInterval);
      }
    };
  }, [paymentCheckInterval]);

  // 渲染计划确认步骤
  const renderPlanConfirmation = () => {
    if (!planDetails) return null;
    
    const price = period === 'yearly' ? planDetails.yearlyPrice : planDetails.monthlyPrice;
    const periodText = period === 'yearly' ? '年' : '月';
    
    return (
      <div className="plan-confirmation">
        <Card>
          <Title level={4}>确认您的订阅</Title>
          
          <div className="plan-summary">
            <div className="plan-name">
              <Text strong>会员计划：</Text>
              <Text>{planDetails.name}</Text>
            </div>
            
            <div className="plan-period">
              <Text strong>订阅周期：</Text>
              <Text>{period === 'yearly' ? '年度' : '月度'}</Text>
            </div>
            
            <div className="plan-price">
              <Text strong>价格：</Text>
              <Text>¥{price}/{periodText}</Text>
            </div>
          </div>
          
          <Divider />
          
          <div className="plan-features">
            <Text strong>包含功能：</Text>
            <ul>
              {planDetails.features.map((feature, index) => (
                <li key={index}>
                  <CheckCircleOutlined style={{ color: '#52c41a' }} />
                  <Text style={{ marginLeft: 8 }}>{feature}</Text>
                </li>
              ))}
            </ul>
          </div>
        </Card>
        
        <div className="step-actions">
          <Button onClick={() => navigate('/membership')}>返回</Button>
          <Button type="primary" onClick={handleNextStep}>继续</Button>
        </div>
      </div>
    );
  };

  // 渲染支付信息步骤
  const renderPaymentInfo = () => {
    if (!planDetails) return null;
    
    return (
      <div className="payment-info">
        <Card>
          <Title level={4}>支付信息</Title>
          
          <div className="payment-method-selection">
            <Text strong>选择支付方式：</Text>
            <RadioGroup 
              onChange={handlePaymentMethodChange} 
              value={paymentMethod}
              className="payment-methods"
            >
              <RadioButton value="credit_card">
                <CreditCardOutlined /> 信用卡
              </RadioButton>
              <RadioButton value="bank_transfer">
                <BankOutlined /> 银行转账
              </RadioButton>
              <RadioButton value="alipay">
                <AlipayCircleOutlined /> 支付宝
              </RadioButton>
              <RadioButton value="wechat">
                <WechatOutlined /> 微信支付
              </RadioButton>
            </RadioGroup>
          </div>
          
          <Divider />
          
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            className="payment-form"
          >
            {paymentMethod === 'credit_card' && (
              <>
                <Form.Item
                  label="持卡人姓名"
                  name="cardholderName"
                  rules={[{ required: true, message: '请输入持卡人姓名' }]}
                >
                  <Input placeholder="请输入持卡人姓名" />
                </Form.Item>
                
                <Form.Item
                  label="卡号"
                  name="cardNumber"
                  rules={[{ required: true, message: '请输入卡号' }]}
                >
                  <Input placeholder="请输入卡号" />
                </Form.Item>
                
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      label="有效期"
                      name="expiryDate"
                      rules={[{ required: true, message: '请输入有效期' }]}
                    >
                      <Input placeholder="MM/YY" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      label="安全码"
                      name="cvv"
                      rules={[{ required: true, message: '请输入安全码' }]}
                    >
                      <Input placeholder="CVV" />
                    </Form.Item>
                  </Col>
                </Row>
              </>
            )}
            
            {paymentMethod === 'bank_transfer' && (
              <>
                <Alert
                  message="银行转账信息"
                  description={
                    <div>
                      <p>请使用以下信息进行银行转账：</p>
                      <p>银行名称：示例银行</p>
                      <p>账户名称：GlobalLink教育科技有限公司</p>
                      <p>账号：6222 0000 0000 0000</p>
                      <p>转账完成后，请填写以下信息：</p>
                    </div>
                  }
                  type="info"
                  showIcon
                />
                
                <Form.Item
                  label="转账人姓名"
                  name="transferName"
                  rules={[{ required: true, message: '请输入转账人姓名' }]}
                >
                  <Input placeholder="请输入转账人姓名" />
                </Form.Item>
                
                <Form.Item
                  label="转账时间"
                  name="transferDate"
                  rules={[{ required: true, message: '请输入转账时间' }]}
                >
                  <Input placeholder="YYYY-MM-DD HH:MM" />
                </Form.Item>
                
                <Form.Item
                  label="转账金额"
                  name="transferAmount"
                  rules={[{ required: true, message: '请输入转账金额' }]}
                >
                  <Input placeholder="请输入转账金额" prefix="¥" />
                </Form.Item>
              </>
            )}
            
            {paymentMethod === 'alipay' && (
              <div className="qr-payment">
                <Alert
                  message="支付宝支付"
                  description="请使用支付宝扫描下方二维码进行支付"
                  type="info"
                  showIcon
                />
                
                <div className="qr-code-container">
                  {qrcodeUrl ? (
                    <div className="qr-code">
                      <QRCode value={qrcodeUrl} size={200} />
                      <Text style={{ marginTop: 16 }}>请使用支付宝扫描上方二维码完成支付</Text>
                    </div>
                  ) : (
                    <div className="qr-code-placeholder">
                      <Text>点击下方按钮生成支付二维码</Text>
                    </div>
                  )}
                </div>
                
                <Form.Item
                  label="支付宝账号"
                  name="alipayAccount"
                  rules={[{ required: true, message: '请输入支付宝账号' }]}
                >
                  <Input placeholder="请输入支付宝账号" />
                </Form.Item>
              </div>
            )}
            
            {paymentMethod === 'wechat' && (
              <div className="qr-payment">
                <Alert
                  message="微信支付"
                  description="请使用微信扫描下方二维码进行支付"
                  type="info"
                  showIcon
                />
                
                <div className="qr-code-container">
                  {qrcodeUrl ? (
                    <div className="qr-code">
                      <QRCode value={qrcodeUrl} size={200} />
                      <Text style={{ marginTop: 16 }}>请使用微信扫描上方二维码完成支付</Text>
                      {checkingPayment && <Spin size="small" style={{ marginLeft: 8 }} />}
                    </div>
                  ) : (
                    <div className="qr-code-placeholder">
                      <Text>点击下方按钮生成支付二维码</Text>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            <div className="payment-security">
              <LockOutlined />
              <Text type="secondary">所有支付信息均经过加密处理，确保您的支付安全。</Text>
            </div>
          </Form>
        </Card>
        
        <div className="step-actions">
          <Button onClick={handlePrevStep}>返回</Button>
          <Button type="primary" onClick={handleNextStep} loading={loading}>
            {(paymentMethod === 'wechat' || paymentMethod === 'alipay') && !qrcodeUrl ? '生成支付二维码' : '确认支付'}
          </Button>
        </div>
      </div>
    );
  };

  // 渲染支付成功步骤
  const renderPaymentSuccess = () => {
    if (!planDetails) return null;
    
    return (
      <div className="payment-success">
        <Result
          status="success"
          title="支付成功！"
          subTitle={`您已成功订阅${planDetails.name}${period === 'yearly' ? '年度' : '月度'}计划`}
          extra={[
            <Button 
              type="primary" 
              key="courses" 
              onClick={() => navigate('/courses')}
            >
              浏览课程
            </Button>,
            <Button 
              key="profile" 
              onClick={() => navigate('/profile')}
            >
              查看会员信息
            </Button>,
          ]}
        />
      </div>
    );
  };

  if (loading && !planDetails) {
    return (
      <div className="payment-loading">
        <Spin size="large" />
        <Text>加载中...</Text>
      </div>
    );
  }

  if (!planDetails) {
    return (
      <Result
        status="error"
        title="无效的会员计划"
        subTitle="您选择的会员计划不存在或已失效"
        extra={[
          <Button 
            type="primary" 
            key="membership" 
            onClick={() => navigate('/membership')}
          >
            返回会员页面
          </Button>
        ]}
      />
    );
  }

  return (
    <div className="payment-container">
      <div className="payment-header">
        <Title level={2}>订阅支付</Title>
        <Paragraph>
          完成支付，开启您的学习之旅。
        </Paragraph>
      </div>
      
      <Steps current={currentStep} className="payment-steps">
        <Step title="确认订阅" description="确认会员计划" />
        <Step title="支付信息" description="完成支付" />
        <Step title="完成" description="订阅成功" />
      </Steps>
      
      <div className="payment-step-content">
        {currentStep === 0 && renderPlanConfirmation()}
        {currentStep === 1 && renderPaymentInfo()}
        {currentStep === 2 && renderPaymentSuccess()}
      </div>
    </div>
  );
};

export default Payment;