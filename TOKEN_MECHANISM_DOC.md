# GlobalLink项目Token机制说明文档

## 概述

GlobalLink项目目前采用了完整的**双Token认证机制**，包含访问令牌（Access Token）和刷新令牌（Refresh Token），以提高系统安全性和用户体验。

## Token类型及功能

### 1. 访问令牌（Access Token）

- **主要用途**：用于API请求的身份验证，是客户端访问受保护资源的主要凭证
- **有效期**：8天（可通过`ACCESS_TOKEN_EXPIRE_MINUTES`配置调整）
- **存储位置**：Redis缓存，键前缀为`access_token:`
- **特点**：有效期较短，降低令牌泄露风险

### 2. 刷新令牌（Refresh Token）

- **主要用途**：当访问令牌过期时，用于获取新的访问令牌，无需用户重新登录
- **有效期**：30天（可通过`REFRESH_TOKEN_EXPIRE_DAYS`配置调整）
- **存储位置**：Redis缓存，键前缀为`refresh_token:`
- **特点**：有效期较长，仅用于获取新的访问令牌

## 核心实现文件

1. **配置文件**：`app/core/config.py` - 包含Token相关配置项
2. **安全功能**：`app/core/security.py` - 包含Token生成、验证和撤销功能
3. **缓存管理**：`app/utils/token_cache.py` - 负责Token的缓存机制
4. **API端点**：`app/api/endpoints/auth.py` - 提供登录、刷新Token和登出功能
5. **数据模型**：`app/schemas/user.py` - 定义了Token返回模型

## 关键配置项

在`config.py`中定义了以下与Token相关的配置：

```python
# 访问令牌有效期（分钟）
ACCESS_TOKEN_EXPIRE_MINUTES = 8 * 24 * 60  # 8天

# 刷新令牌有效期（天）
REFRESH_TOKEN_EXPIRE_DAYS = 30  # 30天

# JWT算法
JWT_ALGORITHM = "HS256"

# 访问令牌缓存过期时间（秒）
TOKEN_CACHE_EXPIRE_SECONDS = 7 * 24 * 60 * 60  # 7天

# 刷新令牌缓存过期时间（秒）
REFRESH_TOKEN_CACHE_EXPIRE_SECONDS = 30 * 24 * 60 * 60  # 30天
```

## 工作流程

### 1. 用户登录流程

1. 用户提供凭证（用户名/邮箱/手机号+密码）进行登录
2. 系统验证凭证，如果有效，则同时生成：
   - 一个短期的访问令牌（Access Token）
   - 一个长期的刷新令牌（Refresh Token）
3. 系统将两个令牌都存储在Redis中，并关联到用户ID
4. 系统将两个令牌返回给客户端

### 2. API访问流程

1. 客户端在API请求的Authorization头中携带访问令牌
2. 服务端验证访问令牌的有效性（通过Redis缓存和JWT解码）
3. 如果令牌有效，允许访问受保护资源；否则拒绝访问

### 3. 令牌刷新流程

1. 当访问令牌过期时，客户端使用刷新令牌调用`/refresh-token`端点
2. 服务端验证刷新令牌的有效性
3. 如果刷新令牌有效，系统生成一个新的访问令牌并返回给客户端
4. 客户端使用新的访问令牌继续访问受保护资源

### 4. 用户登出流程

1. 用户发起登出请求，提交访问令牌
2. 系统从Redis中撤销该访问令牌
3. 根据需要，系统也可以撤销用户的所有令牌或刷新令牌

## 核心函数说明

### 令牌生成函数

1. **create_access_token**
   - 功能：创建访问令牌
   - 参数：用户ID、过期时间（可选）
   - 返回：JWT格式的访问令牌

2. **create_refresh_token**
   - 功能：创建刷新令牌
   - 参数：用户ID
   - 返回：JWT格式的刷新令牌

### 令牌验证函数

1. **verify_token**
   - 功能：验证访问令牌
   - 参数：访问令牌
   - 返回：用户ID（有效时）或None（无效时）

2. **verify_refresh_token**
   - 功能：验证刷新令牌
   - 参数：刷新令牌
   - 返回：用户ID（有效时）或None（无效时）

### 令牌刷新函数

1. **refresh_access_token**
   - 功能：使用刷新令牌获取新的访问令牌
   - 参数：刷新令牌
   - 返回：新的访问令牌（有效时）或None（无效时）

### 令牌撤销函数

1. **revoke_user_token**
   - 功能：撤销用户的访问令牌
   - 参数：访问令牌

2. **revoke_refresh_token**
   - 功能：撤销用户的刷新令牌
   - 参数：刷新令牌

3. **revoke_user_tokens**
   - 功能：撤销用户的所有令牌（可指定类型）
   - 参数：用户ID、令牌类型（可选，默认为"access"，可选值为"access"、"refresh"或"all"）

4. **revoke_all_user_tokens**
   - 功能：撤销用户的所有类型令牌
   - 参数：用户ID

## Redis缓存结构

系统使用Redis缓存管理令牌，主要包含以下类型的键：

1. **令牌到用户ID的映射**：
   - 访问令牌：`access_token:{token_value}` -> {"user_id": 用户ID, "type": "access"}
   - 刷新令牌：`refresh_token:{token_value}` -> {"user_id": 用户ID, "type": "refresh"}

2. **用户到令牌列表的映射**：
   - 访问令牌：`user_access_tokens:{user_id}` -> [token1, token2, ...]
   - 刷新令牌：`user_refresh_tokens:{user_id}` -> [token1, token2, ...]

## API端点说明

### 1. 登录接口

- **路径**：`POST /api/auth/login` 和 `POST /api/auth/login/custom`
- **功能**：验证用户凭证并返回访问令牌和刷新令牌
- **返回示例**：
  ```json
  {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "bearer",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```

### 2. 刷新令牌接口

- **路径**：`POST /api/auth/refresh-token`
- **功能**：使用刷新令牌获取新的访问令牌
- **请求体**：`{"refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."}`
- **返回示例**：
  ```json
  {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "bearer",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```

### 3. 登出接口

- **路径**：`POST /api/auth/logout`
- **功能**：撤销用户的访问令牌
- **请求体**：`{"token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."}`
- **返回示例**：`{"message": "登出成功"}`

## 安全性考虑

1. **短期访问令牌**：降低了令牌被截获后被滥用的风险
2. **长期刷新令牌**：提供了更好的用户体验，避免频繁登录
3. **Redis缓存验证**：除了JWT自身的签名验证外，还通过Redis缓存提供额外的安全层，允许令牌被提前撤销
4. **令牌类型区分**：明确区分访问令牌和刷新令牌的用途，限制刷新令牌的使用范围
5. **令牌撤销机制**：支持多种方式撤销令牌（单个撤销、批量撤销、按类型撤销）

## 最佳实践

1. 客户端应安全存储刷新令牌（如仅在内存中存储或使用安全的存储机制）
2. 客户端应在访问令牌过期前主动使用刷新令牌获取新令牌
3. 当刷新令牌也过期时，用户必须重新登录
4. 对于敏感操作，建议要求用户重新进行身份验证，而不依赖刷新令牌
5. 定期清理过期的令牌缓存，避免Redis存储空间浪费

## 故障排查

1. **访问令牌无效**：检查令牌是否过期、是否被撤销，或签名是否正确
2. **刷新令牌无效**：检查刷新令牌是否过期、是否被撤销，或是否与用户匹配
3. **Redis连接问题**：确保Redis服务正常运行，连接配置正确
4. **令牌缓存不一致**：如果遇到令牌状态不一致的问题，可以尝试清除相关的Redis缓存
