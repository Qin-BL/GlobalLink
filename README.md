# GlobalLink 英语学习平台

Where language stops being a barrier, and connection becomes effortless

## 🚀 项目简介

GlobalLink是一个专注于英语学习的在线平台，提供系统化的课程内容、会员订阅服务和推广奖励机制。平台旨在帮助用户高效学习英语，通过科学的学习方法和丰富的课程内容，提升用户的英语水平。

## ✨ 主要功能

- **课程学习**: 提供55节系统化的英语学习课程，包含丰富的知识点
- **会员订阅**: 支持月度和年度会员订阅，享受全部课程内容
- **学习进度跟踪**: 记录用户的学习进度，支持继续学习
- **推广奖励**: 用户可通过推广获得奖励金，支持提现
- **微信支付集成**: 便捷的支付方式，支持会员订阅
- **管理后台**: 完整的用户管理系统

## 🛠️ 技术栈

### 后端
- **FastAPI**: 高性能的Python Web框架
- **SQLAlchemy**: ORM框架
- **PostgreSQL**: 生产级关系型数据库
- **JWT**: 用户认证和安全
- **Pydantic**: 数据验证和序列化
- **Redis**: 缓存和会话管理
- **MongoDB**: 日志和数据分析

### 前端
- **React**: 现代化前端框架
- **Redux**: 状态管理
- **Ant Design**: UI组件库
- **Axios**: HTTP客户端
- **React Router**: 路由管理

## 📦 快速开始

### Docker部署（推荐）

```bash
# 1. 克隆项目
git clone <your-repo-url>
cd GlobalLink

# 2. 运行Docker部署
chmod +x install/docker_deploy.sh
./install/docker_deploy.sh
```

### 传统部署

```bash
# 1. 克隆项目
git clone <your-repo-url>
cd GlobalLink

# 2. 运行一键部署
chmod +x install/one_click_deploy.sh
sudo ./install/one_click_deploy.sh
```

## 🔧 环境配置

### 数据库配置

项目使用PostgreSQL作为主数据库，配置在 `backend/app/core/config.py`:

```python
POSTGRES_SERVER: str = "localhost"
POSTGRES_USER: str = "globallink_user"
POSTGRES_PASSWORD: str = "globallink_password"
POSTGRES_DB: str = "globallink"
POSTGRES_PORT: int = 5432
```

### 管理员配置

```python
ADMIN_USERNAME: str = "admin"
ADMIN_PASSWORD: str = "admin123"
```

### 微信支付配置

```python
WECHAT_APP_ID: str = "your_wechat_app_id"
WECHAT_MCH_ID: str = "your_wechat_mch_id"
WECHAT_API_KEY: str = "your_wechat_api_key"
```

## 🌐 访问地址

部署成功后访问：

- **主应用**: http://your-server-ip
- **API文档**: http://your-server-ip/api/docs
- **管理后台**: http://your-server-ip/admin/login
  - 默认账号: admin / admin123

## 📁 项目结构

```
GlobalLink/
├── backend/                 # 后端代码
│   ├── app/
│   │   ├── api/            # API路由
│   │   ├── core/           # 核心配置
│   │   ├── db/             # 数据库
│   │   ├── models/         # 数据模型
│   │   ├── schemas/        # 数据验证
│   │   └── utils/          # 工具函数
│   ├── main.py             # 入口文件
│   └── requirements.txt    # 依赖项
├── frontend/               # 前端代码
│   ├── public/
│   ├── src/
│   │   ├── components/     # 组件
│   │   ├── pages/          # 页面
│   │   ├── redux/          # 状态管理
│   │   ├── services/       # API服务
│   │   └── utils/          # 工具函数
│   └── package.json
├── install/                # 部署脚本
│   ├── docker_deploy.sh   # Docker部署
│   ├── one_click_deploy.sh # 传统部署
│   ├── with_docker/        # Docker相关脚本
│   └── without_docker/     # 传统部署脚本
├── courses/                # 课程数据
└── ssl/                    # SSL证书
```

## 🔒 安全特性

- JWT令牌认证
- 密码哈希加密
- CORS安全配置
- 速率限制
- SQL注入防护
- XSS攻击防护

## 📊 性能优化

- 数据库连接池
- Redis缓存
- Nginx反向代理
- Gzip压缩
- 静态资源缓存

## 🐛 故障排除

常见问题解决方案：

1. **端口冲突**: 检查8000端口是否被占用
2. **数据库连接失败**: 确认PostgreSQL服务运行正常
3. **权限问题**: 确保部署脚本有执行权限

详细故障排除请查看 [DEPLOYMENT.md](./DEPLOYMENT.md)

## 📄 许可证

本项目采用 GNU General Public License v3.0 许可证。详情请参阅 [LICENSE](LICENSE) 文件。

## 🤝 支持

如果遇到问题：
1. 检查日志文件
2. 查看详细部署指南
3. 联系开发团队

---

**维护者**: GlobalLink 开发团队  
**最后更新**: 2025-01-10