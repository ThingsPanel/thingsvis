# ThingsVis Server 初始化脚本
# 用于首次启动或修复数据库问题

Write-Host "🚀 ThingsVis Server 初始化..." -ForegroundColor Green

# 1. 停止现有进程（如果有）
Write-Host "`n1️⃣  检查并停止现有进程..." -ForegroundColor Yellow
$processes = Get-Process | Where-Object {$_.ProcessName -eq "node" -and $_.MainWindowTitle -like "*server*"}
if ($processes) {
    $processes | ForEach-Object { Stop-Process -Id $_.Id -Force }
    Write-Host "✅ 已停止现有进程" -ForegroundColor Green
} else {
    Write-Host "✅ 无需停止进程" -ForegroundColor Green
}

# 2. 清理Prisma临时文件
Write-Host "`n2️⃣  清理Prisma临时文件..." -ForegroundColor Yellow
$prismaTemp = "..\..\node_modules\.pnpm\@prisma+client*\node_modules\.prisma\client\query_engine-windows.dll.node.tmp*"
Remove-Item -Path $prismaTemp -Force -ErrorAction SilentlyContinue
Write-Host "✅ 临时文件已清理" -ForegroundColor Green

# 3. 生成Prisma Client
Write-Host "`n3️⃣  生成Prisma Client..." -ForegroundColor Yellow
try {
    pnpm prisma generate
    Write-Host "✅ Prisma Client生成成功" -ForegroundColor Green
} catch {
    Write-Host "❌ Prisma Client生成失败: $_" -ForegroundColor Red
    exit 1
}

# 4. 推送Schema到数据库
Write-Host "`n4️⃣  推送Schema到数据库..." -ForegroundColor Yellow
try {
    pnpm prisma db push --accept-data-loss
    Write-Host "✅ 数据库Schema推送成功" -ForegroundColor Green
} catch {
    Write-Host "❌ Schema推送失败: $_" -ForegroundColor Red
    exit 1
}

# 5. 检查数据库文件
Write-Host "`n5️⃣  检查数据库文件..." -ForegroundColor Yellow
$dbPath = "prisma\dev.db"
if (Test-Path $dbPath) {
    $dbSize = (Get-Item $dbPath).Length
    Write-Host "✅ 数据库文件存在 (大小: $dbSize bytes)" -ForegroundColor Green
} else {
    Write-Host "❌ 数据库文件不存在" -ForegroundColor Red
    exit 1
}

Write-Host "`n🎉 初始化完成!" -ForegroundColor Green
Write-Host "`n下一步:" -ForegroundColor Cyan
Write-Host "  1. 运行种子脚本创建测试用户: pnpm run seed" -ForegroundColor White
Write-Host "  2. 启动server: pnpm run dev" -ForegroundColor White
Write-Host "  3. 或从根目录运行: pnpm dev:all" -ForegroundColor White
