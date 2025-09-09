# 课程导入和错误通知功能

## 课程导入脚本

### 功能描述
课程导入脚本 `import_courses.py` 用于将 `courses` 目录下的 JSON 课程文件导入到数据库中。每个 JSON 文件对应一门课程，包含多个知识点。

### 使用方法

1. **准备课程文件**: 确保 `courses` 目录包含格式正确的 JSON 文件（01.json, 02.json, ...）

2. **运行导入脚本**:
```bash
cd backend
python scripts/import_courses.py
```

3. **查看导入结果**: 脚本会显示导入统计信息，包括成功导入的课程数和知识点数。

### 课程文件格式
每个 JSON 文件应该是一个数组，包含多个知识点对象：
```json
[
  {
    "chinese": "中文内容",
    "english": "English content", 
    "soundmark": "/sʌnd mɑːrk/"
  },
  // 更多知识点...
]
```

### 数据库模型
- **Course**: 课程表，包含课程编号、标题、描述和是否免费
- **KnowledgePoint**: 知识点表，包含中文、英文、音标和在课程中的顺序

### 自动设置
- 前3节课自动设置为免费课程
- 课程标题自动生成（如"第1课"）
- 知识点按文件中的顺序自动编号

## 错误邮件通知功能

### 功能描述
错误邮件通知功能在接口报错时自动发送邮件通知，支持配置多个接收邮箱。

### 配置方法

1. **邮件服务器配置**: 在 `.env` 文件中配置邮件服务器信息：
```bash
MAIL_SERVER=smtp.163.com
MAIL_PORT=587
MAIL_USERNAME=your_email@163.com
MAIL_PASSWORD=your_password
MAIL_FROM=your_email@163.com
MAIL_FROM_NAME=GlobalLink
```

2. **接收邮箱配置**: 在 `.env` 文件中配置错误通知接收邮箱：
```bash
# 错误通知配置
ERROR_NOTIFICATION_RECIPIENTS="admin@example.com,dev@example.com,15010993510@163.com"
ERROR_NOTIFICATION_ENABLED=true
```

3. **配置说明**:
   - `ERROR_NOTIFICATION_RECIPIENTS`: 接收错误通知的邮箱列表，多个邮箱用逗号分隔
   - `ERROR_NOTIFICATION_ENABLED`: 是否启用错误邮件通知功能 (true/false)

### 通知内容
错误邮件包含以下信息：
- 错误类型和详细信息
- 完整的堆栈跟踪
- 请求信息（URL、方法、客户端IP、用户代理）
- 附加环境信息

### 触发条件
- 所有未处理的异常（500错误）
- HTTP 500+ 服务器错误
- 自定义错误通知（通过 `notify_error` 函数）

### 使用方法

1. **自动通知**: 所有未处理的异常会自动触发邮件通知

2. **手动通知**: 可以在代码中手动发送错误通知
```python
from app.utils.error_notifier import notify_error

try:
    # 业务代码
    pass
except Exception as e:
    # 发送自定义错误通知
    await notify_error(e, request, {"custom_field": "value"})
```

## 部署说明

### 测试服务器部署

1. **安装依赖**:
```bash
pip install -r requirements.txt
```

2. **配置环境变量**: 创建 `.env` 文件并配置数据库和邮件服务器

3. **导入课程数据**:
```bash
python scripts/import_courses.py
```

4. **启动服务**:
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### 注意事项
- 确保邮件服务器配置正确
- 确保数据库连接正常
- 错误通知功能依赖邮件服务，如果邮件配置错误会记录日志但不会影响主要业务
- 课程导入脚本可以多次运行，已存在的课程会被跳过

## 故障排除

### 常见问题

1. **邮件发送失败**: 检查邮件服务器配置和网络连接
2. **课程导入失败**: 检查 JSON 文件格式和数据库连接
3. **权限问题**: 确保脚本有读写数据库的权限

### 日志查看
错误和操作日志可以在应用日志中查看，默认输出到控制台。