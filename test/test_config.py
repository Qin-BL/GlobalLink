#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
测试配置模块
集中管理所有测试相关的配置项，避免硬编码
"""
import os
from typing import Optional

class TestConfig:
    """测试配置类"""
    # 服务器配置
    TEST_SERVER: str = os.environ.get("TEST_SERVER", "localhost")
    TEST_PORT: str = os.environ.get("TEST_PORT", "8000")
    BASE_URL: str = os.environ.get("TEST_BASE_URL", f"http://{TEST_SERVER}:{TEST_PORT}")
    
    # SSH连接配置
    SSH_HOST: str = os.environ.get("SSH_HOST", "47.108.76.21")
    SSH_KEY: str = os.environ.get("SSH_KEY", "~/Desktop/global_link47.108.76.21.pem")
    SSH_USERNAME: str = os.environ.get("SSH_USERNAME", "ubuntu")
    
    # 测试账号配置
    TEST_EMAIL: str = os.environ.get("TEST_EMAIL", "15010993510@163.com")
    TEST_PASSWORD: str = os.environ.get("TEST_PASSWORD", "12345678")
    
    # 测试设置
    TIMEOUT: int = int(os.environ.get("TEST_TIMEOUT", "30"))
    RETRY_COUNT: int = int(os.environ.get("TEST_RETRY_COUNT", "3"))
    
    @classmethod
    def get_base_url(cls, custom_port: Optional[str] = None) -> str:
        """获取基础URL，可选择自定义端口"""
        if custom_port:
            return f"http://{cls.TEST_SERVER}:{custom_port}"
        return cls.BASE_URL

# 创建全局配置实例
test_config = TestConfig()