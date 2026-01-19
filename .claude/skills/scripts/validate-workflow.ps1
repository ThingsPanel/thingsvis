#!/usr/bin/env pwsh
# validate-workflow.ps1
# 验证工作流制品是否存在且一致

param(
    [Parameter(Mandatory=$true)]
    [string]$FeatureDir,
    
    [switch]$Strict
)

$errors = @()
$warnings = @()

# 检查必要文件
$requiredFiles = @(
    "spec.md",
    "plan.md", 
    "tasks.md"
)

foreach ($file in $requiredFiles) {
    $path = Join-Path $FeatureDir $file
    if (-not (Test-Path $path)) {
        $errors += "缺失必要文件: $file"
    }
}

# 检查 spec.md 必要章节
$specPath = Join-Path $FeatureDir "spec.md"
if (Test-Path $specPath) {
    $specContent = Get-Content $specPath -Raw
    
    $requiredSections = @(
        @{ Pattern = "## Overview|## 概述"; Name = "概述" },
        @{ Pattern = "## User Stories|## 用户故事"; Name = "用户故事" },
        @{ Pattern = "## Functional|## 功能需求"; Name = "功能需求" },
        @{ Pattern = "## Out of Scope|## 不做什么"; Name = "不做什么" }
    )
    
    foreach ($section in $requiredSections) {
        if ($specContent -notmatch $section.Pattern) {
            $warnings += "spec.md 缺少章节: $($section.Name)"
        }
    }
    
    # 检查 Mermaid 流程图
    if ($specContent -notmatch "``````mermaid") {
        $warnings += "spec.md 缺少 Mermaid 流程图"
    }
    
    # 检查验收标准
    if ($specContent -notmatch "Acceptance Criteria|验收标准") {
        $errors += "spec.md 缺少验收标准"
    }
}

# 检查 tasks.md 格式
$tasksPath = Join-Path $FeatureDir "tasks.md"
if (Test-Path $tasksPath) {
    $tasksContent = Get-Content $tasksPath -Raw
    
    # 检查任务格式
    if ($tasksContent -notmatch "- \[ \] T\d{3}") {
        $warnings += "tasks.md 任务格式可能不正确 (期望: - [ ] T001)"
    }
    
    # 统计任务进度
    $totalTasks = ([regex]::Matches($tasksContent, "- \[[ x]\] T\d{3}")).Count
    $completedTasks = ([regex]::Matches($tasksContent, "- \[x\] T\d{3}")).Count
    Write-Host "📊 任务进度: $completedTasks/$totalTasks 已完成" -ForegroundColor Cyan
}

# 输出结果
Write-Host "`n=== 工作流验证结果 ===" -ForegroundColor Cyan

if ($errors.Count -gt 0) {
    Write-Host "`n错误:" -ForegroundColor Red
    foreach ($error in $errors) {
        Write-Host "  ❌ $error" -ForegroundColor Red
    }
}

if ($warnings.Count -gt 0) {
    Write-Host "`n警告:" -ForegroundColor Yellow
    foreach ($warning in $warnings) {
        Write-Host "  ⚠️ $warning" -ForegroundColor Yellow
    }
}

if ($errors.Count -eq 0 -and $warnings.Count -eq 0) {
    Write-Host "`n✅ 所有检查通过!" -ForegroundColor Green
}

# 退出码
if ($Strict -and ($errors.Count -gt 0 -or $warnings.Count -gt 0)) {
    exit 1
} elseif ($errors.Count -gt 0) {
    exit 1
} else {
    exit 0
}
