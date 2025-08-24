#!/bin/bash

# 密码加密功能自动化部署脚本
# 此脚本用于自动化部署GlobalLink项目的密码加密传输功能

echo "===== GlobalLink 密码加密功能自动化部署 ====="
echo "开始时间: $(date)"
echo ""

# 设置变量
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="$PROJECT_ROOT/deploy_password_encryption.log"
BACKUP_DIR="$PROJECT_ROOT/backup_$(date +%Y%m%d_%H%M%S)"

# 日志函数
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# 错误处理函数
error_exit() {
    log "错误: $1"
    log "部署失败，请检查日志文件: $LOG_FILE"
    exit 1
}

# 检查系统要求
check_requirements() {
    log "检查系统要求..."
    
    # 检查操作系统
    if [[ -f /etc/os-release ]]; then
        . /etc/os-release
        if [[ "$ID" != "ubuntu" || "$VERSION_ID" != "20.04" ]]; then
            log "警告: 当前系统为 $ID $VERSION_ID，推荐使用 Ubuntu 20.04"
        fi
    fi
    
    # 检查必要命令
    for cmd in git python3 pip node npm nginx openssl; do
        if ! command -v "$cmd" &> /dev/null; then
            error_exit "未找到命令: $cmd，请先安装必要依赖"
        fi
    done
    
    log "系统要求检查通过"
}

# 备份当前配置
backup_config() {
    log "备份当前配置..."
    mkdir -p "$BACKUP_DIR"
    
    # 备份Nginx配置
    if [[ -f /etc/nginx/sites-available/globallink ]]; then
        cp /etc/nginx/sites-available/globallink "$BACKUP_DIR/"
    fi
    
    # 备份SSL证书
    if [[ -f /etc/ssl/certs/globallink.crt ]]; then
        cp /etc/ssl/certs/globallink.crt "$BACKUP_DIR/"
    fi
    
    if [[ -f /etc/ssl/private/globallink.key ]]; then
        cp /etc/ssl/private/globallink.key "$BACKUP_DIR/"
    fi
    
    log "配置备份完成: $BACKUP_DIR"
}

# 安装后端依赖
install_backend_deps() {
    log "安装后端依赖..."
    
    cd "$PROJECT_ROOT/backend"
    
    # 检查虚拟环境
    if [[ ! -d "venv" ]]; then
        python3 -m venv venv || error_exit "创建虚拟环境失败"
    fi
    
    # 激活虚拟环境并安装依赖
    source venv/bin/activate
    pip install -r requirements.txt || error_exit "后端依赖安装失败"
    
    # 特别检查加密相关依赖
    pip install pycryptodome passlib bcrypt || error_exit "加密依赖安装失败"
    
    log "后端依赖安装完成"
}

# 安装前端依赖
install_frontend_deps() {
    log "安装前端依赖..."
    
    cd "$PROJECT_ROOT/frontend"
    npm install || error_exit "前端依赖安装失败"
    
    log "前端依赖安装完成"
}

# 配置HTTPS
configure_https() {
    log "配置HTTPS..."
    
    # 运行Nginx安装脚本（包含HTTPS配置）
    if [[ -f "$PROJECT_ROOT/install/without_docker/install_nginx.sh" ]]; then
        cd "$PROJECT_ROOT/install/without_docker"
        chmod +x install_nginx.sh
        sudo ./install_nginx.sh || error_exit "Nginx配置失败"
    else
        error_exit "未找到Nginx安装脚本"
    fi
    
    log "HTTPS配置完成"
}

# 重启服务
restart_services() {
    log "重启服务..."
    
    # 重启后端服务
    if systemctl is-active --quiet backend; then
        sudo systemctl restart backend || log "警告: 后端服务重启失败"
    else
        log "后端服务未运行，尝试启动..."
        sudo systemctl start backend || log "警告: 后端服务启动失败"
    fi
    
    # 重启前端服务
    if systemctl is-active --quiet frontend; then
        sudo systemctl restart frontend || log "警告: 前端服务重启失败"
    else
        log "前端服务未运行，尝试启动..."
        sudo systemctl start frontend || log "警告: 前端服务启动失败"
    fi
    
    # 重启Nginx
    sudo systemctl restart nginx || error_exit "Nginx重启失败"
    
    log "服务重启完成"
}

# 运行测试
run_tests() {
    log "运行功能测试..."
    
    cd "$PROJECT_ROOT"
    
    # 运行密码加密测试
    if [[ -f "test/test_password_encryption.py" ]]; then
        # 确保激活虚拟环境
        if [[ -d "backend/venv" ]]; then
            source backend/venv/bin/activate
            log "已激活虚拟环境"
        else
            log "警告: 未找到虚拟环境，使用系统Python"
        fi
        
        # 设置Python路径以找到app模块
        export PYTHONPATH="$PROJECT_ROOT/backend:$PYTHONPATH"
        log "设置PYTHONPATH: $PYTHONPATH"
        
        # 运行测试
        python test/test_password_encryption.py
        if [[ $? -eq 0 ]]; then
            log "密码加密功能测试通过"
        else
            error_exit "密码加密功能测试失败"
        fi
    else
        log "警告: 未找到测试文件，跳过测试"
    fi
}

# 验证部署
verify_deployment() {
    log "验证部署..."
    
    # 检查HTTPS访问
    response=$(curl -s -o /dev/null -w "%{http_code}" https://localhost/ 2>/dev/null)
    if [[ "$response" == "200" ]]; then
        log "HTTPS访问验证成功"
    else
        log "警告: HTTPS访问返回代码: $response"
    fi
    
    # 检查服务状态
    if systemctl is-active --quiet nginx; then
        log "Nginx服务运行正常"
    else
        error_exit "Nginx服务未运行"
    fi
    
    log "部署验证完成"
}

# 显示部署信息
show_deployment_info() {
    echo ""
    echo "===== 部署完成 ====="
    echo "部署时间: $(date)"
    echo "项目路径: $PROJECT_ROOT"
    echo "日志文件: $LOG_FILE"
    echo "备份目录: $BACKUP_DIR"
    echo ""
    echo "访问地址:"
    echo "- HTTPS: https://localhost"
    echo "- API文档: https://localhost/docs"
    echo ""
    echo "功能验证:"
    echo "1. 打开浏览器访问 https://localhost"
    echo "2. 检查浏览器地址栏的锁图标"
    echo "3. 测试用户登录功能"
    echo "4. 验证密码加密传输"
    echo ""
    echo "如果遇到问题，请检查日志文件: $LOG_FILE"
    echo "如需回滚，备份文件保存在: $BACKUP_DIR"
}

# 主执行流程
main() {
    log "开始密码加密功能部署"
    
    # 执行部署步骤
    check_requirements
    backup_config
    install_backend_deps
    install_frontend_deps
    configure_https
    restart_services
    run_tests
    verify_deployment
    
    log "密码加密功能部署完成"
    show_deployment_info
}

# 执行主函数
main "$@"

# 记录完成时间
echo ""
echo "===== 部署完成 ====="
echo "完成时间: $(date)"
echo "日志文件: $LOG_FILE"