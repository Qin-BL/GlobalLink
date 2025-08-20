import React, { useState, useEffect } from 'react';
import { 
  Card, Typography, Button, Input, Table, Spin, 
  message, Divider, Statistic, Row, Col, Alert, Tooltip, Empty
} from 'antd';
import { 
  ShareAltOutlined, CopyOutlined, QrcodeOutlined, 
  TeamOutlined, DollarOutlined, LinkOutlined
} from '@ant-design/icons';
import QRCode from 'qrcode.react';
import axios from 'axios';
import { useSelector } from 'react-redux';

const { Title, Text, Paragraph } = Typography;

const Referral = () => {
  const { user } = useSelector(state => state.auth);
  const [loading, setLoading] = useState(true);
  const [referralInfo, setReferralInfo] = useState(null);
  const [referralHistory, setReferralHistory] = useState([]);
  const [qrCodeVisible, setQrCodeVisible] = useState(false);
  
  // 获取推广信息
  useEffect(() => {
    const fetchReferralInfo = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        // 获取推广信息
        const referralResponse = await axios.get('/api/v1/users/referral', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // 获取推广历史
        const historyResponse = await axios.get('/api/v1/users/referral/history', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setReferralInfo(referralResponse.data);
        setReferralHistory(historyResponse.data || []);
        setLoading(false);
      } catch (error) {
        console.error('获取推广信息失败:', error);
        message.error('获取推广信息失败');
        setLoading(false);
      }
    };

    fetchReferralInfo();
  }, []);

  // 复制推广链接
  const copyReferralLink = () => {
    if (!referralInfo) return;
    
    const referralLink = `${window.location.origin}/register?ref=${referralInfo.referral_code}`;
    navigator.clipboard.writeText(referralLink)
      .then(() => {
        message.success('推广链接已复制到剪贴板');
      })
      .catch(() => {
        message.error('复制失败，请手动复制');
      });
  };

  // 复制推广码
  const copyReferralCode = () => {
    if (!referralInfo) return;
    
    navigator.clipboard.writeText(referralInfo.referral_code)
      .then(() => {
        message.success('推广码已复制到剪贴板');
      })
      .catch(() => {
        message.error('复制失败，请手动复制');
      });
  };

  // 表格列定义
  const columns = [
    {
      title: '好友用户名',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: '注册时间',
      dataIndex: 'register_time',
      key: 'register_time',
      render: (date) => new Date(date).toLocaleString()
    },
    {
      title: '会员状态',
      dataIndex: 'membership_status',
      key: 'membership_status',
      render: (status) => {
        if (status === 'active') {
          return <span style={{ color: '#52c41a' }}>已开通会员</span>;
        } else if (status === 'expired') {
          return <span style={{ color: '#f5222d' }}>会员已过期</span>;
        } else {
          return <span style={{ color: '#faad14' }}>未开通会员</span>;
        }
      }
    },
    {
      title: '奖励状态',
      dataIndex: 'reward_status',
      key: 'reward_status',
      render: (status) => {
        if (status === 'received') {
          return <span style={{ color: '#52c41a' }}>已获得奖励</span>;
        } else if (status === 'pending') {
          return <span style={{ color: '#faad14' }}>等待会员开通</span>;
        } else {
          return <span style={{ color: '#f5222d' }}>未获得奖励</span>;
        }
      }
    },
    {
      title: '奖励金额',
      dataIndex: 'reward_amount',
      key: 'reward_amount',
      render: (amount) => amount ? `¥${amount.toFixed(2)}` : '-'
    }
  ];

  if (loading) {
    return (
      <div className="referral-loading" style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <div style={{ marginTop: '20px' }}>加载推广信息中...</div>
      </div>
    );
  }

  // 生成推广链接
  const referralLink = referralInfo ? 
    `${window.location.origin}/register?ref=${referralInfo.referral_code}` : '';

  return (
    <div className="referral-container">
      <div className="referral-header">
        <Title level={2}>推广返利</Title>
        <Paragraph>
          邀请好友注册并开通会员，获取高额返利奖励！
        </Paragraph>
      </div>
      
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} md={12}>
          <Card>
            <Title level={4}>您的推广信息</Title>
            <div style={{ marginBottom: '16px' }}>
              <Text strong>推广码：</Text>
              <Text copyable>{referralInfo?.referral_code}</Text>
              <Button 
                type="link" 
                icon={<CopyOutlined />} 
                onClick={copyReferralCode}
              >
                复制
              </Button>
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <Text strong>推广链接：</Text>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <Input 
                  value={referralLink} 
                  readOnly 
                  style={{ marginRight: '8px' }}
                />
                <Button 
                  type="primary" 
                  icon={<CopyOutlined />} 
                  onClick={copyReferralLink}
                >
                  复制
                </Button>
                <Tooltip title="显示二维码">
                  <Button 
                    icon={<QrcodeOutlined />} 
                    style={{ marginLeft: '8px' }}
                    onClick={() => setQrCodeVisible(!qrCodeVisible)}
                  />
                </Tooltip>
              </div>
              
              {qrCodeVisible && (
                <div style={{ marginTop: '16px', textAlign: 'center' }}>
                  <QRCode value={referralLink} size={200} />
                  <div style={{ marginTop: '8px' }}>扫描二维码或分享给好友</div>
                </div>
              )}
            </div>
            
            <Alert
              message="推广说明"
              description={
                <div>
                  <p>1. 好友通过您的推广链接注册并开通会员后，您将获得会员费的{(referralInfo?.referral_rate * 100)}%作为奖励</p>
                  <p>2. 奖励金将在好友成功支付后自动添加到您的账户</p>
                  <p>3. 您可以在「奖励金管理」中查看并提现您的奖励金</p>
                </div>
              }
              type="info"
              showIcon
            />
          </Card>
        </Col>
        
        <Col xs={24} md={12}>
          <Card>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Statistic
                  title="累计推广人数"
                  value={referralHistory.length}
                  prefix={<TeamOutlined />}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="累计奖励金额"
                  value={referralHistory.reduce((sum, item) => sum + (item.reward_amount || 0), 0)}
                  precision={2}
                  prefix={<DollarOutlined />}
                  suffix="元"
                />
              </Col>
            </Row>
            
            <Divider />
            
            <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
              <div>
                <Button 
                  type="primary" 
                  shape="circle" 
                  icon={<ShareAltOutlined />} 
                  size="large"
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: 'GlobalLink英语学习平台邀请',
                        text: '我正在使用GlobalLink学习英语，邀请你一起加入！',
                        url: referralLink
                      })
                      .catch(err => {
                        message.error('分享失败');
                      });
                    } else {
                      copyReferralLink();
                    }
                  }}
                />
                <div style={{ marginTop: '8px' }}>分享给好友</div>
              </div>
              
              <div>
                <Button 
                  type="primary" 
                  shape="circle" 
                  icon={<LinkOutlined />} 
                  size="large"
                  onClick={copyReferralLink}
                />
                <div style={{ marginTop: '8px' }}>复制链接</div>
              </div>
              
              <div>
                <Button 
                  type="primary" 
                  shape="circle" 
                  icon={<DollarOutlined />} 
                  size="large"
                  onClick={() => window.location.href = '/rewards'}
                />
                <div style={{ marginTop: '8px' }}>查看奖励</div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>
      
      <Card title="推广记录" className="referral-history">
        {referralHistory.length > 0 ? (
          <Table 
            dataSource={referralHistory} 
            columns={columns} 
            rowKey="id" 
            pagination={{ pageSize: 10 }}
          />
        ) : (
          <Empty description="暂无推广记录" />
        )}
      </Card>
    </div>
  );
};

export default Referral;