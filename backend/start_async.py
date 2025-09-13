# -*- coding: utf-8 -*-
"""
GlobalLink异步服务启动脚本
用于便捷启动异步版本的GlobalLink服务
"""
import os
import sys
import subprocess
import time
import logging
from typing import Optional

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)

logger = logging.getLogger("start_async")


class AsyncServiceManager:
    """异步服务管理器"""
    
    def __init__(self):
        self.process: Optional[subprocess.Popen] = None
        # 从配置文件导入设置
        from app.core.config import settings
        self.port = settings.BACKEND_PORT
        self.host = settings.HOST
        self.reload = self._is_debug_mode()
        
    def _is_debug_mode(self) -> bool:
        """检查是否为调试模式"""
        return os.environ.get("DEBUG", "False").lower() == "true" or \
               "--debug" in sys.argv or \
               "-d" in sys.argv
    
    def start_service(self):
        """启动异步服务"""
        logger.info(f"🚀 正在启动GlobalLink异步服务 (端口: {self.port})...")
        
        # 首先检查Python和uvicorn版本兼容性
        try:
            import uvicorn
            logger.info(f"当前uvicorn版本: {uvicorn.__version__}")
        except Exception as e:
            logger.error(f"❌ uvicorn模块导入失败: {e}")
            sys.exit(1)
        
        # 构建uvicorn命令参数
        cmd = [
            sys.executable,  # 使用当前Python解释器
            "-m", "uvicorn",
            "async_main:app",
            "--host", self.host,
            "--port", str(self.port)
        ]
        
        # 如果是调试模式，添加reload参数
        if self.reload:
            cmd.append("--reload")
            logger.info("🔧 调试模式已启用，代码修改将自动重载")
        else:
            # 生产模式下设置工作进程数
            from app.core.config import settings
            try:
                workers = os.environ.get("WORKERS", str(settings.WORKERS))
                logger.info(f"🏭 生产模式，尝试设置工作进程数: {workers}")
                # 使用更兼容的方式添加workers参数
                if int(workers) > 0:
                    # 检查系统环境
                    if sys.platform == 'linux' or sys.platform == 'linux2':
                        # Linux系统下添加workers参数
                        cmd.extend(["--workers", workers])
                    else:
                        # 其他系统可能不支持workers参数
                        logger.warning("⚠️ 当前操作系统可能不支持workers参数，将使用单进程模式")
            except Exception as e:
                logger.warning(f"⚠️ 无法设置工作进程数: {e}")
        
        # 设置日志级别 - 确保日志级别始终是小写的
        from app.core.config import settings
        log_level = os.environ.get("LOG_LEVEL", settings.LOG_LEVEL)
        # 强制转换为小写，因为uvicorn只接受小写的日志级别
        log_level = log_level.lower()
        cmd.extend(["--log-level", log_level])
        
        # 添加其他兼容性参数
        cmd.extend(["--loop", "asyncio", "--http", "h11"])
        
        try:
            # 打印完整的命令，便于调试
            logger.info(f"📋 执行命令: {' '.join(cmd)}")
            logger.info(f"当前工作目录: {os.getcwd()}")
            logger.info(f"用户: {os.environ.get('USER', os.environ.get('USERNAME', 'unknown'))}")
            
            # 启动服务进程
            self.process = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                bufsize=1,
                universal_newlines=True,
                # 设置进程组，便于后续杀死整个进程树
                start_new_session=True
            )
            
            # 打印启动信息
            logger.info(f"✅ GlobalLink异步服务已启动")
            logger.info(f"📚 文档地址: http://{self.host}:{self.port}/docs")
            logger.info(f"🔍 重新加载: {'已启用' if self.reload else '已禁用'}")
            logger.info(f"💡 提示: 按Ctrl+C停止服务")
            
            # 实时打印服务日志
            self._stream_logs()
            
        except Exception as e:
            logger.error(f"❌ 启动服务失败: {e}")
            sys.exit(1)
    
    def _stream_logs(self):
        """实时流式输出服务日志"""
        if not self.process:
            return
        
        # 记录进程ID，便于调试
        logger.info(f"服务进程ID: {self.process.pid}")
        
        try:
            # 初始时尝试读取一些启动错误信息
            import select
            
            # 给进程一些时间启动
            time.sleep(0.5)
            
            # 首先检查是否有错误输出
            if self.process.poll() is None:
                # 使用select来非阻塞地检查是否有输出可读
                rlist, _, _ = select.select([self.process.stdout, self.process.stderr], [], [], 0.1)
                
                # 读取初始输出
                for stream in rlist:
                    if stream == self.process.stdout:
                        while True:
                            line = self.process.stdout.readline()
                            if not line:
                                break
                            logger.info(line.strip())
                    elif stream == self.process.stderr:
                        while True:
                            line = self.process.stderr.readline()
                            if not line:
                                break
                            logger.error(line.strip())
            
            # 然后进入正常的日志读取循环
            while self.process.poll() is None:
                # 使用select来避免阻塞
                rlist, _, _ = select.select([self.process.stdout, self.process.stderr], [], [], 0.1)
                
                for stream in rlist:
                    if stream == self.process.stdout:
                        line = self.process.stdout.readline()
                        if line:
                            logger.info(line.strip())
                    elif stream == self.process.stderr:
                        line = self.process.stderr.readline()
                        if line:
                            logger.error(line.strip())
            
        except KeyboardInterrupt:
            logger.info("🛑 接收到停止信号，正在关闭服务...")
            self._stop_service()
        except Exception as e:
            logger.error(f"❌ 日志流处理异常: {e}")
        
        # 检查进程是否异常退出
        if self.process and self.process.poll() is not None:
            exit_code = self.process.poll()
            if exit_code != 0:
                logger.error(f"❌ 服务异常退出，退出码: {exit_code}")
                
                # 尝试读取剩余的错误信息
                try:
                    if self.process.stderr:
                        remaining_stderr = self.process.stderr.read()
                        if remaining_stderr:
                            logger.error(f"剩余错误信息:\n{remaining_stderr}")
                    if self.process.stdout:
                        remaining_stdout = self.process.stdout.read()
                        if remaining_stdout:
                            logger.info(f"剩余输出信息:\n{remaining_stdout}")
                except Exception as read_err:
                    logger.warning(f"读取剩余输出时出错: {read_err}")
                
                # 根据退出码提供建议
                if exit_code == 2:
                    logger.error("❌ 退出码2通常表示参数无效。请检查uvicorn命令参数格式是否正确。")
                elif exit_code == 127:
                    logger.error("❌ 退出码127表示命令未找到。请检查Python和uvicorn是否正确安装。")
                elif exit_code == 139:
                    logger.error("❌ 退出码139表示段错误。可能是依赖库冲突或内存问题。")
                
                sys.exit(exit_code)
    
    def _stop_service(self):
        """停止异步服务"""
        if not self.process or self.process.poll() is not None:
            return
        
        try:
            logger.info(f"🛑 正在关闭服务，进程ID: {self.process.pid}")
            
            # 尝试优雅关闭
            self.process.terminate()
            
            # 等待最多5秒
            wait_time = 5
            for i in range(wait_time * 10):  # 5秒 = 50 * 0.1秒
                if self.process.poll() is not None:
                    break
                time.sleep(0.1)
            
            # 如果进程仍然存活，强制终止
            if self.process.poll() is None:
                logger.warning(f"⚠️ 服务没有在{wait_time}秒内关闭，尝试强制终止")
                # 在Linux系统上，可以尝试发送SIGKILL信号
                if sys.platform == 'linux' or sys.platform == 'linux2':
                    import signal
                    os.killpg(os.getpgid(self.process.pid), signal.SIGKILL)
                else:
                    self.process.kill()
                
                # 再等待1秒
                time.sleep(1)
                
                if self.process.poll() is None:
                    logger.error("❌ 服务无法强制关闭，请手动终止")
                else:
                    logger.warning("⚠️ 服务已强制终止")
            else:
                exit_code = self.process.poll()
                logger.info(f"✅ 服务已关闭，退出码: {exit_code}")
                
        except Exception as e:
            logger.error(f"❌ 关闭服务异常: {e}")
            # 尝试更强制的关闭方式
            try:
                if self.process.poll() is None:
                    if sys.platform == 'linux' or sys.platform == 'linux2':
                        import signal
                        os.killpg(os.getpgid(self.process.pid), signal.SIGKILL)
                    else:
                        self.process.kill()
            except Exception as kill_err:
                logger.error(f"❌ 强制关闭服务也失败: {kill_err}")


def print_banner():
    """打印启动横幅"""
    # 从配置文件导入端口设置
    from app.core.config import settings
    banner = f"""
    ╔════════════════════════════════════════════════════════════╗
    ║                     GlobalLink Async                       ║
    ╠════════════════════════════════════════════════════════════╣
    ║                        异步服务启动器                      ║
    ║          端口: {settings.BACKEND_PORT}          文档: /docs                  ║
    ╚════════════════════════════════════════════════════════════╝
    """
    print(banner)


def check_environment():
    """全面检查启动环境，排查可能的问题"""
    logger.info("🔍 正在进行启动环境检查...")
    
    # 检查端口占用情况
    try:
        import socket
        def is_port_in_use(port):
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                return s.connect_ex(("localhost", port)) == 0
        
        from app.core.config import settings
        if is_port_in_use(settings.BACKEND_PORT):
            logger.error(f"❌ 端口 {settings.BACKEND_PORT} 已被占用")
            # 尝试查找占用端口的进程
            try:
                if sys.platform == 'linux' or sys.platform == 'linux2':
                    import psutil
                    for conn in psutil.net_connections():
                        if conn.laddr.port == settings.BACKEND_PORT:
                            try:
                                p = psutil.Process(conn.pid)
                                logger.error(f"❌ 端口 {settings.BACKEND_PORT} 被进程占用: {p.name()} (PID: {conn.pid})")
                            except Exception:
                                logger.error(f"❌ 端口 {settings.BACKEND_PORT} 被PID {conn.pid} 占用")
            except Exception as e:
                logger.warning(f"⚠️ 无法获取端口占用详情: {e}")
            sys.exit(1)
        logger.info(f"✅ 端口 {settings.BACKEND_PORT} 可用")
    except Exception as e:
        logger.warning(f"⚠️ 端口检查失败: {e}")
    
    # 检查配置文件加载
    try:
        from app.core.config import settings
        required_settings = [
            ('BACKEND_PORT', settings.BACKEND_PORT),
            ('HOST', settings.HOST),
            ('SQLALCHEMY_DATABASE_URI', settings.SQLALCHEMY_DATABASE_URI)
        ]
        
        missing = []
        for name, value in required_settings:
            if not value:
                missing.append(name)
        
        if missing:
            logger.error(f"❌ 缺少必要配置项: {', '.join(missing)}")
            sys.exit(1)
        
        # 检查.env文件是否存在
        env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env')
        if os.path.exists(env_path):
            logger.info(f"✅ .env文件存在: {env_path}")
        else:
            logger.warning(f"⚠️ .env文件不存在: {env_path}")
        
        logger.info("✅ 配置加载检查通过")
    except Exception as e:
        logger.error(f"❌ 配置检查失败: {e}")
        sys.exit(1)
    
    # 检查工作目录权限
    try:
        current_dir = os.getcwd()
        # 测试写权限
        test_file = os.path.join(current_dir, '.test_write_access')
        with open(test_file, 'w') as f:
            f.write('test')
        os.remove(test_file)
        logger.info(f"✅ 工作目录权限检查通过: {current_dir}")
    except Exception as e:
        logger.error(f"❌ 工作目录权限不足: {e}")
        sys.exit(1)
    
    # 检查当前用户
    try:
        if sys.platform == 'linux' or sys.platform == 'linux2':
            import pwd
            current_user = pwd.getpwuid(os.getuid()).pw_name
            logger.info(f"✅ 当前用户: {current_user}")
            # 检查是否以root用户运行
            if os.geteuid() == 0:
                logger.warning("⚠️ 警告: 正在以root用户身份运行服务，这可能存在安全风险")
    except Exception as e:
        logger.warning(f"⚠️ 无法获取当前用户信息: {e}")
    
    # 检查系统资源
    try:
        import psutil
        memory = psutil.virtual_memory()
        cpu_count = psutil.cpu_count()
        logger.info(f"✅ 系统资源: 可用内存 {memory.available / (1024*1024*1024):.2f}GB, CPU核心数 {cpu_count}")
    except Exception as e:
        logger.warning(f"⚠️ 无法获取系统资源信息: {e}")
    
    logger.info("✅ 所有环境检查通过！")


def main():
    """主函数"""
    try:
        # 打印启动横幅
        print_banner()
        
        # 检查Python版本
        if sys.version_info < (3, 8):
            logger.error("❌ Python版本过低，需要Python 3.8或更高版本")
            sys.exit(1)
        logger.info(f"✅ Python版本: {sys.version.split()[0]}")
        
        # 检查依赖是否安装
        try:
            import uvicorn
            import fastapi
            logger.info(f"✅ 依赖检查通过: uvicorn={uvicorn.__version__}, fastapi={fastapi.__version__}")
        except ImportError:
            logger.error("❌ 缺少必要依赖，请先安装: pip install -r requirements.txt")
            sys.exit(1)
        
        # 执行环境检查
        check_environment()
        
        # 启动异步服务
        service_manager = AsyncServiceManager()
        service_manager.start_service()
        
    except KeyboardInterrupt:
        logger.info("🛑 启动脚本被用户中断")
        sys.exit(0)
    except Exception as e:
        logger.error(f"❌ 启动脚本异常: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()