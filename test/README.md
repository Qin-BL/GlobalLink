# GlobalLink 测试模块

本文档介绍 GlobalLink 项目的完整测试框架，包含多种类型的测试以确保系统的可靠性和稳定性。

## 📋 目录结构

```
test/
├── __init__.py                    # 测试模块初始化文件
├── README.md                      # 本文档
├── run_all_tests.py              # Python主测试运行器
├── run_all_tests.sh              # Shell测试脚本
├── test_units.py                 # 单元测试模块
├── test_whitebox.py              # 白盒测试模块
├── test_blackbox.py              # 黑盒测试模块
├── test_integration.py           # 集成测试模块
├── test_all_apis.py              # 功能测试模块 (API接口测试)
└── test_error_notification.py    # 错误通知专项测试模块
```

## 🧪 测试类型说明

### 1. 单元测试 (Unit Tests)
- **文件**: `test_units.py`
- **目的**: 测试单个函数、方法或类的功能
- **特点**: 独立运行，不依赖外部服务
- **覆盖范围**: 
  - 核心业务逻辑
  - 数据处理函数
  - 工具类和辅助函数
  - 边界条件和异常处理

### 2. 白盒测试 (White-box Tests)
- **文件**: `test_whitebox.py`
- **目的**: 基于代码内部结构进行测试
- **特点**: 关注代码路径、分支覆盖
- **覆盖范围**:
  - 代码分支覆盖
  - 循环和条件语句
  - 内部状态变化
  - 算法实现细节

### 3. 黑盒测试 (Black-box Tests)
- **文件**: `test_blackbox.py`
- **目的**: 从用户角度测试系统外部行为
- **特点**: 不关心内部实现，只关注输入输出
- **依赖**: 需要运行中的服务器
- **覆盖范围**:
  - 用户界面交互
  - 系统响应时间
  - 错误处理机制
  - 用户体验流程

### 4. 集成测试 (Integration Tests)
- **文件**: `test_integration.py`
- **目的**: 测试系统各组件之间的协作
- **特点**: 验证模块间接口和数据流
- **覆盖范围**:
  - 数据库连接和操作
  - 外部API调用
  - 服务间通信
  - 配置文件加载

### 5. 功能测试 (Functional Tests)
- **文件**: `test_all_apis.py`
- **目的**: 测试完整的API接口功能
- **特点**: 端到端的功能验证
- **依赖**: 需要运行中的服务器和测试账号
- **覆盖范围**:
  - 用户认证和授权
  - CRUD操作
  - 业务流程
  - 数据一致性

### 6. 错误通知测试 (Error Notification Tests)
- **文件**: `test_error_notification.py`
- **目的**: 专项测试错误邮件通知功能
- **特点**: 验证错误监控和通知机制
- **依赖**: 需要运行中的服务器、测试账号和邮件配置
- **覆盖范围**:
  - 邮件服务配置
  - 错误触发机制
  - 通知发送功能
  - 接收者配置

## 🚀 快速开始

### 环境要求

- Python 3.7+
- pip3
- requests 库
- 运行中的 GlobalLink 服务器 (用于服务器相关测试)

### 安装依赖

```bash
pip3 install requests
```

### 运行测试

#### 1. 使用 Python 运行器 (推荐)

```bash
# 运行所有本地测试 (单元测试、白盒测试、集成测试)
python3 run_all_tests.py

# 运行所有测试 (包括服务器测试)
python3 run_all_tests.py --base-url http://localhost:8000

# 运行完整测试套件 (包括需要账号的测试)
python3 run_all_tests.py --base-url http://localhost:8000 --email test@example.com --password 123456

# 运行指定类型的测试
python3 run_all_tests.py --tests unit whitebox integration

# 详细输出模式
python3 run_all_tests.py --verbose

# 生成测试报告
python3 run_all_tests.py --report my_test_report.txt
```

#### 2. 使用 Shell 脚本

```bash
# 基本运行
./run_all_tests.sh

# 指定服务器和账号
./run_all_tests.sh -s localhost -p 8000 -e test@example.com -w 123456

# 详细输出
./run_all_tests.sh --verbose

# 跳过服务器测试
./run_all_tests.sh --skip-server-tests

# 查看帮助
./run_all_tests.sh --help
```

#### 3. 单独运行测试模块

```bash
# 单元测试
python3 -m test.test_units

# 白盒测试
python3 -m test.test_whitebox

# 集成测试
python3 -m test.test_integration

# 黑盒测试 (需要服务器)
python3 test_blackbox.py http://localhost:8000

# 功能测试 (需要服务器和账号)
python3 test_all_apis.py http://localhost:8000 test@example.com 123456

# 错误通知测试 (需要服务器和账号)
python3 test_error_notification.py http://localhost:8000 test@example.com 123456
```

## 📊 测试报告

测试运行后会自动生成测试报告，包含以下信息：

- 测试执行时间
- 各测试模块的通过/失败状态
- 详细的错误信息
- 测试覆盖率统计
- 性能指标

报告格式支持：
- 控制台输出
- 文本文件
- 详细日志

## ⚙️ 配置说明

### 测试配置文件

项目现在使用集中化的测试配置文件 `test_config.py`，该文件位于 test 目录中。这个配置文件包含了所有测试需要的配置项，并且可以通过环境变量进行覆盖。

### 使用配置文件

在测试文件中，可以这样导入和使用配置：

```python
from test_config import test_config

# 获取基础URL
base_url = test_config.BASE_URL

# 获取测试账号信息
email = test_config.TEST_EMAIL
password = test_config.TEST_PASSWORD

# 获取SSH连接信息
ssh_host = test_config.SSH_HOST
ssh_key = test_config.SSH_KEY
ssh_username = test_config.SSH_USERNAME
```

### 环境变量

可以通过环境变量覆盖默认配置：

```bash
export TEST_SERVER="localhost"
export TEST_PORT="8000"
export TEST_BASE_URL="http://custom-server:8080"
export TEST_EMAIL="your-test@example.com"
export TEST_PASSWORD="your-password"
export SSH_HOST="your-server-ip"
export SSH_KEY="/path/to/your/ssh/key.pem"
export SSH_USERNAME="your-username"
export TEST_TIMEOUT="60"
export TEST_RETRY_COUNT="5"
```

## 🔧 高级用法

### 自定义测试配置

```python
# 在测试文件中自定义配置
from test import TestConfig

config = TestConfig(
    base_url="http://your-server:8000",
    timeout=60,
    retry_count=5,
    verbose=True
)
```

### 添加新的测试

1. 在相应的测试文件中添加测试方法
2. 遵循命名规范：`test_功能名称`
3. 使用断言验证结果
4. 添加适当的文档字符串

```python
def test_new_feature(self):
    """测试新功能"""
    # 准备测试数据
    test_data = {"key": "value"}
    
    # 执行测试
    result = your_function(test_data)
    
    # 验证结果
    self.assertTrue(result.success)
    self.assertEqual(result.data, expected_data)
```

### 测试数据管理

- 使用 `setUp()` 和 `tearDown()` 方法管理测试数据
- 为每个测试创建独立的测试数据
- 测试完成后清理临时数据

## 🚨 注意事项

### 服务器测试注意事项

1. **服务器状态**: 确保 GlobalLink 服务器正在运行
2. **数据库状态**: 确保数据库连接正常
3. **测试账号**: 使用专门的测试账号，避免影响生产数据
4. **网络连接**: 确保测试环境能够访问服务器

### 错误通知测试特别注意

⚠️ **警告**: 错误通知测试会触发真实的错误邮件通知！

运行前请确保：
1. 邮件服务配置正确
2. 错误通知接收邮箱已正确设置
3. 您有权限接收测试邮件
4. 在生产环境中谨慎运行

### 测试最佳实践

1. **隔离性**: 每个测试应该独立运行，不依赖其他测试
2. **可重复性**: 测试结果应该一致和可重复
3. **清晰性**: 测试名称和文档应该清楚说明测试目的
4. **完整性**: 测试应该覆盖正常情况和异常情况
5. **性能**: 避免过长的测试执行时间

## 🐛 故障排除

### 常见问题

#### 1. 连接错误
```
ConnectionError: 无法连接到服务器
```
**解决方案**: 
- 检查服务器是否运行
- 验证服务器地址和端口
- 检查防火墙设置

#### 2. 认证失败
```
AuthenticationError: 登录失败
```
**解决方案**:
- 验证测试账号邮箱和密码
- 检查账号是否被锁定
- 确认账号权限

#### 3. 超时错误
```
TimeoutError: 请求超时
```
**解决方案**:
- 增加超时时间设置
- 检查网络连接
- 确认服务器响应性能

#### 4. 依赖包错误
```
ImportError: No module named 'requests'
```
**解决方案**:
```bash
pip3 install requests
```

### 调试技巧

1. **使用详细模式**: 添加 `--verbose` 参数查看详细输出
2. **单独运行**: 先运行单个测试模块定位问题
3. **检查日志**: 查看服务器日志了解错误详情
4. **网络工具**: 使用 curl 或 Postman 验证 API 接口

## 📈 持续集成

### GitHub Actions 配置示例

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Set up Python
      uses: actions/setup-python@v2
      with:
        python-version: '3.8'
    
    - name: Install dependencies
      run: |
        pip install -r requirements.txt
    
    - name: Run tests
      run: |
        cd test
        python3 run_all_tests.py --tests unit whitebox integration
```

### Jenkins 配置示例

```groovy
pipeline {
    agent any
    
    stages {
        stage('Test') {
            steps {
                sh 'cd test && python3 run_all_tests.py'
            }
        }
    }
    
    post {
        always {
            archiveArtifacts artifacts: 'test/test_report_*.txt', fingerprint: true
        }
    }
}
```

## 📚 参考资料

- [Python unittest 文档](https://docs.python.org/3/library/unittest.html)
- [Requests 库文档](https://requests.readthedocs.io/)
- [软件测试最佳实践](https://testing-best-practices.com/)

## 🤝 贡献指南

欢迎贡献测试用例和改进建议：

1. Fork 项目
2. 创建功能分支
3. 添加测试用例
4. 提交 Pull Request

## 📄 许可证

本测试模块遵循项目主许可证。

---

**版本**: 2.0  
**最后更新**: 2025-01-10  
**维护者**: GlobalLink 开发团队