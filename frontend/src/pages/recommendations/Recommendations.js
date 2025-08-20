import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Row, Col, Card, Typography, Button, Tabs, Rate, 
  Tag, Spin, Empty, Divider, List, Avatar
} from 'antd';
import { 
  FireOutlined, RiseOutlined, StarOutlined, 
  ClockCircleOutlined, UserOutlined, BookOutlined
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

const Recommendations = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('1');
  const [recommendations, setRecommendations] = useState({
    personalized: [],
    popular: [],
    newCourses: [],
    basedOnHistory: []
  });

  // 模拟从API获取推荐课程
  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        // 这里应该是实际的API调用
        // const response = await api.getRecommendations();
        // 模拟数据
        setTimeout(() => {
          const mockRecommendations = {
            personalized: [
              {
                id: 1,
                title: '商务英语进阶：谈判与演讲',
                description: '提升您的商务英语谈判和演讲技巧，掌握专业术语和表达方式。',
                level: '中级',
                duration: '10小时',
                rating: 4.8,
                reviews: 245,
                instructor: '李明',
                tags: ['商务英语', '谈判', '演讲'],
                matchScore: 95,
                image: 'https://example.com/course1.jpg'
              },
              {
                id: 2,
                title: '日语N3备考指南',
                description: '系统性地准备日语N3考试，包含词汇、语法、听力和阅读全方位训练。',
                level: '中级',
                duration: '15小时',
                rating: 4.7,
                reviews: 189,
                instructor: '山本真',
                tags: ['日语', 'N3', '考试'],
                matchScore: 92,
                image: 'https://example.com/course2.jpg'
              },
              {
                id: 3,
                title: '法语日常会话',
                description: '学习法语日常生活中最常用的表达和会话，快速提升口语能力。',
                level: '初级',
                duration: '8小时',
                rating: 4.6,
                reviews: 156,
                instructor: 'Sophie Martin',
                tags: ['法语', '会话', '日常'],
                matchScore: 88,
                image: 'https://example.com/course3.jpg'
              },
              {
                id: 4,
                title: '英语口语纠音课程',
                description: '针对中国学生常见的英语发音问题，提供专业的纠音指导。',
                level: '初级到中级',
                duration: '6小时',
                rating: 4.9,
                reviews: 312,
                instructor: 'John Smith',
                tags: ['英语', '发音', '口语'],
                matchScore: 85,
                image: 'https://example.com/course4.jpg'
              }
            ],
            popular: [
              {
                id: 5,
                title: '英语流利说：21天突破口语障碍',
                description: '通过科学的方法和大量的实践，21天内显著提升英语口语流利度。',
                level: '初级到高级',
                duration: '12小时',
                rating: 4.9,
                reviews: 1245,
                instructor: '张伟',
                tags: ['英语', '口语', '速成'],
                students: 15680,
                image: 'https://example.com/course5.jpg'
              },
              {
                id: 6,
                title: '商务日语精讲',
                description: '专为商务场景设计的日语课程，涵盖会议、谈判、邮件等实用内容。',
                level: '中级到高级',
                duration: '18小时',
                rating: 4.8,
                reviews: 876,
                instructor: '佐藤健',
                tags: ['日语', '商务', '职场'],
                students: 9870,
                image: 'https://example.com/course6.jpg'
              },
              {
                id: 7,
                title: '韩语入门：发音与基础会话',
                description: '从零开始学习韩语，掌握发音规则和基础日常会话。',
                level: '入门',
                duration: '10小时',
                rating: 4.7,
                reviews: 923,
                instructor: '金智妍',
                tags: ['韩语', '入门', '发音'],
                students: 12450,
                image: 'https://example.com/course7.jpg'
              },
              {
                id: 8,
                title: '雅思写作7分突破',
                description: '针对雅思写作考试的高分策略和技巧，包含大量真题分析和模板。',
                level: '中级到高级',
                duration: '15小时',
                rating: 4.8,
                reviews: 1056,
                instructor: 'Emma Wilson',
                tags: ['雅思', '写作', '考试'],
                students: 18790,
                image: 'https://example.com/course8.jpg'
              }
            ],
            newCourses: [
              {
                id: 9,
                title: '西班牙语旅游会话',
                description: '为旅行者设计的西班牙语课程，学习旅游中最常用的表达和会话。',
                level: '初级',
                duration: '6小时',
                rating: 4.5,
                reviews: 78,
                instructor: 'Carlos Rodriguez',
                tags: ['西班牙语', '旅游', '会话'],
                releaseDate: '2023-08-01',
                image: 'https://example.com/course9.jpg'
              },
              {
                id: 10,
                title: '德语语法精讲',
                description: '系统讲解德语语法体系，从基础到高级，配合大量练习。',
                level: '初级到高级',
                duration: '20小时',
                rating: 4.6,
                reviews: 45,
                instructor: 'Hans Mueller',
                tags: ['德语', '语法', '系统学习'],
                releaseDate: '2023-07-25',
                image: 'https://example.com/course10.jpg'
              },
              {
                id: 11,
                title: '意大利语美食词汇与表达',
                description: '学习与意大利美食相关的词汇和表达，提升文化理解和语言能力。',
                level: '初级到中级',
                duration: '8小时',
                rating: 4.7,
                reviews: 36,
                instructor: 'Maria Rossi',
                tags: ['意大利语', '美食', '文化'],
                releaseDate: '2023-07-15',
                image: 'https://example.com/course11.jpg'
              },
              {
                id: 12,
                title: '法语电影赏析与学习',
                description: '通过经典法语电影学习地道表达和文化背景，提升听力和理解能力。',
                level: '中级到高级',
                duration: '12小时',
                rating: 4.8,
                reviews: 28,
                instructor: 'Pierre Dubois',
                tags: ['法语', '电影', '文化'],
                releaseDate: '2023-07-10',
                image: 'https://example.com/course12.jpg'
              }
            ],
            basedOnHistory: [
              {
                id: 13,
                title: '商务英语邮件写作',
                description: '学习如何撰写专业的商务英语邮件，掌握常用格式和表达。',
                level: '中级',
                duration: '5小时',
                rating: 4.7,
                reviews: 215,
                instructor: '王丽',
                tags: ['商务英语', '写作', '邮件'],
                similarity: '基于您完成的「商务英语精讲」课程',
                image: 'https://example.com/course13.jpg'
              },
              {
                id: 14,
                title: '日语N2词汇强化',
                description: '系统性地学习和记忆日语N2考试中的核心词汇。',
                level: '中级到高级',
                duration: '10小时',
                rating: 4.6,
                reviews: 168,
                instructor: '田中宏',
                tags: ['日语', 'N2', '词汇'],
                similarity: '基于您正在学习的「日语入门」课程',
                image: 'https://example.com/course14.jpg'
              },
              {
                id: 15,
                title: '法语语法进阶',
                description: '深入学习法语中级和高级语法，提升写作和表达准确性。',
                level: '中级到高级',
                duration: '15小时',
                rating: 4.8,
                reviews: 132,
                instructor: 'Claire Dupont',
                tags: ['法语', '语法', '进阶'],
                similarity: '基于您浏览过的「法语入门」课程',
                image: 'https://example.com/course15.jpg'
              },
              {
                id: 16,
                title: '英语演讲与辩论技巧',
                description: '学习英语演讲和辩论的核心技巧，提升公众表达能力。',
                level: '中级到高级',
                duration: '12小时',
                rating: 4.9,
                reviews: 245,
                instructor: 'Michael Brown',
                tags: ['英语', '演讲', '辩论'],
                similarity: '基于您完成的「英语口语纠音课程」',
                image: 'https://example.com/course16.jpg'
              }
            ]
          };
          
          setRecommendations(mockRecommendations);
          setLoading(false);
        }, 1500);
      } catch (error) {
        console.error('获取推荐课程失败:', error);
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, []);

  // 处理课程点击
  const handleCourseClick = (courseId) => {
    navigate(`/courses/${courseId}`);
  };

  // 渲染个性化推荐标签页
  const renderPersonalizedTab = () => {
    const { personalized } = recommendations;
    
    if (personalized.length === 0 && !loading) {
      return (
        <Empty 
          description="暂无个性化推荐" 
          image={Empty.PRESENTED_IMAGE_SIMPLE} 
        />
      );
    }
    
    return (
      <div className="personalized-recommendations">
        <Paragraph className="recommendation-intro">
          根据您的学习历史、偏好和目标，我们为您精选了以下课程：
        </Paragraph>
        
        <Row gutter={[16, 16]}>
          {personalized.map(course => (
            <Col xs={24} sm={12} md={8} lg={6} key={course.id}>
              <Card 
                hoverable
                cover={<div className="course-image-placeholder" />}
                onClick={() => handleCourseClick(course.id)}
                className="recommendation-card"
              >
                <div className="match-score">
                  <Tag color="#f50">
                    <FireOutlined /> 匹配度 {course.matchScore}%
                  </Tag>
                </div>
                
                <Title level={4}>{course.title}</Title>
                
                <Paragraph ellipsis={{ rows: 2 }} className="course-description">
                  {course.description}
                </Paragraph>
                
                <div className="course-meta">
                  <div>
                    <Tag color="blue">{course.level}</Tag>
                    <Tag><ClockCircleOutlined /> {course.duration}</Tag>
                  </div>
                  
                  <div className="course-rating">
                    <Rate disabled defaultValue={course.rating} allowHalf />
                    <Text type="secondary">({course.reviews})</Text>
                  </div>
                </div>
                
                <div className="course-tags">
                  {course.tags.map((tag, index) => (
                    <Tag key={index}>{tag}</Tag>
                  ))}
                </div>
                
                <div className="course-instructor">
                  <Avatar icon={<UserOutlined />} />
                  <Text>{course.instructor}</Text>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </div>
    );
  };

  // 渲染热门课程标签页
  const renderPopularTab = () => {
    const { popular } = recommendations;
    
    if (popular.length === 0 && !loading) {
      return (
        <Empty 
          description="暂无热门课程" 
          image={Empty.PRESENTED_IMAGE_SIMPLE} 
        />
      );
    }
    
    return (
      <div className="popular-courses">
        <Paragraph className="recommendation-intro">
          这些是我们平台上最受欢迎的课程，已有成千上万的学员从中受益：
        </Paragraph>
        
        <List
          grid={{ gutter: 16, xs: 1, sm: 1, md: 2, lg: 2, xl: 2, xxl: 2 }}
          dataSource={popular}
          renderItem={course => (
            <List.Item>
              <Card 
                hoverable
                className="popular-course-card"
                onClick={() => handleCourseClick(course.id)}
              >
                <div className="popular-course-content">
                  <div className="course-image-container">
                    <div className="course-image-placeholder" />
                    <div className="students-count">
                      <UserOutlined /> {course.students}+ 学员
                    </div>
                  </div>
                  
                  <div className="course-details">
                    <Title level={4}>{course.title}</Title>
                    
                    <Paragraph ellipsis={{ rows: 2 }} className="course-description">
                      {course.description}
                    </Paragraph>
                    
                    <div className="course-meta">
                      <div>
                        <Tag color="blue">{course.level}</Tag>
                        <Tag><ClockCircleOutlined /> {course.duration}</Tag>
                      </div>
                      
                      <div className="course-rating">
                        <Rate disabled defaultValue={course.rating} allowHalf />
                        <Text type="secondary">({course.reviews})</Text>
                      </div>
                    </div>
                    
                    <div className="course-tags">
                      {course.tags.map((tag, index) => (
                        <Tag key={index}>{tag}</Tag>
                      ))}
                    </div>
                    
                    <div className="course-instructor">
                      <Avatar icon={<UserOutlined />} />
                      <Text>{course.instructor}</Text>
                    </div>
                  </div>
                </div>
              </Card>
            </List.Item>
          )}
        />
      </div>
    );
  };

  // 渲染新课程标签页
  const renderNewCoursesTab = () => {
    const { newCourses } = recommendations;
    
    if (newCourses.length === 0 && !loading) {
      return (
        <Empty 
          description="暂无新课程" 
          image={Empty.PRESENTED_IMAGE_SIMPLE} 
        />
      );
    }
    
    return (
      <div className="new-courses">
        <Paragraph className="recommendation-intro">
          探索我们最新上线的课程，抢先体验最新的学习内容：
        </Paragraph>
        
        <Row gutter={[16, 16]}>
          {newCourses.map(course => (
            <Col xs={24} sm={12} md={8} lg={6} key={course.id}>
              <Card 
                hoverable
                cover={<div className="course-image-placeholder" />}
                onClick={() => handleCourseClick(course.id)}
                className="new-course-card"
              >
                <div className="new-tag">
                  <Tag color="#52c41a">新课程</Tag>
                  <Text type="secondary">上线时间: {course.releaseDate}</Text>
                </div>
                
                <Title level={4}>{course.title}</Title>
                
                <Paragraph ellipsis={{ rows: 2 }} className="course-description">
                  {course.description}
                </Paragraph>
                
                <div className="course-meta">
                  <div>
                    <Tag color="blue">{course.level}</Tag>
                    <Tag><ClockCircleOutlined /> {course.duration}</Tag>
                  </div>
                  
                  <div className="course-rating">
                    <Rate disabled defaultValue={course.rating} allowHalf />
                    <Text type="secondary">({course.reviews})</Text>
                  </div>
                </div>
                
                <div className="course-tags">
                  {course.tags.map((tag, index) => (
                    <Tag key={index}>{tag}</Tag>
                  ))}
                </div>
                
                <div className="course-instructor">
                  <Avatar icon={<UserOutlined />} />
                  <Text>{course.instructor}</Text>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </div>
    );
  };

  // 渲染基于历史的推荐标签页
  const renderHistoryBasedTab = () => {
    const { basedOnHistory } = recommendations;
    
    if (basedOnHistory.length === 0 && !loading) {
      return (
        <Empty 
          description="暂无基于历史的推荐" 
          image={Empty.PRESENTED_IMAGE_SIMPLE} 
        />
      );
    }
    
    return (
      <div className="history-based-recommendations">
        <Paragraph className="recommendation-intro">
          根据您的学习历史，我们认为您可能对以下课程感兴趣：
        </Paragraph>
        
        <List
          itemLayout="vertical"
          size="large"
          dataSource={basedOnHistory}
          renderItem={course => (
            <List.Item
              key={course.id}
              onClick={() => handleCourseClick(course.id)}
              className="history-based-item"
            >
              <Card hoverable className="history-based-card">
                <div className="history-based-content">
                  <div className="course-image-container">
                    <div className="course-image-placeholder" />
                  </div>
                  
                  <div className="course-details">
                    <Title level={4}>{course.title}</Title>
                    
                    <div className="similarity-tag">
                      <Tag icon={<BookOutlined />} color="purple">
                        {course.similarity}
                      </Tag>
                    </div>
                    
                    <Paragraph ellipsis={{ rows: 2 }} className="course-description">
                      {course.description}
                    </Paragraph>
                    
                    <div className="course-meta">
                      <div>
                        <Tag color="blue">{course.level}</Tag>
                        <Tag><ClockCircleOutlined /> {course.duration}</Tag>
                      </div>
                      
                      <div className="course-rating">
                        <Rate disabled defaultValue={course.rating} allowHalf />
                        <Text type="secondary">({course.reviews})</Text>
                      </div>
                    </div>
                    
                    <div className="course-tags">
                      {course.tags.map((tag, index) => (
                        <Tag key={index}>{tag}</Tag>
                      ))}
                    </div>
                    
                    <div className="course-instructor">
                      <Avatar icon={<UserOutlined />} />
                      <Text>{course.instructor}</Text>
                    </div>
                  </div>
                </div>
              </Card>
            </List.Item>
          )}
        />
      </div>
    );
  };

  if (loading) {
    return (
      <div className="recommendations-loading">
        <Spin size="large" />
        <Text>加载推荐中...</Text>
      </div>
    );
  }

  return (
    <div className="recommendations-container">
      <div className="recommendations-header">
        <Title level={2}>为您推荐</Title>
        <Paragraph>
          探索为您量身定制的语言学习课程，提升您的语言能力。
        </Paragraph>
      </div>
      
      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab}
        className="recommendations-tabs"
      >
        <TabPane 
          tab={<span><FireOutlined />个性化推荐</span>} 
          key="1"
        >
          {renderPersonalizedTab()}
        </TabPane>
        
        <TabPane 
          tab={<span><RiseOutlined />热门课程</span>} 
          key="2"
        >
          {renderPopularTab()}
        </TabPane>
        
        <TabPane 
          tab={<span><StarOutlined />新课程</span>} 
          key="3"
        >
          {renderNewCoursesTab()}
        </TabPane>
        
        <TabPane 
          tab={<span><BookOutlined />基于历史</span>} 
          key="4"
        >
          {renderHistoryBasedTab()}
        </TabPane>
      </Tabs>
    </div>
  );
};

export default Recommendations;