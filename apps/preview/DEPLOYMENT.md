# ThingsVis Preview 部署文档

## 📋 概述

本文档说明如何将 ThingsVis Preview 应用部署到生产环境。

## 🚀 快速开始

### 前置要求

- Node.js 18+
- pnpm 8+
- Nginx
- Linux服务器（推荐Ubuntu 20.04+）

### 一键部署

```bash
cd apps/preview
chmod +x deploy.sh
./deploy.sh
```

## 📦 手动部署

### 1. 构建生产版本

```bash
cd apps/preview
pnpm run build
```

构建产物位于 `dist/` 目录。

### 2. 上传文件到服务器

```bash
# 方式1: 使用scp
scp -r dist/* user@server:/var/www/thingsvis-preview/

# 方式2: 使用rsync
rsync -avz --delete dist/ user@server:/var/www/thingsvis-preview/
```

### 3. 配置Nginx

```bash
# 复制nginx配置
sudo cp nginx.conf /etc/nginx/sites-available/thingsvis-preview

# 创建软链接
sudo ln -s /etc/nginx/sites-available/thingsvis-preview /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重载nginx
sudo systemctl reload nginx
```

### 4. 设置文件权限

```bash
sudo chown -R www-data:www-data /var/www/thingsvis-preview
sudo chmod -R 755 /var/www/thingsvis-preview
```

## 🐳 Docker部署

### 构建镜像

```bash
cd apps/preview
docker build -t thingsvis-preview:latest .
```

### 运行容器

```bash
docker run -d \
  --name thingsvis-preview \
  -p 80:80 \
  -v /path/to/plugins:/usr/share/nginx/html/plugins \
  thingsvis-preview:latest
```

### Docker Compose

创建 `docker-compose.yml`:

```yaml
version: '3.8'
services:
  preview:
    build: .
    ports:
      - "80:80"
    volumes:
      - ./plugins:/usr/share/nginx/html/plugins
    restart: unless-stopped
```

运行：
```bash
docker-compose up -d
```

## ⚙️ 配置说明

### 环境变量

复制 `.env.production.example` 为 `.env.production` 并修改：

```bash
# API地址
VITE_API_URL=https://api.your-domain.com

# 插件CDN
VITE_PLUGIN_URL=https://cdn.your-domain.com/plugins

# Studio地址
VITE_STUDIO_URL=https://studio.your-domain.com
```

### Nginx配置

修改 `nginx.conf` 中的域名：

```nginx
server_name preview.your-domain.com;
```

如果启用HTTPS，配置SSL证书：

```nginx
ssl_certificate /path/to/cert.pem;
ssl_certificate_key /path/to/key.pem;
```

## 🔗 与Studio集成

在Studio中配置Preview地址：

```javascript
// apps/studio/src/config.ts
export const PREVIEW_URL = 'https://preview.your-domain.com';
```

## 🌐 访问方式

### 用户预览模式
```
https://preview.your-domain.com/?projectId=xxx&mode=user
```

### Kiosk大屏模式
```
https://preview.your-domain.com/?projectId=xxx&mode=kiosk
```

### 开发模式
```
https://preview.your-domain.com/?mode=dev
```

## 📊 验证部署

1. **检查文件是否正确上传**
   ```bash
   ls -la /var/www/thingsvis-preview
   ```

2. **检查Nginx状态**
   ```bash
   sudo systemctl status nginx
   sudo nginx -t
   ```

3. **访问测试**
   ```bash
   curl http://localhost
   ```

4. **查看Nginx日志**
   ```bash
   sudo tail -f /var/log/nginx/thingsvis-preview-access.log
   sudo tail -f /var/log/nginx/thingsvis-preview-error.log
   ```

## 🔧 故障排查

### 问题1: 404 Not Found

**原因**: Nginx配置路径不正确

**解决**:
```bash
# 检查root路径
sudo vi /etc/nginx/sites-available/thingsvis-preview
# 确保指向正确的dist目录
```

### 问题2: 刷新页面404

**原因**: SPA路由未配置

**解决**: 确保nginx.conf包含：
```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

### 问题3: PostMessage通信失败

**原因**: 跨域问题

**解决**: 确保Studio和Preview在同一域名或配置CORS

### 问题4: 插件加载失败

**原因**: Module Federation路径不正确

**解决**: 检查插件CDN配置和CORS设置

## 🔄 更新部署

### 使用脚本更新
```bash
cd apps/preview
./deploy.sh
```

脚本会自动：
1. 备份当前版本
2. 构建新版本
3. 替换文件
4. 重载Nginx
5. 失败时自动回滚

### 手动更新
```bash
# 1. 备份
sudo cp -r /var/www/thingsvis-preview /var/backups/preview-$(date +%Y%m%d)

# 2. 构建
pnpm run build

# 3. 替换
sudo rm -rf /var/www/thingsvis-preview/*
sudo cp -r dist/* /var/www/thingsvis-preview/

# 4. 重载
sudo systemctl reload nginx
```

## 📈 性能优化

### 启用HTTP/2
nginx.conf中:
```nginx
listen 443 ssl http2;
```

### 启用Brotli压缩（可选）
```bash
sudo apt install nginx-module-brotli
```

添加到nginx.conf:
```nginx
brotli on;
brotli_types text/plain text/css application/json application/javascript;
```

### CDN加速
将静态资源上传到CDN，修改publicPath。

## 🔒 安全建议

1. **启用HTTPS** - Let's Encrypt免费证书
2. **配置防火墙** - 只开放必要端口
3. **设置安全头** - 已在nginx.conf中配置
4. **定期更新** - 保持依赖和系统更新
5. **访问日志** - 监控异常访问

## 📝 维护清单

- [ ] 每周检查日志
- [ ] 每月更新依赖
- [ ] 每季度备份测试
- [ ] SSL证书到期前更新
- [ ] 监控磁盘空间

## 🆘 支持

如遇问题，请检查：
1. Nginx错误日志
2. 浏览器控制台
3. Network请求
4. PostMessage通信

---

**部署完成后，记得在Studio中配置Preview URL！**
