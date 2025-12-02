#!/usr/bin/env bash
# Quick startup script for testing Gap Analysis

echo "🚀 AI Skill Gap Analyzer - Quick Start"
echo "======================================"
echo ""

# Check if running on Windows (Git Bash)
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    echo "📝 Windows detected. Running PowerShell commands..."
    echo ""
    echo "Step 1: Starting Backend Server..."
    echo "Command: cd Backend && python run_server.py"
    echo ""
    echo "Step 2: In another terminal, start Frontend Server..."
    echo "Command: cd Frontend && npm run dev"
    echo ""
    echo "Step 3: Test Direct Endpoint"
    echo "URL: http://localhost:8000/api/gap-analysis/3?role=Backend+Developer"
    echo ""
    echo "Step 4: Test Frontend"
    echo "URL: http://localhost:3000/gap-analysis"
    echo ""
else
    # Linux/Mac
    echo "Terminal 1 - Backend Server:"
    echo "cd Backend && python run_server.py"
    echo ""
    echo "Terminal 2 - Frontend Server:"
    echo "cd Frontend && npm run dev"
    echo ""
    echo "Then test:"
    echo "curl http://localhost:8000/api/gap-analysis/3?role=Backend+Developer"
    echo ""
fi

echo "📋 Checklist:"
echo "  ☐ Backend running on port 8000"
echo "  ☐ Frontend running on port 3000"
echo "  ☐ Direct endpoint returns JSON"
echo "  ☐ Frontend gap analysis page loads"
echo "  ☐ Console shows success logs"
echo ""
echo "✅ If all checks pass, Gap Analysis is working!"
