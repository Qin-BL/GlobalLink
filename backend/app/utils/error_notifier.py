"""
错误邮件通知工具
在接口报错时发送邮件通知，支持配置多个接收邮箱
"""

import logging
import traceback
from typing import List, Optional
from fastapi import Request

from app.core.config import settings
from app.utils.email import send_email

# 配置日志
logger = logging.getLogger(__name__)

# 默认接收邮箱配置（从配置文件中获取）
# 注意：需要在 .env 文件中配置 ERROR_NOTIFICATION_RECIPIENTS 来修改接收邮箱
DEFAULT_ERROR_RECIPIENTS = settings.ERROR_NOTIFICATION_RECIPIENTS


class ErrorNotifier:
    """错误邮件通知器"""
    
    def __init__(self, recipients: Optional[List[str]] = None):
        """
        初始化错误通知器
        
        Args:
            recipients: 接收错误通知的邮箱列表，如果为None则使用配置文件中的默认配置
        """
        self.recipients = recipients or DEFAULT_ERROR_RECIPIENTS
    
    async def send_error_notification(
        self,
        error: Exception,
        request: Optional[Request] = None,
        additional_info: Optional[dict] = None
    ) -> bool:
        """
        发送错误邮件通知
        
        Args:
            error: 异常对象
            request: FastAPI请求对象（可选）
            additional_info: 附加信息字典（可选）
            
        Returns:
            bool: 是否发送成功
        """
        if not self.recipients:
            logger.warning("未配置错误通知接收邮箱")
            return False
        
        try:
            # 构建邮件主题和内容
            subject = self._build_subject(error)
            body = self._build_body(error, request, additional_info)
            
            # 发送给所有接收者
            success_count = 0
            for recipient in self.recipients:
                success = await send_email(recipient, subject, body)
                if success:
                    success_count += 1
                    logger.info(f"错误通知已发送至: {recipient}")
                else:
                    logger.error(f"发送错误通知到 {recipient} 失败")
            
            return success_count > 0
            
        except Exception as e:
            logger.error(f"发送错误通知失败: {e}")
            return False
    
    def _build_subject(self, error: Exception) -> str:
        """构建邮件主题"""
        error_name = error.__class__.__name__
        return f"[{settings.PROJECT_NAME}] 错误通知: {error_name}"
    
    def _build_body(
        self,
        error: Exception,
        request: Optional[Request],
        additional_info: Optional[dict]
    ) -> str:
        """构建邮件内容"""
        
        # 获取错误堆栈信息
        error_traceback = traceback.format_exc()
        
        # 构建请求信息
        request_info = ""
        if request:
            request_info = f"""
            <h3>请求信息</h3>
            <p><strong>URL:</strong> {request.url}</p>
            <p><strong>方法:</strong> {request.method}</p>
            <p><strong>客户端IP:</strong> {request.client.host if request.client else '未知'}</p>
            <p><strong>用户代理:</strong> {request.headers.get('user-agent', '未知')}</p>
            """
        
        # 构建附加信息
        additional_info_html = ""
        if additional_info:
            additional_info_html = "<h3>附加信息</h3>"
            for key, value in additional_info.items():
                additional_info_html += f"<p><strong>{key}:</strong> {value}</p>"
        
        # 构建完整的HTML邮件内容
        return f"""
        <html>
        <body>
            <h2>{settings.PROJECT_NAME} 系统错误通知</h2>
            
            <h3>错误详情</h3>
            <p><strong>错误类型:</strong> {error.__class__.__name__}</p>
            <p><strong>错误信息:</strong> {str(error)}</p>
            
            {request_info}
            {additional_info_html}
            
            <h3>堆栈跟踪</h3>
            <pre style="background-color: #f4f4f4; padding: 10px; border-radius: 5px; overflow: auto;">
            {error_traceback}
            </pre>
            
            <hr>
            <p style="color: #666; font-size: 12px;">
                此邮件由 {settings.PROJECT_NAME} 系统自动发送，请勿直接回复。
            </p>
        </body>
        </html>
        """


# 全局错误通知器实例
error_notifier = ErrorNotifier()


def configure_error_notifier(recipients: List[str]) -> None:
    """
    配置全局错误通知器的接收邮箱
    
    Args:
        recipients: 接收错误通知的邮箱列表
    """
    global error_notifier
    error_notifier = ErrorNotifier(recipients)
    logger.info(f"错误通知器已配置，接收邮箱: {recipients}")


async def notify_error(
    error: Exception,
    request: Optional[Request] = None,
    additional_info: Optional[dict] = None
) -> bool:
    """
    发送错误通知（使用全局配置）
    
    Args:
        error: 异常对象
        request: FastAPI请求对象（可选）
        additional_info: 附加信息字典（可选）
        
    Returns:
        bool: 是否发送成功
    """
    return await error_notifier.send_error_notification(error, request, additional_info)


def get_error_notifier() -> ErrorNotifier:
    """获取全局错误通知器实例"""
    return error_notifier