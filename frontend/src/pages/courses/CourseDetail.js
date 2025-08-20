import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Row, Col, Typography, Button, Tabs, Card, Tag, 
  Divider, List, Avatar, Rate, Progress, Spin, message 
} from 'antd';
import { 
  ClockCircleOutlined, BookOutlined, UserOutlined, 
  StarOutlined, PlayCircleOutlined, CheckCircleOutlined,
  ArrowLeftOutlined
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

const CourseDetail = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState(null);

  // 模拟从API获取课程详情
  useEffect(() => {
    const fetchCourseDetail = async () => {
      try {
        // 这里应该是实际的API调用
        // const response = await api.getCourseDetail(courseId);
        // 模拟数据
        setTimeout(() => {
          const mockCourse = {
            id: parseInt(courseId),
            title: `课程 ${courseId}`,
            description: `这是课程 ${courseId} 的详细描述。本课程将带领学生深入了解相关知识，掌握核心技能，并通过实践项目巩固所学内容。`,
            level: parseInt(courseId) % 3 === 0 ? '初级' : parseInt(courseId) % 3 === 1 ? '中级' : '高级',
            duration: `${Math.floor(Math.random() * 10) + 1} 小时`,
            lessons: Math.floor(Math.random() * 20) + 5,
            rating: (Math.random() * 2 + 3).toFixed(1),
            students: Math.floor(Math.random() * 1000) + 100,
            image: `https://via.placeholder.com/800x400?text=Course+${courseId}`,
            instructor: {
              name: '张教授',
              avatar: 'https://via.placeholder.com/100x100',
              bio: '资深教育专家，拥有10年教学经验',
              courses: 15
            },
            syllabus: Array.from({ length: 8 }, (_, i) => ({
              id: i + 1,
              title: `第 ${i + 1} 章: ${['基础概念', '核心原理', '实践应用', '高级技巧', '案例分析', '综合练习', '拓展知识', '总结回顾'][i]}`,
              lessons: Array.from({ length: Math.floor(Math.random() * 3) + 2 }, (_, j) => ({
                id: `${i + 1}-${j + 1}`,
                title: `课时 ${j + 1}: ${['介绍', '讲解', '演示', '练习', '讨论'][j % 5]}`,
                duration: `${Math.floor(Math.random() * 30) + 10} 分钟`,
                completed: Math.random() > 0.5
              }))
            })),
            reviews: Array.from({ length: 5 }, (_, i) => ({
              id: i + 1,
              user: `用户${i + 1}`,
              avatar: `https://via.placeholder.com/50x50?text=U${i + 1}`,
              rating: Math.floor(Math.random() * 3) + 3,
              comment: `这是一门很${['棒', '好', '实用', '有价值', '推荐'][i]}的课程，我学到了很多知识。`,
              date: `2023-${Math.floor(Math.random() * 12) + 1}-${Math.floor(Math.random() * 28) + 1}`
            }))
          };
          
          setCourse(mockCourse);
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('获取课程详情失败:', error);
        message.error('获取课程详情失败');
        setLoading(false);
      }
    };

    fetchCourseDetail();
  }, [courseId]);

  // 处理开始学习按钮点击
  const handleStartLearning = () => {
    navigate(`/study/${courseId}/mode`);
  };

  // 返回课程列表
  const handleBackToCourses = () => {
    navigate('/courses');
  };

  if (loading) {
    return (
      <div className="course-detail-loading">
        <Spin size="large" />
        <Text>加载课程详情中...</Text>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="course-detail-error">
        <Title level={3}>未找到课程</Title>
        <Button type="primary" onClick={handleBackToCourses}>
          返回课程列表
        </Button>
      </div>
    );
  }

  return (
    <div className="course-detail-container">
      <Button 
        icon={<ArrowLeftOutlined />} 
        onClick={handleBackToCourses}
        style={{ marginBottom: 16 }}
      >
        返回课程列表
      </Button>
      
      <div className="course-detail-header">
        <Row gutter={[24, 24]}>
          <Col xs={24} md={16}>
            <img 
              src={course.image} 
              alt={course.title} 
              className="course-detail-image" 
            />
          </Col>
          <Col xs={24} md={8}>
            <Card className="course-detail-info-card">
              <Title level={3}>{course.title}</Title>
              <Tag color="blue">{course.level}</Tag>
              
              <div className="course-detail-stats">
                <div className="stat-item">
                  <ClockCircleOutlined />
                  <Text>{course.duration}</Text>
                </div>
                <div className="stat-item">
                  <BookOutlined />
                  <Text>{course.lessons} 课时</Text>
                </div>
                <div className="stat-item">
                  <UserOutlined />
                  <Text>{course.students} 学生</Text>
                </div>
                <div className="stat-item">
                  <StarOutlined />
                  <Text>{course.rating} 评分</Text>
                </div>
              </div>
              
              <Button 
                type="primary" 
                icon={<PlayCircleOutlined />} 
                size="large" 
                block
                onClick={handleStartLearning}
              >
                开始学习
              </Button>
            </Card>
          </Col>
        </Row>
      </div>
      
      <Tabs defaultActiveKey="1" className="course-detail-tabs">
        <TabPane tab="课程介绍" key="1">
          <Title level={4}>课程简介</Title>
          <Paragraph>{course.description}</Paragraph>
          
          <Title level={4}>你将学到什么</Title>
          <List
            dataSource={[
              '掌握核心概念和原理',
              '学习实用技能和方法',
              '通过实践项目巩固知识',
              '解决实际问题的能力',
              '获得行业认可的技能证书'
            ]}
            renderItem={item => (
              <List.Item>
                <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                {item}
              </List.Item>
            )}
          />
          
          <Title level={4}>讲师信息</Title>
          <Card>
            <Card.Meta
              avatar={<Avatar src={course.instructor.avatar} size={64} />}
              title={course.instructor.name}
              description={
                <>
                  <Paragraph>{course.instructor.bio}</Paragraph>
                  <Text>已发布 {course.instructor.courses} 门课程</Text>
                </>
              }
            />
          </Card>
        </TabPane>
        
        <TabPane tab="课程大纲" key="2">
          <List
            dataSource={course.syllabus}
            renderItem={chapter => (
              <List.Item>
                <List.Item.Meta
                  title={chapter.title}
                  description={
                    <List
                      dataSource={chapter.lessons}
                      renderItem={lesson => (
                        <List.Item>
                          <List.Item.Meta
                            avatar={lesson.completed ? 
                              <CheckCircleOutlined style={{ color: '#52c41a' }} /> : 
                              <PlayCircleOutlined />}
                            title={lesson.title}
                            description={`时长: ${lesson.duration}`}
                          />
                        </List.Item>
                      )}
                    />
                  }
                />
              </List.Item>
            )}
          />
        </TabPane>
        
        <TabPane tab="学员评价" key="3">
          <div className="course-reviews-summary">
            <div className="course-rating-overview">
              <Title level={1}>{course.rating}</Title>
              <Rate disabled defaultValue={parseFloat(course.rating)} allowHalf />
              <Text>{course.reviews.length} 条评价</Text>
            </div>
            
            <div className="course-rating-distribution">
              {[5, 4, 3, 2, 1].map(star => {
                const count = course.reviews.filter(r => Math.floor(r.rating) === star).length;
                const percentage = (count / course.reviews.length) * 100;
                
                return (
                  <div key={star} className="rating-bar">
                    <Text>{star} 星</Text>
                    <Progress 
                      percent={percentage} 
                      showInfo={false} 
                      strokeColor="#1890ff" 
                    />
                    <Text>{count}</Text>
                  </div>
                );
              })}
            </div>
          </div>
          
          <Divider />
          
          <List
            dataSource={course.reviews}
            renderItem={review => (
              <List.Item>
                <List.Item.Meta
                  avatar={<Avatar src={review.avatar} />}
                  title={
                    <div>
                      <Text strong>{review.user}</Text>
                      <Rate disabled defaultValue={review.rating} />
                    </div>
                  }
                  description={
                    <>
                      <Paragraph>{review.comment}</Paragraph>
                      <Text type="secondary">{review.date}</Text>
                    </>
                  }
                />
              </List.Item>
            )}
          />
        </TabPane>
      </Tabs>
    </div>
  );
};

export default CourseDetail;