"""
错误通知工具
"""
import logging
import traceback
from datetime import datetime
from typing import Optional, Dict, Any

from ..core.config import settings
from .email import email_sender

logger = logging.getLogger(__name__)

class ErrorNotifier:
    """错误通知器"""
    
    def __init__(self):
        self.admin_emails = settings.ADMIN_EMAILS if hasattr(settings, 'ADMIN_EMAILS') else []
    
    async def notify_error(
        self,
        error: Exception,
        context: Optional[Dict[str, Any]] = None,
        user_id: Optional[int] = None,
        request_path: Optional[str] = None
    ) -> bool:
        """
        发送错误通知
        """
        try:
            # 构建错误信息
            error_info = {
                'timestamp': datetime.utcnow().isoformat(),
                'error_type': type(error).__name__,
                'error_message': str(error),
                'traceback': traceback.format_exc(),
                'user_id': user_id,
                'request_path': request_path,
                'context': context or {}
            }
            
            # 记录错误日志
            logger.error(f"系统错误: {error_info}")
            
            # 如果配置了管理员邮箱，发送邮件通知
            if self.admin_emails:
                await self._send_error_email(error_info)
            
            return True
            
        except Exception as e:
            logger.error(f"发送错误通知失败: {e}")
            return False
    
    async def _send_error_email(self, error_info: Dict[str, Any]) -> bool:
        """发送错误通知邮件"""
        subject = f"GlobalLink系统错误 - {error_info['error_type']}"
        
        html_content = f"""
        <html>
        <body>
            <h2>系统错误通知</h2>
            <table border="1" cellpadding="5" cellspacing="0">
                <tr><td><strong>时间</strong></td><td>{error_info['timestamp']}</td></tr>
                <tr><td><strong>错误类型</strong></td><td>{error_info['error_type']}</td></tr>
                <tr><td><strong>错误消息</strong></td><td>{error_info['error_message']}</td></tr>
                <tr><td><strong>用户ID</strong></td><td>{error_info['user_id'] or 'N/A'}</td></tr>
                <tr><td><strong>请求路径</strong></td><td>{error_info['request_path'] or 'N/A'}</td></tr>
            </table>
            
            <h3>错误堆栈</h3>
            <pre>{error_info['traceback']}</pre>
            
            <h3>上下文信息</h3>
            <pre>{error_info['context']}</pre>
        </body>
        </html>
        """
        
        return await email_sender.send_email(
            to_emails=self.admin_emails,
            subject=subject,
            html_content=html_content
        )

# 全局错误通知器实例
error_notifier = ErrorNotifier()

async def notify_system_error(
    error: Exception,
    context: Optional[Dict[str, Any]] = None,
    user_id: Optional[int] = None,
    request_path: Optional[str] = None
) -> bool:
    """通知系统错误的便捷函数"""
    return await error_notifier.notify_error(
        error=error,
        context=context,
        user_id=user_id,
        request_path=request_path
    )