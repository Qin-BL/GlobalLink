# GlobalLink API 接口文档

## 概述

GlobalLink 是一个全球语言学习平台的后端API，提供用户认证、课程管理、会员管理、学习进度跟踪等功能。

**基础信息：**
- 基础URL: `http://localhost:8000/api/v1`
- 认证方式: Bearer Token (JWT)
- 数据格式: JSON

## 认证说明

大部分API需要在请求头中包含认证令牌：

```
Authorization: Bearer <access_token>
```

## API 端点

### 1. 认证模块 (`/auth`)

#### 1.1 用户登录
- **端点**: `POST /auth/login`
- **描述**: 用户登录获取访问令牌
- **认证**: 无需认证
- **请求体**:
```json
{
  "username": "string",  // 用户名/邮箱/手机号
  "password": "string"   // 密码
}
```
- **响应**:
```json
{
  "access_token": "string",
  "refresh_token": "string", 
  "token_type": "bearer"
}
```

#### 1.2 用户注册
- **端点**: `POST /auth/register`
- **描述**: 新用户注册
- **认证**: 无需认证
- **请求体**:
```json
{
  "username": "string",     // 用户名（必填）
  "email": "string",        // 邮箱（可选）
  "phone": "string",        // 手机号（可选）
  "password": "string"      // 密码（必填）
}
```
- **响应**:
```json
{
  "id": 1,
  "username": "string",
  "email": "string",
  "phone": "string",
  "is_active": true,
  "is_admin": false,
  "is_superuser": false,
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

### 2. 用户管理模块 (`/users`)

#### 2.1 获取当前用户信息
- **端点**: `GET /users/me`
- **描述**: 获取当前登录用户的信息
- **认证**: 需要认证
- **响应**: 用户信息对象

#### 2.2 获取用户列表
- **端点**: `GET /users/`
- **描述**: 获取所有用户列表（管理员权限）
- **认证**: 需要管理员权限
- **查询参数**:
  - `skip`: 跳过记录数（默认0）
  - `limit`: 限制记录数（默认100，最大100）
- **响应**: 用户信息数组

#### 2.3 创建用户
- **端点**: `POST /users/`
- **描述**: 创建新用户（管理员权限）
- **认证**: 需要管理员权限
- **请求体**: 同注册接口
- **响应**: 用户信息对象

#### 2.4 获取指定用户信息
- **端点**: `GET /users/{user_id}`
- **描述**: 获取指定用户信息（用户只能查看自己，管理员可查看所有）
- **认证**: 需要认证
- **路径参数**:
  - `user_id`: 用户ID
- **响应**: 用户信息对象

### 3. 管理员模块 (`/admin`)

#### 3.1 管理员登录
- **端点**: `POST /admin/login`
- **描述**: 管理员专用登录接口
- **认证**: 无需认证
- **请求体**:
```json
{
  "username": "string",  // 管理员用户名
  "password": "string"   // 管理员密码
}
```
- **响应**: 同用户登录响应

### 4. 课程管理模块 (`/courses`)

#### 4.1 获取课程列表
- **端点**: `GET /courses/`
- **描述**: 获取所有课程列表
- **认证**: 需要认证
- **查询参数**:
  - `skip`: 跳过记录数（默认0）
  - `limit`: 限制记录数（默认100，最大100）
- **响应**:
```json
[
  {
    "id": 1,
    "course_number": 1,
    "title": "基础英语",
    "description": "英语基础课程",
    "is_free": true,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
]
```

#### 4.2 创建课程
- **端点**: `POST /courses/`
- **描述**: 创建新课程
- **认证**: 需要认证
- **请求体**:
```json
{
  "course_number": 1,
  "title": "string",
  "description": "string",
  "is_free": false
}
```
- **响应**: 课程信息对象

#### 4.3 获取指定课程
- **端点**: `GET /courses/{course_id}`
- **描述**: 获取指定课程详情
- **认证**: 需要认证
- **路径参数**:
  - `course_id`: 课程ID
- **响应**: 课程信息对象

#### 4.4 更新课程
- **端点**: `PUT /courses/{course_id}`
- **描述**: 更新课程信息
- **认证**: 需要认证
- **路径参数**:
  - `course_id`: 课程ID
- **请求体**:
```json
{
  "title": "string",        // 可选
  "description": "string",  // 可选
  "is_free": false         // 可选
}
```
- **响应**: 更新后的课程信息对象

#### 4.5 删除课程
- **端点**: `DELETE /courses/{course_id}`
- **描述**: 删除指定课程
- **认证**: 需要认证
- **路径参数**:
  - `course_id`: 课程ID
- **响应**:
```json
{
  "message": "课程删除成功"
}
```

### 5. 会员管理模块 (`/membership`)

#### 5.1 获取会员列表
- **端点**: `GET /membership/`
- **描述**: 获取会员列表
- **认证**: 需要认证
- **查询参数**:
  - `skip`: 跳过记录数（默认0）
  - `limit`: 限制记录数（默认100，最大100）
- **响应**:
```json
[
  {
    "id": 1,
    "membership_type": "monthly",
    "start_date": "2024-01-01T00:00:00Z",
    "end_date": "2024-02-01T00:00:00Z",
    "is_active": true
  }
]
```

#### 5.2 创建会员
- **端点**: `POST /membership/`
- **描述**: 创建新会员记录
- **认证**: 需要认证
- **请求体**:
```json
{
  "user_id": 1,
  "membership_type": "monthly",  // "monthly" 或 "yearly"
  "start_date": "2024-01-01T00:00:00Z",
  "end_date": "2024-02-01T00:00:00Z"
}
```
- **响应**: 会员信息对象

#### 5.3 获取指定会员
- **端点**: `GET /membership/{membership_id}`
- **描述**: 获取指定会员详情
- **认证**: 需要认证
- **路径参数**:
  - `membership_id`: 会员ID
- **响应**: 会员信息对象

#### 5.4 更新会员
- **端点**: `PUT /membership/{membership_id}`
- **描述**: 更新会员信息
- **认证**: 需要认证
- **路径参数**:
  - `membership_id`: 会员ID
- **请求体**:
```json
{
  "membership_type": "yearly",     // 可选
  "start_date": "2024-01-01T00:00:00Z",  // 可选
  "end_date": "2024-12-31T00:00:00Z",    // 可选
  "is_active": true                // 可选
}
```
- **响应**: 更新后的会员信息对象

#### 5.5 删除会员
- **端点**: `DELETE /membership/{membership_id}`
- **描述**: 删除指定会员记录
- **认证**: 需要认证
- **路径参数**:
  - `membership_id`: 会员ID
- **响应**:
```json
{
  "message": "会员删除成功"
}
```

### 6. 学习进度模块 (`/progress`)

#### 6.1 获取学习进度列表
- **端点**: `GET /progress/`
- **描述**: 获取当前用户的学习进度列表
- **认证**: 需要认证
- **查询参数**:
  - `skip`: 跳过记录数（默认0）
  - `limit`: 限制记录数（默认100，最大100）
- **响应**:
```json
[
  {
    "id": 1,
    "user_id": 1,
    "course_id": 1,
    "knowledge_point_id": 1,
    "last_study_mode": "chinese_to_english",
    "updated_at": "2024-01-01T00:00:00Z"
  }
]
```

#### 6.2 创建学习进度记录
- **端点**: `POST /progress/`
- **描述**: 创建新的学习进度记录
- **认证**: 需要认证
- **请求体**:
```json
{
  "course_id": 1,
  "knowledge_point_id": 1,
  "last_study_mode": "chinese_to_english"  // 学习模式: "chinese_to_english", "dictation", "listening", "speaking"
}
```
- **响应**: 学习进度信息对象

#### 6.3 获取指定学习进度
- **端点**: `GET /progress/{progress_id}`
- **描述**: 获取指定学习进度详情
- **认证**: 需要认证
- **路径参数**:
  - `progress_id`: 学习进度ID
- **响应**: 学习进度信息对象

#### 6.4 更新学习进度
- **端点**: `PUT /progress/{progress_id}`
- **描述**: 更新学习进度
- **认证**: 需要认证
- **路径参数**:
  - `progress_id`: 学习进度ID
- **请求体**:
```json
{
  "knowledge_point_id": 2,           // 可选
  "last_study_mode": "dictation"     // 可选
}
```
- **响应**: 更新后的学习进度信息对象

#### 6.5 删除学习进度
- **端点**: `DELETE /progress/{progress_id}`
- **描述**: 删除指定学习进度记录
- **认证**: 需要认证
- **路径参数**:
  - `progress_id`: 学习进度ID
- **响应**:
```json
{
  "message": "学习进度删除成功"
}
```

## 错误响应

所有API在出错时都会返回统一格式的错误响应：

```json
{
  "detail": "错误描述信息"
}
```

常见HTTP状态码：
- `200`: 成功
- `201`: 创建成功
- `400`: 请求参数错误
- `401`: 未认证或认证失败
- `403`: 权限不足
- `404`: 资源不存在
- `422`: 请求数据验证失败
- `500`: 服务器内部错误

## 数据模型

### 用户模型 (User)
```json
{
  "id": "integer",
  "username": "string",
  "email": "string",
  "phone": "string", 
  "is_active": "boolean",
  "is_admin": "boolean",
  "is_superuser": "boolean",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

### 课程模型 (Course)
```json
{
  "id": "integer",
  "course_number": "integer",
  "title": "string",
  "description": "string",
  "is_free": "boolean",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

### 会员模型 (Membership)
```json
{
  "id": "integer",
  "membership_type": "string",  // "monthly" 或 "yearly"
  "start_date": "datetime",
  "end_date": "datetime",
  "is_active": "boolean"
}
```

### 学习进度模型 (Progress)
```json
{
  "id": "integer",
  "user_id": "integer",
  "course_id": "integer", 
  "knowledge_point_id": "integer",
  "last_study_mode": "string",  // "chinese_to_english", "dictation", "listening", "speaking"
  "updated_at": "datetime"
}
```

## 使用示例

### 1. 用户注册和登录流程

```bash
# 1. 用户注册
curl -X POST "http://localhost:8000/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123"
  }'

# 2. 用户登录
curl -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "password123"
  }'

# 3. 使用令牌访问受保护的API
curl -X GET "http://localhost:8000/api/v1/users/me" \
  -H "Authorization: Bearer <access_token>"
```

### 2. 课程管理流程

```bash
# 1. 获取课程列表
curl -X GET "http://localhost:8000/api/v1/courses/" \
  -H "Authorization: Bearer <access_token>"

# 2. 创建新课程
curl -X POST "http://localhost:8000/api/v1/courses/" \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "course_number": 1,
    "title": "基础英语",
    "description": "英语基础课程",
    "is_free": true
  }'

# 3. 更新课程
curl -X PUT "http://localhost:8000/api/v1/courses/1" \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "高级英语",
    "is_free": false
  }'
```

## 注意事项

1. **认证令牌**: 访问令牌有过期时间，过期后需要使用刷新令牌获取新的访问令牌
2. **权限控制**: 部分API需要管理员权限，普通用户无法访问
3. **数据验证**: 所有输入数据都会进行严格验证，确保数据完整性
4. **异步处理**: 后端采用异步架构，支持高并发访问
5. **错误处理**: 所有错误都有详细的错误信息，便于调试和处理

## 更新日志

- **v1.0.0** (2024-01-01): 初始版本，包含基础的用户认证、课程管理、会员管理和学习进度功能