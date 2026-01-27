# ThingsVis Preview

独立的可视化预览应用，支持从Studio编辑器打开项目预览，也支持独立部署为大屏展示服务。

## 🚀 三种运行模式

### 1. User预览模式
从Studio打开的预览窗口，带工具栏（返回、刷新、全屏）。

**URL格式**:
```
http://localhost:3001/?projectId=xxx&mode=user
```

### 2. Kiosk大屏模式
纯全屏展示，无工具栏，适合IoT大屏。

**URL格式**:
```
http://localhost:3001/?projectId=xxx&mode=kiosk
```

### 3. Dev开发模式
开发调试模式，带性能测试工具。

**URL格式**:
```
http://localhost:3001/?mode=dev
```

## 📦 本地开发

### 启动开发服务器
```bash
pnpm run dev
```

访问: http://localhost:3001

### 构建生产版本
```bash
pnpm run build
```

构建产物位于 `dist/` 目录。

### 分析打包体积
```bash
pnpm run build:analyze
```

## 🌐 生产部署

详见 [DEPLOYMENT.md](./DEPLOYMENT.md)

### 快速部署（Linux）
```bash
chmod +x deploy.sh
./deploy.sh
```

### Docker部署
```bash
docker build -t thingsvis-preview .
docker run -d -p 80:80 thingsvis-preview
```

## ⚙️ 环境配置

复制 `.env.production.example` 为 `.env.production`:

```bash
cp .env.production.example .env.production
```

编辑配置：
- `VITE_API_URL` - API后端地址
- `VITE_PLUGIN_URL` - 插件CDN地址
- `VITE_STUDIO_URL` - Studio编辑器地址

## 📁 文件说明

| 文件 | 说明 |
|------|------|
| `rspack.config.js` | 开发构建配置 |
| `rspack.config.prod.js` | 生产构建配置 |
| `nginx.conf` | Nginx服务器配置 |
| `deploy.sh` | 自动化部署脚本 |
| `Dockerfile` | Docker容器配置 |
| `DEPLOYMENT.md` | 详细部署文档 |

## 🔗 与Studio集成

在Studio中点击预览按钮，会：
1. 打开Preview窗口
2. 通过PostMessage传递项目数据
3. Preview接收数据并渲染

## 🎨 技术栈

- **构建工具**: Rspack
- **UI框架**: React 18
- **渲染引擎**: Leafer-UI
- **模块联邦**: Module Federation
- **Web服务器**: Nginx

## 📊 构建优化

- ✅ 代码分割（Code Splitting）
- ✅ Tree Shaking
- ✅ 压缩混淆（Minification）
- ✅ Gzip压缩
- ✅ 缓存策略

## 🔧 故障排查

### 预览窗口空白
- 检查PostMessage通信
- 查看浏览器控制台错误
- 确认项目数据正确传递

### 插件加载失败
-检查Module Federation配置
- 确认插件CDN可访问
- 检查CORS设置

## 📝 开发指南

### 添加新模式
在 `src/App.tsx` 中添加新的URL参数处理逻辑。

### 修改工具栏
编辑 `src/components/UserToolbar.tsx`。

### 配置canvas
在 `App.tsx` 中修改 `canvasMode` 和 `gridSettings`。

## 📄 许可证

与主项目相同

---

**部署问题？** 查看 [DEPLOYMENT.md](./DEPLOYMENT.md)
