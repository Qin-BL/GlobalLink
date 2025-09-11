# GlobalLink 数据库架构优化总结

## 🎯 优化目标

将原有的三数据库架构（PostgreSQL + MongoDB + Redis）简化为两数据库架构（PostgreSQL + Redis），降低系统复杂度，提高维护效率。

## 📊 优化前后对比

### 优化前
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ PostgreSQL  │    │   MongoDB   │    │    Redis    │
│             │    │             │    │             │
│ • 用户数据  │    │ • API日志   │    │ • 缓存数据  │
│ • 课程数据  │    │ • 用户活动  │    │ • 会话数据  │
│ • 订单数据  │    │ • 系统日志  │    │             │
└─────────────┘    └─────────────┘    └─────────────┘
```

### 优化后
```
┌─────────────────────────────┐    ┌─────────────┐
│        PostgreSQL           │    │    Redis    │
│                             │    │             │
│ • 用户数据                  │    │ • 缓存数据  │
│ • 课程数据                  │    │ • 会话数据  │
│ • 订单数据                  │    │             │
│ • API日志 (新增)            │    │             │
│ • 用户活动日志 (新增)       │    │             │
│ • 系统日志 (新增)           │    │             │
└─────────────────────────────┘    └─────────────┘
```

## 🔧 具体修改内容

### 1. 新增日志模型

创建了三个新的PostgreSQL表来替代MongoDB集合：

#### SystemLog 模型 (`system_logs` 表)
- **用途**: 存储系统级别的日志信息
- **字段**: 日志类型、级别、消息、详细数据、用户信息、请求信息等
- **索引**: log_type, level, user_id, ip_address, request_path, status_code

#### UserActivity 模型 (`user_activities` 表)  
- **用途**: 记录用户行为和活动轨迹
- **字段**: 用户ID、活动类型、描述、详情、IP地址等
- **索引**: user_id, activity_type, ip_address, session_id

#### ApiLog 模型 (`api_logs` 表)
- **用途**: 记录所有API请求和响应信息
- **字段**: 请求路径、方法、参数、状态码、响应时间等
- **索引**: path, method, status_code, user_id, ip_address

### 2. 更新的文件列表

#### 配置文件
- ✅ `backend/app/core/config.py` - 移除MongoDB配置，添加日志配置
- ✅ `docker-compose.yml` - 移除MongoDB服务和相关配置
- ✅ `backend/requirements.txt` - 移除pymongo依赖

#### 模型文件
- ✅ `backend/app/models/log.py` - 新增日志模型
- ✅ `backend/app/models/__init__.py` - 导入新的日志模型

#### 数据库文件
- ✅ `backend/app/db/session.py` - 移除MongoDB连接代码
- ✅ `backend/app/db/init_db.py` - 导入新的日志模型

#### 工具文件
- ✅ `backend/app/utils/activity_logger.py` - 更新为使用PostgreSQL
- ✅ `backend/app/middleware/api_logger.py` - 更新描述

### 3. 功能改进

#### 日志记录函数优化
```python
# 用户活动日志
def log_user_activity(
    user_id: int,
    activity_type: str,
    description: str,
    details: dict = None,
    ip_address: str = None,
    user_agent: str = None,
    session_id: str = None
) -> bool

# API请求日志
def log_api_request(
    path: str,
    method: str,
    status_code: int,
    response_time: float = None,
    user_id: int = None,
    ip_address: str = None,
    user_agent: str = None,
    request_data: dict = None,
    error_message: str = None
) -> bool

# 系统事件日志 (新增)
def log_system_event(
    log_type: str,
    level: str,
    message: str,
    details: dict = None,
    user_id: int = None,
    ip_address: str = None,
    user_agent: str = None,
    session_id: str = None
) -> bool
```

## 💡 优化收益

### 1. 降低复杂度
- **部署简化**: 减少一个数据库服务的部署和配置
- **维护简化**: 只需维护PostgreSQL和Redis两个数据库
- **监控简化**: 减少数据库监控和备份的复杂度

### 2. 提高性能
- **事务一致性**: 所有结构化数据在同一数据库中，支持ACID事务
- **查询效率**: 可以进行跨表JOIN查询，提高数据分析效率
- **索引优化**: PostgreSQL的强大索引功能提升日志查询性能

### 3. 降低成本
- **资源节省**: 减少MongoDB的内存和存储占用
- **许可成本**: 减少一个数据库的许可和支持成本
- **运维成本**: 简化数据库运维工作

### 4. 数据一致性
- **统一存储**: 避免跨数据库的数据一致性问题
- **备份恢复**: 统一的备份和恢复策略
- **数据迁移**: 简化数据迁移和同步工作

## 🔍 性能对比

### MongoDB vs PostgreSQL (日志存储)

| 特性 | MongoDB | PostgreSQL |
|------|---------|------------|
| 写入性能 | 高 | 中高 |
| 查询性能 | 中 | 高 |
| 事务支持 | 有限 | 完整ACID |
| 索引功能 | 好 | 优秀 |
| 聚合查询 | 好 | 优秀 |
| 运维复杂度 | 中 | 低 |
| 数据一致性 | 最终一致 | 强一致 |

### 存储空间对比
- **MongoDB**: JSON文档存储，有一定冗余
- **PostgreSQL**: 关系型存储 + JSON字段，空间效率更高

## 📈 迁移建议

### 1. 数据迁移
如果已有MongoDB数据，可以通过以下步骤迁移：

```python
# 迁移脚本示例
def migrate_mongodb_to_postgresql():
    # 1. 连接MongoDB和PostgreSQL
    mongo_client = MongoClient('mongodb://localhost:27017')
    mongo_db = mongo_client['globallink_logs']
    
    db = SessionLocal()
    
    try:
        # 2. 迁移用户活动数据
        for activity in mongo_db.user_activities.find():
            user_activity = UserActivity(
                user_id=activity['user_id'],
                activity_type=activity['activity_type'],
                description=activity['description'],
                details=activity.get('details', {}),
                ip_address=activity.get('ip_address'),
                user_agent=activity.get('user_agent'),
                created_at=activity['timestamp']
            )
            db.add(user_activity)
        
        # 3. 迁移API日志数据
        for log in mongo_db.api_logs.find():
            api_log = ApiLog(
                path=log['path'],
                method=log['method'],
                status_code=log['status_code'],
                response_time=int(log.get('response_time', 0) * 1000),
                user_id=log.get('user_id'),
                ip_address=log.get('ip_address'),
                user_agent=log.get('user_agent'),
                request_data=log.get('request_data', {}),
                error_message=log.get('error_message'),
                created_at=log['timestamp']
            )
            db.add(api_log)
        
        db.commit()
        print("数据迁移完成")
        
    except Exception as e:
        db.rollback()
        print(f"数据迁移失败: {e}")
    finally:
        db.close()
```

### 2. 渐进式迁移
1. **阶段1**: 双写模式 - 同时写入MongoDB和PostgreSQL
2. **阶段2**: 数据验证 - 确保数据一致性
3. **阶段3**: 切换读取 - 从PostgreSQL读取数据
4. **阶段4**: 停止MongoDB - 完全移除MongoDB

## 🛠️ 运维建议

### 1. PostgreSQL优化
```sql
-- 为日志表创建分区（按时间）
CREATE TABLE system_logs_2024_01 PARTITION OF system_logs
FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

-- 创建索引
CREATE INDEX idx_system_logs_created_at ON system_logs (created_at);
CREATE INDEX idx_system_logs_log_type ON system_logs (log_type);
CREATE INDEX idx_user_activities_user_id ON user_activities (user_id);
CREATE INDEX idx_api_logs_path ON api_logs (path);
```

### 2. 日志清理策略
```python
# 定期清理旧日志
def cleanup_old_logs():
    db = SessionLocal()
    try:
        # 删除30天前的API日志
        cutoff_date = datetime.utcnow() - timedelta(days=30)
        db.query(ApiLog).filter(ApiLog.created_at < cutoff_date).delete()
        
        # 删除90天前的用户活动日志
        cutoff_date = datetime.utcnow() - timedelta(days=90)
        db.query(UserActivity).filter(UserActivity.created_at < cutoff_date).delete()
        
        db.commit()
    finally:
        db.close()
```

### 3. 监控指标
- 日志表大小增长趋势
- 查询性能指标
- 磁盘空间使用情况
- 数据库连接池状态

## 🎉 总结

通过将MongoDB的功能整合到PostgreSQL中，我们实现了：

1. **架构简化**: 从3个数据库减少到2个
2. **维护简化**: 减少运维复杂度
3. **性能提升**: 利用PostgreSQL的强大查询能力
4. **成本降低**: 减少资源占用和运维成本
5. **一致性提升**: 统一的事务和数据一致性保证

这个优化不仅解决了多数据库带来的复杂性问题，还为未来的扩展和维护奠定了更好的基础。PostgreSQL作为一个成熟的关系型数据库，完全能够胜任原本MongoDB承担的日志存储任务，并且提供更好的查询性能和数据一致性保证。