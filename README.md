# GlobalLink 英语学习平台
Where language stops being a barrier, and connection becomes effortless

## 项目简介

GlobalLink是一个专注于英语学习的在线平台，提供系统化的课程内容、会员订阅服务和推广奖励机制。平台旨在帮助用户高效学习英语，通过科学的学习方法和丰富的课程内容，提升用户的英语水平。

## 主要功能

- **课程学习**：提供55节系统化的英语学习课程，包含丰富的知识点
- **会员订阅**：支持月度和年度会员订阅，享受全部课程内容
- **学习进度跟踪**：记录用户的学习进度，支持继续学习
- **推广奖励**：用户可通过推广获得奖励金，支持提现
- **微信支付集成**：便捷的支付方式，支持会员订阅

## 技术栈

### 后端

- FastAPI：高性能的Python Web框架
- SQLAlchemy：ORM框架
- PostgreSQL：关系型数据库
- JWT：用户认证
- Pydantic：数据验证

### 前端

- React：前端框架
- Redux：状态管理
- Ant Design：UI组件库
- Axios：HTTP客户端
- React Router：路由管理

## 安装指南

### 后端

1. 安装依赖

```bash
cd backend
pip install -r requirements.txt
```

2. 配置数据库

修改 `app/core/config.py` 中的数据库配置：

```python
POSTGRES_SERVER: str = "localhost"
POSTGRES_USER: str = "postgres"
POSTGRES_PASSWORD: str = "password"
POSTGRES_DB: str = "globallink"
```

3. 启动服务

```bash
cd backend
python main.py
```

### 前端

1. 安装依赖

```bash
cd frontend
npm install
```

2. 启动开发服务器

```bash
npm start
```

## 项目结构

```
├── backend/
│   ├── app/
│   │   ├── api/          # API路由
│   │   ├── core/         # 核心配置
│   │   ├── db/           # 数据库
│   │   ├── models/       # 数据模型
│   │   ├── schemas/      # 数据验证
│   │   └── utils/        # 工具函数
│   ├── main.py           # 入口文件
│   └── requirements.txt  # 依赖项
├── courses/              # 课程数据
└── frontend/
    ├── public/
    ├── src/
    │   ├── components/   # 组件
    │   ├── pages/        # 页面
    │   ├── redux/        # 状态管理
    │   ├── services/     # API服务
    │   ├── utils/        # 工具函数
    │   ├── App.js        # 主应用
    │   └── index.js      # 入口文件
    └── package.json      # 依赖项
```

## 微信支付配置

在 `app/core/config.py` 中配置微信支付参数：

```python
WECHAT_APP_ID: str = "your_wechat_app_id"
WECHAT_MCH_ID: str = "your_wechat_mch_id"
WECHAT_API_KEY: str = "your_wechat_api_key"
```

## 许可证

本项目采用 GNU General Public License v3.0 许可证。详情请参阅 [LICENSE](LICENSE) 文件。
