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
        self.port = 8001
        self.host = "0.0.0.0"
        self.reload = self._is_debug_mode()
        
    def _is_debug_mode(self) -> bool:
        """检查是否为调试模式"""
        return os.environ.get("DEBUG", "False").lower() == "true" or \
               "--debug" in sys.argv or \
               "-d" in sys.argv
    
    def start_service(self):
        """启动异步服务"""
        logger.info(f"🚀 正在启动GlobalLink异步服务 (端口: {self.port})...")
        
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
            workers = os.environ.get("WORKERS", "2")
            cmd.extend(["--workers", workers])
            logger.info(f"🏭 生产模式，工作进程数: {workers}")
        
        # 设置日志级别
        log_level = os.environ.get("LOG_LEVEL", "info")
        cmd.extend(["--log-level", log_level])
        
        try:
            # 启动服务进程
            self.process = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                bufsize=1
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
        
        try:
            while self.process.poll() is None:
                # 读取并打印标准输出
                if self.process.stdout:
                    line = self.process.stdout.readline()
                    if line:
                        logger.info(line.strip())
                
                # 读取并打印标准错误
                if self.process.stderr:
                    line = self.process.stderr.readline()
                    if line:
                        logger.error(line.strip())
                
                # 短暂睡眠以避免CPU占用过高
                time.sleep(0.01)
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
                sys.exit(exit_code)
    
    def _stop_service(self):
        """停止异步服务"""
        if not self.process or self.process.poll() is not None:
            return
        
        try:
            # 尝试优雅关闭
            self.process.terminate()
            
            # 等待最多5秒
            for _ in range(50):  # 5秒 = 50 * 0.1秒
                if self.process.poll() is not None:
                    break
                time.sleep(0.1)
            
            # 如果进程仍然存活，强制终止
            if self.process.poll() is None:
                self.process.kill()
                logger.warning("⚠️ 服务无法优雅关闭，已强制终止")
            else:
                logger.info("✅ 服务已优雅关闭")
                
        except Exception as e:
            logger.error(f"❌ 关闭服务异常: {e}")


def print_banner():
    """打印启动横幅"""
    banner = """
    ╔════════════════════════════════════════════════════════════╗
    ║                     GlobalLink Async                       ║
    ╠════════════════════════════════════════════════════════════╣
    ║                        异步服务启动器                      ║
    ║          端口: 8001          文档: /docs                  ║
    ╚════════════════════════════════════════════════════════════╝
    """
    print(banner)


def main():
    """主函数"""
    try:
        # 打印启动横幅
        print_banner()
        
        # 检查Python版本
        if sys.version_info < (3, 8):
            logger.error("❌ Python版本过低，需要Python 3.8或更高版本")
            sys.exit(1)
        
        # 检查依赖是否安装
        try:
            import uvicorn
            import fastapi
            logger.info(f"✅ 依赖检查通过: uvicorn={uvicorn.__version__}, fastapi={fastapi.__version__}")
        except ImportError:
            logger.error("❌ 缺少必要依赖，请先安装: pip install -r requirements.txt")
            sys.exit(1)
        
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