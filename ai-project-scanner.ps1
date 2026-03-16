param(
  [string]$ProjectRoot = "C:\apps\tools-isp"
)

$ErrorActionPreference = "SilentlyContinue"

function Add-Section {
  param(
    [string]$Title,
    [string]$OutFile
  )
  "" | Out-File $OutFile -Append -Encoding UTF8
  ("=" * 30 + " " + $Title + " " + "=" * 30) | Out-File $OutFile -Append -Encoding UTF8
}

function Write-Lines {
  param(
    [string[]]$Lines,
    [string]$OutFile
  )
  if ($null -ne $Lines) {
    $Lines | Out-File $OutFile -Append -Encoding UTF8
  }
}

function Safe-Exec {
  param(
    [scriptblock]$Block
  )
  try { & $Block } catch { $_ | Out-String }
}

if (-not (Test-Path $ProjectRoot)) {
  Write-Host "Project path not found: $ProjectRoot"
  exit 1
}

$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$desktop = [Environment]::GetFolderPath("Desktop")
$outFile = Join-Path $desktop "tools-isp-ai-scanner-$stamp.txt"

"TOOLS-ISP AI SCANNER REPORT" | Out-File $outFile -Encoding UTF8
"Generated: $(Get-Date)" | Out-File $outFile -Append -Encoding UTF8
"ProjectRoot: $ProjectRoot" | Out-File $outFile -Append -Encoding UTF8

Set-Location $ProjectRoot

Add-Section "PROJECT SUMMARY" $outFile
Write-Lines @(
  "Current Directory: $(Get-Location)",
  "Git Branch: $(git branch --show-current)",
  "Git Commit: $(git rev-parse --short HEAD)"
) $outFile

Add-Section "GIT STATUS" $outFile
Safe-Exec { git status } | Out-File $outFile -Append -Encoding UTF8

Add-Section "GIT LOG LAST 40" $outFile
Safe-Exec { git log --oneline --decorate -n 40 } | Out-File $outFile -Append -Encoding UTF8

Add-Section "TOP-LEVEL TREE" $outFile
Get-ChildItem $ProjectRoot | Select-Object Mode,LastWriteTime,Length,Name | Format-Table -AutoSize | Out-String | Out-File $outFile -Append -Encoding UTF8

Add-Section "IMPORTANT PATHS" $outFile
$importantPaths = @(
  "$ProjectRoot\frontend",
  "$ProjectRoot\frontend\src",
  "$ProjectRoot\frontend\src\layout",
  "$ProjectRoot\frontend\src\pages",
  "$ProjectRoot\frontend\src\components",
  "$ProjectRoot\frontend\src\workspace",
  "$ProjectRoot\backend",
  "$ProjectRoot\backend\data",
  "$ProjectRoot\backend\routes",
  "$ProjectRoot\backend\auth"
)
foreach ($p in $importantPaths) {
  if (Test-Path $p) {
    "PATH: $p" | Out-File $outFile -Append -Encoding UTF8
  }
}

Add-Section "FILE COUNTS" $outFile
$allFiles = Get-ChildItem $ProjectRoot -Recurse -File | Where-Object {
  $_.FullName -notmatch "\\node_modules\\" -and
  $_.FullName -notmatch "\\dist\\" -and
  $_.FullName -notmatch "\\build\\" -and
  $_.FullName -notmatch "\\.git\\"
}
$allFiles.Count | ForEach-Object { "Total files scanned: $_" } | Out-File $outFile -Append -Encoding UTF8
$allFiles | Group-Object Extension | Sort-Object Count -Descending | Select-Object Count,Name | Format-Table -AutoSize | Out-String | Out-File $outFile -Append -Encoding UTF8

Add-Section "LARGEST FILES TOP 80" $outFile
$allFiles | Sort-Object Length -Descending | Select-Object -First 80 FullName,Length,LastWriteTime | Format-Table -AutoSize | Out-String | Out-File $outFile -Append -Encoding UTF8

Add-Section "BACKUP / BAK FILES" $outFile
$bakFiles = $allFiles | Where-Object { $_.Name -match "\.bak|backup|BROKEN|STABLE|phase|clean|fix|autoscaling" }
"Backup-like files count: $($bakFiles.Count)" | Out-File $outFile -Append -Encoding UTF8
$bakFiles | Select-Object -First 300 FullName | Format-Table -HideTableHeaders | Out-String | Out-File $outFile -Append -Encoding UTF8

Add-Section "PACKAGE FILES" $outFile
Get-ChildItem $ProjectRoot -Recurse -File -Include package.json,package-lock.json,pm2*.cjs,vite.config.*,*.ps1,*.cmd |
Where-Object {
  $_.FullName -notmatch "\\node_modules\\" -and
  $_.FullName -notmatch "\\dist\\" -and
  $_.FullName -notmatch "\\build\\"
} | ForEach-Object {
  "FILE: $($_.FullName)" | Out-File $outFile -Append -Encoding UTF8
  Get-Content $_.FullName | Out-File $outFile -Append -Encoding UTF8
  "" | Out-File $outFile -Append -Encoding UTF8
}

Add-Section "RESPONSIVE / LAYOUT HOTSPOTS" $outFile
$patterns = @(
  'viewport',
  '@media',
  'max-width',
  'min-width',
  'width:\s*\d+px',
  'height:\s*\d+px',
  '100vw',
  '100vh',
  'overflow:\s*hidden',
  'overflow-x',
  'overflow-y',
  'position:\s*fixed',
  'position:\s*absolute',
  'position:\s*sticky',
  'transform:\s*scale',
  'grid-template-columns',
  'gridTemplateColumns',
  'grid-template-rows',
  'display:\s*grid',
  'display:\s*flex',
  'flex:0 0',
  'minmax\(',
  'auto-fit',
  'auto-fill',
  'Sidebar',
  'sidebar',
  'AppShell',
  'Topbar',
  'Layout',
  'layout',
  'Dashboard',
  'Topology',
  'NetworkMap',
  'window.innerWidth',
  'window.innerHeight'
)

$scanFiles = Get-ChildItem "$ProjectRoot\frontend" -Recurse -File -Include *.html,*.css,*.scss,*.js,*.jsx,*.ts,*.tsx |
Where-Object {
  $_.FullName -notmatch "\\node_modules\\" -and
  $_.FullName -notmatch "\\dist\\" -and
  $_.FullName -notmatch "\\build\\"
}

foreach ($f in $scanFiles) {
  foreach ($p in $patterns) {
    Select-String -Path $f.FullName -Pattern $p | ForEach-Object {
      "Pattern: $p" | Out-File $outFile -Append -Encoding UTF8
      "File   : $($_.Path)" | Out-File $outFile -Append -Encoding UTF8
      "Line   : $($_.LineNumber)" | Out-File $outFile -Append -Encoding UTF8
      "Code   : $($_.Line.Trim())" | Out-File $outFile -Append -Encoding UTF8
      "" | Out-File $outFile -Append -Encoding UTF8
    }
  }
}

Add-Section "API / BACKEND HOTSPOTS" $outFile
$apiPatterns = @(
  'express',
  'router\.',
  'app\.',
  '/api/',
  'fetch\(',
  'axios',
  'socket',
  'websocket',
  'ws',
  'history',
  'snapshot',
  'topology',
  'uplink',
  'ping',
  'weather',
  'auth',
  'login'
)

$backendFiles = Get-ChildItem $ProjectRoot -Recurse -File -Include *.js,*.jsx,*.ts,*.tsx,*.json |
Where-Object {
  $_.FullName -notmatch "\\node_modules\\" -and
  $_.FullName -notmatch "\\dist\\" -and
  $_.FullName -notmatch "\\build\\" -and
  $_.FullName -notmatch "\\.git\\"
}

foreach ($f in $backendFiles) {
  foreach ($p in $apiPatterns) {
    Select-String -Path $f.FullName -Pattern $p | ForEach-Object {
      "Pattern: $p" | Out-File $outFile -Append -Encoding UTF8
      "File   : $($_.Path)" | Out-File $outFile -Append -Encoding UTF8
      "Line   : $($_.LineNumber)" | Out-File $outFile -Append -Encoding UTF8
      "Code   : $($_.Line.Trim())" | Out-File $outFile -Append -Encoding UTF8
      "" | Out-File $outFile -Append -Encoding UTF8
    }
  }
}

Add-Section "FULL CONTENT OF CORE FRONTEND FILES" $outFile
$coreFrontend = Get-ChildItem "$ProjectRoot\frontend\src" -Recurse -File -Include *.css,*.scss,*.js,*.jsx,*.ts,*.tsx |
Where-Object {
  $_.Name -match 'App|Layout|Sidebar|Topbar|Shell|NetworkMap|Topology|Dashboard|Page|index|workspace'
}
foreach ($f in $coreFrontend) {
  "===== FILE: $($f.FullName) =====" | Out-File $outFile -Append -Encoding UTF8
  Get-Content $f.FullName | Out-File $outFile -Append -Encoding UTF8
  "" | Out-File $outFile -Append -Encoding UTF8
  "" | Out-File $outFile -Append -Encoding UTF8
}

Add-Section "FULL CONTENT OF CORE BACKEND FILES" $outFile
$coreBackend = Get-ChildItem "$ProjectRoot\backend" -Recurse -File -Include *.js,*.json,*.ps1 |
Where-Object {
  $_.FullName -notmatch "\\node_modules\\" -and
  $_.Name -match 'server|app|index|route|auth|topology|history|uplink|ping|weather|snapshot'
}
foreach ($f in $coreBackend) {
  "===== FILE: $($f.FullName) =====" | Out-File $outFile -Append -Encoding UTF8
  Get-Content $f.FullName | Out-File $outFile -Append -Encoding UTF8
  "" | Out-File $outFile -Append -Encoding UTF8
  "" | Out-File $outFile -Append -Encoding UTF8
}

Add-Section "RUNTIME / DATA FILES" $outFile
Get-ChildItem "$ProjectRoot\backend\data" -Recurse -File |
Select-Object FullName,Length,LastWriteTime | Format-Table -AutoSize | Out-String | Out-File $outFile -Append -Encoding UTF8

Add-Section "LIKELY RISK MARKERS" $outFile
$riskPatterns = @(
  'uplink-history\.json',
  'min-width:\s*420px',
  'gridTemplateColumns:\s*".*220px',
  'gridTemplateColumns:\s*".*260px',
  'max-width:\s*1280px',
  'flex:0 0',
  'overflow:hidden',
  'position:absolute',
  'scale\(',
  '100vh',
  'min-height:\s*100vh'
)
foreach ($f in $allFiles | Where-Object { $_.Extension -match '\.css|\.scss|\.js|\.jsx|\.ts|\.tsx|\.json' }) {
  foreach ($p in $riskPatterns) {
    Select-String -Path $f.FullName -Pattern $p | ForEach-Object {
      "RiskPattern: $p" | Out-File $outFile -Append -Encoding UTF8
      "File       : $($_.Path)" | Out-File $outFile -Append -Encoding UTF8
      "Line       : $($_.LineNumber)" | Out-File $outFile -Append -Encoding UTF8
      "Code       : $($_.Line.Trim())" | Out-File $outFile -Append -Encoding UTF8
      "" | Out-File $outFile -Append -Encoding UTF8
    }
  }
}

Add-Section "DONE" $outFile
"Report created at: $outFile" | Out-File $outFile -Append -Encoding UTF8

Write-Host ""
Write-Host "AI scanner finished."
Write-Host "Report: $outFile"
