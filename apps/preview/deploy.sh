#!/bin/bash

# ===================================================================
# ThingsVis Preview 部署脚本
# 用途: 自动构建并部署Preview应用到nginx服务器
# 使用: chmod +x deploy.sh && ./deploy.sh
# ===================================================================

set -e  # 遇到错误立即退出

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 配置项
DEPLOY_DIR="/var/www/thingsvis-preview"
NGINX_CONF="/etc/nginx/sites-available/thingsvis-preview"
BACKUP_DIR="/var/backups/thingsvis-preview"

echo -e "${GREEN}🚀 ThingsVis Preview 部署脚本${NC}"
echo "========================================"

# 1. 检查依赖
echo -e "${YELLOW}📋 检查依赖...${NC}"
command -v pnpm >/dev/null 2>&1 || { echo -e "${RED}错误: 需要安装pnpm${NC}" >&2; exit 1; }
command -v nginx >/dev/null 2>&1 || { echo -e "${RED}错误: 需要安装nginx${NC}" >&2; exit 1; }

# 2. 构建项目
echo -e "${YELLOW}📦 构建生产版本...${NC}"
pnpm run build

# 检查构建是否成功
if [ ! -d "dist" ]; then
    echo -e "${RED}❌ 构建失败: dist目录不存在${NC}"
    exit 1
fi

echo -e "${GREEN}✅ 构建完成${NC}"

# 3. 备份现有文件（如果存在）
if [ -d "$DEPLOY_DIR" ]; then
    echo -e "${YELLOW}💾 备份现有文件...${NC}"
    BACKUP_NAME="backup-$(date +%Y%m%d-%H%M%S)"
    sudo mkdir -p "$BACKUP_DIR"
    sudo cp -r "$DEPLOY_DIR" "$BACKUP_DIR/$BACKUP_NAME"
    echo -e "${GREEN}✅ 备份完成: $BACKUP_DIR/$BACKUP_NAME${NC}"
fi

# 4. 创建部署目录
echo -e "${YELLOW}📂 准备部署目录...${NC}"
sudo mkdir -p "$DEPLOY_DIR"

# 5. 复制文件
echo -e "${YELLOW}📤 复制文件到服务器...${NC}"
sudo rm -rf "$DEPLOY_DIR"/*
sudo cp -r dist/* "$DEPLOY_DIR/"

# 设置文件权限
sudo chown -R www-data:www-data "$DEPLOY_DIR"
sudo chmod -R 755 "$DEPLOY_DIR"

echo -e "${GREEN}✅ 文件复制完成${NC}"

# 6. 配置Nginx
echo -e "${YELLOW}⚙️  配置Nginx...${NC}"
sudo cp nginx.conf "$NGINX_CONF"

# 创建软链接（如果不存在）
if [ ! -L "/etc/nginx/sites-enabled/thingsvis-preview" ]; then
    sudo ln -s "$NGINX_CONF" /etc/nginx/sites-enabled/thingsvis-preview
    echo -e "${GREEN}✅ Nginx软链接已创建${NC}"
fi

# 7. 测试Nginx配置
echo -e "${YELLOW}🔍 测试Nginx配置...${NC}"
sudo nginx -t

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Nginx配置测试通过${NC}"
else
    echo -e "${RED}❌ Nginx配置测试失败${NC}"
    echo -e "${YELLOW}回滚到备份版本...${NC}"
    if [ -d "$BACKUP_DIR/$BACKUP_NAME" ]; then
        sudo rm -rf "$DEPLOY_DIR"/*
        sudo cp -r "$BACKUP_DIR/$BACKUP_NAME"/* "$DEPLOY_DIR/"
        echo -e "${GREEN}✅ 已回滚${NC}"
    fi
    exit 1
fi

# 8. 重载Nginx
echo -e "${YELLOW}🔄 重载Nginx...${NC}"
sudo systemctl reload nginx

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Nginx重载成功${NC}"
else
    echo -e "${RED}❌ Nginx重载失败${NC}"
    exit 1
fi

# 9. 清理旧备份（保留最近5个）
echo -e "${YELLOW}🧹 清理旧备份...${NC}"
if [ -d "$BACKUP_DIR" ]; then
    cd "$BACKUP_DIR"
    ls -t | tail -n +6 | xargs -r sudo rm -rf
    echo -e "${GREEN}✅ 备份清理完成${NC}"
fi

# 10. 完成
echo "========================================"
echo -e "${GREEN}🎉 部署完成！${NC}"
echo ""
echo -e "📊 部署信息:"
echo -e "  - 部署目录: ${YELLOW}$DEPLOY_DIR${NC}"
echo -e "  - 备份位置: ${YELLOW}$BACKUP_DIR/$BACKUP_NAME${NC}"
echo -e "  - Nginx配置: ${YELLOW}$NGINX_CONF${NC}"
echo ""
echo -e "🌐 访问地址:"
echo -e "  - http://preview.thingsvis.local"
echo -e "  - http://localhost (如果在本地)"
echo ""
echo -e "${GREEN}✨ 部署成功，祝使用愉快！${NC}"
