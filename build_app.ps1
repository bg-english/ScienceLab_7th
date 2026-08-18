# ============================================================
# SciLab — Build & Sync Script (Windows PowerShell)
# Copies the student/teacher apps into a synced project folder,
# mirroring the Future_and_conditionals repo convention.
# ============================================================
param(
  [string]$ProjectRoot = "C:\BOSTON FLEX\SCIENCE PROJECTS",
  [string]$SyncFolder  = "Science_7th_Project"
)

$student = Join-Path $ProjectRoot "index.html"
$teacher = Join-Path $ProjectRoot "teacher.html"
$syncDir = Join-Path $ProjectRoot $SyncFolder

if (-not (Test-Path -LiteralPath $student)) { throw "index.html not found in $ProjectRoot" }
if (-not (Test-Path -LiteralPath $teacher)) { throw "teacher.html not found in $ProjectRoot" }

New-Item -ItemType Directory -Force -Path $syncDir | Out-Null
Copy-Item -LiteralPath $student -Destination (Join-Path $syncDir "index.html") -Force
Copy-Item -LiteralPath $teacher -Destination (Join-Path $syncDir "teacher.html") -Force

Write-Host "Done! Files synced to: $syncDir"