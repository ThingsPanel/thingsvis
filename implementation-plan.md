# 实现计划 (Implementation Plan)

## 0. 背景介绍

目前，系统根据 `token` 和 `user` 来判断是否已登录，即 `isAuthenticated = !!token && !!user`。而系统中的 `ProtectedRoute` 会通过这个字段强制所有的 `/editor` 路由重定向到 `/login`。这就导致了：

- **宿主嵌入模式 (`Widget Mode`)** 比如在 ThingsPanel 物模型配置中使用 ThingsVis 时，并没有从 URL 传递 token 给 `AuthContext`，而是稍后再通过 `postMessage` (`tv:init`) 传递。这个时候 `ProtectedRoute` 发现还没登录，直接抛向登入页面，并且导致 `tv:init` 到达时，ThingsVis 并不处于 `/editor` 路由下。
- **免登录体验模式 (`Guest Sandbox Mode`)** 从主页进入时不想要输入账号和密码，而是想在本地通过 localStorage (即 `storageMode === 'local'`) 创建项目体验。此时它被重定向到 `/login`。这打破了以前的纯本地可用体验。

为此，我们的实施计划包含以下具体的变更。

## 1. 核心代码变更预期

### 1.1 `AuthContext.tsx`
- **扩展 AuthContext 状态暴露**：导出更加明确的状态，比如 `isGuest`，或者允许使用 `storageMode = 'local'` 作为一种特定运行角色。其实，目前可以通过扩充 `AuthContextValue` 来让组件区分是不是以“游客”身份运行。最稳妥的方式是在 `AuthContextValue` 中添加诸如 `isGuest`、`loginAsGuest` 方法。
- 当处于“体验模式”时（例如用户点击体验），可以调用 `loginAsGuest()`，其将存储类似“匿名标记”的标志，`storageMode` 则判定为 `local`，而不用真的带上 `token`。

更简单的一种实现是：修改 `ProtectedRoute` 的判定基准，允许特权模式即可，无需动太多 `AuthContext`。实际上，可以在 `isEmbedded()` 时或者 `storageMode === 'embed'` / `storageMode === 'local'` / 明确的 guest token 下直接告诉上游不需要通过后台验证。

**具体的落地方案：**
1. 在 `AuthContext.tsx`：增加方法可以启用体验模式（设置 `isGuest` 的临时标记）；对嵌入模式自动认定不走 API 网络强制拦截。或者更原汁原味的做法是将 "Embed" 独立于 "Guest" 和 "Cloud" 之外。
   目前 `isAuthenticated` 是强行设为 `!!token && !!user`。为了免登录本地可用，对于体验模式，我们可以签发一个静态的伪造 User（比如 `{ id: 'guest', username: '体验用户', role: 'guest' }`）并设置在状态中，以通过 `!!user` 考验。或者新增一个显式的 `isGuestData` 使得拦截器能判定。

这里采取向后兼容性最好、改动范围最小的策略（针对这三者的冲突）：

**方案 A（修改 `StorageMode` 的语义与 `ProtectedRoute` 的判断）：**

1. 判定当前环境时，如果是：
   - **嵌入模式 (embed)**：URL带了 `mode=embedded` 或者 `saveTarget=host`（或在 iframe 内部），则认为不需要经过传统的后台登录验证！因为这是个单纯的 Widget！在 `ProtectedRoute` 里面应被视作不需要认证，或者认为 AuthContext 在这个 Mode 下是放行的。
   - **本地体验模式 (local/guest)**：可以点击某个特殊的链接或按钮进入，不调取网络而是写入 localStorage 的某个标记如 `thingsvis_guest_mode = true`。然后在 `AuthContext` 里面，如果检测到了该标记，就把角色置为可以访问的状态（此时不强制需要 `token`，而是认为允许在本地 `local` StorageMode 运行）。

### 1.2 `ProtectedRoute.tsx` 的精简验证

目前代码：
```tsx
  // If authentication is required and user is not authenticated
  if (requireAuth && !isAuthenticated) {
    // Save the location they were trying to go to
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
```
我们修改成：
```tsx
  const { isAuthenticated, isLoading, storageMode, isGuestMode } = useAuth();
  const location = useLocation();

  // 1. 如果是嵌入模式 (storageMode === 'embed')，我们作为组件运行，不应该强制重定向到登录界面。应等待上级消息 (WidgetModeStrategy 接管)。
  // 2. 如果开启了访客/体验模式 (isGuestMode)，也不应该拦截。
  const shouldSkipAuth = storageMode === 'embed' || isGuestMode;

  if (requireAuth && !isAuthenticated && !shouldSkipAuth) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
```

### 1.3 `LoginPage` / `RegisterPage` 里的体验模式按钮

在登录界面通常会提供“免登录体验”按钮，点击后调用 `loginAsGuest()` 方法，然后重定向跳转到 `/editor`。这将在 `AuthContext` 中存储特殊的 guest mode 标记，并在 `AuthContext` 的状态中反映。

## 2. 详细技术实现及验证

### 文件 1: `src/lib/auth/AuthContext.tsx`

修改点：
1. `AuthContextValue` 中添加 `isGuestMode: boolean` 与 `loginAsGuest: () => void` 方法。
2. 存储中可使用 `localStorage.getItem('thingsvis_guest_mode') === 'true'` 作为标记。
3. `clearAuth` 和 `logout` 方法应一同清理该标记。

### 文件 2: `src/components/ProtectedRoute.tsx`

修改点：
1. 提取 `isGuestMode` 和 `storageMode` 从 `useAuth()`。
2. 根据前文所述的 `shouldSkipAuth` 来动态决定是否通过拦截器，避免强制跳转到 `/login`。

### 文件 3: `src/pages/LoginPage.tsx` (假定)

修改点：
点击“体验模式”按钮时，触发 `loginAsGuest()`，然后执行页面跳转到编辑器 `/editor`。并且不弹出验证错误。

## 3. 验证方法

- **测试嵌入模式**：打开 ThingsPanel 并运行：确保 `/editor/xxxx?mode=embedded` 且没有 `token` 参数的情况下，iframe 内容不会跳转到 `login` 而是卡在纯白的底等价（或 loading），接着发送了 `tv:init` 之后，直接加载项目配置并且出现编辑器画布。完全无需登入账户。
- **测试体验模式**：通过独立 ThingsVis 前端页面 `localhost:5173/` 跳转登录页面。在登录页面点击“体验模式”。页面将不请求 API 的情形下转移至 `/editor`。新建的 Dashboard 可以保存在 localStroage 并恢复。
- **测试常规云端应用**：如果什么都不操作，直接访问 `/editor`，依然会跳转到 `/login`。如果提供正确的账户名密码就可以登录，并看到云端 Dashboard。退出后依然拦截 `editor` 到 `/login`。
