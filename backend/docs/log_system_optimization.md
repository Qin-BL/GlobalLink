# 日志系统优化说明

本文档描述了对GlobalLink项目日志系统的优化实现，包括异步日志记录、批量写入、日志级别控制和日志表分区功能。

## 功能概述

我们实现了以下四个关键优化点：
1. **异步日志记录** - 避免日志记录阻塞主业务流程
2. **批量写入** - 减少数据库交互次数，提高性能
3. **日志级别控制** - 灵活控制不同类型日志的记录粒度
4. **日志表分区** - 通过表分区提高查询性能和管理效率

## 配置说明

所有日志系统相关配置项都位于`app/core/config.py`文件中：

```python
# 日志系统配置
# 异步日志记录开关
ASYNC_LOGGING_ENABLED: bool = True
# 批量写入配置
LOG_BATCH_SIZE: int = 50  # 批量写入的日志数量阈值
LOG_FLUSH_INTERVAL: int = 5  # 日志刷新间隔（秒）
# 日志级别控制
LOG_LEVEL: str = "INFO"  # DEBUG, INFO, WARNING, ERROR, CRITICAL
# 各类型日志的记录级别
SYSTEM_LOG_LEVEL: str = "WARNING"  # 系统日志记录级别
API_LOG_LEVEL: str = "INFO"  # API日志记录级别
ACTIVITY_LOG_LEVEL: str = "INFO"  # 用户活动日志记录级别
```

### 配置项说明

- **ASYNC_LOGGING_ENABLED**: 是否启用异步日志记录
  - `True`: 使用异步方式记录日志，不会阻塞主业务流程
  - `False`: 使用传统同步方式记录日志

- **LOG_BATCH_SIZE**: 批量写入的日志数量阈值
  - 当日志队列中的日志数量达到此值时，会触发批量写入操作
  - 默认值: 50

- **LOG_FLUSH_INTERVAL**: 日志刷新间隔（单位：秒）
  - 即使未达到批量写入阈值，也会定期刷新日志队列
  - 默认值: 5秒

- **LOG_LEVEL**: 全局日志级别
  - 可选值: DEBUG, INFO, WARNING, ERROR, CRITICAL
  - 默认值: INFO

- **SYSTEM_LOG_LEVEL**: 系统日志记录级别
  - 可选值: DEBUG, INFO, WARNING, ERROR, CRITICAL
  - 默认值: WARNING

- **API_LOG_LEVEL**: API请求日志记录级别
  - 可选值: DEBUG, INFO, WARNING, ERROR, CRITICAL
  - 默认值: INFO

- **ACTIVITY_LOG_LEVEL**: 用户活动日志记录级别
  - 可选值: DEBUG, INFO, WARNING, ERROR, CRITICAL
  - 默认值: INFO

## 核心组件

### 异步日志处理器

我们创建了新的异步日志处理器模块`app/utils/async_logger.py`，它实现了：
- 基于线程和队列的异步日志处理机制
- 批量写入数据库功能
- 日志级别过滤功能
- 优雅关闭机制

### 修改后的日志记录工具

我们修改了现有的`app/utils/activity_logger.py`，使其：
- 支持根据配置自动切换同步/异步日志记录模式
- 提供降级机制，确保在异步记录失败时能够回退到同步记录

### 修改后的日志中间件

我们更新了两个日志中间件：
1. `app/middleware/logging.py` - 支持异步记录系统日志
2. `app/middleware/api_logger.py` - 支持异步记录API请求日志

这两个中间件现在都能够：
- 自动提取用户信息、IP地址等上下文信息
- 根据响应状态码动态调整日志级别
- 使用我们的异步日志处理器记录日志

## 日志表分区实现

我们创建了Alembic迁移脚本`alembic/versions/2023_11_15_000000_add_log_table_partitioning.py`，实现了：

### 分区策略

- 所有日志表（system_logs、user_activities、api_logs）都按`created_at`字段进行**按月分区**
- 使用自动分区触发器，在插入数据时自动创建相应月份的分区
- 分区命名格式为`{table_name}_{YYYY_MM}`，例如：`api_logs_2023_11`

### 分区管理功能

- 创建了`cleanup_old_log_partitions`函数，用于清理指定天数前的日志分区
- 配置了每月定时任务，自动清理90天前的旧日志分区

## 如何应用日志表分区

要应用日志表分区，需要运行Alembic迁移：

```bash
# 在backend目录下执行
alembic upgrade head
```

**注意**: 迁移过程会删除现有的日志表并重建为分区表。如果需要保留现有日志数据，请先备份数据。

## 手动管理日志分区

### 查看现有分区

```sql
-- 查看system_logs的所有分区
SELECT c.relname
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
JOIN pg_inherits i ON c.oid = i.inhrelid
JOIN pg_class p ON p.oid = i.inhparent
WHERE p.relname = 'system_logs' AND n.nspname = 'public';

-- 查看user_activities的所有分区
SELECT c.relname
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
JOIN pg_inherits i ON c.oid = i.inhrelid
JOIN pg_class p ON p.oid = i.inhparent
WHERE p.relname = 'user_activities' AND n.nspname = 'public';

-- 查看api_logs的所有分区
SELECT c.relname
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
JOIN pg_inherits i ON c.oid = i.inhrelid
JOIN pg_class p ON p.oid = i.inhparent
WHERE p.relname = 'api_logs' AND n.nspname = 'public';
```

### 手动清理旧日志

```sql
-- 清理180天前的日志分区
SELECT cleanup_old_log_partitions(180);
```

## 性能优化建议

除了我们已实现的优化外，还可以考虑以下措施进一步提高日志系统的性能：

1. **监控日志队列状态** - 定期检查日志队列是否有积压现象
2. **调整批量写入参数** - 根据系统负载和日志量调整`LOG_BATCH_SIZE`和`LOG_FLUSH_INTERVAL`
3. **优化日志查询** - 使用分区键作为查询条件可以显著提高查询性能
4. **考虑使用专用日志存储** - 对于大规模应用，可以考虑使用ELK等专用日志系统

## 故障排查

### 异步日志未写入数据库

如果发现异步日志未写入数据库，可以：
1. 检查配置文件中的`ASYNC_LOGGING_ENABLED`是否设置为`True`
2. 查看应用日志，检查是否有`记录XXX失败`之类的错误信息
3. 临时将`ASYNC_LOGGING_ENABLED`设置为`False`，切换回同步模式进行排查

### 分区表未自动创建

如果发现分区表未自动创建，可以：
1. 检查数据库触发器是否存在：`SELECT * FROM pg_trigger WHERE tgname LIKE 'trigger_create_%';`
2. 手动创建分区：`CREATE TABLE api_logs_2023_11 PARTITION OF api_logs FOR VALUES FROM ('2023-11-01') TO ('2023-12-01');`

## 注意事项

1. 日志系统优化可能会导致日志记录与实际操作之间有短暂延迟（特别是使用异步模式时）
2. 在高并发环境下，可能需要增加`LOG_BATCH_SIZE`以减少数据库连接次数
3. 使用分区表后，备份和恢复策略可能需要相应调整
4. 定时清理任务依赖于`pg_cron`扩展，如果未安装，需要手动执行清理函数

## 联系方式

如有任何问题或建议，请联系系统管理员。