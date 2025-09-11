"""
为日志表添加分区功能

Revision ID: 2023_11_15_000000
Revises: 
Create Date: 2023-11-15 00:00:00.000000

"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '2023_11_15_000000'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # 为 system_logs 表添加分区
    # 1. 创建主表
    op.execute("""
    -- 删除原表（如果存在）
    DROP TABLE IF EXISTS system_logs;
    
    -- 创建分区表（主表）
    CREATE TABLE system_logs (
        id BIGSERIAL NOT NULL,
        log_type VARCHAR(50) NOT NULL,
        level VARCHAR(20) NOT NULL,
        message TEXT NOT NULL,
        details JSONB,
        user_id INTEGER,
        ip_address VARCHAR(50),
        user_agent TEXT,
        request_path VARCHAR(255),
        http_method VARCHAR(10),
        status_code INTEGER,
        response_time INTEGER,
        session_id VARCHAR(100),
        created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL
    ) PARTITION BY RANGE (created_at);
    
    -- 添加主键
    ALTER TABLE system_logs ADD CONSTRAINT system_logs_pkey PRIMARY KEY (id, created_at);
    
    -- 创建索引
    CREATE INDEX idx_system_logs_created_at ON system_logs USING btree (created_at);
    CREATE INDEX idx_system_logs_user_id ON system_logs USING btree (user_id);
    CREATE INDEX idx_system_logs_level ON system_logs USING btree (level);
    
    -- 创建默认分区（用于存储不属于任何范围的记录）
    CREATE TABLE system_logs_default PARTITION OF system_logs DEFAULT;
    
    -- 创建按月份分区的函数
    CREATE OR REPLACE FUNCTION create_system_logs_partition()
    RETURNS TRIGGER AS $$
    DECLARE
        partition_name TEXT;
        partition_start TIMESTAMP;
        partition_end TIMESTAMP;
    BEGIN
        -- 根据 created_at 计算分区名称和范围
        partition_start := date_trunc('month', NEW.created_at);
        partition_end := partition_start + INTERVAL '1 month';
        partition_name := 'system_logs_' || TO_CHAR(partition_start, 'YYYY_MM');
        
        -- 检查分区是否已存在
        IF NOT EXISTS (
            SELECT 1
            FROM pg_class c
            JOIN pg_namespace n ON n.oid = c.relnamespace
            WHERE c.relname = partition_name
            AND n.nspname = 'public'
            AND c.relkind = 'r'
        ) THEN
            -- 创建新分区
            EXECUTE format(
                'CREATE TABLE IF NOT EXISTS %I PARTITION OF system_logs
                 FOR VALUES FROM (%L) TO (%L)',
                partition_name, partition_start, partition_end
            );
            
            -- 复制索引
            EXECUTE format('CREATE INDEX %I ON %I USING btree (user_id)', 'idx_' || partition_name || '_user_id', partition_name);
            EXECUTE format('CREATE INDEX %I ON %I USING btree (level)', 'idx_' || partition_name || '_level', partition_name);
        END IF;
        
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    
    -- 创建触发器，在插入数据时自动创建分区
    CREATE TRIGGER trigger_create_system_logs_partition
    BEFORE INSERT ON system_logs
    FOR EACH ROW EXECUTE FUNCTION create_system_logs_partition();
    """)
    
    # 为 user_activities 表添加分区
    op.execute("""
    -- 删除原表（如果存在）
    DROP TABLE IF EXISTS user_activities;
    
    -- 创建分区表（主表）
    CREATE TABLE user_activities (
        id BIGSERIAL NOT NULL,
        user_id INTEGER NOT NULL,
        action VARCHAR(100) NOT NULL,
        details JSONB,
        ip_address VARCHAR(50),
        user_agent TEXT,
        created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL
    ) PARTITION BY RANGE (created_at);
    
    -- 添加主键
    ALTER TABLE user_activities ADD CONSTRAINT user_activities_pkey PRIMARY KEY (id, created_at);
    
    -- 创建索引
    CREATE INDEX idx_user_activities_created_at ON user_activities USING btree (created_at);
    CREATE INDEX idx_user_activities_user_id ON user_activities USING btree (user_id);
    CREATE INDEX idx_user_activities_action ON user_activities USING btree (action);
    
    -- 创建默认分区
    CREATE TABLE user_activities_default PARTITION OF user_activities DEFAULT;
    
    -- 创建按月份分区的函数
    CREATE OR REPLACE FUNCTION create_user_activities_partition()
    RETURNS TRIGGER AS $$
    DECLARE
        partition_name TEXT;
        partition_start TIMESTAMP;
        partition_end TIMESTAMP;
    BEGIN
        partition_start := date_trunc('month', NEW.created_at);
        partition_end := partition_start + INTERVAL '1 month';
        partition_name := 'user_activities_' || TO_CHAR(partition_start, 'YYYY_MM');
        
        IF NOT EXISTS (
            SELECT 1
            FROM pg_class c
            JOIN pg_namespace n ON n.oid = c.relnamespace
            WHERE c.relname = partition_name
            AND n.nspname = 'public'
            AND c.relkind = 'r'
        ) THEN
            EXECUTE format(
                'CREATE TABLE IF NOT EXISTS %I PARTITION OF user_activities
                 FOR VALUES FROM (%L) TO (%L)',
                partition_name, partition_start, partition_end
            );
            
            EXECUTE format('CREATE INDEX %I ON %I USING btree (user_id)', 'idx_' || partition_name || '_user_id', partition_name);
            EXECUTE format('CREATE INDEX %I ON %I USING btree (action)', 'idx_' || partition_name || '_action', partition_name);
        END IF;
        
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    
    -- 创建触发器
    CREATE TRIGGER trigger_create_user_activities_partition
    BEFORE INSERT ON user_activities
    FOR EACH ROW EXECUTE FUNCTION create_user_activities_partition();
    """)
    
    # 为 api_logs 表添加分区
    op.execute("""
    -- 删除原表（如果存在）
    DROP TABLE IF EXISTS api_logs;
    
    -- 创建分区表（主表）
    CREATE TABLE api_logs (
        id BIGSERIAL NOT NULL,
        method VARCHAR(10) NOT NULL,
        path VARCHAR(255) NOT NULL,
        status_code INTEGER NOT NULL,
        response_time DOUBLE PRECISION NOT NULL,
        user_id INTEGER,
        ip_address VARCHAR(50),
        user_agent TEXT,
        request_data JSONB,
        created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL
    ) PARTITION BY RANGE (created_at);
    
    -- 添加主键
    ALTER TABLE api_logs ADD CONSTRAINT api_logs_pkey PRIMARY KEY (id, created_at);
    
    -- 创建索引
    CREATE INDEX idx_api_logs_created_at ON api_logs USING btree (created_at);
    CREATE INDEX idx_api_logs_user_id ON api_logs USING btree (user_id);
    CREATE INDEX idx_api_logs_path ON api_logs USING btree (path);
    CREATE INDEX idx_api_logs_status_code ON api_logs USING btree (status_code);
    
    -- 创建默认分区
    CREATE TABLE api_logs_default PARTITION OF api_logs DEFAULT;
    
    -- 创建按月份分区的函数
    CREATE OR REPLACE FUNCTION create_api_logs_partition()
    RETURNS TRIGGER AS $$
    DECLARE
        partition_name TEXT;
        partition_start TIMESTAMP;
        partition_end TIMESTAMP;
    BEGIN
        partition_start := date_trunc('month', NEW.created_at);
        partition_end := partition_start + INTERVAL '1 month';
        partition_name := 'api_logs_' || TO_CHAR(partition_start, 'YYYY_MM');
        
        IF NOT EXISTS (
            SELECT 1
            FROM pg_class c
            JOIN pg_namespace n ON n.oid = c.relnamespace
            WHERE c.relname = partition_name
            AND n.nspname = 'public'
            AND c.relkind = 'r'
        ) THEN
            EXECUTE format(
                'CREATE TABLE IF NOT EXISTS %I PARTITION OF api_logs
                 FOR VALUES FROM (%L) TO (%L)',
                partition_name, partition_start, partition_end
            );
            
            EXECUTE format('CREATE INDEX %I ON %I USING btree (user_id)', 'idx_' || partition_name || '_user_id', partition_name);
            EXECUTE format('CREATE INDEX %I ON %I USING btree (path)', 'idx_' || partition_name || '_path', partition_name);
            EXECUTE format('CREATE INDEX %I ON %I USING btree (status_code)', 'idx_' || partition_name || '_status_code', partition_name);
        END IF;
        
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    
    -- 创建触发器
    CREATE TRIGGER trigger_create_api_logs_partition
    BEFORE INSERT ON api_logs
    FOR EACH ROW EXECUTE FUNCTION create_api_logs_partition();
    """)
    
    # 创建分区管理相关的函数
    op.execute("""
    -- 创建清理旧日志分区的函数
    CREATE OR REPLACE FUNCTION cleanup_old_log_partitions(retention_days INTEGER DEFAULT 90)
    RETURNS INTEGER AS $$
    DECLARE
        dropped_count INTEGER := 0;
        cutoff_date TIMESTAMP := CURRENT_TIMESTAMP - retention_days * INTERVAL '1 day';
        partition_info RECORD;
    BEGIN
        -- 清理 system_logs 分区
        FOR partition_info IN (
            SELECT c.relname
            FROM pg_class c
            JOIN pg_namespace n ON n.oid = c.relnamespace
            JOIN pg_inherits i ON c.oid = i.inhrelid
            JOIN pg_class p ON p.oid = i.inhparent
            WHERE p.relname = 'system_logs'
            AND n.nspname = 'public'
            AND c.relname != 'system_logs_default'
            AND substring(c.relname FROM 'system_logs_(\d{4}_\d{2})') IS NOT NULL
            AND to_timestamp(substring(c.relname FROM 'system_logs_(\d{4}_\d{2})'), 'YYYY_MM') < date_trunc('month', cutoff_date)
        ) LOOP
            EXECUTE format('DROP TABLE IF EXISTS %I', partition_info.relname);
            dropped_count := dropped_count + 1;
        END LOOP;
        
        -- 清理 user_activities 分区
        FOR partition_info IN (
            SELECT c.relname
            FROM pg_class c
            JOIN pg_namespace n ON n.oid = c.relnamespace
            JOIN pg_inherits i ON c.oid = i.inhrelid
            JOIN pg_class p ON p.oid = i.inhparent
            WHERE p.relname = 'user_activities'
            AND n.nspname = 'public'
            AND c.relname != 'user_activities_default'
            AND substring(c.relname FROM 'user_activities_(\d{4}_\d{2})') IS NOT NULL
            AND to_timestamp(substring(c.relname FROM 'user_activities_(\d{4}_\d{2})'), 'YYYY_MM') < date_trunc('month', cutoff_date)
        ) LOOP
            EXECUTE format('DROP TABLE IF EXISTS %I', partition_info.relname);
            dropped_count := dropped_count + 1;
        END LOOP;
        
        -- 清理 api_logs 分区
        FOR partition_info IN (
            SELECT c.relname
            FROM pg_class c
            JOIN pg_namespace n ON n.oid = c.relnamespace
            JOIN pg_inherits i ON c.oid = i.inhrelid
            JOIN pg_class p ON p.oid = i.inhparent
            WHERE p.relname = 'api_logs'
            AND n.nspname = 'public'
            AND c.relname != 'api_logs_default'
            AND substring(c.relname FROM 'api_logs_(\d{4}_\d{2})') IS NOT NULL
            AND to_timestamp(substring(c.relname FROM 'api_logs_(\d{4}_\d{2})'), 'YYYY_MM') < date_trunc('month', cutoff_date)
        ) LOOP
            EXECUTE format('DROP TABLE IF EXISTS %I', partition_info.relname);
            dropped_count := dropped_count + 1;
        END LOOP;
        
        RETURN dropped_count;
    END;
    $$ LANGUAGE plpgsql;
    """)
    
    # 创建定时任务，定期清理旧日志
    op.execute("""
    -- 创建定时任务，每月第一天凌晨1点清理90天前的日志分区
    CREATE EXTENSION IF NOT EXISTS pg_cron;
    
    -- 配置定时任务
    SELECT cron.schedule(
        'cleanup-old-logs',
        '0 1 1 * *', -- 每月第一天凌晨1点
        'SELECT cleanup_old_log_partitions(90);'
    );
    """)

def downgrade():
    # 移除定时任务
    op.execute("""
    SELECT cron.unschedule('cleanup-old-logs');
    """)
    
    # 删除清理旧日志的函数
    op.execute("""
    DROP FUNCTION IF EXISTS cleanup_old_log_partitions;
    """)
    
    # 恢复 system_logs 表为普通表
    op.execute("""
    -- 创建普通表
    CREATE TABLE system_logs_old (
        id BIGSERIAL NOT NULL,
        log_type VARCHAR(50) NOT NULL,
        level VARCHAR(20) NOT NULL,
        message TEXT NOT NULL,
        details JSONB,
        user_id INTEGER,
        ip_address VARCHAR(50),
        user_agent TEXT,
        request_path VARCHAR(255),
        http_method VARCHAR(10),
        status_code INTEGER,
        response_time INTEGER,
        session_id VARCHAR(100),
        created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
        PRIMARY KEY (id)
    );
    
    -- 复制数据（如果分区表存在）
    DO $$
    BEGIN
        IF EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_name = 'system_logs'
        ) THEN
            EXECUTE 'INSERT INTO system_logs_old SELECT * FROM system_logs';
        END IF;
    END $$;
    
    -- 删除分区表
    DROP TABLE IF EXISTS system_logs;
    
    -- 重命名普通表
    ALTER TABLE system_logs_old RENAME TO system_logs;
    
    -- 重建索引
    CREATE INDEX idx_system_logs_created_at ON system_logs USING btree (created_at);
    CREATE INDEX idx_system_logs_user_id ON system_logs USING btree (user_id);
    CREATE INDEX idx_system_logs_level ON system_logs USING btree (level);
    
    -- 删除分区相关函数和触发器
    DROP FUNCTION IF EXISTS create_system_logs_partition;
    """)
    
    # 恢复 user_activities 表为普通表
    op.execute("""
    CREATE TABLE user_activities_old (
        id BIGSERIAL NOT NULL,
        user_id INTEGER NOT NULL,
        action VARCHAR(100) NOT NULL,
        details JSONB,
        ip_address VARCHAR(50),
        user_agent TEXT,
        created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
        PRIMARY KEY (id)
    );
    
    DO $$
    BEGIN
        IF EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_name = 'user_activities'
        ) THEN
            EXECUTE 'INSERT INTO user_activities_old SELECT * FROM user_activities';
        END IF;
    END $$;
    
    DROP TABLE IF EXISTS user_activities;
    ALTER TABLE user_activities_old RENAME TO user_activities;
    
    CREATE INDEX idx_user_activities_created_at ON user_activities USING btree (created_at);
    CREATE INDEX idx_user_activities_user_id ON user_activities USING btree (user_id);
    CREATE INDEX idx_user_activities_action ON user_activities USING btree (action);
    
    DROP FUNCTION IF EXISTS create_user_activities_partition;
    """)
    
    # 恢复 api_logs 表为普通表
    op.execute("""
    CREATE TABLE api_logs_old (
        id BIGSERIAL NOT NULL,
        method VARCHAR(10) NOT NULL,
        path VARCHAR(255) NOT NULL,
        status_code INTEGER NOT NULL,
        response_time DOUBLE PRECISION NOT NULL,
        user_id INTEGER,
        ip_address VARCHAR(50),
        user_agent TEXT,
        request_data JSONB,
        created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
        PRIMARY KEY (id)
    );
    
    DO $$
    BEGIN
        IF EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_name = 'api_logs'
        ) THEN
            EXECUTE 'INSERT INTO api_logs_old SELECT * FROM api_logs';
        END IF;
    END $$;
    
    DROP TABLE IF EXISTS api_logs;
    ALTER TABLE api_logs_old RENAME TO api_logs;
    
    CREATE INDEX idx_api_logs_created_at ON api_logs USING btree (created_at);
    CREATE INDEX idx_api_logs_user_id ON api_logs USING btree (user_id);
    CREATE INDEX idx_api_logs_path ON api_logs USING btree (path);
    CREATE INDEX idx_api_logs_status_code ON api_logs USING btree (status_code);
    
    DROP FUNCTION IF EXISTS create_api_logs_partition;
    """)