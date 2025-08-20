import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  Row, Col, Card, Typography, Button, Tabs, Avatar, 
  Form, Input, Upload, message, Divider, List, Tag, Progress
} from 'antd';
import { 
  UserOutlined, EditOutlined, UploadOutlined, 
  TrophyOutlined, BookOutlined, ClockCircleOutlined, 
  SettingOutlined, LockOutlined, BellOutlined
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

const Profile = () => {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  
  const [activeTab, setActiveTab] = useState('1');
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [studyStats, setStudyStats] = useState(null);
  const [learningHistory, setLearningHistory] = useState([]);
  const [form] = Form.useForm();

  // 模拟从API获取用户学习统计数据
  useEffect(() => {
    const fetchStudyStats = async () => {
      try {
        // 这里应该是实际的API调用
        // const response = await api.getUserStudyStats();
        // 模拟数据
        setTimeout(() => {
          const mockStats = {
            totalCoursesEnrolled: 8,
            coursesCompleted: 3,
            totalStudyHours: 42.5,
            averageScore: 85,
            streakDays: 12,
            languageLevels: [
              { language: '英语', level: '中级', progress: 65 },
              { language: '日语', level: '初级', progress: 30 },
              { language: '法语', level: '入门', progress: 15 }
            ],
            achievements: [
              { id: 1, name: '学习先锋', description: '连续学习10天', date: '2023-05-15', icon: '🏆' },
              { id: 2, name: '知识探索者', description: '完成5门课程', date: '2023-06-20', icon: '🔍' },
              { id: 3, name: '英语达人', description: '英语测试得分超过80分', date: '2023-07-10', icon: '🌟' }
            ]
          };
          
          setStudyStats(mockStats);
        }, 1000);
      } catch (error) {
        console.error('获取学习统计数据失败:', error);
        message.error('获取学习统计数据失败');
      }
    };

    const fetchLearningHistory = async () => {
      try {
        // 这里应该是实际的API调用
        // const response = await api.getLearningHistory();
        // 模拟数据
        setTimeout(() => {
          const mockHistory = [
            {
              id: 1,
              date: '2023-08-15',
              course: '商务英语精讲',
              lesson: '商务会议用语',
              duration: 45,
              progress: 100
            },
            {
              id: 2,
              date: '2023-08-14',
              course: '日语入门',
              lesson: '基础问候语',
              duration: 30,
              progress: 100
            },
            {
              id: 3,
              date: '2023-08-14',
              course: '商务英语精讲',
              lesson: '商务邮件写作',
              duration: 60,
              progress: 85
            },
            {
              id: 4,
              date: '2023-08-12',
              course: '法语入门',
              lesson: '发音基础',
              duration: 40,
              progress: 100
            },
            {
              id: 5,
              date: '2023-08-10',
              course: '商务英语精讲',
              lesson: '谈判技巧',
              duration: 50,
              progress: 75
            }
          ];
          
          setLearningHistory(mockHistory);
        }, 1000);
      } catch (error) {
        console.error('获取学习历史失败:', error);
        message.error('获取学习历史失败');
      }
    };

    fetchStudyStats();
    fetchLearningHistory();
  }, []);

  // 初始化表单数据
  useEffect(() => {
    if (user) {
      form.setFieldsValue({
        username: user.username,
        email: user.email,
        bio: user.bio || '',
        nativeLanguage: user.nativeLanguage || '',
        learningLanguages: user.learningLanguages || ''
      });
    }
  }, [user, form]);

  // 处理个人资料更新
  const handleProfileUpdate = async (values) => {
    setLoading(true);
    try {
      // 这里应该是实际的API调用
      // const response = await api.updateUserProfile(values);
      // 模拟更新
      setTimeout(() => {
        // 更新Redux状态
        // dispatch(updateUserProfile(values));
        
        setEditMode(false);
        setLoading(false);
        message.success('个人资料更新成功');
      }, 1000);
    } catch (error) {
      console.error('更新个人资料失败:', error);
      message.error('更新个人资料失败');
      setLoading(false);
    }
  };

  // 处理头像上传
  const handleAvatarUpload = (info) => {
    if (info.file.status === 'uploading') {
      return;
    }
    if (info.file.status === 'done') {
      message.success('头像上传成功');
      // 更新Redux状态
      // dispatch(updateUserAvatar(info.file.response.url));
    } else if (info.file.status === 'error') {
      message.error('头像上传失败');
    }
  };

  // 渲染个人资料标签页
  const renderProfileTab = () => {
    if (!user) return null;
    
    return (
      <div className="profile-info-container">
        <Card className="profile-card">
          <div className="profile-header">
            <div className="profile-avatar">
              <Avatar 
                size={100} 
                icon={<UserOutlined />} 
                src={user.avatar}
              />
              {editMode && (
                <Upload
                  name="avatar"
                  showUploadList={false}
                  action="/api/user/avatar"
                  onChange={handleAvatarUpload}
                >
                  <Button 
                    icon={<UploadOutlined />} 
                    className="avatar-upload-button"
                  >
                    更换头像
                  </Button>
                </Upload>
              )}
            </div>
            
            <div className="profile-title">
              <Title level={3}>{user.username}</Title>
              <Text type="secondary">{user.email}</Text>
              {!editMode && (
                <Button 
                  icon={<EditOutlined />} 
                  onClick={() => setEditMode(true)}
                  className="edit-profile-button"
                >
                  编辑资料
                </Button>
              )}
            </div>
          </div>
          
          {!editMode ? (
            <div className="profile-details">
              <div className="profile-section">
                <Title level={5}>个人简介</Title>
                <Paragraph>
                  {user.bio || '暂无个人简介'}
                </Paragraph>
              </div>
              
              <div className="profile-section">
                <Title level={5}>语言信息</Title>
                <div className="language-info">
                  <div>
                    <Text strong>母语：</Text>
                    <Text>{user.nativeLanguage || '未设置'}</Text>
                  </div>
                  <div>
                    <Text strong>学习语言：</Text>
                    <Text>{user.learningLanguages || '未设置'}</Text>
                  </div>
                </div>
              </div>
              
              <div className="profile-section">
                <Title level={5}>会员信息</Title>
                <div className="membership-info">
                  <div>
                    <Text strong>会员类型：</Text>
                    <Tag color="blue">{user.membershipType || '免费用户'}</Tag>
                  </div>
                  {user.membershipExpiry && (
                    <div>
                      <Text strong>到期时间：</Text>
                      <Text>{user.membershipExpiry}</Text>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="profile-edit-form">
              <Form
                form={form}
                layout="vertical"
                onFinish={handleProfileUpdate}
              >
                <Form.Item
                  name="username"
                  label="用户名"
                  rules={[{ required: true, message: '请输入用户名' }]}
                >
                  <Input placeholder="请输入用户名" />
                </Form.Item>
                
                <Form.Item
                  name="email"
                  label="邮箱"
                  rules={[{ required: true, message: '请输入邮箱' }]}
                >
                  <Input placeholder="请输入邮箱" disabled />
                </Form.Item>
                
                <Form.Item
                  name="bio"
                  label="个人简介"
                >
                  <Input.TextArea 
                    placeholder="请输入个人简介" 
                    rows={4} 
                  />
                </Form.Item>
                
                <Form.Item
                  name="nativeLanguage"
                  label="母语"
                >
                  <Input placeholder="请输入您的母语" />
                </Form.Item>
                
                <Form.Item
                  name="learningLanguages"
                  label="学习语言"
                >
                  <Input placeholder="请输入您正在学习的语言，多个语言用逗号分隔" />
                </Form.Item>
                
                <Form.Item>
                  <Button 
                    type="primary" 
                    htmlType="submit" 
                    loading={loading}
                  >
                    保存
                  </Button>
                  <Button 
                    onClick={() => setEditMode(false)} 
                    style={{ marginLeft: 8 }}
                  >
                    取消
                  </Button>
                </Form.Item>
              </Form>
            </div>
          )}
        </Card>
      </div>
    );
  };

  // 渲染学习统计标签页
  const renderStatsTab = () => {
    if (!studyStats) {
      return (
        <div className="loading-container">
          <Text>加载学习统计数据中...</Text>
        </div>
      );
    }
    
    return (
      <div className="stats-container">
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Card className="stat-card">
              <div className="stat-icon">
                <BookOutlined />
              </div>
              <div className="stat-content">
                <Text className="stat-title">已学课程</Text>
                <Title level={3}>{studyStats.totalCoursesEnrolled}</Title>
                <Text type="secondary">已完成 {studyStats.coursesCompleted} 门</Text>
              </div>
            </Card>
          </Col>
          
          <Col xs={24} sm={12} md={8} lg={6}>
            <Card className="stat-card">
              <div className="stat-icon">
                <ClockCircleOutlined />
              </div>
              <div className="stat-content">
                <Text className="stat-title">学习时长</Text>
                <Title level={3}>{studyStats.totalStudyHours}</Title>
                <Text type="secondary">小时</Text>
              </div>
            </Card>
          </Col>
          
          <Col xs={24} sm={12} md={8} lg={6}>
            <Card className="stat-card">
              <div className="stat-icon">
                <TrophyOutlined />
              </div>
              <div className="stat-content">
                <Text className="stat-title">平均得分</Text>
                <Title level={3}>{studyStats.averageScore}</Title>
                <Text type="secondary">分</Text>
              </div>
            </Card>
          </Col>
          
          <Col xs={24} sm={12} md={8} lg={6}>
            <Card className="stat-card">
              <div className="stat-icon">
                <FireOutlined />
              </div>
              <div className="stat-content">
                <Text className="stat-title">连续学习</Text>
                <Title level={3}>{studyStats.streakDays}</Title>
                <Text type="secondary">天</Text>
              </div>
            </Card>
          </Col>
        </Row>
        
        <Divider orientation="left">语言水平</Divider>
        
        <Card className="language-levels-card">
          {studyStats.languageLevels.map((lang, index) => (
            <div key={index} className="language-level-item">
              <div className="language-level-info">
                <Text strong>{lang.language}</Text>
                <Tag color="blue">{lang.level}</Tag>
              </div>
              <Progress percent={lang.progress} status="active" />
            </div>
          ))}
        </Card>
        
        <Divider orientation="left">成就</Divider>
        
        <Card className="achievements-card">
          <List
            grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 3, xl: 3, xxl: 3 }}
            dataSource={studyStats.achievements}
            renderItem={item => (
              <List.Item>
                <Card className="achievement-item">
                  <div className="achievement-icon">{item.icon}</div>
                  <Title level={5}>{item.name}</Title>
                  <Text type="secondary">{item.description}</Text>
                  <div className="achievement-date">
                    <Text type="secondary">获得于 {item.date}</Text>
                  </div>
                </Card>
              </List.Item>
            )}
          />
        </Card>
      </div>
    );
  };

  // 渲染学习历史标签页
  const renderHistoryTab = () => {
    if (learningHistory.length === 0) {
      return (
        <div className="empty-history">
          <Text>暂无学习记录</Text>
        </div>
      );
    }
    
    return (
      <div className="history-container">
        <List
          className="history-list"
          itemLayout="horizontal"
          dataSource={learningHistory}
          renderItem={item => (
            <List.Item>
              <Card className="history-item" style={{ width: '100%' }}>
                <div className="history-item-header">
                  <div>
                    <Title level={5}>{item.course}</Title>
                    <Text>{item.lesson}</Text>
                  </div>
                  <div className="history-item-date">
                    <Text type="secondary">{item.date}</Text>
                  </div>
                </div>
                
                <div className="history-item-details">
                  <div className="history-item-duration">
                    <ClockCircleOutlined />
                    <Text>{item.duration} 分钟</Text>
                  </div>
                  
                  <div className="history-item-progress">
                    <Text>完成度：</Text>
                    <Progress percent={item.progress} size="small" />
                  </div>
                </div>
              </Card>
            </List.Item>
          )}
        />
      </div>
    );
  };

  // 渲染设置标签页
  const renderSettingsTab = () => {
    return (
      <div className="settings-container">
        <Card className="settings-card">
          <List
            itemLayout="horizontal"
            dataSource={[
              {
                title: '账户安全',
                description: '修改密码、设置两步验证',
                icon: <LockOutlined />
              },
              {
                title: '通知设置',
                description: '设置邮件、应用内通知',
                icon: <BellOutlined />
              },
              {
                title: '学习偏好',
                description: '设置学习目标、提醒时间',
                icon: <SettingOutlined />
              }
            ]}
            renderItem={item => (
              <List.Item
                actions={[<Button>设置</Button>]}
              >
                <List.Item.Meta
                  avatar={<Avatar icon={item.icon} />}
                  title={item.title}
                  description={item.description}
                />
              </List.Item>
            )}
          />
        </Card>
      </div>
    );
  };

  return (
    <div className="profile-container">
      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab}
        className="profile-tabs"
      >
        <TabPane 
          tab={<span><UserOutlined />个人资料</span>} 
          key="1"
        >
          {renderProfileTab()}
        </TabPane>
        
        <TabPane 
          tab={<span><BookOutlined />学习统计</span>} 
          key="2"
        >
          {renderStatsTab()}
        </TabPane>
        
        <TabPane 
          tab={<span><ClockCircleOutlined />学习历史</span>} 
          key="3"
        >
          {renderHistoryTab()}
        </TabPane>
        
        <TabPane 
          tab={<span><SettingOutlined />设置</span>} 
          key="4"
        >
          {renderSettingsTab()}
        </TabPane>
      </Tabs>
    </div>
  );
};

// 添加一个火焰图标组件
const FireOutlined = () => (
  <span role="img" aria-label="fire" className="anticon">
    🔥
  </span>
);

export default Profile;