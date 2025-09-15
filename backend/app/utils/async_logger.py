# -*- coding: utf-8 -*-
"""
异步日志处理器
实现日志的异步记录和批量写入功能
"""
import asyncio
import logging
import queue
import threading
from datetime import datetime
from typing import Dict, Any, Optional, List, Tuple, Type
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.config import settings
from ..models.log import SystemLog, UserActivity, ApiLog
from ..db.session import get_async_db, AsyncSessionLocal
from .async_utils import async_with_error_handling

logger = logging.getLogger(__name__)

# 定义日志优先级映射
LOG_LEVEL_PRIORITY = {
    "DEBUG": 10,
    "INFO": 20,
    "WARNING": 30,
    "ERROR": 40,
    "CRITICAL": 50
}


class AsyncLogger:
    """异步日志处理器，负责异步处理和批量写入日志"""
    _instance = None
    _lock = threading.Lock()
    
    # 日志队列
    def __init__(self):
        """初始化异步日志处理器"""
        # 创建日志队列
        # 使用默认队列大小，因为settings中没有LOG_QUEUE_SIZE配置
        self._system_log_queue = queue.Queue(maxsize=1000)
        self._activity_log_queue = queue.Queue(maxsize=1000)
        self._api_log_queue = queue.Queue(maxsize=1000)
        
        # 创建工作线程和停止事件
        self._worker_thread = None
        self._stop_event = threading.Event()
        
        # 初始化一个专用的事件循环
        self._loop = None
        
        # 立即初始化
        self._initialize()
        
    def _initialize(self):
        """初始化异步日志处理器"""
        # 启动工作线程
        if not self._worker_thread or not self._worker_thread.is_alive():
            self._stop_event.clear()
            self._worker_thread = threading.Thread(target=self._process_logs, daemon=True)
            self._worker_thread.start()
    
    def _process_logs(self):
        """处理日志队列，批量写入数据库"""
        # 为工作线程创建专用的事件循环
        if self._loop is None:
            self._loop = asyncio.new_event_loop()
            asyncio.set_event_loop(self._loop)
            
            # 导入AsyncSessionLocal以确保在正确的线程中初始化
            global AsyncSessionLocal
            from ..db.session import AsyncSessionLocal
        
        while not self._stop_event.is_set():
            try:
                # 收集一批日志
                logs_to_process = self._collect_logs()
                
                # 如果有日志需要处理，则异步写入数据库
                if any(logs_to_process.values()):  # 检查是否有任何类型的日志需要处理
                    # 使用专用的事件循环
                    self._loop.run_until_complete(self._write_logs_to_db(logs_to_process))
                
                # 等待一段时间或直到队列中有新的日志
                self._stop_event.wait(settings.LOG_FLUSH_INTERVAL)
            except Exception as e:
                logger.error(f"处理日志失败: {e}")
                # 短暂暂停后继续，避免在错误状态下无限循环
                self._stop_event.wait(1.0)
                
    @async_with_error_handling(
        log_type="LOGGER_ERROR",
        log_message="日志写入数据库失败",
        raise_exception=False
    )
    async def _write_logs_to_db(self, logs: Dict[str, List[Dict[str, Any]]]):
        """异步将日志批量写入数据库"""
        # 确保在当前线程的事件循环中直接创建数据库会话
        # 避免使用异步生成器，防止跨事件循环问题
        session = None
        try:
            # 直接创建会话，不通过异步生成器
            if AsyncSessionLocal is None:
                logger.error("异步数据库会话不可用，请安装asyncpg")
                return
                
            session = AsyncSessionLocal()
            
            # 写入系统日志
            if logs["system"]:
                system_logs = []
                for log_data in logs["system"]:
                    try:
                        system_logs.append(SystemLog(**log_data))
                    except Exception as e:
                        logger.error(f"创建系统日志记录失败: {e}, 数据: {log_data}")
                if system_logs:
                    session.add_all(system_logs)
                    await session.flush()
            
            # 写入用户活动日志
            if logs["activity"]:
                activity_logs = []
                for log_data in logs["activity"]:
                    try:
                        activity_logs.append(UserActivity(**log_data))
                    except Exception as e:
                        logger.error(f"创建活动日志记录失败: {e}, 数据: {log_data}")
                if activity_logs:
                    session.add_all(activity_logs)
                    await session.flush()
            
            # 写入API日志
            if logs["api"]:
                api_logs = []
                for log_data in logs["api"]:
                    try:
                        api_logs.append(ApiLog(**log_data))
                    except Exception as e:
                        logger.error(f"创建API日志记录失败: {e}, 数据: {log_data}")
                if api_logs:
                    session.add_all(api_logs)
                    await session.flush()
            
            # 提交事务
            await session.commit()
            
            logger.debug(f"批量写入日志成功: system={len(logs['system'])}, activity={len(logs['activity'])}, api={len(logs['api'])}")
            
        except Exception as e:
            logger.error(f"批量写入日志失败: {e}")
            if session:
                try:
                    await session.rollback()
                except Exception as rollback_err:
                    logger.error(f"事务回滚失败: {rollback_err}")
        finally:
            # 确保会话被关闭
            if session:
                try:
                    await session.close()
                except Exception as close_err:
                    logger.error(f"数据库会话关闭失败: {close_err}")
    
    def _collect_logs(self) -> Dict[str, List[Dict[str, Any]]]:
        """从队列中收集日志，直到达到批处理大小"""
        collected_logs = {
            "system": [],
            "activity": [],
            "api": []
        }
        
        # 收集系统日志
        while len(collected_logs["system"]) < settings.LOG_BATCH_SIZE:
            try:
                log_data = self._system_log_queue.get_nowait()
                collected_logs["system"].append(log_data)
                self._system_log_queue.task_done()
            except queue.Empty:
                break
        
        # 收集用户活动日志
        while len(collected_logs["activity"]) < settings.LOG_BATCH_SIZE:
            try:
                log_data = self._activity_log_queue.get_nowait()
                collected_logs["activity"].append(log_data)
                self._activity_log_queue.task_done()
            except queue.Empty:
                break
        
        # 收集API日志
        while len(collected_logs["api"]) < settings.LOG_BATCH_SIZE:
            try:
                log_data = self._api_log_queue.get_nowait()
                collected_logs["api"].append(log_data)
                self._api_log_queue.task_done()
            except queue.Empty:
                break
        
        return collected_logs
    

    
    def _should_log(self, log_level: str, configured_level: str) -> bool:
        """检查是否应该记录此级别的日志"""
        return LOG_LEVEL_PRIORITY.get(log_level, 20) >= LOG_LEVEL_PRIORITY.get(configured_level, 20)
    
    def log_system(self,
                  log_type: str,
                  level: str = "INFO",
                  message: str = "",
                  details: Optional[Dict[str, Any]] = None,
                  user_id: Optional[int] = None,
                  ip_address: Optional[str] = None,
                  user_agent: Optional[str] = None,
                  request_path: Optional[str] = None,
                  full_path: Optional[str] = None,
                  http_method: Optional[str] = None,
                  status_code: Optional[int] = None,
                  response_time: Optional[int] = None,
                  session_id: Optional[str] = None):
        """记录系统日志"""
        # 检查日志级别
        if not self._should_log(level, settings.SYSTEM_LOG_LEVEL):
            return False
        
        # 构建日志数据
        log_details = details or {}
        if full_path:
            log_details['full_path'] = full_path
        
        log_data = {
            "log_type": log_type,
            "level": level,
            "message": message,
            "details": log_details,
            "user_id": user_id,
            "ip_address": ip_address,
            "user_agent": user_agent,
            "request_path": request_path,
            "http_method": http_method,
            "status_code": status_code,
            "response_time": response_time,
            "session_id": session_id,
            "created_at": datetime.utcnow()
        }
        
        # 将日志放入队列
        try:
            self._system_log_queue.put(log_data, block=False)
            return True
        except queue.Full:
            logger.error("系统日志队列已满")
            return False
    
    def log_activity(self,
                    user_id: int,
                    activity_type: str,
                    description: str = "",
                    details: Optional[Dict[str, Any]] = None,
                    ip_address: Optional[str] = None,
                    user_agent: Optional[str] = None,
                    session_id: Optional[str] = None):
        """记录用户活动日志"""
        # 检查日志级别
        if not self._should_log("INFO", settings.ACTIVITY_LOG_LEVEL):
            return False
        
        # 构建日志数据
        log_data = {
            "user_id": user_id,
            "activity_type": activity_type,
            "description": description,
            "details": details or {},
            "ip_address": ip_address,
            "user_agent": user_agent,
            "session_id": session_id,
            "created_at": datetime.utcnow()
        }
        
        # 将日志放入队列
        try:
            self._activity_log_queue.put(log_data, block=False)
            return True
        except queue.Full:
            logger.error("活动日志队列已满")
            return False
    
    def log_api(self,
               method: str,
               path: str,
               status_code: int,
               response_time: float,
               user_id: Optional[int] = None,
               ip_address: Optional[str] = None,
               user_agent: Optional[str] = None,
               request_data: Optional[Dict[str, Any]] = None,
               error_message: Optional[str] = None,
               full_path: Optional[str] = None):
        """记录API请求日志"""
        # 检查日志级别
        if not self._should_log("INFO", settings.API_LOG_LEVEL):
            return False
        
        # 构建日志数据
        log_details = {}
        if full_path:
            log_details['full_path'] = full_path
        
        log_data = {
            "method": method,
            "path": path,
            "status_code": status_code,
            "response_time": response_time,
            "user_id": user_id,
            "ip_address": ip_address,
            "user_agent": user_agent,
            "request_data": request_data or {},
            "error_message": error_message,
            "details": log_details,
            "created_at": datetime.utcnow()
        }
        
        # 将日志放入队列
        try:
            self._api_log_queue.put(log_data, block=False)
            return True
        except queue.Full:
            logger.error("API日志队列已满")
            return False
    
    def shutdown(self):
        """关闭异步日志处理器"""
        self._stop_event.set()
        if self._worker_thread:
            self._worker_thread.join(timeout=5.0)
        
        # 关闭专用的事件循环
        if hasattr(self, '_loop') and self._loop:
            if not self._loop.is_closed():
                self._loop.call_soon_threadsafe(self._loop.stop)
                self._loop.run_until_complete(self._loop.shutdown_asyncgens())
                self._loop.close()
                self._loop = None


# 创建全局异步日志处理器实例
async_logger = AsyncLogger()


# 为了方便使用，提供一些快捷函数
def log_system(*args, **kwargs):
    """快捷记录系统日志"""
    return async_logger.log_system(*args, **kwargs)

def log_activity(*args, **kwargs):
    """快捷记录用户活动日志"""
    return async_logger.log_activity(*args, **kwargs)

def log_api(*args, **kwargs):
    """快捷记录API请求日志"""
    return async_logger.log_api(*args, **kwargs)


def ensure_async_logger_shutdown():
    """确保异步日志处理器在程序退出前关闭"""
    if async_logger._worker_thread and async_logger._worker_thread.is_alive():
        async_logger.shutdown()
        logger.info("异步日志处理器已关闭")
    
    # 确保事件循环被正确关闭
    if hasattr(async_logger, '_loop') and async_logger._loop:
        if not async_logger._loop.is_closed():
            try:
                async_logger._loop.call_soon_threadsafe(async_logger._loop.stop)
                async_logger._loop.close()
                async_logger._loop = None
            except Exception as e:
                logger.error(f"关闭事件循环失败: {e}")


# 注册程序退出时的清理函数
import atexit
exit_code = atexit.register(ensure_async_logger_shutdown)