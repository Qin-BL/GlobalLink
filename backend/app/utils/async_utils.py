"""
异步工具函数和装饰器
提供通用的异步模式抽象和工具
"""
import asyncio
import functools
from typing import Any, Callable, Optional, Union, TypeVar, cast

from app.utils.async_logger import log_system

# 定义泛型类型变量
T = TypeVar('T')


def async_to_sync_wrapper(func: Callable[..., T]) -> Callable[..., asyncio.Future[T]]:
    """
    装饰器：将同步函数包装成可等待的异步函数
    在默认线程池中执行同步函数
    
    Args:
        func: 同步函数
        
    Returns:
        可等待的异步函数
    """
    @functools.wraps(func)
    async def wrapper(*args: Any, **kwargs: Any) -> T:
        return await asyncio.to_thread(func, *args, **kwargs)
    return wrapper


def async_with_error_handling(
    log_type: str = "SYSTEM_ERROR",
    log_message: str = "操作失败",
    raise_exception: bool = True,
    default_return: Any = None
) -> Callable[[Callable[..., T]], Callable[..., Union[T, Any]]]:
    """
    装饰器：为异步函数添加统一的错误处理和日志记录
    
    Args:
        log_type: 日志类型
        log_message: 日志消息
        raise_exception: 是否抛出异常
        default_return: 不抛出异常时的默认返回值
        
    Returns:
        带错误处理的异步函数
    """
    def decorator(func: Callable[..., T]) -> Callable[..., Union[T, Any]]:
        @functools.wraps(func)
        async def wrapper(*args: Any, **kwargs: Any) -> Union[T, Any]:
            try:
                return await func(*args, **kwargs)
            except Exception as e:
                # 记录错误日志
                await log_system(
                    log_type=log_type,
                    level="ERROR",
                    message=log_message,
                    details={"error": str(e), "function": func.__name__},
                )
                
                # 根据配置决定是否抛出异常
                if raise_exception:
                    raise
                return default_return
        return wrapper
    return decorator


def sync_async_pair(
    sync_func: Callable[..., T],
    log_type: str = "SYSTEM_ERROR",
    log_message: str = "操作失败",
    use_thread: bool = False
) -> Callable[..., Union[T, Any]]:
    """
    创建异步版本的同步函数，包含错误处理
    
    Args:
        sync_func: 同步函数
        log_type: 日志类型
        log_message: 日志消息
        use_thread: 是否在线程池执行
        
    Returns:
        异步函数
    """
    @functools.wraps(sync_func)
    async def async_func(*args: Any, **kwargs: Any) -> Union[T, Any]:
        try:
            if use_thread:
                return await asyncio.to_thread(sync_func, *args, **kwargs)
            else:
                return sync_func(*args, **kwargs)
        except Exception as e:
            await log_system(
                log_type=log_type,
                level="ERROR",
                message=log_message,
                details={"error": str(e), "function": sync_func.__name__},
            )
            raise
    return async_func


class AsyncContextManager:
    """
    异步上下文管理器基类
    提供统一的异步资源管理接口
    """
    async def __aenter__(self) -> 'AsyncContextManager':
        return self
        
    async def __aexit__(self, exc_type: Optional[type], exc_val: Optional[Exception], exc_tb: Any) -> bool:
        # 默认不抑制异常
        return False


def ensure_async(func: Any) -> Any:
    """
    确保函数是异步的
    如果不是异步函数，将其包装成异步函数
    """
    if asyncio.iscoroutinefunction(func):
        return func
    
    @functools.wraps(func)
    async def async_wrapper(*args: Any, **kwargs: Any) -> Any:
        return func(*args, **kwargs)
    
    return async_wrapper


def create_task_safe(
    coro: Any,
    name: Optional[str] = None,
    on_done_callback: Optional[Callable[[Any], Any]] = None
) -> asyncio.Task:
    """
    安全地创建异步任务
    提供错误处理和回调机制
    
    Args:
        coro: 协程对象
        name: 任务名称
        on_done_callback: 任务完成时的回调函数
        
    Returns:
        创建的任务对象
    """
    async def task_wrapper():
        try:
            result = await coro
            if on_done_callback:
                await ensure_async(on_done_callback)(result)
            return result
        except Exception as e:
            await log_system(
                log_type="TASK_ERROR",
                level="ERROR",
                message=f"任务执行失败: {name or 'unnamed'}",
                details={"error": str(e)}
            )
            raise
    
    task = asyncio.create_task(task_wrapper(), name=name)
    return task


def gather_safe(*coros: Any, return_exceptions: bool = True) -> asyncio.Future:
    """
    安全地并发执行多个协程
    
    Args:
        *coros: 协程对象
        return_exceptions: 是否返回异常而不是抛出
        
    Returns:
        包含所有结果的Future
    """
    async def gather_wrapper():
        try:
            return await asyncio.gather(*coros, return_exceptions=return_exceptions)
        except Exception as e:
            await log_system(
                log_type="GATHER_ERROR",
                level="ERROR",
                message="协程并发执行失败",
                details={"error": str(e)}
            )
            if not return_exceptions:
                raise
            return [e]
    
    return asyncio.create_task(gather_wrapper())