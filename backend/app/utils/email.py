# -*- coding: utf-8 -*-
"""
邮件发送工具
"""
import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import List, Optional
from pathlib import Path

from ..core.config import settings

logger = logging.getLogger(__name__)

class EmailSender:
    """邮件发送器"""
    
    def __init__(self):
        self.smtp_server = settings.SMTP_SERVER
        self.smtp_port = settings.SMTP_PORT
        self.username = settings.SMTP_USERNAME
        self.password = settings.SMTP_PASSWORD
        self.use_tls = settings.SMTP_TLS
    
    async def send_email(
        self,
        to_emails: List[str],
        subject: str,
        html_content: str,
        text_content: Optional[str] = None
    ) -> bool:
        """
        发送邮件
        """
        try:
            # 创建邮件消息
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = self.username
            msg['To'] = ', '.join(to_emails)
            
            # 添加文本内容
            if text_content:
                text_part = MIMEText(text_content, 'plain', 'utf-8')
                msg.attach(text_part)
            
            # 添加HTML内容
            html_part = MIMEText(html_content, 'html', 'utf-8')
            msg.attach(html_part)
            
            # 连接SMTP服务器并发送邮件
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                if self.use_tls:
                    server.starttls()
                server.login(self.username, self.password)
                server.send_message(msg)
            
            logger.info(f"邮件发送成功: {subject} -> {to_emails}")
            return True
            
        except Exception as e:
            logger.error(f"邮件发送失败: {e}")
            return False

# 全局邮件发送器实例
email_sender = EmailSender()

async def send_reset_password_email(email: str, token: str) -> bool:
    """发送密码重置邮件"""
    reset_url = f"{settings.FRONTEND_HOST}/reset-password?token={token}"
    
    html_content = f"""
    <html>
    <body>
        <h2>密码重置请求</h2>
        <p>您好，</p>
        <p>我们收到了您的密码重置请求。请点击下面的链接重置您的密码：</p>
        <p><a href="{reset_url}">重置密码</a></p>
        <p>如果您没有请求重置密码，请忽略此邮件。</p>
        <p>此链接将在1小时后失效。</p>
        <br>
        <p>GlobalLink团队</p>
    </body>
    </html>
    """
    
    text_content = f"""
    密码重置请求
    
    您好，
    
    我们收到了您的密码重置请求。请复制下面的链接到浏览器中重置您的密码：
    
    {reset_url}
    
    如果您没有请求重置密码，请忽略此邮件。
    
    此链接将在1小时后失效。
    
    GlobalLink团队
    """
    
    return await email_sender.send_email(
        to_emails=[email],
        subject="GlobalLink - 密码重置",
        html_content=html_content,
        text_content=text_content
    )

async def send_welcome_email(email: str, username: str) -> bool:
    """发送欢迎邮件"""
    html_content = f"""
    <html>
    <body>
        <h2>欢迎加入GlobalLink！</h2>
        <p>亲爱的 {username}，</p>
        <p>欢迎您加入GlobalLink全球语言学习平台！</p>
        <p>在这里，您可以：</p>
        <ul>
            <li>学习多种语言课程</li>
            <li>跟踪学习进度</li>
            <li>与其他学习者交流</li>
            <li>获得个性化学习建议</li>
        </ul>
        <p>立即开始您的语言学习之旅吧！</p>
        <p><a href="{settings.FRONTEND_HOST}">访问GlobalLink</a></p>
        <br>
        <p>GlobalLink团队</p>
    </body>
    </html>
    """
    
    return await email_sender.send_email(
        to_emails=[email],
        subject="欢迎加入GlobalLink！",
        html_content=html_content
    )