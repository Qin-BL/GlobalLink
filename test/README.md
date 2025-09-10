# GlobalLink 测试模块

本文档介绍 GlobalLink 项目的完整测试框架，包含单元测试、黑盒测试、白盒测试、集成测试等多种测试类型。

## 测试模块结构

```
test/
├── __init__.py              # 测试模块入口
├── README.md                # 本文档
├── test_all_apis.py         # 功能测试 - API接口测试套件
├── test_blackbox.py         # 黑盒测试 - 外部行为测试
├── test_whitebox.py         # 白盒测试 - 内部实现测试
├── test_units.py           # 单元测试 - 核心功能单元测试
├── test_integration.py     # 集成测试 - 组件协作测试
├── test_error_notification.py # 专项测试 - 错误通知功能
├── run_all_tests.py        # 主测试运行器
└── run_all_tests.sh        # 测试脚本
```

## 测试类型说明

### 1. 单元测试 (test_units.py)
**测试范围**: 核心功能的单元测试
- 配置验证功能
- 错误通知器功能
- API响应处理
- 配置管理

**使用方法**:
```bash
python -m test.test_units
```

### 2. 黑盒测试 (test_blackbox.py) 
**测试范围**: 系统外部行为测试
- API端点存在性检查
- 响应格式验证
- 错误处理机制

**使用方法**:
```bash
python test_blackbox.py http://localhost:8000
```

### 3. 白盒测试 (test_whitebox.py)
**测试范围**: 内部实现和代码路径测试
- 错误通知器不同路径
- 配置验证路径
- API响应处理路径
- 邮件配置路径

**使用方法**:
```bash
python -m test.test_whitebox
```

### 4. 集成测试 (test_integration.py)
**测试范围**: 组件协作测试
- 配置到通知器集成
- API客户端集成
- 环境配置集成
- 全局错误处理集成

**使用方法**:
```bash
python -m test.test_integration
```

### 5. 功能测试 (test_all_apis.py)
**测试范围**: 完整的API接口测试
- 认证接口（登录、注册、令牌刷新）
- 课程接口（获取课程列表、课程详情）
- 用户接口（用户信息、学习进度）
- 支付接口（创建订单、查询订单）
- 健康检查接口（服务状态、数据库状态、邮件服务状态）

**使用方法**:
```bash
# 使用默认配置
python test_all_apis.py

# 指定服务器和账号
python test_all_apis.py http://your-server.com:8000 your-email@example.com your-password
```

### 6. 专项测试 (test_error_notification.py)
**测试范围**: 错误通知功能专项测试
- 错误通知配置验证
- 邮件服务配置检查
- 服务器错误触发测试

**使用方法**:
```bash
python test_error_notification.py http://localhost:8000 your-email@example.com your-password
```

**重要提示**: 该测试会触发真实的错误邮件通知

## 环境要求

- Python 3.7+
- requests 库 (`pip install requests`)
- 运行中的 GlobalLink 后端服务

## 配置说明

### 邮件服务配置

错误通知功能需要正确配置邮件服务，请在 `.env` 文件中设置：

```env
# 邮件服务器配置
SMTP_SERVER=smtp.qq.com
SMTP_PORT=465
SMTP_USERNAME=your-email@qq.com
SMTP_PASSWORD=your-authorization-code
SMTP_USE_SSL=true

# 错误通知配置
ERROR_NOTIFICATION_RECIPIENTS=admin1@example.com,admin2@example.com
ERROR_NOTIFICATION_ENABLED=true
```

### 错误通知配置

- `ERROR_NOTIFICATION_RECIPIENTS`: 错误通知接收邮箱列表，多个邮箱用逗号分隔
- `ERROR_NOTIFICATION_ENABLED`: 是否启用错误通知功能 (true/false)

## 测试流程

1. **准备环境**: 确保后端服务正常运行，邮件服务配置正确
2. **运行基础测试**: 先运行 `test_all_apis.py` 验证基础功能
3. **测试错误通知**: 运行 `test_error_notification.py` 测试邮件通知功能
4. **验证结果**: 检查配置的接收邮箱是否收到错误通知邮件

## 故障排除

### 常见问题

1. **连接失败**: 检查服务器地址和端口是否正确
2. **认证失败**: 检查测试账号的用户名和密码
3. **邮件发送失败**: 检查邮件服务配置和网络连接
4. **未收到邮件**: 检查垃圾邮件文件夹，确认接收邮箱配置正确

### 调试建议

- 使用 `--verbose` 参数查看详细请求信息
- 检查后端服务的日志输出
- 验证邮件服务的 SMTP 配置

## 自动化测试

这些测试脚本可以集成到 CI/CD 流程中，用于自动化测试和部署验证。