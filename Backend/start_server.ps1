# Start the FastAPI Backend Server
$env:PYTHONIOENCODING = 'utf-8'
cd "c:\Users\prana\Downloads\AI Skill Gap Analyzer\Backend"
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
