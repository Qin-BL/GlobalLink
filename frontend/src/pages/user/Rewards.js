import React, { useState, useEffect } from 'react';
import { 
  Card, Typography, Table, Button, Modal, Form, 
  Input, Select, InputNumber, message, Spin, Empty, Statistic, Row, Col, Divider, Tabs, Alert, Radio
} from 'antd';
import { 
  WalletOutlined, DollarOutlined, BankOutlined, 
  TransactionOutlined, CheckCircleOutlined, ClockCircleOutlined,
  HistoryOutlined, ArrowRightOutlined
} from '@ant-design/icons';
import axios from 'axios';
import { useSelector } from 'react-redux';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

const Rewards = () => {
  const { user } = useSelector(state => state.auth);
  const [loading, setLoading] = useState(true);
  const [rewards, setRewards] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [rewardBalance, setRewardBalance] = useState(0);
  const [withdrawalModalVisible, setWithdrawalModalVisible] = useState(false);
  const [withdrawalLoading, setWithdrawalLoading] = useState(false);
  const [form] = Form.useForm();

  // 获取奖励金记录和余额
  useEffect(() => {
    const fetchRewards = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        // 获取奖励金记录
        const rewardsResponse = await axios.get('/api/v1/membership/rewards', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // 获取推广信息（包含奖励金余额）
        const referralResponse = await axios.get('/api/v1/users/referral', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // 获取提现记录
        const withdrawalsResponse = await axios.get('/api/v1/membership/withdrawal/history', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setRewards(rewardsResponse.data);
        setRewardBalance(referralResponse.data.reward_balance);
        setWithdrawals(withdrawalsResponse.data || []);
        setLoading(false);
      } catch (error) {
        console.error('获取奖励金信息失败:', error);
        message.error('获取奖励金信息失败');
        setLoading(false);
      }
    };

    fetchRewards();
  }, []);

  // 处理提现申请
  const handleWithdrawal = async (values) => {
    try {
      setWithdrawalLoading(true);
      const token = localStorage.getItem('token');
      
      // 提交提现申请
      await axios.post('/api/v1/membership/withdraw', {
        user_id: user.id,
        amount: values.amount,
        payment_method: values.paymentMethod,
        account_info: values.accountInfo,
        real_name: values.realName
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // 重新获取奖励金余额
      const referralResponse = await axios.get('/api/v1/users/referral', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // 重新获取提现记录
      const withdrawalsResponse = await axios.get('/api/v1/membership/withdrawal/history', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setRewardBalance(referralResponse.data.reward_balance);
      setWithdrawals(withdrawalsResponse.data || []);
      setWithdrawalLoading(false);
      setWithdrawalModalVisible(false);
      form.resetFields();
      message.success('提现申请已提交，请等待处理');
      
      // 重新获取奖励金记录
      const rewardsResponse = await axios.get('/api/v1/membership/rewards', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRewards(rewardsResponse.data);
    } catch (error) {
      console.error('提现申请失败:', error);
      message.error(typeof error.response?.data?.detail === 'string' ? error.response?.data?.detail : '提现申请失败');
      setWithdrawalLoading(false);
    }
  };

  // 奖励金记录表格列定义
  const rewardsColumns = [
    {
      title: '奖励来源',
      dataIndex: 'source',
      key: 'source',
      render: (text) => {
        if (text === 'referral') {
          return '推广返利';
        } else if (text === 'bonus') {
          return '活动奖励';
        }
        return text;
      }
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount) => `¥${amount.toFixed(2)}`
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        if (status === 'available') {
          return <span style={{ color: '#52c41a' }}><CheckCircleOutlined /> 可提现</span>;
        } else if (status === 'pending') {
          return <span style={{ color: '#faad14' }}><ClockCircleOutlined /> 处理中</span>;
        } else if (status === 'withdrawn') {
          return <span style={{ color: '#1890ff' }}><TransactionOutlined /> 已提现</span>;
        }
        return status;
      }
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => new Date(date).toLocaleString()
    }
  ];

  if (loading) {
    return (
      <div className="rewards-loading" style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <div style={{ marginTop: '20px' }}>加载奖励金信息中...</div>
      </div>
    );
  }

  // 提现记录表格列定义
  const withdrawalColumns = [
    {
      title: '申请时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => new Date(date).toLocaleString()
    },
    {
      title: '提现金额',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount) => `¥${amount.toFixed(2)}`
    },
    {
      title: '提现方式',
      dataIndex: 'payment_method',
      key: 'payment_method',
      render: (method) => {
        if (method === 'alipay') {
          return '支付宝';
        } else if (method === 'wechat') {
          return '微信';
        } else if (method === 'bank') {
          return '银行卡';
        } else {
          return method;
        }
      }
    },
    {
      title: '账户信息',
      dataIndex: 'account_info',
      key: 'account_info',
      render: (info) => info || '-'
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        if (status === 'pending') {
          return <span style={{ color: '#faad14' }}><ClockCircleOutlined /> 处理中</span>;
        } else if (status === 'completed') {
          return <span style={{ color: '#52c41a' }}><CheckCircleOutlined /> 已完成</span>;
        } else if (status === 'rejected') {
          return <span style={{ color: '#f5222d' }}>已拒绝</span>;
        } else {
          return status;
        }
      }
    }
  ];

  return (
    <div className="rewards-container">
      <div className="rewards-header">
        <Title level={2}>奖励金管理</Title>
        <Paragraph>
          查看您的奖励金记录，并申请提现。
        </Paragraph>
      </div>
      
      <Card className="rewards-balance-card" style={{ marginBottom: '24px' }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} md={12}>
            <Statistic
              title="当前奖励金余额"
              value={rewardBalance}
              precision={2}
              valueStyle={{ color: '#1890ff', fontSize: '28px' }}
              prefix={<WalletOutlined />}
              suffix="元"
            />
            <div style={{ marginTop: '8px', color: '#666' }}>
              <small>奖励金来源于您成功推广的会员订阅</small>
            </div>
          </Col>
          <Col xs={24} md={12} style={{ textAlign: 'right' }}>
            <Button 
              type="primary" 
              size="large" 
              icon={<BankOutlined />}
              onClick={() => {
                if (rewardBalance < 10) {
                  message.warning('奖励金余额不足10元，暂不能提现');
                  return;
                }
                setWithdrawalModalVisible(true);
              }}
              disabled={rewardBalance < 10}
            >
              申请提现
            </Button>
            {rewardBalance < 10 && (
              <div style={{ marginTop: '8px', color: '#faad14' }}>
                <small>奖励金余额满10元可提现</small>
              </div>
            )}
          </Col>
        </Row>
      </Card>
      
      <Tabs defaultActiveKey="rewards" className="rewards-tabs">
        <TabPane tab={<span><HistoryOutlined /> 奖励金记录</span>} key="rewards">
          {rewards.length > 0 ? (
            <Table 
              dataSource={rewards} 
              columns={rewardsColumns} 
              rowKey="id" 
              pagination={{ pageSize: 10 }}
            />
          ) : (
            <Empty description="暂无奖励金记录" />
          )}
        </TabPane>
        
        <TabPane tab={<span><ArrowRightOutlined /> 提现记录</span>} key="withdrawals">
          {withdrawals.length > 0 ? (
            <Table 
              dataSource={withdrawals} 
              columns={withdrawalColumns} 
              rowKey="id" 
              pagination={{ pageSize: 10 }}
            />
          ) : (
            <Empty description="暂无提现记录" />
          )}
        </TabPane>
      </Tabs>
      
      <Modal
        title="申请提现"
        visible={withdrawalModalVisible}
        onCancel={() => setWithdrawalModalVisible(false)}
        footer={null}
        destroyOnClose
      >
        <Alert
          message="提现说明"
          description={
            <div>
              <p>1. 单笔提现金额不低于10元，不超过1000元</p>
              <p>2. 提现申请将在1-3个工作日内处理</p>
              <p>3. 请确保提供的账户信息准确无误</p>
            </div>
          }
          type="info"
          showIcon
          style={{ marginBottom: '16px' }}
        />
        
        <Form
          form={form}
          layout="vertical"
          onFinish={handleWithdrawal}
          initialValues={{
            amount: Math.min(rewardBalance, 1000),
            paymentMethod: 'alipay'
          }}
        >
          <Form.Item
            name="amount"
            label="提现金额"
            rules={[
              { required: true, message: '请输入提现金额' },
              { type: 'number', min: 10, message: '提现金额不能低于10元' },
              { type: 'number', max: Math.min(rewardBalance, 1000), message: `提现金额不能超过${Math.min(rewardBalance, 1000)}元` }
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="请输入提现金额"
              min={10}
              max={Math.min(rewardBalance, 1000)}
              precision={2}
              step={10}
              formatter={value => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value.replace(/¥\s?|(,*)/g, '')}
            />
          </Form.Item>
          
          <Form.Item
            name="paymentMethod"
            label="提现方式"
            rules={[{ required: true, message: '请选择提现方式' }]}
          >
            <Select placeholder="请选择提现方式">
              <Option value="alipay">支付宝</Option>
              <Option value="wechat">微信</Option>
              <Option value="bank">银行卡</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="accountInfo"
            label="收款账号"
            rules={[{ required: true, message: '请输入收款账号' }]}
          >
            <Input placeholder="请输入收款账号" />
          </Form.Item>
          
          <Form.Item
            name="realName"
            label="真实姓名"
            rules={[{ required: true, message: '请输入真实姓名' }]}
          >
            <Input placeholder="请输入真实姓名" />
          </Form.Item>
          
          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={withdrawalLoading} 
              block
              icon={<CheckCircleOutlined />}
            >
              确认提现
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Rewards;