# Remove console.log statements from production code
# Skips lines in comments (// or *)

$files = @(
    'apps/studio/src/strategies/WidgetModeStrategy.ts',
    'apps/studio/src/strategies/AppModeStrategy.ts',
    'apps/studio/src/hooks/useEditorStrategy.ts',
    'apps/studio/src/embed/message-router.ts',
    'apps/studio/src/components/EditorShell.tsx',
    'apps/studio/src/components/Editor.tsx',
    'packages/thingsvis-kernel/src/datasources/PlatformFieldAdapter.ts',
    'apps/server/src/app/api/v1/auth/sso/route.ts'
)

$root = 'f:\coding\thingsvis'
$total = 0

foreach ($relPath in $files) {
    $fullPath = Join-Path $root $relPath
    if (-not (Test-Path $fullPath)) { 
        Write-Host "SKIP (not found): $relPath"
        continue 
    }
    
    $lines = Get-Content $fullPath
    $newLines = [System.Collections.ArrayList]@()
    $removed = 0
    $skipNext = $false
    
    for ($i = 0; $i -lt $lines.Count; $i++) {
        $line = $lines[$i]
        $trimmed = $line.TrimStart()
        
        # Skip lines that are console.log statements (not in comments)
        if ($trimmed.StartsWith('console.log(') -and -not $trimmed.StartsWith('//') -and -not $trimmed.StartsWith('*')) {
            $removed++
            
            # Handle multi-line console.log (check if line ends without closing)
            if (-not $line.Contains(')')) {
                $skipNext = $true
            }
            continue
        }
        
        # Skip continuation lines of multi-line console.log
        if ($skipNext) {
            if ($line.Contains(')')) {
                $skipNext = $false
            }
            $removed++
            continue
        }
        
        [void]$newLines.Add($line)
    }
    
    if ($removed -gt 0) {
        $newLines | Set-Content $fullPath -Encoding UTF8
        Write-Host "Cleaned $removed console.log lines from: $relPath"
        $total += $removed
    } else {
        Write-Host "No console.log found in: $relPath"
    }
}

Write-Host "`nTotal removed: $total lines"
