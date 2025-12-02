Write-Host "🗑️  Starting Project Cleanup..." -ForegroundColor Cyan

# Delete virtual environments
Write-Host "Removing virtual environments..." -ForegroundColor Yellow
Remove-Item -Path "CompleteModelwithBackend\.venv" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "Backend\.venv" -Recurse -Force -ErrorAction SilentlyContinue

# Delete markdown docs
Write-Host "Removing documentation MD files..." -ForegroundColor Yellow
Remove-Item -Path "API_INTEGRATION_COMPLETE.md" -Force -ErrorAction SilentlyContinue
Remove-Item -Path "API_USAGE_GUIDE.md" -Force -ErrorAction SilentlyContinue
Remove-Item -Path "BACKEND_VERIFICATION_COMPLETE.md" -Force -ErrorAction SilentlyContinue
Remove-Item -Path "BUTTON_CHANGES_BEFORE_AFTER.md" -Force -ErrorAction SilentlyContinue

# Delete Frontend artifacts
Write-Host "Cleaning Frontend..." -ForegroundColor Yellow
if (Test-Path "Frontend") {
    Remove-Item -Path "Frontend\.next" -Recurse -Force -ErrorAction SilentlyContinue
    Remove-Item -Path "Frontend\.turbo" -Recurse -Force -ErrorAction SilentlyContinue
    Remove-Item -Path "Frontend\.cache" -Recurse -Force -ErrorAction SilentlyContinue
}

# Delete Python cache
Write-Host "Cleaning Python cache..." -ForegroundColor Yellow
Get-ChildItem -Path . -Directory -Filter "__pycache__" -Recurse | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
Get-ChildItem -Path . -File -Filter "*.pyc" -Recurse | Remove-Item -Force -ErrorAction SilentlyContinue
Get-ChildItem -Path . -File -Filter "*.pyo" -Recurse | Remove-Item -Force -ErrorAction SilentlyContinue

# Delete OS files
Write-Host "Removing OS-specific files..." -ForegroundColor Yellow
Get-ChildItem -Path . -File -Filter ".DS_Store" -Recurse | Remove-Item -Force -ErrorAction SilentlyContinue
Get-ChildItem -Path . -File -Filter "Thumbs.db" -Recurse | Remove-Item -Force -ErrorAction SilentlyContinue
Get-ChildItem -Path . -File -Filter "desktop.ini" -Recurse | Remove-Item -Force -ErrorAction SilentlyContinue

# Delete logs
Write-Host "Removing log files..." -ForegroundColor Yellow
Get-ChildItem -Path . -File -Filter "*.log" -Recurse | Remove-Item -Force -ErrorAction SilentlyContinue

# Delete temp files
Write-Host "Removing temporary files..." -ForegroundColor Yellow
Get-ChildItem -Path . -File -Filter "*.tmp" -Recurse | Remove-Item -Force -ErrorAction SilentlyContinue
Get-ChildItem -Path . -File -Filter "*.temp" -Recurse | Remove-Item -Force -ErrorAction SilentlyContinue

Write-Host "✅ Cleanup complete!" -ForegroundColor Green
