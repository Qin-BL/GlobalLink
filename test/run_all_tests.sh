#!/bin/bash

# GlobalLink 测试环境完整测试脚本
# 版本: 2.0
# 功能: 运行完整的测试套件，包括单元测试、集成测试、API测试等

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 默认配置参数
DEFAULT_TEST_SERVER="localhost"
DEFAULT_TEST_PORT="8000"
DEFAULT_TEST_EMAIL="15010993510@163.com"
DEFAULT_TEST_PASSWORD="12345678"

# 配置参数（可通过命令行参数覆盖）
TEST_SERVER="${TEST_SERVER:-$DEFAULT_TEST_SERVER}"
TEST_PORT="${TEST_PORT:-$DEFAULT_TEST_PORT}"
TEST_EMAIL="${TEST_EMAIL:-$DEFAULT_TEST_EMAIL}"
TEST_PASSWORD="${TEST_PASSWORD:-$DEFAULT_TEST_PASSWORD}"
VERBOSE=false
SKIP_SERVER_TESTS=false
GENERATE_REPORT=true
REPORT_FILE=""

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

print_info() {
    echo -e "${CYAN}ℹ $1${NC}"
}

print_step() {
    echo -e "${PURPLE}▶ $1${NC}"
}

# 显示帮助信息
show_help() {
    cat << EOF
GlobalLink 测试环境完整测试脚本 v2.0

用法: $0 [选项]

选项:
  -s, --server <ip>         测试服务器IP地址 (默认: $DEFAULT_TEST_SERVER)
  -p, --port <port>         测试服务器端口 (默认: $DEFAULT_TEST_PORT)
  -e, --email <email>       测试账号邮箱 (默认: $DEFAULT_TEST_EMAIL)
  -w, --password <pass>     测试账号密码 (默认: $DEFAULT_TEST_PASSWORD)
  -v, --verbose             显示详细输出
  --skip-server-tests       跳过需要服务器的测试
  --no-report              不生成测试报告
  --report-file <file>     指定测试报告文件路径
  -h, --help               显示帮助信息

测试类型:
  - 单元测试: 核心功能单元测试
  - 白盒测试: 内部实现测试
  - 集成测试: 组件协作测试
  - 黑盒测试: 外部行为测试 (需要服务器)
  - 功能测试: API接口测试 (需要服务器和账号)
  - 错误通知测试: 专项错误通知功能测试 (需要服务器和账号)

示例:
  $0                                    # 运行所有本地测试
  $0 -s localhost -p 8000              # 指定服务器运行所有测试
  $0 --skip-server-tests               # 只运行本地测试
  $0 -v --report-file my_report.txt    # 详细输出并指定报告文件

EOF
}

# 检查系统环境
check_system_environment() {
    print_header "检查系统环境"
    
    # 检查操作系统
    OS=$(uname -s)
    print_info "操作系统: $OS"
    
    # 检查Python3
    if ! command -v python3 &> /dev/null; then
        print_error "Python3 未安装"
        return 1
    fi
    
    PYTHON_VERSION=$(python3 --version 2>&1 | cut -d' ' -f2)
    print_success "Python3 已安装 (版本: $PYTHON_VERSION)"
    
    # 检查pip3
    if ! command -v pip3 &> /dev/null; then
        print_error "pip3 未安装"
        return 1
    fi
    print_success "pip3 已安装"
    
    # 检查必要的Python包
    print_step "检查Python依赖包..."
    REQUIRED_PACKAGES=("requests")
    
    for package in "${REQUIRED_PACKAGES[@]}"; do
        if python3 -c "import $package" 2>/dev/null; then
            print_success "$package 已安装"
        else
            print_warning "$package 未安装，正在安装..."
            if pip3 install "$package" --quiet; then
                print_success "$package 安装成功"
            else
                print_error "$package 安装失败"
                return 1
            fi
        fi
    done
    
    echo
    return 0
}

# 检查测试文件
check_test_files() {
    print_header "检查测试文件"
    
    local test_files=(
        "__init__.py"
        "test_units.py"
        "test_whitebox.py"
        "test_integration.py"
        "test_blackbox.py"
        "test_all_apis.py"
        "test_error_notification.py"
        "run_all_tests.py"
    )
    
    local missing_files=()
    
    for file in "${test_files[@]}"; do
        if [ -f "$file" ]; then
            print_success "$file 存在"
        else
            print_error "$file 不存在"
            missing_files+=("$file")
        fi
    done
    
    if [ ${#missing_files[@]} -gt 0 ]; then
        print_error "缺少测试文件: ${missing_files[*]}"
        return 1
    fi
    
    echo
    return 0
}

# 检查服务器连接
check_server_connection() {
    local server="$1"
    local port="$2"
    
    print_header "检查服务器连接"
    print_info "服务器: $server:$port"
    
    # 检查服务器是否可达
    if command -v nc &> /dev/null; then
        if nc -z "$server" "$port" 2>/dev/null; then
            print_success "服务器连接正常"
            return 0
        else
            print_error "无法连接到服务器 $server:$port"
            return 1
        fi
    elif command -v telnet &> /dev/null; then
        if timeout 5 telnet "$server" "$port" 2>/dev/null | grep -q "Connected"; then
            print_success "服务器连接正常"
            return 0
        else
            print_error "无法连接到服务器 $server:$port"
            return 1
        fi
    else
        print_warning "无法检查服务器连接 (缺少 nc 或 telnet 工具)"
        return 0
    fi
}

# 运行Python测试套件
run_python_tests() {
    local base_url="$1"
    local email="$2"
    local password="$3"
    local verbose_flag="$4"
    local report_flag="$5"
    
    print_header "运行Python测试套件"
    
    local cmd="python3 run_all_tests.py"
    
    # 添加参数
    if [ -n "$base_url" ]; then
        cmd="$cmd --base-url $base_url"
    fi
    
    if [ -n "$email" ]; then
        cmd="$cmd --email $email"
    fi
    
    if [ -n "$password" ]; then
        cmd="$cmd --password $password"
    fi
    
    if [ "$verbose_flag" = true ]; then
        cmd="$cmd --verbose"
    fi
    
    if [ -n "$report_flag" ]; then
        cmd="$cmd --report $report_flag"
    elif [ "$GENERATE_REPORT" = false ]; then
        cmd="$cmd --no-report"
    fi
    
    print_info "执行命令: $cmd"
    echo
    
    # 执行测试
    if eval "$cmd"; then
        print_success "Python测试套件执行完成"
        return 0
    else
        print_error "Python测试套件执行失败"
        return 1
    fi
}

# 运行单独的测试类型
run_individual_tests() {
    local base_url="$1"
    local email="$2"
    local password="$3"
    
    print_header "运行单独测试"
    
    local test_results=()
    
    # 1. 单元测试
    print_step "运行单元测试..."
    if python3 -m test.test_units; then
        print_success "单元测试通过"
        test_results+=("单元测试:通过")
    else
        print_error "单元测试失败"
        test_results+=("单元测试:失败")
    fi
    echo
    
    # 2. 白盒测试
    print_step "运行白盒测试..."
    if python3 -m test.test_whitebox; then
        print_success "白盒测试通过"
        test_results+=("白盒测试:通过")
    else
        print_error "白盒测试失败"
        test_results+=("白盒测试:失败")
    fi
    echo
    
    # 3. 集成测试
    print_step "运行集成测试..."
    if python3 -m test.test_integration; then
        print_success "集成测试通过"
        test_results+=("集成测试:通过")
    else
        print_error "集成测试失败"
        test_results+=("集成测试:失败")
    fi
    echo
    
    # 4. 黑盒测试 (需要服务器)
    if [ -n "$base_url" ] && [ "$SKIP_SERVER_TESTS" = false ]; then
        print_step "运行黑盒测试..."
        if python3 test_blackbox.py "$base_url"; then
            print_success "黑盒测试通过"
            test_results+=("黑盒测试:通过")
        else
            print_error "黑盒测试失败"
            test_results+=("黑盒测试:失败")
        fi
        echo
        
        # 5. 功能测试 (需要服务器和账号)
        if [ -n "$email" ] && [ -n "$password" ]; then
            print_step "运行功能测试..."
            if python3 test_all_apis.py "$base_url" "$email" "$password"; then
                print_success "功能测试通过"
                test_results+=("功能测试:通过")
            else
                print_error "功能测试失败"
                test_results+=("功能测试:失败")
            fi
            echo
        else
            print_warning "跳过功能测试 (未提供测试账号)"
            test_results+=("功能测试:跳过")
        fi
    else
        print_warning "跳过服务器相关测试"
        test_results+=("黑盒测试:跳过")
        test_results+=("功能测试:跳过")
    fi
    
    # 显示测试结果汇总
    print_header "单独测试结果汇总"
    for result in "${test_results[@]}"; do
        local test_name="${result%:*}"
        local test_status="${result#*:}"
        
        case "$test_status" in
            "通过")
                print_success "$test_name: $test_status"
                ;;
            "失败")
                print_error "$test_name: $test_status"
                ;;
            "跳过")
                print_warning "$test_name: $test_status"
                ;;
        esac
    done
    echo
    
    # 检查是否有失败的测试
    local failed_count=$(printf '%s\n' "${test_results[@]}" | grep -c ":失败" || true)
    return "$failed_count"
}

# 生成测试报告摘要
generate_summary_report() {
    local report_file="$1"
    local start_time="$2"
    local end_time="$3"
    
    if [ -z "$report_file" ]; then
        report_file="test_summary_$(date +%Y%m%d_%H%M%S).txt"
    fi
    
    print_header "生成测试报告摘要"
    
    {
        echo "GlobalLink 测试环境完整测试报告"
        echo "=================================="
        echo "生成时间: $(date '+%Y-%m-%d %H:%M:%S')"
        echo "测试服务器: $TEST_SERVER:$TEST_PORT"
        echo "测试账号: $TEST_EMAIL"
        echo "开始时间: $start_time"
        echo "结束时间: $end_time"
        echo ""
        echo "测试环境信息:"
        echo "- 操作系统: $(uname -s)"
        echo "- Python版本: $(python3 --version 2>&1)"
        echo "- 脚本版本: 2.0"
        echo ""
        echo "执行的测试类型:"
        echo "- 单元测试: 核心功能单元测试"
        echo "- 白盒测试: 内部实现测试"
        echo "- 集成测试: 组件协作测试"
        if [ "$SKIP_SERVER_TESTS" = false ]; then
            echo "- 黑盒测试: 外部行为测试"
            echo "- 功能测试: API接口测试"
        fi
        echo ""
        echo "详细测试结果请查看对应的测试输出。"
        echo ""
        echo "报告生成完成。"
    } > "$report_file"
    
    print_success "测试报告摘要已保存到: $report_file"
}

# 主函数
main() {
    local start_time
    local end_time
    local base_url=""
    
    start_time=$(date '+%Y-%m-%d %H:%M:%S')
    
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}    GlobalLink 测试环境完整测试脚本    ${NC}"
    echo -e "${BLUE}              版本 2.0                ${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo
    
    # 显示配置信息
    print_info "测试服务器: $TEST_SERVER:$TEST_PORT"
    print_info "测试账号: $TEST_EMAIL"
    print_info "详细输出: $VERBOSE"
    print_info "跳过服务器测试: $SKIP_SERVER_TESTS"
    print_info "生成报告: $GENERATE_REPORT"
    echo
    
    # 1. 检查系统环境
    if ! check_system_environment; then
        print_error "系统环境检查失败"
        exit 1
    fi
    
    # 2. 检查测试文件
    if ! check_test_files; then
        print_error "测试文件检查失败"
        exit 1
    fi
    
    # 3. 检查服务器连接 (如果不跳过服务器测试)
    if [ "$SKIP_SERVER_TESTS" = false ]; then
        if check_server_connection "$TEST_SERVER" "$TEST_PORT"; then
            base_url="http://$TEST_SERVER:$TEST_PORT"
            print_success "将运行完整测试套件 (包括服务器测试)"
        else
            print_warning "服务器连接失败，将跳过服务器相关测试"
            SKIP_SERVER_TESTS=true
        fi
    else
        print_info "已配置跳过服务器测试"
    fi
    echo
    
    # 4. 运行测试
    local test_success=true
    
    # 构建测试参数
    local verbose_flag=""
    local report_flag=""
    
    if [ "$VERBOSE" = true ]; then
        verbose_flag="true"
    fi
    
    if [ "$GENERATE_REPORT" = true ] && [ -n "$REPORT_FILE" ]; then
        report_flag="$REPORT_FILE"
    fi
    
    # 运行Python测试套件
    if ! run_python_tests "$base_url" "$TEST_EMAIL" "$TEST_PASSWORD" "$verbose_flag" "$report_flag"; then
        test_success=false
    fi
    
    end_time=$(date '+%Y-%m-%d %H:%M:%S')
    
    # 5. 生成报告摘要
    if [ "$GENERATE_REPORT" = true ]; then
        generate_summary_report "$REPORT_FILE" "$start_time" "$end_time"
    fi
    
    # 6. 最终结果
    echo
    print_header "测试完成"
    print_info "开始时间: $start_time"
    print_info "结束时间: $end_time"
    
    if [ "$test_success" = true ]; then
        print_success "所有测试执行完成！"
        echo -e "${GREEN}🎉 测试套件运行成功${NC}"
        exit 0
    else
        print_error "测试执行过程中出现问题"
        echo -e "${RED}❌ 测试套件运行失败${NC}"
        exit 1
    fi
}

# 解析命令行参数
while [[ $# -gt 0 ]]; do
    case $1 in
        -s|--server)
            TEST_SERVER="$2"
            shift 2
            ;;
        -p|--port)
            TEST_PORT="$2"
            shift 2
            ;;
        -e|--email)
            TEST_EMAIL="$2"
            shift 2
            ;;
        -w|--password)
            TEST_PASSWORD="$2"
            shift 2
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        --skip-server-tests)
            SKIP_SERVER_TESTS=true
            shift
            ;;
        --no-report)
            GENERATE_REPORT=false
            shift
            ;;
        --report-file)
            REPORT_FILE="$2"
            shift 2
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            print_error "未知选项: $1"
            echo "使用 -h 或 --help 查看帮助信息"
            exit 1
            ;;
    esac
done

# 执行主函数
main "$@"