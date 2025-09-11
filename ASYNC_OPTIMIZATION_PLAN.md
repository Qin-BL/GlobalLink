# GlobalLink 异步架构优化方案

## 当前状态分析

### ✅ 已异步的组件
- **中间件层**：API日志、限流、缓存中间件
- **工具函数**：Redis操作、邮件发送、错误通知
- **应用生命周期**：启动/关闭事件

### ❌ 需要异步化的组件
- **API端点**：用户认证、用户管理、管理员功能
- **数据库操作**：SQLAlchemy ORM查询
- **依赖注入**：用户认证、权限检查

## 优化方案

### 1. 数据库层异步化

#### 1.1 升级到异步SQLAlchemy
```python
# 替换 backend/app/db/session.py
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker

# 异步数据库引擎
async_engine = create_async_engine(
    "postgresql+asyncpg://user:pass@host:port/db",
    pool_pre_ping=True,
    echo=settings.DB_ECHO
)

AsyncSessionLocal = async_sessionmaker(
    async_engine,
    class_=AsyncSession,
    expire_on_commit=False
)

async def get_async_db() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
```

#### 1.2 更新模型查询
```python
# 异步查询示例
async def get_user_by_email(db: AsyncSession, email: str) -> User | None:
    result = await db.execute(
        select(User).where(User.email == email)
    )
    return result.scalar_one_or_none()
```

### 2. API端点异步化

#### 2.1 认证端点
```python
# backend/app/api/endpoints/auth.py
@router.post("/login", response_model=Token)
async def login_access_token(
    *,
    db: AsyncSession = Depends(get_async_db),
    form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    user = await authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=400, 
            detail="用户名或密码错误"
        )
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = await create_access_token(
        user.id, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
    }
```

#### 2.2 用户管理端点
```python
# backend/app/api/endpoints/users.py
@router.get("/", response_model=list[UserResponse])
async def read_users(
    db: AsyncSession = Depends(get_async_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_active_superuser),
) -> Any:
    result = await db.execute(
        select(User).offset(skip).limit(limit)
    )
    users = result.scalars().all()
    return users
```

### 3. 依赖注入异步化

#### 3.1 异步用户认证
```python
# backend/app/api/deps.py
async def get_current_user(
    db: AsyncSession = Depends(get_async_db),
    token: str | None = Depends(oauth2_scheme)
) -> User:
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="未提供认证令牌"
        )
    
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        token_data = TokenPayload(**payload)
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="无效的认证令牌"
        )
    
    # 异步查询用户
    result = await db.execute(
        select(User).where(User.id == token_data.sub)
    )
    user = result.scalar_one_or_none()
    
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="用户不存在"
        )
    
    return user
```

### 4. 安全模块异步化

#### 4.1 异步令牌创建
```python
# backend/app/core/security.py
async def create_access_token(
    subject: str | Any, 
    expires_delta: timedelta | None = None
) -> str:
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    
    jti = secrets.token_urlsafe(32)
    
    to_encode = {
        "exp": expire,
        "sub": str(subject),
        "type": "access",
        "jti": jti,
        "iat": datetime.now(timezone.utc)
    }
    
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)
    
    # 异步缓存令牌
    await cache_user_token(encoded_jwt, subject, expires_delta.total_seconds())
    
    return encoded_jwt

async def authenticate_user(
    db: AsyncSession, 
    username: str, 
    password: str
) -> User | None:
    result = await db.execute(
        select(User).where(
            or_(
                User.username == username,
                User.email == username,
                User.phone == username
            )
        )
    )
    user = result.scalar_one_or_none()
    
    if not user or not verify_password(password, user.hashed_password):
        return None
    
    return user
```

## 实施步骤

### 阶段1：基础设施升级
1. 安装异步数据库驱动：`asyncpg`
2. 升级SQLAlchemy到2.0+异步版本
3. 更新数据库连接配置

### 阶段2：核心模块异步化
1. 异步化数据库会话管理
2. 异步化用户认证和授权
3. 异步化安全模块

### 阶段3：API端点迁移
1. 逐个迁移API端点到异步
2. 更新所有数据库查询
3. 测试异步性能

### 阶段4：优化和测试
1. 性能基准测试
2. 并发压力测试
3. 错误处理优化

## 预期收益

### 性能提升
- **并发处理能力**：提升3-5倍
- **响应时间**：减少20-40%
- **资源利用率**：提升30-50%

### 架构优势
- **统一异步模型**：消除同步/异步混合的复杂性
- **更好的可扩展性**：支持更高并发
- **现代化架构**：符合FastAPI最佳实践

## 风险评估

### 技术风险
- **学习曲线**：团队需要熟悉异步编程
- **调试复杂性**：异步代码调试相对困难
- **第三方库兼容性**：确保所有依赖支持异步

### 缓解措施
- **渐进式迁移**：分阶段实施，降低风险
- **充分测试**：每个阶段都进行全面测试
- **回滚计划**：保留同步版本作为备份

## 总结

当前项目采用了**混合架构**（部分异步 + 部分同步），建议全面升级为**纯异步架构**以获得更好的性能和一致性。这个优化将显著提升系统的并发处理能力和响应速度。