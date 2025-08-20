import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Layout, Menu, Typography, Button, Card, Progress, 
  Tabs, Spin, message, Drawer, List, Divider, Space, Modal,
  Input, Form, Rate, Radio
} from 'antd';
import { 
  MenuFoldOutlined, MenuUnfoldOutlined, BookOutlined, 
  CheckCircleOutlined, ClockCircleOutlined, LeftOutlined,
  RightOutlined, HomeOutlined, TranslationOutlined,
  SoundOutlined, QuestionCircleOutlined, StarOutlined,
  PlayCircleOutlined, PauseCircleOutlined, ReadOutlined
} from '@ant-design/icons';

const { Header, Sider, Content } = Layout;
const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

const StudySession = () => {
  const { courseId, mode } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState(null);
  const [collapsed, setCollapsed] = useState(false);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [allLessons, setAllLessons] = useState([]);
  const [progress, setProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showNoteDrawer, setShowNoteDrawer] = useState(false);
  const [notes, setNotes] = useState([]);
  const [noteForm] = Form.useForm();
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackForm] = Form.useForm();

  // 模拟从API获取课程和课程内容
  useEffect(() => {
    const fetchCourseContent = async () => {
      try {
        // 这里应该是实际的API调用
        // const response = await api.getCourseContent(courseId);
        // 模拟数据
        setTimeout(() => {
          const mockCourse = {
            id: parseInt(courseId),
            title: `课程 ${courseId}`,
            description: `这是课程 ${courseId} 的详细描述。本课程将带领学生深入了解相关知识，掌握核心技能，并通过实践项目巩固所学内容。`,
            mode: mode,
            chapters: Array.from({ length: 5 }, (_, i) => ({
              id: i + 1,
              title: `第 ${i + 1} 章: ${['基础概念', '核心原理', '实践应用', '高级技巧', '案例分析'][i]}`,
              lessons: Array.from({ length: 3 }, (_, j) => ({
                id: `${i + 1}-${j + 1}`,
                title: `课时 ${j + 1}: ${['介绍', '讲解', '演示'][j]}`,
                duration: `${Math.floor(Math.random() * 20) + 10} 分钟`,
                completed: false,
                content: {
                  text: `这是第 ${i + 1} 章第 ${j + 1} 课时的内容。这里包含了详细的学习材料、示例和解释。\n\n这部分内容会根据选择的学习模式以不同的方式呈现，包括文本、音频、互动问答或翻译对照等形式。\n\n在实际应用中，这里将包含丰富的教学内容，可能包括代码示例、图表、公式等专业内容。`,
                  translation: `This is the content for Chapter ${i + 1}, Lesson ${j + 1}. It contains detailed learning materials, examples, and explanations.\n\nThis content will be presented differently based on the selected learning mode, including text, audio, interactive Q&A, or translation.\n\nIn practical applications, this will include rich teaching content, possibly including code examples, charts, formulas, and other professional content.`,
                  questions: [
                    {
                      question: `关于第 ${i + 1} 章第 ${j + 1} 课时的问题 1?`,
                      options: ['选项A', '选项B', '选项C', '选项D'],
                      answer: 0
                    },
                    {
                      question: `关于第 ${i + 1} 章第 ${j + 1} 课时的问题 2?`,
                      options: ['选项A', '选项B', '选项C', '选项D'],
                      answer: 1
                    }
                  ]
                }
              }))
            }))
          };
          
          // 将所有课时平铺为一个数组，方便导航
          const allLessonsFlat = mockCourse.chapters.flatMap(chapter => 
            chapter.lessons.map(lesson => ({
              ...lesson,
              chapterId: chapter.id,
              chapterTitle: chapter.title
            }))
          );
          
          setCourse(mockCourse);
          setAllLessons(allLessonsFlat);
          setCurrentLesson(allLessonsFlat[0]);
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('获取课程内容失败:', error);
        message.error('获取课程内容失败');
        setLoading(false);
      }
    };

    fetchCourseContent();
  }, [courseId, mode]);

  // 更新进度
  useEffect(() => {
    if (allLessons.length > 0) {
      const completedCount = allLessons.filter(lesson => lesson.completed).length;
      const progressPercentage = (completedCount / allLessons.length) * 100;
      setProgress(progressPercentage);
    }
  }, [allLessons]);

  // 切换侧边栏
  const toggleSider = () => {
    setCollapsed(!collapsed);
  };

  // 选择课时
  const handleLessonSelect = (lessonId) => {
    const index = allLessons.findIndex(lesson => lesson.id === lessonId);
    if (index !== -1) {
      setCurrentLesson(allLessons[index]);
      setCurrentLessonIndex(index);
      setIsPlaying(false);
    }
  };

  // 标记完成
  const markLessonComplete = () => {
    const updatedLessons = [...allLessons];
    updatedLessons[currentLessonIndex].completed = true;
    setAllLessons(updatedLessons);
    message.success('课时已标记为完成');
  };

  // 下一课
  const goToNextLesson = () => {
    if (currentLessonIndex < allLessons.length - 1) {
      const nextIndex = currentLessonIndex + 1;
      setCurrentLesson(allLessons[nextIndex]);
      setCurrentLessonIndex(nextIndex);
      setIsPlaying(false);
    } else {
      message.info('已经是最后一课');
    }
  };

  // 上一课
  const goToPreviousLesson = () => {
    if (currentLessonIndex > 0) {
      const prevIndex = currentLessonIndex - 1;
      setCurrentLesson(allLessons[prevIndex]);
      setCurrentLessonIndex(prevIndex);
      setIsPlaying(false);
    } else {
      message.info('已经是第一课');
    }
  };

  // 返回课程详情
  const handleBackToCourse = () => {
    navigate(`/courses/${courseId}`);
  };

  // 播放/暂停音频（模拟）
  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
    message.info(isPlaying ? '已暂停' : '正在播放');
  };

  // 添加笔记
  const handleAddNote = () => {
    noteForm.validateFields().then(values => {
      const newNote = {
        id: Date.now(),
        lessonId: currentLesson.id,
        lessonTitle: currentLesson.title,
        content: values.note,
        timestamp: new Date().toLocaleString()
      };
      setNotes([...notes, newNote]);
      noteForm.resetFields();
      message.success('笔记已添加');
    });
  };

  // 提交反馈
  const handleSubmitFeedback = () => {
    feedbackForm.validateFields().then(values => {
      // 这里应该是实际的API调用
      // await api.submitFeedback(courseId, values);
      message.success('感谢您的反馈');
      setShowFeedbackModal(false);
      feedbackForm.resetFields();
    });
  };

  // 渲染基于学习模式的内容
  const renderModeContent = () => {
    if (!currentLesson) return null;
    
    switch (mode) {
      case 'reading':
        return (
          <div className="reading-mode-content">
            <Paragraph>{currentLesson.content.text}</Paragraph>
          </div>
        );
      case 'listening':
        return (
          <div className="listening-mode-content">
            <Card className="audio-player-card">
              <div className="audio-controls">
                <Button 
                  type="primary" 
                  shape="circle" 
                  icon={isPlaying ? <PauseCircleOutlined /> : <PlayCircleOutlined />} 
                  size="large"
                  onClick={togglePlayPause}
                />
                <div className="audio-progress">
                  <Progress percent={isPlaying ? 45 : 0} showInfo={false} />
                  <div className="audio-time">
                    <Text>00:00</Text>
                    <Text>{currentLesson.duration}</Text>
                  </div>
                </div>
              </div>
            </Card>
            <Paragraph style={{ marginTop: 16 }}>{currentLesson.content.text}</Paragraph>
          </div>
        );
      case 'interactive':
        return (
          <div className="interactive-mode-content">
            <Paragraph>{currentLesson.content.text}</Paragraph>
            <Divider orientation="left">互动问答</Divider>
            <List
              itemLayout="vertical"
              dataSource={currentLesson.content.questions}
              renderItem={(item, index) => (
                <Card style={{ marginBottom: 16 }}>
                  <Title level={5}>{item.question}</Title>
                  <Radio.Group>
                    {item.options.map((option, optIndex) => (
                      <Radio key={optIndex} value={optIndex}>{option}</Radio>
                    ))}
                  </Radio.Group>
                  <Button type="primary" size="small" style={{ marginTop: 16 }}>
                    提交答案
                  </Button>
                </Card>
              )}
            />
          </div>
        );
      case 'translation':
        return (
          <div className="translation-mode-content">
            <Tabs defaultActiveKey="1">
              <TabPane tab="中文" key="1">
                <Paragraph>{currentLesson.content.text}</Paragraph>
              </TabPane>
              <TabPane tab="英文" key="2">
                <Paragraph>{currentLesson.content.translation}</Paragraph>
              </TabPane>
              <TabPane tab="对照" key="3">
                <div className="translation-comparison">
                  <div className="translation-column">
                    <Title level={5}>中文</Title>
                    <Paragraph>{currentLesson.content.text}</Paragraph>
                  </div>
                  <Divider type="vertical" style={{ height: '100%' }} />
                  <div className="translation-column">
                    <Title level={5}>英文</Title>
                    <Paragraph>{currentLesson.content.translation}</Paragraph>
                  </div>
                </div>
              </TabPane>
            </Tabs>
          </div>
        );
      case 'comprehensive':
        return (
          <div className="comprehensive-mode-content">
            <Tabs defaultActiveKey="1">
              <TabPane 
                tab={<><ReadOutlined /> 阅读</>} 
                key="1"
              >
                <Paragraph>{currentLesson.content.text}</Paragraph>
              </TabPane>
              <TabPane 
                tab={<><SoundOutlined /> 听力</>} 
                key="2"
              >
                <Card className="audio-player-card">
                  <div className="audio-controls">
                    <Button 
                      type="primary" 
                      shape="circle" 
                      icon={isPlaying ? <PauseCircleOutlined /> : <PlayCircleOutlined />} 
                      size="large"
                      onClick={togglePlayPause}
                    />
                    <div className="audio-progress">
                      <Progress percent={isPlaying ? 45 : 0} showInfo={false} />
                      <div className="audio-time">
                        <Text>00:00</Text>
                        <Text>{currentLesson.duration}</Text>
                      </div>
                    </div>
                  </div>
                </Card>
              </TabPane>
              <TabPane 
                tab={<><QuestionCircleOutlined /> 互动</>} 
                key="3"
              >
                <List
                  itemLayout="vertical"
                  dataSource={currentLesson.content.questions}
                  renderItem={(item, index) => (
                    <Card style={{ marginBottom: 16 }}>
                      <Title level={5}>{item.question}</Title>
                      <Radio.Group>
                        {item.options.map((option, optIndex) => (
                          <Radio key={optIndex} value={optIndex}>{option}</Radio>
                        ))}
                      </Radio.Group>
                      <Button type="primary" size="small" style={{ marginTop: 16 }}>
                        提交答案
                      </Button>
                    </Card>
                  )}
                />
              </TabPane>
              <TabPane 
                tab={<><TranslationOutlined /> 翻译</>} 
                key="4"
              >
                <div className="translation-comparison">
                  <div className="translation-column">
                    <Title level={5}>中文</Title>
                    <Paragraph>{currentLesson.content.text}</Paragraph>
                  </div>
                  <Divider type="vertical" style={{ height: '100%' }} />
                  <div className="translation-column">
                    <Title level={5}>英文</Title>
                    <Paragraph>{currentLesson.content.translation}</Paragraph>
                  </div>
                </div>
              </TabPane>
            </Tabs>
          </div>
        );
      default:
        return (
          <div className="default-mode-content">
            <Paragraph>{currentLesson.content.text}</Paragraph>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="study-session-loading">
        <Spin size="large" />
        <Text>加载学习内容中...</Text>
      </div>
    );
  }

  return (
    <Layout className="study-session-layout">
      <Sider 
        trigger={null} 
        collapsible 
        collapsed={collapsed}
        width={300}
        className="study-session-sider"
      >
        <div className="study-session-sider-header">
          <Title level={4} ellipsis style={{ color: '#fff', margin: '16px' }}>
            {collapsed ? course.title.charAt(0) : course.title}
          </Title>
        </div>
        
        <div className="study-progress">
          <Progress 
            percent={progress} 
            status="active" 
            strokeColor={{ from: '#108ee9', to: '#87d068' }}
          />
          <Text style={{ color: '#fff' }}>
            {Math.round(progress)}% 完成
          </Text>
        </div>
        
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[currentLesson?.id]}
        >
          {course.chapters.map(chapter => (
            <Menu.SubMenu 
              key={`chapter-${chapter.id}`}
              title={
                <span>
                  <BookOutlined />
                  <span>{chapter.title}</span>
                </span>
              }
            >
              {chapter.lessons.map(lesson => {
                const lessonInAll = allLessons.find(l => l.id === lesson.id);
                return (
                  <Menu.Item 
                    key={lesson.id} 
                    onClick={() => handleLessonSelect(lesson.id)}
                    icon={lessonInAll?.completed ? <CheckCircleOutlined /> : <ClockCircleOutlined />}
                  >
                    {lesson.title}
                  </Menu.Item>
                );
              })}
            </Menu.SubMenu>
          ))}
        </Menu>
      </Sider>
      
      <Layout className="study-session-content-layout">
        <Header className="study-session-header">
          <div className="header-left">
            {React.createElement(
              collapsed ? MenuUnfoldOutlined : MenuFoldOutlined, 
              { className: 'trigger', onClick: toggleSider }
            )}
            <Button 
              icon={<HomeOutlined />} 
              onClick={handleBackToCourse}
            >
              返回课程
            </Button>
          </div>
          
          <div className="header-right">
            <Button onClick={() => setShowNoteDrawer(true)}>笔记</Button>
            <Button onClick={() => setShowFeedbackModal(true)}>反馈</Button>
          </div>
        </Header>
        
        <Content className="study-session-content">
          {currentLesson && (
            <>
              <div className="lesson-header">
                <div className="lesson-title">
                  <Title level={3}>{currentLesson.title}</Title>
                  <Text type="secondary">
                    {currentLesson.chapterTitle} | 时长: {currentLesson.duration}
                  </Text>
                </div>
                
                <div className="lesson-actions">
                  <Space>
                    <Button 
                      icon={<LeftOutlined />} 
                      onClick={goToPreviousLesson}
                      disabled={currentLessonIndex === 0}
                    >
                      上一课
                    </Button>
                    <Button 
                      type="primary" 
                      onClick={markLessonComplete}
                      disabled={currentLesson.completed}
                    >
                      标记完成
                    </Button>
                    <Button 
                      icon={<RightOutlined />} 
                      onClick={goToNextLesson}
                      disabled={currentLessonIndex === allLessons.length - 1}
                    >
                      下一课
                    </Button>
                  </Space>
                </div>
              </div>
              
              <Card className="lesson-content-card">
                {renderModeContent()}
              </Card>
            </>
          )}
        </Content>
      </Layout>
      
      {/* 笔记抽屉 */}
      <Drawer
        title="学习笔记"
        placement="right"
        width={400}
        onClose={() => setShowNoteDrawer(false)}
        visible={showNoteDrawer}
      >
        <Form form={noteForm} layout="vertical" onFinish={handleAddNote}>
          <Form.Item
            name="note"
            label="添加笔记"
            rules={[{ required: true, message: '请输入笔记内容' }]}
          >
            <Input.TextArea rows={4} placeholder="在这里记录你的想法和重点..." />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              保存笔记
            </Button>
          </Form.Item>
        </Form>
        
        <Divider orientation="left">我的笔记</Divider>
        
        {notes.length > 0 ? (
          <List
            itemLayout="vertical"
            dataSource={notes}
            renderItem={note => (
              <Card style={{ marginBottom: 16 }}>
                <div className="note-header">
                  <Text strong>{note.lessonTitle}</Text>
                  <Text type="secondary">{note.timestamp}</Text>
                </div>
                <Paragraph>{note.content}</Paragraph>
              </Card>
            )}
          />
        ) : (
          <Text type="secondary">还没有添加笔记</Text>
        )}
      </Drawer>
      
      {/* 反馈模态框 */}
      <Modal
        title="课程反馈"
        visible={showFeedbackModal}
        onCancel={() => setShowFeedbackModal(false)}
        footer={[
          <Button key="cancel" onClick={() => setShowFeedbackModal(false)}>
            取消
          </Button>,
          <Button key="submit" type="primary" onClick={handleSubmitFeedback}>
            提交反馈
          </Button>,
        ]}
      >
        <Form form={feedbackForm} layout="vertical">
          <Form.Item
            name="rating"
            label="课程评分"
            rules={[{ required: true, message: '请给课程评分' }]}
          >
            <Rate />
          </Form.Item>
          <Form.Item
            name="feedback"
            label="反馈内容"
            rules={[{ required: true, message: '请输入反馈内容' }]}
          >
            <Input.TextArea rows={4} placeholder="请分享您对课程的想法和建议..." />
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
};

export default StudySession;