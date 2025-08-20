import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Typography, Input, Select, Pagination, Spin, Empty } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;
const { Option } = Select;

const CourseList = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [totalCourses, setTotalCourses] = useState(0);
  const [filter, setFilter] = useState('all');

  // 模拟从API获取课程数据
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        // 这里应该是实际的API调用
        // const response = await api.getCourses();
        // 模拟数据
        setTimeout(() => {
          const mockCourses = Array.from({ length: 30 }, (_, i) => ({
            id: i + 1,
            title: `课程 ${i + 1}`,
            description: `这是课程 ${i + 1} 的描述，包含了该课程的基本信息和学习内容概述。`,
            level: i % 3 === 0 ? '初级' : i % 3 === 1 ? '中级' : '高级',
            duration: `${Math.floor(Math.random() * 10) + 1} 小时`,
            lessons: Math.floor(Math.random() * 20) + 5,
            rating: (Math.random() * 2 + 3).toFixed(1),
            students: Math.floor(Math.random() * 1000) + 100,
            image: `https://via.placeholder.com/300x200?text=Course+${i + 1}`,
          }));
          
          setCourses(mockCourses);
          setFilteredCourses(mockCourses);
          setTotalCourses(mockCourses.length);
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('获取课程失败:', error);
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  // 处理搜索和筛选
  useEffect(() => {
    let result = [...courses];
    
    // 应用搜索
    if (searchText) {
      result = result.filter(course => 
        course.title.toLowerCase().includes(searchText.toLowerCase()) ||
        course.description.toLowerCase().includes(searchText.toLowerCase())
      );
    }
    
    // 应用筛选
    if (filter !== 'all') {
      result = result.filter(course => course.level === filter);
    }
    
    setFilteredCourses(result);
    setTotalCourses(result.length);
    setCurrentPage(1); // 重置到第一页
  }, [searchText, filter, courses]);

  // 处理页面变化
  const handlePageChange = (page, pageSize) => {
    setCurrentPage(page);
    setPageSize(pageSize);
  };

  // 处理课程点击
  const handleCourseClick = (courseId) => {
    navigate(`/courses/${courseId}`);
  };

  // 获取当前页的课程
  const getCurrentPageCourses = () => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredCourses.slice(startIndex, endIndex);
  };

  return (
    <div className="course-list-container">
      <div className="course-list-header">
        <Title level={2}>全部课程</Title>
        <div className="course-list-filters">
          <Input 
            placeholder="搜索课程" 
            prefix={<SearchOutlined />} 
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 250, marginRight: 16 }}
          />
          <Select 
            defaultValue="all" 
            style={{ width: 120 }} 
            onChange={value => setFilter(value)}
          >
            <Option value="all">全部级别</Option>
            <Option value="初级">初级</Option>
            <Option value="中级">中级</Option>
            <Option value="高级">高级</Option>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="course-list-loading">
          <Spin size="large" />
          <Text>加载课程中...</Text>
        </div>
      ) : filteredCourses.length > 0 ? (
        <>
          <Row gutter={[24, 24]}>
            {getCurrentPageCourses().map(course => (
              <Col xs={24} sm={12} md={8} lg={6} key={course.id}>
                <Card
                  hoverable
                  cover={<img alt={course.title} src={course.image} />}
                  onClick={() => handleCourseClick(course.id)}
                  className="course-card"
                >
                  <Card.Meta 
                    title={course.title} 
                    description={course.description} 
                  />
                  <div className="course-card-footer">
                    <div className="course-card-info">
                      <Text type="secondary">级别: {course.level}</Text>
                      <Text type="secondary">时长: {course.duration}</Text>
                    </div>
                    <div className="course-card-stats">
                      <Text type="secondary">评分: {course.rating}</Text>
                      <Text type="secondary">{course.students} 学生</Text>
                    </div>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
          <div className="course-list-pagination">
            <Pagination
              current={currentPage}
              pageSize={pageSize}
              total={totalCourses}
              onChange={handlePageChange}
              showSizeChanger
              showTotal={(total) => `共 ${total} 门课程`}
            />
          </div>
        </>
      ) : (
        <Empty description="没有找到匹配的课程" />
      )}
    </div>
  );
};

export default CourseList;