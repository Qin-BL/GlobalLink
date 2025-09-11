#!/usr/bin/env python3
"""
GlobalLink 测试环境服务器连通性测试脚本
测试服务器: 47.108.76.21
SSH密钥: ~/Desktop/global_link47.108.76.21.pem
"""

import paramiko
import socket
import time
from typing import Dict, List, Optional
import subprocess
import sys
import os

class ServerConnectivityTester:
    def __init__(self, host: str = "47.108.76.21", 
                 ssh_key_path: str = "~/Desktop/global_link47.108.76.21.pem",
                 username: str = "ubuntu"):
        self.host = host
        self.ssh_key_path = ssh_key_path
        self.username = username
        self.ssh_client = None
        
    def expand_path(self, path: str) -> str:
        """扩展路径中的~为绝对路径"""
        return path.replace('~', os.path.expanduser('~'))
    
    def print_result(self, test_name: str, success: bool, message: str = ""):
        """打印测试结果"""
        status = "✓ 成功" if success else "✗ 失败"
        print(f"{test_name}: {status}")
        if message:
            print(f"  {message}")
        print()
    
    def test_ping(self) -> bool:
        """测试服务器ping连通性"""
        try:
            # 使用系统ping命令
            result = subprocess.run(
                ["ping", "-c", "4", "-W", "2", self.host],
                capture_output=True,
                text=True,
                timeout=10
            )
            
            success = result.returncode == 0
            self.print_result("Ping测试", success, 
                             f"响应时间: {result.stdout}" if success else f"错误: {result.stderr}")
            return success
            
        except subprocess.TimeoutExpired:
            self.print_result("Ping测试", False, "请求超时")
            return False
        except Exception as e:
            self.print_result("Ping测试", False, f"异常: {e}")
            return False
    
    def test_port_connectivity(self, port: int, service_name: str) -> bool:
        """测试特定端口的连通性"""
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(5)
            
            result = sock.connect_ex((self.host, port))
            success = result == 0
            
            status = "开放" if success else "关闭"
            self.print_result(f"端口 {port} ({service_name})", success, f"状态: {status}")
            
            sock.close()
            return success
            
        except Exception as e:
            self.print_result(f"端口 {port} ({service_name})", False, f"异常: {e}")
            return False
    
    def test_ssh_connection(self) -> bool:
        """测试SSH连接"""
        try:
            key_path = self.expand_path(self.ssh_key_path)
            
            if not os.path.exists(key_path):
                self.print_result("SSH连接测试", False, f"SSH密钥文件不存在: {key_path}")
                return False
            
            # 创建SSH客户端
            self.ssh_client = paramiko.SSHClient()
            self.ssh_client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
            
            # 加载私钥
            private_key = paramiko.RSAKey.from_private_key_file(key_path)
            
            # 连接服务器
            self.ssh_client.connect(
                hostname=self.host,
                username=self.username,
                pkey=private_key,
                timeout=10
            )
            
            self.print_result("SSH连接测试", True, "SSH连接成功")
            return True
            
        except paramiko.AuthenticationException:
            self.print_result("SSH连接测试", False, "认证失败")
            return False
        except paramiko.SSHException as e:
            self.print_result("SSH连接测试", False, f"SSH异常: {e}")
            return False
        except Exception as e:
            self.print_result("SSH连接测试", False, f"异常: {e}")
            return False
    
    def test_server_services(self) -> bool:
        """测试服务器上的服务状态"""
        if not self.ssh_client:
            self.print_result("服务状态测试", False, "需要先建立SSH连接")
            return False
        
        try:
            services_to_check = [
                "nginx",      # Web服务器
                "postgresql", # PostgreSQL数据库
                "redis",      # Redis缓存

            ]
            
            all_services_ok = True
            
            for service in services_to_check:
                # 检查服务状态
                stdin, stdout, stderr = self.ssh_client.exec_command(f"systemctl is-active {service}")
                status = stdout.read().decode().strip()
                
                is_active = status == "active"
                self.print_result(f"服务 {service}", is_active, f"状态: {status}")
                
                if not is_active:
                    all_services_ok = False
                    
                    # 尝试查看服务日志
                    stdin, stdout, stderr = self.ssh_client.exec_command(f"journalctl -u {service} --no-pager -n 10")
                    logs = stdout.read().decode()
                    if logs:
                        print(f"  最近日志:\n  {logs.replace(chr(10), chr(10) + '  ')}")
            
            return all_services_ok
            
        except Exception as e:
            self.print_result("服务状态测试", False, f"异常: {e}")
            return False
    
    def test_disk_space(self) -> bool:
        """测试磁盘空间"""
        if not self.ssh_client:
            self.print_result("磁盘空间检查", False, "需要先建立SSH连接")
            return False
        
        try:
            # 检查磁盘使用情况
            stdin, stdout, stderr = self.ssh_client.exec_command("df -h /")
            disk_info = stdout.read().decode()
            
            self.print_result("磁盘空间检查", True, f"磁盘使用情况:\n  {disk_info.replace(chr(10), chr(10) + '  ')}")
            return True
            
        except Exception as e:
            self.print_result("磁盘空间检查", False, f"异常: {e}")
            return False
    
    def test_system_load(self) -> bool:
        """测试系统负载"""
        if not self.ssh_client:
            self.print_result("系统负载检查", False, "需要先建立SSH连接")
            return False
        
        try:
            # 检查系统负载
            stdin, stdout, stderr = self.ssh_client.exec_command("uptime")
            load_info = stdout.read().decode()
            
            self.print_result("系统负载检查", True, f"系统负载: {load_info.strip()}")
            return True
            
        except Exception as e:
            self.print_result("系统负载检查", False, f"异常: {e}")
            return False
    
    def run_all_tests(self) -> bool:
        """运行所有服务器连通性测试"""
        print(f"开始测试服务器连通性")
        print(f"服务器: {self.host}")
        print(f"SSH密钥: {self.ssh_key_path}")
        print(f"用户名: {self.username}")
        print("=" * 50)
        
        # 基础网络测试
        ping_success = self.test_ping()
        
        # 测试关键端口
        ports_to_test = [
            (22, "SSH"),
            (80, "HTTP"),
            (443, "HTTPS"),
            (8000, "Backend API"),
            (3080, "Frontend"),
            (5432, "PostgreSQL"),
            (6379, "Redis"),

        ]
        
        port_results = []
        for port, service in ports_to_test:
            port_results.append(self.test_port_connectivity(port, service))
        
        # SSH连接测试
        ssh_success = self.test_ssh_connection()
        
        # 如果SSH连接成功，测试服务器状态
        if ssh_success:
            self.test_server_services()
            self.test_disk_space()
            self.test_system_load()
        
        print("=" * 50)
        
        # 汇总结果
        all_tests_passed = all([ping_success, ssh_success] + port_results)
        
        if all_tests_passed:
            print("✓ 所有服务器连通性测试通过！")
        else:
            print("✗ 部分服务器连通性测试失败")
        
        return all_tests_passed

def main():
    """主函数"""
    # 从命令行参数获取配置
    host = "47.108.76.21"
    ssh_key = "~/Desktop/global_link47.108.76.21.pem"
    username = "ubuntu"
    
    if len(sys.argv) > 1:
        host = sys.argv[1]
    if len(sys.argv) > 2:
        ssh_key = sys.argv[2]
    if len(sys.argv) > 3:
        username = sys.argv[3]
    
    # 创建测试器并运行测试
    tester = ServerConnectivityTester(host, ssh_key, username)
    tester.run_all_tests()

if __name__ == "__main__":
    main()