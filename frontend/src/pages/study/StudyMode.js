import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Card, Typography, Radio, Button, Space, Divider, 
  Row, Col, Spin, message, Steps 
} from 'antd';
import { 
  ReadOutlined, SoundOutlined, EditOutlined, 
  TranslationOutlined, RocketOutlined, ArrowLeftOutlined 
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { Step } = Steps;

const StudyMode = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState(null);
  const [selectedMode, setSelectedMode] = useState(null);

  // 模拟从API获取课程信息
  useEffect(() => {
    const fetchCourseInfo = async () => {
      try {
        // 这里应该是实际的API调用
        // const response = await api.getCourseInfo(courseId);
        // 模拟数据
        setTimeout(() => {
          const mockCourse = {
            id: parseInt(courseId),
            title: `课程 ${courseId}`,
            description: `这是课程 ${courseId} 的学习模式选择页面。请选择适合您的学习方式，开始您的学习之旅。`,
            image: `https://via.placeholder.com/800x400?text=Course+${courseId}`,
          };
          
          setCourse(mockCourse);
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('获取课程信息失败:', error);
        message.error('获取课程信息失败');
        setLoading(false);
      }
    };

    fetchCourseInfo();
  }, [courseId]);

  // 学习模式选项
  const studyModes = [
    {
      key: 'reading',
      title: '阅读模式',
      icon: <ReadOutlined />,
      description: '通过阅读文本内容学习，适合喜欢自主阅读的学习者。',
      benefits: ['可以按照自己的节奏学习', '随时回顾和跳转内容', '适合文字学习型学生'],
    },
    {
      key: 'listening',
      title: '听力模式',
      icon: <SoundOutlined />,
      description: '通过听取语音内容学习，适合听觉学习者和多任务处理者。',
      benefits: ['解放双手和眼睛', '可以在行走、通勤时学习', '适合听觉学习型学生'],
    },
    {
      key: 'interactive',
      title: '互动模式',
      icon: <EditOutlined />,
      description: '通过问答和练习互动学习，适合喜欢边学边练的学习者。',
      benefits: ['即时反馈和指导', '通过实践巩固知识', '提高学习参与度和记忆效果'],
    },
    {
      key: 'translation',
      title: '翻译模式',
      icon: <TranslationOutlined />,
      description: '通过中英文对照学习，适合想同时提高语言能力的学习者。',
      benefits: ['同时学习专业知识和语言', '提高英语阅读和理解能力', '扩展专业词汇量'],
    },
    {
      key: 'comprehensive',
      title: '综合模式',
      icon: <RocketOutlined />,
      description: '结合多种学习方式，提供全面的学习体验。',
      benefits: ['结合多种学习方法的优点', '全方位提升学习效果', '适应不同学习场景的需求'],
    },
  ];

  // 处理模式选择
  const handleModeSelect = (mode) => {
    setSelectedMode(mode);
  };

  // 开始学习
  const handleStartLearning = () => {
    if (selectedMode) {
      navigate(`/study/${courseId}/${selectedMode}`);
    } else {
      message.warning('请先选择一种学习模式');
    }
  };

  // 返回课程详情
  const handleBackToCourse = () => {
    navigate(`/courses/${courseId}`);
  };

  if (loading) {
    return (
      <div className="study-mode-loading">
        <Spin size="large" />
        <Text>加载中...</Text>
      </div>
    );
  }

  return (
    <div className="study-mode-container">
      <Button 
        icon={<ArrowLeftOutlined />} 
        onClick={handleBackToCourse}
        style={{ marginBottom: 16 }}
      >
        返回课程详情
      </Button>

      <Card className="study-mode-header-card">
        <Title level={2}>选择学习模式</Title>
        <Paragraph>
          为了提供最佳的学习体验，我们提供了多种学习模式。请选择最适合您的学习方式。
        </Paragraph>
        <Paragraph>
          <Text strong>课程: {course.title}</Text>
        </Paragraph>
      </Card>

      <div className="study-mode-selection">
        <Steps current={-1} progressDot direction="vertical">
          {studyModes.map((mode) => (
            <Step 
              key={mode.key}
              title={
                <Radio.Button 
                  value={mode.key}
                  checked={selectedMode === mode.key}
                  onClick={() => handleModeSelect(mode.key)}
                  className={`mode-radio ${selectedMode === mode.key ? 'selected' : ''}`}
                >
                  <Space>
                    {mode.icon}
                    <Text strong>{mode.title}</Text>
                  </Space>
                </Radio.Button>
              }
              description={
                <Card 
                  className={`mode-card ${selectedMode === mode.key ? 'selected' : ''}`}
                  onClick={() => handleModeSelect(mode.key)}
                >
                  <Paragraph>{mode.description}</Paragraph>
                  <Divider orientation="left">优势</Divider>
                  <ul>
                    {mode.benefits.map((benefit, index) => (
                      <li key={index}>{benefit}</li>
                    ))}
                  </ul>
                </Card>
              }
            />
          ))}
        </Steps>
      </div>

      <Row justify="center" style={{ marginTop: 32 }}>
        <Col>
          <Button 
            type="primary" 
            size="large"
            onClick={handleStartLearning}
            disabled={!selectedMode}
          >
            开始学习
          </Button>
        </Col>
      </Row>
    </div>
  );
};

export default StudyMode;