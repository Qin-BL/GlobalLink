import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Row, Col, Card, Typography, Button, Tag, List, 
  Divider, Spin, message, Tabs, Badge
} from 'antd';
import { 
  CheckCircleOutlined, CloseCircleOutlined, 
  CrownOutlined, ThunderboltOutlined, RocketOutlined
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

const Membership = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userMembership, setUserMembership] = useState(null);
  const [activeTab, setActiveTab] = useState('1');

  // 模拟从API获取会员信息
  useEffect(() => {
    const fetchMembershipInfo = async () => {
      try {
        // 这里应该是实际的API调用
        // const response = await api.getMembershipInfo();
        // 模拟数据
        setTimeout(() => {
          const mockMembership = {
            currentPlan: 'free', // 'free', 'basic', 'premium', 'ultimate'
            expiryDate: '2023-12-31',
            usageStats: {
              coursesAccessed: 5,
              lessonsCompleted: 12,
              studyHours: 8.5,
              remainingDownloads: 0
            }
          };
          
          setUserMembership(mockMembership);
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('获取会员信息失败:', error);
        message.error('获取会员信息失败');
        setLoading(false);
      }
    };

    fetchMembershipInfo();
  }, []);

  // 会员计划数据
  const membershipPlans = [
    {
      id: 'free',
      name: '免费计划',
      price: '¥0',
      period: '永久',
      icon: <ThunderboltOutlined />,
      color: '#52c41a',
      features: [
        { text: '访问基础课程', included: true },
        { text: '标准学习工具', included: true },
        { text: '社区支持', included: true },
        { text: '高级课程访问', included: false },
        { text: '课程下载', included: false },
        { text: '专家指导', included: false },
        { text: '学习路径定制', included: false },
        { text: '证书颁发', included: false }
      ],
      recommended: false
    },
    {
      id: 'basic',
      name: '基础会员',
      price: '¥39',
      period: '每月',
      icon: <CrownOutlined />,
      color: '#1890ff',
      features: [
        { text: '访问基础课程', included: true },
        { text: '标准学习工具', included: true },
        { text: '社区支持', included: true },
        { text: '高级课程访问', included: true },
        { text: '课程下载 (每月5次)', included: true },
        { text: '专家指导', included: false },
        { text: '学习路径定制', included: false },
        { text: '证书颁发', included: false }
      ],
      recommended: false
    },
    {
      id: 'premium',
      name: '高级会员',
      price: '¥99',
      period: '每月',
      icon: <RocketOutlined />,
      color: '#722ed1',
      features: [
        { text: '访问基础课程', included: true },
        { text: '标准学习工具', included: true },
        { text: '社区支持', included: true },
        { text: '高级课程访问', included: true },
        { text: '课程下载 (每月20次)', included: true },
        { text: '专家指导', included: true },
        { text: '学习路径定制', included: true },
        { text: '证书颁发', included: false }
      ],
      recommended: true
    },
    {
      id: 'ultimate',
      name: '旗舰会员',
      price: '¥199',
      period: '每月',
      icon: <CrownOutlined />,
      color: '#fa8c16',
      features: [
        { text: '访问基础课程', included: true },
        { text: '标准学习工具', included: true },
        { text: '社区支持', included: true },
        { text: '高级课程访问', included: true },
        { text: '课程下载 (无限制)', included: true },
        { text: '专家指导', included: true },
        { text: '学习路径定制', included: true },
        { text: '证书颁发', included: true }
      ],
      recommended: false
    }
  ];

  // 年度计划数据（在月度基础上打8折）
  const yearlyPlans = membershipPlans.map(plan => ({
    ...plan,
    price: plan.id === 'free' ? '¥0' : `¥${Math.floor(parseInt(plan.price.substring(1)) * 12 * 0.8)}`,
    period: plan.id === 'free' ? '永久' : '每年',
    savePercent: plan.id === 'free' ? 0 : 20
  }));

  // 处理会员计划选择
  const handleSelectPlan = (planId, period) => {
    navigate(`/payment/${planId}?period=${period}`);
  };

  // 渲染会员计划卡片
  const renderPlanCard = (plan, period) => {
    const isCurrent = userMembership && userMembership.currentPlan === plan.id;
    
    return (
      <Col xs={24} sm={12} md={6} key={plan.id}>
        <Badge.Ribbon 
          text="推荐" 
          color="#f50" 
          style={{ display: plan.recommended ? 'block' : 'none' }}
        >
          <Card 
            className={`membership-plan-card ${isCurrent ? 'current-plan' : ''}`}
            actions={[
              <Button 
                type={plan.recommended ? 'primary' : 'default'}
                onClick={() => handleSelectPlan(plan.id, period)}
                disabled={isCurrent}
              >
                {isCurrent ? '当前计划' : '选择此计划'}
              </Button>
            ]}
          >
            <div className="plan-header" style={{ color: plan.color }}>
              {plan.icon}
              <Title level={3}>{plan.name}</Title>
            </div>
            
            <div className="plan-price">
              <Title level={2}>{plan.price}</Title>
              <Text type="secondary">{plan.period}</Text>
              {period === 'yearly' && plan.id !== 'free' && (
                <Tag color="#f50">节省 {plan.savePercent}%</Tag>
              )}
            </div>
            
            <Divider />
            
            <List
              itemLayout="horizontal"
              dataSource={plan.features}
              renderItem={item => (
                <List.Item>
                  {item.included ? 
                    <CheckCircleOutlined style={{ color: '#52c41a' }} /> : 
                    <CloseCircleOutlined style={{ color: '#f5222d' }} />}
                  <Text style={{ marginLeft: 8 }}>{item.text}</Text>
                </List.Item>
              )}
            />
          </Card>
        </Badge.Ribbon>
      </Col>
    );
  };

  if (loading) {
    return (
      <div className="membership-loading">
        <Spin size="large" />
        <Text>加载会员信息中...</Text>
      </div>
    );
  }

  return (
    <div className="membership-container">
      <div className="membership-header">
        <Title level={2}>会员计划</Title>
        <Paragraph>
          升级您的会员计划，解锁更多学习资源和功能，加速您的学习进程。
        </Paragraph>
      </div>
      
      {userMembership && userMembership.currentPlan !== 'free' && (
        <Card className="current-membership-card" bordered={false}>
          <Title level={4}>您当前的会员计划</Title>
          <div className="current-plan-info">
            <div>
              <Text strong>计划类型: </Text>
              <Tag color="blue">
                {membershipPlans.find(p => p.id === userMembership.currentPlan)?.name}
              </Tag>
            </div>
            <div>
              <Text strong>到期时间: </Text>
              <Text>{userMembership.expiryDate}</Text>
            </div>
          </div>
          
          <Divider />
          
          <Title level={5}>使用统计</Title>
          <Row gutter={[16, 16]}>
            <Col span={6}>
              <Card size="small">
                <Statistic 
                  title="已访问课程" 
                  value={userMembership.usageStats.coursesAccessed} 
                  suffix="门"
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small">
                <Statistic 
                  title="已完成课时" 
                  value={userMembership.usageStats.lessonsCompleted} 
                  suffix="节"
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small">
                <Statistic 
                  title="学习时长" 
                  value={userMembership.usageStats.studyHours} 
                  suffix="小时"
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small">
                <Statistic 
                  title="剩余下载次数" 
                  value={userMembership.usageStats.remainingDownloads} 
                  suffix="次"
                />
              </Card>
            </Col>
          </Row>
        </Card>
      )}
      
      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab}
        className="membership-tabs"
      >
        <TabPane tab="月度计划" key="1">
          <Row gutter={[16, 16]} className="membership-plans-row">
            {membershipPlans.map(plan => renderPlanCard(plan, 'monthly'))}
          </Row>
        </TabPane>
        <TabPane tab="年度计划 (优惠20%)" key="2">
          <Row gutter={[16, 16]} className="membership-plans-row">
            {yearlyPlans.map(plan => renderPlanCard(plan, 'yearly'))}
          </Row>
        </TabPane>
      </Tabs>
      
      <div className="membership-faq">
        <Title level={3}>常见问题</Title>
        <List
          itemLayout="vertical"
          dataSource={[
            {
              question: '如何选择适合我的会员计划？',
              answer: '根据您的学习需求和预算选择合适的计划。如果您只需要基础功能，免费计划就足够了。如果您想要更全面的学习体验，建议选择高级会员或旗舰会员。'
            },
            {
              question: '我可以随时更改我的会员计划吗？',
              answer: '是的，您可以随时升级您的会员计划，升级后将立即生效。如果您想降级计划，将在当前计划到期后生效。'
            },
            {
              question: '会员费用如何收取？',
              answer: '会员费用将按照您选择的周期（月度或年度）自动从您的支付方式中扣除。您可以随时在账户设置中管理您的支付方式和订阅。'
            },
            {
              question: '如何取消会员？',
              answer: '您可以在账户设置中取消会员订阅。取消后，您的会员权益将持续到当前计费周期结束。'
            }
          ]}
          renderItem={item => (
            <List.Item>
              <Title level={5}>{item.question}</Title>
              <Paragraph>{item.answer}</Paragraph>
            </List.Item>
          )}
        />
      </div>
    </div>
  );
};

// 添加一个简单的统计组件
const Statistic = ({ title, value, suffix }) => (
  <div className="statistic">
    <div className="statistic-title">{title}</div>
    <div className="statistic-content">
      <span className="statistic-value">{value}</span>
      {suffix && <span className="statistic-suffix">{suffix}</span>}
    </div>
  </div>
);

export default Membership;
