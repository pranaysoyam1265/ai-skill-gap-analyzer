Write-Host "🗑️  GitHub Preparation Cleanup..." -ForegroundColor Cyan

# 1. DELETE VIRTUAL ENVIRONMENTS
Write-Host "`n[1/6] Removing virtual environments..." -ForegroundColor Yellow
Remove-Item -Path "CompleteModelwithBackend\.venv" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "venv" -Recurse -Force -ErrorAction SilentlyContinue

# 2. DELETE .ENV FILES (with credentials)
Write-Host "[2/6] Removing .env files with credentials..." -ForegroundColor Yellow
Remove-Item -Path "Backend\.env" -Force -ErrorAction SilentlyContinue
Remove-Item -Path "Frontend\.env.local" -Force -ErrorAction SilentlyContinue

# 3. DELETE TEST/FIX SCRIPTS IN BACKEND
Write-Host "[3/6] Cleaning Backend test/fix scripts..." -ForegroundColor Yellow
$backendScripts = @(
    "Backend\add_test_data.py",
    "Backend\check_candidates.py",
    "Backend\check_db_tables.py",
    "Backend\check_json_data.py",
    "Backend\check_real_candidates.py",
    "Backend\check_schema.py",
    "Backend\create_test_data.py",
    "Backend\create_test_data_fixed.py",
    "Backend\final_candidate_fix.py",
    "Backend\fix_db_sync.py",
    "Backend\fix_everything.py",
    "Backend\fix_foreign_key_constraint.py",
    "Backend\initialize_db.py",
    "Backend\initialize_market_data.py",
    "Backend\initialize_trends.py",
    "Backend\load_data.py",
    "Backend\load_market_data.py",
    "Backend\populate_48_skills.py",
    "Backend\reset_db.py",
    "Backend\run_complete_fix.py",
    "Backend\run_fix.py",
    "Backend\setup.py",
    "Backend\setup_role_requirements.py",
    "Backend\verify_trends_fix.py"
)

foreach ($script in $backendScripts) {
    Remove-Item -Path $script -Force -ErrorAction SilentlyContinue
}

# Delete all test_*.py files
Get-ChildItem -Path "Backend" -Filter "test_*.py" -Recurse -ErrorAction SilentlyContinue | Remove-Item -Force -ErrorAction SilentlyContinue

# 4. DELETE ROOT TEST FILES
Write-Host "[4/6] Cleaning root test files..." -ForegroundColor Yellow
$rootTestFiles = @(
    "test_bullets.txt",
    "test_integration.ps1",
    "test_minimal.txt",
    "test_paragraph.txt",
    "test_resume.txt",
    "count_skills.py",
    "generate",
    "generate_complete_market_data",
    "generate_complete_market_data.py",
    "generate_tree.py",
    "project_diagnostic.py",
    "DASHBOARD_FIX_SUMMARY.md",
    "task_progress.md",
    "diagnostic_report_*.txt"
)

foreach ($file in $rootTestFiles) {
    Remove-Item -Path $file -Force -Recurse -ErrorAction SilentlyContinue
}

# 5. DELETE DUPLICATE FOLDERS
Write-Host "[5/6] Removing duplicate folders..." -ForegroundColor Yellow
Remove-Item -Path "app" -Recurse -Force -ErrorAction SilentlyContinue

# 6. DELETE CACHE/BUILD FILES
Write-Host "[6/6] Cleaning cache and build artifacts..." -ForegroundColor Yellow
Get-ChildItem -Path . -Directory -Filter "__pycache__" -Recurse | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
Get-ChildItem -Path . -File -Filter "*.pyc" -Recurse | Remove-Item -Force -ErrorAction SilentlyContinue

Write-Host "`n✅ Cleanup complete! Checking remaining issues..." -ForegroundColor Green

# List remaining sensitive files
Write-Host "`n📋 Checking for remaining issues:" -ForegroundColor Cyan
$hasIssues = $false
if (Test-Path "Backend\.env") { 
    Write-Host "  ⚠️  Backend\.env still exists!" -ForegroundColor Red
    $hasIssues = $true
}
if (Test-Path "Frontend\.env.local") { 
    Write-Host "  ⚠️  Frontend\.env.local still exists!" -ForegroundColor Red
    $hasIssues = $true
}
if (Test-Path "venv") { 
    Write-Host "  ⚠️  venv folder still exists!" -ForegroundColor Red
    $hasIssues = $true
}
if (Test-Path "CompleteModelwithBackend\.venv") { 
    Write-Host "  ⚠️  CompleteModelwithBackend\.venv still exists!" -ForegroundColor Red
    $hasIssues = $true
}

if (-not $hasIssues) {
    Write-Host "  ✅ No sensitive files detected!" -ForegroundColor Green
}

Write-Host "`n📊 Final directory size:" -ForegroundColor Cyan
$size = (Get-ChildItem -Path . -Recurse -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum / 1MB
Write-Host "  $([math]::Round($size, 2)) MB" -ForegroundColor White

Write-Host "`n✅ GitHub prep cleanup complete!" -ForegroundColor Green
Write-Host "Next steps: Create .gitignore, README.md, and .env.example files" -ForegroundColor Cyan
