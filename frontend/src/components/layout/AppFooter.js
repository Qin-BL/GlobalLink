import React from 'react';
import { Layout } from 'antd';

const { Footer } = Layout;

const AppFooter = () => {
  return (
    <Footer style={{ textAlign: 'center' }}>
      GlobalLink ©{new Date().getFullYear()} - 全球语言学习平台
    </Footer>
  );
};

export default AppFooter;