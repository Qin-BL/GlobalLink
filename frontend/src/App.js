import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Layout, message } from 'antd';

import './App.css';
import { checkAuth } from './redux/authSlice';
import AppHeader from './components/layout/AppHeader';
import AppFooter from './components/layout/AppFooter';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import CourseList from './pages/courses/CourseList';
import CourseDetail from './pages/courses/CourseDetail';
import StudyMode from './pages/study/StudyMode';
import StudySession from './pages/study/StudySession';
import Membership from './pages/membership/Membership';
import Payment from './pages/membership/Payment';
import Profile from './pages/user/Profile';
import Referral from './pages/user/Referral';
import Rewards from './pages/user/Rewards';
import NotFound from './pages/NotFound';

const { Content } = Layout;

function App() {
  const dispatch = useDispatch();
  const { isAuthenticated, loading, error } = useSelector(state => state.auth);

  useEffect(() => {
    dispatch(checkAuth());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      message.error(error);
    }
  }, [error]);

  // 受保护的路由组件
  const ProtectedRoute = ({ children }) => {
    if (loading) return <div>加载中...</div>;
    if (!isAuthenticated) return <Navigate to="/login" />;
    return children;
  };

  return (
    <Layout className="app-layout">
      <AppHeader />
      <Content className="app-content">
        <Routes>
          {/* 公共路由 */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* 受保护的路由 */}
          <Route path="/" element={
            <ProtectedRoute>
              <CourseList />
            </ProtectedRoute>
          } />
          <Route path="/courses" element={
            <ProtectedRoute>
              <CourseList />
            </ProtectedRoute>
          } />
          <Route path="/courses/:courseId" element={
            <ProtectedRoute>
              <CourseDetail />
            </ProtectedRoute>
          } />
          <Route path="/study/:courseId/mode" element={
            <ProtectedRoute>
              <StudyMode />
            </ProtectedRoute>
          } />
          <Route path="/study/:courseId/:mode" element={
            <ProtectedRoute>
              <StudySession />
            </ProtectedRoute>
          } />
          <Route path="/membership" element={
            <ProtectedRoute>
              <Membership />
            </ProtectedRoute>
          } />
          <Route path="/payment/:type" element={
            <ProtectedRoute>
              <Payment />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
          <Route path="/referral" element={
            <ProtectedRoute>
              <Referral />
            </ProtectedRoute>
          } />
          <Route path="/rewards" element={
            <ProtectedRoute>
              <Rewards />
            </ProtectedRoute>
          } />
          
          {/* 404页面 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Content>
      <AppFooter />
    </Layout>
  );
}

export default App;