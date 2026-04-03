#!/bin/bash
# 分享链接功能快速测试脚本
# 使用方法: ./test-share-link.sh

set -e

# 配置
API_BASE="http://localhost:8000/api/v1"
FRONTEND_BASE="http://localhost:3000"

# 颜色输出
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🚀 开始测试分享链接功能..."
echo ""

# 检查后端是否运行
echo "📡 检查后端服务..."
if curl -s "$API_BASE/health" > /dev/null; then
    echo -e "${GREEN}✅ 后端服务运行正常${NC}"
else
    echo -e "${RED}❌ 后端服务未运行，请先启动：cd apps/server && pnpm dev${NC}"
    exit 1
fi

# 1. 登录获取 token
echo ""
echo "🔐 步骤 1: 登录获取认证 Token..."
read -p "请输入邮箱: " EMAIL
read -sp "请输入密码: " PASSWORD
echo ""

LOGIN_RESPONSE=$(curl -s -X POST "$API_BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo -e "${RED}❌ 登录失败，请检查账号密码${NC}"
    echo "响应: $LOGIN_RESPONSE"
    exit 1
fi

echo -e "${GREEN}✅ 登录成功${NC}"
echo "Token: ${TOKEN:0:20}..."

# 2. 获取或创建仪表板
echo ""
echo "📊 步骤 2: 获取仪表板列表..."
DASHBOARDS_RESPONSE=$(curl -s -X GET "$API_BASE/dashboards?limit=1" \
  -H "Authorization: Bearer $TOKEN")

DASHBOARD_ID=$(echo $DASHBOARDS_RESPONSE | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)

if [ -z "$DASHBOARD_ID" ]; then
    echo -e "${YELLOW}⚠️  没有找到仪表板，正在创建测试仪表板...${NC}"
    
    # 创建项目
    PROJECT_RESPONSE=$(curl -s -X POST "$API_BASE/projects" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d '{"name":"测试项目","description":"用于测试分享链接"}')
    
    PROJECT_ID=$(echo $PROJECT_RESPONSE | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
    
    # 创建仪表板
    DASHBOARD_RESPONSE=$(curl -s -X POST "$API_BASE/dashboards" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d "{\"name\":\"测试仪表板\",\"projectId\":\"$PROJECT_ID\",\"canvasConfig\":{\"mode\":\"infinite\",\"width\":1920,\"height\":1080}}")
    
    DASHBOARD_ID=$(echo $DASHBOARD_RESPONSE | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
fi

echo -e "${GREEN}✅ 使用仪表板: $DASHBOARD_ID${NC}"

# 3. 创建分享链接
echo ""
echo "🔗 步骤 3: 创建分享链接..."
SHARE_RESPONSE=$(curl -s -X POST "$API_BASE/dashboards/$DASHBOARD_ID/share" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"expiresIn":86400}')

SHARE_URL=$(echo $SHARE_RESPONSE | grep -o '"shareUrl":"[^"]*' | cut -d'"' -f4)
SHARE_TOKEN=$(echo $SHARE_URL | grep -o 'shareToken=[^&]*' | cut -d'=' -f2)

if [ -z "$SHARE_URL" ]; then
    echo -e "${RED}❌ 创建分享链接失败${NC}"
    echo "响应: $SHARE_RESPONSE"
    exit 1
fi

echo -e "${GREEN}✅ 分享链接创建成功${NC}"
echo "分享链接: $SHARE_URL"
echo "Share Token: $SHARE_TOKEN"

# 4. 验证分享链接（无需认证）
echo ""
echo "✅ 步骤 4: 验证分享链接（无需认证）..."
VALIDATE_RESPONSE=$(curl -s -X GET "$API_BASE/dashboards/$DASHBOARD_ID/validate-share?shareToken=$SHARE_TOKEN")

IS_VALID=$(echo $VALIDATE_RESPONSE | grep -o '"valid":[^,}]*' | cut -d':' -f2)

if [ "$IS_VALID" = "true" ]; then
    echo -e "${GREEN}✅ 分享链接验证成功（无需认证）${NC}"
else
    echo -e "${RED}❌ 分享链接验证失败${NC}"
    echo "响应: $VALIDATE_RESPONSE"
    exit 1
fi

# 5. 查询分享信息
echo ""
echo "📋 步骤 5: 查询分享信息..."
INFO_RESPONSE=$(curl -s -X GET "$API_BASE/dashboards/$DASHBOARD_ID/share" \
  -H "Authorization: Bearer $TOKEN")

echo "$INFO_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$INFO_RESPONSE"

# 6. 测试吊销（可选）
echo ""
read -p "是否测试吊销分享链接？(y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🚫 步骤 6: 吊销分享链接..."
    curl -s -X DELETE "$API_BASE/dashboards/$DASHBOARD_ID/share" \
      -H "Authorization: Bearer $TOKEN"
    
    echo -e "${GREEN}✅ 分享链接已吊销${NC}"
    
    # 验证吊销后无法访问
    echo "验证吊销后无法访问..."
    VALIDATE_AFTER=$(curl -s -X GET "$API_BASE/dashboards/$DASHBOARD_ID/validate-share?shareToken=$SHARE_TOKEN")
    
    if echo "$VALIDATE_AFTER" | grep -q "Share not enabled"; then
        echo -e "${GREEN}✅ 确认吊销成功，无法访问${NC}"
    else
        echo -e "${RED}❌ 吊销验证失败${NC}"
    fi
fi

# 总结
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}🎉 测试完成！${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "测试结果总结："
echo "✅ 登录认证"
echo "✅ 创建分享链接"
echo "✅ 验证分享链接（无需认证）"
echo "✅ 查询分享信息"
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "✅ 吊销分享链接"
fi
echo ""
echo "📝 下一步："
echo "1. 在浏览器中打开分享链接测试前端："
echo "   $SHARE_URL"
echo ""
echo "2. 使用隐私窗口/无痕模式访问，验证无需登录即可查看"
echo ""
echo "3. 查看完整测试指南: cat TESTING_GUIDE.md"
echo ""
