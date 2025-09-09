#!/bin/bash

# GlobalLink 测试环境完整测试脚本
# 测试服务器: 47.108.76.21
# 测试账号: 15010993510@163.com / 12345678

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置参数
TEST_SERVER="47.108.76.21"
SSH_KEY="~/Desktop/global_link47.108.76.21.pem"
SSH_USER="ubuntu"
TEST_EMAIL="15010993510@163.com"
TEST_PASSWORD="12345678"

# 函数定义
print_header() {
    echo -e "${BLUE}=== $1 ===${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# 检查Python依赖
check_python_dependencies() {
    print_header "检查Python依赖"
    
    # 检查Python3
    if ! command -v python3 &> /dev/null; then
        print_error "Python3 未安装"
        exit 1
    fi
    print_success "Python3 已安装"
    
    # 检查pip3
    if ! command -v pip3 &> /dev/null; then
        print_error "pip3 未安装"
        exit 1
    fi
    print_success "pip3 已安装"
    
    # 检查必要的Python包
    REQUIRED_PACKAGES=("requests" "paramiko")
    
    for package in "${REQUIRED_PACKAGES[@]}"; do
        if python3 -c "import $package" 2>/dev/null; then
            print_success "$package 已安装"
        else
            print_warning "$package 未安装，正在安装..."
            pip3 install "$package"
            if [ $? -eq 0 ]; then
                print_success "$package 安装成功"
            else
                print_error "$package 安装失败"
                exit 1
            fi
        fi
    done
    
    echo
}

# 运行服务器连通性测试
run_server_tests() {
    print_header "运行服务器连通性测试"
    
    cd "$(dirname "$0")"
    
    if [ ! -f "test_server_connectivity.py" ]; then
        print_error "服务器连通性测试脚本不存在"
        return 1
    fi
    
    python3 test_server_connectivity.py "$TEST_SERVER" "$SSH_KEY" "$SSH_USER"
    SERVER_TEST_RESULT=$?
    
    if [ $SERVER_TEST_RESULT -eq 0 ]; then
        print_success "服务器连通性测试通过"
    else
        print_error "服务器连通性测试失败"
    fi
    
    echo
    return $SERVER_TEST_RESULT
}

# 运行API接口测试
run_api_tests() {
    print_header "运行API接口测试"
    
    cd "$(dirname "$0")"
    
    if [ ! -f "test_all_apis.py" ]; then
        print_error "API接口测试脚本不存在"
        return 1
    fi
    
    python3 test_all_apis.py "$TEST_EMAIL" "$TEST_PASSWORD"
    API_TEST_RESULT=$?
    
    if [ $API_TEST_RESULT -eq 0 ]; then
        print_success "API接口测试通过"
    else
        print_error "API接口测试失败"
    fi
    
    echo
    return $API_TEST_RESULT
}

# 生成测试报告
generate_test_report() {
    local server_result=$1
    local api_result=$2
    
    print_header "测试报告"
    
    echo "服务器: $TEST_SERVER"
    echo "测试时间: $(date)"
    echo "-" | sed 's/./-/g'
    
    if [ $server_result -eq 0 ]; then
        echo -e "服务器连通性: ${GREEN}通过${NC}"
    else
        echo -e "服务器连通性: ${RED}失败${NC}"
    fi
    
    if [ $api_result -eq 0 ]; then
        echo -e "API接口测试: ${GREEN}通过${NC}"
    else
        echo -e "API接口测试: ${RED}失败${NC}"
    fi
    
    echo "-" | sed 's/./-/g'
    
    if [ $server_result -eq 0 ] && [ $api_result -eq 0 ]; then
        echo -e "${GREEN}所有测试通过！测试环境正常运行。${NC}"
        return 0
    else
        echo -e "${RED}测试失败！请检查测试环境配置。${NC}"
        return 1
    fi
}

# 主函数
main() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}    GlobalLink 测试环境完整测试脚本    ${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo
    
    # 显示配置信息
    echo "测试服务器: $TEST_SERVER"
    echo "SSH密钥: $SSH_KEY"
    echo "SSH用户: $SSH_USER"
    echo "测试账号: $TEST_EMAIL"
    echo
    
    # 检查依赖
    check_python_dependencies
    
    # 运行测试
    run_server_tests
    SERVER_RESULT=$?
    
    run_api_tests
    API_RESULT=$?
    
    # 生成报告
    echo
    generate_test_report $SERVER_RESULT $API_RESULT
    FINAL_RESULT=$?
    
    echo
    echo -e "${BLUE}========================================${NC}"
    
    exit $FINAL_RESULT
}

# 支持命令行参数
while [[ $# -gt 0 ]]; do
    case $1 in
        -s|--server)
            TEST_SERVER="$2"
            shift 2
            ;;
        -k|--ssh-key)
            SSH_KEY="$2"
            shift 2
            ;;
        -u|--ssh-user)
            SSH_USER="$2"
            shift 2
            ;;
        -e|--email)
            TEST_EMAIL="$2"
            shift 2
            ;;
        -p|--password)
            TEST_PASSWORD="$2"
            shift 2
            ;;
        -h|--help)
            echo "用法: $0 [选项]"
            echo "选项:"
            echo "  -s, --server <ip>       测试服务器IP地址"
            echo "  -k, --ssh-key <path>    SSH密钥文件路径"
            echo "  -u, --ssh-user <user>  SSH用户名"
            echo "  -e, --email <email>    测试账号邮箱"
            echo "  -p, --password <pass>  测试账号密码"
            echo "  -h, --help             显示帮助信息"
            exit 0
            ;;
        *)
            echo "未知选项: $1"
            exit 1
            ;;
    esac
done

# 执行主函数
main "$@"