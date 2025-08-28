import asyncio
import os
import logging
import random
import string
from datetime import datetime, timedelta
import aiosmtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from pydantic import EmailStr

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 邮件连接配置 - 使用.env.example中的配置
mail_config = {
    "username": "2528756899@qq.com",       # QQ邮箱地址
    "password": "ytkyflsnuutmdjhd",        # QQ邮箱授权码
    "from_email": "2528756899@qq.com",     # 发件邮箱
    "from_name": "GlobalLink",             # 发件人名称
    "smtp_server": "smtp.qq.com",          # QQ邮箱SMTP服务器
    "smtp_port": 587,                      # QQ邮箱使用587端口
    "timeout": 30,                         # 超时时间
    "use_tls": False                       # 不使用直接TLS，使用STARTTLS
}

async def send_email(email_to: str, subject: str, body: str) -> bool:
    """使用aiosmtplib发送邮件的函数"""
    try:
        # 创建邮件消息
        message = MIMEMultipart()
        message['From'] = f"{mail_config['from_name']} <{mail_config['from_email']}>"
        message['To'] = email_to
        message['Subject'] = subject
        
        # 添加HTML内容
        message.attach(MIMEText(body, 'html'))
        
        # 创建SSL上下文（禁用证书验证以兼容QQ邮箱）
        ssl_context = ssl.create_default_context()
        ssl_context.check_hostname = False
        ssl_context.verify_mode = ssl.CERT_NONE
        
        # 连接SMTP服务器并发送邮件
        async with aiosmtplib.SMTP(
            hostname=mail_config['smtp_server'],
            port=mail_config['smtp_port'],
            start_tls=True,  # 使用STARTTLS而不是直接TLS
            tls_context=ssl_context,
            timeout=mail_config['timeout']
        ) as smtp:
            await smtp.login(
                mail_config['username'],
                mail_config['password']
            )
            await smtp.send_message(message)
        
        logger.info(f"邮件已发送至 {email_to}")
        return True
        
    except Exception as e:
        logger.error(f"发送邮件失败: {e}")
        return False

async def test_send_email():
    """测试发送邮件功能"""
    # 测试收件人邮箱
    test_email = "15010993510@163.com"  # 替换为实际测试邮箱
    
    # 测试邮件内容
    subject = "测试邮件"
    body = """
    <html>
    <body>
        <h2>这是一封测试邮件</h2>
        <p>如果您收到此邮件，说明邮件发送功能正常工作。</p>
        <p>发送时间: {}</p>
    </body>
    </html>
    """.format(datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
    
    print(f"正在发送测试邮件到: {test_email}")
    print(f"邮件服务器: {mail_config['smtp_server']}:{mail_config['smtp_port']}")
    print(f"发件人: {mail_config['from_email']}")
    
    # 发送邮件
    success = await send_email(test_email, subject, body)
    
    if success:
        print("✅ 邮件发送成功!")
    else:
        print("❌ 邮件发送失败!")

if __name__ == "__main__":
    # 运行测试
    asyncio.run(test_send_email())