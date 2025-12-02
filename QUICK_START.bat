@echo off
REM Quick startup script for testing Gap Analysis on Windows

echo.
echo =========================================
echo  AI Skill Gap Analyzer - Quick Start
echo =========================================
echo.

echo Instructions:
echo.
echo Step 1: Open Terminal 1 and run Backend Server
echo   cd Backend
echo   python run_server.py
echo.
echo   Expected output:
echo   INFO:     Uvicorn running on http://127.0.0.1:8000
echo.

echo Step 2: Open Terminal 2 and run Frontend Server
echo   cd Frontend
echo   npm run dev
echo.
echo   Expected output:
echo   ▲ Next.js running on http://localhost:3000
echo.

echo Step 3: Test Direct Endpoint (in Browser)
echo   URL: http://localhost:8000/api/gap-analysis/3?role=Backend+Developer
echo   Expected: JSON response with gap analysis data
echo.

echo Step 4: Test Frontend (in Browser)
echo   URL: http://localhost:3000/gap-analysis
echo   Expected: Gap analysis page with data loaded
echo.

echo Verification Checklist:
echo   [ ] Backend server started on http://localhost:8000
echo   [ ] Frontend server started on http://localhost:3000
echo   [ ] Direct endpoint returns JSON (200 status)
echo   [ ] Gap analysis page loads successfully
echo   [ ] Browser console shows success logs:
echo       - "🔍 Candidate ID: 3 Type: number"
echo       - "📡 Fetching gap analysis from: http://..."
echo       - "📊 Response status: 200"
echo       - "✅ Gap analysis data received: {...}"
echo.
echo If all checks pass, the Gap Analysis is working!
echo.
echo For troubleshooting, see: GAP_ANALYSIS_FAILED_TO_FETCH_FIX.md
echo.
pause
