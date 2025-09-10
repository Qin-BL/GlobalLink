# GlobalLink 管理后台系统

## 概述

GlobalLink 管理后台是一个用于管理用户账户的Web界面，提供用户的增删改查功能。

## 功能特性

### 🔐 安全认证
- 独立的管理员登录系统
- 管理员凭据存储在配置文件中
- JWT令牌认证机制

### 👥 用户管理
- **查看用户列表**: 显示所有用户的详细信息
- **添加用户**: 创建新的用户账户
- **删除用户**: 删除单个用户账户
- **批量删除**: 删除所有非管理员用户
- **用户统计**: 显示用户数量统计信息

### 📊 数据展示
- 用户总数统计
- 活跃用户统计
- 管理员用户统计
- 最近注册用户列表

## 配置说明

### 管理员账户配置

管理员凭据在后端配置文件中设置：

**文件位置**: `backend/app/core/config.py`

```python
# 管理后台配置
ADMIN_USERNAME: str = "admin"  # 管理员用户名
ADMIN_PASSWORD: str = "admin"  # 管理员密码
```

### 环境变量配置

也可以通过环境变量覆盖默认配置：

```bash
export ADMIN_USERNAME="your_admin_username"
export ADMIN_PASSWORD="your_admin_password"
```

## 访问方式

### 1. 直接访问
- 管理后台登录页面: `http://localhost:3080/admin/login`
- 管理后台仪表板: `http://localhost:3080/admin/dashboard`

### 2. 通过主站入口
1. 以管理员身份登录主站
2. 点击用户菜单中的"管理后台"选项
3. 在新标签页中打开管理后台

### 3. 独立入口页面
访问 `http://localhost:3080/admin.html` 查看管理后台入口页面

## 使用指南

### 登录管理后台

1. 访问管理后台登录页面
2. 输入管理员用户名和密码
   - 默认用户名: `admin`
   - 默认密码: `admin`
3. 点击"登录"按钮

### 管理用户

#### 查看用户列表
- 登录后自动显示用户列表
- 包含用户ID、用户名、邮箱、手机号、角色、状态等信息
- 显示注册时间和最后登录时间

#### 添加用户
1. 点击"添加用户"按钮
2. 填写用户信息：
   - 用户名（必填）
   - 邮箱（可选）
   - 手机号（可选）
   - 密码（必填，最少6位）
   - 角色（用户/管理员）
   - 激活状态
3. 点击"添加"按钮

#### 删除用户
1. 在用户列表中找到要删除的用户
2. 点击该用户行的"删除"按钮
3. 在确认对话框中点击"确认删除"

#### 批量删除用户
1. 点击"删除所有用户"按钮
2. 阅读警告信息
3. 在确认对话框中点击"确认删除所有用户"

**注意**: 此操作将删除所有非管理员用户及其相关数据，包括：
- 用户账号信息
- 学习进度记录
- 会员记录
- 奖励记录

## API 端点

### 认证相关
- `POST /api/v1/admin/login` - 管理员登录

### 用户管理
- `GET /api/v1/admin/users` - 获取用户列表
- `GET /api/v1/admin/users/stats` - 获取用户统计
- `POST /api/v1/admin/users` - 创建用户
- `PUT /api/v1/admin/users/{user_id}` - 更新用户
- `DELETE /api/v1/admin/users/{user_id}` - 删除用户
- `DELETE /api/v1/admin/users/all` - 删除所有用户
- `GET /api/v1/admin/users/{user_id}` - 获取用户详情
- `GET /api/v1/admin/users/{user_id}/membership` - 获取用户会员信息
- `GET /api/v1/admin/users/{user_id}/progress` - 获取用户学习进度

## 安全注意事项

### 🔒 访问控制
- 管理后台需要管理员权限才能访问
- 所有API端点都有权限验证
- 管理员不能删除自己的账户

### 🛡️ 数据保护
- 删除操作有确认机制
- 批量删除有特别警告
- 敏感操作记录在日志中

### 🔐 密码安全
- 建议修改默认管理员密码
- 密码存储使用哈希加密
- 支持通过环境变量配置

## 技术架构

### 后端技术栈
- **框架**: FastAPI
- **数据库**: SQLite/PostgreSQL
- **认证**: JWT令牌
- **权限**: 基于角色的访问控制

### 前端技术栈
- **框架**: React
- **路由**: React Router
- **样式**: CSS3 + Flexbox/Grid
- **状态管理**: 本地状态

### 数据模型
```python
class User:
    id: int
    username: str
    email: Optional[str]
    phone: Optional[str]
    role: str  # "user" | "admin"
    is_active: bool
    created_at: datetime
    last_login: Optional[datetime]
```

## 开发说明

### 文件结构
```
backend/
├── app/api/endpoints/admin.py     # 管理后台API端点
├── app/schemas/user.py            # 用户数据模式（包含管理员相关）
└── app/core/config.py             # 配置文件（包含管理员凭据）

frontend/
├── src/pages/admin/
│   ├── AdminLogin.js              # 管理员登录页面
│   ├── AdminLogin.css             # 登录页面样式
│   ├── AdminDashboard.js          # 管理后台仪表板
│   └── AdminDashboard.css         # 仪表板样式
└── public/admin.html              # 管理后台入口页面
```

### 添加新功能
1. 在 `backend/app/api/endpoints/admin.py` 中添加新的API端点
2. 在 `frontend/src/pages/admin/AdminDashboard.js` 中添加前端功能
3. 更新相应的CSS样式文件

### 自定义配置
可以通过修改 `backend/app/core/config.py` 来自定义：
- 管理员用户名和密码
- 令牌过期时间
- 其他安全设置

## 故障排除

### 常见问题

#### 1. 无法登录管理后台
- 检查管理员用户名和密码是否正确
- 确认后端服务正在运行
- 检查网络连接

#### 2. 用户列表为空
- 确认数据库中有用户数据
- 检查API权限设置
- 查看浏览器控制台错误信息

#### 3. 删除操作失败
- 确认有足够的权限
- 检查用户是否存在
- 查看后端日志错误信息

### 调试技巧
1. 打开浏览器开发者工具查看网络请求
2. 检查后端日志文件
3. 使用API测试工具（如Postman）测试端点

## 更新日志

### v1.0.0 (2025-01-10)
- ✨ 初始版本发布
- 🔐 管理员认证系统
- 👥 用户管理功能
- 📊 用户统计仪表板
- 🎨 响应式用户界面

## 许可证

本管理后台系统遵循项目主许可证。

---

**维护者**: GlobalLink 开发团队  
**最后更新**: 2025-01-10