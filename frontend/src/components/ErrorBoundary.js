import React from 'react';
import { Result, Button } from 'antd';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Result
          status="error"
          title="页面出现错误"
          subTitle={
            <div>
              <p>很抱歉，页面出现了错误。</p>
              <p>请刷新页面或联系技术支持。</p>
              {process.env.NODE_ENV === 'development' && (
                <pre style={{ textAlign: 'left', fontSize: '12px', overflow: 'auto' }}>
                  {this.state.error?.toString()}
                </pre>
              )}
            </div>
          }
          extra={
            <Button type="primary" onClick={() => window.location.reload()}>
              刷新页面
            </Button>
          }
        />
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;